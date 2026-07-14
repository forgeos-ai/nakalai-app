/**
 * Generates crawlable static HTML for landings, blog, and trust pages.
 * Run: node scripts/generate-seo-pages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SITE,
  LANDINGS,
  BLOG_POSTS,
  TRUST_PAGES,
  GLOBAL_FAQS,
} from './seo-content.mjs';
import {
  bulkValueProposition,
  pricingTiers,
  pricingTierHtmlList,
  getBestBulkTier,
  formatPerPage,
} from './pricingTiers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function absoluteUrl(pathname) {
  return `${SITE.domain}${pathname === '/' ? '' : pathname}`;
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function navLinks() {
  return `
  <nav class="nav" aria-label="Primary">
    <a class="brand" href="/">${escapeHtml(SITE.name)}</a>
    <div class="nav-links">
      <a href="/">Generator</a>
      <a href="/pricing">Pricing</a>
      <a href="/blog">Blog</a>
      <a href="/faq">FAQ</a>
      <a class="btn" href="/">Open app</a>
    </div>
  </nav>`;
}

function footer() {
  const landings = LANDINGS.slice(0, 6)
    .map((l) => `<li><a href="${l.path}">${escapeHtml(l.h1)}</a></li>`)
    .join('');
  return `
  <footer class="footer">
    <div class="footer-grid">
      <div>
        <p class="brand">${escapeHtml(SITE.name)}</p>
        <p class="muted">${escapeHtml(SITE.tagline)}</p>
      </div>
      <div>
        <p class="footer-title">Product</p>
        <ul>
          <li><a href="/">Handwriting generator</a></li>
          <li><a href="/pricing">Pricing</a></li>
          <li><a href="/faq">FAQ</a></li>
          <li><a href="/blog">Blog</a></li>
        </ul>
      </div>
      <div>
        <p class="footer-title">Tools</p>
        <ul>${landings}</ul>
      </div>
      <div>
        <p class="footer-title">Company</p>
        <ul>
          <li><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/terms">Terms</a></li>
          <li><a href="/refund-policy">Refund Policy</a></li>
        </ul>
      </div>
    </div>
    <p class="legal">© ${new Date().getFullYear()} ${escapeHtml(SITE.name)}. Organic growth only — no paid ads required to use the free preview.</p>
  </footer>`;
}

function layout({
  title,
  description,
  canonical,
  breadcrumbs,
  body,
  extraJsonLd = [],
}) {
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.domain,
    email: SITE.email,
    logo: `${SITE.domain}/og-nakalai.svg`,
  };
  const siteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.domain,
  };
  const softwareLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE.name,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        description: 'Unlimited free watermarked preview',
      },
      ...pricingTiers.map((t) => ({
        '@type': 'Offer',
        price: String(t.amountInr),
        priceCurrency: 'INR',
        description: `${t.name} — ${t.description}`,
      })),
    ],
    url: SITE.domain,
  };
  const crumbLd = breadcrumbs?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name,
          item: absoluteUrl(b.path),
        })),
      }
    : null;

  const crumbHtml = breadcrumbs?.length
    ? `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${breadcrumbs
        .map(
          (b, i) =>
            `<li>${
              i < breadcrumbs.length - 1
                ? `<a href="${b.path}">${escapeHtml(b.name)}</a>`
                : `<span aria-current="page">${escapeHtml(b.name)}</span>`
            }</li>`,
        )
        .join('')}</ol></nav>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${absoluteUrl(canonical)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtml(SITE.name)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${absoluteUrl(canonical)}" />
  <meta property="og:image" content="${SITE.domain}/og-nakalai.svg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${SITE.domain}/og-nakalai.svg" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <link rel="stylesheet" href="/seo/marketing.css" />
  ${jsonLd(orgLd)}
  ${jsonLd(siteLd)}
  ${jsonLd(softwareLd)}
  ${crumbLd ? jsonLd(crumbLd) : ''}
  ${extraJsonLd.map(jsonLd).join('\n  ')}
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  ${navLinks()}
  <main id="main" class="main">
    ${crumbHtml}
    ${body}
  </main>
  ${footer()}
</body>
</html>`;
}

function ctaBlock(label = 'Open free handwriting generator') {
  const bulk = bulkValueProposition();
  return `
  <section class="cta" aria-labelledby="cta-heading">
    <h2 id="cta-heading">${escapeHtml(label)}</h2>
    <p>Unlimited free watermarked previews. Unlock a clean PDF with a 10- or 75-page bundle (Standard or Premium Match). ${escapeHtml(bulk)}</p>
    <p><a class="btn btn-lg" href="/">Launch NakalAI</a></p>
  </section>`;
}

function writePage(routePath, html) {
  const dir = path.join(PUBLIC, routePath.replace(/^\//, ''));
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  console.log('wrote', routePath || '/');
}

function landingHtml(page) {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const sections = page.sections
    .map(
      (s) => `
    <section>
      <h2>${escapeHtml(s.h2)}</h2>
      <p>${escapeHtml(s.body)}</p>
    </section>`,
    )
    .join('');
  const faqs = page.faqs
    .map(
      (f) => `
      <details>
        <summary>${escapeHtml(f.q)}</summary>
        <p>${escapeHtml(f.a)}</p>
      </details>`,
    )
    .join('');
  const related = page.related
    .map((p) => {
      const hit = LANDINGS.find((l) => l.path === p) || TRUST_PAGES.find((t) => t.path === p);
      const label = hit?.h1 || p;
      return `<li><a href="${p}">${escapeHtml(label)}</a></li>`;
    })
    .join('');

  const body = `
    <header class="hero">
      <p class="eyebrow">Free organic tool · nakalai.in</p>
      <h1>${escapeHtml(page.h1)}</h1>
      <p class="lead">${escapeHtml(page.intent)}</p>
      <p><a class="btn btn-lg" href="/">Try the generator free</a></p>
    </header>
    ${sections}
    <section aria-labelledby="try-h" class="embed">
      <h2 id="try-h">Try the generator</h2>
      <p>Open the live NakalAI editor below (free watermarked preview). Prefer a full screen? <a href="/">Launch the app</a>.</p>
      <div class="embed-frame">
        <iframe
          title="NakalAI handwriting generator"
          src="/"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          width="100%"
          height="640"
        ></iframe>
      </div>
    </section>
    <section aria-labelledby="faq-h">
      <h2 id="faq-h">FAQ</h2>
      ${faqs}
    </section>
    <section aria-labelledby="related-h">
      <h2 id="related-h">Related tools</h2>
      <ul class="link-list">${related}</ul>
    </section>
    ${ctaBlock()}`;

  return layout({
    title: page.title,
    description: page.description,
    canonical: page.path,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: page.h1, path: page.path },
    ],
    body,
    extraJsonLd: [faqLd],
  });
}

function blogIndexHtml() {
  const items = BLOG_POSTS.map(
    (p) => `
    <article class="card">
      <h2><a href="/blog/${p.slug}">${escapeHtml(p.h1)}</a></h2>
      <p class="muted"><time datetime="${p.date}">${p.date}</time></p>
      <p>${escapeHtml(p.description)}</p>
    </article>`,
  ).join('');
  return layout({
    title: 'NakalAI Blog — Handwriting & Assignment Tips',
    description:
      'Free guides on writing assignments faster, text-to-handwriting, ink colours, and notebook formats from NakalAI.',
    canonical: '/blog',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
    ],
    body: `<header class="hero"><h1>NakalAI Blog</h1><p class="lead">Practical guides that link back to the free handwriting generator.</p></header><div class="card-grid">${items}</div>${ctaBlock()}`,
  });
}

function blogPostHtml(post) {
  const sections = post.sections
    .map(
      (s) => `<section><h2>${escapeHtml(s.h2)}</h2><p>${escapeHtml(s.body)}</p></section>`,
    )
    .join('');
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.h1,
    datePublished: post.date,
    author: { '@type': 'Organization', name: SITE.name },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };
  return layout({
    title: post.title,
    description: post.description,
    canonical: `/blog/${post.slug}`,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: post.h1, path: `/blog/${post.slug}` },
    ],
    body: `<article><header class="hero"><h1>${escapeHtml(post.h1)}</h1><p class="muted"><time datetime="${post.date}">${post.date}</time></p></header>${sections}<p><a class="btn" href="${post.ctaPath}">Open related tool</a></p></article>${ctaBlock()}`,
    extraJsonLd: [articleLd],
  });
}

function trustHtml(page) {
  let bodyInner = '';
  if (page.path === '/about') {
    bodyInner = `<p>NakalAI helps students convert typed text into realistic handwriting on A4 notebook pages. Preview is free forever. Clean PDF downloads are pay-per-assignment.</p><p>We focus on technical quality, privacy-aware lead capture, and organic discovery — not paid ads.</p>`;
  } else if (page.path === '/pricing') {
    const best = getBestBulkTier();
    bodyInner = `
      <p class="lead"><strong>${escapeHtml(bulkValueProposition())}</strong></p>
      <p>Choose a page-bundle quota (10 or 75) and a matching engine (Standard platform fonts or Premium Match My Style). Preview stays free forever.</p>
      <ul class="pricing">
        <li><strong>Free preview</strong> — unlimited watermarked pages</li>
        ${pricingTierHtmlList()}
      </ul>
      <p>Bulk tip: the ${escapeHtml(best.name)} plan works out to ${escapeHtml(formatPerPage(best))} per page — ideal for long records and multi-chapter notes.</p>
      <p>Editing text after payment voids the current download pass so each payment maps to one assignment within your selected page quota.</p>`;
  } else if (page.path === '/faq') {
    bodyInner = GLOBAL_FAQS.map(
      (f) => `<details><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`,
    ).join('');
  } else if (page.path === '/privacy') {
    bodyInner = `<p>We collect student profile details (name, email, mobile) with explicit DPDP-oriented consent before PDF download for service verification and updates. Assignment text is processed in-session for rendering. See contact options to request access or deletion.</p>`;
  } else if (page.path === '/terms') {
    bodyInner = `<p>By using NakalAI you agree to use the tool for your own academic work and to follow your institution’s integrity policies. Preview is free. Paid downloads unlock clean PDFs as described on the pricing page. Digital goods may be non-refundable once delivered — see Refund Policy.</p>`;
  } else if (page.path === '/contact') {
    bodyInner = `<p>Email <a href="mailto:${SITE.email}">${SITE.email}</a> for product questions, privacy requests, or support.</p>`;
  } else if (page.path === '/refund-policy') {
    bodyInner = `<p>NakalAI sells digital download passes. If a paid download fails to generate due to a verified technical fault, contact ${SITE.email} within 48 hours with your payment reference. Previews remain free. Change-of-mind refunds after a successful clean PDF download are generally not available.</p>`;
  }

  const faqLd =
    page.path === '/faq'
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: GLOBAL_FAQS.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null;

  return layout({
    title: page.title,
    description: page.description,
    canonical: page.path,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: page.h1, path: page.path },
    ],
    body: `<header class="hero"><h1>${escapeHtml(page.h1)}</h1></header><section>${bodyInner}</section>${ctaBlock()}`,
    extraJsonLd: faqLd ? [faqLd] : [],
  });
}

function writeRobots() {
  const txt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /assets/

Sitemap: ${SITE.domain}/sitemap.xml
`;
  fs.writeFileSync(path.join(PUBLIC, 'robots.txt'), txt, 'utf8');
}

function writeSitemap() {
  const urls = [
    '/',
    ...LANDINGS.map((l) => l.path),
    '/blog',
    ...BLOG_POSTS.map((p) => `/blog/${p.slug}`),
    ...TRUST_PAGES.map((t) => t.path),
  ];
  const today = new Date().toISOString().slice(0, 10);
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${absoluteUrl(u)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u === '/' ? '1.0' : u.startsWith('/blog/') ? '0.6' : '0.8'}</priority>
  </url>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
  fs.writeFileSync(path.join(PUBLIC, 'sitemap.xml'), xml, 'utf8');
}

function writeMarketingCss() {
  ensureDir(path.join(PUBLIC, 'seo'));
  fs.writeFileSync(
    path.join(PUBLIC, 'seo', 'marketing.css'),
    `*{box-sizing:border-box}body{margin:0;font-family:Georgia,"Times New Roman",serif;color:#0f172a;background:#f8fafc;line-height:1.6}.skip{position:absolute;left:-999px}.skip:focus{left:1rem;top:1rem;background:#fff;padding:.5rem 1rem;z-index:50}.nav{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 1.25rem;background:#0f172a;color:#e2e8f0;position:sticky;top:0;z-index:20}.brand{font-weight:700;color:#fff;text-decoration:none;font-family:system-ui,sans-serif}.nav-links{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center}.nav-links a{color:#cbd5e1;text-decoration:none;font-family:system-ui,sans-serif;font-size:.9rem}.nav-links a:hover,.footer a:hover{color:#fff}.btn{display:inline-block;background:#0284c7;color:#fff!important;padding:.55rem 1rem;border-radius:.65rem;text-decoration:none;font-family:system-ui,sans-serif;font-weight:600}.btn-lg{padding:.8rem 1.25rem;font-size:1rem}.main{max-width:46rem;margin:0 auto;padding:2rem 1.25rem 4rem}.hero{margin-bottom:2rem}.eyebrow{text-transform:uppercase;letter-spacing:.06em;font-size:.75rem;color:#64748b;font-family:system-ui,sans-serif}.lead{font-size:1.15rem;color:#334155}h1{font-size:clamp(1.8rem,4vw,2.6rem);line-height:1.15;margin:.4rem 0 1rem}h2{font-size:1.35rem;margin:2rem 0 .75rem}.muted{color:#64748b;font-size:.92rem}.breadcrumbs ol{display:flex;flex-wrap:wrap;gap:.35rem;list-style:none;padding:0;margin:0 0 1.25rem;font-family:system-ui,sans-serif;font-size:.85rem;color:#64748b}.breadcrumbs li:not(:last-child)::after{content:"/";margin-left:.35rem;opacity:.5}.cta{margin-top:3rem;padding:1.5rem;border-radius:1rem;background:linear-gradient(135deg,#e0f2fe,#f8fafc);border:1px solid #bae6fd}.embed{margin:2rem 0}.embed-frame{border:1px solid #cbd5e1;border-radius:.9rem;overflow:hidden;background:#0f172a;aspect-ratio:16/10;min-height:420px}.embed-frame iframe{display:block;width:100%;height:100%;min-height:420px;border:0}.card-grid{display:grid;gap:1rem}.card{padding:1.25rem;border:1px solid #e2e8f0;border-radius:.9rem;background:#fff}.link-list,.pricing{padding-left:1.2rem}.footer{background:#0f172a;color:#94a3b8;padding:2.5rem 1.25rem 2rem;font-family:system-ui,sans-serif;font-size:.9rem}.footer-grid{max-width:60rem;margin:0 auto;display:grid;gap:1.5rem;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))}.footer a{color:#cbd5e1;text-decoration:none}.footer-title{color:#e2e8f0;font-weight:600}.footer ul{list-style:none;padding:0;margin:0}.footer li{margin:.35rem 0}.legal{max-width:60rem;margin:2rem auto 0;border-top:1px solid #1e293b;padding-top:1rem;font-size:.8rem}details{border:1px solid #e2e8f0;border-radius:.7rem;padding:.75rem 1rem;margin:.6rem 0;background:#fff}summary{cursor:pointer;font-weight:600;font-family:system-ui,sans-serif}@media (max-width:640px){.nav{flex-direction:column;align-items:flex-start}.embed-frame{min-height:360px}}`,
    'utf8',
  );
}

function main() {
  ensureDir(PUBLIC);
  writeMarketingCss();
  writeRobots();
  writeSitemap();

  // Keyword landings are owned by Next.js app/[slug] (live canvas + generateMetadata).
  // Do not emit static HTML for LANDINGS — it would shadow the App Router routes.
  writePage('/blog', blogIndexHtml());
  for (const post of BLOG_POSTS) {
    writePage(`/blog/${post.slug}`, blogPostHtml(post));
  }
  for (const page of TRUST_PAGES) {
    writePage(page.path, trustHtml(page));
  }

  console.log('SEO static pages generated (blog + trust). Keyword slugs → Next app/[slug].');
}

main();
