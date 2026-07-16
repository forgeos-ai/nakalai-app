/**
 * Sprint E — motion physics benchmark (node:assert).
 * Run: npm run test:motion-benchmark
 */

import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { getGoldenSamples } from '../golden-lab/samples';
import { textToSegments } from '../golden-lab/segments';
import { buildPagePaintPlan } from '../renderer/instructions';
import {
  setPressureEngineMode,
  resetPressureEngineMode,
} from '../pressure/session';

const REGRESSION_THRESHOLD = 1.05;

function benchBuild(mode: 'legacy' | 'physics', iterations: number): number {
  const sample = getGoldenSamples()[0]!;
  const segments = textToSegments(sample.text);
  setPressureEngineMode(mode);
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    buildPagePaintPlan({
      dna: sample.dna,
      segments,
      widthPx: sample.widthPx,
      pageSalt: sample.pageSalt,
      glyphSelection: 'contextual',
      wordSpacing: 'rhythm',
    });
  }
  resetPressureEngineMode();
  return (performance.now() - start) / iterations;
}

function main() {
  const iterations = 40;
  const legacyMs = benchBuild('legacy', iterations);
  const physicsMs = benchBuild('physics', iterations);
  const ratio = physicsMs / legacyMs;

  console.log(
    JSON.stringify(
      {
        legacyBuildMs: Number(legacyMs.toFixed(3)),
        physicsBuildMs: Number(physicsMs.toFixed(3)),
        ratio: Number(ratio.toFixed(3)),
        threshold: REGRESSION_THRESHOLD,
        pass: ratio < REGRESSION_THRESHOLD,
      },
      null,
      2,
    ),
  );

  assert.ok(
    ratio < REGRESSION_THRESHOLD,
    `build time regression ${(ratio * 100).toFixed(1)}% >= 5%`,
  );
  console.log('motionBenchmark.test.ts — all passed');
}

main();
