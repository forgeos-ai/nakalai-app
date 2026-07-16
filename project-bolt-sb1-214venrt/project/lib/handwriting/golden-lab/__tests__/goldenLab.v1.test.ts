/**
 * Golden Lab v1 — regression gate tests (node:assert).
 * Run: npm run test:golden-lab
 */

import assert from 'node:assert/strict';
import { runGoldenLab, DIMENSIONS } from '../regression';
import { getGoldenSamples } from '../samples';
import { scoreSample } from '../scorecard';
import { GOLDEN_BASELINE, CURRENT_ENGINE_ID } from '../baselines';
import { fingerprintPaintPlan } from '../fingerprint';
import { buildPagePaintPlan } from '../../renderer/instructions';
import { textToSegments } from '../segments';
import {
  resetGlyphEngineMode,
  setGlyphEngineMode,
} from '../../memory/session';
import {
  resetLigatureEngineMode,
  setLigatureEngineMode,
} from '../../ligatures/session';
import {
  resetPressureEngineMode,
  setPressureEngineMode,
} from '../../pressure/session';

function testGoldenSamplesFixed() {
  const samples = getGoldenSamples();
  assert.equal(samples.length, 5, 'expected 5 fixed golden samples');
  const ids = new Set(samples.map((s) => s.id));
  for (const id of Object.keys(GOLDEN_BASELINE.fingerprints)) {
    assert.ok(ids.has(id as keyof typeof GOLDEN_BASELINE.fingerprints), id);
  }
}

function testScorecardDimensions() {
  const sample = getGoldenSamples()[0]!;
  const card = scoreSample({
    sample,
    engineVersion: CURRENT_ENGINE_ID,
  });
  for (const dim of DIMENSIONS) {
    const row = card.dimensions[dim];
    assert.ok(row.score >= 0 && row.score <= 100, dim);
    assert.ok(row.confidence >= 0 && row.confidence <= 1, dim);
    assert.equal(row.dimension, dim);
  }
  assert.match(card.planFingerprint, /^[0-9a-f]{8}$/);
  assert.ok(card.writerMemoryAudit, 'writer memory audit missing');
  assert.ok(card.ligatureAudit, 'ligature audit missing');
  assert.ok(card.motionPhysicsAudit, 'motion physics audit missing');
  assert.ok(
    card.ligatureAudit!.heatmap.length > 0,
    'transition heatmap empty',
  );
  assert.ok(
    card.motionPhysicsAudit!.timeline.length > 0,
    'motion timeline empty',
  );
}

function testFingerprintDeterministic() {
  const sample = getGoldenSamples()[0]!;
  const segments = textToSegments(sample.text);
  setGlyphEngineMode('memory');
  setLigatureEngineMode('intelligent');
  setPressureEngineMode('physics');
  const planA = buildPagePaintPlan({
    dna: sample.dna,
    segments,
    widthPx: sample.widthPx,
    pageSalt: sample.pageSalt,
    glyphSelection: 'contextual',
    wordSpacing: 'rhythm',
  });
  const planB = buildPagePaintPlan({
    dna: sample.dna,
    segments,
    widthPx: sample.widthPx,
    pageSalt: sample.pageSalt,
    glyphSelection: 'contextual',
    wordSpacing: 'rhythm',
  });
  resetGlyphEngineMode();
  resetLigatureEngineMode();
  resetPressureEngineMode();
  assert.equal(fingerprintPaintPlan(planA), fingerprintPaintPlan(planB));
  const families = new Set(
    planA.lines.flatMap((line) =>
      line.glyphs.filter((glyph) => glyph.char !== ' ').map((glyph) => glyph.family),
    ),
  );
  assert.deepEqual(
    [...families],
    [sample.dna.profileHints.fontFamily],
    'writer memory must preserve the writer family',
  );
  const hasTransitions = planA.lines.some((line) =>
    line.glyphs.some((glyph) => glyph.transition),
  );
  assert.ok(hasTransitions, 'intelligent mode must emit transition plans');
  const hasInventedConnectors = planA.lines.some((line) =>
    line.glyphs.some((glyph) => glyph.connector),
  );
  assert.equal(
    hasInventedConnectors,
    false,
    'intelligent mode must not invent Bezier connectors',
  );
  const hasMotion = planA.lines.some((line) =>
    line.glyphs.some((glyph) => glyph.motion),
  );
  assert.ok(hasMotion, 'physics mode must emit motion payloads');
  assert.equal(
    fingerprintPaintPlan(planA),
    GOLDEN_BASELINE.fingerprints[sample.id],
  );
}

function testGoldenLabPass() {
  const report = runGoldenLab();
  assert.equal(report.samples.length, 5);
  assert.equal(report.baseline.length, 5);
  assert.equal(report.current.length, 5);
  assert.equal(report.regressions.length, 5);

  for (const verdict of report.regressions) {
    assert.ok(
      verdict.dimensionDeltas.continuityScore > 0,
      `${verdict.sampleId} continuity`,
    );
    assert.ok(
      verdict.dimensionDeltas.overallRealism > 0,
      `${verdict.sampleId} overall realism`,
    );
    assert.ok(
      verdict.dimensionDeltas.spacing >= 0,
      `${verdict.sampleId} spacing regression`,
    );
    assert.ok(
      verdict.dimensionDeltas.baseline >= 0,
      `${verdict.sampleId} baseline regression`,
    );
    assert.ok(
      verdict.dimensionDeltas.glyphDiversity >= 0,
      `${verdict.sampleId} glyph diversity regression`,
    );
    assert.ok(
      verdict.dimensionDeltas.writerConsistency >= 0,
      `${verdict.sampleId} writer consistency regression`,
    );
    assert.ok(
      verdict.dimensionDeltas.motionScore > 0,
      `${verdict.sampleId} motion regression`,
    );
    assert.ok(
      verdict.dimensionDeltas.pressure > 0,
      `${verdict.sampleId} pressure regression`,
    );
    assert.ok(
      verdict.dimensionDeltas.transitionConsistency >= 0,
      `${verdict.sampleId} ligature consistency regression`,
    );
    assert.ok(verdict.deltaOverall >= 0, `${verdict.sampleId} overall regression`);
    assert.equal(verdict.noRegression, true, `${verdict.sampleId} regression`);
    assert.equal(verdict.planFingerprintMatch, true, `${verdict.sampleId} fp`);
    assert.equal(
      verdict.currentFingerprint,
      GOLDEN_BASELINE.fingerprints[verdict.sampleId],
    );
  }

  assert.equal(report.mergeReady, true, report.summary);
  assert.match(report.summary, /^PASS/);
}

function main() {
  testGoldenSamplesFixed();
  testScorecardDimensions();
  testFingerprintDeterministic();
  testGoldenLabPass();
  console.log('goldenLab.v1.test.ts — all passed');
}

main();
