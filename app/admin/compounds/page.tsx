/**
 * Compound Data Quality Analysis Page
 *
 * Admin interface for analyzing compound mappings and detecting errors.
 * Shows coverage stats, source distribution, and validation issues.
 */

'use client';

import { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/utils/base-path';
import AnalysisHeader from '@/app/components/navigation/AnalysisHeader';

interface Issue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  compound: string;
  source?: string;
  externalId?: string;
  message: string;
  details?: string;
}

interface AnalysisData {
  summary: {
    totalCompounds: number;
    totalMappings: number;
    avgMappingsPerCompound: string;
    compoundsWithNoMappings: number;
    compoundsWithLowMappings: number;
    issuesByType: Record<string, number>;
    issuesBySeverity: {
      error: number;
      warning: number;
      info: number;
    };
  };
  sourceDistribution: Array<{ source: string; count: number }>;
  compoundsByType: Array<{ type: string; count: number }>;
  issues: Issue[];
  compoundsWithCounts: Array<{
    id: string;
    name: string;
    compoundType: string;
    mappingCount: number;
  }>;
}

const severityColors = {
  error: 'bg-red-500/20 border-red-500/50 text-red-400',
  warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
  info: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
};

const severityIcons = {
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export default function CompoundsAnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'coverage'>('overview');
  const [issueFilter, setIssueFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const response = await fetch(apiUrl('/api/admin/compounds-analysis'));
        if (!response.ok) throw new Error('Failed to fetch analysis');
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        setData(result.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4" />
          <p className="text-white/70">Analyzing compound data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-cyan-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const filteredIssues = data.issues.filter(issue => {
    if (issueFilter !== 'all' && issue.severity !== issueFilter) return false;
    if (issueTypeFilter !== 'all' && issue.type !== issueTypeFilter) return false;
    return true;
  });

  const issueTypes = [...new Set(data.issues.map(i => i.type))];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <AnalysisHeader />

      <div className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Compound Data Quality</h1>
          <p className="text-white/60">
            Analyze compound mappings, detect errors, and validate data integrity
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-3xl font-bold text-cyan-400">{data.summary.totalCompounds}</div>
            <div className="text-sm text-white/60">Total Compounds</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-3xl font-bold text-cyan-400">{data.summary.totalMappings}</div>
            <div className="text-sm text-white/60">Total Mappings</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-3xl font-bold text-cyan-400">{data.summary.avgMappingsPerCompound}</div>
            <div className="text-sm text-white/60">Avg per Compound</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-3xl font-bold text-red-400">{data.summary.issuesBySeverity.error}</div>
            <div className="text-sm text-white/60">Errors Found</div>
          </div>
        </div>

        {/* Issue Severity Summary */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
            <span className="text-green-400 font-bold">
              {data.summary.totalCompounds - data.summary.compoundsWithNoMappings - data.summary.compoundsWithLowMappings}
            </span>
            <span className="text-green-400/80 text-sm">Healthy</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-lg border border-red-500/30">
            <span className="text-red-400 font-bold">{data.summary.issuesBySeverity.error}</span>
            <span className="text-red-400/80 text-sm">Errors</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
            <span className="text-yellow-400 font-bold">{data.summary.issuesBySeverity.warning}</span>
            <span className="text-yellow-400/80 text-sm">Warnings</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <span className="text-blue-400 font-bold">{data.summary.issuesBySeverity.info}</span>
            <span className="text-blue-400/80 text-sm">Info</span>
          </div>
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(data.issues, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `compound-issues-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            className="ml-auto px-4 py-2 bg-white/10 rounded-lg border border-white/20 hover:bg-white/15 transition-colors text-sm"
          >
            Export Issues JSON
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
          {(['overview', 'issues', 'coverage'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Source Distribution */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Mappings by Source</h3>
              <div className="space-y-2">
                {data.sourceDistribution.map(s => (
                  <div key={s.source} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-white/80">{s.source}</div>
                    <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                        style={{ width: `${(s.count / data.sourceDistribution[0].count) * 100}%` }}
                      />
                    </div>
                    <div className="w-12 text-right text-sm text-white/60">{s.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compounds by Type */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Compounds by Type</h3>
              <div className="space-y-2">
                {data.compoundsByType.map(t => (
                  <div key={t.type} className="flex items-center gap-3">
                    <div className="w-36 text-sm text-white/80">
                      {t.type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                    </div>
                    <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-400"
                        style={{ width: `${(t.count / Math.max(...data.compoundsByType.map(x => x.count))) * 100}%` }}
                      />
                    </div>
                    <div className="w-12 text-right text-sm text-white/60">{t.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Issue Types Breakdown */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Issues by Type</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(data.summary.issuesByType).map(([type, count]) => (
                  <div
                    key={type}
                    className="px-3 py-2 bg-white/10 rounded-lg border border-white/20 cursor-pointer hover:bg-white/15 transition-colors"
                    onClick={() => {
                      setActiveTab('issues');
                      setIssueTypeFilter(type);
                    }}
                  >
                    <span className="text-white/80 text-sm">
                      {type.replace(/_/g, ' ')}
                    </span>
                    <span className="ml-2 text-cyan-400 font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <select
                value={issueFilter}
                onChange={e => setIssueFilter(e.target.value as any)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="all">All Severities</option>
                <option value="error">Errors Only</option>
                <option value="warning">Warnings Only</option>
                <option value="info">Info Only</option>
              </select>
              <select
                value={issueTypeFilter}
                onChange={e => setIssueTypeFilter(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="all">All Types</option>
                {issueTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <div className="text-white/60 flex items-center">
                {filteredIssues.length} issues shown
              </div>
            </div>

            {/* Issues List */}
            <div className="space-y-3">
              {filteredIssues.length === 0 ? (
                <div className="text-center py-12 text-white/60">
                  No issues match the current filters
                </div>
              ) : (
                filteredIssues.map((issue, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${severityColors[issue.severity]}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{severityIcons[issue.severity]}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold">{issue.compound}</span>
                          {issue.source && (
                            <span className="px-2 py-0.5 bg-white/10 rounded text-xs">
                              {issue.source}
                            </span>
                          )}
                          {issue.externalId && (
                            <span className="px-2 py-0.5 bg-cyan-500/20 rounded text-xs font-mono">
                              ID: {issue.externalId}
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-white/10 rounded text-xs">
                            {issue.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-sm opacity-90">{issue.message}</div>
                        {issue.details && (
                          <div className="text-sm opacity-70 mt-1">{issue.details}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'coverage' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Mapping Coverage by Compound</h3>
              <p className="text-white/60 text-sm">
                Compounds sorted by number of source mappings. Low counts may indicate incomplete data.
              </p>
            </div>

            {/* Coverage Table */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm text-white/60">Compound</th>
                    <th className="text-left px-4 py-3 text-sm text-white/60">Type</th>
                    <th className="text-right px-4 py-3 text-sm text-white/60">Mappings</th>
                    <th className="px-4 py-3 text-sm text-white/60 w-48">Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {data.compoundsWithCounts
                    .sort((a, b) => a.mappingCount - b.mappingCount)
                    .map(c => {
                      const maxMappings = 16; // Max possible sources
                      const coverage = (c.mappingCount / maxMappings) * 100;
                      const barColor = c.mappingCount === 0
                        ? 'bg-red-500'
                        : c.mappingCount < 3
                        ? 'bg-yellow-500'
                        : 'bg-green-500';

                      return (
                        <tr key={c.id} className="border-t border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3 font-medium">{c.name}</td>
                          <td className="px-4 py-3 text-sm text-white/60">
                            {c.compoundType.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={c.mappingCount === 0 ? 'text-red-400' : c.mappingCount < 3 ? 'text-yellow-400' : ''}>
                              {c.mappingCount}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full ${barColor}`}
                                style={{ width: `${Math.min(coverage, 100)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
