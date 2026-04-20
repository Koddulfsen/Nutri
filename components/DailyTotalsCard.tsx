'use client';

import React, { useState } from 'react';
import type { Compound } from '@/lib/types';

interface DailyTotalsCardProps {
  compounds: Compound[];
  totalCompounds?: number;
  onViewAllClick?: () => void;
}

export default function DailyTotalsCard({
  compounds,
  totalCompounds = 280,
  onViewAllClick
}: DailyTotalsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Helper to get zone icon
  const getZoneIcon = (zone: Compound['zone']): string => {
    switch (zone) {
      case 'optimal':
        return '✓';
      case 'warning':
        return '⚠️';
      case 'deficient':
        return '↓';
      case 'excess':
        return '↑';
      default:
        return '';
    }
  };

  // Helper to get zone class
  const getZoneClass = (zone: Compound['zone']): string => {
    return `zone-${zone}`;
  };

  return (
    <section className="col-6" aria-label="Daily totals summary">
      <article className="card-elevated">
        <div
          className="card-header-text"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          Daily Totals {isExpanded ? '▼' : '▶'}
        </div>
        {isExpanded && (
          <div>
            {compounds?.length > 0 ? (
              <>
                {/* Split into groups of 2 for grid layout */}
                {Array.from({ length: Math.ceil(compounds.length / 2) }).map(
                  (_, groupIndex) => (
                    <div className="totals-grid" key={groupIndex}>
                      {compounds
                        .slice(groupIndex * 2, groupIndex * 2 + 2)
                        .map((compound) => (
                          <div className="total-item" key={compound.id}>
                            <div className="total-name">{compound.name}</div>
                            <div className="total-value">
                              {compound.amount} ({compound.rdaPercent}% RDA)
                            </div>
                            <span
                              className={`total-badge ${
                                compound.zone === 'warning' ? 'warning' : ''
                              } ${getZoneClass(compound.zone)}`}
                            >
                              <span>{getZoneIcon(compound.zone)}</span>
                              <span>{compound.confidence} confidence</span>
                            </span>
                          </div>
                        ))}
                    </div>
                  )
                )}
                <div
                  className="view-all-link"
                  onClick={onViewAllClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onViewAllClick?.();
                    }
                  }}
                >
                  View All {totalCompounds} Compounds →
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.5)' }}>
                No compound data available
              </div>
            )}
          </div>
        )}
      </article>
    </section>
  );
}
