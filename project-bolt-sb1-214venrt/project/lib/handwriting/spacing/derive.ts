import { metric, clamp, clamp01 } from '../types';
import type { SegmentationDNA } from '../segmentation/types';
import type { SpacingDNA } from './types';

function amplifyFromCenter(
  value: number,
  center: number,
  strength: number,
  min: number,
  max: number,
): number {
  return clamp(center + (value - center) * strength, min, max);
}

export function deriveSpacing(args: {
  isCursive: boolean;
  connectivity: number;
  noise: number;
  confidence: number;
  traitGain: number;
  segmentation: SegmentationDNA;
  defaultTrackingEm: number;
  defaultLineSpaceScale: number;
  defaultMarginScale: number;
}): SpacingDNA {
  const {
    isCursive,
    connectivity,
    noise,
    confidence,
    traitGain,
    segmentation,
    defaultTrackingEm,
    defaultLineSpaceScale,
    defaultMarginScale,
  } = args;

  const wordSpacingEm = amplifyFromCenter(
    0.12 + (1 - connectivity) * 0.52,
    0.34,
    traitGain,
    0.1,
    0.72,
  );
  const lineSpacingScale = amplifyFromCenter(
    0.92 + noise * 0.2 + connectivity * 0.04,
    defaultLineSpaceScale,
    traitGain,
    0.88,
    1.2,
  );
  const trackingEm = isCursive
    ? clamp(-0.045 + (1 - connectivity) * 0.04, -0.05, 0.008)
    : clamp(
        Math.max(defaultTrackingEm, 0.025 + (1 - connectivity) * 0.075),
        0.02,
        0.105,
      );
  const marginBias = amplifyFromCenter(
    0.91 + (1 - connectivity) * 0.16,
    defaultMarginScale,
    traitGain,
    0.82,
    1.2,
  );
  const marginIrregularityEm = clamp(
    0.04 + noise * 0.3 + (1 - connectivity) * 0.08,
    0.04,
    0.42,
  );

  const measuredGap = segmentation.meanVerticalGapPx;
  const gapConf = measuredGap.confidence;
  const conf = clamp01(0.5 * confidence + 0.5 * Math.max(gapConf, segmentation.confidence));

  // Deterministic kerning priors from connectivity (not per-pair OCR).
  const kerning = {
    doubleLetter: isCursive ? -0.6 - connectivity * 0.15 : -0.25,
    afterVowel: isCursive ? 0.3 - connectivity * 0.1 : 0.35,
    default: isCursive ? -connectivity * 0.25 : 0.12,
  };

  return {
    confidence: conf,
    trackingEm: metric(trackingEm, conf, 'inferred'),
    wordSpacingEm: metric(wordSpacingEm, conf, 'inferred'),
    lineSpacingScale: metric(lineSpacingScale, conf, 'inferred'),
    meanVerticalGapPx: metric(
      measuredGap.value,
      gapConf,
      measuredGap.source,
      measuredGap.support,
    ),
    marginBias: metric(marginBias, conf, 'inferred'),
    marginIrregularityEm: metric(marginIrregularityEm, conf, 'inferred'),
    kerning: metric(kerning, conf, 'inferred'),
  };
}

export type { SpacingDNA };
