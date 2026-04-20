'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { apiUrl } from '@/lib/utils/base-path';
import AnalysisHeader from '@/app/components/navigation/AnalysisHeader';
import WellnessComposite from './components/WellnessComposite';
import DVComposite from './components/DVComposite';

export type DateRange = '7d' | '30d' | '90d' | 'all';

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'all', label: 'All' },
];

interface CompositePoint { date: string; value: number | null; count: number }
interface SymptomSeries { id: string; name: string; category: string; series: Array<{ date: string; value: number | null }> }

interface WellnessData {
  range: DateRange;
  startDate: string | null;
  endDate: string;
  composite: CompositePoint[];
  perSymptom: SymptomSeries[];
}

interface DVData {
  range: DateRange;
  startDate: string | null;
  endDate: string;
  overallAvg: number | null;
  composite: Array<{ date: string; score: number | null; compoundCount: number }>;
  topGaps: Array<{ id: string; name: string; avgPct: number }>;
  heatmap: Array<{ id: string; name: string; valuesByDate: Record<string, number> }>;
}

export default function DashboardClient({ user }: { user: User }) {
  const [range, setRange] = useState<DateRange>('30d');
  const [wellness, setWellness] = useState<WellnessData | null>(null);
  const [dv, setDv] = useState<DVData | null>(null);
  const [wellnessLoading, setWellnessLoading] = useState(false);
  const [dvLoading, setDvLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadWellness() {
      setWellnessLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/dashboard/wellness-trend?range=${range}`));
        if (!res.ok) throw new Error('Failed to fetch');
        const data: WellnessData = await res.json();
        if (!cancelled) setWellness(data);
      } catch (err) {
        console.error('Wellness trend fetch failed:', err);
        if (!cancelled) setWellness(null);
      } finally {
        if (!cancelled) setWellnessLoading(false);
      }
    }

    async function loadDV() {
      setDvLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/dashboard/dv-composite?range=${range}`));
        if (!res.ok) throw new Error('Failed to fetch');
        const data: DVData = await res.json();
        if (!cancelled) setDv(data);
      } catch (err) {
        console.error('DV composite fetch failed:', err);
        if (!cancelled) setDv(null);
      } finally {
        if (!cancelled) setDvLoading(false);
      }
    }

    loadWellness();
    loadDV();
    return () => { cancelled = true; };
  }, [range]);

  return (
    <div className="dashboard-page">
      <AnalysisHeader user={{
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
      }} />
      <header className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="range-picker" role="tablist" aria-label="Date range">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`range-btn ${range === opt.value ? 'active' : ''}`}
              onClick={() => setRange(opt.value)}
              role="tab"
              aria-selected={range === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      <main className="dashboard-main">
        <DVComposite
          range={range}
          overallAvg={dv?.overallAvg ?? null}
          composite={dv?.composite || []}
          topGaps={dv?.topGaps || []}
          heatmap={dv?.heatmap || []}
          loading={dvLoading}
        />
        <WellnessComposite
          range={range}
          composite={wellness?.composite || []}
          perSymptom={wellness?.perSymptom || []}
          loading={wellnessLoading}
        />
      </main>

      <style jsx>{`
        .dashboard-page {
          min-height: 100vh;
          background: var(--bg, #0a0a0c);
          color: var(--text-1, #e8e8f4);
          font-family: var(--font-body, 'DM Sans', sans-serif);
        }

        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 32px;
          border-bottom: 1px solid var(--border, #1e1e24);
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-title {
          font-family: var(--font-display, 'Instrument Serif', serif);
          font-size: 32px;
          font-weight: 400;
          margin: 0;
          color: var(--text-1, #e8e8f4);
        }

        .range-picker {
          display: flex;
          gap: 4px;
          background: var(--surface, #0e0e12);
          border: 1px solid var(--border, #1e1e24);
          border-radius: 3px;
          padding: 3px;
        }

        .range-btn {
          background: transparent;
          border: none;
          color: var(--text-3, #484860);
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
          padding: 6px 14px;
          border-radius: 3px;
          cursor: pointer;
          transition: color 0.15s, background 0.15s;
        }

        .range-btn:hover {
          color: var(--text-1, #e8e8f4);
        }

        .range-btn.active {
          background: var(--accent-soft, rgba(80,136,152,0.1));
          color: var(--accent, #508898);
        }

        .dashboard-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding: 20px 16px;
          }
          .dashboard-main {
            padding: 20px 16px;
          }
        }
      `}</style>
    </div>
  );
}
