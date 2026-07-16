/**
 * Passive canvas executor — reads GlyphPaintInstruction only.
 * No pressure, spacing, ligature, or glyph decisions here.
 */

import type { PagePaintPlan } from './types';

export type ExecutePlanOptions = {
  /** Override ink; defaults to plan.inkHex. */
  inkHex?: string;
  /** Skip space glyphs (default true). */
  skipSpaces?: boolean;
};

/**
 * Paint a fully-built PagePaintPlan to a 2D context.
 */
export function executePagePaintPlan(
  ctx: CanvasRenderingContext2D,
  plan: PagePaintPlan,
  options: ExecutePlanOptions = {},
): void {
  const inkHex = options.inkHex ?? plan.inkHex;
  const skipSpaces = options.skipSpaces ?? true;

  ctx.fillStyle = inkHex;
  ctx.strokeStyle = inkHex;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  for (const line of plan.lines) {
    for (const glyph of line.glyphs) {
      if (skipSpaces && glyph.char === ' ') continue;

      ctx.save();
      ctx.globalAlpha = glyph.alpha;
      ctx.font = `${glyph.fontSizePx}px "${glyph.family}", cursive, sans-serif`;
      ctx.translate(glyph.x, glyph.y);
      ctx.rotate(glyph.rotationRad);
      if (glyph.scaleX != null || glyph.skewX != null) {
        ctx.transform(glyph.scaleX ?? 1, 0, glyph.skewX ?? 0, 1, 0, 0);
      }
      ctx.shadowColor = inkHex;
      ctx.shadowBlur = glyph.shadowBlur;
      ctx.fillText(glyph.char, 0, 0);
      ctx.restore();

      if (glyph.connector) {
        const { startX, endX, rise, alpha, lineWidth } = glyph.connector;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, glyph.y - glyph.fontSizePx * 0.035);
        ctx.bezierCurveTo(
          startX + (endX - startX) * 0.32,
          glyph.y - rise,
          startX + (endX - startX) * 0.72,
          glyph.y + rise * 0.35,
          endX,
          glyph.y,
        );
        ctx.strokeStyle = inkHex;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}
