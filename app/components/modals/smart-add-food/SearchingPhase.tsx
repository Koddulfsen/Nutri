'use client';

/**
 * SearchingPhase - Progress UI during parallel search + AI ranking
 *
 * Phase 2 of the Smart Add Food flow.
 * Shows a grid of source tiles with status indicators.
 */

import { FOOD_SOURCES } from '../add-food/source-config';
import type { SourceStatus } from './types';

interface SearchingPhaseProps {
  sourceStatuses: Record<string, SourceStatus>;
}

export default function SearchingPhase({ sourceStatuses }: SearchingPhaseProps) {
  const enabledSources = FOOD_SOURCES.filter((s) => s.enabled);

  const totalSources = enabledSources.length;
  const searchedCount = Object.values(sourceStatuses).filter((s) => s.searched).length;
  const rankedCount = Object.values(sourceStatuses).filter((s) => s.ranked).length;

  const phase = rankedCount > 0 ? 'ranking' : searchedCount > 0 ? 'searching' : 'starting';
  const progressPercent = Math.round(
    ((searchedCount + rankedCount) / (totalSources * 2)) * 100
  );

  return (
    <div className="searching-phase">
      <div className="searching-header">
        <div className="searching-title">
          {phase === 'starting' && 'Searching databases...'}
          {phase === 'searching' && `Searching... (${searchedCount}/${totalSources})`}
          {phase === 'ranking' && `AI ranking... (${rankedCount}/${totalSources})`}
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="source-grid">
        {enabledSources.map((source) => {
          const status = sourceStatuses[source.code];
          let state: 'pending' | 'searching' | 'ranking' | 'done' | 'error' = 'pending';
          if (status?.error) state = 'error';
          else if (status?.ranked) state = 'done';
          else if (status?.searched) state = 'ranking';
          else if (status?.searched === false && Object.keys(sourceStatuses).length > 0) state = 'searching';

          return (
            <div key={source.code} className={`source-tile ${state}`}>
              <div className="tile-icon">{source.icon}</div>
              <div className="tile-name">{source.shortName}</div>
              <div className="tile-status">
                {state === 'pending' && <span className="status-dot pending" />}
                {state === 'searching' && <span className="status-spinner" />}
                {state === 'ranking' && <span className="status-pulse" />}
                {state === 'done' && <span className="status-check">{'\u2713'}</span>}
                {state === 'error' && <span className="status-error">{'\u2717'}</span>}
              </div>
              {state === 'done' && status && (
                <div className="tile-count">{status.resultCount} results</div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .searching-phase {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 8px 0;
          font-family: var(--font-body, 'DM Sans', sans-serif);
        }

        .searching-header {
          text-align: center;
        }

        .searching-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-2, #8080a0);
          margin-bottom: 12px;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: var(--border, #1e1e24);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--accent, #508898);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .source-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 6px;
        }

        .source-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 6px;
          border-radius: 3px;
          border: 1px solid var(--border, #1e1e24);
          background: var(--bg-accent, #0f0f0f);
          transition: border-color 0.3s ease, background 0.3s ease;
        }

        .source-tile.searching {
          border-color: var(--accent-border, rgba(80,136,152,0.14));
          background: var(--accent-soft, rgba(80,136,152,0.06));
        }

        .source-tile.ranking {
          border-color: var(--accent-border, rgba(80,136,152,0.14));
          background: var(--accent-soft, rgba(80,136,152,0.06));
          animation: pulse-bg 1.5s ease-in-out infinite;
        }

        .source-tile.done {
          border-color: rgba(80, 136, 152, 0.2);
          background: rgba(80, 136, 152, 0.04);
        }

        .source-tile.error {
          border-color: rgba(239, 68, 68, 0.2);
          background: rgba(239, 68, 68, 0.04);
        }

        @keyframes pulse-bg {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .tile-icon {
          font-size: 18px;
        }

        .tile-name {
          font-size: 10px;
          color: var(--text-2, #8080a0);
          text-align: center;
          font-weight: 500;
        }

        .tile-status {
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--border, #1e1e24);
        }

        .status-spinner {
          width: 11px;
          height: 11px;
          border: 2px solid var(--border, #1e1e24);
          border-top-color: var(--accent, #508898);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .status-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent, #508898);
          animation: pulse-dot 1s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .status-check {
          color: var(--accent, #508898);
          font-size: 13px;
          font-weight: 500;
        }

        .status-error {
          color: #ef4444;
          font-size: 13px;
        }

        .tile-count {
          font-size: 9px;
          color: var(--text-3, #484860);
          font-family: var(--font-mono, 'DM Mono', monospace);
        }
      `}</style>
    </div>
  );
}
