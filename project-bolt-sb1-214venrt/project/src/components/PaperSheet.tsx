import { useMemo } from 'react';
import A4Page from './A4Page';
import MockPaymentToggle from './MockPaymentToggle';
import { paginateText } from '../pagination';
import type { InkColor, FontStyle, PaperType } from '../constants';
import type { MatchedStyleOverrides } from '../pageGeometry';
import type { CheckoutQuote } from '../billing';

type PaperSheetProps = {
  text: string;
  inkColor: InkColor;
  paperType: PaperType;
  fontStyle: FontStyle;
  isPaid: boolean;
  onTogglePayment: () => void;
  matchedStyle?: MatchedStyleOverrides | null;
  checkoutQuote: CheckoutQuote;
};

/**
 * Preview surface — paginated A4 pages with native fillText handwriting
 * from the 12-family / 5-bucket typography registry.
 */
export default function PaperSheet({
  text,
  inkColor,
  paperType,
  fontStyle,
  isPaid,
  onTogglePayment,
  matchedStyle = null,
  checkoutQuote,
}: PaperSheetProps) {
  const pages = useMemo(
    () => paginateText(text, fontStyle),
    [text, fontStyle],
  );

  const hasContent = text.trim().length > 0;

  return (
    <main className="h-full w-full overflow-auto bg-gray-200/80">
      <div className="flex min-h-full flex-col items-center gap-6 p-6 sm:p-8">
        <MockPaymentToggle
          isPaid={isPaid}
          onToggle={onTogglePayment}
          checkoutQuote={checkoutQuote}
        />

        {matchedStyle && !isPaid && (
          <p className="w-full max-w-[794px] text-center text-xs text-amber-800/90">
            Matched style preview active — {checkoutQuote.ctaLabel}
          </p>
        )}

        {pages.map((page) => (
          <A4Page
            key={`${page.pageNumber}-${paperType.id}`}
            segments={page.segments}
            pageNumber={page.pageNumber}
            inkColor={inkColor}
            paperType={paperType}
            fontStyle={fontStyle}
            isPaid={isPaid}
            matchedStyle={matchedStyle}
          />
        ))}

        {!hasContent && (
          <div
            className="flex items-center justify-center text-slate-400"
            style={{ minHeight: '400px' }}
          >
            <p className="text-sm">
              Start typing in the panel on the left to see your handwriting appear here.
            </p>
          </div>
        )}

        <div className="pb-4 text-xs font-medium text-slate-500">
          {pages.length} page{pages.length !== 1 ? 's' : ''}
        </div>
      </div>
    </main>
  );
}
