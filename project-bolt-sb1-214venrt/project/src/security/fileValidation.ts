/** Shared upload limits — enforced client-side and mirrored on server routes when added. */

export const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

const PDF_MAGIC = '%PDF-';
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

export const PDF_SIZE_ERROR = 'PDF file is too large. Maximum size is 15 MB.';
export const IMAGE_SIZE_ERROR = 'Image file is too large. Maximum size is 8 MB.';
export const IMAGE_TYPE_ERROR =
  'Please upload a character sheet image (PNG or JPEG).';

export function assertPdfSize(file: File): void {
  if (file.size > MAX_PDF_BYTES) {
    throw new Error(PDF_SIZE_ERROR);
  }
}

export function assertImageSize(file: File): void {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(IMAGE_SIZE_ERROR);
  }
}

async function readHeader(file: File, length: number): Promise<Uint8Array> {
  const slice = file.slice(0, length);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function assertPdfMagicBytes(file: File): Promise<void> {
  const header = await readHeader(file, 5);
  const text = String.fromCharCode(...header);
  if (!text.startsWith(PDF_MAGIC)) {
    throw new Error('Invalid PDF file.');
  }
}

function matchesMagic(header: Uint8Array, magic: number[]): boolean {
  if (header.length < magic.length) return false;
  return magic.every((byte, index) => header[index] === byte);
}

export async function assertImageMagicBytes(file: File): Promise<void> {
  const header = await readHeader(file, 8);
  const isJpeg = matchesMagic(header, JPEG_MAGIC);
  const isPng = matchesMagic(header, PNG_MAGIC);
  if (!isJpeg && !isPng) {
    throw new Error(IMAGE_TYPE_ERROR);
  }
}

export function isAllowedImageMime(type: string): boolean {
  return type === 'image/jpeg' || type === 'image/png' || type === 'image/jpg';
}

export function isAllowedImageFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    isAllowedImageMime(file.type) ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png')
  );
}

export async function validatePdfUpload(file: File): Promise<void> {
  assertPdfSize(file);
  await assertPdfMagicBytes(file);
}

export async function validateImageUpload(file: File): Promise<void> {
  assertImageSize(file);
  if (!isAllowedImageFile(file)) {
    throw new Error(IMAGE_TYPE_ERROR);
  }
  await assertImageMagicBytes(file);
}
