import { useMemo } from 'react';
import {
  extractedGlyphs,
  getExtractedGlyphs,
  getAiExecutionWeights,
  type ExtractedGlyphProfile,
  type AiExecutionWeights,
} from './glyphSlicer';
import { type StrokeLayoutMetrics } from './strokeLayout';
import type { MatchedStyleOverrides } from '../pageGeometry';
import {
  getArchetypeLayout,
  getFontStyleByClass,
  type HandwritingFontClass,
  type FontStyle,
} from '../constants';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Blend glyph-slicer AI weights + Match My Style + typography archetype
 * so margins, line space, and baseline jitter track the chosen family.
 */
export function deriveStrokeLayoutFromGlyphs(
  glyphs: readonly ExtractedGlyphProfile[],
  matchedStyle?: MatchedStyleOverrides | null,
  aiWeights?: AiExecutionWeights | null,
  fontStyle?: FontStyle | null,
): StrokeLayoutMetrics {
  const fontClass = fontStyle?.id ?? null;
  const archetype = getArchetypeLayout(fontClass);

  // Start from archetype structural baseline
  let strokeWeight = archetype.strokeWeight;
  let lineHeightScale = archetype.lineSpaceScale;
  let temperature = clamp(0.3 + archetype.baselineJitter * 0.9, 0.25, 1.6);
  let slantDegrees = archetype.slantDegrees;
  const marginScale = archetype.marginScale;
  const baselineJitter = archetype.baselineJitter;
  const trackingEm = archetype.trackingEm;

  // Prefer structural bias/variance from the pixel sifter when available
  if (aiWeights) {
    strokeWeight = clamp(
      aiWeights.bias * 0.55 + archetype.strokeWeight * 0.45,
      0.7,
      2.8,
    );
    lineHeightScale = clamp(
      aiWeights.lineHeightScale * 0.5 + archetype.lineSpaceScale * 0.5,
      0.88,
      1.28,
    );
    const noise = matchedStyle?.noiseIntensity;
    temperature = clamp(
      noise != null
        ? aiWeights.variance * 0.45 +
            archetype.baselineJitter * 0.35 +
            noise * 0.35
        : aiWeights.variance * 0.55 + archetype.baselineJitter * 0.45,
      0.25,
      1.6,
    );
  } else if (glyphs.length > 0 || matchedStyle) {
    let aspectSum = 0;
    let inkDensitySum = 0;
    let n = 0;
    for (const g of glyphs) {
      const { width, height, pixels } = g.matrix;
      if (width < 1 || height < 1) continue;
      aspectSum += width / height;
      let ink = 0;
      for (let i = 0; i < pixels.length; i++) {
        if (pixels[i] === 0) ink++;
      }
      inkDensitySum += ink / pixels.length;
      n++;
    }

    if (n > 0) {
      const avgDensity = inkDensitySum / n;
      strokeWeight = clamp(
        archetype.strokeWeight * 0.6 + (0.85 + avgDensity * 2.2) * 0.4,
        0.7,
        2.8,
      );
    }

    const noise = matchedStyle?.noiseIntensity ?? archetype.baselineJitter;
    temperature = clamp(
      0.3 + archetype.baselineJitter * 0.55 + noise * 0.5,
      0.25,
      1.6,
    );
  }

  if (matchedStyle?.slantDegrees != null) {
    // Blend photo slant with archetype default
    slantDegrees =
      matchedStyle.slantDegrees * 0.65 + archetype.slantDegrees * 0.35;
  }

  return {
    strokeWeight,
    lineHeightScale,
    temperature,
    slantDegrees,
    marginScale,
    baselineJitter,
    trackingEm,
  };
}

/**
 * React hook: archetype + slicer + matched style → layout vectors.
 */
export function useStrokeLayoutMetrics(
  matchedStyle?: MatchedStyleOverrides | null,
  revision = 0,
  fontStyle?: FontStyle | null,
): StrokeLayoutMetrics {
  return useMemo(() => {
    const glyphs = getExtractedGlyphs();
    const aiWeights = getAiExecutionWeights();
    return deriveStrokeLayoutFromGlyphs(
      glyphs,
      matchedStyle,
      aiWeights,
      fontStyle,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    revision,
    matchedStyle?.inkHex,
    matchedStyle?.slantDegrees,
    matchedStyle?.noiseIntensity,
    fontStyle?.id,
    extractedGlyphs.updatedAt,
    extractedGlyphs.glyphs.length,
    extractedGlyphs.aiWeights?.bias,
    extractedGlyphs.aiWeights?.variance,
  ]);
}

/** Resolve font class for callers that only have an id string. */
export function resolveFontClass(
  id: HandwritingFontClass | string | null | undefined,
): FontStyle {
  return getFontStyleByClass(id);
}
