/**
 * ProfileForm Component
 *
 * Purpose: User profile settings form (avatar, name, email)
 * Server Actions: updateProfile() from app/(auth)/actions.ts
 *
 * Extracted from: settings-account.html lines 1342-1376
 * Generated: 2025-11-10
 */

'use client';

import { useState } from 'react';
import { updateProfile } from '@/app/(auth)/actions';

interface ProfileFormProps {
  profile: {
    id: string;
    userId: string;
    fullName: string | null;
    avatarUrl: string | null;
    email: string;
  };
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG images are allowed');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // TODO: Implement avatar upload to Supabase Storage
      // For now, just simulate upload
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAvatarUrl(dataUrl);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar');
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await updateProfile({
      full_name: fullName,
      avatar_url: avatarUrl || undefined
    });

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess('Profile updated successfully');
    }

    setIsSubmitting(false);
  };

  const displayInitial = fullName?.[0] || profile.email?.[0] || 'U';

  return (
    <section className="bg-white/5 border border-white/15 rounded-2xl p-8 mb-6">
      <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-white/15 text-cyan-light">
        Profile Information
      </h2>

      {/* Success/Error Messages */}
      {success && (
        <div className="success-message mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="error-message mb-4">
          {error}
        </div>
      )}

      {/* Avatar Upload */}
      <div className="flex items-center gap-6 mb-8">
        <label
          htmlFor="avatar-input"
          className="w-28 h-28 bg-gradient-to-br from-cyan-dark to-cyan-light border-2 border-cyan rounded-full flex items-center justify-center text-4xl font-bold text-black relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105"
          style={{ boxShadow: '0 4px 20px rgba(34, 211, 238, 0.3)' }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            displayInitial.toUpperCase()
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-sm text-white">
              Uploading...
            </div>
          )}
        </label>
        <input
          id="avatar-input"
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleAvatarUpload}
          className="hidden"
        />
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => document.getElementById('avatar-input')?.click()}
            className="px-5 py-2.5 bg-transparent border-2 border-cyan text-sm font-semibold cursor-pointer text-cyan-light rounded-lg hover:bg-cyan/15 transition-all duration-300"
          >
            Upload New Photo
          </button>
          <p className="text-xs text-white/60">JPG or PNG, max 2MB</p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        {/* Full Name Field */}
        <div className="form-group mb-6">
          <label htmlFor="full-name" className="block text-sm font-medium mb-2 text-white">
            Full Name
          </label>
          <div className="input-wrapper relative">
            <input
              type="text"
              id="full-name"
              name="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full max-w-lg p-3 border-2 border-transparent bg-white/5 text-sm text-white rounded-lg transition-all duration-300 focus:outline-none focus:bg-white/10"
            />
          </div>
        </div>

        {/* Email Field (Read-only) */}
        <div className="form-group mb-6">
          <label htmlFor="email" className="block text-sm font-medium mb-2 text-white">
            Email Address
          </label>
          <div className="flex gap-3 items-center">
            <div className="input-wrapper relative flex-1">
              <input
                type="email"
                id="email"
                value={profile.email}
                readOnly
                className="w-full p-3 border-2 border-transparent bg-white/5 text-sm text-white rounded-lg opacity-60 cursor-not-allowed"
              />
            </div>
            <button
              type="button"
              className="px-5 py-2.5 bg-transparent border-2 border-magenta text-sm font-semibold cursor-pointer whitespace-nowrap text-magenta-light rounded-lg hover:bg-magenta/15 transition-all duration-300"
              onClick={() => alert('Email update flow - opens verification modal')}
            >
              Update Email
            </button>
          </div>
          <p className="text-xs text-white/60 mt-2">
            Updating your email will trigger a verification flow
          </p>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-gradient-to-br from-cyan-dark to-cyan-light text-black border-none text-sm font-semibold cursor-pointer mt-2 rounded-lg relative disabled:opacity-50 transition-all duration-100"
          style={{
            boxShadow: '0 8px 0 var(--cyan-dark), 0 12px 20px rgba(0, 0, 0, 0.4)',
            transform: 'translateY(0)'
          }}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </section>
  );
}
