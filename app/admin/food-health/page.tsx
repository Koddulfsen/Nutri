/**
 * Food Database Health Dashboard
 *
 * Admin interface for validating food data across all 18 sources.
 * Tabs: Source Overview, Conversion Audit, Cross-Source Comparison,
 *       Value Sanity Checks, Merge Quality
 */

'use client';

import { useState, useEffect } from 'react';
import AnalysisHeader from '@/app/components/navigation/AnalysisHeader';
import { apiUrl } from '@/lib/utils/base-path';

type TabKey = 'sources' | 'conversions' | 'cross-source' | 'sanity' | 'merge-quality';

const TAB_LABELS: Record<TabKey, string> = {
  sources: 'Source Overview',
  conversions: 'Conversion Audit',
  'cross-source': 'Cross-Source',
  sanity: 'Sanity Checks',
  'merge-quality': 'Merge Quality',
};

const severityColors = {
  error: 'bg-red-500/20 border-red-500/50 text-red-400',
  warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
  info: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
};

export default function FoodHealthPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('sources');
  const [sourcesData, setSourcesData] = useState<any>(null);
  const [conversionsData, setConversionsData] = useState<any>(null);
  const [crossSourceData, setCrossSourceData] = useState<any>(null);
  const [sanityData, setSanityData] = useState<any>(null);
  const [mergeData, setMergeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [conversionFilter, setConversionFilter] = useState<'all' | 'non-trivial' | 'flagged'>('non-trivial');
  const [sanityFilter, setSanityFilter] = useState<'all' | 'error' | 'warning'>('all');
  const [crossSourceFilter, setCrossSourceFilter] = useState<'all' | 'flagged'>('flagged');

  const fetchTabData = async (tab: TabKey) => {
    const dataMap: Record<TabKey, any> = {
      sources: sourcesData,
      conversions: conversionsData,
      'cross-source': crossSourceData,
      sanity: sanityData,
      'merge-quality': mergeData,
    };

    if (dataMap[tab]) return; // Already loaded

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl(`/api/admin/food-health/${tab}`));
      if (!response.ok) throw new Error(`Failed to fetch ${tab} data`);
      const result = await response.json();

      const setters: Record<TabKey, (d: any) => void> = {
        sources: setSourcesData,
        conversions: setConversionsData,
        'cross-source': setCrossSourceData,
        sanity: setSanityData,
        'merge-quality': setMergeData,
      };
      setters[tab](result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <AnalysisHeader />

      <div className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Food Database Health</h1>
          <p className="text-white/60">
            Validate conversions, compare sources, and audit data quality across all 18 food databases
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4 overflow-x-auto">
          {(Object.keys(TAB_LABELS) as TabKey[]).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4" />
              <p className="text-white/70">Loading {TAB_LABELS[activeTab]}...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">Error: {error}</p>
            <button
              onClick={() => { setError(null); fetchTabData(activeTab); }}
              className="text-cyan-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Tab 1: Source Overview */}
        {activeTab === 'sources' && sourcesData && !loading && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-cyan-400">
                  {sourcesData.sources?.length || 0}
                </div>
                <div className="text-sm text-white/60">Total Sources</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-cyan-400">
                  {sourcesData.sources?.reduce((s: number, src: any) => s + src.foodCount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-white/60">Total Foods</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-green-400">
                  {Math.round(sourcesData.sources?.reduce((s: number, src: any) => s + src.mappingCoverage, 0) / (sourcesData.sources?.length || 1))}%
                </div>
                <div className="text-sm text-white/60">Avg Coverage</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-yellow-400">
                  {sourcesData.sources?.reduce((s: number, src: any) => s + src.unmappedNutrients.length, 0)}
                </div>
                <div className="text-sm text-white/60">Unmapped Nutrients</div>
              </div>
            </div>

            {/* Sources Table */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm text-white/60">Source</th>
                    <th className="text-right px-4 py-3 text-sm text-white/60">Foods</th>
                    <th className="text-right px-4 py-3 text-sm text-white/60">Nutrients</th>
                    <th className="text-right px-4 py-3 text-sm text-white/60">Mapped</th>
                    <th className="px-4 py-3 text-sm text-white/60 w-40">Coverage</th>
                    <th className="text-right px-4 py-3 text-sm text-white/60">Unmapped</th>
                  </tr>
                </thead>
                <tbody>
                  {sourcesData.sources?.map((src: any) => (
                    <>
                      <tr
                        key={src.source}
                        className="border-t border-white/5 hover:bg-white/5 cursor-pointer"
                        onClick={() => setExpandedSource(expandedSource === src.source ? null : src.source)}
                      >
                        <td className="px-4 py-3 font-medium">{src.source}</td>
                        <td className="px-4 py-3 text-right text-white/80">{src.foodCount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-white/80">{src.totalNutrients}</td>
                        <td className="px-4 py-3 text-right text-white/80">{src.mappedNutrients}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full ${src.mappingCoverage >= 80 ? 'bg-green-500' : src.mappingCoverage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${src.mappingCoverage}%` }}
                              />
                            </div>
                            <span className="text-xs text-white/60 w-10 text-right">{src.mappingCoverage}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={src.unmappedNutrients.length > 0 ? 'text-yellow-400' : 'text-green-400'}>
                            {src.unmappedNutrients.length}
                          </span>
                        </td>
                      </tr>
                      {expandedSource === src.source && src.unmappedNutrients.length > 0 && (
                        <tr key={`${src.source}-unmapped`}>
                          <td colSpan={6} className="px-4 py-3 bg-white/[0.02]">
                            <div className="text-sm text-white/60 mb-2">Unmapped nutrients:</div>
                            <div className="flex flex-wrap gap-2">
                              {src.unmappedNutrients.map((n: any, i: number) => (
                                <span key={i} className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                                  {n.name} {n.unit ? `(${n.unit})` : ''}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Conversion Audit */}
        {activeTab === 'conversions' && conversionsData && !loading && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-cyan-400">{conversionsData.summary.totalMappings}</div>
                <div className="text-sm text-white/60">Total Mappings</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-yellow-400">{conversionsData.summary.nonTrivialConversions}</div>
                <div className="text-sm text-white/60">Non-Trivial Conversions</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-red-400">{conversionsData.summary.flaggedIssues}</div>
                <div className="text-sm text-white/60">Flagged Issues</div>
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6">
              {(['all', 'non-trivial', 'flagged'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setConversionFilter(f)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    conversionFilter === f
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'non-trivial' ? 'Non-Trivial' : 'Flagged'}
                </button>
              ))}
            </div>

            {/* Conversions Table */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm text-white/60">Source</th>
                    <th className="text-left px-4 py-3 text-sm text-white/60">Compound</th>
                    <th className="text-left px-4 py-3 text-sm text-white/60">Source Unit</th>
                    <th className="text-left px-4 py-3 text-sm text-white/60">Canonical Unit</th>
                    <th className="text-right px-4 py-3 text-sm text-white/60">Factor</th>
                    <th className="text-left px-4 py-3 text-sm text-white/60">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {conversionsData.conversions
                    ?.filter((c: any) => {
                      if (conversionFilter === 'non-trivial') return c.isNonTrivial;
                      if (conversionFilter === 'flagged') return c.flags.length > 0;
                      return true;
                    })
                    .map((c: any) => (
                      <tr key={c.id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-0.5 bg-white/10 rounded text-xs">{c.externalSource}</span>
                        </td>
                        <td className="px-4 py-3 font-medium">{c.compoundName}</td>
                        <td className="px-4 py-3 text-sm text-white/80 font-mono">{c.sourceUnit || '-'}</td>
                        <td className="px-4 py-3 text-sm text-white/80 font-mono">{c.canonicalUnit}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          <span className={c.isNonTrivial ? 'text-yellow-400' : 'text-white/60'}>
                            {c.conversionFactor}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {c.flags.map((flag: string) => (
                            <span
                              key={flag}
                              className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400 mr-1"
                            >
                              {flag.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Cross-Source Comparison */}
        {activeTab === 'cross-source' && crossSourceData && !loading && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-cyan-400">{crossSourceData.summary.totalCompounds}</div>
                <div className="text-sm text-white/60">Multi-Source Compounds</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-red-400">{crossSourceData.summary.flaggedCompounds}</div>
                <div className="text-sm text-white/60">Flagged Outliers</div>
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6">
              {(['flagged', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setCrossSourceFilter(f)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    crossSourceFilter === f
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {f === 'flagged' ? 'Flagged Only' : 'All Compounds'}
                </button>
              ))}
            </div>

            {/* Compounds */}
            <div className="space-y-4">
              {crossSourceData.compounds
                ?.filter((c: any) => {
                  if (crossSourceFilter === 'flagged') return c.sources.some((s: any) => s.flagged);
                  return true;
                })
                .map((compound: any) => (
                  <div key={compound.compoundId} className="bg-white/5 rounded-xl border border-white/10 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold">{compound.compoundName}</h3>
                      <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/60">{compound.unit}</span>
                      {compound.groupName && (
                        <span className="px-2 py-0.5 bg-cyan-500/10 rounded text-xs text-cyan-400">{compound.groupName}</span>
                      )}
                      <span className="text-sm text-white/40 ml-auto">
                        Global mean: {compound.globalMean.toFixed(4)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {compound.sources.map((src: any) => (
                        <div
                          key={src.apiSource}
                          className={`p-2 rounded border ${
                            src.flagged
                              ? 'bg-red-500/10 border-red-500/30'
                              : 'bg-white/[0.02] border-white/5'
                          }`}
                        >
                          <div className="text-xs text-white/60">{src.apiSource}</div>
                          <div className={`font-mono text-sm ${src.flagged ? 'text-red-400' : ''}`}>
                            {src.mean.toFixed(4)}
                          </div>
                          <div className="text-xs text-white/40">
                            n={src.foodCount}
                            {src.zScore != null && ` z=${src.zScore.toFixed(1)}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              {crossSourceData.compounds?.length === 0 && (
                <div className="text-center py-12 text-white/60">
                  No cross-source data available yet. Add foods from multiple sources to see comparisons.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Sanity Checks */}
        {activeTab === 'sanity' && sanityData && !loading && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-cyan-400">{sanityData.summary.totalFoods}</div>
                <div className="text-sm text-white/60">Total Foods</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-red-400">{sanityData.summary.foodsWithIssues}</div>
                <div className="text-sm text-white/60">Foods with Issues</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-red-400">{sanityData.summary.issuesBySeverity.error}</div>
                <div className="text-sm text-white/60">Errors</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-yellow-400">{sanityData.summary.issuesBySeverity.warning}</div>
                <div className="text-sm text-white/60">Warnings</div>
              </div>
            </div>

            {/* Issue Type Badges */}
            <div className="flex gap-3 mb-6 flex-wrap">
              {Object.entries(sanityData.summary.issuesByType).map(([type, count]) => (
                <div key={type} className="px-3 py-2 bg-white/10 rounded-lg border border-white/20">
                  <span className="text-white/80 text-sm">{type.replace(/_/g, ' ')}</span>
                  <span className="ml-2 text-cyan-400 font-semibold">{count as number}</span>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6">
              {(['all', 'error', 'warning'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSanityFilter(f)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    sanityFilter === f
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
                </button>
              ))}
            </div>

            {/* Issues List */}
            <div className="space-y-3">
              {sanityData.issues
                ?.filter((i: any) => sanityFilter === 'all' || i.severity === sanityFilter)
                .map((issue: any, idx: number) => (
                  <div key={idx} className={`p-4 rounded-lg border ${severityColors[issue.severity as keyof typeof severityColors]}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold">{issue.foodName}</span>
                          <span className="px-2 py-0.5 bg-white/10 rounded text-xs">
                            {issue.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-sm opacity-90">{issue.message}</div>
                        <div className="text-sm opacity-70 mt-1 font-mono">{issue.details}</div>
                      </div>
                    </div>
                  </div>
                ))}
              {sanityData.issues?.length === 0 && (
                <div className="text-center py-12 text-white/60">
                  No sanity issues found. All food values look reasonable.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Merge Quality */}
        {activeTab === 'merge-quality' && mergeData && !loading && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-cyan-400">{mergeData.summary.totalMergedNutrients}</div>
                <div className="text-sm text-white/60">Total Merged</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-yellow-400">{mergeData.summary.nullCompoundCount}</div>
                <div className="text-sm text-white/60">No Compound ID</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-white/80">{mergeData.summary.singleSourceCount}</div>
                <div className="text-sm text-white/60">Single Source</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-green-400">{mergeData.summary.multiSourceCount}</div>
                <div className="text-sm text-white/60">Multi Source</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-red-400">{mergeData.summary.highDisagreementCount}</div>
                <div className="text-sm text-white/60">High Disagreement</div>
              </div>
            </div>

            {/* High Disagreement Section */}
            {mergeData.highDisagreement?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">High Disagreement (CV &gt; 50%)</h3>
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm text-white/60">Food</th>
                        <th className="text-left px-4 py-3 text-sm text-white/60">Compound</th>
                        <th className="text-right px-4 py-3 text-sm text-white/60">Mean</th>
                        <th className="text-left px-4 py-3 text-sm text-white/60">Unit</th>
                        <th className="text-right px-4 py-3 text-sm text-white/60">CV%</th>
                        <th className="text-right px-4 py-3 text-sm text-white/60">Sources</th>
                        <th className="text-left px-4 py-3 text-sm text-white/60">Source Values</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mergeData.highDisagreement.map((item: any, idx: number) => (
                        <tr key={idx} className="border-t border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3 text-sm">{item.foodName}</td>
                          <td className="px-4 py-3 font-medium">{item.nutrientName}</td>
                          <td className="px-4 py-3 text-right font-mono">{item.mean.toFixed(4)}</td>
                          <td className="px-4 py-3 text-sm text-white/60">{item.unit}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-mono ${item.cvPercent > 100 ? 'text-red-400' : 'text-yellow-400'}`}>
                              {item.cvPercent.toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">{item.sourceCount}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 flex-wrap">
                              {item.sourceValues?.map((sv: any, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs font-mono">
                                  {sv.apiSource}: {sv.value.toFixed(4)}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Confidence Distribution */}
            {mergeData.confidenceDistribution?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Confidence Distribution</h3>
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="space-y-2">
                    {mergeData.confidenceDistribution.map((item: any) => (
                      <div key={item.confidence} className="flex items-center gap-3">
                        <div className="w-20 text-sm text-white/80 font-mono">{item.confidence}</div>
                        <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                            style={{
                              width: `${(item.count / Math.max(...mergeData.confidenceDistribution.map((d: any) => d.count))) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="w-20 text-right text-sm text-white/60">{item.count.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {mergeData.summary.totalMergedNutrients === 0 && (
              <div className="text-center py-12 text-white/60">
                No merged nutrients yet. Add foods to see merge quality metrics.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
