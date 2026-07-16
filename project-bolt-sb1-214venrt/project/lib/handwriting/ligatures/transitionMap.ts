/**
 * Common cursive/print transition priors — deterministic pair habits.
 */

export type PairHabit = {
  joinBias: number;
  gapBiasEm: number;
  exit: number;
  entry: number;
  overlapBias: number;
};

/** High-frequency English digraphs with writer-like join priors. */
export const PAIR_HABITS: Readonly<Record<string, PairHabit>> = {
  th: { joinBias: 0.92, gapBiasEm: -0.04, exit: 0.18, entry: -0.12, overlapBias: 0.22 },
  he: { joinBias: 0.88, gapBiasEm: -0.03, exit: 0.1, entry: 0.08, overlapBias: 0.18 },
  er: { joinBias: 0.86, gapBiasEm: -0.025, exit: 0.14, entry: -0.06, overlapBias: 0.16 },
  re: { joinBias: 0.84, gapBiasEm: -0.02, exit: -0.08, entry: 0.1, overlapBias: 0.14 },
  ll: { joinBias: 0.94, gapBiasEm: -0.05, exit: 0.05, entry: 0.05, overlapBias: 0.28 },
  tt: { joinBias: 0.9, gapBiasEm: -0.045, exit: 0.12, entry: 0.12, overlapBias: 0.26 },
  ri: { joinBias: 0.8, gapBiasEm: -0.015, exit: -0.1, entry: 0.15, overlapBias: 0.12 },
  ou: { joinBias: 0.82, gapBiasEm: -0.02, exit: 0.08, entry: 0.06, overlapBias: 0.14 },
  in: { joinBias: 0.85, gapBiasEm: -0.025, exit: 0.16, entry: -0.1, overlapBias: 0.15 },
  st: { joinBias: 0.87, gapBiasEm: -0.03, exit: 0.2, entry: 0.05, overlapBias: 0.17 },
  ch: { joinBias: 0.83, gapBiasEm: -0.02, exit: 0.1, entry: -0.14, overlapBias: 0.13 },
  an: { joinBias: 0.78, gapBiasEm: -0.01, exit: 0.06, entry: -0.08, overlapBias: 0.1 },
  en: { joinBias: 0.8, gapBiasEm: -0.015, exit: 0.08, entry: -0.08, overlapBias: 0.11 },
  on: { joinBias: 0.79, gapBiasEm: -0.012, exit: 0.04, entry: -0.06, overlapBias: 0.1 },
  at: { joinBias: 0.76, gapBiasEm: -0.008, exit: 0.1, entry: 0.12, overlapBias: 0.09 },
  te: { joinBias: 0.81, gapBiasEm: -0.018, exit: 0.14, entry: 0.08, overlapBias: 0.12 },
  es: { joinBias: 0.77, gapBiasEm: -0.01, exit: 0.06, entry: 0.1, overlapBias: 0.1 },
  or: { joinBias: 0.78, gapBiasEm: -0.012, exit: 0.04, entry: -0.05, overlapBias: 0.1 },
  ed: { joinBias: 0.75, gapBiasEm: -0.008, exit: 0.08, entry: -0.12, overlapBias: 0.09 },
  ss: { joinBias: 0.88, gapBiasEm: -0.04, exit: 0.06, entry: 0.06, overlapBias: 0.2 },
  oo: { joinBias: 0.86, gapBiasEm: -0.035, exit: 0.02, entry: 0.02, overlapBias: 0.18 },
  ee: { joinBias: 0.87, gapBiasEm: -0.038, exit: 0.04, entry: 0.04, overlapBias: 0.19 },
  ng: { joinBias: 0.74, gapBiasEm: -0.005, exit: -0.06, entry: -0.1, overlapBias: 0.08 },
  qu: { joinBias: 0.91, gapBiasEm: -0.04, exit: -0.15, entry: 0.12, overlapBias: 0.2 },
};

export function lookupPairHabit(left: string, right: string): PairHabit | null {
  const key = `${left.toLowerCase()}${right.toLowerCase()}`;
  return PAIR_HABITS[key] ?? null;
}
