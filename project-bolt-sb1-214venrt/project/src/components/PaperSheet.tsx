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
  /** Exact Google Fonts family from Match My Style / active face. */
  matchedFontFamily?: string;
  isPaid: boolean;
  onTogglePayment: () => void;
  matchedStyle?: MatchedStyleOverrides | null;
  checkoutQuote: CheckoutQuote;
  /** Remount / repaint revision when a new photo match lands. */
  paintRevision?: number;
  /** Mobile Preview Page — fluid width pages, no transform scaling. */
  fitMobileViewport?: boolean;
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
  matchedFontFamily,
  isPaid,
  onTogglePayment,
  matchedStyle = null,
  checkoutQuote,
  paintRevision = 0,
  fitMobileViewport = false,
}: PaperSheetProps) {
  const pages = useMemo(
    () => paginateText(text, fontStyle),
    [text, fontStyle],
  );

  const hasContent = text.trim().length > 0;
  const family =
    matchedFontFamily ||
    fontStyle.fontFamily.replace(/["']/g, '').split(',')[0]?.trim() ||
    fontStyle.label;

  if (fitMobileViewport) {
    return (
      <div className="flex w-full max-w-md flex-col items-stretch gap-4">
        <MockPaymentToggle
          isPaid={isPaid}
          onToggle={onTogglePayment}
          checkoutQuote={checkoutQuote}
          layout="inline"
        />

        {matchedStyle && !isPaid && (
          <p className="w-full text-center text-xs text-amber-800/90">
            Matched style preview active — {checkoutQuote.ctaLabel}
          </p>
        )}

        {pages.map((page) => (
          <div
            key={`mobile-shell-${page.pageNumber}-${paperType.id}-${family}-${paintRevision}`}
            className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-sm"
          >
            <A4Page
              segments={page.segments}
              pageNumber={page.pageNumber}
              inkColor={inkColor}
              paperType={paperType}
              fontStyle={fontStyle}
              matchedFontFamily={family}
              isPaid={isPaid}
              matchedStyle={matchedStyle}
              paintRevision={paintRevision}
              fluidWidth
            />
          </div>
        ))}

        {!hasContent && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Switch to Edit Text and start typing to see handwriting here.
          </p>
        )}

        <p className="w-full pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 text-center text-xs font-medium text-slate-600">
          {pages.length} page{pages.length !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }

  return (
    <main className="h-full w-full overflow-auto bg-gray-200/80">
      <div className="flex min-h-full flex-col items-center gap-6 p-4 sm:p-6 md:p-8">
        <MockPaymentToggle
          isPaid={isPaid}
          onToggle={onTogglePayment}
          checkoutQuote={checkoutQuote}
          layout="sticky"
        />

        {matchedStyle && !isPaid && (
          <p className="w-full max-w-[794px] text-center text-xs text-amber-800/90">
            Matched style preview active — {checkoutQuote.ctaLabel}
          </p>
        )}

        {pages.map((page) => (
          <A4Page
            key={`${page.pageNumber}-${paperType.id}-${family}-${paintRevision}`}
            segments={page.segments}
            pageNumber={page.pageNumber}
            inkColor={inkColor}
            paperType={paperType}
            fontStyle={fontStyle}
            matchedFontFamily={family}
            isPaid={isPaid}
            matchedStyle={matchedStyle}
            paintRevision={paintRevision}
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
