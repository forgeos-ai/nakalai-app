'use client';

import dynamic from 'next/dynamic';
import type { ResolvedLandingPage } from './resolveSeoKeyword';
import { getRelatedLandingPages } from '../../content/seo/landing-pages/registry';
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
  config: ResolvedLandingPage;
};

/**
 * Config-driven SEO landing shell — semantic copy + embedded generator.
 * Does not modify the core App / generator UI.
 */
export default function SeoLandingView({ config }: Props) {
  const bulkLine = seoBulkValueLine();
  const pricingBlurb = seoPricingBlurb();
  const related = getRelatedLandingPages(config.relatedSlugs);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav
        className="border-b border-slate-800 bg-slate-900/60 px-4 py-2 text-xs text-slate-400 md:px-8"
        aria-label="Breadcrumb"
      >
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <a className="hover:text-sky-300" href="/">
              Home
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-300" aria-current="page">
            {config.h1}
          </li>
        </ol>
      </nav>

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
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{config.audience}</p>
        <p className="mt-2 max-w-2xl text-sm font-medium text-emerald-300/90">
          {bulkLine}
        </p>
      </header>

      <div className="space-y-8 px-4 py-6 md:px-8">
        <section className="max-w-3xl" aria-labelledby="benefits-heading">
          <h2 id="benefits-heading" className="text-xl font-semibold text-white md:text-2xl">
            Benefits
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
            {config.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>

        <section className="max-w-3xl" aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-xl font-semibold text-white md:text-2xl">
            How it works
          </h2>
          <ol className="mt-3 space-y-4">
            {config.howItWorks.map((step) => (
              <li key={step.step} className="text-slate-300">
                <span className="font-semibold text-sky-300">
                  Step {step.step}: {step.title}
                </span>
                <p className="mt-1">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {config.sections.map((section) => (
          <section key={section.h2} className="max-w-3xl">
            <h2 className="text-xl font-semibold text-white md:text-2xl">
              {section.h2}
            </h2>
            <p className="mt-2 text-slate-300">{section.body}</p>
          </section>
        ))}

        <section className="max-w-3xl" aria-labelledby="tips-heading">
          <h2 id="tips-heading" className="text-xl font-semibold text-white md:text-2xl">
            Tips
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
            {config.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className="max-w-3xl" aria-labelledby="examples-heading">
          <h2 id="examples-heading" className="text-xl font-semibold text-white md:text-2xl">
            Examples
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
            {config.examples.map((ex) => (
              <li key={ex}>{ex}</li>
            ))}
          </ul>
        </section>
      </div>

      <section
        aria-label="Handwriting generator workspace"
        className="border-t border-slate-800"
      >
        <div className="px-4 py-3 md:px-8">
          <h2 className="text-lg font-semibold text-sky-300">
            {config.cta.headline}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {config.cta.body} {pricingBlurb}
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

      <section
        className="border-t border-slate-800 px-4 py-8 md:px-8"
        aria-labelledby="faq-heading"
      >
        <h2 id="faq-heading" className="text-xl font-semibold text-white md:text-2xl">
          Frequently asked questions
        </h2>
        <dl className="mt-4 max-w-3xl space-y-6">
          {config.faqs.map((faq) => (
            <div key={faq.question}>
              <dt className="font-medium text-sky-200">{faq.question}</dt>
              <dd className="mt-1 text-slate-300">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      {related.length > 0 && (
        <section
          className="border-t border-slate-800 px-4 py-6 md:px-8"
          aria-labelledby="related-heading"
        >
          <h2 id="related-heading" className="text-lg font-semibold text-white">
            Related tools
          </h2>
          <ul className="mt-3 flex flex-wrap gap-3 text-sm">
            {related.map((p) => (
              <li key={p.slug}>
                <a
                  className="rounded-md border border-slate-700 px-3 py-1.5 text-slate-300 hover:border-sky-600 hover:text-sky-300"
                  href={`/${p.slug}`}
                >
                  {p.h1}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-t border-slate-800 px-4 py-8 text-sm text-slate-500 md:px-8">
        <nav className="flex flex-wrap gap-4" aria-label="Site">
          <a className="hover:text-sky-300" href="/">
            Full generator
          </a>
          <a className="hover:text-sky-300" href="/pricing">
            Pricing
          </a>
          <a className="hover:text-sky-300" href="/faq">
            FAQ
          </a>
          <a className="hover:text-sky-300" href="/blog">
            Blog
          </a>
        </nav>
      </footer>
    </div>
  );
}
