import type { PageMetadata } from '../../content/seo/metadata/types';

export type { PageMetadata } from '../../content/seo/metadata/types';

function setMetaByName(name: string, content: string): void {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaByProperty(property: string, content: string): void {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url: string): void {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = url;
}

/** Apply PageMetadata to the live document head (SPA SEO). */
export function applyDocumentMetadata(meta: PageMetadata): void {
  if (meta.title) {
    document.title = meta.title;
  }

  if (meta.description) {
    setMetaByName('description', meta.description);
  }

  if (meta.alternates?.canonical) {
    setCanonical(meta.alternates.canonical);
  }

  if (meta.robots) {
    const index = meta.robots.index === false ? 'noindex' : 'index';
    const follow = meta.robots.follow === false ? 'nofollow' : 'follow';
    setMetaByName('robots', `${index},${follow}`);
  }

  const og = meta.openGraph;
  if (og) {
    if (og.type) setMetaByProperty('og:type', og.type);
    if (og.siteName) setMetaByProperty('og:site_name', og.siteName);
    if (og.title) setMetaByProperty('og:title', og.title);
    if (og.description) setMetaByProperty('og:description', og.description);
    if (og.url) setMetaByProperty('og:url', og.url);
    if (og.locale) setMetaByProperty('og:locale', og.locale);
    const image = og.images?.[0];
    if (image?.url) setMetaByProperty('og:image', image.url);
  }

  const tw = meta.twitter;
  if (tw) {
    if (tw.card) setMetaByName('twitter:card', tw.card);
    if (tw.title) setMetaByName('twitter:title', tw.title);
    if (tw.description) setMetaByName('twitter:description', tw.description);
    const image = tw.images?.[0];
    if (image) setMetaByName('twitter:image', image);
  }
}

const JSON_LD_ATTR = 'data-nakalai-jsonld';

/** Inject or replace a JSON-LD script tag in document.head. */
export function applyJsonLd(data: unknown, id = 'landing'): void {
  const selector = `script[${JSON_LD_ATTR}="${id}"]`;
  let el = document.querySelector(selector) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute(JSON_LD_ATTR, id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}
