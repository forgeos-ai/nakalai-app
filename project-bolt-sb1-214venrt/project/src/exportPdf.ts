import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { A4_WIDTH_MM, A4_HEIGHT_MM } from './pageGeometry';
import { FREE_PAGE_CAP } from './clientGuards';

const CAPTURE_SCALE = 2;
const A4_PAGE_SELECTOR = '[data-a4-page]';

export type ExportPdfOptions = {
  mode?: 'free' | 'paid';
  maxPages?: number;
  skipWatermark?: boolean;
};

/**
 * Capture rendered A4 page previews and assemble a multi-page PDF.
 * Enforces server-authorized page caps — never exports beyond maxPages.
 */
export async function exportAssignmentPdf(
  options: ExportPdfOptions = {},
): Promise<void> {
  const mode = options.mode ?? 'free';
  const maxPages =
    options.maxPages ??
    (mode === 'free' ? FREE_PAGE_CAP : Number.POSITIVE_INFINITY);
  const skipWatermark = options.skipWatermark ?? mode === 'paid';

  const pageElements = Array.from(
    document.querySelectorAll<HTMLElement>(A4_PAGE_SELECTOR),
  );

  if (pageElements.length === 0) {
    throw new Error('No assignment pages found to export.');
  }

  const exportCount = Math.min(pageElements.length, maxPages);
  if (exportCount < 1) {
    throw new Error('No pages authorized for export.');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let i = 0; i < exportCount; i++) {
    const el = pageElements[i]!;

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const canvas = await html2canvas(el, {
      scale: CAPTURE_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: el.offsetWidth,
      height: el.offsetHeight,
      windowWidth: el.offsetWidth,
      windowHeight: el.offsetHeight,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      ignoreElements: (node) => {
        if (!(node instanceof HTMLElement)) return false;
        if (node.hasAttribute('data-pdf-ignore')) {
          return skipWatermark;
        }
        return false;
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      pdf.addPage([A4_WIDTH_MM, A4_HEIGHT_MM], 'portrait');
    }

    pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'FAST');
  }

  pdf.save('assignment.pdf');
}
