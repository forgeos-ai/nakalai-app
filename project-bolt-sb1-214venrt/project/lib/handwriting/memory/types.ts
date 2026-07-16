/**
 * Writer Memory — deterministic contextual glyph habit types.
 */

import type { WordPosition, SentencePosition } from '../glyphs/contextual';

export type WriterMemoryContext = {
  char: string;
  previousChar?: string;
  nextChar?: string;
  wordPosition: WordPosition;
  sentencePosition: SentencePosition;
  occurrence: number;
  glyphIndex: number;
};

export type ContextHeatmapCell = {
  contextKey: string;
  char: string;
  hits: number;
  preferredVariant: number;
  weights: readonly number[];
  selections: readonly number[];
};

export type WriterMemoryAudit = {
  consistency: number;
  diversity: number;
  cells: ContextHeatmapCell[];
};
