'use client';

/**
 * Security Buttons Component
 *
 * Client-side interactive buttons for password change, MFA, and account deletion.
 * Extracted from AccountSettingsPage to separate server/client concerns.
 */

export function ChangePasswordButton() {
  return (
    <button
      type="button"
      className="px-5 py-2.5 bg-transparent border-2 border-cyan text-sm font-semibold cursor-pointer text-cyan-light rounded-lg hover:bg-cyan/15 transition-all duration-300"
      onClick={() => alert('Change password flow - opens modal')}
    >
      Change Password
    </button>
  );
}

export function EnableMFAButton() {
  return (
    <button
      type="button"
      className="px-5 py-2.5 bg-transparent border-2 border-magenta text-sm font-semibold cursor-pointer text-magenta-light rounded-lg hover:bg-magenta/15 transition-all duration-300"
      onClick={() => alert('Enable MFA flow - opens setup wizard')}
    >
      Enable MFA
    </button>
  );
}

export function DeleteAccountButton() {
  return (
    <button
      type="button"
      className="px-5 py-2.5 bg-red border-2 border-red text-sm font-semibold cursor-pointer text-white rounded-lg hover:bg-red/80 transition-all duration-300"
      onClick={() => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
          alert('Delete account flow - requires password confirmation');
        }
      }}
    >
      Delete Account
    </button>
  );
}
