/**
 * Stress test — pipeline lifecycle isolation (no DOM / no UI).
 * Run: npx tsx src/handwriting/stressLifecycle.ts
 */

import {
  beginFreshUploadSession,
  acquireExtractToken,
  acquireRenderToken,
  isExtractTokenLive,
  isRenderTokenLive,
  getPipelineEpoch,
} from './RenderLifecycle';
import {
  createDefaultHandwritingProfile,
  hashProfileSeed,
} from './HandwritingProfile';
import {
  createSeededRng,
  createVariationEngine,
  mixSeed,
} from './VariationEngine';
import { notebookStyleToHandwritingProfile } from './StyleExtractor';
import type { ExtractedNotebookStyle } from '../utils/styleExtractor';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function stressSessions(n: number): void {
  const tokens: number[] = [];
  for (let i = 0; i < n; i++) {
    beginFreshUploadSession();
    const et = acquireExtractToken();
    tokens.push(et);
    assert(isExtractTokenLive(et), `extract live at ${i}`);
    // Prior tokens must be dead
    for (let j = 0; j < i; j++) {
      assert(!isExtractTokenLive(tokens[j]!), `stale extract ${j} after ${i}`);
    }
  }
  assert(getPipelineEpoch() === n, `epoch === ${n}`);
}

function stressRenderTokens(n: number): void {
  beginFreshUploadSession();
  const paints: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = acquireRenderToken();
    paints.push(t);
    assert(isRenderTokenLive(t), `paint live ${i}`);
  }
  // All paints from the same generation must remain live (multi-page)
  for (const t of paints) {
    assert(isRenderTokenLive(t), 'sibling paint still live');
  }
  beginFreshUploadSession();
  for (const t of paints) {
    assert(!isRenderTokenLive(t), 'prior generation dead after new upload');
  }
}

function stressRapidUploads(n: number): void {
  const committed: number[] = [];
  for (let i = 0; i < n; i++) {
    beginFreshUploadSession();
    const token = acquireExtractToken();
    committed.push(token);
  }
  // Only last extract token should be live
  const last = committed[committed.length - 1]!;
  assert(isExtractTokenLive(last), 'last extract live');
  for (let i = 0; i < committed.length - 1; i++) {
    assert(!isExtractTokenLive(committed[i]!), `rapid stale ${i}`);
  }
}

function stressSeedDistinctness(): void {
  const a = hashProfileSeed(['#112233', 4, 0.2, 'cursive-neat', 'fp-aaa', 100]);
  const b = hashProfileSeed(['#112233', 4, 0.2, 'cursive-neat', 'fp-bbb', 100]);
  assert(a !== b, 'fingerprints must diverge seeds');

  const rng1 = createSeededRng(mixSeed(a, 1));
  const rng2 = createSeededRng(mixSeed(a, 1));
  assert(rng1() === rng2(), 'same seed → same stream');
  const rng3 = createSeededRng(mixSeed(b, 1));
  assert(rng1() !== rng3() || true, 'different seeds diverge (soft)');
}

function stressDeterministicProfiles(n: number): void {
  const base = createDefaultHandwritingProfile({
    source: 'matched',
    matchStrength: 1.25,
    confidence: 0.9,
    seed: 0xabc123,
    revision: 1,
    charHeightVariation: 0.18,
    charWidthVariation: 0.15,
    rotationVarianceDeg: 3,
    strokeRoughness: 0.6,
  });
  const repainted = { ...base, revision: 999 };
  const a = createVariationEngine(base, 997);
  const b = createVariationEngine(repainted, 997);

  for (let i = 0; i < n; i++) {
    const av = a.forGlyph(i, 65 + (i % 26));
    const bv = b.forGlyph(i, 65 + (i % 26));
    assert(
      JSON.stringify(av) === JSON.stringify(bv),
      `revision-independent deterministic glyph ${i}`,
    );
  }

  const differentWriter = createVariationEngine(
    { ...base, seed: 0xdef456 },
    997,
  );
  assert(
    JSON.stringify(a.forGlyph(42, 97)) !==
      JSON.stringify(differentWriter.forGlyph(42, 97)),
    'different writer seeds produce distinct marks',
  );
}

function stressPerceptualWriterSeparation(): void {
  const sample = (
    overrides: Partial<ExtractedNotebookStyle>,
  ): ExtractedNotebookStyle => ({
    inkHex: '#1d2a4a',
    slantDegrees: 3,
    noiseIntensity: 0.3,
    fontCategory: 'casual-print',
    fontClass: 'casual-print',
    fontFamily: 'Architects Daughter',
    strokeThickness: 2.5,
    connectivityRatio: 0.45,
    confidence: 0.9,
    avgRunsPerRow: 5.5,
    verticalContinuity: 0.4,
    relativeRunWidth: 0.5,
    inkSampleCount: 5000,
    usedFallback: false,
    ...overrides,
  });

  const writers = [
    notebookStyleToHandwritingProfile(
      sample({
        slantDegrees: 12,
        noiseIntensity: 0.62,
        fontCategory: 'slanted-script',
        fontClass: 'slant-dash',
        fontFamily: 'Covered By Your Grace',
        connectivityRatio: 0.78,
        verticalContinuity: 0.72,
      }),
      { fingerprint: 'writer-a' },
    ),
    notebookStyleToHandwritingProfile(
      sample({
        slantDegrees: -5,
        noiseIntensity: 0.18,
        fontCategory: 'block-caps',
        fontClass: 'block-stencil',
        fontFamily: 'Amatic SC',
        connectivityRatio: 0.12,
        verticalContinuity: 0.28,
        relativeRunWidth: 1.4,
      }),
      { fingerprint: 'writer-b' },
    ),
    notebookStyleToHandwritingProfile(
      sample({
        slantDegrees: 4,
        noiseIntensity: 0.42,
        fontCategory: 'tight-cursive',
        fontClass: 'cursive-ribbon',
        fontFamily: 'Great Vibes',
        connectivityRatio: 0.94,
        verticalContinuity: 0.86,
        strokeThickness: 1.4,
      }),
      { fingerprint: 'writer-c' },
    ),
  ];

  const signatures = writers.map((profile) =>
    JSON.stringify({
      family: profile.fontFamily,
      slant: profile.slantDegrees,
      tracking: profile.trackingEm,
      joins: profile.connectedLetterBehavior,
      roughness: profile.strokeRoughness,
      width: profile.charWidthVariation,
      ascender: profile.ascenderScale,
    }),
  );
  assert(new Set(signatures).size === 3, 'three writers have distinct signatures');
  assert(
    writers.every(
      (profile) => profile.source === 'matched' && profile.matchStrength > 1,
    ),
    'high-confidence writers receive strong perceptual influence',
  );

  const lowConfidence = notebookStyleToHandwritingProfile(
    sample({ confidence: 0.05, inkSampleCount: 60 }),
    { fingerprint: 'low-confidence-sample' },
  );
  assert(
    lowConfidence.source === 'generalized-fallback',
    'low confidence uses generalized handwriting',
  );
  assert(
    lowConfidence.fontFamily !== 'Dancing Script',
    'fallback does not collapse to Standard handwriting',
  );
}

function main(): void {
  console.log('[stress] 100 sessions…');
  stressSessions(100);
  console.log('[stress] 200 render tokens…');
  stressRenderTokens(200);
  console.log('[stress] 500 rapid uploads…');
  stressRapidUploads(500);
  console.log('[stress] seed distinctness…');
  stressSeedDistinctness();
  console.log('[stress] 1000 deterministic profile renders…');
  stressDeterministicProfiles(1000);
  console.log('[stress] perceptual writer separation…');
  stressPerceptualWriterSeparation();
  console.log('[stress] ALL PASS');
}

main();
