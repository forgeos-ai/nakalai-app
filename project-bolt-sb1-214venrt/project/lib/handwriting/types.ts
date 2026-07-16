/**
 * Shared DNA Engine contracts — every measurement carries confidence.
 * Memory-only; never persisted.
 */

export type DnaSource =
  | 'measured'
  | 'inferred'
  | 'archetype'
  | 'fallback';

export type DnaConfidence = {
  /** [0, 1] trustworthiness for this measurement. */
  confidence: number;
  source: DnaSource;
  /** Optional sample / support count. */
  support?: number;
};

export type DnaMetric<T> = { value: T } & DnaConfidence;

export function metric<T>(
  value: T,
  confidence: number,
  source: DnaSource,
  support?: number,
): DnaMetric<T> {
  return {
    value,
    confidence: Math.min(1, Math.max(0, confidence)),
    source,
    ...(support != null ? { support } : {}),
  };
}

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Aggregate child confidences — mean weighted by presence. */
export function aggregateConfidence(
  parts: Array<{ confidence: number } | undefined | null>,
): number {
  const vals = parts
    .filter((p): p is { confidence: number } => p != null)
    .map((p) => clamp01(p.confidence));
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** FNV-1a style 32-bit hash — shared with HandwritingProfile. */
export function hashDnaSeed(parts: Array<string | number>): number {
  let h = 0x811c9dc5;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mixSeed(a: number, b: number): number {
  let h = (a >>> 0) ^ Math.imul(b >>> 0, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

export function createSeededRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
