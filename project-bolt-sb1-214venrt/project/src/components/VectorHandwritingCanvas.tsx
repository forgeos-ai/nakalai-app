import { useEffect, useMemo, useRef, useState } from 'react';
import type { PageSegment } from '../pagination';
import type { FontStyle } from '../constants';
import type { StrokeLayoutMetrics } from '../utils/strokeLayout';
import {
  TEXT_AREA_WIDTH_PX,
  DEFAULT_FONT_SIZE_PX,
  type MatchedStyleOverrides,
} from '../pageGeometry';
import {
  resolveHandwritingProfile,
  getHandwritingProfileRevision,
  renderHandwritingToCanvas,
  acquireRenderToken,
  isRenderTokenLive,
} from '../handwriting';

type VectorHandwritingCanvasProps = {
  segments: PageSegment[];
  inkHex: string;
  fontStyle: FontStyle;
  /** Analysis hint — remapped into the HandwritingProfile font family. */
  matchedFontFamily: string;
  fontSizePx?: number;
  layout: StrokeLayoutMetrics;
  widthPx?: number;
  heightPx: number;
  paintRevision?: number;
  /** Optional Match My Style overrides — folded into HandwritingProfile. */
  matchedStyle?: MatchedStyleOverrides | null;
  /** Size canvas to parent box (mobile fluid A4 text area). */
  fillContainer?: boolean;
  /** Stable page salt so multi-page paints stay deterministic per page. */
  pageNumber?: number;
};

/**
 * React shell around CanvasRenderer.
 * Style input is resolved to a HandwritingProfile — never character patches.
 */
export default function VectorHandwritingCanvas({
  segments,
  inkHex,
  fontStyle,
  matchedFontFamily,
  fontSizePx = DEFAULT_FONT_SIZE_PX,
  layout,
  widthPx = TEXT_AREA_WIDTH_PX,
  heightPx,
  paintRevision = 0,
  matchedStyle = null,
  fillContainer = false,
  pageNumber = 1,
}: VectorHandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{
    w: number;
    h: number;
  } | null>(null);

  useEffect(() => {
    if (!fillContainer || !shellRef.current) return;
    const node = shellRef.current;
    const sync = (width: number, height: number) => {
      if (width > 0 && height > 0) {
        setContainerSize({ w: Math.round(width), h: Math.round(height) });
      }
    };
    sync(node.clientWidth, node.clientHeight);
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) sync(box.width, box.height);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [fillContainer]);

  const designWidth = widthPx;
  const designHeight = heightPx;
  const renderWidth =
    fillContainer && containerSize ? containerSize.w : designWidth;
  const renderHeight =
    fillContainer && containerSize ? containerSize.h : designHeight;
  const layoutScale =
    fillContainer && containerSize ? containerSize.w / designWidth : 1;

  const profileRevision = getHandwritingProfileRevision();
  const profile = useMemo(
    () =>
      resolveHandwritingProfile({
        matchedStyle,
        inkHex,
        fontClass: matchedStyle?.fontClass ?? fontStyle.id,
        fontFamily:
          matchedFontFamily ||
          fontStyle.fontFamily.replace(/['"]/g, ''),
        slantDegrees: layout.slantDegrees,
        trackingEm: layout.trackingEm || fontStyle.layout.trackingEm,
        lineSpacingScale:
          layout.lineHeightScale || fontStyle.layout.lineSpaceScale,
        strokeWeight: layout.strokeWeight,
        fontSizePx: fontSizePx || DEFAULT_FONT_SIZE_PX,
        paintRevision: paintRevision + profileRevision,
      }),
    [
      matchedStyle,
      matchedStyle?.inkHex,
      matchedStyle?.slantDegrees,
      matchedStyle?.noiseIntensity,
      matchedStyle?.fontClass,
      inkHex,
      fontStyle.id,
      fontStyle.fontFamily,
      fontStyle.layout.trackingEm,
      fontStyle.layout.lineSpaceScale,
      matchedFontFamily,
      layout.slantDegrees,
      layout.trackingEm,
      layout.lineHeightScale,
      layout.strokeWeight,
      fontSizePx,
      paintRevision,
      profileRevision,
    ],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const token = acquireRenderToken();
    let cancelled = false;

    void (async () => {
      try {
        if (cancelled || !isRenderTokenLive(token)) return;
        await renderHandwritingToCanvas({
          canvas,
          segments,
          profile,
          widthPx: renderWidth,
          heightPx: renderHeight,
          fillContainer,
          layoutScale,
          pageSalt: pageNumber * 997,
          renderToken: token,
        });
      } catch (err) {
        if (!cancelled && isRenderTokenLive(token)) {
          console.warn('[NakalAI] CanvasRenderer paint failed:', err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    segments,
    profile.seed,
    profile.revision,
    profile.inkHex,
    profile.slantDegrees,
    profile.avgCharHeightPx,
    profile.source,
    profile.confidence,
    profile.matchStrength,
    profile.fontFamily,
    profile.randomness,
    profile.baselineDrift,
    profile.charHeightVariation,
    profile.charWidthVariation,
    profile.wordSpacingEm,
    profile.lineSpacingScale,
    profile.strokeWidthPx,
    profile.strokeOpacityVariation,
    profile.strokeRoughness,
    profile.entryExitCurvature,
    profile.rotationVarianceDeg,
    profile.marginBias,
    profile.marginIrregularityEm,
    profile.trackingEm,
    profile.writingSpeed,
    profile.connectedLetterBehavior,
    profile.ascenderScale,
    profile.descenderScale,
    profile.isCursive,
    renderWidth,
    renderHeight,
    layoutScale,
    fillContainer,
    paintRevision,
    profileRevision,
    pageNumber,
  ]);

  const canvasEl = (
    <canvas
      ref={canvasRef}
      className={
        fillContainer
          ? 'block h-full w-full max-w-full object-contain'
          : 'absolute left-0 top-0 block'
      }
      style={
        fillContainer
          ? {
              textTransform: 'none',
              fontVariant: 'normal',
              fontFamily: `"${profile.fontFamily}"`,
            }
          : {
              width: renderWidth,
              height: renderHeight,
              textTransform: 'none',
              fontVariant: 'normal',
              fontFamily: `"${profile.fontFamily}"`,
            }
      }
      aria-hidden
      data-matched-font={profile.fontFamily}
      data-handwriting-surface="true"
      data-paint-revision={paintRevision}
      data-profile-seed={profile.seed}
      data-profile-revision={profile.revision}
    />
  );

  if (fillContainer) {
    return (
      <div
        ref={shellRef}
        className="absolute inset-0 h-full w-full max-w-full overflow-hidden"
      >
        {canvasEl}
      </div>
    );
  }

  return canvasEl;
}
