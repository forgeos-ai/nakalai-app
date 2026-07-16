/**
 * Ligature Intelligence audit — consistency, continuity, join confidence.
 */

import type { PageSegment } from '../../../src/pagination';
import type { HandwritingDNA } from '../dna/types';
import { analyzeAdjacentPairOrNull } from './analyzer';
import {
  joinConfidenceThreshold,
  shouldJoinTransition,
} from './confidence';
import type {
  GlyphTransition,
  LigatureAudit,
  TransitionHeatmapCell,
} from './types';

function collectTransitions(args: {
  dna: HandwritingDNA;
  segments: PageSegment[];
}): GlyphTransition[] {
  const { dna, segments } = args;
  const transitions: GlyphTransition[] = [];
  let globalIndex = 0;

  for (const segment of segments) {
    if (segment.type === 'break') continue;
    for (let wi = 0; wi < segment.words.length; wi++) {
      const word = segment.words[wi]!;
      for (let ci = 0; ci < word.chars.length; ci++) {
        const char = word.chars[ci]!.char;
        const glyphIndex = word.chars[ci]!.globalIndex ?? globalIndex;
        globalIndex += 1;
        if (char === ' ') continue;

        let nextChar: string | undefined = word.chars[ci + 1]?.char;
        if (nextChar == null && segment.words[wi + 1]?.chars[0]) {
          nextChar = segment.words[wi + 1]!.chars[0]!.char;
        }
        if (nextChar === ' ') nextChar = undefined;

        const transition = analyzeAdjacentPairOrNull({
          dna,
          left: char,
          right: nextChar,
          glyphIndex,
        });
        if (transition) transitions.push(transition);
      }
    }
  }

  return transitions;
}

function buildHeatmap(
  transitions: GlyphTransition[],
  dna: HandwritingDNA,
): TransitionHeatmapCell[] {
  const threshold = joinConfidenceThreshold(dna);
  const grouped = new Map<
    string,
    {
      hits: number;
      joinSum: number;
      confSum: number;
      gapSum: number;
      joined: number;
    }
  >();

  for (const t of transitions) {
    const entry = grouped.get(t.pair) ?? {
      hits: 0,
      joinSum: 0,
      confSum: 0,
      gapSum: 0,
      joined: 0,
    };
    entry.hits += 1;
    entry.joinSum += t.joinStrength;
    entry.confSum += t.confidence;
    entry.gapSum += t.preferredGapEm;
    if (
      shouldJoinTransition({
        confidence: t.confidence,
        joinStrength: t.joinStrength,
        threshold,
        isCursive: dna.profileHints.isCursive,
      })
    ) {
      entry.joined += 1;
    }
    grouped.set(t.pair, entry);
  }

  return [...grouped.entries()]
    .map(([pair, stats]) => ({
      pair,
      hits: stats.hits,
      meanJoinStrength: stats.joinSum / stats.hits,
      meanConfidence: stats.confSum / stats.hits,
      meanGapEm: stats.gapSum / stats.hits,
      joinRate: stats.joined / stats.hits,
    }))
    .sort((a, b) => b.hits - a.hits || b.meanConfidence - a.meanConfidence);
}

export function auditLigatureIntelligence(args: {
  dna: HandwritingDNA;
  segments: PageSegment[];
}): LigatureAudit {
  const transitions = collectTransitions(args);
  const heatmap = buildHeatmap(transitions, args.dna);
  const threshold = joinConfidenceThreshold(args.dna);

  if (transitions.length === 0) {
    return {
      transitionConsistency: 1,
      continuityScore: 0.35,
      joinConfidence: 0.35,
      heatmap: [],
      transitions: [],
    };
  }

  const joinConfidence =
    transitions.reduce((sum, t) => sum + t.confidence, 0) / transitions.length;

  // Consistency: same digraph → similar joinStrength (low variance).
  let consistencySum = 0;
  let consistencyCount = 0;
  for (const cell of heatmap) {
    if (cell.hits < 2) continue;
    const pairTs = transitions.filter((t) => t.pair === cell.pair);
    const mean = cell.meanJoinStrength;
    const variance =
      pairTs.reduce((s, t) => s + (t.joinStrength - mean) ** 2, 0) /
      pairTs.length;
    consistencySum += 1 - Math.min(1, Math.sqrt(variance) * 4);
    consistencyCount += 1;
  }
  const transitionConsistency =
    consistencyCount === 0 ? joinConfidence : consistencySum / consistencyCount;

  const joined = transitions.filter((t) =>
    shouldJoinTransition({
      confidence: t.confidence,
      joinStrength: t.joinStrength,
      threshold,
      isCursive: args.dna.profileHints.isCursive,
    }),
  );
  const meanOverlap =
    joined.length === 0
      ? 0
      : joined.reduce((s, t) => s + t.overlapAmount, 0) / joined.length;
  const continuityScore =
    joinConfidence * 0.45 +
    (joined.length / transitions.length) * 0.35 +
    meanOverlap * 0.2;

  return {
    transitionConsistency,
    continuityScore,
    joinConfidence,
    heatmap,
    transitions,
  };
}
