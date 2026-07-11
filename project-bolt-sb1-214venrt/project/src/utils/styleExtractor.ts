/**
 * Client-side notebook photo → ink + slant + handwriting fontClass
 * mapped into the 12-family / 5-bucket typography registry.
 *
 * Lifecycle: File → object URL → Image → Promise waits for `img.onload`
 * → offscreen canvas → centered ROI getImageData → ink / slant / noise /
 * stroke thickness + connectivity → fontClass.
 *
 * Never throws for blank/failed analysis — falls back to gel-pen defaults.
 */

import type { FontStyle, HandwritingFontClass } from '../constants';
import {
  DEFAULT_HANDWRITING_FONT_CLASS,
  FONT_STYLES,
} from '../constants';

export type ExtractedNotebookStyle = {
  /** Dominant pen ink as #RRGGBB */
  inkHex: string;
  /** Baseline slant in degrees (negative = lean left / italic-ish) */
  slantDegrees: number;
  /** 0–1 paper grain / spacing-rhythm intensity (layout overlay only) */
  noiseIntensity: number;
  /**
   * Structural category tag from pixel analysis
   * (tight-cursive | loose-scratch | casual-print | block-caps | slanted-script | heavy-marker).
   */
  fontCategory: StructuralFontTag;
  /**
   * Matched registry family id — drives App `fontStyle` / canvas remount.
   * e.g. cursive-loop | casual-print | scratch-grain | slant-dash
   */
  fontClass: HandwritingFontClass;
  /** CSS font-family stack for the matched registry entry. */
  fontFamily: string;
  /** Mean dark-run width (px at analysis scale). */
  strokeThickness: number;
  /** Continuous ink connectivity [0, 1] — high = cursive, low = print. */
  connectivityRatio: number;
  /** How many dark ink pixels contributed to the cluster */
  inkSampleCount: number;
  /** True when analysis used the safe gel-pen fallback matrix */
  usedFallback: boolean;
};

/**
 * Coarse structural tags produced by the ROI stroke analyzer.
 * Mapped through STRUCTURAL_FONT_MAP → exact 12-family registry ids.
 */
export type StructuralFontTag =
  | 'tight-cursive'
  | 'loose-scratch'
  | 'casual-print'
  | 'block-caps'
  | 'slanted-script'
  | 'heavy-marker';


/** Dark blue gel pen — used when analysis fails or returns blank bands. */
export const FALLBACK_INK_HEX = '#1d2a4a';
export const FALLBACK_SLANT_DEGREES = 3;
/** Authentic mid grain for blurry / failed photos (spec: 0.3). */
export const FALLBACK_NOISE = 0.3;
export const FALLBACK_FONT_CLASS: HandwritingFontClass =
  DEFAULT_HANDWRITING_FONT_CLASS;

export const STYLE_EXTRACT_ERROR =
  'Could not analyze that photo. Try a clearer notebook page with visible handwriting.';

const MAX_ANALYSIS_EDGE = 320;
const PAPER_RGB_MIN = 200;
const INK_LUMA_MAX = 170;
const SLANT_MIN_DEG = -8;
const SLANT_MAX_DEG = 15;
const MIN_INK_SAMPLES = 40;
const COLOR_BUCKET = 16;
const ROI_EDGE_INSET = 0.2;
const SLANT_MAX_SPAN_FRAC = 0.15;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) =>
    Math.round(clamp(v, 0, 255))
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function isBrightPaper(r: number, g: number, b: number): boolean {
  return r > PAPER_RGB_MIN && g > PAPER_RGB_MIN && b > PAPER_RGB_MIN;
}

export function createFallbackNotebookStyle(
  reason = 'fallback',
): ExtractedNotebookStyle {
  if (import.meta.env.DEV) {
    console.info('[NakalAI] Style extract using gel-pen fallback:', reason);
  }
  return {
    inkHex: FALLBACK_INK_HEX,
    slantDegrees: FALLBACK_SLANT_DEGREES,
    noiseIntensity: FALLBACK_NOISE,
    fontCategory: 'casual-print',
    fontClass: FALLBACK_FONT_CLASS,
    fontFamily: 'Architects Daughter',
    strokeThickness: 2.5,
    connectivityRatio: 0.45,
    inkSampleCount: 0,
    usedFallback: true,
  };
}

function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
}

export function getCenteredRoiBounds(
  canvasW: number,
  canvasH: number,
): { x0: number; y0: number; x1: number; y1: number; rw: number; rh: number } {
  const x0 = Math.floor(canvasW * ROI_EDGE_INSET);
  const y0 = Math.floor(canvasH * ROI_EDGE_INSET);
  const x1 = Math.ceil(canvasW * (1 - ROI_EDGE_INSET));
  const y1 = Math.ceil(canvasH * (1 - ROI_EDGE_INSET));
  const rw = Math.max(1, x1 - x0);
  const rh = Math.max(1, y1 - y0);
  return { x0, y0, x1, y1, rw, rh };
}

function extractDominantInk(
  data: Uint8ClampedArray,
  roiW: number,
  roiH: number,
): { inkHex: string; inkCount: number; inkMask: Uint8Array } | null {
  const inkMask = new Uint8Array(roiW * roiH);
  const buckets = new Map<
    string,
    { n: number; r: number; g: number; b: number }
  >();
  let inkCount = 0;

  for (let y = 0; y < roiH; y++) {
    for (let x = 0; x < roiW; x++) {
      const i = (y * roiW + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 128) continue;
      if (isBrightPaper(r, g, b)) continue;
      if (luma(r, g, b) > INK_LUMA_MAX) continue;

      inkMask[y * roiW + x] = 1;
      inkCount++;

      const br = Math.floor(r / COLOR_BUCKET) * COLOR_BUCKET;
      const bg = Math.floor(g / COLOR_BUCKET) * COLOR_BUCKET;
      const bb = Math.floor(b / COLOR_BUCKET) * COLOR_BUCKET;
      const key = `${br},${bg},${bb}`;
      const prev = buckets.get(key);
      if (prev) {
        prev.n++;
        prev.r += r;
        prev.g += g;
        prev.b += b;
      } else {
        buckets.set(key, { n: 1, r, g, b });
      }
    }
  }

  if (inkCount < MIN_INK_SAMPLES || buckets.size === 0) return null;

  let best: { n: number; r: number; g: number; b: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.n > best.n) best = bucket;
  }
  if (!best) return null;

  return {
    inkHex: rgbToHex(best.r / best.n, best.g / best.n, best.b / best.n),
    inkCount,
    inkMask,
  };
}

function extractSlantDegrees(
  inkMask: Uint8Array,
  roiW: number,
  roiH: number,
  fullCanvasW: number,
): number {
  const maxSpanPx = Math.max(4, Math.floor(fullCanvasW * SLANT_MAX_SPAN_FRAC));
  const rowCentroids: { y: number; x: number }[] = [];

  for (let y = 0; y < roiH; y++) {
    const row = y * roiW;
    let rowInkX = 0;
    let rowInkN = 0;
    let minX = roiW;
    let maxX = -1;

    for (let x = 0; x < roiW; x++) {
      if (inkMask[row + x]) {
        rowInkX += x;
        rowInkN++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }

    if (rowInkN < 3 || maxX < 0) continue;

    const span = maxX - minX + 1;
    if (span > maxSpanPx) continue;

    rowCentroids.push({ y, x: rowInkX / rowInkN });
  }

  if (rowCentroids.length < 8) return FALLBACK_SLANT_DEGREES;

  const n = rowCentroids.length;
  let sumY = 0;
  let sumX = 0;
  let sumYY = 0;
  let sumYX = 0;
  for (const p of rowCentroids) {
    sumY += p.y;
    sumX += p.x;
    sumYY += p.y * p.y;
    sumYX += p.y * p.x;
  }
  const denom = n * sumYY - sumY * sumY;
  if (Math.abs(denom) <= 1e-6) return FALLBACK_SLANT_DEGREES;

  const slope = (n * sumYX - sumY * sumX) / denom;
  return clamp((Math.atan(slope) * 180) / Math.PI, SLANT_MIN_DEG, SLANT_MAX_DEG);
}

function extractNoiseIntensity(
  data: Uint8ClampedArray,
  roiW: number,
  roiH: number,
): number {
  const mx = Math.max(2, Math.floor(roiW * 0.1));
  const my = Math.max(2, Math.floor(roiH * 0.1));
  const samples: number[] = [];

  const pushPixel = (x: number, y: number) => {
    const i = (y * roiW + x) * 4;
    if (data[i + 3] < 128) return;
    samples.push(luma(data[i], data[i + 1], data[i + 2]));
  };

  for (let y = 0; y < roiH; y++) {
    for (let x = 0; x < mx; x++) pushPixel(x, y);
    for (let x = roiW - mx; x < roiW; x++) pushPixel(x, y);
  }
  for (let y = 0; y < my; y++) {
    for (let x = mx; x < roiW - mx; x++) pushPixel(x, y);
  }
  for (let y = roiH - my; y < roiH; y++) {
    for (let x = mx; x < roiW - mx; x++) pushPixel(x, y);
  }

  if (samples.length < 20) return FALLBACK_NOISE;

  let sum = 0;
  for (const L of samples) sum += L;
  const mean = sum / samples.length;
  let varAcc = 0;
  for (const L of samples) {
    const d = L - mean;
    varAcc += d * d;
  }
  const std = Math.sqrt(varAcc / samples.length);
  return clamp(std / 28, 0, 1);
}

export type StrokeStructureMetrics = {
  strokeThickness: number;
  connectivityRatio: number;
  avgRunsPerRow: number;
  /** Vertical continuity: fraction of ink columns with multi-row overlap (cursive cue). */
  verticalContinuity: number;
  /** Mean ink run width relative to ROI width (blocky vs thin). */
  relativeRunWidth: number;
};

export function extractStrokeStructure(
  inkMask: Uint8Array,
  roiW: number,
  roiH: number,
): StrokeStructureMetrics {
  let runWidthSum = 0;
  let runCount = 0;
  let rowBreakSum = 0;
  let inkRows = 0;
  let runsPerRowSum = 0;

  for (let y = 0; y < roiH; y++) {
    const row = y * roiW;
    let inRun = false;
    let runLen = 0;
    let rowRuns = 0;
    let rowInk = 0;

    for (let x = 0; x < roiW; x++) {
      const dark = inkMask[row + x] === 1;
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
    rowBreakSum += Math.max(0, rowRuns - 1);
  }

  const strokeThickness = runCount > 0 ? runWidthSum / runCount : 2.5;
  const avgRunsPerRow = inkRows > 0 ? runsPerRowSum / inkRows : 4;

  // Normalize connectivity from average pen-lifts per row.
  // ~1–2 runs → near 1.0 (cursive); ~5–7 → mid (print/hybrid); 12+ → low (block).
  // Previous formula used inkRows*8 and saturated to 0 for almost every photo.
  const connectivityRatio = clamp(
    1 - (avgRunsPerRow - 1) / 10,
    0,
    1,
  );

  // Vertical continuity: columns where ink spans multiple consecutive rows
  let inkCols = 0;
  let multiRowCols = 0;
  for (let x = 0; x < roiW; x++) {
    let colInk = 0;
    let maxStreak = 0;
    let streak = 0;
    for (let y = 0; y < roiH; y++) {
      if (inkMask[y * roiW + x] === 1) {
        colInk++;
        streak++;
        if (streak > maxStreak) maxStreak = streak;
      } else {
        streak = 0;
      }
    }
    if (colInk < 2) continue;
    inkCols++;
    if (maxStreak >= 3) multiRowCols++;
  }
  const verticalContinuity =
    inkCols > 0 ? clamp(multiRowCols / inkCols, 0, 1) : 0;

  const relativeRunWidth = clamp(strokeThickness / Math.max(8, roiW * 0.04), 0, 3);

  return {
    strokeThickness,
    connectivityRatio,
    avgRunsPerRow,
    verticalContinuity,
    relativeRunWidth,
  };
}

/**
 * Exact Google Fonts family names (case-sensitive) as loaded in index.html.
 * Canvas `ctx.font` and App `activeFontFamily` MUST use these bare strings.
 */
export const GOOGLE_FONT_NAME: Record<HandwritingFontClass, string> = {
  'cursive-neat': 'Dancing Script',
  'cursive-loop': 'Pacifico',
  'cursive-ribbon': 'Great Vibes',
  'messy-brush': 'Caveat',
  'scratch-wild': 'Homemade Apple',
  'scratch-grain': 'Rock Salt',
  'casual-print': 'Architects Daughter',
  'block-caps': 'Special Elite',
  'block-stencil': 'Amatic SC',
  'rushed-student': 'Shadows Into Light',
  'slant-dash': 'Covered By Your Grace',
  'marker-bold': 'Permanent Marker',
};

/** Resolve registry id → exact Google Font family name for canvas/CSS. */
export function googleFontNameForClass(
  fontClass: HandwritingFontClass | string | null | undefined,
): string {
  if (fontClass && fontClass in GOOGLE_FONT_NAME) {
    return GOOGLE_FONT_NAME[fontClass as HandwritingFontClass];
  }
  return GOOGLE_FONT_NAME[DEFAULT_HANDWRITING_FONT_CLASS];
}

/**
 * Precise structural-tag → registry family mapping.
 * Keys are analyzer category tags; values are HandwritingFontClass ids
 * that resolve to exact Google Font names via GOOGLE_FONT_NAME.
 */
export const STRUCTURAL_FONT_MAP: Record<
  StructuralFontTag,
  HandwritingFontClass
> = {
  // High connectivity → Dancing Script / Caveat family
  'tight-cursive': 'cursive-neat', // Dancing Script
  'loose-scratch': 'messy-brush', // Caveat
  // Intermediate (~0.45–0.70 connectivity) → print / Covered Slant hybrids
  'casual-print': 'casual-print', // Architects Daughter
  'slanted-script': 'slant-dash', // Covered By Your Grace
  // Strict block only
  'block-caps': 'block-caps', // Special Elite
  'heavy-marker': 'marker-bold', // Permanent Marker
};

/**
 * Full FontStyle lookup keyed by registry id — used by App state dispatch.
 * fontFamily on each entry is normalized to the exact Google Font name.
 */
export const matchedFonts: Record<HandwritingFontClass, FontStyle> =
  Object.fromEntries(
    FONT_STYLES.map((f) => [
      f.id,
      {
        ...f,
        // Bare Google Font name — no CSS stack noise for canvas ctx.font
        fontFamily: GOOGLE_FONT_NAME[f.id],
      },
    ]),
  ) as Record<HandwritingFontClass, FontStyle>;

/**
 * Refine a coarse structural tag into a specific 12-family id using
 * thickness / noise / slant (still within the tag's bucket).
 * Never forces all-caps fonts when the assignment contains lowercase.
 */
function refineFontClassForTag(
  tag: StructuralFontTag,
  structure: StrokeStructureMetrics,
  noiseIntensity: number,
  slantDegrees: number,
  hasLowercase: boolean,
): HandwritingFontClass {
  const thick = structure.strokeThickness;
  const conn = structure.connectivityRatio;
  const runs = structure.avgRunsPerRow;
  const absSlant = Math.abs(slantDegrees);
  const base = STRUCTURAL_FONT_MAP[tag];

  let pick: HandwritingFontClass;

  switch (tag) {
    case 'tight-cursive':
      if (thick < 2.3) pick = 'cursive-ribbon';
      else if (conn >= 0.7 || runs < 3.5) pick = 'cursive-loop';
      else pick = 'cursive-neat'; // Dancing Script
      break;

    case 'loose-scratch':
      if (noiseIntensity > 0.48) pick = 'scratch-wild';
      else if (thick >= 3.8 && conn < 0.35) pick = 'scratch-grain';
      else pick = 'messy-brush'; // Caveat
      break;

    case 'casual-print':
      if (absSlant >= 6 || noiseIntensity > 0.36) pick = 'slant-dash';
      else pick = 'casual-print';
      break;

    case 'block-caps':
      // Strict block only when truly disjointed + blocky; else soft print
      if (thick >= 3.5 && conn < 0.18) pick = 'block-stencil';
      else if (conn < 0.2 && thick >= 2.6) pick = 'block-caps';
      else pick = 'casual-print';
      break;

    case 'slanted-script':
      pick =
        absSlant >= 5 || noiseIntensity > 0.38
          ? 'slant-dash'
          : 'rushed-student';
      break;

    case 'heavy-marker':
      pick = 'marker-bold';
      break;

    default:
      pick = base;
  }

  // Lowercase in the assignment stream → never lock onto all-caps archetypes
  if (
    hasLowercase &&
    (pick === 'block-caps' || pick === 'block-stencil')
  ) {
    pick = tag === 'slanted-script' ? 'slant-dash' : 'casual-print';
  }

  return pick;
}

/**
 * Stage E — Structural category tag.
 * Connectivity ~0.45–0.70 (typical notebook mix) → casual-print / slanted-script
 * → Architects Daughter / Covered By Your Grace — never Special Elite.
 */
export function classifyStructuralTag(
  structure: StrokeStructureMetrics,
  noiseIntensity: number,
  slantDegrees = 0,
): StructuralFontTag {
  const thick = structure.strokeThickness;
  const conn = structure.connectivityRatio;
  const runs = structure.avgRunsPerRow;
  const vert = structure.verticalContinuity;
  const blocky = structure.relativeRunWidth;
  const absSlant = Math.abs(slantDegrees);

  // Heavy marker — only very thick strokes
  if (thick >= 5.5 || (thick >= 4.6 && noiseIntensity > 0.45 && conn < 0.35)) {
    return 'heavy-marker';
  }

  // Intermediate band (matches observed ~0.63 connectivity) — print / Covered Slant
  if (conn >= 0.45 && conn <= 0.72) {
    if (absSlant >= 5 || noiseIntensity > 0.34 || vert >= 0.4) {
      return 'slanted-script'; // → Covered By Your Grace
    }
    if (thick >= 3.1 && noiseIntensity > 0.3) {
      return 'loose-scratch'; // → Caveat
    }
    return 'casual-print'; // → Architects Daughter
  }

  // High connectivity / vertical continuity → Dancing Script family
  if (vert >= 0.48 || conn > 0.72) {
    return 'tight-cursive'; // → Dancing Script
  }

  // Many runs but not blocky → slanted / casual (not block caps)
  if (runs > 6 && blocky < 1.4) {
    return absSlant >= 4 || noiseIntensity > 0.32
      ? 'slanted-script'
      : 'casual-print';
  }

  // Low–mid → loose scratch or casual
  if (conn >= 0.28 && conn < 0.45) {
    if (thick >= 3.0) return 'loose-scratch';
    return 'casual-print';
  }

  // Strict block-caps ONLY: very low connectivity AND blocky disjoint strokes
  if (conn < 0.2 && blocky >= 1.2 && thick >= 2.6) {
    return 'block-caps';
  }

  if (thick >= 3.2) return 'loose-scratch';
  return 'casual-print';
}

/**
 * Map stroke metrics → structural tag → refined 12-family registry id.
 */
export function classifyHandwritingFont(
  structure: StrokeStructureMetrics,
  noiseIntensity: number,
  slantDegrees = 0,
  hasLowercase = true,
): {
  fontCategory: StructuralFontTag;
  fontClass: HandwritingFontClass;
  fontFamily: string;
} {
  console.log('Raw Extracted Metrics:', {
    connectivity: structure.connectivityRatio,
    strokeThickness: structure.strokeThickness,
    noiseIntensity,
    avgRunsPerRow: structure.avgRunsPerRow,
    verticalContinuity: structure.verticalContinuity,
    relativeRunWidth: structure.relativeRunWidth,
    slantDegrees,
    hasLowercase,
  });

  const fontCategory = classifyStructuralTag(
    structure,
    noiseIntensity,
    slantDegrees,
  );
  const fontClass = refineFontClassForTag(
    fontCategory,
    structure,
    noiseIntensity,
    slantDegrees,
    hasLowercase,
  );
  const fontFamily = GOOGLE_FONT_NAME[fontClass];

  console.log('Classified handwriting profile:', {
    fontCategory,
    fontClass,
    fontFamily,
  });

  return { fontCategory, fontClass, fontFamily };
}

/** True when assignment text includes any a–z character. */
export function inputHasLowercase(text: string | undefined | null): boolean {
  if (!text) return true; // default assume mixed case — avoid all-caps lock-in
  return /[a-z]/.test(text);
}

export type StyleExtractOptions = {
  /** Assignment text — lowercase letters block all-caps font lock-in. */
  inputText?: string;
};

export function extractNotebookStyle(
  file: File,
  options: StyleExtractOptions = {},
): Promise<ExtractedNotebookStyle> {
  return new Promise((resolve) => {
    if (!isLikelyImageFile(file)) {
      resolve(createFallbackNotebookStyle('not-an-image'));
      return;
    }

    const hasLowercase = inputHasLowercase(options.inputText);
    const url = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    };

    const finishFallback = (reason: string) => {
      cleanup();
      resolve(createFallbackNotebookStyle(reason));
    };

    const runPixelAnalysis = () => {
      try {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;

        if (!naturalW || !naturalH) {
          finishFallback('zero-dimensions');
          return;
        }

        const scale = Math.min(
          1,
          MAX_ANALYSIS_EDGE / Math.max(naturalW, naturalH),
        );
        const w = Math.max(1, Math.round(naturalW * scale));
        const h = Math.max(1, Math.round(naturalH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          finishFallback('no-2d-context');
          return;
        }

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const roi = getCenteredRoiBounds(w, h);

        let imageData: ImageData;
        try {
          imageData = ctx.getImageData(roi.x0, roi.y0, roi.rw, roi.rh);
        } catch {
          finishFallback('getImageData-blocked');
          return;
        }

        const { data } = imageData;
        const roiW = imageData.width;
        const roiH = imageData.height;

        const ink = extractDominantInk(data, roiW, roiH);
        if (!ink) {
          finishFallback('blank-color-bands');
          return;
        }

        const slantDegrees = extractSlantDegrees(
          ink.inkMask,
          roiW,
          roiH,
          w,
        );
        const noiseIntensity = extractNoiseIntensity(data, roiW, roiH);
        const structure = extractStrokeStructure(ink.inkMask, roiW, roiH);
        const { fontCategory, fontClass, fontFamily } = classifyHandwritingFont(
          structure,
          noiseIntensity,
          slantDegrees,
          hasLowercase,
        );

        cleanup();
        resolve({
          inkHex: ink.inkHex,
          slantDegrees: Math.round(slantDegrees * 10) / 10,
          noiseIntensity: Math.round(noiseIntensity * 1000) / 1000,
          fontCategory,
          fontClass,
          fontFamily,
          strokeThickness: Math.round(structure.strokeThickness * 100) / 100,
          connectivityRatio:
            Math.round(structure.connectivityRatio * 1000) / 1000,
          inkSampleCount: ink.inkCount,
          usedFallback: false,
        });
      } catch (err) {
        console.error('[NakalAI] Style pixel analysis failed:', err);
        finishFallback('analysis-exception');
      }
    };

    img.onload = () => {
      if (typeof img.decode === 'function') {
        img
          .decode()
          .then(() => runPixelAnalysis())
          .catch(() => runPixelAnalysis());
      } else {
        runPixelAnalysis();
      }
    };

    img.onerror = () => {
      finishFallback('image-load-error');
    };

    img.src = url;
  });
}
