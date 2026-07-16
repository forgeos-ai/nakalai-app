import { metric, clamp, clamp01 } from '../types';
import type { SegmentationDNA } from '../segmentation/types';
import type { BaselineDNA } from './types';

export function deriveBaseline(args: {
  slantDegrees: number;
  noise: number;
  vertical: number;
  confidence: number;
  matchStrength: number;
  segmentation: SegmentationDNA;
}): BaselineDNA {
  const {
    slantDegrees,
    noise,
    vertical,
    confidence,
    matchStrength,
    segmentation,
  } = args;

  const drift = clamp(
    (noise * 0.72 + (1 - vertical) * 0.3) * matchStrength,
    0.06,
    1,
  );
  const rotationVarianceDeg = clamp(
    (0.35 + noise * 2.8 + (1 - vertical) * 0.8) * matchStrength,
    0.35,
    4,
  );

  const baselines =
    segmentation.lineBands.length > 0
      ? segmentation.lineBands.map((b) => b.bottom)
      : [];

  const conf = clamp01(
    0.45 * confidence +
      0.55 *
        Math.max(
          segmentation.meanBaselinePx.confidence,
          baselines.length > 0 ? segmentation.confidence : 0,
        ),
  );

  return {
    confidence: conf,
    globalSlantDegrees: metric(
      slantDegrees,
      confidence,
      confidence > 0.28 ? 'measured' : 'fallback',
    ),
    drift: metric(drift, conf, 'inferred'),
    lineBaselinesPx: metric(
      baselines,
      baselines.length > 0 ? conf : 0,
      baselines.length > 0 ? 'measured' : 'inferred',
      baselines.length,
    ),
    meanBaselinePx: metric(
      segmentation.meanBaselinePx.value,
      segmentation.meanBaselinePx.confidence,
      segmentation.meanBaselinePx.source,
    ),
    rotationVarianceDeg: metric(rotationVarianceDeg, conf, 'inferred'),
  };
}

export type { BaselineDNA };
