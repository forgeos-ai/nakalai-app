/**
 * Structural character grid segmentation — performance-focused async utility.
 *
 * Pipeline:
 *   File | Image → decode → analysis canvas → centered 60% ROI
 *   → high-contrast binarization (ink = deep black, paper = bright white)
 *   → 1×6 horizontal cell grid (a, e, g, t, s, m)
 *   → ink-boundary trim (crop structural white margins)
 *   → offscreen HTMLCanvasElement per letter
 *
 * Zero cloud / API dependencies. Does not classify fonts.
 */

import { getCenteredRoiBounds } from './styleExtractor';
import { binarizeImageData, INK, PAPER } from './glyphSlicer';

/** Key characters in left→right 1×6 grid order. */
export const MATRIX_SLICER_CHARS = ['a', 'e', 'g', 't', 's', 'm'] as const;

export type MatrixSlicerChar = (typeof MATRIX_SLICER_CHARS)[number];

/** Character → offscreen canvas holding the cropped binary glyph. */
export type LetterCanvasDictionary = {
  [K in MatrixSlicerChar]: HTMLCanvasElement;
};

/** Session store for the latest sliced glyph canvases. */
export type LetterPatchSession = {
  canvases: LetterCanvasDictionary | null;
  sourceWidth: number;
  sourceHeight: number;
  roiWidth: number;
  roiHeight: number;
  updatedAt: number;
};

export const letterPatchSession: LetterPatchSession = {
  canvases: null,
  sourceWidth: 0,
  sourceHeight: 0,
  roiWidth: 0,
  roiHeight: 0,
  updatedAt: 0,
};

export function clearLetterPatchSession(): void {
  letterPatchSession.canvases = null;
  letterPatchSession.sourceWidth = 0;
  letterPatchSession.sourceHeight = 0;
  letterPatchSession.roiWidth = 0;
  letterPatchSession.roiHeight = 0;
  letterPatchSession.updatedAt = 0;
}

/** Prefer higher resolution for clean glyph buffers. */
const MAX_ANALYSIS_EDGE = 720;
/** Minimum crop size when a cell has no detectable ink. */
const EMPTY_CELL_FALLBACK_PX = 8;
/** Padding (px) kept around ink bbox after trim. */
const INK_CROP_PAD = 1;

function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!isLikelyImageFile(file)) {
      reject(new Error('matrixSlicer: not an image file'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    const cleanup = () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    };
    img.onload = () => {
      const finish = () => {
        cleanup();
        resolve(img);
      };
      if (typeof img.decode === 'function') {
        img.decode().then(finish).catch(finish);
      } else {
        finish();
      }
    };
    img.onerror = () => {
      cleanup();
      reject(new Error('matrixSlicer: image load failed'));
    };
    img.src = url;
  });
}

/**
 * Draw source into an analysis canvas and return RGBA ImageData for the
 * centered inner-60% ROI (20% inset on each edge).
 */
function extractRoiImageData(img: HTMLImageElement): {
  roi: ImageData;
  fullW: number;
  fullH: number;
} {
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  if (!naturalW || !naturalH) {
    throw new Error('matrixSlicer: zero image dimensions');
  }

  const scale = Math.min(1, MAX_ANALYSIS_EDGE / Math.max(naturalW, naturalH));
  const w = Math.max(1, Math.round(naturalW * scale));
  const h = Math.max(1, Math.round(naturalH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('matrixSlicer: no 2d context');

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const bounds = getCenteredRoiBounds(w, h);
  const roi = ctx.getImageData(bounds.x0, bounds.y0, bounds.rw, bounds.rh);
  return { roi, fullW: w, fullH: h };
}

/**
 * High-contrast absolute black/white mask from adaptive binarization.
 * Ink → 0, paper → 255.
 */
function highContrastBinary(roi: ImageData): Uint8Array {
  return binarizeImageData(roi);
}

type InkBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Detect ink boundaries inside a cell binary buffer (row-major, cellW×cellH).
 */
export function detectInkBounds(
  cellBinary: Uint8Array,
  cellW: number,
  cellH: number,
): InkBounds | null {
  let minX = cellW;
  let minY = cellH;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < cellH; y++) {
    const row = y * cellW;
    for (let x = 0; x < cellW; x++) {
      if (cellBinary[row + x] === INK) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return null;
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

/**
 * Copy a rectangular region from the ROI binary into a cell buffer.
 */
function extractCellBinary(
  binary: Uint8Array,
  roiW: number,
  x0: number,
  y0: number,
  cellW: number,
  cellH: number,
): Uint8Array {
  const cell = new Uint8Array(cellW * cellH);
  for (let y = 0; y < cellH; y++) {
    const src = (y0 + y) * roiW + x0;
    const dst = y * cellW;
    for (let x = 0; x < cellW; x++) {
      cell[dst + x] = binary[src + x] ?? PAPER;
    }
  }
  return cell;
}

/**
 * Build an offscreen canvas from a binary cell, cropped to ink bounds
 * (structural white margins removed). Empty cells get a tiny white canvas.
 */
function cellBinaryToCroppedCanvas(
  cellBinary: Uint8Array,
  cellW: number,
  cellH: number,
): HTMLCanvasElement {
  const ink = detectInkBounds(cellBinary, cellW, cellH);

  let sx = 0;
  let sy = 0;
  let cw = cellW;
  let ch = cellH;

  if (ink) {
    sx = Math.max(0, ink.x - INK_CROP_PAD);
    sy = Math.max(0, ink.y - INK_CROP_PAD);
    const ex = Math.min(cellW, ink.x + ink.width + INK_CROP_PAD);
    const ey = Math.min(cellH, ink.y + ink.height + INK_CROP_PAD);
    cw = Math.max(1, ex - sx);
    ch = Math.max(1, ey - sy);
  } else {
    cw = EMPTY_CELL_FALLBACK_PX;
    ch = EMPTY_CELL_FALLBACK_PX;
  }

  const rgba = new Uint8ClampedArray(cw * ch * 4);

  if (ink) {
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const src = (sy + y) * cellW + (sx + x);
        const v = cellBinary[src] === INK ? 0 : 255;
        const o = (y * cw + x) * 4;
        rgba[o] = v;
        rgba[o + 1] = v;
        rgba[o + 2] = v;
        rgba[o + 3] = 255;
      }
    }
  } else {
    rgba.fill(255);
    for (let i = 3; i < rgba.length; i += 4) rgba[i] = 255;
  }

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('matrixSlicer: cell canvas context failed');
  ctx.putImageData(new ImageData(rgba, cw, ch), 0, 0);
  return canvas;
}

/**
 * Divide the ROI binary into a 1×6 horizontal grid and emit trimmed
 * offscreen canvases for a, e, g, t, s, m.
 */
export function splitRoiIntoLetterCanvases(
  binary: Uint8Array,
  roiW: number,
  roiH: number,
): LetterCanvasDictionary {
  const cellCount = MATRIX_SLICER_CHARS.length;
  const baseW = Math.floor(roiW / cellCount);
  const remainder = roiW - baseW * cellCount;

  const out = {} as LetterCanvasDictionary;
  let xCursor = 0;

  for (let i = 0; i < cellCount; i++) {
    const cellW = baseW + (i < remainder ? 1 : 0);
    const char = MATRIX_SLICER_CHARS[i];
    const cellBinary = extractCellBinary(
      binary,
      roiW,
      xCursor,
      0,
      cellW,
      roiH,
    );
    out[char] = cellBinaryToCroppedCanvas(cellBinary, cellW, roiH);
    xCursor += cellW;
  }

  return out;
}

function commitLetterCanvases(
  canvases: LetterCanvasDictionary,
  fullW: number,
  fullH: number,
  roiW: number,
  roiH: number,
): void {
  letterPatchSession.canvases = canvases;
  letterPatchSession.sourceWidth = fullW;
  letterPatchSession.sourceHeight = fullH;
  letterPatchSession.roiWidth = roiW;
  letterPatchSession.roiHeight = roiH;
  letterPatchSession.updatedAt = Date.now();
}

/**
 * Async structural character grid slicer.
 *
 * @returns `{ a, e, g, t, s, m }` — each value is an offscreen
 *   `HTMLCanvasElement` with the cropped high-contrast letter shape.
 *
 * @example
 *   const glyphs = await sliceLetterMatrices(file);
 *   // glyphs.a.width / glyphs.a.getContext('2d')…
 */
export async function sliceLetterMatrices(
  source: File | HTMLImageElement,
): Promise<LetterCanvasDictionary> {
  const img =
    source instanceof HTMLImageElement
      ? source
      : await loadImageFromFile(source);

  const { roi, fullW, fullH } = extractRoiImageData(img);
  const binary = highContrastBinary(roi);
  const canvases = splitRoiIntoLetterCanvases(binary, roi.width, roi.height);
  commitLetterCanvases(canvases, fullW, fullH, roi.width, roi.height);
  return canvases;
}

/** Alias matching the segmentation-engine naming. */
export const sliceCharacterMatrices = sliceLetterMatrices;

export function getLetterCanvasDictionary(): LetterCanvasDictionary | null {
  return letterPatchSession.canvases;
}

export function getLetterCanvas(
  char: MatrixSlicerChar,
): HTMLCanvasElement | null {
  return letterPatchSession.canvases?.[char] ?? null;
}

export function isMatrixSlicerChar(ch: string): ch is MatrixSlicerChar {
  return (MATRIX_SLICER_CHARS as readonly string[]).includes(ch.toLowerCase());
}

/**
 * Resolve a text character to its session glyph canvas (case-insensitive).
 * Returns null when missing, empty, or the tiny all-paper fallback cell.
 */
export function getLetterCanvasForChar(ch: string): HTMLCanvasElement | null {
  if (!isMatrixSlicerChar(ch)) return null;
  const key = ch.toLowerCase() as MatrixSlicerChar;
  const canvas = letterPatchSession.canvases?.[key] ?? null;
  if (!canvas || canvas.width < 2 || canvas.height < 2) return null;
  // Skip empty-cell fallback (solid white, no ink)
  if (canvas.width <= EMPTY_CELL_FALLBACK_PX && canvas.height <= EMPTY_CELL_FALLBACK_PX) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasInk = false;
    for (let i = 0; i < sample.length; i += 4) {
      if (sample[i] < 128) {
        hasInk = true;
        break;
      }
    }
    if (!hasInk) return null;
  }
  return canvas;
}

/**
 * Tint a binary black/white glyph canvas to the active ink hex for drawImage.
 * Paper stays transparent so stamps composite cleanly on the notebook.
 */
export function createTintedStampCanvas(
  source: HTMLCanvasElement,
  inkHex: string,
): HTMLCanvasElement | null {
  const w = source.width;
  const h = source.height;
  if (w < 1 || h < 1) return null;

  const srcCtx = source.getContext('2d');
  if (!srcCtx) return null;
  const src = srcCtx.getImageData(0, 0, w, h);
  const { r, g, b } = hexToRgb(inkHex);
  const out = new Uint8ClampedArray(w * h * 4);

  for (let i = 0; i < src.data.length; i += 4) {
    const isInk = src.data[i] < 128;
    if (isInk) {
      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
      out[i + 3] = 255;
    } else {
      out[i + 3] = 0;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.putImageData(new ImageData(out, w, h), 0, 0);
  return canvas;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 29, g: 42, b: 74 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
