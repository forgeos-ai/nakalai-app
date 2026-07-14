/**
 * VariationEngine — seeded procedural variation (never Math.random).
 * Same (profile.seed, stream key, glyph index) → identical jitter.
 */

import type { HandwritingProfile } from './HandwritingProfile';

/** Mulberry32 — compact deterministic PRNG. */
export function createSeededRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function mixSeed(a: number, b: number): number {
  let h = (a >>> 0) ^ Math.imul(b >>> 0, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

export type GlyphVariation = {
  /** Independent rotation; global slant is applied as a shear. */
  rotationDeg: number;
  /** Horizontal spacing nudge (px). */
  spacingPx: number;
  /** Vertical baseline wobble (px). */
  baselineWobblePx: number;
  /** Optical stroke / shadow thickness scale. */
  strokeThickness: number;
  /** Alpha multiplier 0–1. */
  alpha: number;
  /** Horizontal form scale. */
  scaleX: number;
  /** Vertical form scale. */
  scaleY: number;
  /** Small deterministic duplicate-stroke offset. */
  roughOffsetX: number;
  roughOffsetY: number;
  /** Connector curvature multiplier. */
  connectorCurve: number;
  /** Companion glyph face index (0 = primary). */
  glyphFaceIndex: number;
};

export type LineVariation = {
  /** Per-line left edge movement in px. */
  marginOffsetPx: number;
  /** Slow baseline phase so drift looks written rather than noisy. */
  baselinePhase: number;
  /** Per-line height rhythm. */
  heightScale: number;
};

export type VariationEngine = {
  readonly seed: number;
  /** Unit float in [0, 1). */
  next: () => number;
  range: (min: number, max: number) => number;
  signed: (scale: number) => number;
  forGlyph: (globalIndex: number, charCode: number) => GlyphVariation;
  forLine: (lineIndex: number, fontSizePx: number) => LineVariation;
  shouldConnect: (
    globalIndex: number,
    charCode: number,
    nextCharCode: number,
  ) => boolean;
  pickGlyphFamily: (
    families: readonly string[],
    globalIndex: number,
    charCode: number,
  ) => string;
};

/**
 * Create a variation engine bound to a handwriting profile.
 * `streamSalt` isolates pages / paint passes without changing the core seed.
 */
export function createVariationEngine(
  profile: HandwritingProfile,
  streamSalt = 0,
): VariationEngine {
  // Revision is intentionally excluded: it is a repaint trigger, not style
  // identity. Same profile + page always produces the same marks.
  const rootSeed = mixSeed(profile.seed, streamSalt);
  const intensity = Math.min(1, Math.max(0, profile.randomness));
  const perceptualStrength =
    profile.source === 'standard'
      ? 0.12
      : Math.min(1.5, Math.max(0.55, profile.matchStrength));

  const forGlyph = (globalIndex: number, charCode: number): GlyphVariation => {
    const glyphSeed = mixSeed(rootSeed, mixSeed(globalIndex + 1, charCode + 1));
    const rng = createSeededRng(glyphSeed);
    const r1 = rng();
    const r2 = rng();
    const r3 = rng();
    const r4 = rng();
    const r5 = rng();
    const r6 = rng();
    const r7 = rng();
    const r8 = rng();
    const r9 = rng();
    const r10 = rng();

    // Average pairs for a center-weighted, natural distribution.
    const centeredRotation = (r1 + r7) * 0.5 - 0.5;
    const centeredWidth = (r2 + r8) * 0.5 - 0.5;
    const centeredHeight = (r3 + r9) * 0.5 - 0.5;
    const slantJitter =
      centeredRotation *
      2 *
      profile.rotationVarianceDeg *
      perceptualStrength;
    const spacing =
      (r2 - 0.5) *
      (profile.isCursive ? 1.35 : 0.9) *
      intensity *
      perceptualStrength *
      2;
    const wobble =
      (r3 - 0.5) *
      profile.baselineDrift *
      (profile.isCursive ? 1.7 : 1.05) *
      2.5 *
      perceptualStrength;
    const stroke =
      profile.strokeWidthPx *
      (0.9 + (r4 - 0.5) * 0.28 * intensity * perceptualStrength);
    const alpha = Math.max(
      0.62,
      1 -
        profile.strokeOpacityVariation *
          perceptualStrength *
          (0.25 + r5 * 0.75),
    );
    const scaleX = Math.max(
      0.72,
      1 +
        centeredWidth *
          2 *
          profile.charWidthVariation *
          perceptualStrength -
        profile.writingSpeed * 0.035 * perceptualStrength,
    );
    const scaleY = Math.max(
      0.76,
      1 +
        centeredHeight *
          2 *
          profile.charHeightVariation *
          perceptualStrength,
    );
    const roughAmplitude =
      profile.strokeRoughness * 0.7 * perceptualStrength;
    const roughOffsetX = (r6 - 0.5) * 2 * roughAmplitude;
    const roughOffsetY = (r10 - 0.5) * 2 * roughAmplitude;
    const connectorCurve =
      0.78 + r8 * 0.44 * profile.entryExitCurvature;
    const glyphFaceIndex = Math.floor(r6 * 3) % 3;

    return {
      rotationDeg: slantJitter,
      spacingPx: spacing,
      baselineWobblePx: wobble,
      strokeThickness: stroke,
      alpha,
      scaleX,
      scaleY,
      roughOffsetX,
      roughOffsetY,
      connectorCurve,
      glyphFaceIndex,
    };
  };

  const forLine = (
    lineIndex: number,
    fontSizePx: number,
  ): LineVariation => {
    const rng = createSeededRng(mixSeed(rootSeed, 0x1a1e ^ (lineIndex + 1)));
    const centered = (rng() + rng()) * 0.5 - 0.5;
    return {
      marginOffsetPx:
        centered *
        2 *
        profile.marginIrregularityEm *
        fontSizePx *
        perceptualStrength,
      baselinePhase: rng() * Math.PI * 2,
      heightScale:
        1 +
        (rng() - 0.5) *
          profile.charHeightVariation *
          0.55 *
          perceptualStrength,
    };
  };

  const shouldConnect = (
    globalIndex: number,
    charCode: number,
    nextCharCode: number,
  ): boolean => {
    if (!profile.isCursive || profile.connectedLetterBehavior <= 0) {
      return false;
    }
    const rng = createSeededRng(
      mixSeed(rootSeed, mixSeed(globalIndex + 0xc011, charCode ^ nextCharCode)),
    );
    const probability = Math.min(
      0.98,
      profile.connectedLetterBehavior *
        (0.72 + profile.writingSpeed * 0.28) *
        perceptualStrength,
    );
    return rng() < probability;
  };

  const shared = createSeededRng(rootSeed);

  return {
    seed: rootSeed,
    next: shared,
    range: (min, max) => min + shared() * (max - min),
    signed: (scale) => (shared() - 0.5) * 2 * scale,
    forGlyph,
    forLine,
    shouldConnect,
    pickGlyphFamily: (families, globalIndex, charCode) => {
      if (families.length === 0) return profile.fontFamily;
      const v = forGlyph(globalIndex, charCode);
      return families[v.glyphFaceIndex % families.length] ?? families[0]!;
    },
  };
}

/** Word-gap extra advance — deterministic from profile + word index. */
export function seededWordGapPx(
  profile: HandwritingProfile,
  wordIndex: number,
): number {
  const rng = createSeededRng(mixSeed(profile.seed, 0xa11ce ^ wordIndex));
  const amp = profile.isCursive ? 2.4 : 1.6;
  const strength =
    profile.source === 'standard' ? 0.12 : Math.max(0.55, profile.matchStrength);
  return (
    (rng() - 0.35) *
    amp *
    profile.randomness *
    strength
  );
}
