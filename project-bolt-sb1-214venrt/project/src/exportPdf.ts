import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { A4_WIDTH_MM, A4_HEIGHT_MM } from './pageGeometry';

const CAPTURE_SCALE = 2;
const A4_PAGE_SELECTOR = '[data-a4-page]';

/**
 * Capture every rendered A4 page preview on screen and assemble a multi-page PDF.
 * Uses html2canvas at 2× scale for sharp print output, then downloads assignment.pdf.
 */
export async function exportAssignmentPdf(): Promise<void> {
  const pageElements = Array.from(
    document.querySelectorAll<HTMLElement>(A4_PAGE_SELECTOR),
  );

  if (pageElements.length === 0) {
    throw new Error('No assignment pages found to export.');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let i = 0; i < pageElements.length; i++) {
    const el = pageElements[i];

    // Yield to the browser between pages so the UI stays responsive
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const canvas = await html2canvas(el, {
      scale: CAPTURE_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      // Capture the fixed A4 CSS box (same geometry as preview)
      width: el.offsetWidth,
      height: el.offsetHeight,
      windowWidth: el.offsetWidth,
      windowHeight: el.offsetHeight,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      // Keep paid PDF pristine — skip preview watermark (and any marked nodes)
      ignoreElements: (node) =>
        node instanceof HTMLElement && node.hasAttribute('data-pdf-ignore'),
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      pdf.addPage([A4_WIDTH_MM, A4_HEIGHT_MM], 'portrait');
    }

    pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'FAST');
  }

  pdf.save('assignment.pdf');
}
