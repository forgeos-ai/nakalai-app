import type { ReactNode } from 'react';
import AnalyticsBoot from '../src/seo/AnalyticsBoot';
import '../src/index.css';

/**
 * Legacy layout shell kept for reference — Vite uses index.html + SpaRoot.
 * No Next.js imports.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-full overflow-hidden bg-slate-900">
      <AnalyticsBoot />
      {children}
    </div>
  );
}
