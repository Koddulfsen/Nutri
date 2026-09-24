/**
 * Data Export Component
 *
 * Purpose: GDPR Article 15/20 (Access & Portability)
 * Location: /settings/privacy page
 * Rate Limit: 3 requests per 24 hours
 *
 * Synchronous download — the browser fetches the export and saves it directly.
 * No async job, no email link, no history list: the endpoint has nothing to
 * report status on, it either returns the file or it doesn't.
 */

'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/utils/base-path';

interface DataExportProps {
  userId: string;
}

export default function DataExport({ userId }: DataExportProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function downloadExport() {
    try {
      setDownloading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(apiUrl('/api/user/export'));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nutri-export-${userId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccessMessage('Your data export has downloaded.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="data-export">
      {successMessage && (
        <div className="success-message visible mb-4">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red/15 border border-red/30 rounded-xl p-4 mb-4 text-red text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <p className="text-white/70 text-sm mb-4">
          Download a complete copy of your Nutri data in JSON format: profile, demographics,
          meal logs, consent records, custom daily values, and API key metadata.
        </p>
        <p className="text-white/60 text-xs">
          <strong>Rate limit:</strong> 3 export downloads per 24 hours.
        </p>
      </div>

      <button
        onClick={downloadExport}
        disabled={downloading}
        className="save-btn"
      >
        {downloading ? 'Preparing download…' : 'Download My Data'}
      </button>
    </div>
  );
}
