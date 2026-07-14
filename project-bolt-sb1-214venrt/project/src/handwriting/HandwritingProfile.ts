/**
 * HandwritingProfile — sole style contract for the canvas renderer.
 * Built by StyleExtractor; never holds image pixels or character patches.
 */

import type { HandwritingFontClass } from '../constants';
import {
  DEFAULT_HANDWRITING_FONT_CLASS,
  getFontStyleByClass,
  isDisconnectedPrintStyle,
} from '../constants';
import { googleFontNameForClass } from '../utils/styleExtractor';
import type { MatchedStyleOverrides } from '../pageGeometry';
import { DEFAULT_FONT_SIZE_PX } from '../pageGeometry';

export const HANDWRITING_PROFILE_VERSION = 2 as const;

export type HandwritingProfileSource =
  | 'standard'
  | 'matched'
  | 'generalized-fallback';

/**
 * Deterministic high-level handwriting attributes.
 * Renderer + VariationEngine consume only this object.
 */
export type HandwritingProfile = {
  version: typeof HANDWRITING_PROFILE_VERSION;
  /** Stable hash derived from extracted metrics — seeds all variation. */
  seed: number;
  /** Distinguishes the restrained standard engine from perceptual matching. */
  source: HandwritingProfileSource;
  /** Extractor confidence [0, 1]. High confidence applies traits more strongly. */
  confidence: number;
  /** Overall perceptual influence [0, 1.5]. Standard output is always 0. */
  matchStrength: number;
  inkHex: string;
  /** Global baseline rotation in degrees. */
  slantDegrees: number;
  /** Target x-height / paint size (CSS px at design scale). */
  avgCharHeightPx: number;
  /** 0–1 vertical baseline wobble intensity. */
  baselineDrift: number;
  /** Per-glyph height range around the profile mean [0, 0.3]. */
  charHeightVariation: number;
  /** Per-glyph width range around the profile mean [0, 0.3]. */
  charWidthVariation: number;
  /** Extra gap between words (em of avgCharHeight). */
  wordSpacingEm: number;
  /** Multiplier on ruled line spacing. */
  lineSpacingScale: number;
  /** Pen pressure proxy — drives shadow / optical weight. */
  strokeWidthPx: number;
  /** Deterministic alpha range [0, 0.3]. */
  strokeOpacityVariation: number;
  /** Controlled duplicate-stroke displacement [0, 1]. */
  strokeRoughness: number;
  /** Entry/exit connector curvature [0, 1]. */
  entryExitCurvature: number;
  /** Independent per-character rotation range in degrees. */
  rotationVarianceDeg: number;
  /** Left margin tendency (>1 = more inset). */
  marginBias: number;
  /** Per-line left-edge movement in em. */
  marginIrregularityEm: number;
  /** 0–1 controlled randomness scale for the VariationEngine. */
  randomness: number;
  /** Letter-spacing em. */
  trackingEm: number;
  /** Fast writing compresses forms and strengthens joins [0, 1]. */
  writingSpeed: number;
  /** Probability/strength of connected-letter joins [0, 1]. */
  connectedLetterBehavior: number;
  /** Relative upper-stem extension. */
  ascenderScale: number;
  /** Relative lower-stem extension. */
  descenderScale: number;
  fontClass: HandwritingFontClass;
  fontCategory?: string;
  /** Exact Google Fonts family name for ctx.font. */
  fontFamily: string;
  isCursive: boolean;
  /** Bumps on every commit so React effects re-paint. */
  revision: number;
  usedFallback: boolean;
};

let activeProfile: HandwritingProfile | null = null;
let profileRevision = 0;

export function getHandwritingProfileRevision(): number {
  return profileRevision;
}

export function getActiveHandwritingProfile(): HandwritingProfile | null {
  return activeProfile;
}

export function setActiveHandwritingProfile(
  profile: HandwritingProfile | null,
): void {
  profileRevision += 1;
  activeProfile = profile
    ? { ...profile, revision: profileRevision }
    : null;
}

export function clearHandwritingProfile(): void {
  activeProfile = null;
  profileRevision += 1;
}

export function isHandwritingProfileActive(): boolean {
  return activeProfile != null;
}

/** FNV-1a style 32-bit hash — deterministic across browsers. */
export function hashProfileSeed(parts: Array<string | number>): number {
  let h = 0x811c9dc5;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function createDefaultHandwritingProfile(
  partial?: Partial<HandwritingProfile>,
): HandwritingProfile {
  const fontClass =
    partial?.fontClass ?? DEFAULT_HANDWRITING_FONT_CLASS;
  const font = getFontStyleByClass(fontClass);
  const fontFamily =
    partial?.fontFamily ?? googleFontNameForClass(fontClass);
  const isCursive =
    partial?.isCursive ??
    !isDisconnectedPrintStyle(fontClass, partial?.fontCategory);

  const profile: HandwritingProfile = {
    version: HANDWRITING_PROFILE_VERSION,
    seed:
      partial?.seed ??
      hashProfileSeed([
        fontClass,
        fontFamily,
        font.layout.slantDegrees,
        'default',
      ]),
    source: partial?.source ?? 'standard',
    confidence: partial?.confidence ?? 1,
    matchStrength:
      partial?.matchStrength ?? (partial?.source === 'matched' ? 1 : 0),
    inkHex: partial?.inkHex ?? '#1e40af',
    slantDegrees: partial?.slantDegrees ?? font.layout.slantDegrees,
    avgCharHeightPx: partial?.avgCharHeightPx ?? DEFAULT_FONT_SIZE_PX,
    baselineDrift: partial?.baselineDrift ?? font.layout.baselineJitter,
    charHeightVariation: partial?.charHeightVariation ?? 0.025,
    charWidthVariation: partial?.charWidthVariation ?? 0.018,
    wordSpacingEm: partial?.wordSpacingEm ?? 0.35,
    lineSpacingScale:
      partial?.lineSpacingScale ?? font.layout.lineSpaceScale,
    strokeWidthPx: partial?.strokeWidthPx ?? font.layout.strokeWeight * 1.6,
    strokeOpacityVariation: partial?.strokeOpacityVariation ?? 0.025,
    strokeRoughness: partial?.strokeRoughness ?? 0.04,
    entryExitCurvature: partial?.entryExitCurvature ?? 0.2,
    rotationVarianceDeg: partial?.rotationVarianceDeg ?? 0.35,
    marginBias: partial?.marginBias ?? font.layout.marginScale,
    marginIrregularityEm: partial?.marginIrregularityEm ?? 0.04,
    randomness: partial?.randomness ?? 0.3,
    trackingEm: partial?.trackingEm ?? font.layout.trackingEm,
    writingSpeed: partial?.writingSpeed ?? 0.35,
    connectedLetterBehavior:
      partial?.connectedLetterBehavior ?? (isCursive ? 0.55 : 0.05),
    ascenderScale: partial?.ascenderScale ?? 1,
    descenderScale: partial?.descenderScale ?? 1,
    fontClass,
    fontCategory: partial?.fontCategory,
    fontFamily,
    isCursive,
    revision: partial?.revision ?? profileRevision,
    usedFallback: partial?.usedFallback ?? true,
  };

  return profile;
}

/** Map legacy MatchedStyleOverrides → profile without leaking stale session metrics. */
export function profileFromMatchedOverrides(
  matched: MatchedStyleOverrides | null | undefined,
  fallbacks?: Partial<HandwritingProfile>,
): HandwritingProfile | null {
  if (!matched) return null;
  const active = activeProfile;
  // Only trust session structural fields when they belong to THIS match
  const activeMatches =
    active != null &&
    active.fontClass === matched.fontClass &&
    Math.abs(active.slantDegrees - matched.slantDegrees) < 0.51 &&
    active.inkHex.toLowerCase() === matched.inkHex.toLowerCase();

  const fontClass = matched.fontClass;
  const font = getFontStyleByClass(fontClass);
  const fontFamily =
    (activeMatches && active.fontFamily) || googleFontNameForClass(fontClass);
  const isCursive = !isDisconnectedPrintStyle(
    fontClass,
    matched.fontCategory,
  );

  return {
    version: HANDWRITING_PROFILE_VERSION,
    seed: activeMatches
      ? active.seed
      : hashProfileSeed([
          matched.inkHex,
          matched.slantDegrees,
          matched.noiseIntensity,
          fontClass,
          profileRevision,
        ]),
    source: activeMatches ? active.source : 'matched',
    confidence: activeMatches ? active.confidence : 0.55,
    matchStrength: activeMatches ? active.matchStrength : 0.85,
    inkHex: matched.inkHex,
    slantDegrees: matched.slantDegrees,
    avgCharHeightPx: activeMatches
      ? active.avgCharHeightPx
      : (fallbacks?.avgCharHeightPx ?? DEFAULT_FONT_SIZE_PX),
    baselineDrift: activeMatches
      ? active.baselineDrift
      : (matched.noiseIntensity ?? 0.3),
    charHeightVariation: activeMatches
      ? active.charHeightVariation
      : 0.06 + (matched.noiseIntensity ?? 0.3) * 0.1,
    charWidthVariation: activeMatches
      ? active.charWidthVariation
      : 0.05 + (matched.noiseIntensity ?? 0.3) * 0.08,
    wordSpacingEm: activeMatches
      ? active.wordSpacingEm
      : (fallbacks?.wordSpacingEm ?? 0.35),
    lineSpacingScale: activeMatches
      ? active.lineSpacingScale
      : (fallbacks?.lineSpacingScale ?? font.layout.lineSpaceScale),
    strokeWidthPx: activeMatches
      ? active.strokeWidthPx
      : (fallbacks?.strokeWidthPx ?? font.layout.strokeWeight * 1.6),
    strokeOpacityVariation: activeMatches
      ? active.strokeOpacityVariation
      : 0.05 + (matched.noiseIntensity ?? 0.3) * 0.12,
    strokeRoughness: activeMatches
      ? active.strokeRoughness
      : 0.1 + (matched.noiseIntensity ?? 0.3) * 0.35,
    entryExitCurvature: activeMatches
      ? active.entryExitCurvature
      : isCursive
        ? 0.7
        : 0.12,
    rotationVarianceDeg: activeMatches
      ? active.rotationVarianceDeg
      : 0.8 + (matched.noiseIntensity ?? 0.3) * 2.2,
    marginBias: activeMatches
      ? active.marginBias
      : font.layout.marginScale,
    marginIrregularityEm: activeMatches
      ? active.marginIrregularityEm
      : 0.08 + (matched.noiseIntensity ?? 0.3) * 0.24,
    randomness: matched.noiseIntensity ?? (activeMatches ? active.randomness : 0.3),
    trackingEm: activeMatches
      ? active.trackingEm
      : font.layout.trackingEm,
    writingSpeed: activeMatches
      ? active.writingSpeed
      : isCursive
        ? 0.72
        : 0.38,
    connectedLetterBehavior: activeMatches
      ? active.connectedLetterBehavior
      : isCursive
        ? 0.72
        : 0.08,
    ascenderScale: activeMatches ? active.ascenderScale : 1.08,
    descenderScale: activeMatches ? active.descenderScale : 1.06,
    fontClass,
    fontCategory: matched.fontCategory,
    fontFamily,
    isCursive,
    revision: Math.max(
      activeMatches ? active.revision : 0,
      profileRevision,
    ),
    usedFallback: activeMatches ? active.usedFallback : false,
  };
}

/** Public bridge — UI still speaks MatchedStyleOverrides. */
export function matchedOverridesFromProfile(
  profile: HandwritingProfile,
): MatchedStyleOverrides {
  return {
    inkHex: profile.inkHex,
    slantDegrees: profile.slantDegrees,
    noiseIntensity: profile.randomness,
    fontCategory: profile.fontCategory,
    fontClass: profile.fontClass,
  };
}

/**
 * Resolve the profile that CanvasRenderer must use for a paint.
 * Active session profile is authoritative for structural attrs after a match.
 */
export function resolveHandwritingProfile(args: {
  matchedStyle?: MatchedStyleOverrides | null;
  inkHex: string;
  fontClass: HandwritingFontClass | string;
  fontFamily: string;
  slantDegrees: number;
  trackingEm: number;
  lineSpacingScale: number;
  strokeWeight: number;
  fontSizePx: number;
  paintRevision: number;
}): HandwritingProfile {
  const fromSession = getActiveHandwritingProfile();
  const matched = args.matchedStyle;

  if (
    fromSession &&
    matched &&
    fromSession.fontClass === matched.fontClass &&
    Math.abs(fromSession.slantDegrees - matched.slantDegrees) < 0.51
  ) {
    return {
      ...fromSession,
      inkHex: args.inkHex || matched.inkHex || fromSession.inkHex,
      // Matched structural geometry is authoritative. Replacing these with
      // standard layout values made Match My Style visually converge.
      avgCharHeightPx: fromSession.avgCharHeightPx,
      slantDegrees: fromSession.slantDegrees,
      trackingEm: fromSession.trackingEm,
      lineSpacingScale: fromSession.lineSpacingScale,
      strokeWidthPx: fromSession.strokeWidthPx,
      fontFamily: fromSession.fontFamily || args.fontFamily,
      revision: Math.max(
        fromSession.revision,
        args.paintRevision,
        profileRevision,
      ),
    };
  }

  const fromMatched = profileFromMatchedOverrides(matched);
  const base =
    fromMatched ??
    fromSession ??
    createDefaultHandwritingProfile({
      source: 'standard',
      matchStrength: 0,
      fontClass: args.fontClass as HandwritingFontClass,
      fontFamily: args.fontFamily,
      inkHex: args.inkHex,
      slantDegrees: args.slantDegrees,
      trackingEm: args.trackingEm,
      lineSpacingScale: args.lineSpacingScale,
      strokeWidthPx: args.strokeWeight * 1.6,
      avgCharHeightPx: args.fontSizePx,
    });

  return {
    ...base,
    inkHex: args.inkHex || base.inkHex,
    avgCharHeightPx: args.fontSizePx || base.avgCharHeightPx,
    slantDegrees: args.slantDegrees ?? base.slantDegrees,
    trackingEm: args.trackingEm ?? base.trackingEm,
    lineSpacingScale: args.lineSpacingScale ?? base.lineSpacingScale,
    strokeWidthPx:
      args.strokeWeight > 0
        ? args.strokeWeight * 1.6
        : base.strokeWidthPx,
    fontFamily: args.fontFamily || base.fontFamily,
    revision: Math.max(base.revision, args.paintRevision, profileRevision),
  };
}
