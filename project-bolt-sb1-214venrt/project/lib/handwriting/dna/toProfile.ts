/**
 * Compatibility adapter — HandwritingDNA → existing HandwritingProfile.
 */

import {
  HANDWRITING_PROFILE_VERSION,
  type HandwritingProfile,
} from '../../../src/handwriting/HandwritingProfile';
import type { HandwritingFontClass } from '../../../src/constants';
import type { HandwritingDNA } from './types';

export function handwritingDnaToProfile(
  dna: HandwritingDNA,
  revision = 0,
): HandwritingProfile {
  return {
    version: HANDWRITING_PROFILE_VERSION,
    seed: dna.seed,
    source: dna.source,
    confidence: dna.confidence,
    matchStrength: dna.profileHints.matchStrength,
    inkHex: dna.ink.value,
    slantDegrees: dna.slantDegrees.value,
    avgCharHeightPx: dna.profileHints.avgCharHeightPx,
    baselineDrift: dna.baseline.drift.value,
    charHeightVariation: dna.profileHints.charHeightVariation,
    charWidthVariation: dna.profileHints.charWidthVariation,
    wordSpacingEm: dna.spacing.wordSpacingEm.value,
    lineSpacingScale: dna.spacing.lineSpacingScale.value,
    strokeWidthPx: dna.render.strokeWidthPx.value,
    strokeOpacityVariation: dna.render.strokeOpacityVariation.value,
    strokeRoughness: dna.stroke.value.roughness,
    entryExitCurvature: dna.ligatures.entryExitCurvature.value,
    rotationVarianceDeg: dna.baseline.rotationVarianceDeg.value,
    marginBias: dna.spacing.marginBias.value,
    marginIrregularityEm: dna.spacing.marginIrregularityEm.value,
    randomness: dna.rhythm.randomness.value,
    trackingEm: dna.spacing.trackingEm.value,
    writingSpeed: dna.rhythm.writingSpeed.value,
    connectedLetterBehavior: dna.ligatures.connectedLetterBehavior.value,
    ascenderScale: dna.profileHints.ascenderScale,
    descenderScale: dna.profileHints.descenderScale,
    fontClass: dna.profileHints.fontClass as HandwritingFontClass,
    fontCategory: dna.profileHints.fontCategory,
    fontFamily: dna.profileHints.fontFamily,
    isCursive: dna.profileHints.isCursive,
    revision,
    usedFallback: dna.usedFallback,
  };
}
