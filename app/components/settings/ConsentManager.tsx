/**
 * Consent Manager Component - FS-4 Security & Compliance System
 *
 * Purpose: GDPR Article 7 compliant consent management with granular toggles
 * Location: /settings/privacy page
 * Design: Frost Shimmer toggles, "Accept All" / "Reject All" buttons
 *
 * Created: 2025-11-10
 */

'use client';

import { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/utils/base-path';

interface ConsentStatus {
  newsletter: boolean;
  pushNotifications: boolean;
  research: boolean;
  analytics: boolean;
  thirdParty: boolean;
}

interface ConsentManagerProps {
  userId: string;
}

export default function ConsentManager({ userId }: ConsentManagerProps) {
  const [consent, setConsent] = useState<ConsentStatus>({
    newsletter: false,
    pushNotifications: false,
    research: false,
    analytics: false,
    thirdParty: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch current consent status on mount
  useEffect(() => {
    fetchConsent();
  }, [userId]);

  async function fetchConsent() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiUrl('/api/consent'));

      if (!response.ok) {
        throw new Error('Failed to fetch consent status');
      }

      const data = await response.json();
      setConsent({
        newsletter: data.newsletter,
        pushNotifications: data.pushNotifications,
        research: data.research,
        analytics: data.analytics,
        thirdParty: data.thirdParty
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consent preferences');
    } finally {
      setLoading(false);
    }
  }

  async function updateConsent(updates: Partial<ConsentStatus>) {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(apiUrl('/api/consent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update consent');
      }

      const data = await response.json();

      if (data.success) {
        // Update local state
        setConsent(prevConsent => ({ ...prevConsent, ...updates }));
        setSuccessMessage('Consent preferences updated successfully');

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update consent');
    } finally {
      setSaving(false);
    }
  }

  function handleToggle(type: keyof ConsentStatus) {
    const newValue = !consent[type];
    updateConsent({ [type]: newValue });
  }

  function handleAcceptAll() {
    updateConsent({
      newsletter: true,
      pushNotifications: true,
      research: true,
      analytics: true,
      thirdParty: true
    });
  }

  function handleRejectAll() {
    updateConsent({
      newsletter: false,
      pushNotifications: false,
      research: false,
      analytics: false,
      thirdParty: false
    });
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan"></div>
        <p className="mt-4 text-white/70">Loading consent preferences...</p>
      </div>
    );
  }

  return (
    <div className="consent-manager">
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

      {/* Consent Type Explanations */}
      <div className="mb-6">
        <p className="text-white/70 text-sm mb-4">
          We respect your privacy. Choose which types of data processing you consent to:
        </p>
      </div>

      {/* Consent Toggles */}
      <div className="space-y-4 mb-6">
        {/* Newsletter Consent */}
        <ConsentToggle
          label="Newsletter & Marketing Emails"
          description="Receive product updates, nutrition tips, and exclusive offers"
          icon="📧"
          checked={consent.newsletter}
          onChange={() => handleToggle('newsletter')}
          disabled={saving}
        />

        {/* Push Notifications Consent */}
        <ConsentToggle
          label="Push Notifications"
          description="Browser notifications for meal reminders and daily summaries"
          icon="🔔"
          checked={consent.pushNotifications}
          onChange={() => handleToggle('pushNotifications')}
          disabled={saving}
        />

        {/* Research Consent */}
        <ConsentToggle
          label="Research & Anonymized Data"
          description="Allow anonymized usage data for nutrition research (fully de-identified)"
          icon="🔬"
          checked={consent.research}
          onChange={() => handleToggle('research')}
          disabled={saving}
        />

        {/* Analytics Consent */}
        <ConsentToggle
          label="Analytics & Performance"
          description="Help us improve the app by tracking usage patterns"
          icon="📊"
          checked={consent.analytics}
          onChange={() => handleToggle('analytics')}
          disabled={saving}
        />

        {/* Third-Party Consent */}
        <ConsentToggle
          label="Third-Party Data Sharing"
          description="Share data with trusted partners (list available in Privacy Policy)"
          icon="🤝"
          checked={consent.thirdParty}
          onChange={() => handleToggle('thirdParty')}
          disabled={saving}
        />
      </div>

      {/* Accept All / Reject All Buttons */}
      <div className="flex gap-4 pt-4 border-t border-white/10">
        <button
          onClick={handleAcceptAll}
          disabled={saving}
          className="save-btn"
        >
          {saving ? 'Updating...' : 'Accept All'}
        </button>

        <button
          onClick={handleRejectAll}
          disabled={saving}
          className="secondary-btn"
        >
          {saving ? 'Updating...' : 'Reject All'}
        </button>
      </div>

      {/* GDPR Compliance Note */}
      <p className="text-white/50 text-xs mt-4">
        You can withdraw consent at any time. Changes take effect immediately for newsletter and push notifications.
        Analytics and third-party data may take up to 30 days to fully remove.
      </p>
    </div>
  );
}

/**
 * Consent Toggle Component
 *
 * Individual toggle switch with Frost Shimmer effect
 */
interface ConsentToggleProps {
  label: string;
  description: string;
  icon: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function ConsentToggle({
  label,
  description,
  icon,
  checked,
  onChange,
  disabled = false
}: ConsentToggleProps) {
  return (
    <div className="consent-toggle-wrapper">
      <label className="consent-toggle">
        <div className="consent-toggle-icon">{icon}</div>
        <div className="consent-toggle-content">
          <h4 className="consent-toggle-label">{label}</h4>
          <p className="consent-toggle-description">{description}</p>
        </div>
        <div className="toggle-switch-wrapper">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="toggle-switch-input sr-only"
          />
          <div className={`toggle-switch ${checked ? 'toggle-switch-on' : 'toggle-switch-off'}`}>
            <div className="toggle-switch-handle"></div>
          </div>
        </div>
      </label>
    </div>
  );
}
