'use client';

/**
 * Your data: a download of everything held about you, and permanent deletion.
 *
 * Export is a synchronous JSON download (GET /api/user/export). Deletion (POST /api/user/delete-account)
 * is immediate and complete with no grace period — there is nothing to recover afterwards — so it is
 * behind a typed confirmation, not a single click.
 */

import { useState } from 'react';
import { apiUrl } from '@/lib/utils/base-path';

const CONFIRM_WORD = 'delete';

export default function PrivacyData({ userId }: { userId: string }) {
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function downloadExport() {
    setExporting(true);
    setExportMessage(null);
    try {
      const res = await fetch(apiUrl('/api/user/export'));
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Could not export your data.');
      }
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `nutri-export-${userId}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportMessage({ kind: 'ok', text: 'Your data has downloaded.' });
    } catch (err) {
      setExportMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Could not export your data.' });
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(apiUrl('/api/user/delete-account'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || 'Could not delete your account.');
      setDeleted(true);
      // The account and session are gone server-side; leave the app.
      setTimeout(() => { window.location.href = '/'; }, 2000);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete your account.');
      setDeleting(false);
    }
  }

  if (deleted) {
    return (
      <section className="pv-section">
        <p className="pv-note pv-note--ok" role="status">
          Your account and everything in it has been permanently deleted. Taking you to the front page&hellip;
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="pv-section" aria-labelledby="pv-export">
        <h2 id="pv-export" className="pv-h2">Your data</h2>
        <p className="pv-text">
          Download everything Nutri holds about you as one file: your profile, body details, consents,
          meals, saved meals, API key details and custom targets.
        </p>
        {exportMessage && (
          <p className={exportMessage.kind === 'ok' ? 'pv-note pv-note--ok' : 'pv-note pv-note--error'} role="status">
            {exportMessage.text}
          </p>
        )}
        <button type="button" className="pv-button" onClick={downloadExport} disabled={exporting}>
          {exporting ? 'Preparing…' : 'Download my data'}
        </button>
      </section>

      <section className="pv-section" aria-labelledby="pv-delete">
        <h2 id="pv-delete" className="pv-h2">Delete your account</h2>
        <p className="pv-text">
          This deletes your profile, body details, meals, saved meals, consents and API keys, and your
          login. It happens immediately and cannot be undone: there is no grace period and nothing to
          recover afterwards.
        </p>

        {!confirming ? (
          <button type="button" className="pv-button pv-button--danger" onClick={() => setConfirming(true)}>
            Delete my account
          </button>
        ) : (
          <div className="pv-confirm">
            <label className="pv-label" htmlFor="pv-confirm-input">
              Type <strong>{CONFIRM_WORD}</strong> to confirm
            </label>
            <input
              id="pv-confirm-input"
              className="pv-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              disabled={deleting}
            />
            {deleteError && <p className="pv-note pv-note--error" role="alert">{deleteError}</p>}
            <div className="pv-confirm-actions">
              <button
                type="button"
                className="pv-button pv-button--danger"
                onClick={deleteAccount}
                disabled={deleting || typed.trim().toLowerCase() !== CONFIRM_WORD}
              >
                {deleting ? 'Deleting…' : 'Delete everything'}
              </button>
              <button
                type="button"
                className="pv-link"
                onClick={() => { setConfirming(false); setTyped(''); setDeleteError(null); }}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
