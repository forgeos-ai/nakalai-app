'use client';

import {
  pricingTiers,
  formatPerPage,
  isTierSufficient,
  shouldHighlightBulkBundle,
  bulkValueProposition,
  type PricingTier,
} from '../billing';

type PricingTierMatrixProps = {
  layoutPageCount: number;
  selectedTierId: string;
  onSelectTier: (tier: PricingTier) => void;
  /** When Match My Style is active, premium cards are preferred visually. */
  hasMatchedStyle?: boolean;
  compact?: boolean;
};

/**
 * High-converting 2×2 tier grid (stacks on mobile) mapped to `pricingTiers`.
 * Active card uses a sharp sky primary border; badged tiers show a corner label.
 */
export default function PricingTierMatrix({
  layoutPageCount,
  selectedTierId,
  onSelectTier,
  hasMatchedStyle = false,
  compact = false,
}: PricingTierMatrixProps) {
  const needsBulk = shouldHighlightBulkBundle(layoutPageCount);
  const pagesLabel = Math.max(1, layoutPageCount);

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:text-xs">
          Choose your pack · {pagesLabel} page{pagesLabel === 1 ? '' : 's'} on canvas
        </p>
        <p className="text-[10px] font-semibold text-emerald-400 md:text-xs">
          {bulkValueProposition()}
        </p>
      </div>

      {needsBulk && (
        <p
          className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-2.5 py-2 text-[11px] leading-snug text-amber-50"
          role="status"
        >
          Your layout is <strong>{pagesLabel} pages</strong> — the 10-page packs
          are too small. Pick a highlighted <strong>75-page</strong> value pack.
        </p>
      )}

      <div
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3"
        role="radiogroup"
        aria-label="Pricing page bundles"
      >
        {pricingTiers.map((tier) => {
          const selected = tier.id === selectedTierId;
          const sufficient = isTierSufficient(tier, layoutPageCount);
          const bulkHighlight = needsBulk && tier.pages === 75;
          const insufficient = !sufficient;
          const isValuePack = tier.pages === 75;
          const engineHint =
            hasMatchedStyle && tier.engine === 'premium' && !selected;

          return (
            <button
              key={tier.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-invalid={insufficient && selected}
              onClick={() => onSelectTier(tier)}
              className={[
                'relative overflow-hidden rounded-xl border-2 px-3 pb-3 pt-4 text-left transition-all duration-150',
                selected
                  ? 'border-sky-500 bg-sky-500/15 shadow-[0_0_0_1px_rgba(14,165,233,0.55)] ring-2 ring-sky-500/40'
                  : 'border-slate-700 bg-slate-800/90 hover:border-slate-500 hover:bg-slate-800',
                bulkHighlight && !selected
                  ? 'border-emerald-500/70 bg-emerald-500/5'
                  : '',
                insufficient ? 'opacity-50' : '',
                engineHint ? 'border-violet-500/35' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {tier.badge ? (
                <span
                  className={[
                    'absolute right-0 top-0 rounded-bl-lg rounded-tr-xl px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide shadow-sm',
                    tier.badge.toLowerCase().includes('best')
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-sky-400 text-slate-950',
                  ].join(' ')}
                >
                  {tier.badge}
                </span>
              ) : null}

              <div className="flex items-start justify-between gap-2 pr-1">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {tier.engine === 'premium' ? 'Premium Match' : 'Standard'}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-white">
                    {tier.pages}-page {isValuePack ? 'value pack' : 'pack'}
                  </p>
                </div>
                {bulkHighlight ? (
                  <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-300">
                    Needed
                  </span>
                ) : null}
              </div>

              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight text-white">
                  ₹{tier.amountInr}
                </span>
                <span
                  className={[
                    'text-[11px] font-semibold',
                    isValuePack ? 'text-emerald-300' : 'text-slate-400',
                  ].join(' ')}
                >
                  {formatPerPage(tier)}/page
                </span>
              </p>

              <p className="mt-1.5 text-[10px] leading-snug text-slate-400">
                {tier.description}
              </p>

              {insufficient ? (
                <p className="mt-2 text-[10px] font-semibold text-rose-300">
                  Too small for {pagesLabel} layout pages
                </p>
              ) : selected ? (
                <p className="mt-2 text-[10px] font-semibold text-sky-300">
                  Selected
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
