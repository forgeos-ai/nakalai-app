/**
 * MotionState assembly — one immutable state per glyph.
 */

import { clamp01 } from '../types';
import {
  estimateAcceleration,
  estimateGlyphVelocity,
} from './velocity';
import type { MotionPhysicsContext, MotionState } from './types';

function isPunctuation(char: string): boolean {
  return /[.,;:!?'"\-—]/.test(char);
}

function curvatureFromContext(ctx: MotionPhysicsContext): number {
  const slantFactor = ctx.isCursive ? 0.12 : 0.06;
  let curvature = slantFactor;

  if (ctx.variantId != null && ctx.variantId % 3 === 2) {
    curvature += 0.04;
  }

  if (ctx.transitionJoinStrength != null) {
    const exit = Math.abs(ctx.transitionJoinStrength - 0.5);
    curvature += exit * 0.18 * (ctx.transitionConfidence ?? 0.5);
  }

  if (isPunctuation(ctx.char)) {
    curvature += 0.22;
  }

  const wordEdge =
    ctx.charIndexInWord === 0 || ctx.charIndexInWord === ctx.wordLength - 1;
  if (wordEdge && ctx.char !== ' ') {
    curvature += 0.05;
  }

  return clamp01(curvature);
}

function hesitationFromContext(
  ctx: MotionPhysicsContext,
  curvature: number,
  acceleration: number,
): number {
  let hesitation = curvature * 0.35;

  if (isPunctuation(ctx.char)) {
    hesitation += 0.28;
  }

  if (ctx.char === ' ') {
    hesitation += 0.12;
  }

  if (acceleration < -0.15) {
    hesitation += Math.abs(acceleration) * 0.25;
  }

  if (ctx.transitionConfidence != null && ctx.transitionConfidence < 0.45) {
    hesitation += (0.45 - ctx.transitionConfidence) * 0.35;
  }

  return clamp01(hesitation);
}

function penLiftFromContext(ctx: MotionPhysicsContext, hesitation: number): number {
  let penLift = hesitation * 0.4;

  if (ctx.char === ' ' || isPunctuation(ctx.char)) {
    penLift += 0.25;
  }

  if (ctx.nextChar == null || ctx.nextChar === ' ') {
    penLift += 0.15;
  }

  if (!ctx.connectToNext && ctx.nextChar && /[a-zA-Z]/.test(ctx.nextChar)) {
    penLift += 0.08;
  }

  if (ctx.connectToNext) {
    penLift *= 0.45;
  }

  return clamp01(penLift);
}

/**
 * Build immutable MotionState for one glyph.
 */
export function buildMotionState(
  ctx: MotionPhysicsContext,
  previousVelocity: number,
): MotionState {
  const velocity = estimateGlyphVelocity(ctx, previousVelocity);
  const acceleration = estimateAcceleration(velocity, previousVelocity);
  const curvature = curvatureFromContext(ctx);
  const hesitation = hesitationFromContext(ctx, curvature, acceleration);
  const penLift = penLiftFromContext(ctx, hesitation);
  const strokeLength = clamp01(
    ctx.advancePx / Math.max(ctx.fontSizePx, 1) * (ctx.char === ' ' ? 0.5 : 1),
  );

  return Object.freeze({
    velocity,
    acceleration,
    curvature,
    hesitation,
    penLift,
    strokeLength,
  });
}
