'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DateRange } from '../DashboardClient';

interface CompositePoint { date: string; score: number | null; compoundCount: number }
interface GapEntry { id: string; name: string; avgPct: number }
interface HeatmapCompound { id: string; name: string; valuesByDate: Record<string, number> }

interface Props {
  range: DateRange;
  overallAvg: number | null;
  composite: CompositePoint[];
  topGaps: GapEntry[];
  heatmap: HeatmapCompound[];
  loading: boolean;
}

function formatDate(d: string, range: DateRange): string {
  const date = new Date(d);
  if (range === '7d') return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Color based on % DV
function pctColor(pct: number | undefined): string {
  if (pct === undefined || pct === null) return 'var(--border, #1e1e24)';
  if (pct < 50) return '#b44848';   // deficient
  if (pct < 80) return '#b49648';   // low
  if (pct <= 120) return '#508898'; // optimal (accent)
  if (pct <= 200) return '#906070'; // high (accent-text)
  return '#f97316';                 // excess
}

export default function DVComposite({ range, overallAvg, composite, topGaps, heatmap, loading }: Props) {
  const [expanded, setExpanded] = useState(false);

  const trendData = useMemo(
    () => composite.map((p) => ({ ...p, label: formatDate(p.date, range) })),
    [composite, range]
  );

  const dates = useMemo(() => composite.map((p) => p.date), [composite]);
  const hasData = composite.some((p) => p.score !== null);

  // Sort heatmap compounds by average (worst first for urgency)
  const sortedHeatmap = useMemo(() => {
    return [...heatmap].sort((a, b) => {
      const avgA = Object.values(a.valuesByDate);
      const avgB = Object.values(b.valuesByDate);
      const meanA = avgA.length ? avgA.reduce((x, y) => x + y, 0) / avgA.length : 0;
      const meanB = avgB.length ? avgB.reduce((x, y) => x + y, 0) / avgB.length : 0;
      return meanA - meanB;
    });
  }, [heatmap]);

  return (
    <section className="dv-card">
      <header className="card-header">
        <div className="card-title-row">
          <h2 className="card-title">Daily Value Coverage</h2>
          <span className="card-meta">
            {overallAvg !== null ? `${Math.round(overallAvg)}% avg` : 'No data'}
          </span>
        </div>
        <button
          className="expand-btn"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          disabled={!hasData}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </header>

      {!loading && hasData && (
        <div className="hero-score">
          <div className="hero-num">{overallAvg !== null ? Math.round(overallAvg) : '--'}<span className="hero-pct">%</span></div>
          <div className="hero-label">Average coverage across the period</div>
        </div>
      )}

      {topGaps.length > 0 && (
        <div className="gaps-section">
          <p className="gaps-title">Top gaps</p>
          <div className="gaps-list">
            {topGaps.map((gap) => (
              <div key={gap.id} className="gap-row">
                <span className="gap-name">{gap.name}</span>
                <div className="gap-bar">
                  <div className="gap-bar-fill" style={{ width: `${Math.min(gap.avgPct, 100)}%` }} />
                </div>
                <span className="gap-pct">{Math.round(gap.avgPct)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="placeholder">Loading...</div>}
      {!loading && !hasData && (
        <div className="placeholder">
          No DV coverage data for this range — log meals on the analysis page to track your nutrients.
        </div>
      )}

      {expanded && hasData && (
        <div className="expanded">
          <div className="expanded-subsection">
            <p className="subsection-title">Coverage trend</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
                <CartesianGrid stroke="var(--border, #1e1e24)" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--text-3, #484860)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border, #1e1e24)' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fill: 'var(--text-3, #484860)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border, #1e1e24)' }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-soft, #101014)',
                    border: '1px solid var(--border, #1e1e24)',
                    borderRadius: 3,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: 'var(--text-2, #8080a0)', fontSize: 11 }}
                  itemStyle={{ color: 'var(--text-1, #e8e8f4)' }}
                  formatter={(v: any) => [v !== null ? `${Math.round(v)}%` : '—', 'Coverage']}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--accent, #508898)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--accent, #508898)' }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="expanded-subsection">
            <div className="heatmap-header">
              <p className="subsection-title">Per-compound heatmap</p>
              <div className="heatmap-legend">
                <span><i style={{ background: '#b44848' }} /> &lt;50%</span>
                <span><i style={{ background: '#b49648' }} /> 50-80%</span>
                <span><i style={{ background: '#508898' }} /> 80-120%</span>
                <span><i style={{ background: '#906070' }} /> 120-200%</span>
                <span><i style={{ background: '#f97316' }} /> &gt;200%</span>
              </div>
            </div>

            <div className="heatmap-wrap">
              <div className="heatmap">
                {sortedHeatmap.map((compound) => (
                  <div key={compound.id} className="heatmap-row">
                    <div className="heatmap-label" title={compound.name}>{compound.name}</div>
                    <div className="heatmap-cells">
                      {dates.map((date) => {
                        const pct = compound.valuesByDate[date];
                        return (
                          <div
                            key={date}
                            className="heatmap-cell"
                            style={{ background: pctColor(pct) }}
                            title={`${compound.name} — ${date}: ${pct !== undefined ? Math.round(pct) + '%' : 'no data'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dv-card {
          background: var(--bg-soft, #101014);
          border: 1px solid var(--border, #1e1e24);
          border-radius: 3px;
          padding: 20px 24px;
          margin-bottom: 20px;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .card-title-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .card-title {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 14px;
          font-weight: 500;
          margin: 0;
          color: var(--text-1, #e8e8f4);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .card-meta {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 12px;
          color: var(--text-3, #484860);
        }

        .expand-btn {
          background: transparent;
          border: 1px solid var(--border, #1e1e24);
          color: var(--text-2, #8080a0);
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 3px;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }

        .expand-btn:hover:not(:disabled) {
          border-color: var(--accent-border, rgba(80,136,152,0.14));
          color: var(--text-1, #e8e8f4);
        }

        .expand-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .hero-score {
          text-align: center;
          padding: 12px 0 20px;
        }

        .hero-num {
          font-family: var(--font-display, 'Instrument Serif', serif);
          font-size: 64px;
          line-height: 1;
          color: var(--text-1, #e8e8f4);
        }

        .hero-pct {
          font-size: 32px;
          color: var(--text-3, #484860);
          margin-left: 4px;
        }

        .hero-label {
          font-size: 11px;
          color: var(--text-3, #484860);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 6px;
        }

        .gaps-section {
          padding-top: 16px;
          border-top: 1px solid var(--border, #1e1e24);
        }

        .gaps-title {
          font-size: 10px;
          font-weight: 500;
          color: var(--text-3, #484860);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin: 0 0 10px 0;
        }

        .gaps-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .gap-row {
          display: grid;
          grid-template-columns: 1fr 2fr auto;
          align-items: center;
          gap: 12px;
        }

        .gap-name {
          font-size: 13px;
          color: var(--text-1, #e8e8f4);
        }

        .gap-bar {
          height: 6px;
          background: var(--border, #1e1e24);
          border-radius: 3px;
          overflow: hidden;
        }

        .gap-bar-fill {
          height: 100%;
          background: #b44848;
          border-radius: 3px;
        }

        .gap-pct {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 12px;
          color: var(--text-2, #8080a0);
          min-width: 40px;
          text-align: right;
        }

        .placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 120px;
          color: var(--text-3, #484860);
          font-size: 13px;
          text-align: center;
          padding: 20px;
        }

        .expanded {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border, #1e1e24);
        }

        .expanded-subsection {
          margin-bottom: 24px;
        }

        .subsection-title {
          font-size: 10px;
          font-weight: 500;
          color: var(--text-3, #484860);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin: 0 0 12px 0;
        }

        .heatmap-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .heatmap-legend {
          display: flex;
          gap: 12px;
          font-size: 10px;
          color: var(--text-3, #484860);
        }

        .heatmap-legend span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .heatmap-legend i {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          display: inline-block;
        }

        .heatmap-wrap {
          overflow-x: auto;
        }

        .heatmap {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 100%;
        }

        .heatmap-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .heatmap-label {
          flex: 0 0 140px;
          font-size: 11px;
          color: var(--text-2, #8080a0);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .heatmap-cells {
          display: flex;
          gap: 2px;
          flex: 1;
        }

        .heatmap-cell {
          flex: 1;
          min-width: 8px;
          height: 14px;
          border-radius: 2px;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .heatmap-cell:hover {
          opacity: 0.7;
        }
      `}</style>
    </section>
  );
}
