/**
 * Data Export Component - FS-4 Security & Compliance System
 *
 * Purpose: GDPR Article 20 (Right to Data Portability)
 * Location: /settings/privacy page
 * Rate Limit: 3 requests per 24 hours
 *
 * Created: 2025-11-10
 */

'use client';

import { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/utils/base-path';

interface ExportRecord {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  completedAt: string | null;
  downloadUrl: string | null;
  expiresAt: string | null;
  isExpired: boolean;
}

interface DataExportProps {
  userId: string;
}

export default function DataExport({ userId }: DataExportProps) {
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch export history on mount
  useEffect(() => {
    fetchExports();
  }, [userId]);

  async function fetchExports() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiUrl('/api/user/export'));

      if (!response.ok) {
        throw new Error('Failed to fetch export history');
      }

      const data = await response.json();
      setExports(data.exports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load export history');
    } finally {
      setLoading(false);
    }
  }

  async function requestExport() {
    try {
      setRequesting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(apiUrl('/api/user/export'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request export');
      }

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Export request created! You will receive an email when your data is ready (typically within 5 minutes).');

        // Refresh export list
        setTimeout(() => fetchExports(), 1000);

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request export');
    } finally {
      setRequesting(false);
    }
  }

  const mostRecentExport = exports?.[0];
  const canRequestExport = !mostRecentExport || mostRecentExport.status !== 'pending';

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan"></div>
        <p className="mt-4 text-white/70">Loading export history...</p>
      </div>
    );
  }

  return (
    <div className="data-export">
      {/* Success Message */}
      {successMessage && (
        <div className="success-message visible mb-4">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red/15 border border-red/30 rounded-xl p-4 mb-4 text-red text-sm">
          {error}
        </div>
      )}

      {/* Export Description */}
      <div className="mb-6">
        <p className="text-white/70 text-sm mb-4">
          Download a complete copy of your Nutri data in JSON format. This includes your profile, meal logs, health conditions, consent records, and more.
        </p>
        <p className="text-white/60 text-xs">
          <strong>Rate Limit:</strong> 3 export requests per 24 hours. Download links expire after 7 days.
        </p>
      </div>

      {/* Request Export Button */}
      <div className="mb-8">
        <button
          onClick={requestExport}
          disabled={requesting || !canRequestExport}
          className="save-btn"
        >
          {requesting ? 'Requesting Export...' : 'Request Data Export'}
        </button>

        {mostRecentExport?.status === 'pending' && (
          <p className="text-white/60 text-xs mt-2">
            Export already in progress. Please wait for it to complete before requesting another.
          </p>
        )}
      </div>

      {/* Export History */}
      {exports && exports.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-cyan-light">Export History</h3>

          <div className="space-y-3">
            {exports.map(exportRecord => (
              <ExportCard key={exportRecord.id} exportRecord={exportRecord} />
            ))}
          </div>
        </div>
      )}

      {exports && exports.length === 0 && (
        <div className="text-center py-8 text-white/50">
          <p>No export requests yet. Click "Request Data Export" to get started.</p>
        </div>
      )}
    </div>
  );
}

/**
 * Export Card Component
 *
 * Individual export request card with status and download link
 */
interface ExportCardProps {
  exportRecord: ExportRecord;
}

function ExportCard({ exportRecord }: ExportCardProps) {
  const statusColors: Record<ExportRecord['status'], string> = {
    pending: 'text-cyan-light',
    processing: 'text-cyan',
    completed: 'text-green',
    failed: 'text-red'
  };

  const statusIcons: Record<ExportRecord['status'], string> = {
    pending: '⏳',
    processing: '⚙️',
    completed: '✓',
    failed: '✗'
  };

  const requestDate = new Date(exportRecord.requestedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const expiresDate = exportRecord.expiresAt
    ? new Date(exportRecord.expiresAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null;

  return (
    <div className="password-section">
      <div className="password-icon bg-gradient-to-br from-cyan-dark to-cyan-light">
        {statusIcons[exportRecord.status]}
      </div>

      <div className="password-info flex-1">
        <h4 className="text-sm font-semibold text-white">
          Export requested on {requestDate}
        </h4>
        <p className={`text-xs mt-1 ${statusColors[exportRecord.status]}`}>
          Status: {exportRecord.status.charAt(0).toUpperCase() + exportRecord.status.slice(1)}
        </p>

        {exportRecord.status === 'completed' && exportRecord.downloadUrl && !exportRecord.isExpired && (
          <p className="text-xs mt-1 text-white/60">
            Expires on {expiresDate}
          </p>
        )}

        {exportRecord.isExpired && (
          <p className="text-xs mt-1 text-red">
            Download link expired
          </p>
        )}
      </div>

      {/* Download Button */}
      {exportRecord.status === 'completed' && exportRecord.downloadUrl && !exportRecord.isExpired && (
        <a
          href={exportRecord.downloadUrl}
          download
          className="secondary-btn"
        >
          Download
        </a>
      )}

      {exportRecord.status === 'pending' && (
        <div className="text-white/50 text-xs">
          Processing...
        </div>
      )}

      {exportRecord.status === 'failed' && (
        <div className="text-red text-xs">
          Failed
        </div>
      )}
    </div>
  );
}
