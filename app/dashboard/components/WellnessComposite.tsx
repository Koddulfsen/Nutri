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

interface CompositePoint { date: string; value: number | null; count: number }
interface SymptomSeries {
  id: string;
  name: string;
  category: string;
  series: Array<{ date: string; value: number | null }>;
}

interface Props {
  range: DateRange;
  composite: CompositePoint[];
  perSymptom: SymptomSeries[];
  loading: boolean;
}

function formatDate(d: string, range: DateRange): string {
  const date = new Date(d);
  if (range === '7d') {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function averageScore(series: Array<{ value: number | null }>): number | null {
  const vals = series.map((p) => p.value).filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export default function WellnessComposite({ range, composite, perSymptom, loading }: Props) {
  const [expanded, setExpanded] = useState(false);

  const chartData = useMemo(
    () => composite.map((p) => ({ ...p, label: formatDate(p.date, range) })),
    [composite, range]
  );

  const overallAverage = useMemo(() => averageScore(composite), [composite]);
  const hasData = composite.some((p) => p.value !== null);

  return (
    <section className="wellness-card">
      <header className="card-header">
        <div className="card-title-row">
          <h2 className="card-title">Wellness</h2>
          <span className="card-meta">
            {hasData
              ? `Avg ${overallAverage !== null ? overallAverage.toFixed(1) : '--'} / 10`
              : 'No data yet'}
          </span>
        </div>
        <button
          className="expand-btn"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          disabled={perSymptom.length === 0}
        >
          {expanded ? 'Collapse' : `Expand (${perSymptom.length})`}
        </button>
      </header>

      <div className="chart-wrap">
        {loading ? (
          <div className="placeholder">Loading...</div>
        ) : !hasData ? (
          <div className="placeholder">
            No wellness data for this range — log a symptom on the analysis page to get started.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
              <CartesianGrid stroke="var(--border, #1e1e24)" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-3, #484860)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border, #1e1e24)' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
                tick={{ fill: 'var(--text-3, #484860)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border, #1e1e24)' }}
                tickLine={false}
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
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--border, #1e1e24)"
                strokeWidth={4}
                dot={{ r: 4, fill: 'rgba(80, 136, 152, 0.5)', stroke: 'none' }}
                activeDot={{ r: 6, fill: 'rgba(80, 136, 152, 0.85)', stroke: 'none' }}
                connectNulls
                name="Composite"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {expanded && perSymptom.length > 0 && (
        <div className="sparkline-grid">
          {perSymptom.map((s) => {
            const avg = averageScore(s.series);
            const seriesData = s.series.map((p) => ({ ...p, label: formatDate(p.date, range) }));
            return (
              <div key={s.id} className="sparkline-cell">
                <div className="sparkline-header">
                  <span className="sparkline-name">{s.name}</span>
                  <span className="sparkline-avg">
                    {avg !== null ? avg.toFixed(1) : '--'}
                  </span>
                </div>
                <div className="sparkline-chart">
                  <ResponsiveContainer width="100%" height={60}>
                    <LineChart data={seriesData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                      <YAxis domain={[0, 10]} hide />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--border, #1e1e24)"
                        strokeWidth={3}
                        dot={{ r: 2, fill: 'rgba(80, 136, 152, 0.5)', stroke: 'none' }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .wellness-card {
          background: var(--bg-soft, #101014);
          border: 1px solid var(--border, #1e1e24);
          border-radius: 3px;
          padding: 20px 24px;
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

        .expand-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .chart-wrap {
          min-height: 260px;
        }

        .placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 260px;
          color: var(--text-3, #484860);
          font-size: 13px;
          text-align: center;
          padding: 0 32px;
        }

        .sparkline-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border, #1e1e24);
        }

        .sparkline-cell {
          background: var(--bg, #0a0a0c);
          border: 1px solid var(--border, #1e1e24);
          border-radius: 3px;
          padding: 10px 12px;
        }

        .sparkline-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .sparkline-name {
          font-size: 12px;
          color: var(--text-2, #8080a0);
          font-weight: 500;
        }

        .sparkline-avg {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 12px;
          color: var(--accent, #508898);
        }

        .sparkline-chart {
          height: 60px;
        }
      `}</style>
    </section>
  );
}
