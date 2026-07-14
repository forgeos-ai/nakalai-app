'use client';

import dynamic from 'next/dynamic';
import type { ResolvedSeoKeyword } from './resolveSeoKeyword';
import { seoBulkValueLine, seoPricingBlurb } from './pricingCopy';

const App = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-900 text-sm text-slate-400">
      Loading handwriting workspace…
    </div>
  ),
});

type Props = {
  config: ResolvedSeoKeyword;
};

/**
 * Client shell: semantic SEO copy surrounding the live handwriting workspace.
 */
export default function SeoLandingView({ config }: Props) {
  const bulkLine = seoBulkValueLine();
  const pricingBlurb = seoPricingBlurb();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-6 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
          NakalAI · Free preview
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-white md:text-4xl">
          {config.h1}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-300 md:text-lg">
          {config.problemLead}
        </p>
        <p className="mt-2 max-w-2xl text-sm font-medium text-emerald-300/90">
          {bulkLine}
        </p>
      </header>

      <div className="space-y-6 px-4 py-6 md:px-8">
        {config.sections.map((section) => (
          <section key={section.h2} className="max-w-3xl">
            <h2 className="text-xl font-semibold text-white md:text-2xl">
              {section.h2}
            </h2>
            <p className="mt-2 text-slate-300">{section.body}</p>
          </section>
        ))}
      </div>

      <section
        aria-label="Handwriting generator workspace"
        className="border-t border-slate-800"
      >
        <div className="px-4 py-3 md:px-8">
          <h2 className="text-lg font-semibold text-sky-300">
            Try it now — live handwriting canvas
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Workspace is pre-loaded for this search intent. Edit text, ink, and
            paper freely. {pricingBlurb}
          </p>
          <p className="mt-2 text-sm font-medium text-emerald-300/90">
            {bulkLine}
          </p>
        </div>
        <div className="h-[min(85vh,920px)] w-full overflow-hidden border-t border-slate-800">
          <App
            embedded
            workspacePreset={{
              text: config.workspace.text,
              inkId: config.workspace.inkId,
              paperId: config.workspace.paperId,
            }}
          />
        </div>
      </section>

      <footer className="border-t border-slate-800 px-4 py-8 text-sm text-slate-500 md:px-8">
        <nav className="flex flex-wrap gap-4" aria-label="Related">
          <a className="hover:text-sky-300" href="/pricing">
            Pricing
          </a>
          <a className="hover:text-sky-300" href="/faq">
            FAQ
          </a>
          <a className="hover:text-sky-300" href="/blog">
            Blog
          </a>
          <a className="hover:text-sky-300" href="/">
            Full generator
          </a>
        </nav>
      </footer>
    </div>
  );
}
