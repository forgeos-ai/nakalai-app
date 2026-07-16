/**
 * Fixed golden input samples — deterministic DNA fixtures.
 */

import { assembleHandwritingDNA, emptySegmentationDNA } from '../index';
import type { GoldenSample, GoldenSampleId } from './types';

function segMeasured(
  lines: number,
  chars: number,
  connectivity: number,
  stroke: number,
) {
  const seg = emptySegmentationDNA('fallback');
  seg.confidence = 0.72;
  seg.lineCount = { value: lines, confidence: 0.8, source: 'measured', support: lines };
  seg.characterCount = {
    value: chars,
    confidence: 0.85,
    source: 'measured',
    support: chars,
  };
  seg.strokeThickness = { value: stroke, confidence: 0.75, source: 'measured' };
  seg.connectivityRatio = {
    value: connectivity,
    confidence: 0.75,
    source: 'measured',
  };
  seg.clusters = [
    {
      signature: 'g1',
      frequency: 8,
      aspect: 0.68,
      inkDensity: 0.42,
      bboxCount: 8,
    },
    {
      signature: 'g2',
      frequency: 5,
      aspect: 0.74,
      inkDensity: 0.38,
      bboxCount: 5,
    },
  ];
  return seg;
}

const SAMPLE_DEFS: Array<{
  id: GoldenSampleId;
  label: string;
  text: string;
  extracted: Parameters<typeof assembleHandwritingDNA>[0]['extracted'];
  segmentation: ReturnType<typeof segMeasured>;
  fingerprint: string;
  widthPx?: number;
  pageSalt?: number;
}> = [
  {
    id: 'cursive-neat-paragraph',
    label: 'Cursive neat — assignment paragraph',
    text: 'The quick brown fox jumps over the lazy dog near the old brick wall.',
    fingerprint: 'golden-cursive-neat',
    extracted: {
      inkHex: '#1e3a8a',
      slantDegrees: 7,
      noiseIntensity: 0.32,
      fontCategory: 'tight-cursive',
      fontClass: 'cursive-neat',
      fontFamily: 'Dancing Script',
      strokeThickness: 3.1,
      connectivityRatio: 0.78,
      confidence: 0.84,
      avgRunsPerRow: 4,
      verticalContinuity: 0.72,
      relativeRunWidth: 0.52,
      inkSampleCount: 520,
      usedFallback: false,
    },
    segmentation: segMeasured(4, 48, 0.78, 3.1),
  },
  {
    id: 'casual-print-notes',
    label: 'Casual print — block notes',
    text: 'Chapter 4 summary: photosynthesis converts light into chemical energy.',
    fingerprint: 'golden-casual-print',
    extracted: {
      inkHex: '#111827',
      slantDegrees: -1.5,
      noiseIntensity: 0.28,
      fontCategory: 'casual-print',
      fontClass: 'casual-print',
      fontFamily: 'Architects Daughter',
      strokeThickness: 2.8,
      connectivityRatio: 0.38,
      confidence: 0.79,
      avgRunsPerRow: 6,
      verticalContinuity: 0.45,
      relativeRunWidth: 0.48,
      inkSampleCount: 480,
      usedFallback: false,
    },
    segmentation: segMeasured(3, 42, 0.38, 2.8),
  },
  {
    id: 'rushed-slanted',
    label: 'Rushed slanted script',
    text: 'Done before class starts — need to submit by 9am tomorrow.',
    fingerprint: 'golden-rushed',
    extracted: {
      inkHex: '#1d4ed8',
      slantDegrees: 11,
      noiseIntensity: 0.48,
      fontCategory: 'slanted-script',
      fontClass: 'rushed-student',
      fontFamily: 'Shadows Into Light',
      strokeThickness: 2.6,
      connectivityRatio: 0.82,
      confidence: 0.76,
      avgRunsPerRow: 3.5,
      verticalContinuity: 0.68,
      relativeRunWidth: 0.44,
      inkSampleCount: 390,
      usedFallback: false,
    },
    segmentation: segMeasured(2, 36, 0.82, 2.6),
  },
  {
    id: 'low-confidence-fallback',
    label: 'Low confidence — generalized fallback',
    text: 'Blurry upload should still produce stable deterministic output.',
    fingerprint: 'golden-fallback',
    extracted: {
      inkHex: '#374151',
      slantDegrees: 3,
      noiseIntensity: 0.55,
      fontCategory: 'loose-scratch',
      fontClass: 'messy-brush',
      fontFamily: 'Caveat',
      strokeThickness: 2.2,
      connectivityRatio: 0.5,
      confidence: 0.12,
      avgRunsPerRow: 3,
      verticalContinuity: 0.4,
      relativeRunWidth: 0.5,
      inkSampleCount: 18,
      usedFallback: true,
    },
    segmentation: emptySegmentationDNA('fallback'),
  },
  {
    id: 'double-letter-kerning',
    label: 'Double-letter kerning stress',
    text: 'Mississippi committee sees deep sleep.',
    fingerprint: 'golden-kerning',
    extracted: {
      inkHex: '#172554',
      slantDegrees: 5.5,
      noiseIntensity: 0.36,
      fontCategory: 'tight-cursive',
      fontClass: 'cursive-loop',
      fontFamily: 'Pacifico',
      strokeThickness: 3.4,
      connectivityRatio: 0.74,
      confidence: 0.81,
      avgRunsPerRow: 4.2,
      verticalContinuity: 0.7,
      relativeRunWidth: 0.5,
      inkSampleCount: 440,
      usedFallback: false,
    },
    segmentation: segMeasured(2, 34, 0.74, 3.4),
  },
];

/** All fixed golden samples with assembled DNA. */
export function getGoldenSamples(): GoldenSample[] {
  return SAMPLE_DEFS.map((def) => ({
    id: def.id,
    label: def.label,
    text: def.text,
    dna: assembleHandwritingDNA({
      extracted: def.extracted,
      segmentation: def.segmentation,
      fingerprint: def.fingerprint,
    }),
    widthPx: def.widthPx ?? 600,
    pageSalt: def.pageSalt ?? 997,
  }));
}

export function getGoldenSample(id: GoldenSampleId): GoldenSample | undefined {
  return getGoldenSamples().find((s) => s.id === id);
}
