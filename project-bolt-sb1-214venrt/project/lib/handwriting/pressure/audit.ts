/**
 * Motion Physics audit — scores, heatmaps, timeline.
 */

import type { PagePaintPlan } from '../renderer/types';
import { clamp01 } from '../types';
import type {
  MotionPhysicsAudit,
  MotionTimelineCell,
  PressureHeatmapCell,
  VelocityHeatmapCell,
} from './types';

function letterGlyphs(plan: PagePaintPlan) {
  return plan.lines.flatMap((line) =>
    line.glyphs.filter((g) => g.char !== ' '),
  );
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
}

function buildTimeline(plan: PagePaintPlan): MotionTimelineCell[] {
  const cells: MotionTimelineCell[] = [];
  let glyphIndex = 0;
  for (const line of plan.lines) {
    for (const glyph of line.glyphs) {
      if (glyph.char === ' ') continue;
      if (!glyph.motion) continue;
      cells.push(
        Object.freeze({
          glyphIndex,
          char: glyph.char,
          velocity: glyph.motion.velocity,
          pressure: glyph.pressure?.pressure ?? 0,
          inkOpacity: glyph.ink?.opacity ?? glyph.alpha,
          penLift: glyph.motion.penLift,
          phase: glyph.stroke?.phase ?? 'flow',
        }),
      );
      glyphIndex += 1;
    }
  }
  return cells;
}

function buildPressureHeatmap(plan: PagePaintPlan): PressureHeatmapCell[] {
  const grouped = new Map<
    string,
    { hits: number; pressureSum: number; velocitySum: number }
  >();
  for (const glyph of letterGlyphs(plan)) {
    if (!glyph.pressure || !glyph.motion) continue;
    const key = glyph.char.toLowerCase();
    const entry = grouped.get(key) ?? { hits: 0, pressureSum: 0, velocitySum: 0 };
    entry.hits += 1;
    entry.pressureSum += glyph.pressure.pressure;
    entry.velocitySum += glyph.motion.velocity;
    grouped.set(key, entry);
  }
  return [...grouped.entries()]
    .map(([char, entry]) =>
      Object.freeze({
        char,
        hits: entry.hits,
        meanPressure: entry.pressureSum / entry.hits,
        meanVelocity: entry.velocitySum / entry.hits,
      }),
    )
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 20);
}

function buildVelocityHeatmap(plan: PagePaintPlan): VelocityHeatmapCell[] {
  const grouped = new Map<
    string,
    { hits: number; velocitySum: number; accelSum: number }
  >();
  for (const glyph of letterGlyphs(plan)) {
    if (!glyph.motion) continue;
    const key = glyph.char.toLowerCase();
    const entry = grouped.get(key) ?? { hits: 0, velocitySum: 0, accelSum: 0 };
    entry.hits += 1;
    entry.velocitySum += glyph.motion.velocity;
    entry.accelSum += glyph.motion.acceleration;
    grouped.set(key, entry);
  }
  return [...grouped.entries()]
    .map(([char, entry]) =>
      Object.freeze({
        char,
        hits: entry.hits,
        meanVelocity: entry.velocitySum / entry.hits,
        meanAcceleration: entry.accelSum / entry.hits,
      }),
    )
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 20);
}

/**
 * Audit a paint plan for motion physics quality.
 */
export function auditMotionPhysics(plan: PagePaintPlan): MotionPhysicsAudit {
  const glyphs = letterGlyphs(plan);
  const withMotion = glyphs.filter((g) => g.motion);
  const velocities = withMotion.map((g) => g.motion!.velocity);
  const pressures = withMotion.map((g) => g.pressure?.pressure ?? 0);
  const opacities = withMotion.map((g) => g.ink?.opacity ?? g.alpha);
  const phases = withMotion.map((g) => g.stroke?.phase ?? 'flow');

  const velocitySpread = velocities.length > 1
    ? Math.max(...velocities) - Math.min(...velocities)
    : 0;
  const pressureSpread = pressures.length > 1
    ? Math.max(...pressures) - Math.min(...pressures)
    : 0;
  const opacityStd = stdDev(opacities);

  const flowRate =
    phases.length === 0
      ? 0
      : phases.filter((p) => p === 'flow').length / phases.length;
  const liftRate =
    phases.length === 0
      ? 0
      : phases.filter((p) => p === 'lift').length / phases.length;

  const motionScore = clamp01(
    clamp01(velocitySpread / 0.22) * 0.38 +
      clamp01(stdDev(velocities) / 0.08) * 0.32 +
      flowRate * 0.3,
  );
  const pressureScore = clamp01(
    clamp01(pressureSpread / 0.18) * 0.38 +
      clamp01(stdDev(pressures) / 0.06) * 0.32 +
      (1 - liftRate) * 0.3,
  );
  const inkConsistency = clamp01(
    clamp01(opacityStd / 0.05) * 0.45 +
      clamp01(pressureSpread / 0.15) * 0.35 +
      clamp01(stdDev(opacities) / 0.04) * 0.2,
  );
  const strokeFlow = clamp01(
    flowRate * 0.5 +
      clamp01(velocitySpread / 0.2) * 0.25 +
      (1 - Math.abs(flowRate - 0.5)) * 0.25,
  );

  return Object.freeze({
    motionScore,
    pressureScore,
    inkConsistency,
    strokeFlow,
    timeline: buildTimeline(plan),
    pressureHeatmap: buildPressureHeatmap(plan),
    velocityHeatmap: buildVelocityHeatmap(plan),
  });
}
