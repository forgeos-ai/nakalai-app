/**
 * Writer Memory audit — consistency, diversity, context heatmap.
 */

import type { PageSegment } from '../../../src/pagination';
import type { HandwritingDNA } from '../dna/types';
import {
  resolveSentencePosition,
  resolveWordPosition,
  selectContextualGlyphVariant,
} from '../glyphs/contextual';
import { deriveContextWeights, buildWriterContextKey } from './habits';
import { resetGlyphEngineMode, setGlyphEngineMode, type GlyphEngineMode } from './session';
import type { ContextHeatmapCell, WriterMemoryAudit } from './types';

function simulateSelections(args: {
  dna: HandwritingDNA;
  segments: PageSegment[];
  mode: GlyphEngineMode;
}) {
  const { dna, segments, mode } = args;
  setGlyphEngineMode(mode);
  const totalGlyphs = segments.reduce(
    (count, segment) =>
      count +
      (segment.type === 'break'
        ? 0
        : segment.words.reduce((sum, word) => sum + word.chars.length, 0)),
    0,
  );
  const occurrences = new Map<string, number>();
  let globalIndex = 0;
  let previousChar: string | undefined;
  const records: Array<{
    char: string;
    contextKey: string;
    variantId: number;
    weights: number[];
  }> = [];

  for (const segment of segments) {
    if (segment.type === 'break') continue;
    for (let wi = 0; wi < segment.words.length; wi++) {
      const word = segment.words[wi]!;
      for (let ci = 0; ci < word.chars.length; ci++) {
        const rc = word.chars[ci]!;
        const char = rc.char;
        if (char === ' ' || !/[A-Za-z]/.test(char)) {
          previousChar = char;
          globalIndex += 1;
          continue;
        }

        let nextChar: string | undefined = word.chars[ci + 1]?.char;
        if (nextChar == null && segment.words[wi + 1]?.chars[0]) {
          nextChar = segment.words[wi + 1]!.chars[0]!.char;
        }

        const occurrenceKey = char.toLowerCase();
        const occurrence = occurrences.get(occurrenceKey) ?? 0;
        occurrences.set(occurrenceKey, occurrence + 1);
        const glyphIndex = rc.globalIndex ?? globalIndex;

        const context = {
          char,
          previousChar,
          nextChar,
          wordPosition: resolveWordPosition(ci, word.chars.length),
          sentencePosition: resolveSentencePosition(glyphIndex, totalGlyphs),
          occurrence,
          glyphIndex,
        };
        const contextKey = buildWriterContextKey(context);
        const weights = deriveContextWeights(dna.seed, contextKey);
        const variant = selectContextualGlyphVariant(dna.seed, context);
        records.push({
          char,
          contextKey,
          variantId: variant.id,
          weights,
        });
        previousChar = char;
        globalIndex += 1;
      }
    }
  }

  resetGlyphEngineMode();
  return records;
}

export function auditWriterMemory(args: {
  dna: HandwritingDNA;
  segments: PageSegment[];
  mode?: GlyphEngineMode;
}): WriterMemoryAudit {
  const records = simulateSelections({
    dna: args.dna,
    segments: args.segments,
    mode: args.mode ?? 'memory',
  });
  const grouped = new Map<string, ContextHeatmapCell>();

  for (const record of records) {
    const existing = grouped.get(record.contextKey);
    if (!existing) {
      grouped.set(record.contextKey, {
        contextKey: record.contextKey,
        char: record.char,
        hits: 1,
        preferredVariant: record.weights.indexOf(Math.max(...record.weights)),
        weights: record.weights,
        selections: [record.variantId],
      });
      continue;
    }
    existing.hits += 1;
    existing.selections = [...existing.selections, record.variantId];
  }

  const cells = [...grouped.values()].sort((a, b) => b.hits - a.hits);
  const repeated = cells.filter((cell) => cell.hits > 1);
  const consistency =
    repeated.length === 0
      ? 1
      : repeated.reduce((sum, cell) => {
          const unique = new Set(cell.selections).size;
          const agreement = 1 - (unique - 1) / Math.max(1, cell.hits - 1);
          return sum + agreement;
        }, 0) / repeated.length;

  const byChar = new Map<string, Set<number>>();
  for (const record of records) {
    const set = byChar.get(record.char) ?? new Set<number>();
    set.add(record.variantId);
    byChar.set(record.char, set);
  }
  const diversity =
    byChar.size === 0
      ? 0
      : [...byChar.values()].reduce((sum, set) => sum + set.size, 0) /
        (byChar.size * 5);

  return {
    consistency,
    diversity,
    cells,
  };
}
