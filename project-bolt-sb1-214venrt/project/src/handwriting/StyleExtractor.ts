/**
 * StyleExtractor — image → HandwritingProfile only.
 * Uses extract tokens so stale async analysis never commits.
 */

import type { HandwritingFontClass } from '../constants';
import { isDisconnectedPrintStyle } from '../constants';
import {
  extractNotebookStyle,
  type ExtractedNotebookStyle,
} from '../utils/styleExtractor';
import {
  createDefaultHandwritingProfile,
  hashProfileSeed,
  setActiveHandwritingProfile,
  type HandwritingProfile,
  HANDWRITING_PROFILE_VERSION,
} from './HandwritingProfile';
import {
  acquireExtractToken,
  beginFreshUploadSession,
  isExtractTokenLive,
  trackObjectUrl,
  untrackObjectUrl,
} from './RenderLifecycle';
import { createSeededRng } from './VariationEngine';

export type StyleExtractRequest = {
  file: File;
  inputText?: string;
  /** When true (default), wipe prior pipeline state first. */
  freshSession?: boolean;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Content fingerprint so distinct files never collapse to the same seed. */
async function fingerprintFile(file: File): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }
    let h = 0x811c9dc5;
    const view = new Uint8Array(bytes);
    for (let i = 0; i < view.length; i++) {
      h = Math.imul(h ^ view[i]!, 0x01000193);
    }
    return `${view.length}-${h >>> 0}`;
  } catch {
    return `${file.size}-${file.name}`;
  }
}

function amplifyFromCenter(
  value: number,
  center: number,
  strength: number,
  min: number,
  max: number,
): number {
  return clamp(center + (value - center) * strength, min, max);
}

/**
 * A low-confidence upload still gets a stable, believable writer identity.
 * These are deliberately not the restrained Standard profile.
 */
function createGeneralizedFallbackProfile(
  seed: number,
  inkHex = '#1d2a4a',
): HandwritingProfile {
  const rng = createSeededRng(seed);
  const archetype = Math.floor(rng() * 4);
  const shared = {
    seed,
    source: 'generalized-fallback' as const,
    confidence: 0.2,
    matchStrength: 0.92,
    inkHex,
    revision: 0,
    usedFallback: true,
  };

  if (archetype === 0) {
    return createDefaultHandwritingProfile({
      ...shared,
      fontClass: 'messy-brush',
      fontFamily: 'Caveat',
      fontCategory: 'loose-scratch',
      isCursive: true,
      slantDegrees: 4.5,
      avgCharHeightPx: 24.5,
      baselineDrift: 0.72,
      charHeightVariation: 0.13,
      charWidthVariation: 0.1,
      wordSpacingEm: 0.28,
      lineSpacingScale: 1.08,
      strokeWidthPx: 1.25,
      strokeOpacityVariation: 0.13,
      strokeRoughness: 0.48,
      entryExitCurvature: 0.62,
      rotationVarianceDeg: 2.2,
      marginBias: 0.96,
      marginIrregularityEm: 0.24,
      randomness: 0.67,
      trackingEm: -0.012,
      writingSpeed: 0.74,
      connectedLetterBehavior: 0.68,
      ascenderScale: 1.14,
      descenderScale: 1.1,
    });
  }

  if (archetype === 1) {
    return createDefaultHandwritingProfile({
      ...shared,
      fontClass: 'rushed-student',
      fontFamily: 'Shadows Into Light',
      fontCategory: 'slanted-script',
      isCursive: true,
      slantDegrees: 11,
      avgCharHeightPx: 23,
      baselineDrift: 0.58,
      charHeightVariation: 0.1,
      charWidthVariation: 0.14,
      wordSpacingEm: 0.22,
      lineSpacingScale: 0.97,
      strokeWidthPx: 1,
      strokeOpacityVariation: 0.1,
      strokeRoughness: 0.25,
      entryExitCurvature: 0.78,
      rotationVarianceDeg: 1.45,
      marginBias: 0.91,
      marginIrregularityEm: 0.17,
      randomness: 0.54,
      trackingEm: -0.022,
      writingSpeed: 0.9,
      connectedLetterBehavior: 0.8,
      ascenderScale: 1.2,
      descenderScale: 1.14,
    });
  }

  if (archetype === 2) {
    return createDefaultHandwritingProfile({
      ...shared,
      fontClass: 'casual-print',
      fontFamily: 'Architects Daughter',
      fontCategory: 'casual-print',
      isCursive: false,
      slantDegrees: -2.5,
      avgCharHeightPx: 22,
      baselineDrift: 0.35,
      charHeightVariation: 0.08,
      charWidthVariation: 0.11,
      wordSpacingEm: 0.5,
      lineSpacingScale: 1.04,
      strokeWidthPx: 1.15,
      strokeOpacityVariation: 0.07,
      strokeRoughness: 0.18,
      entryExitCurvature: 0.08,
      rotationVarianceDeg: 1.1,
      marginBias: 1.05,
      marginIrregularityEm: 0.12,
      randomness: 0.42,
      trackingEm: 0.055,
      writingSpeed: 0.38,
      connectedLetterBehavior: 0.04,
      ascenderScale: 1.06,
      descenderScale: 1.16,
    });
  }

  return createDefaultHandwritingProfile({
    ...shared,
    fontClass: 'cursive-ribbon',
    fontFamily: 'Great Vibes',
    fontCategory: 'tight-cursive',
    isCursive: true,
    slantDegrees: 7.5,
    avgCharHeightPx: 26,
    baselineDrift: 0.22,
    charHeightVariation: 0.07,
    charWidthVariation: 0.08,
    wordSpacingEm: 0.18,
    lineSpacingScale: 1.12,
    strokeWidthPx: 0.9,
    strokeOpacityVariation: 0.06,
    strokeRoughness: 0.1,
    entryExitCurvature: 0.92,
    rotationVarianceDeg: 0.7,
    marginBias: 0.9,
    marginIrregularityEm: 0.08,
    randomness: 0.34,
    trackingEm: -0.03,
    writingSpeed: 0.62,
    connectedLetterBehavior: 0.94,
    ascenderScale: 1.28,
    descenderScale: 1.22,
  });
}

export function notebookStyleToHandwritingProfile(
  extracted: ExtractedNotebookStyle,
  fileMeta?: { name?: string; size?: number; fingerprint?: string },
): HandwritingProfile {
  const confidence = extracted.usedFallback
    ? 0
    : clamp(extracted.confidence ?? 0.5, 0, 1);
  const rawConnectivity = clamp(extracted.connectivityRatio, 0, 1);
  const rawNoise = clamp(extracted.noiseIntensity, 0, 1);
  const stroke = Math.max(0.8, extracted.strokeThickness);
  const vertical = clamp(extracted.verticalContinuity ?? rawConnectivity, 0, 1);
  const runs = clamp(extracted.avgRunsPerRow ?? 5, 1, 14);
  const blockiness = clamp(extracted.relativeRunWidth ?? stroke / 4, 0, 2);
  const fingerprint = fileMeta?.fingerprint ?? '';

  const seed = hashProfileSeed([
    extracted.inkHex,
    extracted.slantDegrees,
    rawNoise,
    extracted.fontClass,
    stroke,
    rawConnectivity,
    vertical,
    runs,
    blockiness,
    fingerprint,
  ]);

  const isCursive = !isDisconnectedPrintStyle(
    extracted.fontClass,
    extracted.fontCategory,
  );

  if (extracted.usedFallback || confidence < 0.28) {
    return createGeneralizedFallbackProfile(seed, extracted.inkHex);
  }

  // High confidence deliberately pushes dominant traits away from the middle.
  const traitGain = 1.05 + confidence * 0.55;
  const connectivity = amplifyFromCenter(
    rawConnectivity,
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
    21.5 + (stroke - 2.5) * 1.25 + (vertical - 0.5) * 3.2,
    17.5,
    29,
  );
  const charHeightVariation = clamp(
    (0.045 + noise * 0.13 + Math.abs(vertical - 0.5) * 0.05) *
      matchStrength,
    0.045,
    0.23,
  );
  const charWidthVariation = clamp(
    (0.04 + noise * 0.1 + Math.abs(blockiness - 0.55) * 0.055) *
      matchStrength,
    0.04,
    0.22,
  );
  const baselineDrift = clamp(
    (noise * 0.72 + (1 - vertical) * 0.3) * matchStrength,
    0.06,
    1,
  );
  const wordSpacingEm = amplifyFromCenter(
    0.12 + (1 - connectivity) * 0.52,
    0.34,
    traitGain,
    0.1,
    0.72,
  );
  const lineSpacingScale = amplifyFromCenter(
    0.92 + noise * 0.2 + vertical * 0.04,
    1,
    traitGain,
    0.88,
    1.2,
  );
  const strokeWidthPx = clamp(
    0.55 + stroke * 0.3 + blockiness * 0.22,
    0.72,
    2.45,
  );
  const marginBias = amplifyFromCenter(
    0.91 + (1 - connectivity) * 0.16,
    1,
    traitGain,
    0.82,
    1.2,
  );
  const trackingEm = isCursive
    ? clamp(-0.045 + (1 - connectivity) * 0.04, -0.05, 0.008)
    : clamp(0.025 + (1 - connectivity) * 0.075, 0.02, 0.105);
  const randomness = clamp(noise * 0.72 + (1 - confidence) * 0.12, 0.08, 0.88);
  const writingSpeed = clamp(
    connectivity * 0.5 + noise * 0.32 + Math.abs(slantDegrees) / 50,
    0.12,
    1,
  );
  const profileRng = createSeededRng(seed);
  const proportionBias = (profileRng() - 0.5) * 0.14;

  return {
    version: HANDWRITING_PROFILE_VERSION,
    seed,
    source: 'matched',
    confidence,
    matchStrength,
    inkHex: extracted.inkHex,
    slantDegrees,
    avgCharHeightPx,
    baselineDrift,
    charHeightVariation,
    charWidthVariation,
    wordSpacingEm,
    lineSpacingScale,
    strokeWidthPx,
    strokeOpacityVariation: clamp(
      (0.035 + noise * 0.17) * matchStrength,
      0.035,
      0.24,
    ),
    strokeRoughness: clamp(
      (noise * 0.62 + (1 - confidence) * 0.12) * matchStrength,
      0.04,
      0.85,
    ),
    entryExitCurvature: clamp(
      (connectivity * 0.78 + vertical * 0.22) * matchStrength,
      0.04,
      1,
    ),
    rotationVarianceDeg: clamp(
      (0.35 + noise * 2.8 + (1 - vertical) * 0.8) * matchStrength,
      0.35,
      4,
    ),
    marginBias,
    marginIrregularityEm: clamp(
      (0.04 + noise * 0.3 + (1 - vertical) * 0.08) * matchStrength,
      0.04,
      0.42,
    ),
    randomness,
    trackingEm,
    writingSpeed,
    connectedLetterBehavior: clamp(
      isCursive ? connectivity * 0.9 + vertical * 0.16 : connectivity * 0.16,
      0,
      1,
    ),
    ascenderScale: clamp(
      0.98 + vertical * 0.2 + proportionBias,
      0.92,
      1.3,
    ),
    descenderScale: clamp(
      0.98 + (1 - blockiness * 0.25) * 0.16 - proportionBias,
      0.92,
      1.28,
    ),
    fontClass: extracted.fontClass as HandwritingFontClass,
    fontCategory: extracted.fontCategory,
    fontFamily: extracted.fontFamily,
    isCursive,
    revision: 0,
    usedFallback: false,
  };
}

/**
 * Primary Match My Style entry — always starts a fresh pipeline session
 * so the Nth upload behaves like the first.
 */
export async function extractHandwritingProfile(
  request: StyleExtractRequest,
): Promise<{
  profile: HandwritingProfile;
  committed: boolean;
  token: number;
}> {
  const { file, inputText, freshSession = true } = request;

  if (freshSession) {
    beginFreshUploadSession();
  }

  const token = acquireExtractToken();
  const fingerprint = await fingerprintFile(file);
  if (!isExtractTokenLive(token)) {
    return {
      profile: createDefaultHandwritingProfile({ usedFallback: true }),
      committed: false,
      token,
    };
  }

  let extracted: ExtractedNotebookStyle;
  try {
    extracted = await extractNotebookStyle(file, {
      inputText,
      trackObjectUrl,
      untrackObjectUrl,
      extractToken: token,
      isTokenLive: isExtractTokenLive,
    });
  } catch (err) {
    console.warn('[NakalAI] StyleExtractor failed:', err);
    if (!isExtractTokenLive(token)) {
      return {
        profile: createDefaultHandwritingProfile({ usedFallback: true }),
        committed: false,
        token,
      };
    }
    const fallbackSeed = hashProfileSeed([fingerprint, 'extract-fallback']);
    const fallback = createGeneralizedFallbackProfile(fallbackSeed);
    setActiveHandwritingProfile(fallback);
    return { profile: fallback, committed: true, token };
  }

  if (!isExtractTokenLive(token)) {
    return {
      profile: createDefaultHandwritingProfile({ usedFallback: true }),
      committed: false,
      token,
    };
  }

  const profile = notebookStyleToHandwritingProfile(extracted, {
    name: file.name,
    size: file.size,
    fingerprint,
  });

  if (!isExtractTokenLive(token)) {
    return {
      profile: createDefaultHandwritingProfile({ usedFallback: true }),
      committed: false,
      token,
    };
  }

  setActiveHandwritingProfile(profile);
  return { profile, committed: true, token };
}
