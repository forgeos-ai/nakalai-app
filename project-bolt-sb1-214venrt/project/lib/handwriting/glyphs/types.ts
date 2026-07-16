/**
 * Glyph variant DNA — unlabeled shape stats + font face companions.
 */

import type { DnaMetric } from '../types';

export type GlyphVariantDNA = {
  confidence: number;
  faceFamilies: DnaMetric<readonly string[]>;
  meanAspect: DnaMetric<number>;
  aspectVariance: DnaMetric<number>;
  meanInkDensity: DnaMetric<number>;
};
