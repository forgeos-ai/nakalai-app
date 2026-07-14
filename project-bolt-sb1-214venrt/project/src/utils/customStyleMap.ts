/**
 * Client-side Match My Style character-patch matrix (A–Z, a–z grid).
 * Session store: Map<string, HTMLCanvasElement> — no external APIs.
 */

import {
  sliceGlyphsFromImageData,
  type BoundingBox,
} from './glyphSlicer';

export type CustomStyleMap = Map<string, HTMLCanvasElement>;

export const CUSTOM_PATCH_GLOBAL_SCALE = 0.9;
export const CUSTOM_PATCH_TRACKING_CUSHION_PX = 1;

const GRID_CHARS_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const GRID_CHARS_LOWER = 'abcdefghijklmnopqrstuvwxyz';

let customStyleMap: CustomStyleMap = new Map();
let customStyleActive = false;
let customStyleRevision = 0;
let medianPatchHeight = 24;

export function setCustomStyleSampleText(_text: string): void {
  /* reserved for frequency-aware mapping */
}

export function isCustomStyleActive(): boolean {
  return customStyleActive && customStyleMap.size > 0;
}

export function getCustomStyleMap(): CustomStyleMap {
  return customStyleMap;
}

export function getCustomStyleRevision(): number {
  return customStyleRevision;
}

export function clearCustomStyleMap(): void {
  customStyleMap = new Map();
  customStyleActive = false;
  customStyleRevision += 1;
  medianPatchHeight = 24;
}

function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!isLikelyImageFile(file)) {
      reject(new Error('Not an image file'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    const cleanup = () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
    };
    img.onload = () => {
      cleanup();
      resolve(img);
    };
    img.onerror = () => {
      cleanup();
      reject(new Error('Image failed to load'));
    };
    img.src = url;
  });
}

function cropPatchToCanvas(
  source: HTMLCanvasElement,
  box: BoundingBox,
): HTMLCanvasElement {
  const pad = 1;
  const sx = Math.max(0, Math.floor(box.x - pad));
  const sy = Math.max(0, Math.floor(box.y - pad));
  const sw = Math.max(
    1,
    Math.min(source.width - sx, Math.ceil(box.width + pad * 2)),
  );
  const sh = Math.max(
    1,
    Math.min(source.height - sy, Math.ceil(box.height + pad * 2)),
  );

  const patch = document.createElement('canvas');
  patch.width = sw;
  patch.height = sh;
  const pctx = patch.getContext('2d');
  if (!pctx) return patch;
  pctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  return patch;
}

function sliceTemplateGrid(
  imageW: number,
  imageH: number,
): Array<{ char: string; box: BoundingBox }> {
  const cols = 26;
  const rows = 2;
  const cellW = imageW / cols;
  const cellH = imageH / rows;
  const pad = Math.min(cellW, cellH) * 0.06;
  const out: Array<{ char: string; box: BoundingBox }> = [];

  for (let i = 0; i < 26; i++) {
    out.push({
      char: GRID_CHARS_UPPER[i]!,
      box: {
        x: i * cellW + pad,
        y: pad,
        width: Math.max(1, cellW - pad * 2),
        height: Math.max(1, cellH - pad * 2),
      },
    });
  }

  for (let i = 0; i < 26; i++) {
    out.push({
      char: GRID_CHARS_LOWER[i]!,
      box: {
        x: i * cellW + pad,
        y: cellH + pad,
        width: Math.max(1, cellW - pad * 2),
        height: Math.max(1, cellH - pad * 2),
      },
    });
  }

  return out;
}

function commitFromGrid(
  canvas: HTMLCanvasElement,
  imageW: number,
  imageH: number,
): { map: CustomStyleMap; patchCount: number; revision: number } {
  const entries = sliceTemplateGrid(imageW, imageH);
  const next: CustomStyleMap = new Map();
  const heights: number[] = [];

  for (const { char, box } of entries) {
    const patch = cropPatchToCanvas(canvas, box);
    next.set(char, patch);
    heights.push(patch.height);
  }

  if (next.size === 0) {
    clearCustomStyleMap();
    throw new Error('No character cells found in the uploaded character sheet.');
  }

  heights.sort((a, b) => a - b);
  medianPatchHeight = heights[Math.floor(heights.length / 2)] ?? 24;

  customStyleMap = next;
  customStyleActive = true;
  customStyleRevision += 1;

  return {
    map: next,
    patchCount: next.size,
    revision: customStyleRevision,
  };
}

export function drawCustomStylePatch(
  ctx: CanvasRenderingContext2D,
  patch: HTMLCanvasElement,
  _char: string,
  fontSize: number,
): { width: number; height: number } {
  const scale =
    ((fontSize * 1.05) / Math.max(1, medianPatchHeight)) *
    CUSTOM_PATCH_GLOBAL_SCALE;
  const calculatedWidth = Math.max(1, patch.width * scale);
  const calculatedHeight = Math.max(1, patch.height * scale);
  const baselineAnchorY = -calculatedHeight * 0.82;

  ctx.drawImage(
    patch,
    0,
    baselineAnchorY,
    calculatedWidth,
    calculatedHeight,
  );

  return { width: calculatedWidth, height: calculatedHeight };
}

export async function buildCustomStyleMapFromFile(
  file: File,
  _sampleText = '',
): Promise<{ map: CustomStyleMap; patchCount: number; revision: number }> {
  const img = await loadImageFromFile(file);
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  const maxEdge = 960;
  const scale = Math.min(1, maxEdge / Math.max(naturalW, naturalH));
  const w = Math.max(1, Math.round(naturalW * scale));
  const h = Math.max(1, Math.round(naturalH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create analysis canvas');

  ctx.drawImage(img, 0, 0, w, h);

  try {
    return commitFromGrid(canvas, w, h);
  } catch (gridErr) {
    console.warn('[NakalAI] Grid slice fallback:', gridErr);
  }

  const imageData = ctx.getImageData(0, 0, w, h);
  const sliced = sliceGlyphsFromImageData(imageData);
  const next: CustomStyleMap = new Map();
  const keys = [
    ...GRID_CHARS_UPPER.split(''),
    ...GRID_CHARS_LOWER.split(''),
  ];

  sliced.characterBoxes.forEach((box, index) => {
    const ch = keys[index % keys.length]!;
    if (!next.has(ch)) {
      next.set(ch, cropPatchToCanvas(canvas, box));
    }
  });

  if (next.size === 0) {
    clearCustomStyleMap();
    throw new Error('No handwriting characters found in that photo.');
  }

  const heights = [...next.values()].map((p) => p.height).sort((a, b) => a - b);
  medianPatchHeight = heights[Math.floor(heights.length / 2)] ?? 24;
  customStyleMap = next;
  customStyleActive = true;
  customStyleRevision += 1;

  return {
    map: next,
    patchCount: next.size,
    revision: customStyleRevision,
  };
}
