/**
 * AnalysisHeader Component
 *
 * Purpose: Universal header for all pages matching wireframe design
 * Layout: Logo (left) | Nav Links (center) | User Avatar (right)
 * Style: Clean minimalist design with cyan-magenta color scheme
 *
 * Generated: 2025-11-17
 * Based on: .wiz/phases/phase-1-browse-compounds/ui-design/analysis-unified.html
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface AnalysisHeaderProps {
  user?: {
    id: string;
    email?: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
}

export default function AnalysisHeader({ user: userProp }: AnalysisHeaderProps = {}) {
  const [user, setUser] = useState(userProp);

  // Fetch user if not provided
  useEffect(() => {
    if (!userProp) {
      const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url
          });
        }
      };
      fetchUser();
    }
  }, [userProp]);

  return (
    <header>
      <div className="header-content">
        {/* Logo */}
        <Link href="/" className="logo">NUTRI</Link>

        {/* Navigation */}
        <nav>
          <Link href="/analysis">Track</Link>
          <Link href="/dashboard">Dashboard</Link>

          {/* User Avatar */}
          {user && (
            <Link href="/settings/account" className="user-avatar" aria-label="Account">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
              </svg>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
