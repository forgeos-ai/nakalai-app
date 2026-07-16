/**
 * PaintPlan parity helpers — Golden Lab vs production must share one plan.
 */

import type { GlyphPaintInstruction, PagePaintPlan } from '../renderer/types';

export type PlanGlyphDiff = {
  line: number;
  glyph: number;
  char: string;
  field: string;
  goldenLab: unknown;
  production: unknown;
};

export type PlanParityResult = {
  equal: boolean;
  goldenLabFingerprint: string;
  productionFingerprint: string;
  glyphCount: number;
  diffs: PlanGlyphDiff[];
};

function glyphFields(g: GlyphPaintInstruction): Record<string, unknown> {
  return {
    char: g.char,
    family: g.family,
    variantId: g.variantId ?? null,
    scaleX: g.scaleX ?? null,
    skewX: g.skewX ?? null,
    x: round(g.x, 100),
    y: round(g.y, 100),
    fontSizePx: round(g.fontSizePx, 100),
    rotationRad: round(g.rotationRad, 10000),
    alpha: round(g.alpha, 1000),
    shadowBlur: round(g.shadowBlur, 1000),
    advance: round(g.advance, 100),
    connectToNext: g.connectToNext,
    connector: g.connector
      ? {
          startX: round(g.connector.startX, 100),
          endX: round(g.connector.endX, 100),
          rise: round(g.connector.rise, 100),
          alpha: round(g.connector.alpha, 1000),
          lineWidth: round(g.connector.lineWidth, 1000),
        }
      : null,
    transition: g.transition
      ? {
          pair: g.transition.pair,
          joinStrength: round(g.transition.joinStrength, 1000),
          preferredGapEm: round(g.transition.preferredGapEm, 1000),
          exitDirection: round(g.transition.exitDirection, 1000),
          entryDirection: round(g.transition.entryDirection, 1000),
          overlapAmount: round(g.transition.overlapAmount, 1000),
          confidence: round(g.transition.confidence, 1000),
        }
      : null,
  };
}

function round(value: number, factor: number): number {
  return Math.round(value * factor) / factor;
}

/**
 * Deep-compare two paint plans glyph-by-glyph.
 */
export function comparePaintPlans(
  goldenLab: PagePaintPlan,
  production: PagePaintPlan,
): PlanParityResult {
  const diffs: PlanGlyphDiff[] = [];
  let glyphCount = 0;

  const metaFields: Array<keyof PagePaintPlan> = [
    'seed',
    'pageSalt',
    'fontSizePx',
    'lineHeightPx',
    'inkHex',
  ];
  for (const field of metaFields) {
    if (goldenLab[field] !== production[field]) {
      diffs.push({
        line: -1,
        glyph: -1,
        char: '*',
        field: String(field),
        goldenLab: goldenLab[field],
        production: production[field],
      });
    }
  }

  if (goldenLab.lines.length !== production.lines.length) {
    diffs.push({
      line: -1,
      glyph: -1,
      char: '*',
      field: 'lines.length',
      goldenLab: goldenLab.lines.length,
      production: production.lines.length,
    });
  }

  const lineCount = Math.min(goldenLab.lines.length, production.lines.length);
  for (let li = 0; li < lineCount; li++) {
    const gLine = goldenLab.lines[li]!;
    const pLine = production.lines[li]!;
    const glyphLen = Math.min(gLine.glyphs.length, pLine.glyphs.length);
    if (gLine.glyphs.length !== pLine.glyphs.length) {
      diffs.push({
        line: li,
        glyph: -1,
        char: '*',
        field: 'glyphs.length',
        goldenLab: gLine.glyphs.length,
        production: pLine.glyphs.length,
      });
    }
    for (let gi = 0; gi < glyphLen; gi++) {
      glyphCount += 1;
      const gFields = glyphFields(gLine.glyphs[gi]!);
      const pFields = glyphFields(pLine.glyphs[gi]!);
      for (const [field, gVal] of Object.entries(gFields)) {
        const pVal = pFields[field];
        if (JSON.stringify(gVal) !== JSON.stringify(pVal)) {
          diffs.push({
            line: li,
            glyph: gi,
            char: gLine.glyphs[gi]!.char,
            field,
            goldenLab: gVal,
            production: pVal,
          });
        }
      }
    }
  }

  return {
    equal: diffs.length === 0,
    goldenLabFingerprint: '',
    productionFingerprint: '',
    glyphCount,
    diffs,
  };
}
