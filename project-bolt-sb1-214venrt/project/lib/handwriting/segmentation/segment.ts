/**
 * Segmentation — wraps glyphSlicer into SegmentationDNA.
 * Does not invent character labels.
 */

import {
  sliceGlyphsFromFile,
  type GlyphSliceResult,
} from '../../../src/utils/glyphSlicer';
import { metric, clamp01, aggregateConfidence } from '../types';
import type { SegmentationDNA, SegmentationCluster } from './types';

export function emptySegmentationDNA(reason: 'fallback' | 'failed' = 'failed'): SegmentationDNA {
  const src = reason === 'fallback' ? 'fallback' : 'inferred';
  return {
    confidence: 0,
    analysisEdgePx: 0,
    lineBands: [],
    characterBoxes: [],
    lineCount: metric(0, 0, src),
    characterCount: metric(0, 0, src),
    clusters: [],
    strokeThickness: metric(2.5, 0, src),
    connectivityRatio: metric(0.5, 0, src),
    meanVerticalGapPx: metric(30, 0, src),
    meanBaselinePx: metric(0, 0, src),
    topMarginPx: metric(0, 0, src),
  };
}

export function segmentationFromSlice(
  slice: GlyphSliceResult,
): SegmentationDNA {
  const lineCount = slice.lineBands.length;
  const charCount = slice.characterBoxes.length;
  const structure = slice.structure;
  const layout = structure.layout;

  const boxes = slice.characterBoxes.map((box, i) => {
    // Assign line by which band contains the box center.
    let lineIndex = 0;
    const cy = box.y + box.height / 2;
    for (let li = 0; li < slice.lineBands.length; li++) {
      const band = slice.lineBands[li]!;
      if (cy >= band.top && cy < band.bottom) {
        lineIndex = li;
        break;
      }
    }
    return {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      lineIndex: lineIndex || Math.min(i, Math.max(0, lineCount - 1)),
    };
  });

  const clusters: SegmentationCluster[] = slice.extractedGlyphs.map((g) => {
    const w = Math.max(1, g.matrix.width);
    const h = Math.max(1, g.matrix.height);
    let ink = 0;
    for (let i = 0; i < g.matrix.pixels.length; i++) {
      if (g.matrix.pixels[i] === 0) ink += 1;
    }
    return {
      signature: g.signature,
      frequency: g.frequency,
      aspect: w / h,
      inkDensity: ink / (w * h),
      bboxCount: g.instances.length,
    };
  });

  const sampleConf = clamp01(charCount / 40);
  const lineConf = clamp01(lineCount / 4);
  const structureConf = clamp01(
    0.4 +
      structure.connectivityRatio * 0.3 +
      Math.min(1, structure.strokeThickness / 6) * 0.3,
  );
  const confidence = aggregateConfidence([
    { confidence: sampleConf },
    { confidence: lineConf },
    { confidence: structureConf },
  ]);

  return {
    confidence,
    analysisEdgePx: Math.max(slice.width, slice.height),
    lineBands: slice.lineBands.map((b) => ({ top: b.top, bottom: b.bottom })),
    characterBoxes: boxes,
    lineCount: metric(lineCount, lineConf, lineCount > 0 ? 'measured' : 'fallback', lineCount),
    characterCount: metric(
      charCount,
      sampleConf,
      charCount > 0 ? 'measured' : 'fallback',
      charCount,
    ),
    clusters,
    strokeThickness: metric(
      structure.strokeThickness,
      structureConf,
      'measured',
      structure.lineCount,
    ),
    connectivityRatio: metric(
      structure.connectivityRatio,
      structureConf,
      'measured',
      structure.lineCount,
    ),
    meanVerticalGapPx: metric(
      layout.meanVerticalSpacingPx || 30,
      layout.meanVerticalSpacingPx > 0 ? structureConf : 0,
      layout.meanVerticalSpacingPx > 0 ? 'measured' : 'inferred',
    ),
    meanBaselinePx: metric(
      layout.meanBaselinePx,
      layout.baselineHeights.length > 0 ? structureConf : 0,
      layout.baselineHeights.length > 0 ? 'measured' : 'inferred',
      layout.baselineHeights.length,
    ),
    topMarginPx: metric(
      layout.topMarginPx,
      layout.topMarginPx > 0 ? structureConf : 0,
      layout.topMarginPx > 0 ? 'measured' : 'inferred',
    ),
  };
}

/**
 * Run segmentation under the extract token lifetime.
 * Soft-fails to empty DNA so ROI metrics can still produce a profile.
 */
export async function segmentHandwritingFile(
  file: File,
): Promise<{ dna: SegmentationDNA; slice: GlyphSliceResult | null }> {
  try {
    const slice = await sliceGlyphsFromFile(file);
    if (!slice.lineBands.length && !slice.characterBoxes.length) {
      return { dna: emptySegmentationDNA('fallback'), slice };
    }
    return { dna: segmentationFromSlice(slice), slice };
  } catch {
    return { dna: emptySegmentationDNA('failed'), slice: null };
  }
}

export type { SegmentationDNA, SegmentationCluster };
