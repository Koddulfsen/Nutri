/**
 * LoginForm Component
 *
 * Purpose: Login form with email/password and OAuth options
 * Server Actions: signIn(), signInWithOAuth() from app/(auth)/actions.ts
 *
 * Extracted from: auth-login.html lines 549-610
 * Generated: 2025-11-10
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn, signInWithOAuth } from '@/app/(auth)/actions';

interface LoginFormProps {
  error?: string | null;
}

export default function LoginForm({ error: initialError }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(initialError);

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    const result = await signInWithOAuth(provider);

    if (result?.error) {
      setError(result.error);
    } else if (result?.url) {
      // Redirect to OAuth consent screen
      window.location.href = result.url;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const result = await signIn(formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
    // Success case: redirect handled by signIn() Server Action
  };

  return (
    <div className="form-panel">
      <div className="auth-header">
        <h1>Log In</h1>
        <p>
          Don&apos;t have an account?{' '}
          <Link href="/signup">Sign up</Link>
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* OAuth. Hidden unless NEXT_PUBLIC_ENABLE_OAUTH is 'true', because a
          provider that is not configured in Supabase gives the user a button
          that only produces an error. Set that variable once Google (and/or
          Apple) actually has credentials, and these come back with no code
          change. */}
      {process.env.NEXT_PUBLIC_ENABLE_OAUTH === 'true' && (
        <>
        <div className="oauth-buttons">
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            className="oauth-btn google"
          >
            <div className="oauth-icon">G</div>
            <span>Continue with Google</span>
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin('apple')}
            className="oauth-btn apple"
          >
            <div className="oauth-icon" style={{ background: 'var(--white)', color: 'var(--black)' }}>
              A
            </div>
            <span>Continue with Apple</span>
          </button>
        </div>
        </>
      )}

      {/* Divider — only meaningful when there is something to divide from. */}
      {process.env.NEXT_PUBLIC_ENABLE_OAUTH === 'true' && (
        <div className="divider">
          <span>or continue with email</span>
        </div>
      )}

      {/* Login Form */}
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
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="input-wrapper password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              placeholder="••••••••"
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

        {/* Remember Me & Forgot Password */}
        <div className="checkbox-group">
          <input type="checkbox" id="remember" name="remember" />
          <label htmlFor="remember" className="checkbox-label">
            Remember me
          </label>
        </div>

        <div className="forgot-password">
          <Link href="/forgot-password" className="form-link">
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}
