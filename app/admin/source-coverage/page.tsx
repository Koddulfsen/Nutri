'use client';

/**
 * Source Coverage (v2) — compound-centric inverse of source-inspect.
 *
 * Lists every Nutri core compound and what mapping(s) (if any) the selected
 * source provides. Surface gaps (no mapping), multi-mappings (>1 active), and
 * flagged mappings at a glance.
 */

import React, { useState, useEffect, useCallback } from 'react';
import AnalysisHeader from '@/app/components/navigation/AnalysisHeader';
import { apiUrl } from '@/lib/utils/base-path';

const SUPPORTED_SOURCES = [
  'AFCD', 'ASEANFOODS', 'BLS', 'CIQUAL', 'CNF', 'DUKE', 'FDC', 'FINELI', 'FOODB', 'FOODFILES',
  'FRIDA', 'INDB', 'KFCT', 'MATVARETABELLEN', 'MEXT', 'NEVO', 'UK_COFID',
];

const TYPE_ORDER = [
  'MACRONUTRIENT', 'VITAMIN', 'MINERAL', 'AMINO_ACID', 'FATTY_ACID',
  'CARBOHYDRATE', 'STEROL', 'HEAVY_METAL', 'ORGANIC_ACID', 'ALKALOID',
  'CAROTENOID', 'POLYPHENOL', 'GLUCOSINOLATE', 'TERPENOID', 'NUCLEOTIDE',
  'ANTI_NUTRIENT', 'SYNTHETIC_ADDITIVE',
];

interface Mapping {
  csId: string;
  externalId: string;
  ourSourceName: string | null;
  ourSourceUnit: string | null;
  conversionFactor: string | null;
  actualName: string | null;
  actualUnit: string | null;
  resolved: boolean;
  status: string;
  notes: string | null;
}

interface Compound {
  compoundId: string;
  name: string;
  unit: string;
  type: string;
  mappings: Mapping[];
}

interface Stats {
  totalCompounds: number;
  mapped: number;
  gaps: number;
  multiMapped: number;
  totalMappings: number;
  verified: number;
  review: number;
  flagged: number;
  unverified: number;
}

export default function SourceCoveragePage() {
  const [source, setSource] = useState<string>('');
  const [compounds, setCompounds] = useState<Compound[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ step: string; detail: string; percent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (s: string) => {
    if (!s) return;
    setLoading(true);
    setError(null);
    setProgress({ step: 'init', detail: 'Connecting…', percent: 0 });
    setCompounds([]);
    setStats(null);

    try {
      const res = await fetch(apiUrl(`/api/admin/source-coverage?source=${s}&stream=true`));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error('No stream body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = JSON.parse(line.slice(6));
          if (data.type === 'progress') {
            setProgress({ step: data.step, detail: data.detail, percent: data.percent });
          } else if (data.type === 'complete') {
            setCompounds(data.compounds || []);
            setStats(data.stats || null);
            setProgress(null);
          } else if (data.type === 'error') {
            throw new Error(data.error);
          }
        }
      }
    } catch (e: any) {
      setError(e.message || 'Load failed');
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (source) load(source); }, [source, load]);

  // Group by compound_type
  const byType = new Map<string, Compound[]>();
  for (const c of compounds) {
    if (!byType.has(c.type)) byType.set(c.type, []);
    byType.get(c.type)!.push(c);
  }
  const orderedTypes = TYPE_ORDER.filter(t => byType.has(t));

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text-1)' }}>
      <AnalysisHeader />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 4 }}>
            Source Coverage
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13 }}>
            Compound-centric view: every core Nutri compound and what the selected source provides.
            <span style={{ marginLeft: 12, color: 'var(--text-3)' }}>
              <a href="/admin/source-inspect" style={{ color: 'var(--accent)' }}>← back to source-inspect (mapping-centric)</a>
              {' • '}
              <span style={{ opacity: 0.5 }}>cross-source matrix (later)</span>
            </span>
          </p>
        </div>

        <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ fontSize: 13, color: 'var(--text-2)' }}>Source:</label>
          <select
            value={source}
            onChange={e => setSource(e.target.value)}
            style={{
              background: 'var(--surface)',
              color: 'var(--text-1)',
              border: '1px solid var(--border)',
              borderRadius: 3,
              padding: '6px 10px',
              fontSize: 13,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            <option value="">— pick a source —</option>
            {SUPPORTED_SOURCES.map(s => (
              <option key={s} value={s} style={{ background: 'var(--bg)' }}>{s}</option>
            ))}
          </select>
          {error && <span style={{ fontSize: 12, color: 'var(--warn)' }}>{error}</span>}
        </div>

        {progress && (
          <div style={{ marginBottom: 20, padding: 12, background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', borderRadius: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginRight: 8 }}>[{progress.step}]</code>
                {progress.detail}
              </span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>{progress.percent}%</span>
            </div>
            <div style={{ height: 4, background: 'var(--surface)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${progress.percent}%`,
                height: '100%',
                background: 'var(--accent)',
                transition: 'width 200ms ease-out',
              }} />
            </div>
          </div>
        )}

        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 8,
            marginBottom: 24,
            padding: 16,
            background: 'var(--bg-soft)',
            border: '1px solid var(--border-soft)',
            borderRadius: 3,
          }}>
            <Stat label="core compounds" value={stats.totalCompounds} />
            <Stat label="mapped" value={stats.mapped} accent />
            <Stat label="gaps" value={stats.gaps} warn={stats.gaps > 0} />
            <Stat label="multi-mapped" value={stats.multiMapped} warn={stats.multiMapped > 0} />
            <Stat label="total mappings" value={stats.totalMappings} />
            <Stat label="verified" value={stats.verified} accent={stats.verified > 0} />
            <Stat label="unverified" value={stats.unverified} />
            <Stat label="review" value={stats.review} />
            <Stat label="flagged" value={stats.flagged} muted />
          </div>
        )}

        {orderedTypes.map(type => {
          const list = byType.get(type)!;
          return (
            <section key={type} style={{ marginBottom: 28 }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                marginBottom: 8,
                paddingBottom: 4,
                borderBottom: '1px solid var(--border-soft)',
                color: 'var(--accent-text)',
              }}>
                {type} <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6 }}>({list.length})</span>
              </h2>
              <div>
                {list.map(c => (
                  <CompoundRow key={c.compoundId} compound={c} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, accent, warn, muted }: { label: string; value: number; accent?: boolean; warn?: boolean; muted?: boolean }) {
  let color = 'var(--text-1)';
  if (accent) color = 'var(--accent)';
  if (warn) color = 'var(--warn)';
  if (muted) color = 'var(--text-3)';
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function CompoundRow({ compound }: { compound: Compound }) {
  const activeMappings = compound.mappings.filter(m => m.status !== 'flagged');
  const isMultiMapped = activeMappings.length > 1;
  const hasNoMapping = compound.mappings.length === 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      gap: 12,
      padding: '8px 0',
      borderBottom: '1px solid var(--border-soft)',
      fontSize: 13,
    }}>
      <div>
        <div style={{ fontWeight: 500 }}>{compound.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{compound.unit}</div>
      </div>
      <div>
        {hasNoMapping && (
          <div style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>— no mapping</div>
        )}
        {compound.mappings.map(m => (
          <MappingPill key={m.csId} mapping={m} />
        ))}
        {isMultiMapped && (
          <div style={{ fontSize: 10, color: 'var(--warn)', marginTop: 4 }}>
            ⚠ {activeMappings.length} active mappings
          </div>
        )}
      </div>
    </div>
  );
}

function MappingPill({ mapping }: { mapping: Mapping }) {
  const statusColor: Record<string, string> = {
    verified: 'var(--accent)',
    review: 'var(--warn)',
    flagged: 'var(--text-3)',
    unverified: 'var(--text-2)',
  };
  const statusBg: Record<string, string> = {
    verified: 'var(--accent-soft)',
    review: 'rgba(249,115,22,0.08)',
    flagged: 'transparent',
    unverified: 'transparent',
  };
  const opacity = mapping.status === 'flagged' ? 0.55 : 1;
  return (
    <div style={{
      padding: '4px 8px',
      marginBottom: 3,
      borderRadius: 3,
      background: statusBg[mapping.status],
      borderLeft: `2px solid ${statusColor[mapping.status]}`,
      opacity,
      display: 'grid',
      gridTemplateColumns: '120px 1fr 80px 90px',
      gap: 8,
      fontSize: 12,
      alignItems: 'center',
    }}>
      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{mapping.externalId}</code>
      <div style={{ color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {mapping.actualName || mapping.ourSourceName || '— (no match)'}
      </div>
      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
        {mapping.actualUnit || mapping.ourSourceUnit || '—'}
        {mapping.conversionFactor && mapping.conversionFactor !== '1.0' && (
          <span style={{ marginLeft: 4, opacity: 0.7 }}>×{mapping.conversionFactor}</span>
        )}
      </code>
      <span style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: statusColor[mapping.status],
        textAlign: 'right',
      }}>
        {mapping.status}
      </span>
    </div>
  );
}
