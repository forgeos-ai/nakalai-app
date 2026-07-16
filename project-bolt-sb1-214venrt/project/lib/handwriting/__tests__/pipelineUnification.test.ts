/**
 * Sprint E0 — pipeline unification parity tests (node:assert).
 * Run: npm run test:pipeline-unification
 */

import assert from 'node:assert/strict';
import {
  assembleHandwritingDNA,
  buildPagePaintPlan,
  emptySegmentationDNA,
} from '../index';
import { buildProductionPaintPlan } from '../renderer/paint';
import { comparePaintPlans } from '../renderer/planParity';
import { fingerprintPaintPlan } from '../golden-lab/fingerprint';
import { runGoldenLab } from '../golden-lab/regression';
import { getGoldenSamples } from '../golden-lab/samples';
import { textToSegments } from '../golden-lab/segments';
import { GOLDEN_BASELINE } from '../golden-lab/baselines';

function syntheticExtracted(overrides: Record<string, unknown> = {}) {
  return {
    inkHex: '#1d4ed8',
    slantDegrees: 6.5,
    noiseIntensity: 0.35,
    fontCategory: 'tight-cursive' as const,
    fontClass: 'cursive-neat' as const,
    fontFamily: 'Dancing Script',
    strokeThickness: 3.2,
    connectivityRatio: 0.72,
    confidence: 0.82,
    avgRunsPerRow: 4.2,
    verticalContinuity: 0.7,
    relativeRunWidth: 0.55,
    inkSampleCount: 400,
    usedFallback: false,
    ...overrides,
  };
}

function testProductionMatchesGoldenLabPlan() {
  const samples = getGoldenSamples();
  for (const sample of samples) {
    const segments = textToSegments(sample.text);
    const goldenPlan = buildPagePaintPlan({
      dna: sample.dna,
      segments,
      widthPx: sample.widthPx,
      pageSalt: sample.pageSalt,
      glyphSelection: 'contextual',
      wordSpacing: 'rhythm',
    });
    const productionPlan = buildProductionPaintPlan({
      dna: sample.dna,
      segments,
      widthPx: sample.widthPx,
      pageSalt: sample.pageSalt,
      glyphSelection: 'contextual',
    });
    const parity = comparePaintPlans(goldenPlan, productionPlan);
    assert.equal(
      parity.equal,
      true,
      `${sample.id} plan mismatch: ${JSON.stringify(parity.diffs.slice(0, 3))}`,
    );
    assert.equal(
      fingerprintPaintPlan(goldenPlan),
      fingerprintPaintPlan(productionPlan),
      `${sample.id} fingerprint`,
    );
  }
}

function testProductionMatchesAdHocDna() {
  const dna = assembleHandwritingDNA({
    extracted: syntheticExtracted(),
    segmentation: emptySegmentationDNA('fallback'),
    fingerprint: 'e0-parity',
  });
  const segments = textToSegments('Motion physics waits for one pipeline.');
  const args = {
    dna,
    segments,
    widthPx: 640,
    pageSalt: 42,
    glyphSelection: 'contextual' as const,
  };
  const goldenPlan = buildPagePaintPlan({ ...args, wordSpacing: 'rhythm' as const });
  const productionPlan = buildProductionPaintPlan(args);
  const parity = comparePaintPlans(goldenPlan, productionPlan);
  assert.equal(parity.equal, true, parity.diffs.slice(0, 5));
}

function testGoldenLabUnchanged() {
  const report = runGoldenLab();
  assert.equal(report.mergeReady, true, report.summary);
  for (const verdict of report.regressions) {
    assert.equal(verdict.planFingerprintMatch, true, verdict.sampleId);
    assert.equal(
      verdict.currentFingerprint,
      GOLDEN_BASELINE.fingerprints[verdict.sampleId],
    );
  }
}

function main() {
  testProductionMatchesGoldenLabPlan();
  testProductionMatchesAdHocDna();
  testGoldenLabUnchanged();
  console.log('pipelineUnification.test.ts — all passed');
}

main();
