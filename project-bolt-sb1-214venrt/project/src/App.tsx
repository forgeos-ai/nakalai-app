'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ControlPanel from './components/ControlPanel';
import PaperSheet from './components/PaperSheet';
import {
  INK_COLORS,
  PAPER_TYPES,
  DEFAULT_TEXT,
  getFontStyleByClass,
  DEFAULT_HANDWRITING_FONT_CLASS,
  type InkColor,
} from './constants';
import {
  quoteFromPackage,
  resolveDefaultPackageId,
  getPricingPackageById,
  PRICING_PACKAGES,
} from './billing';
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
import { clearCustomStyleMap } from './utils/customStyleMap';
import {
  matchedFonts,
  googleFontNameForClass,
} from './utils/styleExtractor';
import { paginateText } from './pagination';

export type WorkspacePreset = {
  text?: string;
  inkId?: string;
  paperId?: string;
};

type AppProps = {
  /** When true, fill parent instead of locking to the viewport (SEO landings). */
  embedded?: boolean;
  /** Pre-load editor text / ink / paper from seoKeywords matrix. */
  workspacePreset?: WorkspacePreset;
};

type MobileShellTab = 'edit' | 'preview';

function resolveInk(inkId?: string) {
  return INK_COLORS.find((c) => c.id === inkId) ?? INK_COLORS[0];
}

function resolvePaper(paperId?: string) {
  return PAPER_TYPES.find((p) => p.id === paperId) ?? PAPER_TYPES[0];
}

export default function App({ embedded = false, workspacePreset }: AppProps) {
  const [text, setText] = useState(
    () => workspacePreset?.text?.trim() || DEFAULT_TEXT,
  );
  const [inkColor, setInkColor] = useState(() =>
    resolveInk(workspacePreset?.inkId),
  );
  const [paperType, setPaperType] = useState(() =>
    resolvePaper(workspacePreset?.paperId),
  );
  /**
   * Active handwriting family — set ONLY by Match My Style image analysis
   * (or default until the first upload).
   */
  const [fontStyle, setFontStyle] = useState(() =>
    matchedFonts[DEFAULT_HANDWRITING_FONT_CLASS] ??
    getFontStyleByClass(DEFAULT_HANDWRITING_FONT_CLASS),
  );
  /** Exact Google Fonts family from image match metadata. */
  const [activeFontFamily, setActiveFontFamily] = useState(
    () => googleFontNameForClass(DEFAULT_HANDWRITING_FONT_CLASS),
  );
  const [isPaid, setIsPaid] = useState(() => isMockPaymentPaid());
  const [matchedStyles, setMatchedStyles] = useState<MatchedStyleOverrides | null>(
    null,
  );
  /** Bumps when a new photo resolves so A4 pages remount with fresh ink/slant. */
  const [styleRevision, setStyleRevision] = useState(0);
  /** Mobile-only Edit Text / Preview Page toggle — zero desktop impact. */
  const [activeMobileTab, setActiveMobileTab] =
    useState<MobileShellTab>('edit');

  const layoutPageCount = useMemo(() => {
    if (typeof document === 'undefined') return 1;
    return Math.max(1, paginateText(text, fontStyle).length);
  }, [text, fontStyle]);

  const [selectedPackageId, setSelectedPackageId] = useState(() =>
    resolveDefaultPackageId(false, 1),
  );

  // Keep selection aligned with Match My Style + layout length; upgrade to 75 when needed.
  useEffect(() => {
    const nextId = resolveDefaultPackageId(
      Boolean(matchedStyles),
      layoutPageCount,
    );
    setSelectedPackageId((prev) => {
      const prevPkg = getPricingPackageById(prev);
      const nextPkg = getPricingPackageById(nextId);
      if (layoutPageCount > 10 && prevPkg.pages === 10) return nextId;
      if (prevPkg.engine !== nextPkg.engine && prevPkg.pages === nextPkg.pages) {
        return nextId;
      }
      if (!PRICING_PACKAGES.some((p) => p.id === prev)) return nextId;
      return prev;
    });
  }, [matchedStyles, layoutPageCount]);

  const selectedPackage = useMemo(
    () => getPricingPackageById(selectedPackageId),
    [selectedPackageId],
  );

  const checkoutQuote = useMemo(
    () => quoteFromPackage(selectedPackage),
    [selectedPackage],
  );

  /**
   * If the assignment content changes while Paid, void the download pass:
   * unpaid + clear tokens + watermark returns immediately.
   */
  const voidPaidPassIfNeeded = useCallback(() => {
    const receipt = invalidatePaidSessionForContentChange(
      Boolean(matchedStyles),
      layoutPageCount,
    );
    if (!receipt) return false;
    syncLocalPaymentStatus(false, receipt);
    setIsPaid(false);
    return true;
  }, [matchedStyles, layoutPageCount]);

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
    const { isPaid: next, receipt } = toggleMockPayment(selectedPackageId);
    syncLocalPaymentStatus(next, receipt);
    setIsPaid(next);
  };

  /** Sidebar premium checkout success — unlock watermark + PDF (ledger already synced in hook). */
  const handlePaymentSuccess = useCallback(() => {
    setIsPaid(true);
  }, []);

  const handleInkColorChange = useCallback(
    (c: InkColor) => {
      setInkColor(c);
      if (matchedStyles) {
        const next = { ...matchedStyles, inkHex: c.hex };
        setMatchedStyleOverrides(next);
        setMatchedStyles(next);
        setStyleRevision((r) => r + 1);
      }
    },
    [matchedStyles],
  );

  /**
   * Match My Style success — automatically binds canvas font family matrix
   * from image analysis (fontClass → Google Font name). No manual style pick.
   */
  const handleMatchedStyle = (style: MatchedStyleOverrides | null) => {
    clearJitterCache();
    if (style) {
      const matched =
        matchedFonts[style.fontClass] ?? getFontStyleByClass(style.fontClass);
      const familyName =
        googleFontNameForClass(matched.id) ||
        googleFontNameForClass(style.fontClass);

      setMatchedStyleOverrides(style);
      setMatchedStyles({ ...style });
      setInkColor({
        id: 'matched',
        label: 'Matched Ink',
        hex: style.inkHex,
      });
      setFontStyle({
        ...matched,
        fontFamily: `"${familyName}"`,
      });
      setActiveFontFamily(familyName);
      setStyleRevision((r) => r + 1);
    } else {
      clearCustomStyleMap();
      clearMatchedStyleOverrides();
      setMatchedStyles(null);
      setInkColor(resolveInk(workspacePreset?.inkId));
      const fallback =
        matchedFonts[DEFAULT_HANDWRITING_FONT_CLASS] ??
        getFontStyleByClass(DEFAULT_HANDWRITING_FONT_CLASS);
      setFontStyle(fallback);
      setActiveFontFamily(googleFontNameForClass(DEFAULT_HANDWRITING_FONT_CLASS));
      setStyleRevision((r) => r + 1);
    }
  };

  const sheetKey = `sheet-${styleRevision}-${activeFontFamily}-${paperType.id}-${matchedStyles?.inkHex ?? 'ink'}`;

  const controlPanelProps = {
    text,
    onTextChange: handleTextChange,
    onPaidSessionInvalidate: voidPaidPassIfNeeded,
    inkColor,
    onInkColorChange: handleInkColorChange,
    paperType,
    onPaperTypeChange: setPaperType,
    fontStyle,
    isPaid,
    matchedStyle: matchedStyles,
    onMatchedStyleChange: handleMatchedStyle,
    checkoutQuote,
    layoutPageCount,
    selectedPackageId,
    onSelectPackageId: setSelectedPackageId,
    onPaymentSuccess: handlePaymentSuccess,
  } as const;

  const paperSheetProps = {
    text,
    inkColor,
    paperType,
    fontStyle,
    matchedFontFamily: activeFontFamily,
    isPaid,
    onTogglePayment: handleTogglePayment,
    matchedStyle: matchedStyles,
    checkoutQuote,
    paintRevision: styleRevision,
  } as const;

  const shellClass = embedded
    ? 'h-full min-h-0 w-full overflow-hidden bg-slate-900 font-sans'
    : 'h-screen w-full overflow-hidden bg-slate-900 font-sans';

  return (
    <div className={shellClass}>
      {/* Permanent font lock — keeps baked faces registered across image remounts */}
      <div className="nakalai-font-lock" aria-hidden>
        <span className="nakalai-font-lock--cursive">AaBbCc</span>
        <span className="nakalai-font-lock--print">AaBbCc</span>
      </div>

      {/* —— Mobile shell (isolated; zero desktop impact) —— */}
      <div className="flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden md:hidden">
        <nav
          className="flex shrink-0 border-b border-slate-800 bg-slate-950/95 px-2 pt-[max(0.5rem,env(safe-area-inset-top))]"
          aria-label="Mobile workspace"
        >
          <button
            type="button"
            onClick={() => setActiveMobileTab('edit')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold transition-colors ${
              activeMobileTab === 'edit'
                ? 'bg-sky-500/15 text-sky-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-pressed={activeMobileTab === 'edit'}
          >
            <span aria-hidden>📝</span>
            Edit Text
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('preview')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold transition-colors ${
              activeMobileTab === 'preview'
                ? 'bg-sky-500/15 text-sky-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-pressed={activeMobileTab === 'preview'}
          >
            <span aria-hidden>👁️</span>
            Preview Page
          </button>
        </nav>

        {activeMobileTab === 'edit' ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ControlPanel
              {...controlPanelProps}
              stackAllSections
              hideBrandChrome
            />
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 w-full flex-col items-center space-y-4 overflow-x-hidden overflow-y-auto bg-[#f3f4f6] p-4">
            <PaperSheet
              key={`${sheetKey}-mobile`}
              {...paperSheetProps}
              fitMobileViewport
            />
          </div>
        )}
      </div>

      {/* —— Desktop shell (isolated; original side-by-side intact) —— */}
      <div className="hidden h-full w-full md:flex md:flex-row">
        <div className="flex h-full min-h-0 w-2/5 shrink-0 flex-col overflow-hidden border-r border-slate-800">
          <ControlPanel {...controlPanelProps} />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden md:w-3/5">
          <PaperSheet key={`${sheetKey}-desktop`} {...paperSheetProps} />
        </div>
      </div>
    </div>
  );
}
