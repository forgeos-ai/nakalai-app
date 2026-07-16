/**
 * Golden Lab v1 — /golden-lab evaluation UI.
 * Dev/evaluation only — not part of production assignment flow.
 */

import { useEffect, useRef, useState } from 'react';
import { getGoldenSamples } from './samples';
import { runGoldenLab } from './regression';
import { renderGoldenSample, TEXT_AREA_HEIGHT } from './renderSample';
import {
  BASELINE_ENGINE_ID,
  CURRENT_ENGINE_ID,
} from './baselines';
import type { GoldenLabReport, GoldenSampleId } from './types';
import { DIMENSIONS } from './regression';

export default function GoldenLabPage() {
  const [report, setReport] = useState<GoldenLabReport | null>(null);
  const [selectedId, setSelectedId] = useState<GoldenSampleId>(
    'cursive-neat-paragraph',
  );
  const [rendering, setRendering] = useState(false);
  const baselineRef = useRef<HTMLCanvasElement>(null);
  const currentRef = useRef<HTMLCanvasElement>(null);

  const samples = getGoldenSamples();
  const selected = samples.find((s) => s.id === selectedId) ?? samples[0]!;

  useEffect(() => {
    setReport(runGoldenLab());
  }, []);

  useEffect(() => {
    const base = baselineRef.current;
    const cur = currentRef.current;
    if (!base || !cur || !selected) return;

    let cancelled = false;
    setRendering(true);

    void (async () => {
      await renderGoldenSample({
        canvas: base,
        sample: selected,
        engineVersion: BASELINE_ENGINE_ID,
      });
      await renderGoldenSample({
        canvas: cur,
        sample: selected,
        engineVersion: CURRENT_ENGINE_ID,
      });
      if (cancelled) return;
      setRendering(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId, selected]);

  const verdict = report?.regressions.find((r) => r.sampleId === selectedId);
  const currentCard = report?.current.find((c) => c.sampleId === selectedId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              NakalAI Golden Lab v1
            </h1>
            <p className="text-xs text-slate-400">
              Handwriting engine evaluation — mandatory before merge
            </p>
          </div>
          {report && (
            <div
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                report.mergeReady
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-red-500/15 text-red-300'
              }`}
            >
              {report.summary}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Sample
            </h2>
            <select
              value={selectedId}
              onChange={(e) =>
                setSelectedId(e.target.value as GoldenSampleId)
              }
              className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
            >
              {samples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="text-sm leading-relaxed text-slate-300">
              {selected.text}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Regression verdict
            </h2>
            {verdict ? (
              <ul className="space-y-1 text-sm">
                <li>
                  Overall: {verdict.currentOverall}{' '}
                  <span
                    className={
                      verdict.deltaOverall >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }
                  >
                    ({verdict.deltaOverall >= 0 ? '+' : ''}
                    {verdict.deltaOverall})
                  </span>
                </li>
                <li>
                  Status:{' '}
                  {verdict.noRegression ? (
                    <span className="text-emerald-400">no regression</span>
                  ) : (
                    <span className="text-red-400">REGRESSION</span>
                  )}
                </li>
                <li className="font-mono text-xs text-slate-500">
                  fp: {verdict.currentFingerprint}
                </li>
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Running…</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Visual regression — side by side
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-white p-2">
              <p className="mb-2 text-center text-xs font-medium text-slate-600">
                Baseline ({BASELINE_ENGINE_ID})
              </p>
              <canvas
                ref={baselineRef}
                width={selected.widthPx}
                height={TEXT_AREA_HEIGHT}
                className="mx-auto block w-full max-w-full"
              />
            </div>
            <div className="rounded-xl border border-slate-800 bg-white p-2">
              <p className="mb-2 text-center text-xs font-medium text-slate-600">
                Current ({CURRENT_ENGINE_ID})
                {rendering && (
                  <span className="ml-2 text-slate-400">rendering…</span>
                )}
              </p>
              <canvas
                ref={currentRef}
                width={selected.widthPx}
                height={TEXT_AREA_HEIGHT}
                className="mx-auto block w-full max-w-full"
              />
            </div>
          </div>
        </section>

        {currentCard?.ligatureAudit && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Transition heatmap — top pairs
            </h2>
            <div className="mb-2 flex flex-wrap gap-3 text-xs text-slate-400">
              <span>
                continuity{' '}
                {(currentCard.ligatureAudit.continuityScore * 100).toFixed(0)}%
              </span>
              <span>
                consistency{' '}
                {(currentCard.ligatureAudit.transitionConsistency * 100).toFixed(
                  0,
                )}
                %
              </span>
              <span>
                join conf{' '}
                {(currentCard.ligatureAudit.joinConfidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="bg-slate-900/80 uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Pair</th>
                    <th className="px-3 py-2">Hits</th>
                    <th className="px-3 py-2">Join</th>
                    <th className="px-3 py-2">Conf</th>
                    <th className="px-3 py-2">Gap em</th>
                    <th className="px-3 py-2">Join rate</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCard.ligatureAudit.heatmap.slice(0, 20).map((cell) => (
                    <tr key={cell.pair} className="border-t border-slate-800/80">
                      <td className="px-3 py-2 font-mono font-semibold">
                        {cell.pair}
                      </td>
                      <td className="px-3 py-2">{cell.hits}</td>
                      <td className="px-3 py-2">
                        {(cell.meanJoinStrength * 100).toFixed(0)}%
                      </td>
                      <td className="px-3 py-2">
                        {(cell.meanConfidence * 100).toFixed(0)}%
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-500">
                        {cell.meanGapEm.toFixed(3)}
                      </td>
                      <td className="px-3 py-2">
                        {(cell.joinRate * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {currentCard?.motionPhysicsAudit && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Motion physics — timeline &amp; heatmaps
            </h2>
            <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-400">
              <span>
                motion{' '}
                {(currentCard.motionPhysicsAudit.motionScore * 100).toFixed(0)}%
              </span>
              <span>
                pressure{' '}
                {(currentCard.motionPhysicsAudit.pressureScore * 100).toFixed(0)}%
              </span>
              <span>
                ink{' '}
                {(currentCard.motionPhysicsAudit.inkConsistency * 100).toFixed(0)}%
              </span>
              <span>
                flow{' '}
                {(currentCard.motionPhysicsAudit.strokeFlow * 100).toFixed(0)}%
              </span>
            </div>
            <div className="mb-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <p className="mb-2 text-xs uppercase text-slate-500">Motion timeline</p>
              <div className="space-y-2 font-mono text-[10px]">
                {currentCard.motionPhysicsAudit.timeline.slice(0, 12).map((cell) => (
                  <div key={cell.glyphIndex} className="grid grid-cols-[2rem_1fr] gap-2">
                    <span className="text-slate-400">{cell.char}</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-slate-500">velocity</span>
                        <div className="h-2 flex-1 rounded bg-slate-800">
                          <div
                            className="h-2 rounded bg-sky-500/80"
                            style={{ width: `${cell.velocity * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-slate-500">pressure</span>
                        <div className="h-2 flex-1 rounded bg-slate-800">
                          <div
                            className="h-2 rounded bg-amber-500/80"
                            style={{ width: `${cell.pressure * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-slate-500">ink</span>
                        <div className="h-2 flex-1 rounded bg-slate-800">
                          <div
                            className="h-2 rounded bg-emerald-500/80"
                            style={{ width: `${cell.inkOpacity * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-slate-500">lift</span>
                        <div className="h-2 flex-1 rounded bg-slate-800">
                          <div
                            className="h-2 rounded bg-violet-500/80"
                            style={{ width: `${cell.penLift * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Char</th>
                      <th className="px-3 py-2">Hits</th>
                      <th className="px-3 py-2">Pressure</th>
                      <th className="px-3 py-2">Velocity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCard.motionPhysicsAudit.pressureHeatmap
                      .slice(0, 10)
                      .map((cell) => (
                        <tr key={`p-${cell.char}`} className="border-t border-slate-800/80">
                          <td className="px-3 py-2 font-mono">{cell.char}</td>
                          <td className="px-3 py-2">{cell.hits}</td>
                          <td className="px-3 py-2">
                            {(cell.meanPressure * 100).toFixed(0)}%
                          </td>
                          <td className="px-3 py-2">
                            {(cell.meanVelocity * 100).toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Char</th>
                      <th className="px-3 py-2">Hits</th>
                      <th className="px-3 py-2">Velocity</th>
                      <th className="px-3 py-2">Accel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCard.motionPhysicsAudit.velocityHeatmap
                      .slice(0, 10)
                      .map((cell) => (
                        <tr key={`v-${cell.char}`} className="border-t border-slate-800/80">
                          <td className="px-3 py-2 font-mono">{cell.char}</td>
                          <td className="px-3 py-2">{cell.hits}</td>
                          <td className="px-3 py-2">
                            {(cell.meanVelocity * 100).toFixed(0)}%
                          </td>
                          <td className="px-3 py-2">
                            {(cell.meanAcceleration * 100).toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {currentCard?.writerMemoryAudit && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Context heatmap — writer memory
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="bg-slate-900/80 uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Context</th>
                    <th className="px-3 py-2">Char</th>
                    <th className="px-3 py-2">Hits</th>
                    <th className="px-3 py-2">Preferred</th>
                    <th className="px-3 py-2">Selections</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCard.writerMemoryAudit.cells.slice(0, 12).map((cell) => (
                    <tr key={cell.contextKey} className="border-t border-slate-800/80">
                      <td className="px-3 py-2 font-mono text-slate-400">
                        {cell.contextKey}
                      </td>
                      <td className="px-3 py-2">{cell.char}</td>
                      <td className="px-3 py-2">{cell.hits}</td>
                      <td className="px-3 py-2">v{cell.preferredVariant}</td>
                      <td className="px-3 py-2 font-mono text-slate-500">
                        {cell.selections.join(',')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {currentCard && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Engine scorecard
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Dimension</th>
                    <th className="px-4 py-2">Score</th>
                    <th className="px-4 py-2">Confidence</th>
                    <th className="px-4 py-2">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {DIMENSIONS.map((dim) => {
                    const row = currentCard.dimensions[dim];
                    return (
                      <tr
                        key={dim}
                        className="border-t border-slate-800/80"
                      >
                        <td className="px-4 py-2 font-medium">{dim}</td>
                        <td className="px-4 py-2">
                          <span
                            className={
                              row.score >= 60
                                ? 'text-emerald-400'
                                : row.score >= 45
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                            }
                          >
                            {row.score}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-400">
                          {(row.confidence * 100).toFixed(0)}%
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-500">
                          {row.detail}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {report && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Full report JSON
            </h2>
            <pre className="max-h-64 overflow-auto text-xs text-slate-500">
              {JSON.stringify(report, null, 2)}
            </pre>
          </section>
        )}

        <p className="pb-8 text-center text-xs text-slate-600">
          Enable DNA debug on main app: add{' '}
          <code className="text-slate-400">?dna-debug=1</code> in dev mode
        </p>
      </main>
    </div>
  );
}
