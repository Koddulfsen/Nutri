/**
 * Audit Log Viewer Component - FS-4 Security & Compliance System
 *
 * Purpose: Display user's audit trail with pagination and filtering
 * Location: /settings/privacy page (or /settings/security)
 * Retention: 6 years (HIPAA compliance)
 *
 * Created: 2025-11-10
 */

'use client';

import { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/utils/base-path';

interface AuditLogEntry {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface AuditLogViewerProps {
  userId: string;
  limit?: number; // Default: 100
}

export default function AuditLogViewer({ userId, limit = 100 }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit,
    total: 0,
    hasMore: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Fetch audit logs on mount and when filters change
  useEffect(() => {
    fetchAuditLogs(1);
  }, [userId, actionFilter]);

  async function fetchAuditLogs(page: number) {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (actionFilter) {
        params.append('action', actionFilter);
      }

      const response = await fetch(apiUrl(`/api/audit-logs?${params.toString()}`));

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();

      setLogs(data.logs || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }

  function handlePageChange(newPage: number) {
    fetchAuditLogs(newPage);
  }

  function handleFilterChange(action: string) {
    setActionFilter(action);
    // Reset to page 1 when filter changes
  }

  function toggleExpanded(logId: string) {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  }

  if (loading && logs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan"></div>
        <p className="mt-4 text-white/70">Loading audit trail...</p>
      </div>
    );
  }

  return (
    <div className="audit-log-viewer">
      {/* Error Message */}
      {error && (
        <div className="bg-red/15 border border-red/30 rounded-xl p-4 mb-4 text-red text-sm">
          {error}
        </div>
      )}

      {/* Filter Controls */}
      <div className="mb-6">
        <label htmlFor="action-filter" className="block text-sm font-medium mb-2 text-white">
          Filter by Action
        </label>
        <select
          id="action-filter"
          value={actionFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="w-full max-w-xs px-3 py-2 bg-gray-100 border-2 border-transparent text-white text-sm rounded-lg focus:outline-none focus:bg-gray-200 transition-all duration-300"
        >
          <option value="">All Actions</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="CREATE">Create</option>
          <option value="READ">Read</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="EXPORT">Data Export</option>
          <option value="CONSENT_CHANGE">Consent Change</option>
        </select>
      </div>

      {/* Audit Log Table */}
      {logs && logs.length > 0 ? (
        <div>
          {/* Pagination Info */}
          <div className="mb-4 text-white/70 text-sm">
            Showing {logs.length} of {pagination.total} audit entries
          </div>

          {/* Log Entries */}
          <div className="space-y-3">
            {logs.map(log => (
              <AuditLogCard
                key={log.id}
                log={log}
                isExpanded={expandedLogId === log.id}
                onToggle={() => toggleExpanded(log.id)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.total > pagination.limit && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                className="secondary-btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="text-white/70 text-sm">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasMore || loading}
                className="secondary-btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-white/50">
          <p>No audit log entries found.</p>
        </div>
      )}
    </div>
  );
}

/**
 * Audit Log Card Component
 *
 * Individual audit log entry with expand/collapse functionality
 */
interface AuditLogCardProps {
  log: AuditLogEntry;
  isExpanded: boolean;
  onToggle: () => void;
}

function AuditLogCard({ log, isExpanded, onToggle }: AuditLogCardProps) {
  const actionIcons: Record<string, string> = {
    LOGIN: '🔐',
    LOGOUT: '🚪',
    CREATE: '➕',
    READ: '👁️',
    UPDATE: '✏️',
    DELETE: '🗑️',
    EXPORT: '📦',
    CONSENT_CHANGE: '🔔'
  };

  const actionColors: Record<string, string> = {
    LOGIN: 'text-green',
    LOGOUT: 'text-gray-400',
    CREATE: 'text-cyan',
    READ: 'text-blue-400',
    UPDATE: 'text-yellow-400',
    DELETE: 'text-red',
    EXPORT: 'text-magenta',
    CONSENT_CHANGE: 'text-cyan-light'
  };

  const timestamp = new Date(log.createdAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="bg-gray-100 border border-white/10 rounded-xl p-4 hover:bg-gray-200 transition-all duration-300 cursor-pointer">
      {/* Log Header */}
      <div
        className="flex items-center justify-between"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Action Icon */}
          <span className="text-2xl">{actionIcons[log.action] || '📄'}</span>

          {/* Log Summary */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-sm ${actionColors[log.action] || 'text-white'}`}>
                {log.action}
              </span>
              <span className="text-white/50 text-xs">→</span>
              <span className="text-white/70 text-sm">{log.resourceType}</span>
            </div>
            <p className="text-white/50 text-xs mt-1 font-tabular-nums">{timestamp}</p>
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        <span className="text-white/50 text-sm">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/10 text-sm space-y-2">
          {log.resourceId && (
            <div>
              <span className="text-white/50">Resource ID:</span>{' '}
              <span className="text-white/80 font-mono text-xs">{log.resourceId}</span>
            </div>
          )}

          {log.ipAddress && (
            <div>
              <span className="text-white/50">IP Address:</span>{' '}
              <span className="text-white/80 font-mono text-xs">{log.ipAddress}</span>
            </div>
          )}

          {log.userAgent && (
            <div>
              <span className="text-white/50">User Agent:</span>{' '}
              <span className="text-white/80 font-mono text-xs break-all">{log.userAgent}</span>
            </div>
          )}

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <span className="text-white/50 block mb-1">Metadata:</span>
              <pre className="text-white/70 bg-black/30 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
