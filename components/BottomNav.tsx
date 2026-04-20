'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface BottomNavProps {
  activeTab: 'home' | 'track' | 'rda' | 'more';
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const router = useRouter();

  const handleNavigation = (tab: string) => {
    // TODO Phase 2: Implement routing when pages are ready
    console.log(`Navigate to ${tab}`);

    switch (tab) {
      case 'home':
        // router.push('/');
        break;
      case 'track':
        // router.push('/track-meal');
        break;
      case 'rda':
        // router.push('/rda');
        break;
      case 'more':
        // router.push('/more');
        break;
    }
  };

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Mobile navigation">
      <div className="bottom-nav-content">
        <div
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => handleNavigation('home')}
        >
          <span style={{ fontSize: '24px' }}>🏠</span>
          <span>Home</span>
        </div>
        <div
          className={`nav-item ${activeTab === 'track' ? 'active' : ''}`}
          onClick={() => handleNavigation('track')}
        >
          <span style={{ fontSize: '24px' }}>➕</span>
          <span>Track</span>
        </div>
        <div
          className={`nav-item ${activeTab === 'rda' ? 'active' : ''}`}
          onClick={() => handleNavigation('rda')}
        >
          <span style={{ fontSize: '24px' }}>📊</span>
          <span>RDA</span>
        </div>
        <div
          className={`nav-item ${activeTab === 'more' ? 'active' : ''}`}
          onClick={() => handleNavigation('more')}
        >
          <span style={{ fontSize: '24px' }}>⋯</span>
          <span>More</span>
        </div>
      </div>
    </nav>
  );
}
