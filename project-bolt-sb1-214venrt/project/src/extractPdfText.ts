import * as pdfjs from 'pdfjs-dist';
import { assertPdfSize } from './security/fileValidation';

/** User-facing message for encrypted / scanned / empty-text PDFs. */
export const PDF_EXTRACT_FALLBACK_MESSAGE =
  'Could not extract text. If this is a scanned photo PDF, please copy-paste the text instead.';

/** Hard single-file constraint — one PDF = one assignment = one payment. */
export const PDF_SINGLE_FILE_MESSAGE =
  'Only 1 PDF can be converted at a time.';

/**
 * Absolute CDN worker — relative Vite/`node_modules` worker URLs fail mobile
 * cross-origin / isolation checks. pdf.js 5+/6 ship ESM workers as `.min.mjs`
 * on cdnjs (matched to `pdfjs.version`). Skipped entirely on iOS (see below).
 */
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

const MIN_MEANINGFUL_CHARS = 8;

/** iPhone / iPad Safari (incl. desktop-class iPad) — Web Workers crash PDF parse. */
function isIosViewport(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS 13+ may report as Mac with touch
  return (
    navigator.platform === 'MacIntel' &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1
  );
}

/**
 * Bind WorkerMessageHandler on the main thread so pdf.js uses its fake-worker
 * path (no dedicated Worker). Equivalent to legacy `disableWorker: true`.
 */
async function bindMainThreadPdfWorker(): Promise<void> {
  const g = globalThis as typeof globalThis & {
    pdfjsWorker?: { WorkerMessageHandler?: unknown };
  };
  if (g.pdfjsWorker?.WorkerMessageHandler) return;

  const workerMod = await import('pdfjs-dist/build/pdf.worker.min.mjs');
  g.pdfjsWorker = workerMod as { WorkerMessageHandler?: unknown };
}

/**
 * Mobile file pickers often omit or rewrite MIME types — accept by
 * `application/pdf` OR a `.pdf` filename extension.
 */
export function isPdfFile(file: File | null | undefined): boolean {
  if (!file) return false;
  return (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  );
}

/**
 * Enforce exactly one file from an input/drop FileList.
 * Throws PDF_SINGLE_FILE_MESSAGE when more than one file is present.
 */
export function assertSinglePdfFile(
  files: FileList | File[] | null | undefined,
): File {
  const list = files
    ? Array.isArray(files)
      ? files
      : Array.from(files)
    : [];

  if (list.length > 1) {
    throw new Error(PDF_SINGLE_FILE_MESSAGE);
  }

  const file = list[0];
  if (!file || !isPdfFile(file)) {
    throw new Error(PDF_EXTRACT_FALLBACK_MESSAGE);
  }

  assertPdfSize(file);
  return file;
}

function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

type PdfDocument = Awaited<ReturnType<typeof pdfjs.getDocument>['promise']>;

/**
 * Load PDF. Non-iOS uses the CDN worker; iOS runs inline on the main UI
 * thread (`disableWorker: true` + main-thread WorkerMessageHandler) so Safari
 * never hits thread-isolation Worker crashes. Text extraction results match.
 */
async function loadPdfDocument(data: Uint8Array): Promise<PdfDocument> {
  try {
    const arrayBuffer = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    );

    if (isIosViewport()) {
      await bindMainThreadPdfWorker();
      // disableWorker is legacy; pdf.js 6 ignores unknown keys but we pass it
      // explicitly and force main-thread parsing via pdfjsWorker above.
      const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        disableWorker: true,
        useSystemFonts: true,
        disableFontFace: false,
        password: '',
      } as Parameters<typeof pdfjs.getDocument>[0] & {
        disableWorker?: boolean;
      });
      return await loadingTask.promise;
    }

    return await pdfjs.getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: false,
      password: '',
    }).promise;
  } catch (err) {
    console.warn('[NakalAI] PDF.js worker/document load failed:', err);
    // Soft degrade — callers catch PDF_EXTRACT_FALLBACK_MESSAGE without
    // tearing down the handwriting canvas.
    throw new Error(PDF_EXTRACT_FALLBACK_MESSAGE);
  }
}

/**
 * Collect text-layer promises per page. Individual page failures soft-skip
 * so a broken text layer never aborts the whole run or the canvas UI.
 */
async function collectPageTextLayers(pdf: PdfDocument): Promise<string[]> {
  const textLayerPromises: Promise<string | null>[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    textLayerPromises.push(
      (async () => {
        try {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          const line = content.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ')
            .replace(/[ \t]{2,}/g, ' ')
            .trim();
          return line || null;
        } catch (pageErr) {
          console.warn(
            `[NakalAI] PDF text layer failed on page ${pageNum}:`,
            pageErr,
          );
          return null;
        }
      })(),
    );
  }

  const settled = await Promise.allSettled(textLayerPromises);
  const pageTexts: string[] = [];
  for (const result of settled) {
    if (result.status === 'fulfilled' && result.value) {
      pageTexts.push(result.value);
    }
  }

  return pageTexts;
}

/**
 * Client-side PDF → plain text via pdf.js (zero infrastructure).
 * Accepts exactly one File — callers must gate multi-file selection with
 * `assertSinglePdfFile` first. Returned text is meant to REPLACE (not append)
 * the Assignment Text state so 1 PDF = 1 assignment layout.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  // Mobile explorers often pass empty/modified MIME — fall back to extension.
  const isPDF =
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf');

  if (!isPDF) {
    throw new Error(PDF_EXTRACT_FALLBACK_MESSAGE);
  }

  let data: ArrayBuffer;
  try {
    data = await file.arrayBuffer();
  } catch {
    throw new Error(PDF_EXTRACT_FALLBACK_MESSAGE);
  }

  let pdf: PdfDocument | null = null;
  try {
    pdf = await loadPdfDocument(new Uint8Array(data));
    const pageTexts = await collectPageTextLayers(pdf);
    const combined = normalizeExtractedText(pageTexts.join('\n\n'));

    if (combined.replace(/\s/g, '').length < MIN_MEANINGFUL_CHARS) {
      // Likely a scanned/image-only PDF with no text layer
      throw new Error(PDF_EXTRACT_FALLBACK_MESSAGE);
    }

    return combined;
  } catch (err) {
    if (err instanceof Error && err.message === PDF_EXTRACT_FALLBACK_MESSAGE) {
      throw err;
    }
    console.error('PDF text extraction failed:', err);
    throw new Error(PDF_EXTRACT_FALLBACK_MESSAGE);
  } finally {
    if (pdf) {
      try {
        await pdf.cleanup();
      } catch {
        // ignore cleanup errors — never tear down the canvas UI
      }
    }
  }
}
