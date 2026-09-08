/**
 * SignUpForm Component
 *
 * Purpose: Sign up form with email/password and OAuth options
 * Server Actions: signUp(), signInWithOAuth() from app/(auth)/actions.ts
 *
 * Similar to LoginForm but with password confirmation & strength indicator
 * Generated: 2025-11-10
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp, signInWithOAuth } from '@/app/(auth)/actions';

interface SignUpFormProps {
  error?: string | null;
}

export default function SignUpForm({ error: initialError }: SignUpFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleOAuthSignUp = async (provider: 'google' | 'apple') => {
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
    setSuccess(null);

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(e.currentTarget);

    const result = await signUp(formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else if (result?.success && result?.email) {
      // Redirect to verify-email page with email in URL
      router.push(`/verify-email?email=${encodeURIComponent(result.email)}`);
    } else {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pwd: string): { strength: string; color: string } => {
    if (pwd.length === 0) return { strength: '', color: '' };
    if (pwd.length < 8) return { strength: 'Weak', color: 'var(--red)' };
    if (pwd.length < 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
      return { strength: 'Medium', color: 'var(--yellow)' };
    }
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
      return { strength: 'Strong', color: 'var(--green)' };
    }
    return { strength: 'Medium', color: 'var(--yellow)' };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="form-panel">
      <div className="auth-header">
        <h1>Sign Up</h1>
        <p>
          Already have an account?{' '}
          <Link href="/login">Log in</Link>
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
            onClick={() => handleOAuthSignUp('google')}
            className="oauth-btn google"
          >
            <div className="oauth-icon">G</div>
            <span>Continue with Google</span>
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignUp('apple')}
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
          <span>or sign up with email</span>
        </div>
      )}

      {/* Sign Up Form */}
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
          {/* Password Strength Indicator */}
          {passwordStrength.strength && (
            <p className="text-xs mt-2" style={{ color: passwordStrength.color }}>
              Password strength: {passwordStrength.strength}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="input-wrapper password-field">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="password-toggle"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}
