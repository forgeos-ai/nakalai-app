import { useCallback, useMemo, useState } from 'react';
import ControlPanel from './components/ControlPanel';
import PaperSheet from './components/PaperSheet';
import {
  INK_COLORS,
  PAPER_TYPES,
  DEFAULT_TEXT,
  getFontStyleByClass,
  DEFAULT_HANDWRITING_FONT_CLASS,
} from './constants';
import { getCheckoutQuote } from './billing';
import {
  isMockPaymentPaid,
  toggleMockPayment,
  invalidatePaidSessionForContentChange,
} from './paymentGateway';
import { syncLocalPaymentStatus } from './studentProfile';
import {
  setMatchedStyleOverrides,
  clearMatchedStyleOverrides,
  type MatchedStyleOverrides,
} from './pageGeometry';
import { clearJitterCache } from './jitter';
import {
  matchedFonts,
  googleFontNameForClass,
} from './utils/styleExtractor';

export default function App() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [inkColor, setInkColor] = useState(INK_COLORS[0]);
  const [paperType, setPaperType] = useState(PAPER_TYPES[0]);
  /** Active handwriting family — dropdown + Match My Style both write here. */
  const [fontStyle, setFontStyle] = useState(() =>
    matchedFonts[DEFAULT_HANDWRITING_FONT_CLASS] ??
    getFontStyleByClass(DEFAULT_HANDWRITING_FONT_CLASS),
  );
  /** Exact Google Fonts family name (e.g. "Covered By Your Grace"). */
  const [activeFontFamily, setActiveFontFamily] = useState(
    () => googleFontNameForClass(DEFAULT_HANDWRITING_FONT_CLASS),
  );
  const [isPaid, setIsPaid] = useState(() => isMockPaymentPaid());
  const [matchedStyles, setMatchedStyles] = useState<MatchedStyleOverrides | null>(
    null,
  );
  /** Bumps when a new photo resolves so A4 pages remount with fresh ink/slant. */
  const [styleRevision, setStyleRevision] = useState(0);

  const checkoutQuote = useMemo(
    () => getCheckoutQuote(Boolean(matchedStyles)),
    [matchedStyles],
  );

  /**
   * If the assignment content changes while Paid, void the download pass:
   * unpaid + clear tokens + watermark returns immediately.
   */
  const voidPaidPassIfNeeded = useCallback(() => {
    const receipt = invalidatePaidSessionForContentChange(Boolean(matchedStyles));
    if (!receipt) return false;
    syncLocalPaymentStatus(false, receipt);
    setIsPaid(false);
    return true;
  }, [matchedStyles]);

  const handleTextChange = useCallback(
    (value: string) => {
      if (isPaid && value !== text) {
        voidPaidPassIfNeeded();
      }
      setText(value);
    },
    [isPaid, text, voidPaidPassIfNeeded],
  );

  const handleTogglePayment = () => {
    const { isPaid: next, receipt } = toggleMockPayment(Boolean(matchedStyles));
    syncLocalPaymentStatus(next, receipt);
    setIsPaid(next);
  };

  /** Sidebar premium checkout success — unlock watermark + PDF (ledger already synced in hook). */
  const handlePaymentSuccess = useCallback(() => {
    setIsPaid(true);
  }, []);

  /** Dropdown can still override; Match My Style also writes fontStyle. */
  const handleFontStyleChange = useCallback((next: typeof fontStyle) => {
    const matched = matchedFonts[next.id] ?? next;
    setFontStyle(matched);
    setActiveFontFamily(googleFontNameForClass(matched.id));
  }, []);

  /**
   * Match My Style success — map extracted fontClass through matchedFonts
   * using exact Google Font names for canvas ctx.font.
   */
  const handleMatchedStyle = (style: MatchedStyleOverrides | null) => {
    clearJitterCache();
    if (style) {
      const matched =
        matchedFonts[style.fontClass] ?? getFontStyleByClass(style.fontClass);
      const familyName = googleFontNameForClass(matched.id);

      setMatchedStyleOverrides(style);
      setMatchedStyles({ ...style });
      setInkColor({
        id: 'matched',
        label: 'Matched Ink',
        hex: style.inkHex,
      });
      setFontStyle({ ...matched, fontFamily: familyName });
      setActiveFontFamily(familyName);
      setStyleRevision((r) => r + 1);
    } else {
      clearMatchedStyleOverrides();
      setMatchedStyles(null);
      setInkColor(INK_COLORS[0]);
      setStyleRevision((r) => r + 1);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 font-sans">
      <div className="h-full w-full md:w-2/5">
        <ControlPanel
          text={text}
          onTextChange={handleTextChange}
          onPaidSessionInvalidate={voidPaidPassIfNeeded}
          inkColor={inkColor}
          onInkColorChange={(c) => {
            setInkColor(c);
            if (matchedStyles) {
              const next = { ...matchedStyles, inkHex: c.hex };
              setMatchedStyleOverrides(next);
              setMatchedStyles(next);
              setStyleRevision((r) => r + 1);
            }
          }}
          paperType={paperType}
          onPaperTypeChange={setPaperType}
          fontStyle={fontStyle}
          onFontStyleChange={handleFontStyleChange}
          isPaid={isPaid}
          matchedStyle={matchedStyles}
          onMatchedStyleChange={handleMatchedStyle}
          checkoutQuote={checkoutQuote}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </div>
      <div className="h-full w-full md:w-3/5">
        <PaperSheet
          key={`sheet-${styleRevision}-${activeFontFamily}-${paperType.id}-${matchedStyles?.inkHex ?? 'ink'}`}
          text={text}
          inkColor={inkColor}
          paperType={paperType}
          fontStyle={fontStyle}
          isPaid={isPaid}
          onTogglePayment={handleTogglePayment}
          matchedStyle={matchedStyles}
          checkoutQuote={checkoutQuote}
        />
      </div>
    </div>
  );
}
