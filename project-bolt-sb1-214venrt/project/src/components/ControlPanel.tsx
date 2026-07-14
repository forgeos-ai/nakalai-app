import { useCallback, useRef, useState } from 'react';
import { INK_COLORS, PAPER_TYPES } from '../constants';
import type { InkColor, PaperType, FontStyle } from '../constants';
import {
  PenLine,
  FileText,
  Sparkles,
  FileDown,
  Loader2,
  Upload,
  ScanLine,
  X,
  Palette,
} from 'lucide-react';
import {
  FALLBACK_INK_HEX,
  FALLBACK_SLANT_DEGREES,
  FALLBACK_NOISE,
  FALLBACK_FONT_CLASS,
  STYLE_EXTRACT_ERROR,
} from '../utils/styleExtractor';
import { matchedOverridesFromProfile } from '../handwriting';
import {
  buildCustomStyleMapFromFile,
  setCustomStyleSampleText,
} from '../utils/customStyleMap';

const PDF_SINGLE_FILE_MESSAGE = 'Only 1 PDF can be converted at a time.';

import type { MatchedStyleOverrides } from '../pageGeometry';
import {
  isTierSufficient,
  resolveDefaultTier,
  toCheckoutActivationPayload,
  PRICING_PACKAGES,
  getPricingTierById,
  type CheckoutActivationPayload,
  type CheckoutQuote,
  type PricingTier,
} from '../billing';
import {
  AD_BLOCKER_FREE_DOWNLOAD_WARNING,
  FREE_TIER_PAGE_ALERT,
  detectAdBlocker,
  isWithinFreePageCap,
} from '../clientGuards';
import type { PaymentReceipt } from '../paymentGateway';
import { getStudentProfile } from '../studentProfile';
import { usePayment } from '../hooks/usePayment';
import LeadCaptureModal from './LeadCaptureModal';

type ControlPanelProps = {
  text: string;
  onTextChange: (value: string) => void;
  inkColor: InkColor;
  onInkColorChange: (value: InkColor) => void;
  paperType: PaperType;
  onPaperTypeChange: (value: PaperType) => void;
  /** Auto-matched font from image analysis (display only — not user-picked). */
  fontStyle: FontStyle;
  /** Mock UPI paid — required before clean PDF export. */
  isPaid: boolean;
  matchedStyle?: MatchedStyleOverrides | null;
  onMatchedStyleChange?: (style: MatchedStyleOverrides | null) => void;
  checkoutQuote: CheckoutQuote;
  layoutPageCount: number;
  selectedPackageId: string;
  onSelectPackageId: (packageId: string) => void;
  /** Void paid pass when a new PDF replaces assignment content. */
  onPaidSessionInvalidate?: () => boolean;
  /** Fired after mock gateway + ledger upsert unlocks download. */
  onPaymentSuccess?: (
    receipt: PaymentReceipt,
    quote: CheckoutQuote,
    activation?: CheckoutActivationPayload,
  ) => void;
  /**
   * Mobile Edit Text shell — show Text + Style + Look together (no section tabs).
   * Desktop ControlPanel ignores this via default false.
   */
  stackAllSections?: boolean;
  /** Hide NakalAI header chrome (mobile shell already has its own tab bar). */
  hideBrandChrome?: boolean;
};

function FieldLabel({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:text-xs">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </label>
  );
}

const selectClass =
  'w-full appearance-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 transition-colors hover:border-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500';

type MobileTab = 'text' | 'style' | 'look';

const MOBILE_TABS: {
  id: MobileTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'text', label: 'Text', icon: Sparkles },
  { id: 'style', label: 'Style', icon: ScanLine },
  { id: 'look', label: 'Look', icon: Palette },
];

export default function ControlPanel({
  text,
  onTextChange,
  inkColor,
  onInkColorChange,
  paperType,
  onPaperTypeChange,
  isPaid,
  matchedStyle = null,
  onMatchedStyleChange,
  checkoutQuote,
  layoutPageCount,
  selectedPackageId,
  onSelectPackageId,
  onPaidSessionInvalidate,
  onPaymentSuccess,
  stackAllSections = false,
  hideBrandChrome = false,
}: ControlPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfExtractError, setPdfExtractError] = useState<string | null>(null);
  const [isPdfDragOver, setIsPdfDragOver] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);
  const styleUploadGenRef = useRef(0);
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);
  const [styleError, setStyleError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('text');
  /** Free download disabled when an ad blocker is detected. */
  const [adBlockerActive, setAdBlockerActive] = useState(false);
  const [clientGuardWarning, setClientGuardWarning] = useState<string | null>(
    null,
  );

  const selectedTier: PricingTier =
    getPricingTierById(selectedPackageId) ??
    getPricingTierById(PRICING_PACKAGES[0]!.id)!;

  const handlePaid = useCallback(
    (
      receipt: PaymentReceipt,
      quote: CheckoutQuote,
      activation: CheckoutActivationPayload,
    ) => {
      onPaymentSuccess?.(receipt, quote, activation);
    },
    [onPaymentSuccess],
  );

  const { isProcessingPayment, initiatePremiumCheckout } = usePayment({
    hasMatchedStyle: Boolean(matchedStyle),
    layoutPageCount,
    selectedTier,
    onPaid: handlePaid,
  });

  /** Build the Pay CTA payload: selectedTier.id + priceINR + canvas page count. */
  const buildActivationPayload = (): CheckoutActivationPayload =>
    toCheckoutActivationPayload(selectedTier, layoutPageCount);

  const ensureTierFitsLayout = (): boolean => {
    if (isTierSufficient(selectedTier, layoutPageCount)) return true;
    const upgraded = resolveDefaultTier(
      Boolean(matchedStyle),
      layoutPageCount,
    );
    onSelectPackageId(upgraded.id);
    window.alert(
      `Your layout is ${layoutPageCount} pages. The 10-page bundle is too small — switched you to the ${upgraded.pages}-page ${upgraded.engine} bundle. Confirm and pay again.`,
    );
    return false;
  };

  const rejectMultiFile = () => {
    setPdfExtractError(PDF_SINGLE_FILE_MESSAGE);
    window.alert(PDF_SINGLE_FILE_MESSAGE);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  /**
   * Single-PDF gate: reject multi-select/drop immediately.
   * On success, OVERWRITE textarea so 1 file = 1 assignment layout.
   */
  const handlePdfFiles = async (files: FileList | File[] | null | undefined) => {
    if (isExtractingPdf) return;

    const list = files
      ? Array.isArray(files)
        ? files
        : Array.from(files)
      : [];

    if (list.length === 0) return;

    if (list.length > 1) {
      rejectMultiFile();
      return;
    }

    let file: File;
    const pdfMod = await import('../extractPdfText');
    try {
      file = pdfMod.assertSinglePdfFile(list);
      const { validatePdfUpload } = await import('../security/fileValidation');
      await validatePdfUpload(file);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : pdfMod.PDF_SINGLE_FILE_MESSAGE;
      if (message === pdfMod.PDF_SINGLE_FILE_MESSAGE) {
        rejectMultiFile();
      } else {
        setPdfExtractError(message);
      }
      return;
    }

    // Mobile MIME can be empty — re-check extension before ArrayBuffer work
    const isPDF =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');
    if (!isPDF) {
      setPdfExtractError(pdfMod.PDF_EXTRACT_FALLBACK_MESSAGE);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      return;
    }

    setPdfExtractError(null);
    setIsExtractingPdf(true);
    // New PDF = new assignment — void any existing paid download pass
    if (isPaid) {
      onPaidSessionInvalidate?.();
    }
    // Clear previous assignment text immediately so canvas resets to one job
    onTextChange('');

    try {
      const extracted = await pdfMod.extractTextFromPdf(file);
      onTextChange(extracted);
    } catch (err) {
      console.error('PDF extract failed:', err);
      onTextChange('');
      setPdfExtractError(
        err instanceof Error
          ? err.message
          : pdfMod.PDF_EXTRACT_FALLBACK_MESSAGE,
      );
    } finally {
      setIsExtractingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const handlePdfInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handlePdfFiles(e.target.files);
  };

  const handlePdfDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPdfDragOver(false);
    void handlePdfFiles(e.dataTransfer.files);
  };

  const runPdfExport = async (opts?: {
    bypassPaidCheck?: boolean;
    mode?: 'free' | 'paid';
  }) => {
    if (isExporting) return;
    const mode = opts?.mode ?? (isPaid ? 'paid' : 'free');
    if (!opts?.bypassPaidCheck && !isPaid && mode !== 'free') {
      window.alert(
        `${checkoutQuote.ctaLabel} — complete secure checkout to unlock download.`,
      );
      return;
    }
    setIsExporting(true);
    setClientGuardWarning(null);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    try {
      const { fingerprintAssignment } = await import('../security/contentFingerprint');
      const { authorizeExport } = await import('../security/downloadAuthorization');
      const contentHash = await fingerprintAssignment(
        text,
        layoutPageCount,
        selectedPackageId,
      );
      const auth = await authorizeExport({
        mode,
        contentHash,
        layoutPageCount,
        packageId: selectedPackageId,
      });
      const { exportAssignmentPdf } = await import('../exportPdf');
      await exportAssignmentPdf({
        mode,
        maxPages: auth.maxPages,
        skipWatermark: auth.skipWatermark,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to generate PDF. Please try again.';
      setClientGuardWarning(message);
      window.alert(message);
    } finally {
      setIsExporting(false);
    }
  };

  const proceedToDownload = (mode: 'free' | 'paid' = 'paid') => {
    if (mode === 'paid' && !getStudentProfile()) {
      setShowLeadModal(true);
      return;
    }
    void runPdfExport({ bypassPaidCheck: true, mode });
  };

  /**
   * Download initiation loop — ad-blocker probe → free 3-page cap → paid path.
   * All rendering stays on-device (exportPdf → createObjectURL).
   */
  const handleDownloadPdf = () => {
    if (isExporting || isProcessingPayment) return;

    void (async () => {
      setClientGuardWarning(null);

      // 1) Ad-blocker check at the start of the download initiation loop
      let blocker = false;
      try {
        const testAd = await fetch(
          'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
          { method: 'HEAD', mode: 'no-cors' },
        );
        void testAd;
        blocker = false;
      } catch {
        // Ad-blocker active — disable free download button state
        blocker = true;
      }
      if (!blocker) {
        blocker = await detectAdBlocker();
      }
      setAdBlockerActive(blocker);

      const calculatedPages = layoutPageCount;

      // 2) Unpaid paths
      if (!isPaid) {
        // Free tier eligible (≤3 layout pages)
        if (isWithinFreePageCap(calculatedPages)) {
          if (blocker) {
            setClientGuardWarning(AD_BLOCKER_FREE_DOWNLOAD_WARNING);
            return;
          }
          proceedToDownload('free');
          return;
        }

        // Free tier blocked — must upgrade to a value pack
        setClientGuardWarning(FREE_TIER_PAGE_ALERT);
        window.alert(FREE_TIER_PAGE_ALERT);

        if (!ensureTierFitsLayout()) return;
        const activation = buildActivationPayload();
        if (!getStudentProfile()) {
          setShowLeadModal(true);
          return;
        }
        const result = await initiatePremiumCheckout(undefined, activation, text);
        if (result?.ok) {
          proceedToDownload('paid');
        } else if (result?.error) {
          window.alert(`Payment could not complete: ${result.error}`);
        }
        return;
      }

      // 3) Already paid — local full export
      proceedToDownload('paid');
    })();
  };

  const handleLeadSubmit = () => {
    setShowLeadModal(false);
    void runPdfExport({ bypassPaidCheck: true, mode: 'paid' });
  };

  const handleLeadClose = () => {
    setShowLeadModal(false);
  };

  const handleStylePhoto = async (file: File | undefined) => {
    if (!file || !onMatchedStyleChange) return;

    try {
      const { validateImageUpload } = await import('../security/fileValidation');
      await validateImageUpload(file);
    } catch (err) {
      setStyleError(
        err instanceof Error ? err.message : 'Please upload a character sheet image (PNG or JPEG).',
      );
      if (styleInputRef.current) styleInputRef.current.value = '';
      return;
    }

    setStyleError(null);
    setIsAnalyzingStyle(true);
    const uploadGen = ++styleUploadGenRef.current;

    try {
      setCustomStyleSampleText(text);
      // Fresh pipeline session — Nth upload ≡ first upload (cancels prior jobs)
      const { profile, committed } = await buildCustomStyleMapFromFile(
        file,
        text,
      );

      // Superseded by a newer upload — do not clobber UI / profile
      if (!committed || uploadGen !== styleUploadGenRef.current) return;

      onMatchedStyleChange(matchedOverridesFromProfile(profile));

      console.info(
        '[NakalAI] Handwriting profile ready:',
        profile.fontClass,
        profile.fontFamily,
        `seed=${profile.seed}`,
      );
      setStyleError(null);
    } catch (err) {
      if (uploadGen !== styleUploadGenRef.current) return;
      console.error('Style upload failed:', err);
      onMatchedStyleChange({
        inkHex: FALLBACK_INK_HEX,
        slantDegrees: FALLBACK_SLANT_DEGREES,
        noiseIntensity: FALLBACK_NOISE,
        fontCategory: 'casual-print',
        fontClass: FALLBACK_FONT_CLASS,
      });
      setStyleError(
        err instanceof Error ? err.message : STYLE_EXTRACT_ERROR,
      );
    } finally {
      if (uploadGen === styleUploadGenRef.current) {
        setIsAnalyzingStyle(false);
        if (styleInputRef.current) styleInputRef.current.value = '';
      }
    }
  };

  return (
    <aside className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-900">
      <LeadCaptureModal
        open={showLeadModal}
        onSubmit={handleLeadSubmit}
        onClose={handleLeadClose}
        hasMatchedStyle={Boolean(matchedStyle)}
        packageId={selectedPackageId}
        layoutPageCount={layoutPageCount}
        assignmentText={text}
        isPaid={isPaid}
        onPaymentSuccess={onPaymentSuccess}
      />

      {/* Processing overlay */}
      {isExporting && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950/85 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-10 w-10 animate-spin text-sky-400" />
          <p className="px-6 text-center text-sm font-medium text-slate-100">
            Assembling your assignment... please wait
          </p>
        </div>
      )}

      {/* Header — compact on mobile */}
      {!hideBrandChrome && (
      <div className="shrink-0 border-b border-slate-800 px-4 py-2 md:px-6 md:py-3">
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 md:h-9 md:w-9 md:rounded-xl">
            <PenLine className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white md:text-lg">NakalAI</h1>
            <p className="truncate text-[10px] text-slate-400">
              Text to Handwriting Converter
            </p>
          </div>
        </div>
        <nav
          className="mt-1.5 hidden flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 md:mt-2 md:flex md:text-xs"
          aria-label="Site"
        >
          <a className="hover:text-sky-300" href="/pricing">
            Pricing
          </a>
          <a className="hover:text-sky-300" href="/faq">
            FAQ
          </a>
          <a className="hover:text-sky-300" href="/blog">
            Blog
          </a>
          <a className="hover:text-sky-300" href="/text-to-handwriting">
            Text to handwriting
          </a>
          <a className="hover:text-sky-300" href="/about">
            About
          </a>
        </nav>
      </div>
      )}

      {/* Mobile section tabs — desktop sidebar only (hidden when stackAllSections) */}
      {!stackAllSections && (
      <nav
        className="flex shrink-0 border-b border-slate-800 md:hidden"
        aria-label="Control sections"
      >
        {MOBILE_TABS.map(({ id, label, icon: Icon }) => {
          const active = mobileTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setMobileTab(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                active
                  ? 'border-b-2 border-sky-400 text-sky-300'
                  : 'border-b-2 border-transparent text-slate-500 hover:text-slate-300'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>
      )}

      {/* Controls — no outer scroll; only the assignment textarea scrolls */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-2 md:px-5 md:py-3">
        {/* Textarea + PDF extract */}
        <div
          className={`min-h-0 flex-1 flex-col ${
            stackAllSections || mobileTab === 'text'
              ? 'flex'
              : 'hidden md:flex'
          }`}
        >
          <FieldLabel icon={Sparkles}>Assignment Text</FieldLabel>

          <div className="relative min-h-[5.5rem] flex-1">
            <textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Paste your assignment text here..."
              disabled={isExtractingPdf}
              className="absolute inset-0 h-full w-full resize-none overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm leading-relaxed text-slate-100 placeholder-slate-500 transition-colors hover:border-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60 md:p-3"
            />
            {isExtractingPdf && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-slate-950/80 backdrop-blur-sm"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
                <p className="px-4 text-center text-xs font-medium text-slate-100">
                  Extracting text from PDF...
                </p>
              </div>
            )}
          </div>

          <div className="mt-1 flex shrink-0 justify-between text-[10px] text-slate-500">
            <span>{text.length} characters</span>
            <span>{text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
          </div>

          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple={false}
            className="hidden"
            onChange={handlePdfInputChange}
          />

          <button
            type="button"
            onClick={() => {
              if (!isExtractingPdf) pdfInputRef.current?.click();
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsPdfDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsPdfDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsPdfDragOver(false);
            }}
            onDrop={handlePdfDrop}
            disabled={isExtractingPdf}
            className={`mt-1.5 flex w-full shrink-0 items-center gap-2 rounded-lg border border-dashed px-2.5 py-1.5 text-left text-[11px] font-medium leading-snug transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-60 md:text-xs ${
              isPdfDragOver
                ? 'border-sky-500 bg-sky-500/10 text-white'
                : 'border-slate-600 bg-slate-800/60 text-slate-200 hover:border-sky-500/60 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {isExtractingPdf ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-400" />
            ) : (
              <Upload className="h-3.5 w-3.5 shrink-0 text-sky-400" />
            )}
            <span className="min-w-0 truncate">
              Upload PDF to extract text (Replaces current text)
            </span>
          </button>

          {pdfExtractError && (
            <p
              className="mt-1.5 shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-snug text-amber-200"
              role="alert"
            >
              {pdfExtractError}
            </p>
          )}
        </div>

        {/* Match My Writing Style */}
        <div
          className={`mt-2 shrink-0 py-1 ${
            stackAllSections || mobileTab === 'style'
              ? 'block'
              : 'hidden md:block'
          }`}
        >
          <FieldLabel icon={ScanLine}>Match My Writing Style</FieldLabel>
          <input
            ref={styleInputRef}
            type="file"
            accept="image/*"
            multiple={false}
            className="hidden"
            onChange={(e) => void handleStylePhoto(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => styleInputRef.current?.click()}
            disabled={isAnalyzingStyle}
            className="flex w-full items-center gap-2 rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-sky-500/10 px-3 py-2 text-left text-xs font-semibold text-amber-100 transition-all hover:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAnalyzingStyle ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-amber-300" />
            ) : (
              <ScanLine className="h-3.5 w-3.5 shrink-0 text-amber-300" />
            )}
            <span className="truncate">
              {isAnalyzingStyle
                ? 'Analyzing handwriting…'
                : 'Match My Writing Style'}
            </span>
          </button>

          {matchedStyle && (
            <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5">
              <p className="flex min-w-0 items-center gap-2 text-[11px] text-slate-300">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/20"
                  style={{ backgroundColor: matchedStyle.inkHex }}
                />
                <span className="truncate">Style matched</span>
              </p>
              <button
                type="button"
                onClick={() => onMatchedStyleChange?.(null)}
                className="rounded-md p-0.5 text-slate-500 hover:bg-slate-700 hover:text-slate-200"
                aria-label="Clear matched style"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {styleError && (
            <p
              className="mt-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-snug text-amber-200"
              role="alert"
            >
              {styleError}
            </p>
          )}
        </div>

        {/* Ink / Paper — Look tab on mobile */}
        <div
          className={`mt-2 shrink-0 space-y-2 py-1 ${
            stackAllSections || mobileTab === 'look'
              ? 'block'
              : 'hidden md:block'
          }`}
        >
          <div>
            <FieldLabel icon={PenLine}>Ink Color</FieldLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {INK_COLORS.map((color) => {
                const active = color.id === inkColor.id;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => onInkColorChange(color)}
                    className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-all md:text-xs ${
                      active
                        ? 'border-sky-500 bg-sky-500/10 text-white'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full ring-1 ring-white/20"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="truncate">{color.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <FieldLabel icon={FileText}>Paper Type</FieldLabel>
            <select
              value={paperType.id}
              onChange={(e) =>
                onPaperTypeChange(
                  PAPER_TYPES.find((p) => p.id === e.target.value)!,
                )
              }
              className={selectClass}
            >
              {PAPER_TYPES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Primary download / pay dock — always pinned in view */}
      <div className="shrink-0 border-t border-slate-800 px-3 py-1.5 md:px-5 md:py-2">
        {!isPaid && (
          <div className="mb-1.5 space-y-1">
            <label
              htmlFor="package-select"
              className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400"
            >
              Select Your Package
            </label>
            <select
              id="package-select"
              value={selectedPackageId}
              onChange={(e) => onSelectPackageId(e.target.value)}
              className={`${selectClass} py-1.5 text-xs`}
              aria-label="Select your package"
            >
              {PRICING_PACKAGES.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.label}
                </option>
              ))}
            </select>
            {layoutPageCount > 10 && selectedTier.pages === 10 && (
              <p className="text-[10px] leading-snug text-amber-300/90">
                Layout is {layoutPageCount} pages — pick a 75-page pack.
              </p>
            )}
          </div>
        )}
        {(clientGuardWarning || adBlockerActive) && (
          <p
            className="mb-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-snug text-amber-100"
            role="alert"
          >
            {clientGuardWarning ??
              (adBlockerActive ? AD_BLOCKER_FREE_DOWNLOAD_WARNING : null)}
          </p>
        )}
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={
            isExporting ||
            isProcessingPayment ||
            (!isPaid &&
              isWithinFreePageCap(layoutPageCount) &&
              adBlockerActive)
          }
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:from-sky-400 hover:to-indigo-500 hover:shadow-sky-500/40 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
        >
          {isProcessingPayment ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          )}
          <span className="truncate">
            {isProcessingPayment
              ? 'Processing Secure Payment...'
              : isPaid
                ? 'Download Assignment PDF'
                : isWithinFreePageCap(layoutPageCount)
                  ? adBlockerActive
                    ? 'Free download blocked · disable ad blocker'
                    : 'Download free (≤3 pages)'
                  : `Pay now to unlock · ₹${selectedTier.amountInr}`}
          </span>
        </button>
        <p className="mt-1 text-center text-[10px] text-slate-500">
          {isProcessingPayment
            ? 'Confirming gateway · updating download permissions…'
            : isPaid
              ? checkoutQuote.paidLabel
              : isWithinFreePageCap(layoutPageCount)
                ? 'Client-side free PDF · Made with NakalAI footer'
                : `${selectedTier.pages}-page ${selectedTier.engine} · ${layoutPageCount} canvas page${layoutPageCount === 1 ? '' : 's'}`}
        </p>
      </div>
    </aside>
  );
}
