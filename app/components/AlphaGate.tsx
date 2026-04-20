'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/utils/base-path';
import HeaderWrapper from '@/app/components/navigation/HeaderWrapper';

export default function AlphaGate() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/waitlist'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to join waitlist');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="alpha-gate-page">
      <HeaderWrapper />

      <main className="alpha-gate-main">
        <div className="alpha-gate-card">
          <span className="alpha-gate-tag">Alpha testing</span>
          <h1 className="alpha-gate-title">Nutri is still being built.</h1>
          <p className="alpha-gate-body">
            This is an early stage of the project — the data pipelines and food-compound
            mappings are still being verified. To keep the experience honest, access to the
            tracker is limited while we sort things out.
          </p>
          <p className="alpha-gate-body">
            Want to be notified when it opens up? Leave your email and we&apos;ll let you know.
          </p>

          {submitted ? (
            <div className="alpha-gate-thanks">
              Thanks — you&apos;re on the list.
            </div>
          ) : (
            <form className="alpha-gate-form" onSubmit={handleSubmit}>
              <input
                type="email"
                className="alpha-gate-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
              <button
                type="submit"
                className="alpha-gate-btn"
                disabled={submitting || !email.trim()}
              >
                {submitting ? 'Submitting...' : 'Notify me'}
              </button>
            </form>
          )}

          {error && <div className="alpha-gate-error">{error}</div>}
        </div>
      </main>

      <style jsx>{`
        .alpha-gate-page {
          min-height: 100vh;
          background: var(--bg, #0a0a0c);
          color: var(--text-1, #e8e8f4);
          font-family: var(--font-body, 'DM Sans', sans-serif);
        }

        .alpha-gate-main {
          max-width: 680px;
          margin: 0 auto;
          padding: 80px 24px;
        }

        .alpha-gate-card {
          background: var(--bg-soft, #101014);
          border: 1px solid var(--border, #1e1e24);
          border-radius: 3px;
          padding: 40px;
        }

        .alpha-gate-tag {
          display: inline-block;
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent, #508898);
          background: var(--accent-soft, rgba(80,136,152,0.08));
          border: 1px solid var(--accent-border, rgba(80,136,152,0.14));
          padding: 4px 10px;
          border-radius: 3px;
          margin-bottom: 20px;
        }

        .alpha-gate-title {
          font-family: var(--font-display, 'Instrument Serif', serif);
          font-size: 40px;
          font-weight: 400;
          margin: 0 0 20px 0;
          line-height: 1.1;
          color: var(--text-1, #e8e8f4);
        }

        .alpha-gate-body {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-2, #8080a0);
          margin: 0 0 16px 0;
        }

        .alpha-gate-form {
          display: flex;
          gap: 10px;
          margin-top: 28px;
        }

        .alpha-gate-input {
          flex: 1 1 0;
          min-width: 0;
          height: 48px;
          padding: 0 14px;
          background: var(--surface, #0e0e12);
          border: 1px solid transparent;
          border-radius: 3px;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
          color: var(--text-1, #e8e8f4);
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .alpha-gate-input:focus {
          border-color: transparent;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(34, 211, 238, 0.3);
        }

        .alpha-gate-input::placeholder {
          color: var(--text-3, #484860);
        }

        .alpha-gate-btn {
          flex: 0 0 auto;
          height: 48px;
          padding: 0 22px;
          background: var(--accent, #508898);
          color: #fff;
          border: none;
          border-radius: 3px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 4px 0 var(--accent-dark, #306070);
          transition: transform 0.08s, box-shadow 0.08s;
        }

        .alpha-gate-btn:hover:not(:disabled) {
          transform: translateY(2px);
          box-shadow: 0 2px 0 var(--accent-dark, #306070);
        }

        .alpha-gate-btn:active:not(:disabled) {
          transform: translateY(4px);
          box-shadow: 0 0 0 var(--accent-dark, #306070);
        }

        .alpha-gate-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .alpha-gate-thanks {
          margin-top: 28px;
          padding: 16px;
          background: var(--accent-soft, rgba(80,136,152,0.08));
          border: 1px solid var(--accent-border, rgba(80,136,152,0.14));
          border-radius: 3px;
          color: var(--accent, #508898);
          font-size: 14px;
          text-align: center;
        }

        .alpha-gate-error {
          margin-top: 16px;
          color: #ef4444;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
