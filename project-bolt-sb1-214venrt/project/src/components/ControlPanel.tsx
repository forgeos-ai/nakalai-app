import { useState } from 'react';
import { INK_COLORS, PAPER_TYPES, FONT_STYLES } from '../constants';
import type { InkColor, PaperType, FontStyle } from '../constants';
import { PenLine, FileText, Type, Sparkles, FileDown, Loader2 } from 'lucide-react';
import { exportAssignmentPdf } from '../exportPdf';
import { getStudentProfile } from '../studentProfile';
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
}: ControlPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);

  const runPdfExport = async () => {
    if (isExporting) return;
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

  const handleDownloadPdf = () => {
    if (isExporting) return;
    if (!getStudentProfile()) {
      setShowLeadModal(true);
      return;
    }
    void runPdfExport();
  };

  const handleLeadSubmit = () => {
    setShowLeadModal(false);
    void runPdfExport();
  };

  return (
    <aside className="relative flex h-full w-full flex-col bg-slate-900">
      <LeadCaptureModal open={showLeadModal} onSubmit={handleLeadSubmit} />

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
        {/* Textarea */}
        <div className="mb-6">
          <FieldLabel icon={Sparkles}>Assignment Text</FieldLabel>
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Paste your assignment text here..."
            className="h-64 w-full resize-none rounded-lg border border-slate-700 bg-slate-800 p-4 text-sm leading-relaxed text-slate-100 placeholder-slate-500 transition-colors hover:border-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>{text.length} characters</span>
            <span>{text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
          </div>
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

        {/* Font Style */}
        <div className="mb-5">
          <FieldLabel icon={Type}>Font Style</FieldLabel>
          <select
            value={fontStyle.id}
            onChange={(e) =>
              onFontStyleChange(FONT_STYLES.find((f) => f.id === e.target.value)!)
            }
            className={selectClass}
          >
            {FONT_STYLES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <div
            className={`mt-3 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-lg text-slate-100 ${fontStyle.className}`}
          >
            The quick brown fox
          </div>
        </div>
      </div>

      {/* Download FAB + footer */}
      <div className="border-t border-slate-800 px-6 py-4">
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isExporting}
          className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:from-sky-400 hover:to-indigo-500 hover:shadow-sky-500/40 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileDown className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
          Download Assignment PDF
        </button>
        <p className="mt-3 text-center text-xs text-slate-500">
          Live preview updates as you type
        </p>
      </div>
    </aside>
  );
}
