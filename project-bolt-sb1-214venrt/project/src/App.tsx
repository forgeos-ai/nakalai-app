'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ControlPanel from './components/ControlPanel';
import PaperSheet from './components/PaperSheet';
import {
  INK_COLORS,
  PAPER_TYPES,
  DEFAULT_TEXT,
  getFontStyleByClass,
  DEFAULT_HANDWRITING_FONT_CLASS,
  type FontStyle,
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
  invalidatePaidSessionForContentChange,
} from './paymentGateway';
import {
  setMatchedStyleOverrides,
  clearMatchedStyleOverrides,
  type MatchedStyleOverrides,
} from './pageGeometry';
import { clearJitterCache } from './jitter';
import { DnaDebugOverlay } from '../lib/handwriting/golden-lab/dnaDebugOverlay';
import { clearCustomStyleMap } from './utils/customStyleMap';
import { clearHandwritingProfile } from './handwriting';
import { clearHandwritingDNA } from '../lib/handwriting/dna/session';
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

function bareFontFamily(style: FontStyle): string {
  return (
    style.fontFamily.replace(/["']/g, '').split(',')[0]?.trim() ||
    googleFontNameForClass(style.id)
  );
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
   * Standard Handwriting family — user-picked from FONT_STYLES.
   * Match My Writing overrides display independently and never mutates
   * the remembered Standard selection.
   */
  const [fontStyle, setFontStyle] = useState(() =>
    matchedFonts[DEFAULT_HANDWRITING_FONT_CLASS] ??
    getFontStyleByClass(DEFAULT_HANDWRITING_FONT_CLASS),
  );
  /** Exact face name from Standard pick or Match metadata. */
  const [activeFontFamily, setActiveFontFamily] = useState(
    () => googleFontNameForClass(DEFAULT_HANDWRITING_FONT_CLASS),
  );
  /** Last Standard pick — restored when Match My Writing is cleared. */
  const standardFontRef = useRef({
    style:
      matchedFonts[DEFAULT_HANDWRITING_FONT_CLASS] ??
      getFontStyleByClass(DEFAULT_HANDWRITING_FONT_CLASS),
    family: googleFontNameForClass(DEFAULT_HANDWRITING_FONT_CLASS),
  });
  const [isPaid, setIsPaid] = useState(() => isMockPaymentPaid());
  const [matchedStyles, setMatchedStyles] = useState<MatchedStyleOverrides | null>(
    null,
  );
  /**
   * Billing identity for Custom vs Standard packages.
   * Survives post-export DNA purge so entitlement package ID stays stable.
   * Cleared only when the user explicitly clears Match My Writing.
   */
  const [matchBillingActive, setMatchBillingActive] = useState(false);
  /** Bumps when a new photo resolves so A4 pages remount with fresh ink/slant. */
  const [styleRevision, setStyleRevision] = useState(0);
  /** Mobile-only Edit Text / Preview Page toggle — zero desktop impact. */
  const [activeMobileTab, setActiveMobileTab] =
    useState<MobileShellTab>('edit');

  /**
   * Client-only viewport gate — never read `window` / `navigator` during
   * render or useState initializers (SSR / pre-mount crash → blank white page).
   */
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      // One-time privacy cleanup for data saved by retired lead-capture builds.
      localStorage.removeItem('nakalai_student_profile');
      localStorage.removeItem('nakalai_local_leads_log');
    } catch {
      // Storage may be unavailable in privacy-restricted browsers.
    }
    const checkMobile = () => {
      // Prefer visualViewport — Samsung/"Desktop site" can inflate innerWidth
      // while the visible CSS width stays phone-sized (< 768).
      const viewportWidth =
        window.visualViewport?.width ??
        document.documentElement.clientWidth ??
        window.innerWidth;
      const widthCheck = viewportWidth < 768;
      const agentCheck =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      setIsMobileDevice(widthCheck || agentCheck);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.visualViewport?.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.visualViewport?.removeEventListener('resize', checkMobile);
    };
  }, []);

  const layoutPageCount = useMemo(() => {
    if (typeof document === 'undefined') return 1;
    return Math.max(1, paginateText(text, fontStyle).length);
  }, [text, fontStyle]);

  const [selectedPackageId, setSelectedPackageId] = useState(() =>
    resolveDefaultPackageId(false, 1),
  );

  // Keep selection aligned with Match billing identity + layout length; upgrade to 75 when needed.
  useEffect(() => {
    const nextId = resolveDefaultPackageId(
      matchBillingActive,
      layoutPageCount,
    );
    setSelectedPackageId((prev) => {
      const prevPkg = getPricingPackageById(prev);
      const nextPkg = getPricingPackageById(nextId);
      if (layoutPageCount > prevPkg.pages && prevPkg.pages < 75) return nextId;
      if (prevPkg.engine !== nextPkg.engine && prevPkg.pages === nextPkg.pages) {
        return nextId;
      }
      if (!PRICING_PACKAGES.some((p) => p.id === prev)) return nextId;
      return prev;
    });
  }, [matchBillingActive, layoutPageCount]);

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
      matchBillingActive,
    );
    if (!receipt) return false;
    setIsPaid(false);
    return true;
  }, [matchBillingActive]);

  const handleTextChange = useCallback(
    (value: string) => {
      if (isPaid && value !== text) {
        voidPaidPassIfNeeded();
      }
      setText(value);
    },
    [isPaid, text, voidPaidPassIfNeeded],
  );

  const payActionRef = useRef<(() => void) | null>(null);

  const registerPayAction = useCallback((pay: () => void) => {
    payActionRef.current = pay;
  }, []);

  const runPayAction = useCallback(() => {
    payActionRef.current?.();
  }, []);

  /** Premium checkout success — unlock watermark + PDF. */
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
   * Standard Handwriting picker — independent of Match My Writing.
   * Choosing a Standard face clears any active Match so the two engines
   * never share or overwrite each other's font state.
   */
  const handleFontStyleChange = useCallback(
    (style: FontStyle) => {
      const family = bareFontFamily(style);
      standardFontRef.current = { style, family };
      clearJitterCache();
      if (matchedStyles) {
        clearCustomStyleMap();
        clearHandwritingProfile();
        clearHandwritingDNA();
        clearMatchedStyleOverrides();
        setMatchedStyles(null);
        setMatchBillingActive(false);
        setInkColor(resolveInk(workspacePreset?.inkId));
      }
      setFontStyle(style);
      setActiveFontFamily(family);
      setStyleRevision((r) => r + 1);
    },
    [matchedStyles, workspacePreset?.inkId],
  );

  /**
   * Match My Style success — binds matched face from image analysis.
   * Does not overwrite the remembered Standard selection.
   * Restored to RC1 lifecycle: never stash/clear profile on package changes.
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
      setMatchBillingActive(true);
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
      clearHandwritingProfile();
      clearHandwritingDNA();
      clearMatchedStyleOverrides();
      setMatchedStyles(null);
      setMatchBillingActive(false);
      setInkColor(resolveInk(workspacePreset?.inkId));
      const { style: standardStyle, family } = standardFontRef.current;
      setFontStyle(standardStyle);
      setActiveFontFamily(family);
      setStyleRevision((r) => r + 1);
    }
  };

  /**
   * Post-export DNA privacy — reset preview to Standard handwriting.
   * Does NOT clear matchBillingActive or selectedPackageId (entitlement identity).
   * Does NOT void the paid download pass.
   */
  const handleDnaPurgedAfterExport = useCallback(() => {
    clearJitterCache();
    setMatchedStyles(null);
    setInkColor(resolveInk(workspacePreset?.inkId));
    const { style: standardStyle, family } = standardFontRef.current;
    setFontStyle(standardStyle);
    setActiveFontFamily(family);
    setStyleRevision((r) => r + 1);
  }, [workspacePreset?.inkId]);

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
    onFontStyleChange: handleFontStyleChange,
    isPaid,
    matchedStyle: matchedStyles,
    onMatchedStyleChange: handleMatchedStyle,
    onDnaPurgedAfterExport: handleDnaPurgedAfterExport,
    checkoutQuote,
    layoutPageCount,
    selectedPackageId,
    onSelectPackageId: setSelectedPackageId,
    onPaymentSuccess: handlePaymentSuccess,
    onRegisterPayAction: registerPayAction,
  } as const;

  const paperSheetProps = {
    text,
    inkColor,
    paperType,
    fontStyle,
    matchedFontFamily: activeFontFamily,
    isPaid,
    onPay: runPayAction,
    matchedStyle: matchedStyles,
    checkoutQuote,
    paintRevision: styleRevision,
  } as const;

  const shellClass = embedded
    ? 'h-full w-full overflow-hidden bg-slate-900 font-sans'
    : 'h-screen w-full overflow-hidden bg-slate-900 font-sans';

  return (
    <div className={shellClass}>
      {/* Permanent font lock — keeps baked faces registered across image remounts */}
      <div className="nakalai-font-lock" aria-hidden>
        <span className="nakalai-font-lock--cursive">AaBbCc</span>
        <span className="nakalai-font-lock--print">AaBbCc</span>
      </div>

      {!isMounted ? null : isMobileDevice ? (
        /* —— Mobile shell (tabbed; never side-by-side) —— */
        <div className="flex h-[100dvh] w-full flex-col overflow-hidden">
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
            <div className="flex w-full flex-1 flex-col items-stretch overflow-x-hidden overflow-y-auto px-2 py-3 sm:px-3">
              <PaperSheet
                key={`${sheetKey}-mobile`}
                {...paperSheetProps}
                fitMobileViewport
              />
            </div>
          )}
        </div>
      ) : (
        /* —— Desktop shell (side-by-side) —— */
        <div className="flex h-full w-full flex-row overflow-hidden">
          <div className="h-full w-[400px] flex-shrink-0 overflow-hidden border-r border-slate-800">
            <ControlPanel {...controlPanelProps} />
          </div>
          <div className="h-full flex-grow overflow-y-auto">
            <PaperSheet key={`${sheetKey}-desktop`} {...paperSheetProps} />
          </div>
        </div>
      )}
      <DnaDebugOverlay />
    </div>
  );
}
