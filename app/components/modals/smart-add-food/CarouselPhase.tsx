'use client';

/**
 * CarouselPhase - Source-by-source food selection carousel
 *
 * Phase 3 of the Smart Add Food flow.
 * Users click through sources one at a time, picking from AI's top 5.
 */

import { useState, useEffect } from 'react';
import type { FoodSourceConfig } from '../add-food/source-config';
import type { SourceSearchResults, NormalizedResult } from './types';

interface CarouselPhaseProps {
  sourcesWithResults: FoodSourceConfig[];
  sourceResults: Record<string, SourceSearchResults>;
  selections: Record<string, NormalizedResult | null>;
  skipped: Set<string>;
  currentSourceIndex: number;
  searchQuery: string;
  onSelectFood: (sourceCode: string, food: NormalizedResult) => void;
  onSkipSource: (sourceCode: string) => void;
  onGoToSource: (index: number) => void;
  onGoToReview: () => void;
  onManualSearch: (sourceCode: string, query: string) => void;
  onManualSearchLoadMore: (sourceCode: string) => void;
}

export default function CarouselPhase({
  sourcesWithResults,
  sourceResults,
  selections,
  skipped,
  currentSourceIndex,
  searchQuery,
  onSelectFood,
  onSkipSource,
  onGoToSource,
  onGoToReview,
  onManualSearch,
  onManualSearchLoadMore,
}: CarouselPhaseProps) {
  const [manualQuery, setManualQuery] = useState(searchQuery);
  const [showAllResults, setShowAllResults] = useState(false);

  // Reset local state whenever source changes (including auto-advance after pick/skip)
  useEffect(() => {
    setShowAllResults(false);
    setManualQuery(searchQuery);
  }, [currentSourceIndex, searchQuery]);

  if (sourcesWithResults.length === 0) {
    return (
      <div className="carousel-empty">
        <p>No sources returned results for this search.</p>
        <button onClick={onGoToReview}>Continue to Review</button>
      </div>
    );
  }

  const currentSource = sourcesWithResults[currentSourceIndex] || sourcesWithResults[0];
  const results = sourceResults[currentSource.code];
  const aiPicks = results?.aiTopPicks || [];
  const allResults = results?.allResults || [];
  const isSelected = !!selections[currentSource.code];
  const selectedFood = selections[currentSource.code];
  const isSkipped = skipped.has(currentSource.code);
  const visitedCount = Object.keys(selections).length + skipped.size;

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualQuery.trim()) {
      onManualSearch(currentSource.code, manualQuery.trim());
      setShowAllResults(true);
    }
  };

  return (
    <div className="carousel-phase">
      {/* Header */}
      <div className="carousel-header">
        <div className="source-info">
          <span className="source-icon">{currentSource.icon}</span>
          <span className="source-name">{currentSource.name}</span>
        </div>
        <div className="header-right">
          <button
            className="skip-btn"
            onClick={() => onSkipSource(currentSource.code)}
          >
            Skip
          </button>
          <div className="source-counter">
            {currentSourceIndex + 1} of {sourcesWithResults.length}
          </div>
        </div>
      </div>

      {/* AI Picks */}
      {aiPicks.length > 0 && (
        <div className="ai-picks-section">
          <div className="section-label">
            {results?.aiRanked ? 'AI Picks' : 'Top Results'}
          </div>
          <div className="picks-list">
            {aiPicks.map((food, i) => (
              <div
                key={`${food.apiId}-${i}`}
                className={`pick-item ${selectedFood?.apiId === food.apiId ? 'selected' : ''}`}
                onClick={() => onSelectFood(currentSource.code, food)}
              >
                <div className="pick-rank">{i + 1}</div>
                <div className="pick-info">
                  <div className="pick-name">{food.name}</div>
                  {food.description && (
                    <div className="pick-desc">{food.description}</div>
                  )}
                </div>
                {results?.aiRanked && i === 0 && (
                  <span className="ai-badge">AI</span>
                )}
                <span className="pick-id">ID: {food.apiId}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Search */}
      <div className="manual-search-section">
        <div className="divider-line">
          <span>or search manually</span>
        </div>
        <form className="manual-search-form" onSubmit={handleManualSearch}>
          <input
            type="text"
            className="manual-search-input"
            value={manualQuery}
            onChange={(e) => setManualQuery(e.target.value)}
            placeholder={`Search ${currentSource.shortName}...`}
          />
          <button type="submit" className="manual-search-btn">Search</button>
        </form>
      </div>

      {/* Manual search: loading */}
      {results?.manualLoading && (
        <div className="manual-loading">
          <span className="manual-spinner" />
          <span>Searching {currentSource.shortName}...</span>
        </div>
      )}

      {/* Manual search: no results message */}
      {!results?.manualLoading && results?.manualNoResults && (
        <div className="manual-no-results">
          No results for &ldquo;{results.manualQuery}&rdquo; in {currentSource.shortName}
        </div>
      )}

      {/* Full Results (expandable / infinite scroll) */}
      {!results?.manualLoading && allResults.length > 5 && (
        <div className="all-results-section">
          {!showAllResults ? (
            <button
              className="toggle-all-btn"
              onClick={() => setShowAllResults(true)}
            >
              Show all {allResults.length} results
            </button>
          ) : (
            <>
              <div className="section-label" style={{ marginTop: 4 }}>
                All Results ({allResults.length})
              </div>
              <div
                className="all-results-list"
                onScroll={(e) => {
                  const t = e.currentTarget;
                  if (t.scrollHeight - t.scrollTop <= t.clientHeight + 50) {
                    if (results?.manualHasMore) {
                      onManualSearchLoadMore(currentSource.code);
                    }
                  }
                }}
              >
                {allResults.map((food, i) => {
                  const isAiPick = aiPicks.some((p) => p.apiId === food.apiId);
                  return (
                    <div
                      key={`${food.apiId}-${i}`}
                      className={`result-row ${selectedFood?.apiId === food.apiId ? 'selected' : ''} ${isAiPick ? 'ai-pick' : ''}`}
                      onClick={() => onSelectFood(currentSource.code, food)}
                    >
                      <span className="result-name">{food.name}</span>
                      {isAiPick && <span className="mini-ai-badge">AI</span>}
                      <span className="result-id">{food.apiId}</span>
                    </div>
                  );
                })}
                {results?.manualHasMore && (
                  <div className="loading-more">Loading more...</div>
                )}
                {results?.manualQuery && !results?.manualHasMore && allResults.length > 0 && (
                  <div className="no-more-msg">No more results</div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="carousel-nav">
        <div className="nav-pills">
          {sourcesWithResults.map((source, i) => {
            let pillState = 'unvisited';
            if (i === currentSourceIndex) pillState = 'current';
            else if (selections[source.code]) pillState = 'selected';
            else if (skipped.has(source.code)) pillState = 'skipped';

            return (
              <button
                key={source.code}
                className={`nav-pill ${pillState}`}
                onClick={() => {
                  onGoToSource(i);
                  setShowAllResults(false);
                  setManualQuery(searchQuery);
                }}
                title={`${source.shortName}${pillState === 'selected' ? ' (selected)' : pillState === 'skipped' ? ' (skipped)' : ''}`}
              />
            );
          })}
        </div>

        <div className="nav-buttons">
          <button
            className="nav-arrow"
            disabled={currentSourceIndex === 0}
            onClick={() => { onGoToSource(currentSourceIndex - 1); setShowAllResults(false); }}
          >
            {'\u2190'}
          </button>

          {visitedCount > 0 && (
            <button className="review-btn" onClick={onGoToReview}>
              Review ({Object.values(selections).filter(Boolean).length} selected)
            </button>
          )}

          <button
            className="nav-arrow"
            disabled={currentSourceIndex >= sourcesWithResults.length - 1}
            onClick={() => { onGoToSource(currentSourceIndex + 1); setShowAllResults(false); }}
          >
            {'\u2192'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .carousel-phase {
          display: flex;
          flex-direction: column;
          gap: 12px;
          height: 100%;
          overflow: hidden;
          font-family: var(--font-body, 'DM Sans', sans-serif);
        }

        .carousel-empty {
          text-align: center;
          padding: 32px;
          color: var(--text-2, #8080a0);
        }

        .carousel-empty button {
          margin-top: 12px;
          padding: 8px 20px;
          background: var(--accent, #508898);
          color: #fff;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 13px;
        }

        .carousel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .source-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .source-icon { font-size: 18px; }

        .source-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-1, #e8e8f4);
        }

        .source-counter {
          font-size: 11px;
          color: var(--text-3, #484860);
          background: var(--bg-accent, #0f0f0f);
          border: 1px solid var(--border, #1e1e24);
          padding: 3px 8px;
          border-radius: 3px;
          font-family: var(--font-mono, 'DM Mono', monospace);
        }

        /* AI Picks */
        .section-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-3, #484860);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .picks-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pick-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          height: 54px;
          background: var(--bg-accent, #0f0f0f);
          border: 1px solid var(--border, #1e1e24);
          border-radius: 3px;
          cursor: pointer;
          transition: border-color 0.15s;
        }

        .pick-item:hover {
          border-color: var(--accent-border, rgba(80,136,152,0.14));
        }

        .pick-item.selected {
          background: var(--accent-soft, rgba(80,136,152,0.06));
          border-color: var(--accent-border, rgba(80,136,152,0.14));
        }

        .pick-rank {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-3, #484860);
          background: var(--surface, #050505);
          border: 1px solid var(--border, #1e1e24);
          border-radius: 3px;
          font-family: var(--font-mono, 'DM Mono', monospace);
          flex-shrink: 0;
        }

        .pick-info { flex: 1; min-width: 0; }

        .pick-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-1, #e8e8f4);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pick-desc {
          font-size: 11px;
          color: var(--text-3, #484860);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ai-badge {
          font-size: 9px;
          font-weight: 500;
          color: var(--accent, #508898);
          background: var(--accent-soft, rgba(80,136,152,0.06));
          border: 1px solid var(--accent-border, rgba(80,136,152,0.14));
          padding: 2px 5px;
          border-radius: 3px;
          letter-spacing: 0.05em;
          font-family: var(--font-mono, 'DM Mono', monospace);
        }

        .pick-id {
          font-size: 10px;
          color: var(--text-3, #484860);
          white-space: nowrap;
          font-family: var(--font-mono, 'DM Mono', monospace);
        }

        /* Manual Search */
        .divider-line {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-3, #484860);
          font-size: 11px;
        }

        .divider-line::before,
        .divider-line::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border, #1e1e24);
        }

        .manual-search-form {
          display: flex;
          gap: 8px;
        }

        .manual-search-input {
          flex: 1;
          padding: 8px 10px;
          background: var(--surface, #050505);
          border: 1px solid transparent;
          border-radius: 3px;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
          color: var(--text-1, #e8e8f4);
          font-size: 13px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          outline: none;
          transition: border-color 0.15s;
        }

        .manual-search-input:focus {
          border-color: var(--accent, #508898);
        }

        .manual-search-input::placeholder {
          color: var(--text-3, #484860);
        }

        .manual-search-btn {
          padding: 8px 14px;
          background: transparent;
          border: 1px solid var(--border, #1e1e24);
          border-radius: 3px;
          color: var(--text-2, #8080a0);
          font-size: 12px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }

        .manual-search-btn:hover {
          border-color: var(--accent-border, rgba(80,136,152,0.14));
          color: var(--text-1, #e8e8f4);
        }

        /* All Results */
        .toggle-all-btn {
          background: none;
          border: none;
          color: var(--text-3, #484860);
          font-size: 12px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          cursor: pointer;
          padding: 4px 0;
          text-decoration: underline;
        }

        .toggle-all-btn:hover { color: var(--text-2, #8080a0); }

        .all-results-section {
          display: flex;
          flex-direction: column;
          min-height: 0;
          flex: 1;
        }

        .all-results-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1px;
          margin-top: 6px;
        }

        .result-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.1s;
        }

        .result-row:hover { background: var(--bg-accent, #0f0f0f); }

        .result-row.selected {
          background: var(--accent-soft, rgba(80,136,152,0.06));
          border: 1px solid var(--accent-border, rgba(80,136,152,0.14));
        }

        .result-name {
          flex: 1;
          color: var(--text-2, #8080a0);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mini-ai-badge {
          font-size: 8px;
          color: var(--accent, #508898);
          background: var(--accent-soft, rgba(80,136,152,0.06));
          padding: 1px 4px;
          border-radius: 3px;
          font-family: var(--font-mono, 'DM Mono', monospace);
        }

        .result-id {
          font-size: 10px;
          color: var(--text-3, #484860);
          font-family: var(--font-mono, 'DM Mono', monospace);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Skip */
        .skip-btn {
          background: transparent;
          border: 1px solid var(--accent-border, rgba(80,136,152,0.14));
          color: var(--accent, #508898);
          font-size: 12px;
          font-weight: 500;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          cursor: pointer;
          padding: 6px 14px;
          border-radius: 3px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }

        .skip-btn:hover {
          background: var(--accent-soft, rgba(80,136,152,0.06));
          border-color: var(--accent, #508898);
          color: var(--text-1, #e8e8f4);
        }

        /* Navigation */
        .carousel-nav {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          padding-top: 24px;
          border-top: 1px solid var(--border, #1e1e24);
        }

        .nav-pills {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .nav-pill {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
        }

        .nav-pill.unvisited { background: var(--border, #1e1e24); }
        .nav-pill.current { background: var(--accent, #508898); }
        .nav-pill.selected { background: rgba(80, 136, 152, 0.5); }
        .nav-pill.skipped { background: transparent; border: 2px solid var(--border, #1e1e24); }

        .nav-buttons {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .nav-arrow {
          padding: 6px 12px;
          background: transparent;
          border: 1px solid var(--border, #1e1e24);
          border-radius: 3px;
          color: var(--text-2, #8080a0);
          font-size: 14px;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          font-family: var(--font-body, 'DM Sans', sans-serif);
        }

        .nav-arrow:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .nav-arrow:hover:not(:disabled) {
          border-color: var(--accent-border, rgba(80,136,152,0.14));
          color: var(--text-1, #e8e8f4);
        }

        .review-btn {
          padding: 8px 20px;
          background: var(--accent, #508898);
          color: #fff;
          border: none;
          border-bottom: 5px solid var(--accent-dark, #306070);
          border-radius: 3px;
          font-size: 13px;
          font-weight: 500;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.1s;
        }

        .review-btn:hover {
          transform: translateY(2px);
          border-bottom-width: 3px;
        }

        .review-btn:active {
          transform: translateY(5px);
          border-bottom-width: 0px;
        }

        .manual-no-results {
          padding: 10px;
          text-align: center;
          color: var(--text-3, #484860);
          font-size: 12px;
          font-style: italic;
        }

        .manual-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          color: var(--text-2, #8080a0);
          font-size: 12px;
        }

        .manual-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid var(--border, #1e1e24);
          border-top-color: var(--accent, #508898);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-more {
          padding: 8px;
          text-align: center;
          color: var(--text-3, #484860);
          font-size: 11px;
          font-style: italic;
        }

        .no-more-msg {
          padding: 8px;
          text-align: center;
          color: var(--text-3, #484860);
          font-size: 11px;
          font-style: italic;
        }

        /* Scrollbar */
        .all-results-list::-webkit-scrollbar { width: 3px; }
        .all-results-list::-webkit-scrollbar-track { background: transparent; }
        .all-results-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>
    </div>
  );
}
