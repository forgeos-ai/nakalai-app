/**
 * Build deterministic per-page paint plans from DNA.
 * No Math.random — every value is seeded.
 */

import type { PageSegment } from '../../../src/pagination';
import {
  LINE_SPACING_PX,
  BASELINE_NUDGE_PX,
} from '../../../src/pageGeometry';
import { createSeededRng, mixSeed, clamp } from '../types';
import type { HandwritingDNA } from '../dna/types';
import {
  resolveSentencePosition,
  resolveWordPosition,
  selectContextualGlyphVariant,
} from '../glyphs/contextual';
import {
  buildParagraphRhythmPlans,
  computeFixedWordGapEm,
  computeRhythmWordGapEm,
  resolveLineSentencePosition,
  type WordSpacingMode,
} from '../rhythm/wordSpacing';
import { analyzeAdjacentPairOrNull } from '../ligatures/analyzer';
import {
  continuityAdvanceDeltaPx,
  continuityRotationNudge,
} from '../ligatures/continuity';
import {
  joinConfidenceThreshold,
  shouldJoinTransition,
} from '../ligatures/confidence';
import { getLigatureEngineMode } from '../ligatures/session';
import {
  computeGlyphPhysics,
  getPressureEngineMode,
  legacyGlyphInkScalars,
} from '../pressure';
import type {
  GlyphPaintInstruction,
  LinePaintInstruction,
  PagePaintPlan,
} from './types';

function isLetter(char: string | undefined): boolean {
  return Boolean(char && /^[A-Za-z]$/.test(char));
}

function isVowel(char: string): boolean {
  return ['a', 'e', 'i', 'o', 'u'].includes(char.toLowerCase());
}

export type BuildPlanArgs = {
  dna: HandwritingDNA;
  segments: PageSegment[];
  widthPx: number;
  glyphSelection?: 'legacy' | 'contextual';
  wordSpacing?: WordSpacingMode;
  layoutScale?: number;
  pageSalt?: number;
  fontSizePx?: number;
};

/**
 * Expand DNA + text segments into a fully deterministic paint plan.
 */
export function buildPagePaintPlan(args: BuildPlanArgs): PagePaintPlan {
  const {
    dna,
    segments,
    widthPx,
    glyphSelection = 'contextual',
    wordSpacing = 'rhythm',
    layoutScale = 1,
    pageSalt = 0,
  } = args;

  const fontSize =
    args.fontSizePx ??
    Math.max(8, dna.profileHints.avgCharHeightPx * layoutScale);
  const trackingEmPx = dna.spacing.trackingEm.value * fontSize;
  const lineHeight =
    LINE_SPACING_PX * dna.spacing.lineSpacingScale.value * layoutScale;
  const families = [...dna.glyphs.faceFamilies.value];
  if (families.length === 0) {
    families.push(dna.profileHints.fontFamily || 'Architects Daughter');
  }

  const rootSeed = mixSeed(dna.seed, pageSalt);
  const rhythmPlans =
    wordSpacing === 'rhythm'
      ? buildParagraphRhythmPlans({ dna, segments, rootSeed, fontSize })
      : null;
  const slantDegrees = dna.baseline.globalSlantDegrees.value;
  const kern = dna.spacing.kerning.value;
  const pressure = dna.render.pressure.value;
  const connectStrength = dna.ligatures.connectedLetterBehavior.value;
  const curvature = dna.ligatures.entryExitCurvature.value;
  const drift = dna.baseline.drift.value;
  const rotVar = dna.baseline.rotationVarianceDeg.value;
  const randomness = dna.rhythm.randomness.value;
  const marginIrr = dna.spacing.marginIrregularityEm.value;
  const marginBias = dna.spacing.marginBias.value;
  const lineMod = dna.rhythm.lineHeightModulation.value;
  const pagePhase = dna.rhythm.pageRhythmPhase.value;
  const matchStrength = Math.max(
    0.55,
    Math.min(1.5, dna.profileHints.matchStrength),
  );
  // Standard-equivalent restraint unused for matched DNA; keep path deterministic.
  const strength = dna.source === 'standard' ? 0.12 : matchStrength;

  const lines: LinePaintInstruction[] = [];
  const totalGlyphs = segments.reduce(
    (count, segment) =>
      count +
      (segment.type === 'break'
        ? 0
        : segment.words.reduce((sum, word) => sum + word.chars.length, 0)),
    0,
  );
  const occurrences = new Map<string, number>();
  let row = 0;
  let globalIndex = 0;
  let previousChar: string | undefined;
  let previousVelocity = 0;

  for (const segment of segments) {
    const lineRng = createSeededRng(mixSeed(rootSeed, 0x1a1e ^ (row + 1)));
    const centered = (lineRng() + lineRng()) * 0.5 - 0.5;
    const marginOffsetPx = centered * 2 * marginIrr * fontSize * strength;
    const heightScale = 1 + (lineRng() - 0.5) * lineMod * strength;
    const baselinePhase = lineRng() * Math.PI * 2;

    const baselineY = row * lineHeight + lineHeight - BASELINE_NUDGE_PX;

    if (segment.type === 'break') {
      lines.push({
        row,
        baselineY,
        marginOffsetPx,
        heightScale,
        glyphs: [],
      });
      row += 1;
      continue;
    }

    let x = marginOffsetPx + (marginBias - 1) * fontSize * 1.4;
    const glyphs: GlyphPaintInstruction[] = [];

    for (let wi = 0; wi < segment.words.length; wi++) {
      const word = segment.words[wi]!;
      for (let ci = 0; ci < word.chars.length; ci++) {
        const rc = word.chars[ci]!;
        const char = rc.char;
        const charCode = char.charCodeAt(0) || 32;
        const glyphIndex = rc.globalIndex ?? globalIndex;
        globalIndex += 1;

        let nextChar: string | undefined = word.chars[ci + 1]?.char;
        if (nextChar == null && segment.words[wi + 1]?.chars[0]) {
          nextChar = segment.words[wi + 1]!.chars[0]!.char;
        }

        const glyphSeed = mixSeed(
          rootSeed,
          mixSeed(glyphIndex + 1, charCode + 1),
        );
        const rng = createSeededRng(glyphSeed);
        const r1 = rng();
        const r2 = rng();
        const r3 = rng();
        const r5 = rng();
        const r6 = rng();

        const occurrenceKey = char.toLowerCase();
        const occurrence = occurrences.get(occurrenceKey) ?? 0;
        occurrences.set(occurrenceKey, occurrence + 1);
        const contextualVariant = selectContextualGlyphVariant(dna.seed, {
          char,
          previousChar,
          nextChar,
          wordPosition: resolveWordPosition(ci, word.chars.length),
          sentencePosition: resolveSentencePosition(glyphIndex, totalGlyphs),
          occurrence,
          glyphIndex,
        });
        const faceIndex = Math.floor(r6 * families.length) % families.length;
        const family =
          glyphSelection === 'legacy'
            ? families[faceIndex]!
            : dna.profileHints.fontFamily || families[0]!;

        let contextualKerning = 0;
        if (char !== ' ' && nextChar && nextChar !== ' ') {
          if (char.toLowerCase() === nextChar.toLowerCase()) {
            contextualKerning = kern.doubleLetter;
          } else if (isVowel(char)) {
            contextualKerning = kern.afterVowel;
          } else {
            contextualKerning = kern.default;
          }
        }

        // Approximate measure via aspect + density (fonts loaded at paint time).
        // Plan advance uses a provisional width; paint loop remeasures and
        // scales instructions — buildPlan returns provisional advances that
        // the paint layer may refine with measureText.
        const provisionalWidth = fontSize * (0.42 + dna.glyphs.meanAspect.value * 0.22);
        const baseWidth = char === ' ' ? fontSize * 0.33 : provisionalWidth;

        const localSlantOffset =
          ((r1 + r6) * 0.5 - 0.5) * 2 * rotVar * strength * 0.35;
        const verticalDrift =
          (r3 - 0.5) * drift * (dna.profileHints.isCursive ? 1.7 : 1.05) * 2.5 * strength;
        const slowBaseline =
          Math.sin(glyphIndex * 0.34 + baselinePhase + pagePhase) *
          drift *
          fontSize *
          0.045 *
          strength;

        let advance =
          baseWidth +
          trackingEmPx +
          contextualKerning +
          (r2 - 0.5) *
            (dna.profileHints.isCursive ? 1.35 : 0.9) *
            randomness *
            strength *
            2;

        if (char === ' ') {
          const isWordGap = ci === word.chars.length - 1 || word.chars[ci + 1] === undefined;
          if (isWordGap) {
            const rhythmPlan = rhythmPlans?.get(row);
            if (wordSpacing === 'rhythm' && rhythmPlan) {
              const prevWidth = rhythmPlan.wordWidthsEm[wi - 1] ?? rhythmPlan.wordWidthsEm[wi] ?? 0.4;
              const nextWidth = rhythmPlan.wordWidthsEm[wi + 1] ?? rhythmPlan.wordWidthsEm[wi] ?? 0.4;
              advance +=
                fontSize *
                computeRhythmWordGapEm({
                  dna,
                  rootSeed,
                  row,
                  paragraphRow: rhythmPlan.paragraphRow,
                  totalParagraphRows: segments.filter((s) => s.type === 'line').length,
                  wordIndex: wi,
                  lineWordCount: rhythmPlan.wordCount,
                  sentencePosition: resolveLineSentencePosition(wi, rhythmPlan.wordCount),
                  trailingPunctuation: rhythmPlan.trailingPunctuation[wi],
                  previousWordWidthEm: prevWidth,
                  nextWordWidthEm: nextWidth,
                  fontSize,
                  strength,
                  randomness,
                  isCursive: dna.profileHints.isCursive,
                  lineRhythmMultiplier: rhythmPlan.curve[wi] ?? 1,
                });
            } else {
              advance +=
                fontSize *
                computeFixedWordGapEm({
                  dna,
                  rootSeed,
                  wordIndex: wi,
                  fontSize,
                  strength,
                  randomness,
                  isCursive: dna.profileHints.isCursive,
                });
            }
          }
        }

        if (!Number.isFinite(advance) || advance <= 0) {
          advance = baseWidth + Math.max(0, trackingEmPx);
        }

        const ligatureMode = getLigatureEngineMode();
        let shouldConnect = false;
        let connector: GlyphPaintInstruction['connector'];
        let transitionPayload: GlyphPaintInstruction['transition'];
        let rotationRad = ((slantDegrees + localSlantOffset) * Math.PI) / 180;

        if (ligatureMode === 'intelligent') {
          const transition = analyzeAdjacentPairOrNull({
            dna,
            left: char,
            right: nextChar,
            glyphIndex,
            leftVariantId: contextualVariant.id,
          });
          if (transition) {
            const threshold = joinConfidenceThreshold(dna);
            shouldConnect = shouldJoinTransition({
              confidence: transition.confidence,
              joinStrength: transition.joinStrength,
              threshold,
              isCursive: dna.profileHints.isCursive,
            });
            // Continuity via gap/overlap only — never invent Bezier bridges.
            if (char !== ' ' && nextChar && isLetter(char) && isLetter(nextChar)) {
              advance += continuityAdvanceDeltaPx({
                transition,
                fontSize,
                joined: shouldConnect,
              });
              rotationRad += continuityRotationNudge(transition);
            }
            transitionPayload = {
              pair: transition.pair,
              joinStrength: transition.joinStrength,
              preferredGapEm: transition.preferredGapEm,
              exitDirection: transition.exitDirection,
              entryDirection: transition.entryDirection,
              overlapAmount: transition.overlapAmount,
              confidence: transition.confidence,
            };
          }
        } else {
          const connectRng = createSeededRng(
            mixSeed(
              rootSeed,
              mixSeed(glyphIndex + 0xc011, charCode ^ (nextChar?.charCodeAt(0) ?? 0)),
            ),
          );
          shouldConnect =
            dna.profileHints.isCursive &&
            connectStrength > 0 &&
            char !== ' ' &&
            isLetter(char) &&
            isLetter(nextChar) &&
            connectRng() <
              Math.min(
                0.98,
                connectStrength *
                  (0.72 + dna.rhythm.writingSpeed.value * 0.28) *
                  strength,
              );
        }

        const rhythmPlan = rhythmPlans?.get(row);
        const pressureMode = getPressureEngineMode();
        let alpha = 0.9;
        let shadowBlur = pressure.shadowBlurPx;
        let motionPayload: GlyphPaintInstruction['motion'];
        let pressurePayload: GlyphPaintInstruction['pressure'];
        let inkPayload: GlyphPaintInstruction['ink'];
        let strokePayload: GlyphPaintInstruction['stroke'];

        if (pressureMode === 'physics') {
          const physics = computeGlyphPhysics(
            {
              dnaSeed: dna.seed,
              rootSeed,
              glyphIndex,
              totalGlyphs,
              row,
              paragraphRow: rhythmPlan?.paragraphRow ?? row,
              wordIndex: wi,
              charIndexInWord: ci,
              wordLength: word.chars.length,
              char,
              previousChar,
              nextChar,
              advancePx: advance,
              fontSizePx: fontSize,
              strength,
              writingSpeed: dna.rhythm.writingSpeed.value,
              isCursive: dna.profileHints.isCursive,
              variantId: contextualVariant.id,
              transitionJoinStrength: transitionPayload?.joinStrength,
              transitionConfidence: transitionPayload?.confidence,
              connectToNext: shouldConnect,
            },
            previousVelocity,
            {
              baseAlpha: pressure.baseAlpha,
              alphaVariance: pressure.alphaVariance,
              shadowBlurPx: pressure.shadowBlurPx,
              strokeWidthPx: dna.render.strokeWidthPx.value,
              strength,
            },
          );
          alpha = physics.alpha;
          shadowBlur = physics.shadowBlur;
          motionPayload = physics.motion;
          pressurePayload = physics.pressure;
          inkPayload = physics.ink;
          strokePayload = physics.stroke;
          previousVelocity = physics.nextVelocity;
        } else {
          const legacy = legacyGlyphInkScalars({
            baseAlpha: pressure.baseAlpha,
            alphaVariance: pressure.alphaVariance,
            shadowBlurPx: pressure.shadowBlurPx,
            strength,
            randomness,
            r2,
            r5,
          });
          alpha = legacy.alpha;
          shadowBlur = legacy.shadowBlur;
        }

        if (ligatureMode === 'legacy' && shouldConnect && nextChar) {
          const safeAdvance = Math.max(fontSize * 0.12, advance);
          const startX = x + Math.min(baseWidth * 0.72, safeAdvance * 0.7);
          const endX = x + safeAdvance + fontSize * 0.04;
          const rise = fontSize * 0.075 * curvature * (0.78 + r6 * 0.44);
          connector = {
            startX,
            endX,
            rise,
            alpha: Math.max(0.58, alpha * 0.86),
            lineWidth: Math.max(0.45, dna.render.strokeWidthPx.value * 0.38),
          };
        }

        const glyphInstruction: GlyphPaintInstruction = {
          char,
          family,
          x,
          y: baselineY + verticalDrift + slowBaseline,
          fontSizePx: fontSize * heightScale,
          rotationRad,
          alpha,
          shadowBlur: clamp(shadowBlur, 0.15, 1.2),
          advance,
          connectToNext: shouldConnect,
          connector,
          transition: transitionPayload,
          motion: motionPayload,
          pressure: pressurePayload,
          ink: inkPayload,
          stroke: strokePayload,
        };
        if (glyphSelection === 'contextual') {
          glyphInstruction.variantId = contextualVariant.id;
          glyphInstruction.scaleX = contextualVariant.scaleX;
          glyphInstruction.skewX = contextualVariant.skewX;
        }
        glyphs.push(glyphInstruction);

        x += advance;
        previousChar = char;
        if (x > widthPx + fontSize) break;
      }
    }

    lines.push({
      row,
      baselineY,
      marginOffsetPx,
      heightScale,
      glyphs,
    });
    row += 1;
  }

  return {
    seed: dna.seed,
    pageSalt,
    fontSizePx: fontSize,
    lineHeightPx: lineHeight,
    inkHex: dna.ink.value,
    lines,
    confidence: dna.confidence,
  };
}
