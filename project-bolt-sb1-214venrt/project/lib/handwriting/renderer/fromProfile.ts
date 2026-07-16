/**
 * Bridge HandwritingProfile → lightweight DNA for Standard / no-upload paints.
 */

import type { HandwritingProfile } from '../../../src/handwriting/HandwritingProfile';
import type { HandwritingDNA } from '../dna/types';

export function profileToLightweightDna(
  profile: HandwritingProfile,
): HandwritingDNA {
  const families = [
    profile.fontFamily,
    'Architects Daughter',
    'Shadows Into Light',
  ].filter(
    (f, i, arr) =>
      Boolean(f) &&
      arr.findIndex((x) => x.toLowerCase() === f.toLowerCase()) === i,
  );
  const conf = profile.confidence;

  return {
    version: 1,
    seed: profile.seed,
    confidence: conf,
    usedFallback: profile.usedFallback,
    source: profile.source,
    ink: { value: profile.inkHex, confidence: conf, source: 'archetype' },
    slantDegrees: {
      value: profile.slantDegrees,
      confidence: conf,
      source: 'archetype',
    },
    stroke: {
      value: {
        thicknessPx: profile.strokeWidthPx,
        roughness: profile.strokeRoughness,
      },
      confidence: conf,
      source: 'archetype',
    },
    segmentation: {
      confidence: 0,
      analysisEdgePx: 0,
      lineBands: [],
      characterBoxes: [],
      lineCount: { value: 0, confidence: 0, source: 'inferred' },
      characterCount: { value: 0, confidence: 0, source: 'inferred' },
      clusters: [],
      strokeThickness: {
        value: profile.strokeWidthPx,
        confidence: 0,
        source: 'inferred',
      },
      connectivityRatio: {
        value: profile.isCursive ? 0.7 : 0.35,
        confidence: 0,
        source: 'inferred',
      },
      meanVerticalGapPx: { value: 30, confidence: 0, source: 'inferred' },
      meanBaselinePx: { value: 0, confidence: 0, source: 'inferred' },
      topMarginPx: { value: 0, confidence: 0, source: 'inferred' },
    },
    glyphs: {
      confidence: conf,
      faceFamilies: {
        value: families.slice(0, 3),
        confidence: conf,
        source: 'archetype',
      },
      meanAspect: { value: 0.72, confidence: 0.2, source: 'inferred' },
      aspectVariance: { value: 0.04, confidence: 0.2, source: 'inferred' },
      meanInkDensity: { value: 0.35, confidence: 0.2, source: 'inferred' },
    },
    rhythm: {
      confidence: conf,
      writingSpeed: {
        value: profile.writingSpeed,
        confidence: conf,
        source: 'archetype',
      },
      lineHeightModulation: {
        value: 0.04,
        confidence: conf,
        source: 'inferred',
      },
      randomness: {
        value: profile.randomness,
        confidence: conf,
        source: 'archetype',
      },
      driftFrequency: { value: 0.4, confidence: conf, source: 'inferred' },
      pageRhythmPhase: {
        value: ((profile.seed % 1000) / 1000) * Math.PI * 2,
        confidence: conf,
        source: 'inferred',
      },
    },
    spacing: {
      confidence: conf,
      trackingEm: {
        value: profile.trackingEm,
        confidence: conf,
        source: 'archetype',
      },
      wordSpacingEm: {
        value: profile.wordSpacingEm,
        confidence: conf,
        source: 'archetype',
      },
      lineSpacingScale: {
        value: profile.lineSpacingScale,
        confidence: conf,
        source: 'archetype',
      },
      meanVerticalGapPx: { value: 30, confidence: 0, source: 'inferred' },
      marginBias: {
        value: profile.marginBias,
        confidence: conf,
        source: 'archetype',
      },
      marginIrregularityEm: {
        value: profile.marginIrregularityEm,
        confidence: conf,
        source: 'archetype',
      },
      kerning: {
        value: {
          doubleLetter: profile.isCursive ? -0.6 : -0.25,
          afterVowel: profile.isCursive ? 0.3 : 0.35,
          default: profile.isCursive ? -0.15 : 0.12,
        },
        confidence: conf,
        source: 'inferred',
      },
    },
    baseline: {
      confidence: conf,
      globalSlantDegrees: {
        value: profile.slantDegrees,
        confidence: conf,
        source: 'archetype',
      },
      drift: {
        value: profile.baselineDrift,
        confidence: conf,
        source: 'archetype',
      },
      lineBaselinesPx: { value: [], confidence: 0, source: 'inferred' },
      meanBaselinePx: { value: 0, confidence: 0, source: 'inferred' },
      rotationVarianceDeg: {
        value: profile.rotationVarianceDeg,
        confidence: conf,
        source: 'archetype',
      },
    },
    ligatures: {
      confidence: conf,
      connectedLetterBehavior: {
        value: profile.connectedLetterBehavior,
        confidence: conf,
        source: 'archetype',
      },
      entryExitCurvature: {
        value: profile.entryExitCurvature,
        confidence: conf,
        source: 'archetype',
      },
      joinPriorByClass: {
        value: {
          vowelVowel: profile.isCursive ? 0.4 : 0.08,
          consonantVowel: profile.isCursive ? 0.55 : 0.1,
          doubleLetter: profile.isCursive ? 0.7 : 0.15,
        },
        confidence: conf,
        source: 'inferred',
      },
      observedPairJoins: [],
    },
    render: {
      confidence: conf,
      deterministic: true,
      streamSaltPolicy: 'pageNumber',
      polyGlyph: {
        value: {
          primaryFamily: profile.fontFamily,
          companions: families.slice(1),
        },
        confidence: conf,
        source: 'archetype',
      },
      inkHex: {
        value: profile.inkHex,
        confidence: conf,
        source: 'archetype',
      },
      strokeWidthPx: {
        value: profile.strokeWidthPx,
        confidence: conf,
        source: 'archetype',
      },
      strokeOpacityVariation: {
        value: profile.strokeOpacityVariation,
        confidence: conf,
        source: 'archetype',
      },
      pressure: {
        value: {
          baseAlpha: 0.91,
          alphaVariance: profile.strokeOpacityVariation,
          shadowBlurPx: 0.3 + profile.strokeRoughness * 0.4,
        },
        confidence: conf,
        source: 'inferred',
      },
      variationBinding: {
        useVariationEngine: true,
        excludeRevisionFromSeed: true,
      },
    },
    profileHints: {
      fontClass: profile.fontClass,
      fontFamily: profile.fontFamily,
      fontCategory: profile.fontCategory,
      isCursive: profile.isCursive,
      matchStrength: profile.matchStrength,
      avgCharHeightPx: profile.avgCharHeightPx,
      charHeightVariation: profile.charHeightVariation,
      charWidthVariation: profile.charWidthVariation,
      ascenderScale: profile.ascenderScale,
      descenderScale: profile.descenderScale,
    },
  };
}
