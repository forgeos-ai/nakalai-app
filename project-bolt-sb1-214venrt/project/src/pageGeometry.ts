// A4 page geometry — single source of truth for preview + high-res PDF capture.
// All layout math is in CSS px at 96dpi; html2canvas scale only increases raster DPI.

import type { HandwritingFontClass } from './constants';
import { DEFAULT_HANDWRITING_FONT_CLASS } from './constants';

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const MARGIN_LEFT_MM = 30; // pink margin line from left edge
export const LINE_SPACING_MM = 8; // vertical distance between ruled lines
export const PADDING_TOP_MM = 16; // first text band starts here (rule sits at band bottom)
export const PADDING_RIGHT_MM = 14; // right edge inset — keeps glyphs off the page edge
export const MARGIN_GUTTER_MM = 3.5; // gap after pink margin before text starts
export const MAX_LINES_PER_PAGE = 32; // capacity at 8mm spacing

/** Base handwriting size — fits comfortably inside an 8mm rule band. */
export const DEFAULT_FONT_SIZE_PX = 20;

/**
 * Optical baseline nudge inside each rule band (px).
 * Positive values lift glyphs slightly so descenders clear the 1px rule
 * while the visual baseline still reads as “sitting on” the line.
 */
export const BASELINE_NUDGE_PX = 3;

/** Subtle tracking for handwriting fonts (em). Jitter adds per-glyph variance. */
export const LETTER_SPACING_EM = 0.015;

/**
 * Extra horizontal safety vs canvas measureText so tracking jitter +
 * italic overhang never clip the right edge in preview or PDF.
 */
export const TEXT_WIDTH_SAFETY = 0.94;

/** @deprecated Rule-bound layout uses LINE_SPACING_PX as line-height. */
export const LINE_HEIGHT_MULTIPLIER = 1.45;

// Pixels-per-millimeter at 96dpi (CSS standard) — identical in preview & capture
export const PX_PER_MM = 96 / 25.4;

export const TEXT_AREA_LEFT_MM = MARGIN_LEFT_MM + MARGIN_GUTTER_MM;
export const TEXT_AREA_WIDTH_MM = A4_WIDTH_MM - TEXT_AREA_LEFT_MM - PADDING_RIGHT_MM;

export const A4_WIDTH_PX = A4_WIDTH_MM * PX_PER_MM; // ~793.7px
export const A4_HEIGHT_PX = A4_HEIGHT_MM * PX_PER_MM; // ~1122.5px
export const LINE_SPACING_PX = LINE_SPACING_MM * PX_PER_MM; // ~30.24px
export const MARGIN_LEFT_PX = MARGIN_LEFT_MM * PX_PER_MM;
export const PADDING_TOP_PX = PADDING_TOP_MM * PX_PER_MM;
export const TEXT_AREA_LEFT_PX = TEXT_AREA_LEFT_MM * PX_PER_MM;
export const TEXT_AREA_WIDTH_PX = TEXT_AREA_WIDTH_MM * PX_PER_MM;

/** Usable wrap width after safety inset (shared by pagination + render). */
export const TEXT_WRAP_WIDTH_PX = TEXT_AREA_WIDTH_PX * TEXT_WIDTH_SAFETY;

/**
 * Gel-pen fallback matrix (blurry / failed photo analysis).
 * Mirrors styleExtractor defaults so pageGeometry + jitter stay aligned.
 */
export const DEFAULT_MATCHED_INK_HEX = '#1d2a4a';
export const DEFAULT_MATCHED_SLANT_DEGREES = 3;
export const DEFAULT_MATCHED_NOISE = 0.3;

/**
 * Runtime overrides from "Match My Writing Style" photo analysis.
 * Ink + slant + grain + structural font category + registry fontClass.
 */
export type MatchedStyleOverrides = {
  inkHex: string;
  /** Degrees added to every glyph's baseline rotation. */
  slantDegrees: number;
  /** 0–1 paper grain intensity for background noise overlay. */
  noiseIntensity: number;
  /** Coarse structural tag from the ROI analyzer. */
  fontCategory?: string;
  /** Matched 12-family registry id — swaps App fontStyle / canvas key. */
  fontClass: HandwritingFontClass;
};

/** Mutable layout context — updated when a notebook photo is analyzed. */
export const matchedStyleContext: {
  active: MatchedStyleOverrides | null;
  /** Bumps on every style commit so consumers can bust layout caches. */
  revision: number;
} = {
  active: null,
  revision: 0,
};

export function setMatchedStyleOverrides(
  style: MatchedStyleOverrides | null,
): void {
  matchedStyleContext.active = style;
  matchedStyleContext.revision += 1;
}

export function getMatchedStyleOverrides(): MatchedStyleOverrides | null {
  return matchedStyleContext.active;
}

export function getMatchedStyleRevision(): number {
  return matchedStyleContext.revision;
}

export function clearMatchedStyleOverrides(): void {
  matchedStyleContext.active = null;
  matchedStyleContext.revision += 1;
}

export { DEFAULT_HANDWRITING_FONT_CLASS };
