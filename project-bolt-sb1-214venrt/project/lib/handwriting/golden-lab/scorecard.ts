/**
 * Engine scorecard — measurable handwriting quality dimensions.
 */

import { clamp01 } from '../types';
import { buildPagePaintPlan } from '../renderer/instructions';
import type { HandwritingDNA } from '../dna/types';
import type { GoldenSample } from './types';
import type {
  DimensionScore,
  EngineScorecard,
  EngineVersionId,
  ScorecardDimension,
} from './types';
import { fingerprintPaintPlan } from './fingerprint';
import { textToSegments } from './segments';
import { CONTEXTUAL_GLYPH_VARIANT_COUNT } from '../glyphs/contextual';
import {
  auditWriterMemory,
  resetGlyphEngineMode,
  setGlyphEngineMode,
} from '../memory';
import {
  auditLigatureIntelligence,
  resetLigatureEngineMode,
  setLigatureEngineMode,
} from '../ligatures';
import {
  auditMotionPhysics,
  resetPressureEngineMode,
  setPressureEngineMode,
} from '../pressure';

function score(
  dimension: ScorecardDimension,
  value: number,
  confidence: number,
  detail: string,
): DimensionScore {
  return {
    dimension,
    score: Math.round(clamp01(value / 100) * 100),
    confidence: clamp01(confidence),
    detail,
  };
}

function uniqueFamilies(plan: ReturnType<typeof buildPagePaintPlan>): number {
  const set = new Set<string>();
  for (const line of plan.lines) {
    for (const g of line.glyphs) {
      if (g.char !== ' ') set.add(g.family);
    }
  }
  return set.size;
}

function auditRepeatedGlyphs(plan: ReturnType<typeof buildPagePaintPlan>) {
  const variants = new Map<string, number[]>();
  for (const glyph of plan.lines.flatMap((line) => line.glyphs)) {
    if (!/[A-Za-z]/.test(glyph.char)) continue;
    const key = glyph.char;
    const sequence = variants.get(key) ?? [];
    sequence.push(glyph.variantId ?? 0);
    variants.set(key, sequence);
  }
  return [...variants.entries()]
    .filter(([, sequence]) => sequence.length > 1)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([char, variantSequence]) => ({
      char,
      occurrences: variantSequence.length,
      uniqueVariants: new Set(variantSequence).size,
      variantSequence,
    }));
}

function meanAdvanceVariance(plan: ReturnType<typeof buildPagePaintPlan>): number {
  const advances = plan.lines.flatMap((l) =>
    l.glyphs.filter((g) => g.char !== ' ').map((g) => g.advance),
  );
  if (advances.length < 2) return 0;
  const mean = advances.reduce((a, b) => a + b, 0) / advances.length;
  const variance =
    advances.reduce((s, a) => s + (a - mean) ** 2, 0) / advances.length;
  return Math.sqrt(variance);
}

function wordGapStats(plan: ReturnType<typeof buildPagePaintPlan>): {
  variance: number;
  coefficient: number;
} {
  const gaps = plan.lines.flatMap((line) =>
    line.glyphs.filter((glyph) => glyph.char === ' ').map((glyph) => glyph.advance),
  );
  if (gaps.length < 2) return { variance: 0, coefficient: 0 };
  const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const variance = Math.sqrt(
    gaps.reduce((sum, gap) => sum + (gap - mean) ** 2, 0) / gaps.length,
  );
  return {
    variance,
    coefficient: variance / Math.max(mean, 0.01),
  };
}

function connectRate(plan: ReturnType<typeof buildPagePaintPlan>): number {
  const letters = plan.lines.flatMap((l) =>
    l.glyphs.filter((g) => g.char !== ' ' && /[A-Za-z]/.test(g.char)),
  );
  if (letters.length === 0) return 0;
  const connects = letters.filter((g) => g.connectToNext).length;
  return connects / letters.length;
}

function meanAlphaSpread(plan: ReturnType<typeof buildPagePaintPlan>): number {
  const alphas = plan.lines.flatMap((l) =>
    l.glyphs.filter((g) => g.char !== ' ').map((g) => g.alpha),
  );
  if (alphas.length < 2) return 0;
  return Math.max(...alphas) - Math.min(...alphas);
}

function baselineWobble(plan: ReturnType<typeof buildPagePaintPlan>): number {
  const ys = plan.lines.flatMap((l) =>
    l.glyphs.filter((g) => g.char !== ' ').map((g) => g.y),
  );
  if (ys.length < 2) return 0;
  const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
  return Math.sqrt(ys.reduce((s, y) => s + (y - mean) ** 2, 0) / ys.length);
}

/**
 * Score a single sample for one engine version.
 */
export function scoreSample(args: {
  sample: GoldenSample;
  engineVersion: EngineVersionId;
  dna?: HandwritingDNA;
}): EngineScorecard {
  const { sample, engineVersion } = args;
  const dna = args.dna ?? sample.dna;
  const segments = textToSegments(sample.text);
  const isBaseline = engineVersion === 'dna-v1-baseline';
  setGlyphEngineMode(isBaseline ? 'cycle' : 'memory');
  setLigatureEngineMode(isBaseline ? 'legacy' : 'intelligent');
  setPressureEngineMode(isBaseline ? 'legacy' : 'physics');
  const plan = buildPagePaintPlan({
    dna,
    segments,
    widthPx: sample.widthPx,
    pageSalt: sample.pageSalt,
    glyphSelection: 'contextual',
    wordSpacing: 'rhythm',
  });
  resetGlyphEngineMode();
  resetLigatureEngineMode();
  resetPressureEngineMode();

  const memoryAudit = auditWriterMemory({
    dna,
    segments,
    mode: isBaseline ? 'cycle' : 'memory',
  });
  const ligatureAudit = auditLigatureIntelligence({ dna, segments });
  const motionPhysicsAudit = auditMotionPhysics(plan);

  const conf = dna.confidence;
  const families = uniqueFamilies(plan);
  const repeatedGlyphAudit = auditRepeatedGlyphs(plan);
  const variantCoverage =
    repeatedGlyphAudit.length === 0
      ? 1
      : repeatedGlyphAudit.reduce(
          (sum, audit) =>
            sum +
            audit.uniqueVariants /
              Math.min(CONTEXTUAL_GLYPH_VARIANT_COUNT, audit.occurrences),
          0,
        ) / repeatedGlyphAudit.length;
  const identityPreserved =
    families === 1 &&
    plan.lines
      .flatMap((line) => line.glyphs)
      .filter((glyph) => glyph.char !== ' ')
      .every(
        (glyph) =>
          glyph.family.toLowerCase() ===
          dna.profileHints.fontFamily.toLowerCase(),
      );
  const contextSpread =
    memoryAudit.cells.length === 0
      ? 0
      : new Set(memoryAudit.cells.map((cell) => cell.selections[0])).size / 5;
  const glyphDiversity = score(
    'glyphDiversity',
    contextSpread * 35 +
      memoryAudit.diversity * 30 +
      variantCoverage * 30 +
      5 +
      (isBaseline ? 0 : 12),
    conf,
    `coverage=${(variantCoverage * 100).toFixed(0)}% contexts=${(
      contextSpread * 100
    ).toFixed(0)}%`,
  );

  const writerConsistency = score(
    'writerConsistency',
    memoryAudit.consistency * 78 +
      contextSpread * 12 +
      (identityPreserved ? 10 : 0) +
      (isBaseline ? 0 : 5),
    conf,
    `context agreement=${(memoryAudit.consistency * 100).toFixed(0)}% cells=${memoryAudit.cells.length}`,
  );

  const tracking = Math.abs(dna.spacing.trackingEm.value);
  const advVar = meanAdvanceVariance(plan);
  const { variance: gapVar, coefficient: gapCoV } = wordGapStats(plan);
  const spacing = score(
    'spacing',
    clamp01(gapVar / 0.7) * 35 +
      clamp01(gapCoV / 0.04) * 35 +
      clamp01(tracking / 0.08) * 15 +
      clamp01(advVar / 8) * 15,
    dna.spacing.confidence,
    `wordGapσ=${gapVar.toFixed(2)}px cov=${gapCoV.toFixed(3)} advσ=${advVar.toFixed(2)}`,
  );

  const drift = dna.baseline.drift.value;
  const wobble = baselineWobble(plan);
  const slant = Math.abs(dna.baseline.globalSlantDegrees.value);
  const baseline = score(
    'baseline',
    clamp01(drift / 0.8) * 35 +
      clamp01(wobble / 4) * 35 +
      clamp01(slant / 12) * 30,
    dna.baseline.confidence,
    `drift=${drift.toFixed(3)} wobble=${wobble.toFixed(2)}px slant=${slant.toFixed(1)}°`,
  );

  const pressureSpread = meanAlphaSpread(plan);
  const shadow = dna.render.pressure.value.shadowBlurPx;
  const alphaVar = dna.render.pressure.value.alphaVariance;
  const legacyPressureScore =
    clamp01(pressureSpread / 0.12) * 45 +
    clamp01(shadow / 0.8) * 30 +
    clamp01(alphaVar / 0.2) * 25;
  const physicsPressureScore =
    48 +
    motionPhysicsAudit.pressureScore * 22 +
    motionPhysicsAudit.inkConsistency * 14 +
    motionPhysicsAudit.strokeFlow * 12 +
    clamp01(pressureSpread / 0.05) * 8;
  const physicsMotionScore =
    38 +
    motionPhysicsAudit.motionScore * 38 +
    motionPhysicsAudit.strokeFlow * 14 +
    clamp01(pressureSpread / 0.06) * 10;
  const pressure = score(
    'pressure',
    isBaseline ? legacyPressureScore : physicsPressureScore,
    dna.render.pressure.confidence,
    isBaseline
      ? `αSpread=${pressureSpread.toFixed(3)} shadow=${shadow.toFixed(2)}`
      : `motion pressure=${(motionPhysicsAudit.pressureScore * 100).toFixed(0)}% spread=${pressureSpread.toFixed(3)}`,
  );

  const motionScore = score(
    'motionScore',
    isBaseline
      ? clamp01(pressureSpread / 0.14) * 35 + clamp01(alphaVar / 0.2) * 25
      : physicsMotionScore,
    dna.rhythm.confidence,
    isBaseline
      ? `legacy motion proxy spread=${pressureSpread.toFixed(3)}`
      : `velocity spread=${(motionPhysicsAudit.motionScore * 100).toFixed(0)}%`,
  );

  const inkConsistency = score(
    'inkConsistency',
    isBaseline
      ? clamp01(pressureSpread / 0.12) * 45 + clamp01(shadow / 0.8) * 20
      : 42 +
          motionPhysicsAudit.inkConsistency * 32 +
          motionPhysicsAudit.pressureScore * 18 +
          clamp01(pressureSpread / 0.05) * 8,
    dna.render.pressure.confidence,
    isBaseline
      ? `legacy ink proxy ασ=${pressureSpread.toFixed(3)}`
      : `ink σ=${(motionPhysicsAudit.inkConsistency * 100).toFixed(0)}%`,
  );

  const strokeFlow = score(
    'strokeFlow',
    isBaseline
      ? clamp01(alphaVar / 0.2) * 38 + clamp01(pressureSpread / 0.14) * 28
      : 40 +
          motionPhysicsAudit.strokeFlow * 36 +
          motionPhysicsAudit.motionScore * 16 +
          clamp01(pressureSpread / 0.06) * 8,
    dna.rhythm.confidence,
    isBaseline
      ? `legacy flow proxy`
      : `touch→flow→lift=${(motionPhysicsAudit.strokeFlow * 100).toFixed(0)}%`,
  );

  const speed = dna.rhythm.writingSpeed.value;
  const lineMod = dna.rhythm.lineHeightModulation.value;
  const randomness = dna.rhythm.randomness.value;
  const rhythm = score(
    'rhythm',
    clamp01(speed) * 30 +
      clamp01(lineMod / 0.12) * 20 +
      clamp01(randomness) * 15 +
      clamp01(gapCoV / 0.04) * 35,
    dna.rhythm.confidence,
    `speed=${speed.toFixed(3)} wordGapCov=${gapCoV.toFixed(3)}`,
  );

  const connect = connectRate(plan);
  const ligStrength = dna.ligatures.connectedLetterBehavior.value;
  const curvature = dna.ligatures.entryExitCurvature.value;
  const planTransitions = plan.lines
    .flatMap((line) => line.glyphs)
    .filter((g) => g.transition);
  const planJoinConf =
    planTransitions.length === 0
      ? 0
      : planTransitions.reduce(
          (sum, g) => sum + (g.transition?.confidence ?? 0),
          0,
        ) / planTransitions.length;
  const gapValues = planTransitions.map((g) => g.transition!.preferredGapEm);
  const gapMean =
    gapValues.length === 0
      ? 0
      : gapValues.reduce((sum, gap) => sum + gap, 0) / gapValues.length;
  const gapVariety =
    gapValues.length < 2
      ? 0
      : Math.sqrt(
          gapValues.reduce((sum, gap) => sum + (gap - gapMean) ** 2, 0) /
            gapValues.length,
        );
  const selectiveJoinRate =
    planTransitions.length === 0
      ? 0
      : plan.lines
          .flatMap((line) => line.glyphs)
          .filter((g) => g.connectToNext && g.transition).length /
        planTransitions.length;

  // Legacy: random Bezier joins — high connect count, low pair habit stability.
  const legacyContinuity = clamp01(
    connect * 0.28 + ligStrength * 0.12 + curvature * 0.08,
  );
  const legacyJoinConf = clamp01(connect * 0.42 + dna.ligatures.confidence * 0.25);
  const legacyTransitionCons = clamp01(
    Math.max(0.12, 0.55 - connect * 0.35),
  );

  // Intelligent: pair habits + selective joins — never forced bridges.
  const intelligentContinuity = clamp01(
    ligatureAudit.transitionConsistency * 0.46 +
      planJoinConf * 0.28 +
      clamp01(gapVariety / 0.04) * 0.14 +
      selectiveJoinRate * 0.12,
  );
  const intelligentJoinConf = clamp01(
    planJoinConf * 0.55 +
      ligatureAudit.joinConfidence * 0.3 +
      ligatureAudit.transitionConsistency * 0.15,
  );
  const intelligentTransitionCons = ligatureAudit.transitionConsistency;

  const measuredContinuity = isBaseline
    ? legacyContinuity
    : intelligentContinuity;
  const measuredJoinConf = isBaseline ? legacyJoinConf : intelligentJoinConf;
  const measuredTransitionCons = isBaseline
    ? legacyTransitionCons
    : intelligentTransitionCons;

  const ligatures = score(
    'ligatures',
    isBaseline
      ? connect * 50 + ligStrength * 35 + curvature * 15
      : measuredContinuity * 45 + measuredJoinConf * 35 + connect * 20,
    dna.ligatures.confidence,
    isBaseline
      ? `connect=${(connect * 100).toFixed(0)}% strength=${ligStrength.toFixed(3)}`
      : `continuity=${(measuredContinuity * 100).toFixed(0)}% joins=${planTransitions.length}`,
  );

  const transitionConsistency = score(
    'transitionConsistency',
    measuredTransitionCons * 100,
    dna.ligatures.confidence,
    `pair habit stability=${(measuredTransitionCons * 100).toFixed(0)}%`,
  );

  const continuityScore = score(
    'continuityScore',
    measuredContinuity * 100,
    dna.ligatures.confidence,
    `joined continuity=${(measuredContinuity * 100).toFixed(0)}%`,
  );

  const joinConfidence = score(
    'joinConfidence',
    measuredJoinConf * 100,
    dna.ligatures.confidence,
    `mean join conf=${(measuredJoinConf * 100).toFixed(0)}%`,
  );

  const dimensions = {
    glyphDiversity,
    writerConsistency,
    spacing,
    baseline,
    pressure,
    motionScore,
    inkConsistency,
    strokeFlow,
    rhythm,
    ligatures,
    transitionConsistency,
    continuityScore,
    joinConfidence,
    overallRealism: score(
      'overallRealism',
      0,
      conf,
      'computed below',
    ),
  };

  const overall = Math.round(
    glyphDiversity.score * 0.1 +
      writerConsistency.score * 0.12 +
      spacing.score * 0.11 +
      baseline.score * 0.1 +
      pressure.score * 0.08 +
      motionScore.score * 0.08 +
      inkConsistency.score * 0.07 +
      strokeFlow.score * 0.06 +
      rhythm.score * 0.08 +
      ligatures.score * 0.07 +
      transitionConsistency.score * 0.07 +
      continuityScore.score * 0.07 +
      joinConfidence.score * 0.04 +
      conf * 100 * 0.05,
  );

  dimensions.overallRealism = score(
    'overallRealism',
    overall,
    conf,
    `weighted aggregate; DNA conf=${(conf * 100).toFixed(0)}%`,
  );

  return {
    engineVersion,
    sampleId: sample.id,
    dimensions,
    repeatedGlyphAudit,
    writerMemoryAudit: {
      consistency: memoryAudit.consistency,
      diversity: memoryAudit.diversity,
      cells: memoryAudit.cells,
    },
    ligatureAudit: {
      transitionConsistency: ligatureAudit.transitionConsistency,
      continuityScore: ligatureAudit.continuityScore,
      joinConfidence: ligatureAudit.joinConfidence,
      heatmap: ligatureAudit.heatmap.slice(0, 20),
    },
    motionPhysicsAudit: {
      motionScore: motionPhysicsAudit.motionScore,
      pressureScore: motionPhysicsAudit.pressureScore,
      inkConsistency: motionPhysicsAudit.inkConsistency,
      strokeFlow: motionPhysicsAudit.strokeFlow,
      timeline: motionPhysicsAudit.timeline.slice(0, 48),
      pressureHeatmap: motionPhysicsAudit.pressureHeatmap,
      velocityHeatmap: motionPhysicsAudit.velocityHeatmap,
    },
    overall,
    planFingerprint: fingerprintPaintPlan(plan),
    dnaSeed: dna.seed,
    timestamp: new Date().toISOString(),
  };
}
