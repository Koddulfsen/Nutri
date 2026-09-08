'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AnalysisHeader from '@/app/components/navigation/AnalysisHeader';
import { apiUrl } from '@/lib/utils/base-path';

const SUPPORTED_SOURCES = [
  'AFCD', 'ASEANFOODS', 'BLS', 'CIQUAL', 'CNF', 'DUKE', 'FDC', 'FINELI', 'FOODB', 'FOODFILES',
  'FRIDA', 'INDB', 'KFCT', 'MATVARETABELLEN', 'MEXT', 'NEVO', 'UK_COFID',
];

const COMPOUND_TYPES = [
  'MACRONUTRIENT', 'VITAMIN', 'MINERAL', 'AMINO_ACID', 'NUCLEOTIDE',
  'FATTY_ACID', 'CARBOHYDRATE', 'POLYPHENOL', 'CAROTENOID', 'ALKALOID',
  'GLUCOSINOLATE', 'TERPENOID', 'STEROL', 'ORGANIC_ACID', 'ANTI_NUTRIENT',
  'HEAVY_METAL', 'MYCOTOXIN', 'PESTICIDE_RESIDUE', 'PLASTICIZER',
  'PROCESSING_COMPOUND', 'SYNTHETIC_ADDITIVE',
];

interface Mapping {
  csId: string;
  compoundId: string;
  compoundName: string;
  compoundUnit: string;
  compoundType: string;
  externalId: string;
  ourSourceName: string | null;
  ourSourceUnit: string | null;
  conversionFactor: string;
  actualName: string | null;
  actualUnit: string | null;
  resolved: boolean;
  verificationStatus: 'verified' | 'review' | 'flagged' | 'unverified';
  verificationNotes: string | null;
}

interface Stats {
  total: number; resolved: number; broken: number;
  verified: number; review: number; flagged: number; unverified: number;
}

interface SearchResult { id: string; name: string; unit: string | null; }

const UNIT_SYNONYMS: Record<string, string> = {
  g: 'g', mg: 'mg', 'μg': 'ug', 'µg': 'ug', ug: 'ug', mcg: 'ug',
  iu: 'iu', kcal: 'kcal', kj: 'kj',
};
function normalizeUnit(u: string | null | undefined): string {
  if (!u) return '';
  return UNIT_SYNONYMS[u.toLowerCase().trim().replace(/µ|μ/g, 'u')] ?? u.toLowerCase().trim();
}
function suggestCF(ourUnit: string, sourceUnit: string | null): string {
  if (!sourceUnit) return '1.0';
  const o = normalizeUnit(ourUnit), s = normalizeUnit(sourceUnit);
  if (!o || !s || o === s) return '1.0';
  const map: Record<string, string> = {
    'mg->g': '0.001', 'g->mg': '1000',
    'ug->g': '0.000001', 'g->ug': '1000000',
    'ug->mg': '0.001', 'mg->ug': '1000',
    'kj->kcal': '0.239', 'kcal->kj': '4.184',
  };
  return map[`${s}->${o}`] ?? '?';
}

export default function SourceInspectPage() {
  const [source, setSource] = useState<string>('AFCD');
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'broken' | 'resolved'>('all');

  // Per-row expansion: 'fix' (search panel) or 'edit' (compound editor)
  const [expanded, setExpanded] = useState<{ csId: string; mode: 'fix' | 'edit' } | null>(null);

  // Search panel state (per current expansion)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Compound edit panel state
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSource = useCallback(async (src: string) => {
    setLoading(true); setError(null); setExpanded(null);
    try {
      const res = await fetch(apiUrl(`/api/admin/source-inspect?source=${src}`), { credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMappings(data.mappings); setStats(data.stats);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSource(source); }, [source, fetchSource]);

  const visible = mappings.filter(m =>
    filter === 'all' ? true : filter === 'broken' ? !m.resolved : m.resolved
  );

  // ---- Quick verify (no ID change, just mark verified) ----
  const quickVerify = async (m: Mapping) => {
    setSaving(true);
    try {
      const res = await fetch(apiUrl('/api/admin/verify-mappings'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compoundSourceId: m.csId, status: 'verified' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMappings(prev => prev.map(x => x.csId === m.csId ? { ...x, verificationStatus: 'verified' } : x));
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  // ---- Fix panel (search source catalog) ----
  const openFix = (m: Mapping) => {
    setExpanded({ csId: m.csId, mode: 'fix' });
    setSearchQuery(m.compoundName);
    setSearchResults([]);
    runSearch(m.compoundName);
  };

  const runSearch = async (q: string) => {
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/source-search?source=${source}&q=${encodeURIComponent(q)}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSearchResults(data.results);
    } catch (e: any) { setError(e.message); }
    finally { setSearching(false); }
  };

  const applyFix = async (m: Mapping, candidate: SearchResult) => {
    const cf = suggestCF(m.compoundUnit, candidate.unit);
    if (cf === '?') {
      const proceed = confirm(`Unit conversion from ${candidate.unit} → ${m.compoundUnit} is not in the standard map. Apply with cf=1.0 anyway?`);
      if (!proceed) return;
    }
    setSaving(true);
    try {
      const res = await fetch(apiUrl('/api/admin/source-mapping'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csId: m.csId,
          externalId: candidate.id,
          sourceUnit: candidate.unit,
          conversionFactor: cf === '?' ? '1.0' : cf,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      // Inline update
      setMappings(prev => prev.map(x =>
        x.csId === m.csId
          ? { ...x, externalId: candidate.id, ourSourceUnit: candidate.unit, conversionFactor: cf === '?' ? '1.0' : cf,
              actualName: candidate.name, actualUnit: candidate.unit, resolved: true, verificationStatus: 'verified' }
          : x
      ));
      setExpanded(null);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  // ---- Compound edit panel ----
  const openEdit = (m: Mapping) => {
    setExpanded({ csId: m.csId, mode: 'edit' });
    setEditName(m.compoundName);
    setEditType(m.compoundType);
  };

  const saveCompound = async (m: Mapping) => {
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/compound/${m.compoundId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, compoundType: editType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      // Update all rows that share this compoundId
      setMappings(prev => prev.map(x =>
        x.compoundId === m.compoundId ? { ...x, compoundName: editName, compoundType: editType } : x
      ));
      setExpanded(null);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  // Count how many mappings (across all sources) the current compound has
  const compoundMappingCount = (compoundId: string) => mappings.filter(m => m.compoundId === compoundId).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <AnalysisHeader />
      <div className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Source Inspector</h1>
          <p className="text-white/60 text-sm">Click compound name to edit. Click "Fix" on broken/unverified rows to search the source catalog and pick the right ID.</p>
        </div>

        <div className="flex gap-3 mb-6 items-center flex-wrap">
          <select value={source} onChange={(e) => setSource(e.target.value)}
            style={{ colorScheme: 'dark' }}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400">
            {SUPPORTED_SOURCES.map(s => <option key={s} value={s} className="bg-[#0a0a0a] text-white">{s}</option>)}
          </select>
          <div className="flex gap-1">
            {(['all', 'broken', 'resolved'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 text-sm rounded-lg border transition ${
                  filter === f ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}>{f}</button>
            ))}
          </div>
          {stats && (
            <div className="ml-auto text-sm text-white/60 flex gap-4">
              <span>Total: <span className="text-white">{stats.total}</span></span>
              <span>Resolved: <span className="text-green-400">{stats.resolved}</span></span>
              <span>Broken: <span className="text-red-400">{stats.broken}</span></span>
              <span>Verified: <span className="text-green-400/80">{stats.verified}</span></span>
              <span>Review: <span className="text-amber-400">{stats.review}</span></span>
              <span>Flagged: <span className="text-red-400/60">{stats.flagged}</span></span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-white/40 hover:text-white/60 ml-4">dismiss</button>
          </div>
        )}

        {loading && <div className="py-12 text-center text-white/40">Loading {source}...</div>}

        {!loading && !error && (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03]">
                <tr className="text-white/40 text-xs uppercase tracking-wider border-b border-white/10">
                  <th className="text-left px-4 py-3">Compound (ours)</th>
                  <th className="text-left px-3 py-3">Type</th>
                  <th className="text-left px-3 py-3">Unit</th>
                  <th className="text-left px-3 py-3 border-l border-white/10">Our Ext ID</th>
                  <th className="text-left px-3 py-3">Our Source Name</th>
                  <th className="text-left px-3 py-3">Our Unit</th>
                  <th className="text-left px-3 py-3 border-l border-white/10">Source Says: Name</th>
                  <th className="text-left px-3 py-3">Source Unit</th>
                  <th className="text-center px-3 py-3 border-l border-white/10">Resolved?</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="text-left px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((m) => {
                  const isExpanded = expanded?.csId === m.csId;
                  return (
                    <React.Fragment key={m.csId}>
                      <tr className="border-t border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-2">
                          <button onClick={() => isExpanded && expanded?.mode === 'edit' ? setExpanded(null) : openEdit(m)}
                            className="text-white/90 hover:text-cyan-400 text-left underline decoration-dotted decoration-white/20 hover:decoration-cyan-400 underline-offset-4">
                            {m.compoundName}
                            <span className="text-white/30 ml-1 text-[10px]">✎</span>
                          </button>
                        </td>
                        <td className="px-3 py-2 text-xs text-white/40">{m.compoundType}</td>
                        <td className="px-3 py-2 font-mono text-xs text-white/50">{m.compoundUnit}</td>
                        <td className="px-3 py-2 font-mono text-white/70 text-xs border-l border-white/10">{m.externalId}</td>
                        <td className="px-3 py-2 text-white/60 text-xs">{m.ourSourceName ?? '—'}</td>
                        <td className="px-3 py-2 font-mono text-xs text-white/50">{m.ourSourceUnit ?? '—'}</td>
                        <td className={`px-3 py-2 text-xs border-l border-white/10 ${
                          !m.resolved ? 'text-red-400 italic' :
                          m.actualName?.toLowerCase() === (m.ourSourceName ?? '').toLowerCase() ? 'text-green-400' :
                          'text-yellow-400'
                        }`}>{m.actualName ?? '— (no match)'}</td>
                        <td className="px-3 py-2 font-mono text-xs text-white/60">{m.actualUnit ?? '—'}</td>
                        <td className="px-3 py-2 text-center border-l border-white/10">
                          {m.resolved ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            m.verificationStatus === 'verified' ? 'bg-green-500/20 text-green-400' :
                            m.verificationStatus === 'flagged' ? 'bg-red-500/20 text-red-400/80' :
                            m.verificationStatus === 'review' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-white/5 text-white/40'
                          }`} title={m.verificationNotes ?? ''}>{m.verificationStatus}</span>
                        </td>
                        <td className="px-3 py-2">
                          {m.verificationStatus !== 'flagged' && (
                            <div className="flex gap-1">
                              {m.resolved && m.verificationStatus !== 'verified' && (
                                <button onClick={() => quickVerify(m)} disabled={saving}
                                  title="Mark verified (keep current ID)"
                                  className="text-xs px-2 py-1 rounded border border-green-500/30 text-green-400 hover:bg-green-500/10 transition disabled:opacity-50">
                                  ✓
                                </button>
                              )}
                              <button onClick={() => isExpanded && expanded?.mode === 'fix' ? setExpanded(null) : openFix(m)}
                                className="text-xs px-2 py-1 rounded border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition">
                                {isExpanded && expanded?.mode === 'fix' ? 'Close' : 'Fix'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Inline fix panel */}
                      {isExpanded && expanded?.mode === 'fix' && (
                        <tr className="bg-cyan-500/[0.04] border-t border-cyan-500/20">
                          <td colSpan={11} className="px-4 py-4">
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <input type="text" value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') runSearch(searchQuery); }}
                                  placeholder={`Search ${source} catalog...`}
                                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-400" />
                                <button onClick={() => runSearch(searchQuery)} disabled={searching}
                                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs hover:bg-cyan-500/30 disabled:opacity-50">
                                  {searching ? '...' : 'Search'}
                                </button>
                              </div>
                              {searchResults.length === 0 && !searching && (
                                <div className="text-xs text-white/40 italic">No results. Try different keywords or partial words.</div>
                              )}
                              {searchResults.length > 0 && (
                                <div className="border border-white/10 rounded-lg overflow-hidden">
                                  <table className="w-full text-xs">
                                    <thead className="bg-white/[0.03]">
                                      <tr className="text-white/40 uppercase tracking-wider">
                                        <th className="text-left px-3 py-2">ID</th>
                                        <th className="text-left px-3 py-2">Name</th>
                                        <th className="text-left px-3 py-2">Unit</th>
                                        <th className="text-left px-3 py-2">Suggested CF</th>
                                        <th className="text-right px-3 py-2"></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {searchResults.map(r => {
                                        const cf = suggestCF(m.compoundUnit, r.unit);
                                        const isCurrent = r.id === m.externalId;
                                        return (
                                          <tr key={r.id} className={`border-t border-white/5 ${isCurrent ? 'bg-yellow-500/5' : ''}`}>
                                            <td className="px-3 py-1.5 font-mono text-white/70">{r.id}</td>
                                            <td className="px-3 py-1.5 text-white/80">{r.name}</td>
                                            <td className="px-3 py-1.5 font-mono text-white/60">{r.unit ?? '—'}</td>
                                            <td className={`px-3 py-1.5 font-mono ${cf === '?' ? 'text-yellow-400' : 'text-white/60'}`}>{cf}</td>
                                            <td className="px-3 py-1.5 text-right">
                                              <button onClick={() => applyFix(m, r)} disabled={saving}
                                                className="text-xs px-2 py-1 rounded bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 disabled:opacity-50">
                                                {isCurrent ? 'Re-confirm' : 'Use'}
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Inline compound edit panel */}
                      {isExpanded && expanded?.mode === 'edit' && (
                        <tr className="bg-amber-500/[0.04] border-t border-amber-500/20">
                          <td colSpan={11} className="px-4 py-4">
                            <div className="text-xs text-amber-400/80 mb-2">
                              ⚠ Editing this compound affects ALL its mappings (currently {compoundMappingCount(m.compoundId)} on this page; others elsewhere).
                            </div>
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className="text-xs text-white/40 block mb-1">Name</label>
                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-400" />
                              </div>
                              <div>
                                <label className="text-xs text-white/40 block mb-1">Type</label>
                                <select value={editType} onChange={(e) => setEditType(e.target.value)}
                                  style={{ colorScheme: 'dark' }}
                                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-400">
                                  {COMPOUND_TYPES.map(t => <option key={t} value={t} className="bg-[#0a0a0a] text-white">{t}</option>)}
                                </select>
                              </div>
                              <button onClick={() => saveCompound(m)} disabled={saving || (editName === m.compoundName && editType === m.compoundType)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs hover:bg-amber-500/30 disabled:opacity-30">
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                              <button onClick={() => setExpanded(null)} className="px-3 py-1.5 text-white/40 text-xs hover:text-white/60">Cancel</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {visible.length === 0 && (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-white/30">No mappings match this filter</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
