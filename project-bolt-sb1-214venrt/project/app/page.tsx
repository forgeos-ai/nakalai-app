'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('../src/App'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[100dvh] items-center justify-center bg-slate-900 text-sm text-slate-400">
      Loading NakalAI…
    </div>
  ),
});

/** Home — core handwriting workspace. */
export default function HomePage() {
  return <App />;
}
