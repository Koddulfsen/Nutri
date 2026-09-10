/**
 * ResetPasswordForm Component
 *
 * Purpose: Set a new password after following a reset link
 * Server Action: updatePassword() from app/(auth)/actions.ts
 *
 * The page that renders this has already exchanged the emailed code for a
 * session, so the user is authenticated by the time they see this form.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updatePassword } from '@/app/(auth)/actions';

export default function ResetPasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const result = await updatePassword(new FormData(e.currentTarget));

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    // The reset link signed this user in, so they are already authenticated —
    // send them straight to the app rather than back through the login form.
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 1200);
  };

  if (done) {
    return (
      <div className="form-panel">
        <div className="auth-header">
          <h1>Password updated</h1>
          <p>Taking you to your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-panel">
      <div className="auth-header">
        <h1>Set a new password</h1>
        <p>Choose something you have not used here before.</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="password">New password</label>
          <div className="input-wrapper password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm new password</label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Set password'}
        </button>
      </form>

      <div className="forgot-password" style={{ marginTop: 16 }}>
        <Link href="/login" className="form-link">
          Back to log in
        </Link>
      </div>
    </div>
  );
}
