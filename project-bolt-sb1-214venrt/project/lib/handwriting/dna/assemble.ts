/**
 * Assemble HandwritingDNA from pixel metrics + segmentation.
 */

import type { ExtractedNotebookStyle } from '../../../src/utils/styleExtractor';
import { isDisconnectedPrintStyle } from '../../../src/constants';
import { getFontStyleByClass } from '../../../src/constants';
import { googleFontNameForClass } from '../../../src/utils/styleExtractor';
import {
  metric,
  clamp,
  hashDnaSeed,
  aggregateConfidence,
  createSeededRng,
} from '../types';
import type { SegmentationDNA } from '../segmentation/types';
import { emptySegmentationDNA } from '../segmentation/segment';
import { deriveGlyphVariants } from '../glyphs/variants';
import { deriveRhythm } from '../rhythm/derive';
import { deriveSpacing } from '../spacing/derive';
import { deriveBaseline } from '../baseline/derive';
import { deriveLigatures } from '../ligatures/derive';
import {
  HANDWRITING_DNA_VERSION,
  type HandwritingDNA,
} from './types';
import type { RendererDNA } from '../renderer/types';

function amplifyFromCenter(
  value: number,
  center: number,
  strength: number,
  min: number,
  max: number,
): number {
  return clamp(center + (value - center) * strength, min, max);
}

function createFallbackDNA(
  seed: number,
  inkHex: string,
  segmentation: SegmentationDNA,
): HandwritingDNA {
  const rng = createSeededRng(seed);
  const archetype = Math.floor(rng() * 4);
  const families = [
    { fontClass: 'messy-brush', fontFamily: 'Caveat', isCursive: true },
    {
      fontClass: 'rushed-student',
      fontFamily: 'Shadows Into Light',
      isCursive: true,
    },
    {
      fontClass: 'casual-print',
      fontFamily: 'Architects Daughter',
      isCursive: false,
    },
    {
      fontClass: 'cursive-ribbon',
      fontFamily: 'Great Vibes',
      isCursive: true,
    },
  ] as const;
  const pick = families[archetype]!;
  const conf = 0.2;
  const glyphs = deriveGlyphVariants({
    primaryFamily: pick.fontFamily,
    isCursive: pick.isCursive,
    segmentation,
  });
  const render: RendererDNA = {
    confidence: conf,
    deterministic: true,
    streamSaltPolicy: 'pageNumber',
    polyGlyph: metric(
      {
        primaryFamily: pick.fontFamily,
        companions: glyphs.faceFamilies.value.slice(1),
      },
      conf,
      'fallback',
    ),
    inkHex: metric(inkHex, conf, 'fallback'),
    strokeWidthPx: metric(1.1, conf, 'fallback'),
    strokeOpacityVariation: metric(0.1, conf, 'fallback'),
    pressure: metric(
      { baseAlpha: 0.91, alphaVariance: 0.09, shadowBlurPx: 0.45 },
      conf,
      'fallback',
    ),
    variationBinding: {
      useVariationEngine: true,
      excludeRevisionFromSeed: true,
    },
  };

  return {
    version: HANDWRITING_DNA_VERSION,
    seed,
    confidence: conf,
    usedFallback: true,
    source: 'generalized-fallback',
    ink: metric(inkHex, conf, 'fallback'),
    slantDegrees: metric(pick.isCursive ? 6 : -1.5, conf, 'fallback'),
    stroke: metric({ thicknessPx: 2.4, roughness: 0.35 }, conf, 'fallback'),
    segmentation,
    glyphs,
    rhythm: deriveRhythm({
      seed,
      connectivity: pick.isCursive ? 0.7 : 0.35,
      noise: 0.4,
      slantDegrees: pick.isCursive ? 6 : -1.5,
      confidence: conf,
      segmentation,
    }),
    spacing: deriveSpacing({
      isCursive: pick.isCursive,
      connectivity: pick.isCursive ? 0.7 : 0.35,
      noise: 0.4,
      confidence: conf,
      traitGain: 1.1,
      segmentation,
      defaultTrackingEm: pick.isCursive ? -0.01 : 0.022,
      defaultLineSpaceScale: 1,
      defaultMarginScale: 1,
    }),
    baseline: deriveBaseline({
      slantDegrees: pick.isCursive ? 6 : -1.5,
      noise: 0.4,
      vertical: 0.55,
      confidence: conf,
      matchStrength: 0.92,
      segmentation,
    }),
    ligatures: deriveLigatures({
      isCursive: pick.isCursive,
      connectivity: pick.isCursive ? 0.7 : 0.35,
      vertical: 0.55,
      confidence: conf,
      matchStrength: 0.92,
    }),
    render,
    profileHints: {
      fontClass: pick.fontClass,
      fontFamily: pick.fontFamily,
      fontCategory: pick.isCursive ? 'loose-scratch' : 'casual-print',
      isCursive: pick.isCursive,
      matchStrength: 0.92,
      avgCharHeightPx: 23,
      charHeightVariation: 0.1,
      charWidthVariation: 0.09,
      ascenderScale: 1.1,
      descenderScale: 1.08,
    },
  };
}

export type AssembleDnaInput = {
  extracted: ExtractedNotebookStyle;
  segmentation?: SegmentationDNA | null;
  fingerprint?: string;
};

/**
 * Build memory-only HandwritingDNA from notebook metrics + segmentation.
 */
export function assembleHandwritingDNA(input: AssembleDnaInput): HandwritingDNA {
  const { extracted, fingerprint = '' } = input;
  const segmentation = input.segmentation ?? emptySegmentationDNA('fallback');

  const confidence = extracted.usedFallback
    ? 0
    : clamp(extracted.confidence ?? 0.5, 0, 1);
  const rawConnectivity = clamp(extracted.connectivityRatio, 0, 1);
  const rawNoise = clamp(extracted.noiseIntensity, 0, 1);
  const stroke = Math.max(0.8, extracted.strokeThickness);
  const vertical = clamp(extracted.verticalContinuity ?? rawConnectivity, 0, 1);
  const runs = clamp(extracted.avgRunsPerRow ?? 5, 1, 14);
  const blockiness = clamp(extracted.relativeRunWidth ?? stroke / 4, 0, 2);

  // Prefer measured stroke/connectivity from segmentation when stronger.
  const measuredConnectivity =
    segmentation.connectivityRatio.confidence > confidence * 0.6
      ? segmentation.connectivityRatio.value
      : rawConnectivity;
  const measuredStroke =
    segmentation.strokeThickness.confidence > confidence * 0.6
      ? segmentation.strokeThickness.value
      : stroke;

  const seed = hashDnaSeed([
    extracted.inkHex,
    extracted.slantDegrees,
    rawNoise,
    extracted.fontClass,
    measuredStroke,
    measuredConnectivity,
    vertical,
    runs,
    blockiness,
    fingerprint,
    segmentation.characterCount.value,
    segmentation.lineCount.value,
  ]);

  if (extracted.usedFallback || confidence < 0.28) {
    return createFallbackDNA(seed, extracted.inkHex, segmentation);
  }

  const isCursive = !isDisconnectedPrintStyle(
    extracted.fontClass,
    extracted.fontCategory,
  );
  const font = getFontStyleByClass(extracted.fontClass);
  const fontFamily =
    extracted.fontFamily || googleFontNameForClass(extracted.fontClass);

  const traitGain = 1.05 + confidence * 0.55;
  const connectivity = amplifyFromCenter(
    measuredConnectivity,
    0.5,
    traitGain,
    0,
    1,
  );
  const noise = amplifyFromCenter(rawNoise, 0.28, traitGain, 0.03, 1);
  const slantBase = extracted.slantDegrees;
  const slantDegrees = clamp(
    slantBase * (1.12 + confidence * 0.38) +
      (Math.abs(slantBase) > 2 ? Math.sign(slantBase) * confidence * 1.2 : 0),
    -13,
    19,
  );
  const matchStrength = 0.82 + confidence * 0.52;
  const avgCharHeightPx = clamp(
    21.5 + (measuredStroke - 2.5) * 1.25 + (vertical - 0.5) * 3.2,
    17.5,
    29,
  );
  const charHeightVariation = clamp(
    (0.045 + noise * 0.13 + Math.abs(vertical - 0.5) * 0.05) * matchStrength,
    0.045,
    0.23,
  );
  const charWidthVariation = clamp(
    (0.04 + noise * 0.1 + Math.abs(blockiness - 0.55) * 0.055) * matchStrength,
    0.04,
    0.22,
  );
  const strokeWidthPx = clamp(
    0.55 + measuredStroke * 0.3 + blockiness * 0.22,
    0.72,
    2.45,
  );
  const strokeRoughness = clamp(
    (noise * 0.62 + (1 - confidence) * 0.12) * matchStrength,
    0.04,
    0.85,
  );
  const strokeOpacityVariation = clamp(
    (0.035 + noise * 0.17) * matchStrength,
    0.035,
    0.24,
  );

  const glyphs = deriveGlyphVariants({
    primaryFamily: fontFamily,
    isCursive,
    segmentation,
  });
  const rhythm = deriveRhythm({
    seed,
    connectivity,
    noise,
    slantDegrees,
    confidence,
    segmentation,
  });
  const spacing = deriveSpacing({
    isCursive,
    connectivity,
    noise,
    confidence,
    traitGain,
    segmentation,
    defaultTrackingEm: font.layout.trackingEm,
    defaultLineSpaceScale: font.layout.lineSpaceScale,
    defaultMarginScale: font.layout.marginScale,
  });
  const baseline = deriveBaseline({
    slantDegrees,
    noise,
    vertical,
    confidence,
    matchStrength,
    segmentation,
  });
  const ligatures = deriveLigatures({
    isCursive,
    connectivity,
    vertical,
    confidence,
    matchStrength,
  });

  const overall = aggregateConfidence([
    { confidence },
    segmentation,
    glyphs,
    rhythm,
    spacing,
    baseline,
    ligatures,
  ]);

  const render: RendererDNA = {
    confidence: overall,
    deterministic: true,
    streamSaltPolicy: 'pageNumber',
    polyGlyph: metric(
      {
        primaryFamily: fontFamily,
        companions: glyphs.faceFamilies.value.slice(1),
      },
      glyphs.confidence,
      glyphs.faceFamilies.source,
    ),
    inkHex: metric(extracted.inkHex, confidence, 'measured'),
    strokeWidthPx: metric(strokeWidthPx, confidence, 'inferred'),
    strokeOpacityVariation: metric(strokeOpacityVariation, confidence, 'inferred'),
    pressure: metric(
      {
        baseAlpha: 0.91,
        alphaVariance: strokeOpacityVariation,
        shadowBlurPx: 0.3 + strokeRoughness * 0.45,
      },
      confidence,
      'inferred',
    ),
    variationBinding: {
      useVariationEngine: true,
      excludeRevisionFromSeed: true,
    },
  };

  const rng = createSeededRng(seed);
  const proportionBias = (rng() - 0.5) * 0.14;

  return {
    version: HANDWRITING_DNA_VERSION,
    seed,
    confidence: overall,
    usedFallback: false,
    source: 'matched',
    ink: metric(extracted.inkHex, confidence, 'measured', extracted.inkSampleCount),
    slantDegrees: metric(slantDegrees, confidence, 'measured'),
    stroke: metric(
      { thicknessPx: measuredStroke, roughness: strokeRoughness },
      confidence,
      'measured',
    ),
    segmentation,
    glyphs,
    rhythm,
    spacing,
    baseline,
    ligatures,
    render,
    profileHints: {
      fontClass: extracted.fontClass,
      fontFamily,
      fontCategory: extracted.fontCategory,
      isCursive,
      matchStrength,
      avgCharHeightPx,
      charHeightVariation,
      charWidthVariation,
      ascenderScale: clamp(0.98 + vertical * 0.2 + proportionBias, 0.92, 1.3),
      descenderScale: clamp(
        0.98 + (1 - blockiness * 0.25) * 0.16 - proportionBias,
        0.92,
        1.28,
      ),
    },
  };
}
