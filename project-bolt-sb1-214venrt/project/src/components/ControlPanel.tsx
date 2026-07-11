import { useCallback, useRef, useState } from 'react';
import { INK_COLORS, PAPER_TYPES, FONT_STYLES, HANDWRITING_STYLE_BUCKETS, getBucketLabel } from '../constants';
import type { InkColor, PaperType, FontStyle } from '../constants';
import {
  PenLine,
  FileText,
  Type,
  Sparkles,
  FileDown,
  Loader2,
  Upload,
  ScanLine,
  X,
} from 'lucide-react';
import { exportAssignmentPdf } from '../exportPdf';
import {
  extractTextFromPdf,
  assertSinglePdfFile,
  PDF_EXTRACT_FALLBACK_MESSAGE,
  PDF_SINGLE_FILE_MESSAGE,
} from '../extractPdfText';
import {
  extractNotebookStyle,
  STYLE_EXTRACT_ERROR,
  FALLBACK_INK_HEX,
  FALLBACK_SLANT_DEGREES,
  FALLBACK_NOISE,
  FALLBACK_FONT_CLASS,
} from '../utils/styleExtractor';
import { sliceGlyphsFromFile } from '../utils/glyphSlicer';

import type { MatchedStyleOverrides } from '../pageGeometry';
import type { CheckoutQuote } from '../billing';
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
  fontStyle: FontStyle;
  onFontStyleChange: (value: FontStyle) => void;
  /** Mock UPI paid — required before clean PDF export. */
  isPaid: boolean;
  matchedStyle?: MatchedStyleOverrides | null;
  onMatchedStyleChange?: (style: MatchedStyleOverrides | null) => void;
  checkoutQuote: CheckoutQuote;
  /** Void paid pass when a new PDF replaces assignment content. */
  onPaidSessionInvalidate?: () => boolean;
  /** Fired after mock gateway + ledger upsert unlocks download. */
  onPaymentSuccess?: (receipt: PaymentReceipt, quote: CheckoutQuote) => void;
};

function FieldLabel({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </label>
  );
}

const selectClass =
  'w-full appearance-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 transition-colors hover:border-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500';

export default function ControlPanel({
  text,
  onTextChange,
  inkColor,
  onInkColorChange,
  paperType,
  onPaperTypeChange,
  fontStyle,
  onFontStyleChange,
  isPaid,
  matchedStyle = null,
  onMatchedStyleChange,
  checkoutQuote,
  onPaidSessionInvalidate,
  onPaymentSuccess,
}: ControlPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfExtractError, setPdfExtractError] = useState<string | null>(null);
  const [isPdfDragOver, setIsPdfDragOver] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);
  const [styleError, setStyleError] = useState<string | null>(null);

  const handlePaid = useCallback(
    (receipt: PaymentReceipt, quote: CheckoutQuote) => {
      onPaymentSuccess?.(receipt, quote);
    },
    [onPaymentSuccess],
  );

  const { isProcessingPayment, initiatePremiumCheckout } = usePayment({
    hasMatchedStyle: Boolean(matchedStyle),
    onPaid: handlePaid,
  });

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
    try {
      file = assertSinglePdfFile(list);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : PDF_SINGLE_FILE_MESSAGE;
      if (message === PDF_SINGLE_FILE_MESSAGE) {
        rejectMultiFile();
      } else {
        setPdfExtractError(message);
      }
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
      const extracted = await extractTextFromPdf(file);
      onTextChange(extracted);
    } catch (err) {
      console.error('PDF extract failed:', err);
      onTextChange('');
      setPdfExtractError(
        err instanceof Error ? err.message : PDF_EXTRACT_FALLBACK_MESSAGE,
      );
    } finally {
      setIsExtractingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const handlePdfInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handlePdfFiles(e.target.files);
  };

  const handlePdfDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPdfDragOver(false);
    void handlePdfFiles(e.dataTransfer.files);
  };

  const runPdfExport = async (opts?: { bypassPaidCheck?: boolean }) => {
    if (isExporting) return;
    if (!opts?.bypassPaidCheck && !isPaid) {
      window.alert(
        `${checkoutQuote.ctaLabel} — complete secure checkout to unlock download.`,
      );
      return;
    }
    setIsExporting(true);
    // Let React paint the overlay before heavy canvas work begins
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    try {
      await exportAssignmentPdf();
    } catch (err) {
      console.error('PDF export failed:', err);
      window.alert(
        err instanceof Error
          ? err.message
          : 'Failed to generate PDF. Please try again.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const proceedToDownload = () => {
    if (!getStudentProfile()) {
      setShowLeadModal(true);
      return;
    }
    void runPdfExport({ bypassPaidCheck: true });
  };

  const handleDownloadPdf = () => {
    if (isExporting || isProcessingPayment) return;

    // No profile yet → modal collects lead, then fires initiatePremiumCheckout
    if (!getStudentProfile()) {
      setShowLeadModal(true);
      return;
    }

    if (!isPaid) {
      void (async () => {
        const result = await initiatePremiumCheckout();
        if (result?.ok) {
          proceedToDownload();
        } else if (result?.error) {
          window.alert(
            `Payment recorded locally, but ledger sync failed: ${result.error}`,
          );
          proceedToDownload();
        }
      })();
      return;
    }

    proceedToDownload();
  };

  const handleLeadSubmit = () => {
    setShowLeadModal(false);
    void runPdfExport({ bypassPaidCheck: true });
  };

  const handleLeadClose = () => {
    setShowLeadModal(false);
  };

  const handleStylePhoto = async (file: File | undefined) => {
    if (!file || isAnalyzingStyle || !onMatchedStyleChange) return;
    setStyleError(null);
    setIsAnalyzingStyle(true);

    try {
      // Photo → ink + slant + stroke/connectivity → registry fontClass
      const extracted = await extractNotebookStyle(file, { inputText: text });

      // Adaptive pixel sifter → layout bias/variance
      try {
        await sliceGlyphsFromFile(file);
      } catch (slicerErr) {
        console.warn('[NakalAI] Glyph slicer skipped:', slicerErr);
      }

      onMatchedStyleChange({
        inkHex: extracted.inkHex,
        slantDegrees: extracted.slantDegrees,
        noiseIntensity: extracted.noiseIntensity,
        fontCategory: extracted.fontCategory,
        fontClass: extracted.fontClass,
      });

      if (extracted.usedFallback) {
        setStyleError(
          'Photo was unclear — applied dark blue gel-pen defaults. Try a sharper notebook shot for a closer match.',
        );
      } else {
        setStyleError(null);
      }
    } catch (err) {
      console.error('Style extract failed:', err);
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
      setIsAnalyzingStyle(false);
      if (styleInputRef.current) styleInputRef.current.value = '';
    }
  };

  return (
    <aside className="relative flex h-full w-full flex-col bg-slate-900">
      <LeadCaptureModal
        open={showLeadModal}
        onSubmit={handleLeadSubmit}
        onClose={handleLeadClose}
        hasMatchedStyle={Boolean(matchedStyle)}
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

      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20">
            <PenLine className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">NakalAI</h1>
            <p className="text-xs text-slate-400">Text to Handwriting Converter</p>
          </div>
        </div>
      </div>

      {/* Scrollable controls */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Textarea + PDF extract */}
        <div className="mb-6">
          <FieldLabel icon={Sparkles}>Assignment Text</FieldLabel>

          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Paste your assignment text here..."
              disabled={isExtractingPdf}
              className="h-64 w-full resize-none rounded-lg border border-slate-700 bg-slate-800 p-4 text-sm leading-relaxed text-slate-100 placeholder-slate-500 transition-colors hover:border-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
            />
            {isExtractingPdf && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-slate-950/80 backdrop-blur-sm"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
                <p className="px-4 text-center text-sm font-medium text-slate-100">
                  Extracting text from PDF...
                </p>
              </div>
            )}
          </div>

          <div className="mt-2 flex justify-between text-xs text-slate-500">
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

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!isExtractingPdf) pdfInputRef.current?.click();
              }
            }}
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
            className={`mt-3 flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500 ${
              isExtractingPdf
                ? 'cursor-not-allowed border-slate-700 bg-slate-800/40 text-slate-500 opacity-60'
                : isPdfDragOver
                  ? 'border-sky-500 bg-sky-500/10 text-white'
                  : 'border-slate-600 bg-slate-800/60 text-slate-200 hover:border-sky-500/60 hover:bg-slate-800 hover:text-white'
            }`}
            aria-disabled={isExtractingPdf}
          >
            {isExtractingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
            ) : (
              <Upload className="h-4 w-4 text-sky-400" />
            )}
            <span>Upload PDF to extract text</span>
            <span className="text-xs font-normal text-slate-500">
              One PDF only · replaces current assignment text
            </span>
          </div>

          {pdfExtractError && (
            <p
              className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200"
              role="alert"
            >
              {pdfExtractError}
            </p>
          )}
        </div>

        {/* Ink Color */}
        <div className="mb-5">
          <FieldLabel icon={PenLine}>Ink Color</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            {INK_COLORS.map((color) => {
              const active = color.id === inkColor.id;
              return (
                <button
                  key={color.id}
                  onClick={() => onInkColorChange(color)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${
                    active
                      ? 'border-sky-500 bg-sky-500/10 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full ring-1 ring-white/20"
                    style={{ backgroundColor: color.hex }}
                  />
                  {color.label}
                </button>
              );
            })}
          </div>
          {inkColor.id === 'matched' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span
                className="h-3 w-3 rounded-full ring-1 ring-white/20"
                style={{ backgroundColor: inkColor.hex }}
              />
              Matched ink {inkColor.hex}
            </div>
          )}
        </div>

        {/* Match My Writing Style — premium canvas photo analysis */}
        <div className="mb-5">
          <FieldLabel icon={ScanLine}>
            Match My Writing Style
          </FieldLabel>
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
            className="flex w-full flex-col items-start gap-1 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-sky-500/10 px-4 py-3.5 text-left transition-all hover:border-amber-400/50 hover:from-amber-500/15 hover:to-sky-500/15 focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-amber-100">
              {isAnalyzingStyle ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
              ) : (
                <ScanLine className="h-4 w-4 text-amber-300" />
              )}
              ✨ Match My Writing Style
            </span>
            <span className="text-xs font-normal leading-relaxed text-slate-400">
              Upload past notebook photo — matches ink, slant &amp; handwriting family
            </span>
          </button>

          {matchedStyle && (
            <div className="mt-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 text-xs text-slate-300">
                  <p className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full ring-1 ring-white/20"
                      style={{ backgroundColor: matchedStyle.inkHex }}
                    />
                    Ink {matchedStyle.inkHex}
                  </p>
                  <p>Slant {matchedStyle.slantDegrees.toFixed(1)}°</p>
                  <p>Noise {(matchedStyle.noiseIntensity * 100).toFixed(0)}%</p>
                  <p>
                    Font{' '}
                    {FONT_STYLES.find((f) => f.id === matchedStyle.fontClass)
                      ?.label ?? matchedStyle.fontClass}
                  </p>
                  {matchedStyle.fontCategory && (
                    <p className="text-slate-400">
                      Tag {matchedStyle.fontCategory}
                    </p>
                  )}
                  <p className="text-slate-400">
                    {getBucketLabel(
                      FONT_STYLES.find((f) => f.id === matchedStyle.fontClass)
                        ?.bucket ?? fontStyle.bucket,
                    )}
                  </p>
                  {!isPaid && (
                    <p className="pt-1 text-amber-300/90">
                      Preview unlocked · pay to export clean PDF
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onMatchedStyleChange?.(null)}
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-200"
                  aria-label="Clear matched style"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {styleError && (
            <p
              className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200"
              role="alert"
            >
              {styleError}
            </p>
          )}
        </div>

        {/* Paper Type */}
        <div className="mb-5">
          <FieldLabel icon={FileText}>Paper Type</FieldLabel>
          <select
            value={paperType.id}
            onChange={(e) =>
              onPaperTypeChange(PAPER_TYPES.find((p) => p.id === e.target.value)!)
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

        {/* Font Style — 12 families across 5 style buckets */}
        <div className="mb-5">
          <FieldLabel icon={Type}>Handwriting Style</FieldLabel>
          <select
            value={fontStyle.id}
            onChange={(e) =>
              onFontStyleChange(FONT_STYLES.find((f) => f.id === e.target.value)!)
            }
            className={selectClass}
          >
            {HANDWRITING_STYLE_BUCKETS.map((bucket) => (
              <optgroup key={bucket.id} label={bucket.label}>
                {FONT_STYLES.filter((f) => f.bucket === bucket.id).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div
            className={`mt-3 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-lg text-slate-100 ${fontStyle.className}`}
          >
            The quick brown fox
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {getBucketLabel(fontStyle.bucket)} · jitter{' '}
            {(fontStyle.layout.baselineJitter * 100).toFixed(0)}% · line{' '}
            {fontStyle.layout.lineSpaceScale.toFixed(2)}×
          </p>
        </div>
      </div>

      {/* Download FAB + footer */}
      <div className="border-t border-slate-800 px-6 py-4">
        <p
          className="mb-3 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2.5 text-xs leading-relaxed text-sky-100/90"
          role="note"
        >
          Each payment unlocks 1 specific assignment download. Modifying the text
          will require a new download pass.
        </p>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isExporting || isProcessingPayment}
          className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:from-sky-400 hover:to-indigo-500 hover:shadow-sky-500/40 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessingPayment ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <FileDown className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
          )}
          {isProcessingPayment
            ? 'Processing Secure Payment...'
            : isPaid
              ? 'Download Assignment PDF'
              : checkoutQuote.ctaLabel}
        </button>
        <p className="mt-3 text-center text-xs text-slate-500">
          {isProcessingPayment
            ? 'Confirming gateway · updating download permissions…'
            : isPaid
              ? checkoutQuote.paidLabel
              : `${checkoutQuote.tier_type === 'premium' ? 'Premium' : 'Standard'} · ₹${checkoutQuote.amountInr}`}
        </p>
      </div>
    </aside>
  );
}
