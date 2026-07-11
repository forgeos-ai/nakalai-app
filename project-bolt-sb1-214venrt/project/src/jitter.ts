// Deterministic hash-based micro-variance engine.
// Each glyph's transform is seeded by its global index so editing the end
// of the assignment never shifts earlier characters.

export type CharJitter = {
  /** Baseline wobble (px) — letters leave the perfect pixel grid. */
  translateY: number;
  /** Tracking / word-gap slack (px). */
  marginRight: number;
  /** Per-character slant noise + matched bias (deg). */
  rotate: number;
};

/**
 * Image-influenced intensity knobs from Match My Writing Style.
 * Higher photo noise → stronger layout chaos in the live preview.
 */
export type JitterIntensity = {
  /** 0–1 paper/ink grain from styleExtractor / archetype baselineJitter. */
  noiseIntensity?: number;
  /** Baseline slant degrees extracted from the notebook photo. */
  slantBiasDegrees?: number;
  /** True for space glyphs that sit between words. */
  isWordGap?: boolean;
  /**
   * Extra multiplier on vertical baseline wobble (archetype baselineJitter).
   * Defaults to 1; values ~0.2–1.2 scale ±px offsets.
   */
  baselineJitterScale?: number;
};

/**
 * xmur3 string hash — produces a 32-bit seed from a string.
 * Deterministic: same input always yields same output.
 */
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

/**
 * mulberry32 PRNG — fast, deterministic seeded pseudo-random generator.
 * Returns a function that produces floats in [0, 1) on each call.
 */
function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Cache key includes intensity so matched-style changes recompute cleanly. */
function cacheKey(
  globalIndex: number,
  noise: number,
  slant: number,
  isWordGap: boolean,
  baselineScale: number,
): string {
  return `${globalIndex}|n${noise.toFixed(3)}|s${slant.toFixed(2)}|g${isWordGap ? 1 : 0}|b${baselineScale.toFixed(2)}`;
}

const jitterCache = new Map<string, CharJitter>();

/**
 * Micro-variance for one character in the A4 drawing loop.
 *
 * Three image-influenced channels:
 * 1. Baseline jitter — vertical offset up to ~±1.5px (scales with noise)
 * 2. Character slant noise — micro-rotation + matched slant bias
 * 3. Word spacing slack — extra gap on inter-word spaces
 */
export function getCharJitter(
  globalIndex: number,
  intensity: JitterIntensity = {},
): CharJitter {
  const noise = clamp(intensity.noiseIntensity ?? 0, 0, 1);
  const slantBias = intensity.slantBiasDegrees ?? 0;
  const isWordGap = Boolean(intensity.isWordGap);
  const baselineScale = clamp(intensity.baselineJitterScale ?? 1, 0.15, 1.5);

  const key = cacheKey(globalIndex, noise, slantBias, isWordGap, baselineScale);
  const cached = jitterCache.get(key);
  if (cached) return cached;

  const seedFn = xmur3(`char-${globalIndex}`);
  const rand = mulberry32(seedFn());

  // Image-driven chaos: noiseIntensity from styleExtractor scales all three
  // micro-variance channels (baseline, slant noise, word-gap slack).
  // Floor keeps mild human variance; matched grain pushes toward full band.
  const chaos = 0.22 + noise * 0.78;

  // 1) Baseline jitter — leave the perfect pixel grid (±px scaled by noise + archetype)
  const baselineAmp = 1.5 * chaos * baselineScale;
  const translateY = (rand() - 0.5) * 2 * baselineAmp;

  // 2) Character slant noise — micro-rotation matrix shift per glyph
  const slantNoiseAmp = 1.1 + chaos * 2.4; // ~±1.1° … ±3.5°
  const rotate = (rand() - 0.5) * 2 * slantNoiseAmp + slantBias;

  // 3) Tracking + word-spacing slack
  let marginRight = (rand() - 0.35) * (0.55 + chaos * 0.9); // letter tracking
  if (isWordGap) {
    // Human cadence: irregular gaps between words (tight fraction of an em)
    const slack = (rand() - 0.25) * (1.2 + chaos * 2.8);
    marginRight += slack;
  }

  const result: CharJitter = {
    translateY: Math.round(translateY * 100) / 100,
    marginRight: Math.round(marginRight * 100) / 100,
    rotate: Math.round(rotate * 100) / 100,
  };

  jitterCache.set(key, result);
  return result;
}

/** Drop cached transforms (e.g. after a new Match My Style photo). */
export function clearJitterCache(): void {
  jitterCache.clear();
}
