import { useMemo } from 'react';
import A4Page from './A4Page';
import { paginateText } from '../pagination';
import type { InkColor, FontStyle } from '../constants';

type PaperSheetProps = {
  text: string;
  inkColor: InkColor;
  fontStyle: FontStyle;
};

export default function PaperSheet({ text, inkColor, fontStyle }: PaperSheetProps) {
  // Recompute pages whenever text, font, or ink changes — runs entirely client-side
  const pages = useMemo(
    () => paginateText(text, fontStyle),
    [text, fontStyle],
  );

  return (
    <main className="h-full w-full overflow-y-auto bg-gray-200/80">
      <div className="flex min-h-full flex-col items-center gap-6 p-6 sm:p-8">
        {pages.map((page) => (
          <A4Page
            key={page.pageNumber}
            segments={page.segments}
            pageNumber={page.pageNumber}
            inkColor={inkColor}
            fontStyle={fontStyle}
          />
        ))}

        {/* Empty-state hint */}
        {pages.length === 1 && pages[0].segments.length === 0 && (
          <div
            className="flex items-center justify-center text-slate-400"
            style={{ minHeight: '400px' }}
          >
            <p className="text-sm">
              Start typing in the panel on the left to see your handwriting appear here.
            </p>
          </div>
        )}

        {/* Page count footer */}
        <div className="pb-4 text-xs font-medium text-slate-500">
          {pages.length} page{pages.length !== 1 ? 's' : ''}
        </div>
      </div>
    </main>
  );
}
