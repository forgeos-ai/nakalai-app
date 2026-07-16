/**
 * HandwritingDNA — versioned in-memory writer identity.
 * Never holds image pixels; never written to disk.
 */

import type { DnaMetric } from '../types';
import type { SegmentationDNA } from '../segmentation/types';
import type { GlyphVariantDNA } from '../glyphs/types';
import type { RhythmDNA } from '../rhythm/types';
import type { SpacingDNA } from '../spacing/types';
import type { BaselineDNA } from '../baseline/types';
import type { LigatureDNA } from '../ligatures/types';
import type { RendererDNA } from '../renderer/types';

export const HANDWRITING_DNA_VERSION = 1 as const;

export type HandwritingDnaSource =
  | 'matched'
  | 'generalized-fallback'
  | 'standard';

export type HandwritingDNA = {
  version: typeof HANDWRITING_DNA_VERSION;
  /** Deterministic seed — drives all PRNG streams. */
  seed: number;
  /** Overall match quality (not a “realism %”). */
  confidence: number;
  usedFallback: boolean;
  source: HandwritingDnaSource;

  ink: DnaMetric<string>;
  slantDegrees: DnaMetric<number>;
  stroke: DnaMetric<{ thicknessPx: number; roughness: number }>;

  segmentation: SegmentationDNA;
  glyphs: GlyphVariantDNA;
  rhythm: RhythmDNA;
  spacing: SpacingDNA;
  baseline: BaselineDNA;
  ligatures: LigatureDNA;
  render: RendererDNA;

  /** Bridge fields for today’s HandwritingProfile paint contract. */
  profileHints: {
    fontClass: string;
    fontFamily: string;
    fontCategory?: string;
    isCursive: boolean;
    matchStrength: number;
    avgCharHeightPx: number;
    charHeightVariation: number;
    charWidthVariation: number;
    ascenderScale: number;
    descenderScale: number;
  };
};
