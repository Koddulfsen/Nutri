/**
 * Account Deletion Component
 *
 * Purpose: GDPR Article 17 (Right to Erasure / Right to be Forgotten)
 * Location: /settings/privacy page
 *
 * No grace period: deletion is immediate and permanent (see
 * docs/DATA-SCOPE-DECISIONS.md for why). There is nothing to cancel — the
 * confirmation modal is the only safety check.
 */

'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/utils/base-path';

interface AccountDeletionProps {
  userId: string;
}

export default function AccountDeletion({ userId }: AccountDeletionProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  async function confirmDeletion() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiUrl('/api/user/delete-account'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to delete account');
      }

      setDeleted(true);
      setShowConfirmModal(false);

      // Account and session are both gone server-side; send them off the app.
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  }

  if (deleted) {
    return (
      <div className="account-deletion">
        <div className="success-message visible mb-4">
          Your account and all associated data have been permanently deleted. Redirecting…
        </div>
      </div>
    );
  }

  return (
    <div className="account-deletion">
      {error && (
        <div className="bg-red/15 border border-red/30 rounded-xl p-4 mb-4 text-red text-sm">
          {error}
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Delete Account</h3>

        <p className="text-white/70 text-sm mb-4">
          Permanently delete your Nutri account and all associated data, immediately. This will:
        </p>

        <ul className="text-white/60 text-sm mb-6 space-y-2 list-disc list-inside">
          <li>Delete your profile, demographics, and preferences</li>
          <li>Delete all meal logs and nutrition tracking data</li>
          <li>Delete your consent records and API keys</li>
          <li>Delete your login credentials — you will be signed out everywhere</li>
        </ul>

        <p className="text-white/80 text-sm mb-6 font-semibold">
          This cannot be undone. There is no grace period or recovery window.
        </p>

        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={loading}
          className="danger-btn"
        >
          Delete My Account
        </button>
      </div>

      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => !loading && setShowConfirmModal(false)}
        >
          <div
            className="bg-gray-200 border border-red/30 rounded-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-4 text-red-light">
              Confirm Account Deletion
            </h3>

            <p className="text-white/80 text-sm mb-6">
              Are you absolutely sure? This will immediately and permanently delete all your
              data. There is no way to recover it afterward.
            </p>

            <div className="flex gap-4">
              <button
                onClick={confirmDeletion}
                disabled={loading}
                className="danger-btn flex-1"
              >
                {loading ? 'Deleting…' : 'Yes, Delete Permanently'}
              </button>

              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                className="secondary-btn flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
