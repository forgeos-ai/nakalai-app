/**
 * Writer Memory — contextual glyph preference weights (deterministic).
 */

import { hashDnaSeed, mixSeed } from '../types';
import {
  CONTEXTUAL_GLYPH_VARIANT_COUNT,
  type ContextualGlyphVariant,
} from '../glyphs/contextual';
import type { WriterMemoryContext } from './types';

const VARIANTS: readonly Omit<ContextualGlyphVariant, 'id'>[] = [
  { scaleX: 1, skewX: 0 },
  { scaleX: 0.982, skewX: -0.012 },
  { scaleX: 1.018, skewX: 0.01 },
  { scaleX: 0.972, skewX: 0.016 },
  { scaleX: 1.028, skewX: -0.008 },
] as const;

function isPunctuation(char: string | undefined): boolean {
  return Boolean(char && /[.,;:!?]/.test(char));
}

/** Stable writer-context fingerprint for preference learning. */
export function buildWriterContextKey(context: WriterMemoryContext): string {
  const isCapital =
    context.char === context.char.toUpperCase() && /[A-Za-z]/.test(context.char);
  const afterPunctuation = isPunctuation(context.previousChar);
  const beforePunctuation = isPunctuation(context.nextChar);
  const sentenceStart =
    context.sentencePosition === 'start' && context.wordPosition === 'initial';

  return [
    context.char.toLowerCase(),
    context.previousChar?.toLowerCase() ?? '^',
    context.nextChar?.toLowerCase() ?? '$',
    context.wordPosition,
    sentenceStart ? 'sent0' : context.sentencePosition,
    isCapital ? 'cap' : 'low',
    afterPunctuation ? 'punctPrev' : '-',
    beforePunctuation ? 'punctNext' : '-',
  ].join('|');
}

/** Deterministic preference weights per writer + context. */
export function deriveContextWeights(
  dnaSeed: number,
  contextKey: string,
): number[] {
  const root = hashDnaSeed([dnaSeed, 'writer-memory', contextKey]);
  const raw = Array.from({ length: CONTEXTUAL_GLYPH_VARIANT_COUNT }, (_, id) => {
    const bucket = hashDnaSeed([root, id]) % 1000;
    return 0.08 + bucket / 1000;
  });
  const sum = raw.reduce((acc, value) => acc + value, 0);
  return raw.map((value) => value / sum);
}

/**
 * Pick a variant from learned weights.
 * Same context reuses the top preference; repeats softly explore neighbors.
 */
export function selectWriterMemoryGlyph(
  dnaSeed: number,
  context: WriterMemoryContext,
): ContextualGlyphVariant {
  const contextKey = buildWriterContextKey(context);
  const weights = deriveContextWeights(dnaSeed, contextKey);
  const ranked = weights
    .map((weight, id) => ({ id, weight }))
    .sort((a, b) => b.weight - a.weight);

  const pick = hashDnaSeed([dnaSeed, contextKey, context.char.toLowerCase()]) % 1000;
  let cumulative = 0;
  let variantId = ranked[0]!.id;
  for (const entry of ranked) {
    cumulative += entry.weight * 1000;
    if (pick < cumulative) {
      variantId = entry.id;
      break;
    }
  }

  // Same writer context reuses the preferred glyph; rare soft explore on repeats.
  if (context.occurrence > 0) {
    const explore = hashDnaSeed([dnaSeed, contextKey, context.occurrence]) % 8;
    if (explore === 0) {
      variantId = ranked[Math.min(1, ranked.length - 1)]!.id;
    }
  }

  const micro =
    ((hashDnaSeed([mixSeed(dnaSeed, pick), variantId]) % 7) - 3) * 0.00035;
  const variant = VARIANTS[variantId]!;
  return {
    id: variantId,
    scaleX: variant.scaleX + micro,
    skewX: variant.skewX - micro,
  };
}
