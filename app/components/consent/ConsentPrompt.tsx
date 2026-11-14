'use client';

/**
 * Asks for one consent at the moment a feature needs it.
 *
 * Shown in place of an error when the server refuses for want of a consent (see lib/consent). The
 * wording is the same as on Settings › Privacy, taken from one place. Allowing sends exactly one
 * flag to /api/consent and then hands control back so the caller can retry what the user was doing.
 *
 * It borrows its colours from the page it sits on (the `--action` / `--action-ink` pair on /analysis,
 * the accent elsewhere), so it needs no theme of its own.
 */

import Link from 'next/link';
import { useState } from 'react';
import { apiUrl } from '@/lib/utils/base-path';
import { CONSENT_COPY, type ConsentKey } from '@/lib/consent';

interface Props {
  consent: ConsentKey;
  /** Called once the consent is saved. Retry whatever was refused. */
  onAllowed: () => void;
  /** Called when the user says not now. */
  onDismiss: () => void;
}

export default function ConsentPrompt({ consent, onAllowed, onDismiss }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = CONSENT_COPY[consent];

  async function allow() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/consent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [consent]: true }),
      });
      if (!res.ok) throw new Error();
      onAllowed();
    } catch {
      setError('Could not save your choice. Nothing was changed.');
      setSaving(false);
    }
  }

  return (
    <div className="cp" role="group" aria-label={`Permission: ${copy.title}`}>
      <p className="cp-title">{copy.title}</p>
      <p className="cp-text">{copy.summary}</p>
      <div className="cp-actions">
        <button type="button" className="cp-allow" onClick={allow} disabled={saving}>
          {saving ? 'Saving…' : 'Allow'}
        </button>
        <button type="button" className="cp-later" onClick={onDismiss} disabled={saving}>
          Not now
        </button>
        <Link href="/settings/privacy" className="cp-manage">
          Manage in Settings
        </Link>
      </div>
      {error && <p className="cp-error" role="alert">{error}</p>}

      <style jsx>{`
        .cp {
          border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
          border-radius: 3px;
          padding: 12px 14px;
          margin: 8px 0;
          font-size: 13px;
          line-height: 1.45;
        }
        .cp-title { margin: 0 0 4px; font-weight: 500; }
        .cp-text { margin: 0 0 10px; opacity: 0.8; }
        .cp-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .cp-allow {
          font: inherit;
          font-weight: 500;
          padding: 7px 16px;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          background: var(--action, var(--accent, #508898));
          color: var(--action-ink, #fff);
          box-shadow: 0 3px 0 var(--action-dark, var(--accent-dark, #306070));
        }
        .cp-allow:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--action-dark, var(--accent-dark, #306070)); }
        .cp-allow:disabled { opacity: 0.6; cursor: default; }
        .cp-later {
          font: inherit;
          padding: 7px 4px;
          border: none;
          background: none;
          color: inherit;
          opacity: 0.7;
          cursor: pointer;
        }
        .cp-later:hover { opacity: 1; }
        .cp-manage { margin-left: auto; font-size: 12px; opacity: 0.7; color: inherit; text-decoration: underline; }
        .cp-manage:hover { opacity: 1; }
        .cp-error { margin: 8px 0 0; font-size: 12px; }
      `}</style>
    </div>
  );
}
