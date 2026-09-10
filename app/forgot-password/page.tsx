/**
 * Forgot Password Page
 *
 * Purpose: Password reset request via email
 * Layout: 6+6 split (AuthBrandingPanel + Reset Form)
 *
 * Generated: 2025-11-10
 */

'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { resetPassword } from '@/app/(auth)/actions';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  // /auth/reset-password sends the user back here when the emailed link is
  // expired, already used, or malformed. Without this the redirect landed on a
  // form that gave no reason it had failed.
  const [error, setError] = useState<string | null>(searchParams.get('error'));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await resetPassword(email);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.message || 'Password reset instructions sent to your email.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="auth-standalone">
        <div className="form-panel">
          <div className="auth-header">
            <h1>Forgot Password</h1>
            <p>
              Enter your email and we&apos;ll send you instructions to reset your password.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          {/* Reset Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="text-center mt-6">
            <Link href="/login" className="form-link">
              Back to Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * useSearchParams needs a Suspense boundary, or the whole route opts into
 * client-side rendering and the production build warns.
 */
export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
