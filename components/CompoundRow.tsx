'use client';

import type { Compound } from '@/lib/types';
import ContributingFoods from './ContributingFoods';

interface CompoundRowProps {
  compound: Compound;
  showContributingFoods: boolean;
  onToggleFoods: () => void;
}

export default function CompoundRow({
  compound,
  showContributingFoods,
  onToggleFoods
}: CompoundRowProps) {
  const getZoneIcon = (zone: 'optimal' | 'warning' | 'deficient' | 'excess') => {
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

  const getConfidenceBadgeClass = (confidence: number) => {
    if (confidence >= 85) return 'confidence-badge zone-optimal';
    if (confidence >= 70) return 'confidence-badge warning';
    return 'confidence-badge low';
  };

  const getRdaBarWidth = (rdaPercent: number) => {
    return Math.min(rdaPercent, 100);
  };

  const getRdaBarClass = (zone: 'optimal' | 'warning' | 'deficient' | 'excess') => {
    return `rda-bar-fill ${zone}`;
  };

  return (
    <>
      <article
        className="compound-row"
        role="row"
        onClick={onToggleFoods}
        style={{ cursor: compound?.contributingFoods ? 'pointer' : 'default' }}
      >
        <div className="compound-name" role="cell">
          {compound?.name ?? 'Unknown'}
        </div>
        <div className="compound-value" role="cell">
          <div className="value-amount">{compound?.amount ?? 'N/A'}</div>
          <div className="value-rda">({compound?.rdaPercent ?? 0}% RDA)</div>
        </div>
        <div className="compound-meter" role="cell">
          <div
            className="rda-bar"
            role="progressbar"
            aria-valuenow={compound?.rdaPercent ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={getRdaBarClass(compound?.zone ?? 'optimal')}
              style={{ width: `${getRdaBarWidth(compound?.rdaPercent ?? 0)}%` }}
            ></div>
          </div>
          <span className={getConfidenceBadgeClass(compound?.confidence ?? 0)}>
            <span>{getZoneIcon(compound?.zone ?? 'optimal')}</span>
            <span>{compound?.confidence ?? 0}</span>
          </span>
        </div>
      </article>

      {showContributingFoods && compound?.contributingFoods && (
        <ContributingFoods foods={compound.contributingFoods} />
      )}
    </>
  );
}
