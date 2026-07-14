import { IndianRupee } from 'lucide-react';
import type { CheckoutQuote } from '../billing';

type MockPaymentToggleProps = {
  isPaid: boolean;
  onToggle: () => void;
  checkoutQuote: CheckoutQuote;
  /** sticky = desktop canvas header; inline = mobile feed block (scrolls away). */
  layout?: 'sticky' | 'inline';
};

/**
 * Canvas-side mock UPI payment control with dynamic tier pricing.
 * "Paid" drops the preview watermark and unlocks clean high-res PDF export.
 */
export default function MockPaymentToggle({
  isPaid,
  onToggle,
  checkoutQuote,
  layout = 'sticky',
}: MockPaymentToggleProps) {
  const shellClass =
    layout === 'inline'
      ? 'mb-4 flex w-full items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm'
      : 'sticky top-0 z-30 mb-2 flex w-full max-w-[794px] items-center justify-between gap-3 rounded-xl border border-slate-300/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur';

  return (
    <div data-pdf-ignore="true" className={shellClass}>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {checkoutQuote.tier_type === 'premium'
            ? 'Premium checkout · Match My Style'
            : 'Standard checkout · Platform fonts'}
        </p>
        <p className="truncate text-sm text-slate-700">
          {isPaid
            ? checkoutQuote.paidLabel
            : `₹${checkoutQuote.amountInr} · ${checkoutQuote.tier_type} tier`}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-slate-500">
          Each payment unlocks 1 specific assignment download. Modifying the text
          will require a new download pass.
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isPaid}
        className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isPaid
            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500 focus:ring-emerald-500'
            : 'bg-slate-900 text-white shadow-md shadow-slate-900/20 hover:bg-slate-800 focus:ring-slate-500'
        }`}
      >
        <IndianRupee className="h-4 w-4" />
        {isPaid ? 'Paid' : `Pay ₹${checkoutQuote.amountInr}`}
      </button>
    </div>
  );
}
