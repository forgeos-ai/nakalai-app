/**
 * Development-only DNA debugger — in-memory diagnostics.
 * Never logs DNA values in production; never persists.
 */

import type { HandwritingDNA } from '../dna/types';
import { getActiveHandwritingDNA } from '../dna/session';

export type DnaDebugSnapshot = {
  version: number;
  seed: number;
  confidence: number;
  source: string;
  usedFallback: boolean;
  traits: Record<
    string,
    { value: string | number; confidence: number; source: string }
  >;
  segmentation: {
    lines: number;
    characters: number;
    clusters: number;
    confidence: number;
  };
  boxes: Array<{ x: number; y: number; width: number; height: number }>;
};

/**
 * Snapshot active DNA for DEV HUD / console inspection.
 * Returns null outside DEV or when no DNA is active.
 */
export function getDnaDebugSnapshot(
  dna?: HandwritingDNA | null,
): DnaDebugSnapshot | null {
  const isDev =
    typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
  if (!isDev) return null;

  const active = dna ?? getActiveHandwritingDNA();
  if (!active) return null;

  return {
    version: active.version,
    seed: active.seed,
    confidence: active.confidence,
    source: active.source,
    usedFallback: active.usedFallback,
    traits: {
      ink: {
        value: active.ink.value,
        confidence: active.ink.confidence,
        source: active.ink.source,
      },
      slant: {
        value: Number(active.slantDegrees.value.toFixed(2)),
        confidence: active.slantDegrees.confidence,
        source: active.slantDegrees.source,
      },
      wordSpacingEm: {
        value: Number(active.spacing.wordSpacingEm.value.toFixed(3)),
        confidence: active.spacing.wordSpacingEm.confidence,
        source: active.spacing.wordSpacingEm.source,
      },
      baselineDrift: {
        value: Number(active.baseline.drift.value.toFixed(3)),
        confidence: active.baseline.drift.confidence,
        source: active.baseline.drift.source,
      },
      pressure: {
        value: Number(active.render.pressure.value.baseAlpha.toFixed(3)),
        confidence: active.render.pressure.confidence,
        source: active.render.pressure.source,
      },
      ligatureStrength: {
        value: Number(
          active.ligatures.connectedLetterBehavior.value.toFixed(3),
        ),
        confidence: active.ligatures.connectedLetterBehavior.confidence,
        source: active.ligatures.connectedLetterBehavior.source,
      },
    },
    segmentation: {
      lines: active.segmentation.lineCount.value,
      characters: active.segmentation.characterCount.value,
      clusters: active.segmentation.clusters.length,
      confidence: active.segmentation.confidence,
    },
    boxes: active.segmentation.characterBoxes.slice(0, 40).map((b) => ({
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
    })),
  };
}

/**
 * Optional DEV overlay drawers onto an existing debug canvas.
 * Does not affect production A4 canvas.
 */
export function drawDnaDebugOverlay(
  ctx: CanvasRenderingContext2D,
  dna: HandwritingDNA,
  scale = 1,
): void {
  const isDev =
    typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
  if (!isDev) return;

  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 1;
  for (const box of dna.segmentation.characterBoxes) {
    ctx.strokeRect(
      box.x * scale,
      box.y * scale,
      box.width * scale,
      box.height * scale,
    );
  }
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
  for (const band of dna.segmentation.lineBands) {
    ctx.beginPath();
    ctx.moveTo(0, band.bottom * scale);
    ctx.lineTo(ctx.canvas.width, band.bottom * scale);
    ctx.stroke();
  }
  ctx.restore();
}
