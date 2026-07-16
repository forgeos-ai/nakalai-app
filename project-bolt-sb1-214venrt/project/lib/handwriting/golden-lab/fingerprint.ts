/**
 * Plan fingerprint — deterministic hash of paint instructions for regression.
 */

import { hashDnaSeed } from '../types';
import type { PagePaintPlan } from '../renderer/types';

export function fingerprintPaintPlan(plan: PagePaintPlan): string {
  const parts: Array<string | number> = [
    plan.seed,
    plan.pageSalt,
    plan.fontSizePx,
    plan.lineHeightPx,
    plan.inkHex,
    plan.lines.length,
  ];
  for (const line of plan.lines) {
    parts.push(line.row, line.baselineY, line.marginOffsetPx);
    for (const g of line.glyphs) {
      parts.push(
        g.char,
        g.family,
        Math.round(g.x * 100) / 100,
        Math.round(g.y * 100) / 100,
        Math.round(g.rotationRad * 10000) / 10000,
        Math.round(g.alpha * 1000) / 1000,
        Math.round(g.advance * 100) / 100,
        g.connectToNext ? 1 : 0,
      );
      if (g.variantId != null) {
        parts.push(
          g.variantId,
          Math.round((g.scaleX ?? 1) * 1000) / 1000,
          Math.round((g.skewX ?? 0) * 1000) / 1000,
        );
      }
      if (g.transition) {
        parts.push(
          g.transition.pair,
          Math.round(g.transition.joinStrength * 1000) / 1000,
          Math.round(g.transition.preferredGapEm * 1000) / 1000,
          Math.round(g.transition.confidence * 1000) / 1000,
          Math.round(g.transition.overlapAmount * 1000) / 1000,
        );
      }
    }
  }
  return hashDnaSeed(parts).toString(16).padStart(8, '0');
}
