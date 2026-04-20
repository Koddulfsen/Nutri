'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TopNavProps {
  userName?: string;
}

export default function TopNav({ userName }: TopNavProps) {
  const router = useRouter();

  const handleTrackMeal = () => {
    // TODO Phase 2: Restore when /track-meal page is implemented
    // router.push('/track-meal');
    console.log('Track Meal button clicked - route not yet implemented');
  };

  return (
    <nav className="top-nav" role="navigation" aria-label="Main navigation">
      <div className="top-nav-content">
        <div className="nav-logo">Nutri</div>
        <div className="nav-actions">
          <button className="nav-button">Search</button>
          <button className="btn-primary" onClick={handleTrackMeal}>Track Meal</button>
          <button className="nav-button">RDA</button>
          <button className="nav-button">
            {userName ?? 'Profile'}
          </button>
        </div>
      </div>
    </nav>
  );
}
