'use client';

/**
 * The consents, one row each: what it does, whether it is on, and what turning it off leaves behind.
 *
 * Each change is saved the moment it is made (one flag, one request) and the row shows the result of
 * the server's answer, never the click. Withdrawing weight or pregnancy status stops Nutri using the
 * value but does not delete it, so those rows offer an explicit "Erase" — the two actions are kept
 * separate and described as such. Wording comes from lib/consent so it matches the prompts.
 */

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/utils/base-path';
import { CONSENT_COPY, CONSENT_KEYS, type ConsentKey } from '@/lib/consent';

type Flags = Record<ConsentKey, boolean>;

/** What "erase" clears for the consents that store a value, as a demographics PATCH body. */
const ERASE: Partial<Record<ConsentKey, { label: string; body: Record<string, unknown> }>> = {
  bodyMeasurements: { label: 'Erase my saved weight', body: { bodyWeightKg: null } },
  sensitiveHealthData: { label: 'Erase my saved status', body: { lifeStage: 'NONE' } },
};

export default function PrivacyConsents() {
  const [flags, setFlags] = useState<Flags | null>(null);
  const [busy, setBusy] = useState<ConsentKey | 'erase' | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/consent'));
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFlags({
        aiProcessing: !!data.aiProcessing,
        bodyMeasurements: !!data.bodyMeasurements,
        sensitiveHealthData: !!data.sensitiveHealthData,
      });
    } catch {
      setMessage({ kind: 'error', text: 'Could not load your settings. Reload the page to try again.' });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(key: ConsentKey) {
    if (!flags) return;
    const next = !flags[key];
    setBusy(key);
    setMessage(null);
    try {
      const res = await fetch(apiUrl('/api/consent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: next }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFlags({
        aiProcessing: !!data.consent.aiProcessing,
        bodyMeasurements: !!data.consent.bodyMeasurements,
        sensitiveHealthData: !!data.consent.sensitiveHealthData,
      });
      setMessage({ kind: 'ok', text: `${CONSENT_COPY[key].title} is now ${next ? 'on' : 'off'}.` });
    } catch {
      setMessage({ kind: 'error', text: 'Could not save that change. Nothing was changed.' });
    } finally {
      setBusy(null);
    }
  }

  async function erase(key: ConsentKey) {
    const action = ERASE[key];
    if (!action) return;
    setBusy('erase');
    setMessage(null);
    try {
      const res = await fetch(apiUrl('/api/user/demographics'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.body),
      });
      if (!res.ok) throw new Error();
      setMessage({ kind: 'ok', text: 'Erased. Nutri no longer holds that value.' });
    } catch {
      setMessage({ kind: 'error', text: 'Could not erase that. Nothing was changed.' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="pv-section" aria-labelledby="pv-consents">
      <h2 id="pv-consents" className="pv-h2">What Nutri may do</h2>

      {message && (
        <p className={message.kind === 'ok' ? 'pv-note pv-note--ok' : 'pv-note pv-note--error'} role="status">
          {message.text}
        </p>
      )}

      {!flags && !message && <p className="pv-muted">Loading&hellip;</p>}

      {flags && (
        <ul className="pv-rows">
          {CONSENT_KEYS.map((key) => {
            const copy = CONSENT_COPY[key];
            const on = flags[key];
            const eraseAction = ERASE[key];
            return (
              <li key={key} className="pv-row">
                <div className="pv-row-head">
                  <div className="pv-row-text">
                    <h3 className="pv-h3">{copy.title}</h3>
                    <p className="pv-text">{copy.summary}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={copy.title}
                    className={`pv-switch${on ? ' pv-switch--on' : ''}`}
                    onClick={() => toggle(key)}
                    disabled={busy !== null}
                  >
                    <span className="pv-switch-state">{on ? 'On' : 'Off'}</span>
                  </button>
                </div>
                <p className="pv-fine"><span className="pv-fine-label">If you turn this off:</span> {copy.whenOff}</p>
                {eraseAction && !on && (
                  <button
                    type="button"
                    className="pv-link"
                    onClick={() => erase(key)}
                    disabled={busy !== null}
                  >
                    {eraseAction.label}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
