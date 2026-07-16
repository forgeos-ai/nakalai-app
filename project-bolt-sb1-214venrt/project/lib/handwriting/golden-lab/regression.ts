/**
 * Visual / metric regression — baseline vs current engine.
 */

import { getGoldenSamples } from './samples';
import { scoreSample } from './scorecard';
import {
  BASELINE_ENGINE_ID,
  CURRENT_ENGINE_ID,
  GOLDEN_BASELINE,
} from './baselines';
import type {
  GoldenLabReport,
  RegressionVerdict,
  ScorecardDimension,
  EngineScorecard,
} from './types';
import { GOLDEN_LAB_VERSION } from './types';

const DIMENSIONS: ScorecardDimension[] = [
  'glyphDiversity',
  'writerConsistency',
  'spacing',
  'baseline',
  'pressure',
  'motionScore',
  'inkConsistency',
  'strokeFlow',
  'rhythm',
  'ligatures',
  'transitionConsistency',
  'continuityScore',
  'joinConfidence',
  'overallRealism',
];

/** Dimensions that must not regress (Sprint E gate). */
const NO_REGRESS: ScorecardDimension[] = [
  'spacing',
  'baseline',
  'glyphDiversity',
  'writerConsistency',
];

function compareScorecards(
  baseline: EngineScorecard,
  current: EngineScorecard,
): RegressionVerdict {
  const dimensionDeltas = {} as RegressionVerdict['dimensionDeltas'];
  let noRegression = true;

  for (const dim of DIMENSIONS) {
    const delta = current.dimensions[dim].score - baseline.dimensions[dim].score;
    dimensionDeltas[dim] = delta;
    const floor =
      GOLDEN_BASELINE.dimensionFloors[baseline.sampleId][
        dim as keyof (typeof GOLDEN_BASELINE.dimensionFloors)[typeof baseline.sampleId]
      ];
    if (typeof floor === 'number' && current.dimensions[dim].score < floor) {
      noRegression = false;
    }
    if (
      NO_REGRESS.includes(dim) &&
      current.dimensions[dim].score < baseline.dimensions[dim].score
    ) {
      noRegression = false;
    }
  }

  if (current.overall < GOLDEN_BASELINE.overallMin) {
    noRegression = false;
  }

  const storedFp = GOLDEN_BASELINE.fingerprints[baseline.sampleId];
  const planFingerprintMatch =
    !storedFp || storedFp === current.planFingerprint;
  if (!planFingerprintMatch) {
    noRegression = false;
  }

  return {
    sampleId: baseline.sampleId,
    baselineVersion: BASELINE_ENGINE_ID,
    currentVersion: CURRENT_ENGINE_ID,
    baselineOverall: baseline.overall,
    currentOverall: current.overall,
    deltaOverall: current.overall - baseline.overall,
    noRegression,
    improved: current.overall > baseline.overall,
    dimensionDeltas,
    planFingerprintMatch,
    baselineFingerprint: baseline.planFingerprint,
    currentFingerprint: current.planFingerprint,
  };
}

/**
 * Run full Golden Lab evaluation — node + browser safe.
 */
export function runGoldenLab(): GoldenLabReport {
  const samples = getGoldenSamples();
  const baseline: EngineScorecard[] = [];
  const current: EngineScorecard[] = [];
  const regressions: RegressionVerdict[] = [];

  for (const sample of samples) {
    const baseCard = scoreSample({
      sample,
      engineVersion: BASELINE_ENGINE_ID,
      dna: sample.dna,
    });
    const curCard = scoreSample({
      sample,
      engineVersion: CURRENT_ENGINE_ID,
      dna: sample.dna,
    });
    baseline.push(baseCard);
    current.push(curCard);
    regressions.push(compareScorecards(baseCard, curCard));
  }

  const continuityImproved = regressions.every(
    (r) => r.dimensionDeltas.continuityScore > 0,
  );
  const motionImproved = regressions.every(
    (r) => r.dimensionDeltas.motionScore > 0,
  );
  const pressureImproved = regressions.every(
    (r) => r.dimensionDeltas.pressure > 0,
  );
  const overallRealismImproved = regressions.every(
    (r) => r.dimensionDeltas.overallRealism > 0,
  );
  const ligaturesStable = regressions.every(
    (r) =>
      r.dimensionDeltas.transitionConsistency >= 0 &&
      r.dimensionDeltas.continuityScore > 0,
  );
  const mergeReady =
    regressions.every((r) => r.noRegression) &&
    continuityImproved &&
    motionImproved &&
    pressureImproved &&
    overallRealismImproved &&
    ligaturesStable;
  const improvedCount = regressions.filter((r) => r.improved).length;
  const avgOverall =
    current.reduce((s, c) => s + c.overall, 0) / Math.max(1, current.length);

  const summary = mergeReady
    ? `PASS — ${samples.length} samples, avg overall ${avgOverall.toFixed(1)}, ${improvedCount} improved`
    : `FAIL — regression detected on ${regressions.filter((r) => !r.noRegression).length} sample(s)`;

  return {
    version: GOLDEN_LAB_VERSION,
    runAt: new Date().toISOString(),
    samples: samples.map((s) => s.id),
    baseline,
    current,
    regressions,
    mergeReady,
    summary,
  };
}

export { DIMENSIONS };
