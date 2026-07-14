/**
 * Compatibility shim — Match My Style no longer builds character-patch maps.
 * Public function names preserved for App / ControlPanel imports.
 * Internally delegates to the Handwriting Profile Engine.
 */

import {
  clearHandwritingProfile,
  getActiveHandwritingProfile,
  getHandwritingProfileRevision,
  isHandwritingProfileActive,
  type HandwritingProfile,
} from '../handwriting/HandwritingProfile';
import { extractHandwritingProfile } from '../handwriting/StyleExtractor';

/** @deprecated Character patches removed — empty map kept for type compat. */
export type CustomStyleMap = Map<string, HTMLCanvasElement>;

export const CUSTOM_STYLE_TRACKING_TIGHTEN = 0.88;
export const CUSTOM_PATCH_GLOBAL_SCALE = 0.9;
export const CUSTOM_PATCH_TRACKING_CUSHION_PX = 1;

export function setCustomStyleSampleText(_text: string): void {
  /* no-op — profile engine does not map sample glyphs */
}

export function isCustomStyleActive(): boolean {
  return isHandwritingProfileActive();
}

export function getCustomStyleMap(): CustomStyleMap {
  return new Map();
}

export function getCustomStyleRevision(): number {
  return getHandwritingProfileRevision();
}

export function clearCustomStyleMap(): void {
  clearHandwritingProfile();
}

export function lookupCustomStylePatch(
  _char: string,
): HTMLCanvasElement | undefined {
  return undefined;
}

export function drawCustomStylePatch(
  _ctx: CanvasRenderingContext2D,
  _patch: HTMLCanvasElement,
  _char: string,
  _fontSize: number,
): { width: number; height: number } {
  return { width: 0, height: 0 };
}

export function resolvePatchAdvance(
  _char: string,
  _nextChar: string | undefined,
  drawnWidth: number,
  trackingEmPx: number,
  contextualKerning: number,
): number {
  return drawnWidth * CUSTOM_STYLE_TRACKING_TIGHTEN + trackingEmPx + contextualKerning;
}

/**
 * Former character-grid builder — now extracts a HandwritingProfile only.
 */
export async function buildCustomStyleMapFromFile(
  file: File,
  sampleText = '',
): Promise<{
  map: CustomStyleMap;
  patchCount: number;
  revision: number;
  profile: HandwritingProfile;
  committed: boolean;
}> {
  const { profile, committed } = await extractHandwritingProfile({
    file,
    inputText: sampleText,
  });
  return {
    map: new Map(),
    patchCount: 0,
    revision: getHandwritingProfileRevision(),
    profile,
    committed,
  };
}

export function getActiveProfileFromStyleMap(): HandwritingProfile | null {
  return getActiveHandwritingProfile();
}
