import type { DnaMetric } from '../types';

export type RendererDNA = {
  confidence: number;
  /** Acceptance gate: no Math.random in paint path. */
  deterministic: boolean;
  streamSaltPolicy: 'pageNumber' | 'paintToken' | 'none';
  polyGlyph: DnaMetric<{
    primaryFamily: string;
    companions: readonly string[];
  }>;
  inkHex: DnaMetric<string>;
  strokeWidthPx: DnaMetric<number>;
  strokeOpacityVariation: DnaMetric<number>;
  pressure: DnaMetric<{
    baseAlpha: number;
    alphaVariance: number;
    shadowBlurPx: number;
  }>;
  variationBinding: {
    useVariationEngine: true;
    excludeRevisionFromSeed: true;
  };
};

/** Per-glyph paint instruction — fully determined by DNA + seed. */
export type GlyphPaintInstruction = {
  char: string;
  family: string;
  /** Same-family contextual shape variant. Absent on legacy plans. */
  variantId?: number;
  scaleX?: number;
  skewX?: number;
  x: number;
  y: number;
  fontSizePx: number;
  rotationRad: number;
  alpha: number;
  shadowBlur: number;
  advance: number;
  connectToNext: boolean;
  /** Present only when legacy mode invents Bezier geometry. Intelligent mode omits. */
  connector?: {
    startX: number;
    endX: number;
    rise: number;
    alpha: number;
    lineWidth: number;
  };
  /** Ligature Intelligence transition payload (plan only). */
  transition?: {
    pair: string;
    joinStrength: number;
    preferredGapEm: number;
    exitDirection: number;
    entryDirection: number;
    overlapAmount: number;
    confidence: number;
  };
  /** Motion Physics payloads (plan only). */
  motion?: {
    velocity: number;
    acceleration: number;
    curvature: number;
    hesitation: number;
    penLift: number;
    strokeLength: number;
  };
  pressure?: {
    pressure: number;
    strokeWidth: number;
    opacity: number;
    shadowBlur: number;
    edgeSoftness: number;
  };
  ink?: {
    opacity: number;
    strokeThickness: number;
    edgeSoftness: number;
    density: number;
  };
  stroke?: {
    phase: 'touch' | 'flow' | 'lift';
    segment: 'entry' | 'middle' | 'exit';
    taper: number;
  };
};

export type LinePaintInstruction = {
  row: number;
  baselineY: number;
  marginOffsetPx: number;
  heightScale: number;
  glyphs: GlyphPaintInstruction[];
};

export type PagePaintPlan = {
  seed: number;
  pageSalt: number;
  fontSizePx: number;
  lineHeightPx: number;
  inkHex: string;
  lines: LinePaintInstruction[];
  confidence: number;
};
