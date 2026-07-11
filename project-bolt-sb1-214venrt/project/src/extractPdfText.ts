import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

/** User-facing message for encrypted / scanned / empty-text PDFs. */
export const PDF_EXTRACT_FALLBACK_MESSAGE =
  'Could not extract text. If this is a scanned photo PDF, please copy-paste the text instead.';

/** Hard single-file constraint — one PDF = one assignment = one payment. */
export const PDF_SINGLE_FILE_MESSAGE =
  'Only 1 PDF can be converted at a time.';

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const MIN_MEANINGFUL_CHARS = 8;

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
  if (!file) {
    throw new Error(PDF_EXTRACT_FALLBACK_MESSAGE);
  }

  return file;
}

function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Client-side PDF → plain text via pdf.js (zero infrastructure).
 * Accepts exactly one File — callers must gate multi-file selection with
 * `assertSinglePdfFile` first. Returned text is meant to REPLACE (not append)
 * the Assignment Text state so 1 PDF = 1 assignment layout.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  if (!file || file.type !== 'application/pdf') {
    // Some browsers omit MIME — also accept by extension
    if (!file?.name?.toLowerCase().endsWith('.pdf')) {
      throw new Error(PDF_EXTRACT_FALLBACK_MESSAGE);
    }
  }

  let data: ArrayBuffer;
  try {
    data = await file.arrayBuffer();
  } catch {
    throw new Error(PDF_EXTRACT_FALLBACK_MESSAGE);
  }

  let pdf;
  try {
    const loadingTask = getDocument({
      data: new Uint8Array(data),
      useSystemFonts: true,
      disableFontFace: false,
      // Encrypted PDFs without a password fail here — surface the soft warning
      password: '',
    });
    pdf = await loadingTask.promise;
  } catch (err) {
    console.error('PDF load failed:', err);
    throw new Error(PDF_EXTRACT_FALLBACK_MESSAGE);
  }

  try {
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const line = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
      if (line) pageTexts.push(line);
    }

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
    try {
      await pdf.cleanup();
    } catch {
      // ignore cleanup errors
    }
  }
}
