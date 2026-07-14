/**
 * Framework-agnostic page metadata — replaces Next.js `Metadata` for Vite.
 */

export interface PageMetadataImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface PageMetadata {
  title?: string;
  description?: string;
  alternates?: {
    canonical?: string;
  };
  robots?: {
    index?: boolean;
    follow?: boolean;
  };
  openGraph?: {
    type?: string;
    siteName?: string;
    title?: string;
    description?: string;
    url?: string;
    locale?: string;
    images?: PageMetadataImage[];
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    images?: string[];
  };
}
