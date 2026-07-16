/**
 * Deterministic contextual glyph selection.
 *
 * Variants are subtle transforms of the writer's primary face. They never
 * substitute a companion font, so the writer identity remains stable.
 */

import { hashDnaSeed, mixSeed } from '../types';
import { getGlyphEngineMode } from '../memory/session';
import { selectWriterMemoryGlyph } from '../memory/habits';

export const CONTEXTUAL_GLYPH_VARIANT_COUNT = 5;

export type WordPosition = 'isolated' | 'initial' | 'middle' | 'final';
export type SentencePosition = 'start' | 'middle' | 'end';

export type GlyphContext = {
  char: string;
  previousChar?: string;
  nextChar?: string;
  wordPosition: WordPosition;
  sentencePosition: SentencePosition;
  occurrence: number;
  glyphIndex: number;
};

export type ContextualGlyphVariant = {
  id: number;
  scaleX: number;
  skewX: number;
};

const VARIANTS: readonly Omit<ContextualGlyphVariant, 'id'>[] = [
  { scaleX: 1, skewX: 0 },
  { scaleX: 0.982, skewX: -0.012 },
  { scaleX: 1.018, skewX: 0.01 },
  { scaleX: 0.972, skewX: 0.016 },
  { scaleX: 1.028, skewX: -0.008 },
] as const;

/**
 * Select a stable variant from linguistic context, then cycle repeated
 * occurrences to avoid stamp-like repetition in identical contexts.
 */
export function selectContextualGlyphVariant(
  dnaSeed: number,
  context: GlyphContext,
): ContextualGlyphVariant {
  if (getGlyphEngineMode() === 'memory') {
    return selectWriterMemoryGlyph(dnaSeed, context);
  }

  const characterStart =
    mixSeed(dnaSeed, hashDnaSeed([context.char.toLowerCase()])) %
    VARIANTS.length;
  const contextHash = hashDnaSeed([
    context.previousChar?.toLowerCase() ?? '^',
    context.nextChar?.toLowerCase() ?? '$',
    context.wordPosition,
    context.sentencePosition,
    context.glyphIndex,
  ]);
  // Occurrence cycling guarantees A1/A2/A3-style diversity before reuse.
  // Context adds a smaller deformation within each identity-safe variant.
  const id = (characterStart + context.occurrence) % VARIANTS.length;
  const contextNudge = ((contextHash % 5) - 2) * 0.001;
  const variant = VARIANTS[id]!;
  return {
    id,
    scaleX: variant.scaleX + contextNudge,
    skewX: variant.skewX - contextNudge,
  };
}

export function resolveWordPosition(
  charIndex: number,
  wordLength: number,
): WordPosition {
  if (wordLength <= 1) return 'isolated';
  if (charIndex === 0) return 'initial';
  if (charIndex === wordLength - 1) return 'final';
  return 'middle';
}

export function resolveSentencePosition(
  glyphIndex: number,
  totalGlyphs: number,
): SentencePosition {
  if (glyphIndex === 0) return 'start';
  if (glyphIndex >= Math.max(0, totalGlyphs - 1)) return 'end';
  return 'middle';
}
