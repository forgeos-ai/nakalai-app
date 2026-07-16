/**
 * Golden Lab plan renderer — builds PaintPlan then paints passively.
 */

import { buildPagePaintPlan } from '../renderer/instructions';
import { executePagePaintPlan } from '../renderer/executePlan';
import type { PagePaintPlan } from '../renderer/types';
import {
  resetGlyphEngineMode,
  setGlyphEngineMode,
} from '../memory/session';
import {
  resetLigatureEngineMode,
  setLigatureEngineMode,
} from '../ligatures/session';
import {
  resetPressureEngineMode,
  setPressureEngineMode,
} from '../pressure/session';
import type { GoldenSample } from './types';
import type { EngineVersionId } from './types';
import { textToSegments } from './segments';

export function renderPlanToCanvas(args: {
  canvas: HTMLCanvasElement;
  sample: GoldenSample;
  engineVersion: EngineVersionId;
}): PagePaintPlan {
  const { canvas, sample, engineVersion } = args;
  const isBaseline = engineVersion === 'dna-v1-baseline';
  const segments = textToSegments(sample.text);
  setGlyphEngineMode(isBaseline ? 'cycle' : 'memory');
  setLigatureEngineMode(isBaseline ? 'legacy' : 'intelligent');
  setPressureEngineMode(isBaseline ? 'legacy' : 'physics');
  const plan = buildPagePaintPlan({
    dna: sample.dna,
    segments,
    widthPx: sample.widthPx,
    pageSalt: sample.pageSalt,
    glyphSelection: 'contextual',
    wordSpacing: 'rhythm',
  });
  resetGlyphEngineMode();
  resetLigatureEngineMode();
  resetPressureEngineMode();

  const height = 320;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = sample.widthPx * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${sample.widthPx}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return plan;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, sample.widthPx, height);
  executePagePaintPlan(ctx, plan);

  return plan;
}
