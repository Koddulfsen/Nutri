/**
 * Account Deletion Component - FS-4 Security & Compliance System
 *
 * Purpose: GDPR Article 17 (Right to Erasure / Right to be Forgotten)
 * Location: /settings/privacy page
 * Grace Period: 30 days (cancellable)
 *
 * Created: 2025-11-10
 */

'use client';

import { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/utils/base-path';

interface AccountDeletionProps {
  userId: string;
}

interface DeletionStatus {
  hasPendingDeletion: boolean;
  scheduledDate: string | null;
  deletionRequestId: string | null;
}

export default function AccountDeletion({ userId }: AccountDeletionProps) {
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus>({
    hasPendingDeletion: false,
    scheduledDate: null,
    deletionRequestId: null
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for pending deletion on mount
  useEffect(() => {
    // TODO: Fetch pending deletion status from API
    // For now, check URL params for cancellation
    const urlParams = new URLSearchParams(window.location.search);
    const cancelDeletionId = urlParams.get('cancel-deletion');

    if (cancelDeletionId) {
      // Show cancellation confirmation
      setDeletionStatus({
        hasPendingDeletion: true,
        scheduledDate: null,
        deletionRequestId: cancelDeletionId
      });
    }
  }, [userId]);

  async function requestDeletion() {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(apiUrl('/api/user/delete-account'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request account deletion');
      }

      const data = await response.json();

      if (data.success) {
        setDeletionStatus({
          hasPendingDeletion: true,
          scheduledDate: data.scheduledDate,
          deletionRequestId: data.deletionRequestId
        });

        setSuccessMessage(`Account deletion scheduled for ${new Date(data.scheduledDate).toLocaleDateString()}. You can cancel within 30 days.`);
        setShowConfirmModal(false);

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request deletion');
    } finally {
      setLoading(false);
    }
  }

  async function cancelDeletion() {
    if (!deletionStatus.deletionRequestId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(apiUrl(`/api/user/delete-account?requestId=${deletionStatus.deletionRequestId}`), {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel deletion');
      }

      const data = await response.json();

      if (data.success) {
        setDeletionStatus({
          hasPendingDeletion: false,
          scheduledDate: null,
          deletionRequestId: null
        });

        setSuccessMessage('Account deletion cancelled successfully. Your account will remain active.');

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);

        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel deletion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="account-deletion">
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

      {/* Pending Deletion Warning */}
      {deletionStatus.hasPendingDeletion && deletionStatus.scheduledDate && (
        <div className="bg-red/20 border border-red/40 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-red-light">
            ⚠️ Account Deletion Scheduled
          </h3>
          <p className="text-white/80 text-sm mb-4">
            Your account is scheduled for deletion on{' '}
            <strong>{new Date(deletionStatus.scheduledDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</strong>.
            All your data will be permanently removed.
          </p>
          <p className="text-white/70 text-sm mb-4">
            You can cancel this deletion request anytime before the scheduled date.
          </p>
          <button
            onClick={cancelDeletion}
            disabled={loading}
            className="save-btn"
          >
            {loading ? 'Cancelling...' : 'Cancel Deletion'}
          </button>
        </div>
      )}

      {/* Deletion Request Section (when no pending deletion) */}
      {!deletionStatus.hasPendingDeletion && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Delete Account</h3>

          <p className="text-white/70 text-sm mb-4">
            Permanently delete your Nutri account and all associated data. This action will:
          </p>

          <ul className="text-white/60 text-sm mb-6 space-y-2 list-disc list-inside">
            <li>Delete your profile, health conditions, and preferences</li>
            <li>Delete all meal logs and nutrition tracking data</li>
            <li>Remove consent records (audit trail preserved for 6 years)</li>
            <li>Cancel any active subscriptions (if applicable)</li>
            <li>Notify third parties if data was shared (with consent)</li>
          </ul>

          <p className="text-white/80 text-sm mb-6 font-semibold">
            <strong>Grace Period:</strong> You have 30 days to cancel this deletion before it becomes permanent.
          </p>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={loading}
            className="danger-btn"
          >
            Delete My Account
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-gray-200 border border-red/30 rounded-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-4 text-red-light">
              Confirm Account Deletion
            </h3>

            <p className="text-white/80 text-sm mb-6">
              Are you absolutely sure you want to delete your account? This will:
            </p>

            <ul className="text-white/70 text-sm mb-6 space-y-2 list-disc list-inside">
              <li>Permanently delete all your data after 30 days</li>
              <li>Remove access to your meal logs and nutrition insights</li>
              <li>Cancel any active features or subscriptions</li>
            </ul>

            <p className="text-white/60 text-xs mb-6">
              You can cancel this deletion within 30 days by logging in and visiting your Privacy Settings.
            </p>

            <div className="flex gap-4">
              <button
                onClick={requestDeletion}
                disabled={loading}
                className="danger-btn flex-1"
              >
                {loading ? 'Processing...' : 'Yes, Delete My Account'}
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
