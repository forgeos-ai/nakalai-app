/**
 * Velocity estimation from writer context — deterministic, no Math.random.
 */

import { clamp01, createSeededRng, mixSeed } from '../types';
import type { MotionPhysicsContext } from './types';

const PUNCTUATION = new Set(['.', ',', ';', ':', '!', '?', '—', '-', '"', "'"]);

function isPunctuation(char: string): boolean {
  return PUNCTUATION.has(char);
}

function isSentenceEnd(char: string | undefined): boolean {
  return char === '.' || char === '!' || char === '?';
}

/**
 * Normalized velocity [0,1] for a glyph from rhythm + layout context.
 */
export function estimateGlyphVelocity(
  ctx: MotionPhysicsContext,
  previousVelocity: number,
): number {
  const glyphSeed = mixSeed(ctx.rootSeed, mixSeed(ctx.glyphIndex + 1, ctx.char.charCodeAt(0)));
  const micro = createSeededRng(glyphSeed)();
  const speed = clamp01(ctx.writingSpeed);

  const advanceNorm = clamp01(ctx.advancePx / Math.max(ctx.fontSizePx * 1.2, 1));
  const positionNorm = ctx.totalGlyphs > 1 ? ctx.glyphIndex / (ctx.totalGlyphs - 1) : 0.5;

  let velocity =
    0.22 +
    speed * 0.52 +
    advanceNorm * 0.22 +
    (micro - 0.5) * 0.06 * (1 - speed * 0.35);

  if (ctx.char === ' ') {
    velocity = clamp01(0.28 + speed * 0.22);
  } else if (/[bdfhklt]/.test(ctx.char.toLowerCase())) {
    velocity += 0.08;
  } else if (/[aeiou]/.test(ctx.char.toLowerCase())) {
    velocity += 0.05;
  } else if (/[gjpqy]/.test(ctx.char.toLowerCase())) {
    velocity -= 0.06;
  }

  if (isPunctuation(ctx.char)) {
    velocity *= 0.42;
  }

  if (ctx.transitionJoinStrength != null && ctx.connectToNext) {
    velocity += ctx.transitionJoinStrength * 0.14 * (ctx.transitionConfidence ?? 0.5);
  }

  if (isSentenceEnd(ctx.char)) {
    velocity *= 0.48;
  }

  const sentenceStart = ctx.glyphIndex === 0 || ctx.previousChar === '.';
  if (sentenceStart && ctx.char !== ' ') {
    velocity *= 0.62;
  }

  if (ctx.wordIndex === 0 && ctx.charIndexInWord === 0 && ctx.char !== ' ') {
    velocity *= 0.72;
  }

  velocity = clamp01(velocity * (0.88 + ctx.strength * 0.12));

  if (previousVelocity > 0) {
    velocity = clamp01(previousVelocity * 0.22 + velocity * 0.78);
  }

  void positionNorm;
  return velocity;
}

/**
 * Acceleration from velocity delta — [-1, 1].
 */
export function estimateAcceleration(
  velocity: number,
  previousVelocity: number,
): number {
  if (previousVelocity <= 0) return 0;
  return Math.max(-1, Math.min(1, (velocity - previousVelocity) * 2.4));
}
