/**
 * Glyph variants — companion faces + unlabeled shape statistics.
 */

import { metric, clamp, clamp01 } from '../types';
import type { SegmentationDNA } from '../segmentation/types';
import type { GlyphVariantDNA } from './types';

const CURSIVE_COMPANIONS = [
  'Architects Daughter',
  'Shadows Into Light',
  'Caveat',
  'Covered By Your Grace',
] as const;

const PRINT_COMPANIONS = [
  'Architects Daughter',
  'Shadows Into Light',
  'Playpen Sans',
  'Special Elite',
] as const;

export function deriveGlyphVariants(args: {
  primaryFamily: string;
  isCursive: boolean;
  segmentation: SegmentationDNA;
}): GlyphVariantDNA {
  const { primaryFamily, isCursive, segmentation } = args;
  const pool = isCursive ? CURSIVE_COMPANIONS : PRINT_COMPANIONS;
  const companions = pool.filter(
    (c) => c.toLowerCase() !== primaryFamily.toLowerCase(),
  );
  const faces = [primaryFamily, ...companions].slice(0, 3);

  const clusters = segmentation.clusters;
  let meanAspect = 0.72;
  let meanDensity = 0.35;
  let aspectVar = 0.04;

  if (clusters.length > 0) {
    const aspects = clusters.map((c) => c.aspect);
    const densities = clusters.map((c) => c.inkDensity);
    meanAspect = aspects.reduce((a, b) => a + b, 0) / aspects.length;
    meanDensity = densities.reduce((a, b) => a + b, 0) / densities.length;
    const mean = meanAspect;
    aspectVar =
      aspects.reduce((s, a) => s + (a - mean) ** 2, 0) /
      Math.max(1, aspects.length);
  }

  const clusterConf = clamp01(clusters.length / 8);
  const conf = clamp01(
    0.35 * segmentation.confidence + 0.65 * Math.max(clusterConf, 0.2),
  );

  return {
    confidence: conf,
    faceFamilies: metric(
      faces,
      conf,
      clusters.length > 0 ? 'measured' : 'archetype',
      clusters.length,
    ),
    meanAspect: metric(
      clamp(meanAspect, 0.35, 1.8),
      clusterConf,
      clusters.length > 0 ? 'measured' : 'inferred',
      clusters.length,
    ),
    aspectVariance: metric(
      clamp(aspectVar, 0.01, 0.35),
      clusterConf,
      clusters.length > 0 ? 'measured' : 'inferred',
      clusters.length,
    ),
    meanInkDensity: metric(
      clamp(meanDensity, 0.08, 0.85),
      clusterConf,
      clusters.length > 0 ? 'measured' : 'inferred',
      clusters.length,
    ),
  };
}

export type { GlyphVariantDNA };
