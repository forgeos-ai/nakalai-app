/**
 * Browser render helper — paints golden samples to canvas for visual comparison.
 * Uses buildPagePaintPlan (not paint.ts) so plan-level experiments stay gateable.
 */

import { renderPlanToCanvas } from './planRender';
import type { GoldenSample } from './types';
import type { EngineVersionId } from './types';
import { scoreSample } from './scorecard';
import type { RenderArtifact } from './types';

const TEXT_AREA_HEIGHT = 320;

export async function renderGoldenSample(args: {
  canvas: HTMLCanvasElement;
  sample: GoldenSample;
  engineVersion: EngineVersionId;
}): Promise<RenderArtifact> {
  const { canvas, sample, engineVersion } = args;
  const plan = renderPlanToCanvas({ canvas, sample, engineVersion });

  const scorecard = scoreSample({ sample, engineVersion, dna: sample.dna });
  let imageDataUrl: string | undefined;
  try {
    imageDataUrl = canvas.toDataURL('image/png');
  } catch {
    imageDataUrl = undefined;
  }

  return {
    sampleId: sample.id,
    engineVersion,
    plan,
    scorecard,
    imageDataUrl,
  };
}

export { TEXT_AREA_HEIGHT };
