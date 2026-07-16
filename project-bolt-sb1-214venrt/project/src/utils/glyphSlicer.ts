/**
 * Performance-optimized async canvas vision module — local handwriting
 * analysis with zero cloud / API dependencies.
 *
 * Pipeline (Promise):
 *   File → decode → offscreen canvas → ctx.getImageData → grayscale
 *   → adaptive neighborhood threshold → horizontal projection profile
 *   → strokeThickness + connectivityRatio → layout variance callbacks
 */

/** Absolute ink / paper after binarization. */
export const INK = 0;
export const PAPER = 255;

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** One isolated character crop as a binary (0/255) matrix. */
export type GlyphMatrix = {
  width: number;
  height: number;
  /** Row-major binary pixels: 0 = ink, 255 = paper */
  pixels: Uint8Array;
  bbox: BoundingBox;
  /** Line index this glyph was sliced from */
  lineIndex: number;
};

/** Frequency-ranked glyph profile kept in session state. */
export type ExtractedGlyphProfile = {
  /** Compact signature for frequency clustering (normalized ink mask). */
  signature: string;
  /** Representative binary matrix (canonical size). */
  matrix: GlyphMatrix;
  /** How often this profile was isolated in the page. */
  frequency: number;
  /** All raw bounding boxes that matched this signature. */
  instances: BoundingBox[];
};

/**
 * Document layout geometry from the horizontal projection profile.
 */
export type DocumentLayoutGeometry = {
  /** Y of first text-line top (top margin of handwriting block). */
  topMarginPx: number;
  /** Mean baseline Y (band bottom) across detected lines. */
  meanBaselinePx: number;
  /** Mean vertical gap between consecutive line bands. */
  meanVerticalSpacingPx: number;
  /** Per-line baseline heights (bottom of each band). */
  baselineHeights: number[];
  /** Row-by-row ink density histogram (length = image height). */
  rowDensityHistogram: Float32Array;
};

/**
 * Per-line / page structural metrics from dark-pixel run-length analysis.
 * Primary fields match the product contract; aliases kept for callers.
 */
export type StrokeStructureMetrics = {
  /**
   * Average pixel run-length of contiguous dark ink blocks.
   * Spec name: strokeThickness
   */
  strokeThickness: number;
  /**
   * Density of continuous ink paths vs whitespace breaks in a row
   * (high = cursive, low = block print). Spec name: connectivityRatio
   */
  connectivityRatio: number;
  /** @deprecated Use strokeThickness */
  avgStrokeThickness: number;
  /** @deprecated Use connectivityRatio */
  connectivityDensity: number;
  /** Inverse of connectivity — whitespace break ratio. */
  breakDensity: number;
  /** Mean number of separate dark runs per ink-bearing row. */
  avgRunsPerRow: number;
  /** How many text lines contributed to the aggregate. */
  lineCount: number;
  /** Projection-derived layout geometry. */
  layout: DocumentLayoutGeometry;
};

/**
 * Layout variance scale factors — pushed via state callback after analysis.
 */
export type LayoutVarianceScales = {
  /** Stroke-weight / pen bias (heavier ink → higher). */
  strokeWeightScale: number;
  /** Sampling / temperature variance (print breaks → higher). */
  varianceScale: number;
  /** Ruled line-height multiplier. */
  lineHeightScale: number;
  /** Margin inset feel from top-margin geometry. */
  marginScale: number;
  strokeThickness: number;
  connectivityRatio: number;
};

/**
 * Bias / variance weights for the local handwriting AI execution matrix.
 * Derived from stroke thickness + connectivity — no cloud dependency.
 */
export type AiExecutionWeights = {
  /** Stroke-weight bias (heavier pen → higher). Typical 0.7–2.5. */
  bias: number;
  /** Sampling / temperature variance. Typical 0.25–1.6. */
  variance: number;
  /** Line-height scale factor. */
  lineHeightScale: number;
  /** Clean callback payload for layout variance consumers. */
  layoutScales: LayoutVarianceScales;
  /** Raw structural inputs used to compute the weights. */
  structure: StrokeStructureMetrics;
};

/** Listener notified whenever slicer commits new layout variance scales. */
export type LayoutMetricsCallback = (scales: LayoutVarianceScales) => void;

export type GlyphSliceResult = {
  width: number;
  height: number;
  /** Binary image after adaptive threshold (0 = ink, 255 = paper). */
  binary: Uint8Array;
  /** Detected text-line bands [top, bottom) in image Y. */
  lineBands: { top: number; bottom: number }[];
  /** Every character bounding box found. */
  characterBoxes: BoundingBox[];
  /** Top-N frequency-ranked glyph profiles (session snapshot). */
  extractedGlyphs: ExtractedGlyphProfile[];
  /** Aggregate stroke thickness + connectivity. */
  structure: StrokeStructureMetrics;
  /** Direct AI matrix weights (bias / variance). */
  aiWeights: AiExecutionWeights;
};

/** Session store — top 15 glyphs + structural AI weights. */
export type ExtractedGlyphsSession = {
  glyphs: ExtractedGlyphProfile[];
  sourceWidth: number;
  sourceHeight: number;
  lineCount: number;
  characterCount: number;
  structure: StrokeStructureMetrics | null;
  aiWeights: AiExecutionWeights | null;
  updatedAt: number;
};

const MAX_ANALYSIS_EDGE = 640;
const TOP_GLYPH_COUNT = 15;
/** Canonical matrix size for signature / frequency clustering. */
const SIGNATURE_SIZE = 16;
/** Minimum ink pixels inside a box to count as a character. */
const MIN_GLYPH_INK = 8;
/** Minimum / maximum character aspect heuristics (px at analysis scale). */
const MIN_CHAR_WIDTH = 2;
const MIN_CHAR_HEIGHT = 4;
const MAX_CHAR_WIDTH_RATIO = 0.35;
/** Adaptive threshold window (odd). */
const ADAPTIVE_WINDOW = 15;
/** Sauvola-like bias: lower → more ink retained. */
const ADAPTIVE_K = 0.28;
const ADAPTIVE_R = 128;

const EMPTY_LAYOUT: DocumentLayoutGeometry = {
  topMarginPx: 0,
  meanBaselinePx: 0,
  meanVerticalSpacingPx: 0,
  baselineHeights: [],
  rowDensityHistogram: new Float32Array(0),
};

const DEFAULT_STRUCTURE: StrokeStructureMetrics = {
  strokeThickness: 2.5,
  connectivityRatio: 0.45,
  avgStrokeThickness: 2.5,
  connectivityDensity: 0.45,
  breakDensity: 0.55,
  avgRunsPerRow: 4,
  lineCount: 0,
  layout: EMPTY_LAYOUT,
};

const layoutMetricsListeners = new Set<LayoutMetricsCallback>();

/**
 * Subscribe to layout variance scale updates (strokeThickness /
 * connectivityRatio → dynamic scale factors). Returns an unsubscribe fn.
 */
export function onLayoutMetricsChange(
  callback: LayoutMetricsCallback,
): () => void {
  layoutMetricsListeners.add(callback);
  const current = extractedGlyphs.aiWeights?.layoutScales;
  if (current) callback(current);
  return () => {
    layoutMetricsListeners.delete(callback);
  };
}

function emitLayoutMetrics(scales: LayoutVarianceScales): void {
  for (const cb of layoutMetricsListeners) {
    try {
      cb(scales);
    } catch (err) {
      console.warn('[glyphSlicer] layout metrics callback error:', err);
    }
  }
}

/** Internal session state object (task: extractedGlyphs). */
export const extractedGlyphs: ExtractedGlyphsSession = {
  glyphs: [],
  sourceWidth: 0,
  sourceHeight: 0,
  lineCount: 0,
  characterCount: 0,
  structure: null,
  aiWeights: null,
  updatedAt: 0,
};

export function clearExtractedGlyphs(): void {
  // Zeroize glyph pixel buffers before dropping references.
  for (const g of extractedGlyphs.glyphs) {
    try {
      g.matrix.pixels.fill(255);
    } catch {
      /* ignore */
    }
  }
  extractedGlyphs.glyphs = [];
  extractedGlyphs.sourceWidth = 0;
  extractedGlyphs.sourceHeight = 0;
  extractedGlyphs.lineCount = 0;
  extractedGlyphs.characterCount = 0;
  extractedGlyphs.structure = null;
  extractedGlyphs.aiWeights = null;
  extractedGlyphs.updatedAt = 0;
}

export function getExtractedGlyphs(): readonly ExtractedGlyphProfile[] {
  return extractedGlyphs.glyphs;
}

export function getStrokeStructure(): StrokeStructureMetrics | null {
  return extractedGlyphs.structure;
}

export function getAiExecutionWeights(): AiExecutionWeights | null {
  return extractedGlyphs.aiWeights;
}

/** Latest layout variance scales (strokeThickness / connectivityRatio driven). */
export function getLayoutVarianceScales(): LayoutVarianceScales | null {
  return extractedGlyphs.aiWeights?.layoutScales ?? null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
}

/**
 * Load a File into a fully decoded HTMLImageElement (Promise + onload).
 */
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
      reject(new Error('Image failed to load'));
    };
    img.src = url;
  });
}

function drawToAnalysisCanvas(
  img: HTMLImageElement,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; w: number; h: number } {
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  if (!naturalW || !naturalH) {
    throw new Error('Image has zero dimensions');
  }

  const scale = Math.min(1, MAX_ANALYSIS_EDGE / Math.max(naturalW, naturalH));
  const w = Math.max(1, Math.round(naturalW * scale));
  const h = Math.max(1, Math.round(naturalH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No 2d context');

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx, w, h };
}

/**
 * Stage 1 — Grayscale + adaptive (Sauvola-style) threshold → absolute
 * black ink (0) / white paper (255).
 */
export function binarizeImageData(imageData: ImageData): Uint8Array {
  const { data, width: w, height: h } = imageData;
  const gray = new Float32Array(w * h);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = luma(data[i], data[i + 1], data[i + 2]);
  }

  const binary = new Uint8Array(w * h);
  const half = Math.floor(ADAPTIVE_WINDOW / 2);
  // Integral images for O(1) local mean / variance
  const integral = new Float64Array((w + 1) * (h + 1));
  const integralSq = new Float64Array((w + 1) * (h + 1));
  const stride = w + 1;

  for (let y = 1; y <= h; y++) {
    let rowSum = 0;
    let rowSq = 0;
    for (let x = 1; x <= w; x++) {
      const g = gray[(y - 1) * w + (x - 1)];
      rowSum += g;
      rowSq += g * g;
      integral[y * stride + x] =
        integral[(y - 1) * stride + x] + rowSum;
      integralSq[y * stride + x] =
        integralSq[(y - 1) * stride + x] + rowSq;
    }
  }

  const rectSum = (
    integ: Float64Array,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ): number => {
    // Inclusive pixel coords → exclusive integral indices (+1)
    const a = y0 * stride + x0;
    const b = y0 * stride + (x1 + 1);
    const c = (y1 + 1) * stride + x0;
    const d = (y1 + 1) * stride + (x1 + 1);
    return integ[d] - integ[b] - integ[c] + integ[a];
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - half);
      const y0 = Math.max(0, y - half);
      const x1 = Math.min(w - 1, x + half);
      const y1 = Math.min(h - 1, y + half);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum = rectSum(integral, x0, y0, x1, y1);
      const sumSq = rectSum(integralSq, x0, y0, x1, y1);
      const mean = sum / area;
      const variance = Math.max(0, sumSq / area - mean * mean);
      const std = Math.sqrt(variance);
      // Sauvola: T = mean * (1 + k * (std/R - 1))
      const threshold = mean * (1 + ADAPTIVE_K * (std / ADAPTIVE_R - 1));
      const g = gray[y * w + x];
      binary[y * w + x] = g < threshold ? INK : PAPER;
    }
  }

  return binary;
}

/**
 * Stage 2 — Horizontal projection profile (row-by-row density histogram)
 * → text line bands, baseline heights, top margin, vertical spacing.
 */
export function computeHorizontalProjectionProfile(
  binary: Uint8Array,
  w: number,
  h: number,
): {
  lineBands: { top: number; bottom: number }[];
  layout: DocumentLayoutGeometry;
} {
  const rowDensity = new Float32Array(h);
  for (let y = 0; y < h; y++) {
    let ink = 0;
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if (binary[row + x] === INK) ink++;
    }
    rowDensity[y] = ink / w;
  }

  // Smooth with a small box filter to bridge broken strokes
  const smooth = new Float32Array(h);
  const r = 1;
  for (let y = 0; y < h; y++) {
    let acc = 0;
    let n = 0;
    for (let dy = -r; dy <= r; dy++) {
      const yy = y + dy;
      if (yy < 0 || yy >= h) continue;
      acc += rowDensity[yy];
      n++;
    }
    smooth[y] = acc / n;
  }

  const mean = smooth.reduce((a, b) => a + b, 0) / Math.max(1, h);
  const threshold = Math.max(0.012, mean * 0.45);

  const bands: { top: number; bottom: number }[] = [];
  let inBand = false;
  let top = 0;

  for (let y = 0; y < h; y++) {
    const active = smooth[y] >= threshold;
    if (active && !inBand) {
      inBand = true;
      top = y;
    } else if (!active && inBand) {
      inBand = false;
      const bottom = y;
      if (bottom - top >= MIN_CHAR_HEIGHT) {
        bands.push({ top, bottom });
      }
    }
  }
  if (inBand && h - top >= MIN_CHAR_HEIGHT) {
    bands.push({ top, bottom: h });
  }

  const merged: { top: number; bottom: number }[] = [];
  for (const band of bands) {
    const prev = merged[merged.length - 1];
    if (prev && band.top - prev.bottom <= 3) {
      prev.bottom = band.bottom;
    } else {
      merged.push({ ...band });
    }
  }

  const baselineHeights = merged.map((b) => b.bottom);
  const topMarginPx = merged.length > 0 ? merged[0].top : 0;
  const meanBaselinePx =
    baselineHeights.length > 0
      ? baselineHeights.reduce((a, b) => a + b, 0) / baselineHeights.length
      : 0;

  let spacingSum = 0;
  let spacingN = 0;
  for (let i = 1; i < merged.length; i++) {
    spacingSum += merged[i].top - merged[i - 1].bottom;
    spacingN++;
  }
  // Prefer center-to-center spacing when gaps are tiny
  if (spacingN === 0 && merged.length >= 2) {
    for (let i = 1; i < merged.length; i++) {
      const c0 = (merged[i - 1].top + merged[i - 1].bottom) / 2;
      const c1 = (merged[i].top + merged[i].bottom) / 2;
      spacingSum += c1 - c0;
      spacingN++;
    }
  }
  const meanVerticalSpacingPx = spacingN > 0 ? spacingSum / spacingN : 0;

  return {
    lineBands: merged,
    layout: {
      topMarginPx,
      meanBaselinePx: Math.round(meanBaselinePx * 10) / 10,
      meanVerticalSpacingPx: Math.round(meanVerticalSpacingPx * 10) / 10,
      baselineHeights,
      rowDensityHistogram: rowDensity,
    },
  };
}

/** @deprecated Prefer computeHorizontalProjectionProfile */
export function detectTextLineBands(
  binary: Uint8Array,
  w: number,
  h: number,
): { top: number; bottom: number }[] {
  return computeHorizontalProjectionProfile(binary, w, h).lineBands;
}

/**
 * Stage 3 — Vertical projection within a line → character bounding boxes
 * separated by contiguous white (paper) columns.
 */
export function isolateCharacterBoxesInLine(
  binary: Uint8Array,
  w: number,
  h: number,
  lineTop: number,
  lineBottom: number,
  lineIndex: number,
): BoundingBox[] {
  void h;
  void lineIndex;
  const lineH = lineBottom - lineTop;
  if (lineH < MIN_CHAR_HEIGHT) return [];

  const colInk = new Uint8Array(w);
  for (let x = 0; x < w; x++) {
    let ink = 0;
    for (let y = lineTop; y < lineBottom; y++) {
      if (binary[y * w + x] === INK) {
        ink = 1;
        break;
      }
    }
    colInk[x] = ink;
  }

  const maxCharW = Math.max(8, Math.floor(w * MAX_CHAR_WIDTH_RATIO));
  const boxes: BoundingBox[] = [];
  let inGlyph = false;
  let left = 0;

  const flush = (right: number) => {
    const width = right - left;
    if (width < MIN_CHAR_WIDTH || width > maxCharW) return;

    // Tighten vertical bounds to actual ink inside the column span
    let top = lineBottom;
    let bottom = lineTop;
    let inkCount = 0;
    for (let y = lineTop; y < lineBottom; y++) {
      for (let x = left; x < right; x++) {
        if (binary[y * w + x] === INK) {
          inkCount++;
          if (y < top) top = y;
          if (y + 1 > bottom) bottom = y + 1;
        }
      }
    }
    if (inkCount < MIN_GLYPH_INK) return;
    if (bottom - top < MIN_CHAR_HEIGHT) return;

    boxes.push({
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    });
  };

  for (let x = 0; x < w; x++) {
    const ink = colInk[x] === 1;
    if (ink && !inGlyph) {
      inGlyph = true;
      left = x;
    } else if (!ink && inGlyph) {
      inGlyph = false;
      flush(x);
    }
  }
  if (inGlyph) flush(w);

  return boxes;
}

/**
 * Crop a binary glyph matrix from the page binary buffer.
 */
export function cropGlyphMatrix(
  binary: Uint8Array,
  pageW: number,
  bbox: BoundingBox,
  lineIndex: number,
): GlyphMatrix {
  const { x, y, width, height } = bbox;
  const pixels = new Uint8Array(width * height);
  for (let row = 0; row < height; row++) {
    const src = (y + row) * pageW + x;
    pixels.set(binary.subarray(src, src + width), row * width);
  }
  return { width, height, pixels, bbox: { ...bbox }, lineIndex };
}

/**
 * Normalize a glyph to SIGNATURE_SIZE² and hash ink occupancy for clustering.
 */
function glyphSignature(matrix: GlyphMatrix): string {
  const out = new Uint8Array(SIGNATURE_SIZE * SIGNATURE_SIZE);
  for (let sy = 0; sy < SIGNATURE_SIZE; sy++) {
    for (let sx = 0; sx < SIGNATURE_SIZE; sx++) {
      const srcX = Math.min(
        matrix.width - 1,
        Math.floor((sx / SIGNATURE_SIZE) * matrix.width),
      );
      const srcY = Math.min(
        matrix.height - 1,
        Math.floor((sy / SIGNATURE_SIZE) * matrix.height),
      );
      out[sy * SIGNATURE_SIZE + sx] =
        matrix.pixels[srcY * matrix.width + srcX] === INK ? 1 : 0;
    }
  }
  // Pack bits into a compact base36-ish string
  let sig = '';
  for (let i = 0; i < out.length; i += 6) {
    let n = 0;
    for (let b = 0; b < 6 && i + b < out.length; b++) {
      n |= out[i + b] << b;
    }
    sig += n.toString(36);
  }
  // Aspect bucket keeps 'i' vs 'm' from collapsing too aggressively
  const aspect = clamp(
    Math.round((matrix.width / Math.max(1, matrix.height)) * 10),
    1,
    30,
  );
  return `${aspect}:${sig}`;
}

/**
 * Stage 3b — Within each text line, measure horizontal dark-pixel run lengths:
 * average stroke thickness + character connectivity density.
 */
export function measureLineStrokeStructure(
  binary: Uint8Array,
  w: number,
  lineTop: number,
  lineBottom: number,
): {
  runWidthSum: number;
  runCount: number;
  rowBreakSum: number;
  inkRows: number;
  runsPerRowSum: number;
} {
  let runWidthSum = 0;
  let runCount = 0;
  let rowBreakSum = 0;
  let inkRows = 0;
  let runsPerRowSum = 0;

  for (let y = lineTop; y < lineBottom; y++) {
    const row = y * w;
    let inRun = false;
    let runLen = 0;
    let rowRuns = 0;
    let rowInk = 0;

    for (let x = 0; x < w; x++) {
      const dark = binary[row + x] === INK;
      if (dark) {
        rowInk++;
        if (!inRun) {
          inRun = true;
          runLen = 1;
          rowRuns++;
        } else {
          runLen++;
        }
      } else if (inRun) {
        runWidthSum += runLen;
        runCount++;
        inRun = false;
        runLen = 0;
      }
    }
    if (inRun) {
      runWidthSum += runLen;
      runCount++;
    }

    if (rowInk < 4) continue;
    inkRows++;
    runsPerRowSum += rowRuns;
    // Breaks within a text row ≈ runs − 1 (continuous cursive → few runs)
    rowBreakSum += Math.max(0, rowRuns - 1);
  }

  return { runWidthSum, runCount, rowBreakSum, inkRows, runsPerRowSum };
}

/**
 * Aggregate strokeThickness + connectivityRatio across all detected baselines.
 */
export function measurePageStrokeStructure(
  binary: Uint8Array,
  w: number,
  lineBands: { top: number; bottom: number }[],
  layout: DocumentLayoutGeometry = EMPTY_LAYOUT,
): StrokeStructureMetrics {
  if (lineBands.length === 0) {
    return { ...DEFAULT_STRUCTURE, layout };
  }

  let runWidthSum = 0;
  let runCount = 0;
  let rowBreakSum = 0;
  let inkRows = 0;
  let runsPerRowSum = 0;

  for (const band of lineBands) {
    const m = measureLineStrokeStructure(binary, w, band.top, band.bottom);
    runWidthSum += m.runWidthSum;
    runCount += m.runCount;
    rowBreakSum += m.rowBreakSum;
    inkRows += m.inkRows;
    runsPerRowSum += m.runsPerRowSum;
  }

  const strokeThickness =
    runCount > 0 ? runWidthSum / runCount : DEFAULT_STRUCTURE.strokeThickness;
  const avgRunsPerRow =
    inkRows > 0 ? runsPerRowSum / inkRows : DEFAULT_STRUCTURE.avgRunsPerRow;
  const breakDensity = clamp(
    inkRows > 0 ? rowBreakSum / Math.max(1, inkRows * 8) : 0.55,
    0,
    1,
  );
  const connectivityRatio = clamp(1 - breakDensity, 0, 1);
  const roundedThickness = Math.round(strokeThickness * 100) / 100;
  const roundedConnectivity = Math.round(connectivityRatio * 1000) / 1000;

  return {
    strokeThickness: roundedThickness,
    connectivityRatio: roundedConnectivity,
    avgStrokeThickness: roundedThickness,
    connectivityDensity: roundedConnectivity,
    breakDensity: Math.round(breakDensity * 1000) / 1000,
    avgRunsPerRow: Math.round(avgRunsPerRow * 100) / 100,
    lineCount: lineBands.length,
    layout,
  };
}

/**
 * Map strokeThickness + connectivityRatio → layout variance scale factors
 * for the local AI / canvas execution matrix.
 */
export function structureToAiExecutionWeights(
  structure: StrokeStructureMetrics,
): AiExecutionWeights {
  const thick = structure.strokeThickness;
  const conn = structure.connectivityRatio;

  const bias = clamp(0.7 + (thick / 6) * 1.5 + conn * 0.15, 0.7, 2.5);
  const variance = clamp(
    0.35 + structure.breakDensity * 0.95 + (thick < 2 ? 0.15 : 0),
    0.25,
    1.6,
  );
  const lineHeightScale = clamp(
    0.94 +
      (conn > 0.55 ? 0.08 : 0) +
      (thick > 4 ? 0.04 : 0) +
      (structure.layout.meanVerticalSpacingPx > 0
        ? clamp(structure.layout.meanVerticalSpacingPx / 40 - 0.5, -0.06, 0.1)
        : 0),
    0.9,
    1.28,
  );
  const marginScale = clamp(
    0.92 + structure.layout.topMarginPx / 200,
    0.88,
    1.18,
  );

  const layoutScales: LayoutVarianceScales = {
    strokeWeightScale: Math.round(bias * 100) / 100,
    varianceScale: Math.round(variance * 1000) / 1000,
    lineHeightScale: Math.round(lineHeightScale * 1000) / 1000,
    marginScale: Math.round(marginScale * 1000) / 1000,
    strokeThickness: structure.strokeThickness,
    connectivityRatio: structure.connectivityRatio,
  };

  return {
    bias: layoutScales.strokeWeightScale,
    variance: layoutScales.varianceScale,
    lineHeightScale: layoutScales.lineHeightScale,
    layoutScales,
    structure,
  };
}

/**
 * Stage 4 — Rank isolated glyphs by frequency; keep top 15 profiles.
 */
export function rankFrequentGlyphs(
  matrices: GlyphMatrix[],
  topN: number = TOP_GLYPH_COUNT,
): ExtractedGlyphProfile[] {
  const clusters = new Map<string, ExtractedGlyphProfile>();

  for (const matrix of matrices) {
    const signature = glyphSignature(matrix);
    const existing = clusters.get(signature);
    if (existing) {
      existing.frequency += 1;
      existing.instances.push({ ...matrix.bbox });
      // Prefer denser / larger representative
      const prevArea = existing.matrix.width * existing.matrix.height;
      const nextArea = matrix.width * matrix.height;
      if (nextArea > prevArea) {
        existing.matrix = matrix;
      }
    } else {
      clusters.set(signature, {
        signature,
        matrix,
        frequency: 1,
        instances: [{ ...matrix.bbox }],
      });
    }
  }

  return [...clusters.values()]
    .sort((a, b) => b.frequency - a.frequency || b.matrix.width * b.matrix.height - a.matrix.width * a.matrix.height)
    .slice(0, topN);
}

function commitSession(
  result: Pick<
    GlyphSliceResult,
    | 'width'
    | 'height'
    | 'lineBands'
    | 'characterBoxes'
    | 'extractedGlyphs'
    | 'structure'
    | 'aiWeights'
  >,
): void {
  extractedGlyphs.glyphs = result.extractedGlyphs;
  extractedGlyphs.sourceWidth = result.width;
  extractedGlyphs.sourceHeight = result.height;
  extractedGlyphs.lineCount = result.lineBands.length;
  extractedGlyphs.characterCount = result.characterBoxes.length;
  extractedGlyphs.structure = result.structure;
  extractedGlyphs.aiWeights = result.aiWeights;
  extractedGlyphs.updatedAt = Date.now();
  emitLayoutMetrics(result.aiWeights.layoutScales);
}

/**
 * Run the full segmenter on an already-decoded image / canvas ImageData.
 */
export function sliceGlyphsFromImageData(imageData: ImageData): GlyphSliceResult {
  const w = imageData.width;
  const h = imageData.height;
  // Adaptive neighborhood threshold on RGBA → grayscale → ink/paper
  const binary = binarizeImageData(imageData);
  const { lineBands, layout } = computeHorizontalProjectionProfile(
    binary,
    w,
    h,
  );

  const characterBoxes: BoundingBox[] = [];
  const matrices: GlyphMatrix[] = [];

  lineBands.forEach((band, lineIndex) => {
    const boxes = isolateCharacterBoxesInLine(
      binary,
      w,
      h,
      band.top,
      band.bottom,
      lineIndex,
    );
    for (const box of boxes) {
      characterBoxes.push(box);
      matrices.push(cropGlyphMatrix(binary, w, box, lineIndex));
    }
  });

  const structure = measurePageStrokeStructure(binary, w, lineBands, layout);
  const aiWeights = structureToAiExecutionWeights(structure);
  const topGlyphs = rankFrequentGlyphs(matrices, TOP_GLYPH_COUNT);

  const result: GlyphSliceResult = {
    width: w,
    height: h,
    binary,
    lineBands,
    characterBoxes,
    extractedGlyphs: topGlyphs,
    structure,
    aiWeights,
  };
  commitSession(result);
  return result;
}

/**
 * Primary entry — async Promise that resolves after the full pipeline.
 * Guarantees image decode completes before pixel analysis.
 */
export function sliceGlyphsFromFile(file: File): Promise<GlyphSliceResult> {
  return new Promise((resolve, reject) => {
    void (async () => {
      try {
        const img = await loadImageFromFile(file);
        const { ctx, w, h } = drawToAnalysisCanvas(img);
        let imageData: ImageData;
        try {
          imageData = ctx.getImageData(0, 0, w, h);
        } catch {
          reject(new Error('getImageData blocked'));
          return;
        }
        resolve(sliceGlyphsFromImageData(imageData));
      } catch (err) {
        clearExtractedGlyphs();
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    })();
  });
}

/**
 * Convenience: slice from an HTMLImageElement that is already loaded.
 */
export function sliceGlyphsFromImage(
  img: HTMLImageElement,
): Promise<GlyphSliceResult> {
  return new Promise((resolve, reject) => {
    try {
      const { ctx, w, h } = drawToAnalysisCanvas(img);
      const imageData = ctx.getImageData(0, 0, w, h);
      resolve(sliceGlyphsFromImageData(imageData));
    } catch (err) {
      clearExtractedGlyphs();
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
