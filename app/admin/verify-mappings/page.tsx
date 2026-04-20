'use client';

import { useState, useEffect, useCallback } from 'react';
import AnalysisHeader from '@/app/components/navigation/AnalysisHeader';
import { apiUrl } from '@/lib/utils/base-path';

// ---------- Types ----------

type PageMode = 'coverage' | 'verify';

interface SourceCoverage {
  source: string;
  totalCompounds: number;
  coveredCompounds: number;
  foodCount: number;
  compoundFoodCounts: number[]; // sorted desc, one entry per covered compound
}

interface CompoundCoverage {
  name: string;
  type: string;
  externalId: string;
  foodCount: number;
}

interface VerifyStats {
  total: number;
  verified: number;
  flagged: number;
  unverified: number;
  compoundCount?: number;
}

interface SourceMapping {
  id: string;
  externalSource: string;
  rawSource: string;
  externalId: string;
  ourName: string | null;
  actualName: string | null;
  actualUnit: string | null;
  namesMatch: boolean | null;
  sourceUnit: string | null;
  conversionFactor: string;
  isCanonical: boolean;
  verification: {
    status: 'verified' | 'flagged' | 'unverified';
    notes: string | null;
    verifiedAt: string | null;
  };
}

interface FoodValueRow {
  foodId: string;
  foodName: string;
  average: number;
  unit: string;
  sourceCount: number;
  sourceValues: Record<string, number>;
}

interface CompoundCard {
  id: string;
  name: string;
  unit: string;
  type: string;
  mappingStats: { total: number; verified: number; flagged: number; unverified: number };
  sourceMappings: SourceMapping[];
  foodValues: FoodValueRow[];
}

// ---------- Component ----------

export default function VerifyMappingsPage() {
  const [mode, setMode] = useState<PageMode>('coverage');

  // Coverage state
  const [sources, setSources] = useState<SourceCoverage[]>([]);
  const [totalFoods, setTotalFoods] = useState(0);
  const [coverageLoading, setCoverageLoading] = useState(true);
  const [coverageStep, setCoverageStep] = useState('');
  const [coveragePercent, setCoveragePercent] = useState(0);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [compoundDetail, setCompoundDetail] = useState<CompoundCoverage[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [threshold, setThreshold] = useState(1);

  // Verify state
  const [stats, setStats] = useState<VerifyStats | null>(null);
  const [compound, setCompound] = useState<CompoundCard | null>(null);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flagNotes, setFlagNotes] = useState('');
  const [flagMappingId, setFlagMappingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('unverified');
  const [sourceFilter, setSourceFilter] = useState<string>('');

  // ========== Coverage Mode ==========

  const fetchCoverage = useCallback(async () => {
    setCoverageLoading(true);
    setCoverageStep('Connecting...');
    setCoveragePercent(0);
    setSources([]);
    try {
      const res = await fetch(apiUrl('/api/admin/mapping-coverage?stream=true'), { credentials: 'same-origin' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${res.status}`);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'progress') {
              setCoverageStep(event.detail);
              setCoveragePercent(event.percent);
            } else if (event.type === 'source') {
              // Append each source as it arrives (dedupe by name)
              setSources(prev => {
                if (prev.some(s => s.source === event.source.source)) return prev;
                return [...prev, event.source];
              });
            } else if (event.type === 'complete') {
              setSources(event.sources);
              setTotalFoods(event.totalFoods);
              setCoveragePercent(100);
            } else if (event.type === 'error') {
              throw new Error(event.error);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCoverageLoading(false);
      setCoverageStep('');
      setCoveragePercent(0);
    }
  }, []);

  useEffect(() => {
    fetchCoverage();
  }, [fetchCoverage]);

  const fetchSourceDetail = async (source: string) => {
    if (expandedSource === source) {
      setExpandedSource(null);
      return;
    }
    setExpandedSource(source);
    setDetailLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/mapping-coverage?source=${source}`));
      const data = await res.json();
      setCompoundDetail(data.compounds);
    } catch {
      setCompoundDetail([]);
    } finally {
      setDetailLoading(false);
    }
  };

  // ========== Verify Mode ==========

  const fetchCompound = useCallback(async (newOffset: number) => {
    setVerifyLoading(true);
    setFlagMappingId(null);
    setFlagNotes('');
    setLoadingStep('Connecting...');
    setLoadingPercent(0);
    try {
      const params = new URLSearchParams({
        offset: String(newOffset),
        limit: '1',
        stream: 'true',
      });
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (sourceFilter) params.set('source', sourceFilter);

      const res = await fetch(apiUrl(`/api/admin/verify-compounds?${params}`));
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'progress') {
              setLoadingStep(event.detail);
              setLoadingPercent(event.percent);
            } else if (event.type === 'stats') {
              setStats(event.stats);
            } else if (event.type === 'complete') {
              setFilteredTotal(event.filteredTotal);
              setCompound(event.compound ?? null);
              setOffset(newOffset);
              setLoadingPercent(100);
            } else if (event.type === 'error') {
              throw new Error(event.error);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifyLoading(false);
      setLoadingStep('');
      setLoadingPercent(0);
    }
  }, [typeFilter, statusFilter, sourceFilter]);

  const startVerification = () => {
    setMode('verify');
    fetchCompound(0);
  };

  const backToCoverage = () => {
    setMode('coverage');
    setCompound(null);
    setStats(null);
  };

  // Verify a single mapping row
  const verifyMapping = async (mappingId: string) => {
    setSaving(true);
    try {
      await fetch(apiUrl('/api/admin/verify-mappings'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compoundSourceId: mappingId, status: 'verified' }),
      });
      // Update local state instead of re-fetching
      setCompound(prev => {
        if (!prev) return prev;
        const updated = prev.sourceMappings.map(m =>
          m.id === mappingId ? { ...m, verification: { ...m.verification, status: 'verified' as const } } : m
        );
        const verified = updated.filter(m => m.verification.status === 'verified').length;
        const flagged = updated.filter(m => m.verification.status === 'flagged').length;
        return {
          ...prev,
          sourceMappings: updated,
          mappingStats: { ...prev.mappingStats, verified, flagged, unverified: updated.length - verified - flagged },
        };
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Flag a single mapping row
  const flagMapping = async (mappingId: string) => {
    if (flagMappingId !== mappingId) {
      setFlagMappingId(mappingId);
      setFlagNotes('');
      return;
    }
    setSaving(true);
    try {
      await fetch(apiUrl('/api/admin/verify-mappings'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compoundSourceId: mappingId, status: 'flagged', notes: flagNotes || null }),
      });
      setCompound(prev => {
        if (!prev) return prev;
        const updated = prev.sourceMappings.map(m =>
          m.id === mappingId ? { ...m, verification: { ...m.verification, status: 'flagged' as const, notes: flagNotes || null } } : m
        );
        const verified = updated.filter(m => m.verification.status === 'verified').length;
        const flagged = updated.filter(m => m.verification.status === 'flagged').length;
        return {
          ...prev,
          sourceMappings: updated,
          mappingStats: { ...prev.mappingStats, verified, flagged, unverified: updated.length - verified - flagged },
        };
      });
      setFlagMappingId(null);
      setFlagNotes('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Batch verify all unverified mappings on current card
  const batchVerify = async () => {
    if (!compound) return;
    const unverified = compound.sourceMappings.filter(m => m.verification.status === 'unverified');
    if (unverified.length === 0) return;
    setSaving(true);
    try {
      await Promise.all(unverified.map(m =>
        fetch(apiUrl('/api/admin/verify-mappings'), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ compoundSourceId: m.id, status: 'verified' }),
        })
      ));
      setCompound(prev => {
        if (!prev) return prev;
        const updated = prev.sourceMappings.map(m =>
          m.verification.status === 'unverified'
            ? { ...m, verification: { ...m.verification, status: 'verified' as const } }
            : m
        );
        const verified = updated.filter(m => m.verification.status === 'verified').length;
        const flagged = updated.filter(m => m.verification.status === 'flagged').length;
        return {
          ...prev,
          sourceMappings: updated,
          mappingStats: { ...prev.mappingStats, verified, flagged, unverified: 0 },
        };
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const skip = () => fetchCompound(offset + 1);
  const goBack = () => { if (offset > 0) fetchCompound(offset - 1); };

  // Keyboard shortcuts (verify mode only)
  useEffect(() => {
    if (mode !== 'verify') return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (saving || verifyLoading) return;
      if (e.key === 'ArrowRight' || e.key === 'n') { e.preventDefault(); skip(); }
      else if (e.key === 'ArrowLeft' || e.key === 'p') { e.preventDefault(); goBack(); }
      else if (e.key === 'v') { e.preventDefault(); batchVerify(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // Unique sources for food values matrix columns
  const foodMatrixSources = compound
    ? [...new Set(compound.sourceMappings.map(m => m.externalSource))].sort()
    : [];

  // ========== Render ==========

  // Helper: count compounds meeting threshold for a source
  const meetsThreshold = (counts: number[]) => counts.filter(c => c >= threshold).length;

  // Compute coverage summary (threshold-aware)
  const totalMapped = sources.reduce((s, c) => s + c.totalCompounds, 0);
  const totalCovered = sources.reduce((s, c) => s + meetsThreshold(c.compoundFoodCounts), 0);
  const overallPct = totalMapped > 0 ? Math.round((totalCovered / totalMapped) * 100) : 0;

  // Max food count across all sources (for reference)
  const maxFoodCount = Math.max(1, ...sources.flatMap(s => s.compoundFoodCounts));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <AnalysisHeader />

      <div className="py-8 px-4 md:px-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {mode === 'coverage' ? 'Mapping Coverage' : 'Verify Mappings'}
            </h1>
            <p className="text-white/60">
              {mode === 'coverage'
                ? 'Compound coverage across sources from foods in the database'
                : 'Review each compound source mapping to confirm correct nutrient ID assignments'}
            </p>
          </div>
          {mode === 'coverage' ? (
            <button
              onClick={startVerification}
              className="px-5 py-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition whitespace-nowrap"
            >
              Start Verification
            </button>
          ) : (
            <button
              onClick={backToCoverage}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/70 text-sm hover:bg-white/15 transition whitespace-nowrap"
            >
              Back to Coverage
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-white/40 hover:text-white/60 ml-4">dismiss</button>
          </div>
        )}

        {/* ========== COVERAGE MODE ========== */}
        {mode === 'coverage' && (
          <>
            {/* Coverage loading progress */}
            {coverageLoading && (
              <div className="mb-6">
                <div className="max-w-md mx-auto">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${coveragePercent}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-white/60">{coverageStep || 'Loading...'}</div>
                    <div className="text-xs text-white/30 mt-1">{coveragePercent}%</div>
                  </div>
                </div>
              </div>
            )}
            {(sources.length > 0 || !coverageLoading) && (
              <>
                {/* Threshold selector + Summary stats */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                    <label className="text-xs text-white/50 whitespace-nowrap">Min foods</label>
                    <select
                      value={threshold}
                      onChange={(e) => setThreshold(parseInt(e.target.value))}
                      className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-400"
                    >
                      {[1, 2, 3, 5, 10, 20].map(n => (
                        <option key={n} value={n}>{n}+</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3 flex-1">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-cyan-400">{totalFoods}</div>
                      <div className="text-xs text-white/60 mt-1">Foods in DB</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-white">{totalCovered}/{totalMapped}</div>
                      <div className="text-xs text-white/60 mt-1">Compounds Ready</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
                      <div className="text-2xl font-bold" style={{
                        color: overallPct > 60 ? '#4ade80' : overallPct > 30 ? '#facc15' : '#f87171'
                      }}>
                        {overallPct}%
                      </div>
                      <div className="text-xs text-white/60 mt-1">Overall Coverage</div>
                    </div>
                  </div>
                </div>

                {/* Source cards */}
                <div className="space-y-2">
                  {sources.map((src) => {
                    const ready = meetsThreshold(src.compoundFoodCounts);
                    const pct = src.totalCompounds > 0
                      ? Math.round((ready / src.totalCompounds) * 100)
                      : 0;
                    const isExpanded = expandedSource === src.source;

                    return (
                      <div key={src.source}>
                        {/* Source card */}
                        <button
                          onClick={() => fetchSourceDetail(src.source)}
                          className={`w-full text-left bg-white/5 rounded-xl border transition hover:bg-white/[0.07] ${
                            isExpanded ? 'border-cyan-500/40 rounded-b-none' : 'border-white/10'
                          }`}
                        >
                          <div className="px-5 py-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-white">{src.source}</span>
                                <span className="text-xs text-white/40">
                                  {src.foodCount} food{src.foodCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-mono" style={{
                                  color: pct > 60 ? '#4ade80' : pct > 30 ? '#facc15' : pct > 0 ? '#f87171' : 'rgba(255,255,255,0.3)'
                                }}>
                                  {ready}/{src.totalCompounds}
                                </span>
                                <span className="text-xs text-white/30">{pct}%</span>
                                <svg
                                  className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  background: pct > 60
                                    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                                    : pct > 30
                                      ? 'linear-gradient(90deg, #eab308, #facc15)'
                                      : pct > 0
                                        ? 'linear-gradient(90deg, #ef4444, #f87171)'
                                        : 'transparent',
                                }}
                              />
                            </div>
                          </div>
                        </button>

                        {/* Expanded compound table */}
                        {isExpanded && (
                          <div className="border border-t-0 border-cyan-500/40 rounded-b-xl bg-white/[0.02] overflow-hidden">
                            {detailLoading ? (
                              <div className="py-8 text-center text-white/40 text-sm">Loading compounds...</div>
                            ) : (
                              <>
                                {/* Detail summary */}
                                <div className="px-5 py-2 border-b border-white/5 flex gap-4 text-xs text-white/40">
                                  <span>{compoundDetail.filter(c => c.foodCount >= threshold).length} compounds with {threshold}+ foods</span>
                                  <span>{compoundDetail.filter(c => c.foodCount > 0 && c.foodCount < threshold).length} below threshold</span>
                                  <span>{compoundDetail.filter(c => c.foodCount === 0).length} no data</span>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                  <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-[#0f0f0f]">
                                      <tr className="text-white/40 text-xs uppercase tracking-wider">
                                        <th className="text-left px-5 py-2">Compound</th>
                                        <th className="text-left px-3 py-2">Type</th>
                                        <th className="text-left px-3 py-2">External ID</th>
                                        <th className="text-right px-5 py-2">Foods</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {compoundDetail.map((c) => {
                                        const meets = c.foodCount >= threshold;
                                        const hasAny = c.foodCount > 0;
                                        return (
                                          <tr
                                            key={c.externalId}
                                            className={`border-t border-white/5 ${
                                              meets ? '' : hasAny ? 'opacity-60' : 'opacity-25'
                                            }`}
                                          >
                                            <td className="px-5 py-2 text-white/80">
                                              {meets && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-2" />}
                                              {c.name}
                                            </td>
                                            <td className="px-3 py-2">
                                              <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                                                {c.type}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2 font-mono text-white/50 text-xs">{c.externalId}</td>
                                            <td className="px-5 py-2 text-right">
                                              {c.foodCount > 0 ? (
                                                <span className={`font-mono ${meets ? 'text-green-400' : 'text-yellow-500/70'}`}>
                                                  {c.foodCount}
                                                </span>
                                              ) : (
                                                <span className="text-white/20">0</span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ========== VERIFY MODE ========== */}
        {mode === 'verify' && (
          <>
            {/* Stats row */}
            {stats && (
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{stats.total}</div>
                  <div className="text-xs text-white/60">Mappings</div>
                </div>
                <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20 text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.verified}</div>
                  <div className="text-xs text-white/60">Verified</div>
                </div>
                <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 text-center">
                  <div className="text-2xl font-bold text-red-400">{stats.flagged}</div>
                  <div className="text-xs text-white/60">Flagged</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{stats.unverified}</div>
                  <div className="text-xs text-white/60">Remaining</div>
                </div>
              </div>
            )}

            {/* Verification progress bar */}
            {stats && stats.total > 0 && (
              <div className="mb-6">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${((stats.verified + stats.flagged) / stats.total) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-white/40 mt-1 text-right">
                  {stats.verified + stats.flagged} / {stats.total} reviewed ({Math.round(((stats.verified + stats.flagged) / stats.total) * 100)}%)
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">All Types</option>
                {['MACRONUTRIENT','VITAMIN','MINERAL','AMINO_ACID','FATTY_ACID','CARBOHYDRATE','POLYPHENOL','CAROTENOID','ALKALOID','SYNTHETIC_ADDITIVE'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">All Statuses</option>
                <option value="unverified">Has Unverified</option>
                <option value="verified">All Verified</option>
                <option value="flagged">Has Flagged</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">All Sources</option>
                {['FDC','CNF','AFCD','UK_COFID','CIQUAL','FINELI','BLS','FRIDA','NEVO','MATVARETABELLEN','FOODFILES','MEXT','KFCT','INDB','ASEANFOODS','FOODB','PHENOL','DUKE'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={() => fetchCompound(0)}
                className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-sm hover:bg-cyan-500/30 transition"
              >
                Apply
              </button>
              <div className="text-sm text-white/40 self-center ml-auto">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">v</kbd> verify all
                {' '}<kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">&larr;</kbd><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">&rarr;</kbd> nav
              </div>
            </div>

            {/* Loading state with progress */}
            {verifyLoading && (
              <div className="py-16 px-4">
                <div className="max-w-md mx-auto">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${loadingPercent}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-white/60">{loadingStep || 'Loading...'}</div>
                    <div className="text-xs text-white/30 mt-1">{loadingPercent}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* No compounds */}
            {!verifyLoading && !compound && stats && (
              <div className="text-center py-20 text-white/50">
                <p className="text-lg mb-2">No compounds match your filters</p>
                <p className="text-sm">Try changing the type, source, or status filter</p>
              </div>
            )}

            {/* Compound Verification Card */}
            {!verifyLoading && compound && (
              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">

                {/* Card header */}
                <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xl font-semibold text-cyan-400">{compound.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/50">{compound.type}</span>
                        <span className="text-sm text-white/60">{compound.unit}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {compound.mappingStats.verified > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                          {compound.mappingStats.verified} verified
                        </span>
                      )}
                      {compound.mappingStats.flagged > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          {compound.mappingStats.flagged} flagged
                        </span>
                      )}
                      {compound.mappingStats.unverified > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          {compound.mappingStats.unverified} unverified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Source mappings table */}
                <div className="border-b border-white/10">
                  <div className="px-6 py-2 text-xs text-white/40 uppercase tracking-wider">Source Mappings</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-white/40 text-xs uppercase tracking-wider border-b border-white/5">
                          <th className="text-left px-4 py-2">Source</th>
                          <th className="text-left px-3 py-2">Ext ID</th>
                          <th className="text-left px-3 py-2">Our Name</th>
                          <th className="text-left px-3 py-2">Actual Name</th>
                          <th className="text-left px-3 py-2">Unit</th>
                          <th className="text-left px-3 py-2">CF</th>
                          <th className="text-center px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compound.sourceMappings.map((m) => (
                          <tr key={m.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                            <td className="px-4 py-2">
                              <span className="font-medium text-white/80">{m.externalSource}</span>
                              {m.isCanonical && <span className="ml-1 text-[10px] text-cyan-400/60">*</span>}
                            </td>
                            <td className="px-3 py-2 font-mono text-white/60 text-xs">{m.externalId}</td>
                            <td className="px-3 py-2 text-white/70 text-xs truncate max-w-[140px]">
                              {m.ourName || <span className="text-white/20 italic">-</span>}
                            </td>
                            <td className={`px-3 py-2 text-xs truncate max-w-[140px] ${
                              m.namesMatch === false
                                ? 'text-red-400 bg-red-500/10'
                                : m.namesMatch === true
                                  ? 'text-green-400/80'
                                  : 'text-white/40'
                            }`}>
                              {m.actualName || <span className="italic">N/A</span>}
                            </td>
                            <td className="px-3 py-2 font-mono text-white/50 text-xs">
                              {m.sourceUnit || m.actualUnit || '-'}
                            </td>
                            <td className={`px-3 py-2 font-mono text-xs ${
                              m.conversionFactor !== '1.0' && m.conversionFactor !== '1'
                                ? 'text-yellow-400' : 'text-white/40'
                            }`}>
                              {m.conversionFactor}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {m.verification.status === 'verified' ? (
                                <button
                                  onClick={() => flagMapping(m.id)}
                                  className="text-green-400 hover:text-green-300 transition"
                                  title="Verified (click to flag)"
                                >&#10003;</button>
                              ) : m.verification.status === 'flagged' ? (
                                <button
                                  onClick={() => verifyMapping(m.id)}
                                  className="text-red-400 hover:text-red-300 transition"
                                  title={`Flagged${m.verification.notes ? ': ' + m.verification.notes : ''} (click to verify)`}
                                >&#9873;</button>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => verifyMapping(m.id)}
                                    disabled={saving}
                                    className="text-white/20 hover:text-green-400 transition disabled:opacity-30"
                                    title="Verify"
                                  >&#10003;</button>
                                  <button
                                    onClick={() => flagMapping(m.id)}
                                    disabled={saving}
                                    className="text-white/20 hover:text-red-400 transition disabled:opacity-30"
                                    title="Flag"
                                  >&#9873;</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Inline flag notes input */}
                  {flagMappingId && (
                    <div className="px-6 py-2 bg-red-500/5 border-t border-red-500/20">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Reason for flagging (optional, press Enter to submit)"
                          value={flagNotes}
                          onChange={(e) => setFlagNotes(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') flagMapping(flagMappingId); if (e.key === 'Escape') { setFlagMappingId(null); setFlagNotes(''); } }}
                          autoFocus
                          className="flex-1 bg-white/10 border border-red-500/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-400"
                        />
                        <button
                          onClick={() => flagMapping(flagMappingId)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-xs hover:bg-red-500/30 transition"
                        >Flag</button>
                        <button
                          onClick={() => { setFlagMappingId(null); setFlagNotes(''); }}
                          className="px-3 py-1.5 text-white/40 text-xs hover:text-white/60 transition"
                        >Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Food values matrix */}
                {compound.foodValues.length > 0 && (
                  <div className="border-b border-white/10">
                    <div className="px-6 py-2 text-xs text-white/40 uppercase tracking-wider">Food Values by Source</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-white/40 text-xs uppercase tracking-wider border-b border-white/5">
                            <th className="text-left px-4 py-2">Food</th>
                            {foodMatrixSources.map(s => (
                              <th key={s} className="text-right px-3 py-2 font-mono">{s}</th>
                            ))}
                            <th className="text-right px-4 py-2 text-cyan-400/60">Avg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {compound.foodValues.map((fv) => (
                            <tr key={fv.foodId} className="border-t border-white/5 hover:bg-white/[0.02]">
                              <td className="px-4 py-2 text-white/80 truncate max-w-[180px]">{fv.foodName}</td>
                              {foodMatrixSources.map(s => {
                                const val = fv.sourceValues[s];
                                const avg = fv.average;
                                const isOutlier = val != null && avg > 0 && (val > avg * 2 || val < avg * 0.5);
                                return (
                                  <td key={s} className={`text-right px-3 py-2 font-mono text-xs ${
                                    val == null ? 'text-white/15' : isOutlier ? 'text-yellow-400 bg-yellow-500/10' : 'text-white/60'
                                  }`}>
                                    {val != null ? val.toFixed(2) : '--'}
                                  </td>
                                );
                              })}
                              <td className="text-right px-4 py-2 font-mono text-xs text-cyan-400">
                                {fv.average.toFixed(2)} {fv.unit}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {compound.foodValues.length === 0 && (
                  <div className="px-6 py-4 border-b border-white/10 text-white/30 text-sm text-center">
                    No foods in database have values for this compound
                  </div>
                )}

                {/* Actions */}
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button onClick={goBack} disabled={offset === 0 || saving}
                      className="px-4 py-2 text-sm text-white/50 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition">
                      &larr; Back
                    </button>
                    <button onClick={skip} disabled={saving}
                      className="px-4 py-2 text-sm text-white/50 hover:text-white/80 disabled:opacity-30 transition">
                      Next &rarr;
                    </button>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="text-sm text-white/40">{offset + 1} / {filteredTotal}</span>
                    {compound.mappingStats.unverified > 0 && (
                      <button onClick={batchVerify} disabled={saving}
                        className="px-5 py-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 text-sm font-medium hover:bg-green-500/30 disabled:opacity-50 transition">
                        Verify All ({compound.mappingStats.unverified})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
