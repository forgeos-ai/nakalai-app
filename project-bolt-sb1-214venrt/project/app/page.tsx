import { lazy, Suspense } from 'react';

const App = lazy(() => import('../../src/App'));

const loading = (
  <div className="flex h-[100dvh] items-center justify-center bg-slate-900 text-sm text-slate-400">
    Loading NakalAI…
  </div>
);

/** Home — core handwriting workspace (Vite-compatible; not a Next.js page). */
export default function HomePage() {
  return (
    <Suspense fallback={loading}>
      <App />
    </Suspense>
  );
}
