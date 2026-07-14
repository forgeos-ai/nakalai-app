import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import AnalyticsBoot from '../src/seo/AnalyticsBoot';
import '../src/index.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://nakalai.in'),
  title: {
    default: 'NakalAI — Free Text to Handwriting Converter for Assignments',
    template: '%s',
  },
  description:
    'Convert text to handwriting online free. Preview assignments on notebook paper. Unlock 10- or 75-page Standard or Premium Match bundles — write massive records starting at just ₹1.05 per page!',
  icons: {
    icon: '/vite.svg',
  },
};

/** Required so phones report real CSS px width — otherwise md: desktop shell shows on mobile. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen w-full overflow-hidden bg-slate-900">
        <AnalyticsBoot />
        {children}
      </body>
    </html>
  );
}
