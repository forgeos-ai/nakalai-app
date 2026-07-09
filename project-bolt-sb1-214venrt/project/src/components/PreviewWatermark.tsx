import { useEffect, useRef } from 'react';
import { A4_WIDTH_PX, A4_HEIGHT_PX } from '../pageGeometry';

export const PREVIEW_WATERMARK_TEXT = 'NakalAI.in PREVIEW';

/** Attribute used by exportPdf to strip this layer from html2canvas captures. */
export const PDF_IGNORE_ATTR = 'data-pdf-ignore';

/**
 * Full-page canvas watermark for browser preview only.
 * Painted in the React render loop via 2D canvas so it cannot be removed
 * with a single CSS rule; exportPdf ignores [data-pdf-ignore] nodes.
 */
export default function PreviewWatermark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = A4_WIDTH_PX;
    const height = A4_HEIGHT_PX;

    const paint = () => {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((-28 * Math.PI) / 180);
      ctx.translate(-width / 2, -height / 2);

      ctx.font = '600 15px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.11)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const colGap = 220;
      const rowGap = 68;
      const startX = -width;
      const endX = width * 2;
      const startY = -height;
      const endY = height * 2;

      for (let y = startY; y < endY; y += rowGap) {
        const offset = ((y / rowGap) % 2) * (colGap / 2);
        for (let x = startX + offset; x < endX; x += colGap) {
          ctx.fillText(PREVIEW_WATERMARK_TEXT, x, y);
        }
      }

      ctx.restore();
    };

    paint();

    // Re-paint periodically so clearing the canvas in DevTools does not stick
    const intervalId = window.setInterval(paint, 1500);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-pdf-ignore="true"
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20"
      style={{
        width: '100%',
        height: '100%',
        userSelect: 'none',
      }}
    />
  );
}
