/**
 * Hidden developer DNA debug overlay — dev only.
 * Toggle: ?dna-debug=1 or localStorage nakalai_dna_debug=1
 */

import { useEffect, useState } from 'react';
import { getDnaDebugSnapshot } from '../renderer/debug';

function isDnaDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const isDev =
    typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
  if (!isDev) return false;
  try {
    if (window.location.search.includes('dna-debug=1')) return true;
    return localStorage.getItem('nakalai_dna_debug') === '1';
  } catch {
    return false;
  }
}

/** Floating DNA metrics panel — mount once in App (dev only). */
export function DnaDebugOverlay() {
  const [enabled] = useState(() => isDnaDebugEnabled());
  const [snap, setSnap] = useState(() => getDnaDebugSnapshot());

  useEffect(() => {
    if (!enabled) return;
    const tick = () => setSnap(getDnaDebugSnapshot());
    tick();
    const id = window.setInterval(tick, 800);
    return () => window.clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;
  if (!snap) {
    return (
      <div
        className="pointer-events-none fixed bottom-3 right-3 z-[9999] max-w-xs rounded-lg border border-sky-500/40 bg-slate-950/90 p-3 text-[10px] text-sky-100 shadow-xl backdrop-blur"
        data-dna-debug-overlay="true"
      >
        <p className="font-semibold uppercase tracking-wider text-sky-400">
          DNA Debug
        </p>
        <p className="text-slate-500">No active Match DNA session</p>
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none fixed bottom-3 right-3 z-[9999] max-w-xs rounded-lg border border-sky-500/40 bg-slate-950/90 p-3 text-[10px] text-sky-100 shadow-xl backdrop-blur"
      aria-hidden
      data-dna-debug-overlay="true"
    >
      <p className="mb-1 font-semibold uppercase tracking-wider text-sky-400">
        DNA Debug
      </p>
      <dl className="space-y-0.5 font-mono">
        <div>
          <dt className="inline text-slate-500">seed </dt>
          <dd className="inline">{snap.seed}</dd>
        </div>
        <div>
          <dt className="inline text-slate-500">conf </dt>
          <dd className="inline">{(snap.confidence * 100).toFixed(0)}%</dd>
        </div>
        <div>
          <dt className="inline text-slate-500">src </dt>
          <dd className="inline">{snap.source}</dd>
        </div>
        {Object.entries(snap.traits).map(([k, v]) => (
          <div key={k}>
            <dt className="inline text-slate-500">{k} </dt>
            <dd className="inline">
              {v.value}{' '}
              <span className="text-slate-600">
                ({(v.confidence * 100).toFixed(0)}%)
              </span>
            </dd>
          </div>
        ))}
        <div>
          <dt className="inline text-slate-500">seg </dt>
          <dd className="inline">
            {snap.segmentation.lines}L / {snap.segmentation.characters}C /{' '}
            {snap.segmentation.clusters}cl
          </dd>
        </div>
      </dl>
    </div>
  );
}
