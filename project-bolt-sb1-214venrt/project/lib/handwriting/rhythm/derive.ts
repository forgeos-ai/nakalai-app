import { metric, clamp, clamp01, createSeededRng } from '../types';
import type { SegmentationDNA } from '../segmentation/types';
import type { RhythmDNA } from './types';

export function deriveRhythm(args: {
  seed: number;
  connectivity: number;
  noise: number;
  slantDegrees: number;
  confidence: number;
  segmentation: SegmentationDNA;
}): RhythmDNA {
  const {
    seed,
    connectivity,
    noise,
    slantDegrees,
    confidence,
    segmentation,
  } = args;

  const writingSpeed = clamp(
    connectivity * 0.5 + noise * 0.32 + Math.abs(slantDegrees) / 50,
    0.12,
    1,
  );
  const lineMod = clamp(
    0.02 + noise * 0.08 + (1 - segmentation.confidence) * 0.03,
    0.02,
    0.14,
  );
  const randomness = clamp(noise * 0.72 + (1 - confidence) * 0.12, 0.08, 0.88);
  const driftFrequency = clamp(0.2 + noise * 0.5 + writingSpeed * 0.15, 0.15, 0.9);
  const rng = createSeededRng(seed ^ 0x52485954); // 'RHYT'
  const pagePhase = rng() * Math.PI * 2;

  const conf = clamp01(0.55 * confidence + 0.45 * segmentation.confidence);

  return {
    confidence: conf,
    writingSpeed: metric(writingSpeed, conf, 'inferred'),
    lineHeightModulation: metric(lineMod, conf, 'inferred'),
    randomness: metric(randomness, conf, confidence > 0.28 ? 'measured' : 'fallback'),
    driftFrequency: metric(driftFrequency, conf, 'inferred'),
    pageRhythmPhase: metric(pagePhase, conf, 'inferred'),
  };
}

export type { RhythmDNA };
