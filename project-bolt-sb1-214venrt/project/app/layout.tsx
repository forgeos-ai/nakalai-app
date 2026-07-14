import type { Metadata } from 'next';
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnalyticsBoot />
        {children}
      </body>
    </html>
  );
}
