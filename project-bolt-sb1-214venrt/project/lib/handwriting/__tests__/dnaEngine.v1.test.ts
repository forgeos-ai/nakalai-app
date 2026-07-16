/**
 * DNA Engine v1 — focused verification (node:assert, no vitest required).
 * Run: npx tsx lib/handwriting/__tests__/dnaEngine.v1.test.ts
 */

import assert from 'node:assert/strict';
import {
  hashDnaSeed,
  mixSeed,
  createSeededRng,
  assembleHandwritingDNA,
  handwritingDnaToProfile,
  setActiveHandwritingDNA,
  clearHandwritingDNA,
  getActiveHandwritingDNA,
  emptySegmentationDNA,
  deriveGlyphVariants,
  deriveRhythm,
  deriveSpacing,
  deriveBaseline,
  deriveLigatures,
  buildPagePaintPlan,
  profileToLightweightDna,
  destroyHandwritingSession,
} from '../index';
import { createDefaultHandwritingProfile } from '../../../src/handwriting/HandwritingProfile';
import type { PageSegment } from '../../../src/pagination';

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

function sampleSegments(): PageSegment[] {
  return [
    {
      type: 'line',
      words: [
        {
          chars: [
            { char: 'H', globalIndex: 0 },
            { char: 'i', globalIndex: 1 },
          ],
        },
        {
          chars: [{ char: ' ', globalIndex: 2 }],
        },
        {
          chars: [
            { char: 'a', globalIndex: 3 },
            { char: 'a', globalIndex: 4 },
          ],
        },
      ],
    },
  ];
}

function run() {
  // 1. Deterministic seeds
  const a = hashDnaSeed(['#1d4ed8', 6.5, 0.35, 'cursive-neat']);
  const b = hashDnaSeed(['#1d4ed8', 6.5, 0.35, 'cursive-neat']);
  assert.equal(a, b, 'hashDnaSeed must be stable');
  assert.notEqual(
    hashDnaSeed(['#1d4ed8', 6.5, 0.35, 'casual-print']),
    a,
    'different inputs must diverge',
  );

  const rng1 = createSeededRng(mixSeed(a, 7));
  const rng2 = createSeededRng(mixSeed(a, 7));
  const stream1 = [rng1(), rng1(), rng1()];
  const stream2 = [rng2(), rng2(), rng2()];
  assert.deepEqual(stream1, stream2, 'seeded RNG must replay');

  // 2. Assemble DNA from high-confidence metrics
  const seg = emptySegmentationDNA('fallback');
  seg.confidence = 0.6;
  seg.lineCount = { value: 3, confidence: 0.7, source: 'measured', support: 3 };
  seg.characterCount = {
    value: 40,
    confidence: 0.8,
    source: 'measured',
    support: 40,
  };
  seg.strokeThickness = {
    value: 3.1,
    confidence: 0.75,
    source: 'measured',
  };
  seg.connectivityRatio = {
    value: 0.7,
    confidence: 0.75,
    source: 'measured',
  };
  seg.clusters = [
    {
      signature: 'abc',
      frequency: 5,
      aspect: 0.7,
      inkDensity: 0.4,
      bboxCount: 5,
    },
  ];

  const dna1 = assembleHandwritingDNA({
    extracted: syntheticExtracted(),
    segmentation: seg,
    fingerprint: 'fp-test-1',
  });
  const dna2 = assembleHandwritingDNA({
    extracted: syntheticExtracted(),
    segmentation: seg,
    fingerprint: 'fp-test-1',
  });
  assert.equal(dna1.seed, dna2.seed, 'same input → same DNA seed');
  assert.equal(dna1.source, 'matched');
  assert.equal(dna1.usedFallback, false);
  assert.ok(dna1.confidence > 0.4);
  assert.equal(dna1.render.deterministic, true);
  assert.equal(dna1.ligatures.observedPairJoins.length, 0, 'no OCR pair joins');

  const dnaOther = assembleHandwritingDNA({
    extracted: syntheticExtracted(),
    segmentation: seg,
    fingerprint: 'fp-test-OTHER',
  });
  assert.notEqual(dna1.seed, dnaOther.seed, 'fingerprints must separate writers');

  // 3. Fallback path
  const fallbackDna = assembleHandwritingDNA({
    extracted: syntheticExtracted({ confidence: 0.1, usedFallback: true }),
    segmentation: emptySegmentationDNA('fallback'),
    fingerprint: 'fp-blank',
  });
  assert.equal(fallbackDna.source, 'generalized-fallback');
  assert.equal(fallbackDna.usedFallback, true);

  // 4. Engine modules expose confidence
  const glyphs = deriveGlyphVariants({
    primaryFamily: 'Dancing Script',
    isCursive: true,
    segmentation: seg,
  });
  assert.ok(glyphs.confidence >= 0);
  assert.ok(glyphs.faceFamilies.value.length >= 1);

  const rhythm = deriveRhythm({
    seed: dna1.seed,
    connectivity: 0.7,
    noise: 0.3,
    slantDegrees: 6,
    confidence: 0.8,
    segmentation: seg,
  });
  assert.ok(rhythm.writingSpeed.value > 0);

  const spacing = deriveSpacing({
    isCursive: true,
    connectivity: 0.7,
    noise: 0.3,
    confidence: 0.8,
    traitGain: 1.2,
    segmentation: seg,
    defaultTrackingEm: 0.008,
    defaultLineSpaceScale: 1,
    defaultMarginScale: 1,
  });
  assert.ok(spacing.wordSpacingEm.value > 0);
  assert.ok(spacing.kerning.value.doubleLetter < 0);

  const baseline = deriveBaseline({
    slantDegrees: 6.5,
    noise: 0.3,
    vertical: 0.7,
    confidence: 0.8,
    matchStrength: 1,
    segmentation: seg,
  });
  assert.ok(Math.abs(baseline.globalSlantDegrees.value - 6.5) < 0.01);

  const ligatures = deriveLigatures({
    isCursive: true,
    connectivity: 0.7,
    vertical: 0.7,
    confidence: 0.8,
    matchStrength: 1,
  });
  assert.ok(ligatures.connectedLetterBehavior.value > 0);

  // 5. Profile adapter
  const profile = handwritingDnaToProfile(dna1);
  assert.equal(profile.seed, dna1.seed);
  assert.equal(profile.fontFamily, dna1.profileHints.fontFamily);
  assert.equal(profile.inkHex, dna1.ink.value);

  // 6. Paint plan determinism (no canvas)
  const planA = buildPagePaintPlan({
    dna: dna1,
    segments: sampleSegments(),
    widthPx: 600,
    pageSalt: 997,
  });
  const planB = buildPagePaintPlan({
    dna: dna1,
    segments: sampleSegments(),
    widthPx: 600,
    pageSalt: 997,
  });
  assert.equal(planA.lines.length, planB.lines.length);
  assert.equal(
    planA.lines[0]?.glyphs.length,
    planB.lines[0]?.glyphs.length,
  );
  assert.equal(
    planA.lines[0]?.glyphs[0]?.family,
    planB.lines[0]?.glyphs[0]?.family,
  );
  assert.equal(
    planA.lines[0]?.glyphs[0]?.rotationRad,
    planB.lines[0]?.glyphs[0]?.rotationRad,
  );
  assert.equal(
    planA.lines[0]?.glyphs[0]?.alpha,
    planB.lines[0]?.glyphs[0]?.alpha,
  );

  const planDiffPage = buildPagePaintPlan({
    dna: dna1,
    segments: sampleSegments(),
    widthPx: 600,
    pageSalt: 1,
  });
  assert.notEqual(
    planA.lines[0]?.glyphs[0]?.rotationRad,
    planDiffPage.lines[0]?.glyphs[0]?.rotationRad,
  );

  // 7. Session store + privacy destroy
  setActiveHandwritingDNA(dna1);
  assert.ok(getActiveHandwritingDNA());
  clearHandwritingDNA();
  assert.equal(getActiveHandwritingDNA(), null);

  setActiveHandwritingDNA(dna1);
  destroyHandwritingSession({ scrubDom: false, invalidateRenders: true });
  assert.equal(getActiveHandwritingDNA(), null);

  // 8. Standard profile → lightweight DNA is deterministic
  const std = createDefaultHandwritingProfile({
    source: 'standard',
    matchStrength: 0,
    seed: 42,
  });
  const lite = profileToLightweightDna(std);
  assert.equal(lite.render.deterministic, true);
  assert.equal(lite.seed, 42);

  // 9. Trait MAE gate on synthetic (slant passthrough before amplify):
  // assemble amplifies slant — verify directionality preserved
  const leftLean = assembleHandwritingDNA({
    extracted: syntheticExtracted({ slantDegrees: -8 }),
    segmentation: seg,
    fingerprint: 'fp-left',
  });
  assert.ok(
    leftLean.slantDegrees.value < 0,
    'negative slant must remain left-leaning',
  );
  const mae =
    Math.abs(leftLean.slantDegrees.value - (-8 * 1.12)) < 5
      ? Math.abs(leftLean.slantDegrees.value - -8)
      : Math.abs(leftLean.slantDegrees.value - -8);
  assert.ok(mae <= 8, `slant amplification within expected band, mae=${mae}`);

  console.log('DNA Engine v1 tests passed:', {
    seed: dna1.seed,
    confidence: Number(dna1.confidence.toFixed(3)),
    glyphs: dna1.glyphs.faceFamilies.value.length,
    planGlyphs: planA.lines[0]?.glyphs.length,
  });
}

run();
