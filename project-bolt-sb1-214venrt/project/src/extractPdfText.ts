import './pdfPromisePolyfill';
import * as pdfjs from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { assertPdfSize } from './security/fileValidation';
import { ensurePromiseWithResolvers } from './pdfPromisePolyfill';

/** User-facing message for encrypted / scanned / empty-text PDFs. */
export const PDF_EXTRACT_FALLBACK_MESSAGE =
  'Could not extract text. If this is a scanned photo PDF, please copy-paste the text instead.';

/** Hard single-file constraint — one PDF = one assignment = one payment. */
export const PDF_SINGLE_FILE_MESSAGE =
  'Only 1 PDF can be converted at a time.';

const MIN_MEANINGFUL_CHARS = 8;

/** Prefer the Vite-bundled worker (same-origin) over CDN for mobile Safari CORS. */
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

/** iPhone / iPad Safari (incl. desktop-class iPad). */
function isIosViewport(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return (
    navigator.platform === 'MacIntel' &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1
  );
}

/** Any Safari engine (iOS or macOS) — module workers are unreliable. */
function isSafariEngine(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // Chrome/Android/CriOS/Firefox also include "Safari" in UA — exclude them.
  const isSafari =
    /Safari/i.test(ua) &&
    !/Chrome|CriOS|Chromium|Android|Firefox|FxiOS|Edg|OPR|Opera/i.test(ua);
  return isSafari || isIosViewport();
}

/**
 * Bind WorkerMessageHandler on the main thread so pdf.js skips
 * `new Worker(..., { type: "module" })` and uses its fake-worker path.
 * Required for Safari / iOS (module workers are unreliable).
 */
async function bindMainThreadPdfWorker(): Promise<void> {
  ensurePromiseWithResolvers();
  const g = globalThis as typeof globalThis & {
    pdfjsWorker?: { WorkerMessageHandler?: unknown };
  };
  if (g.pdfjsWorker?.WorkerMessageHandler) return;

  const workerMod = await import('pdfjs-dist/build/pdf.worker.min.mjs');
  const handler =
    (workerMod as { WorkerMessageHandler?: unknown }).WorkerMessageHandler ??
    (workerMod as { default?: { WorkerMessageHandler?: unknown } }).default
      ?.WorkerMessageHandler;
  if (!handler) {
    throw new Error('PDF.js WorkerMessageHandler unavailable');
  }
  g.pdfjsWorker = { WorkerMessageHandler: handler };
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

/** Owned Uint8Array copy — avoids Safari SharedArrayBuffer / detached buffer issues. */
function ownedPdfBytes(data: Uint8Array): Uint8Array {
  return data.slice();
}

async function openPdfDocument(bytes: Uint8Array): Promise<PdfDocument> {
  ensurePromiseWithResolvers();
  // Fresh copy so Safari never sees a detached/shared backing store.
  const data = new Uint8Array(bytes.byteLength);
  data.set(bytes);
  return pdfjs.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: false,
    password: '',
  }).promise;
}

/**
 * Load PDF. Safari/iOS always uses the main-thread fake worker.
 * Other browsers try the bundled worker first, then fall back to main-thread
 * so extraction stays identical across platforms.
 */
async function loadPdfDocument(data: Uint8Array): Promise<PdfDocument> {
  const bytes = ownedPdfBytes(data);

  const loadMainThread = async (): Promise<PdfDocument> => {
    await bindMainThreadPdfWorker();
    return openPdfDocument(bytes);
  };

  const loadWithWorker = async (): Promise<PdfDocument> => {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
    return openPdfDocument(bytes);
  };

  try {
    if (isSafariEngine()) {
      return await loadMainThread();
    }
    try {
      return await loadWithWorker();
    } catch (workerErr) {
      console.warn(
        '[NakalAI] PDF.js worker path failed; retrying on main thread:',
        workerErr,
      );
      return await loadMainThread();
    }
  } catch (err) {
    console.warn('[NakalAI] PDF.js worker/document load failed:', err);
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
 * Read file bytes with ArrayBuffer first, FileReader fallback for older Safari.
 */
async function readFileBytes(file: File): Promise<Uint8Array> {
  try {
    const buffer = await file.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (result instanceof ArrayBuffer) {
          resolve(new Uint8Array(result));
          return;
        }
        reject(new Error(PDF_EXTRACT_FALLBACK_MESSAGE));
      };
      reader.onerror = () => reject(new Error(PDF_EXTRACT_FALLBACK_MESSAGE));
      reader.readAsArrayBuffer(file);
    });
  }
}

/**
 * Client-side PDF → plain text via pdf.js (zero infrastructure).
 * Accepts exactly one File — callers must gate multi-file selection with
 * `assertSinglePdfFile` first. Returned text is meant to REPLACE (not append)
 * the Assignment Text state so 1 PDF = 1 assignment layout.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const isPDF =
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf');

  if (!isPDF) {
    throw new Error(PDF_EXTRACT_FALLBACK_MESSAGE);
  }

  let data: Uint8Array;
  try {
    data = await readFileBytes(file);
  } catch {
    throw new Error(PDF_EXTRACT_FALLBACK_MESSAGE);
  }

  let pdf: PdfDocument | null = null;
  try {
    pdf = await loadPdfDocument(data);
    const pageTexts = await collectPageTextLayers(pdf);
    const combined = normalizeExtractedText(pageTexts.join('\n\n'));

    if (combined.replace(/\s/g, '').length < MIN_MEANINGFUL_CHARS) {
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
