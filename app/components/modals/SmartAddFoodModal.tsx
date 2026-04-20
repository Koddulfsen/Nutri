'use client';

/**
 * Smart Add Food Modal
 *
 * AI-assisted food addition flow:
 * 1. Chat - AI interprets food query
 * 2. Search - Parallel search across 18 sources with AI ranking
 * 3. Carousel - Source-by-source selection from AI picks
 * 4. Review - Confirm and submit
 */

import { useEffect, useRef } from 'react';
import { useSmartAddFood } from './smart-add-food/useSmartAddFood';
import { FOOD_SOURCES } from './add-food/source-config';
import type { SubmitProgress, ClarifyResult } from './smart-add-food/types';
import AISidebarChat from './smart-add-food/AISidebarChat';
import SearchingPhase from './smart-add-food/SearchingPhase';
import CarouselPhase from './smart-add-food/CarouselPhase';
import ReviewPhase from './smart-add-food/ReviewPhase';

// Build source display map once
const SOURCE_DISPLAY: Record<string, { icon: string; name: string }> = {};
for (const s of FOOD_SOURCES) {
  SOURCE_DISPLAY[s.code] = { icon: s.icon, name: s.shortName };
}

function ReviewProgressOverlay({
  progress,
  selectedSourceCodes,
}: {
  progress: SubmitProgress;
  selectedSourceCodes: string[];
}) {
  return (
    <div className="progress-overlay">
      <div className="progress-content">
        <div className="progress-title">Adding Food</div>

        <div className="source-progress-list">
          {selectedSourceCodes.map((code) => {
            const display = SOURCE_DISPLAY[code] || { icon: '\u{1F4E6}', name: code };
            const isCompleted = progress.completedSources.includes(code);
            const isCurrent = progress.currentSource === code;
            const failedEntry = progress.failedSources?.find((f) => f.source === code);
            const isFailed = !!failedEntry;

            return (
              <div
                key={code}
                className={`source-progress-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isFailed ? 'failed' : ''}`}
              >
                <span className="sp-icon">{display.icon}</span>
                <span className="sp-name">
                  {display.name}
                  {isFailed && <span className="sp-error-detail"> — {failedEntry.error}</span>}
                </span>
                <span className="sp-status">
                  {isCompleted ? '\u2713' : isFailed ? '\u2717' : isCurrent ? '...' : '\u25CB'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress.percent}%` }} />
        </div>

        <div className="progress-detail">{progress.detail}</div>
        <div className="progress-percent">{progress.percent}%</div>
      </div>

      <style jsx>{`
        .progress-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.92);
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        .progress-content {
          width: 100%;
          max-width: 400px;
          padding: 32px;
          text-align: center;
          font-family: var(--font-body, 'DM Sans', sans-serif);
        }
        .progress-title {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 24px;
          color: var(--text-1, #e8e8f4);
          font-family: var(--font-display, 'Instrument Serif', serif);
        }
        .source-progress-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 24px;
          max-height: 300px;
          overflow-y: auto;
        }
        .source-progress-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: var(--bg-accent, #0f0f0f);
          border-radius: 3px;
          border: 1px solid var(--border, #1e1e24);
          transition: border-color 0.3s ease;
        }
        .source-progress-item.current {
          background: var(--accent-soft, rgba(80,136,152,0.06));
          border-color: var(--accent-border, rgba(80,136,152,0.14));
        }
        .source-progress-item.completed {
          border-color: rgba(80, 136, 152, 0.2);
        }
        .source-progress-item.failed {
          border-color: rgba(239, 68, 68, 0.2);
        }
        .sp-icon { font-size: 16px; }
        .sp-name {
          flex: 1;
          text-align: left;
          font-size: 12px;
          color: var(--text-2, #8080a0);
        }
        .sp-status {
          font-size: 13px;
          width: 20px;
          text-align: center;
          color: var(--text-3, #484860);
        }
        .source-progress-item.completed .sp-status { color: var(--accent, #508898); }
        .source-progress-item.failed .sp-status { color: #ef4444; }
        .sp-error-detail {
          font-size: 11px;
          color: rgba(239, 68, 68, 0.7);
          font-weight: 400;
        }
        .source-progress-item.current .sp-status {
          color: var(--accent, #508898);
          animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .progress-bar-container {
          width: 100%;
          height: 4px;
          background: var(--border, #1e1e24);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .progress-bar-fill {
          height: 100%;
          background: var(--accent, #508898);
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        .progress-detail {
          font-size: 12px;
          color: var(--text-2, #8080a0);
          margin-bottom: 8px;
        }
        .progress-percent {
          font-size: 28px;
          font-weight: 500;
          color: var(--accent, #508898);
          font-family: var(--font-mono, 'DM Mono', monospace);
        }
        .source-progress-list::-webkit-scrollbar { width: 3px; }
        .source-progress-list::-webkit-scrollbar-track { background: transparent; }
        .source-progress-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>
    </div>
  );
}

function SearchCard({
  canonicalName,
  clarifyResult,
  initialQuery,
  onStartSearch,
}: {
  canonicalName: string;
  clarifyResult: ClarifyResult | null;
  initialQuery: string;
  onStartSearch: () => void;
}) {
  const displayName = clarifyResult?.canonicalName || initialQuery || '…';
  const prevNameRef = useRef(displayName);
  const animKeyRef = useRef(0);
  if (prevNameRef.current !== displayName) {
    prevNameRef.current = displayName;
    animKeyRef.current += 1;
  }

  return (
    <div className="search-card">
      <div className="search-card-inner">
        <p className="search-card-label">Searching for</p>
        <div key={animKeyRef.current} className="search-card-name">
          {displayName}
        </div>
        <button
          className="search-card-btn"
          onClick={onStartSearch}
          disabled={!displayName || displayName === '…'}
        >
          Search
        </button>
        <p className="search-card-hint">← Refine with the assistant</p>
      </div>

      <style jsx>{`
        .search-card {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 40px;
        }

        .search-card-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          max-width: 380px;
          width: 100%;
          text-align: center;
        }

        .search-card-label {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-3, #484860);
          margin: 0;
        }

        .search-card-name {
          font-family: var(--font-display, 'Instrument Serif', serif);
          font-size: 42px;
          color: var(--text-1, #e8e8f4);
          line-height: 1.1;
          animation: nameIn 0.25s ease-out;
        }

        @keyframes nameIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .search-card-btn {
          margin-top: 8px;
          padding: 0 32px;
          height: 51px;
          background: var(--accent, #508898);
          color: #fff;
          border: none;
          border-radius: 3px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 5px 0 var(--accent-dark, #306070), 0 8px 16px rgba(0,0,0,0.4);
          transform: translateY(0);
          transition: transform 0.08s, box-shadow 0.08s;
        }

        .search-card-btn:hover:not(:disabled) {
          transform: translateY(2px);
          box-shadow: 0 3px 0 var(--accent-dark, #306070), 0 5px 10px rgba(0,0,0,0.35);
        }

        .search-card-btn:active:not(:disabled) {
          transform: translateY(5px);
          box-shadow: 0 1px 0 var(--accent-dark, #306070), 0 2px 5px rgba(0,0,0,0.3);
        }

        .search-card-btn:disabled {
          opacity: 0.4;
          cursor: default;
        }

        .search-card-hint {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 12px;
          color: var(--text-3, #484860);
          margin: 0;
        }
      `}</style>
    </div>
  );
}

interface SmartAddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSuccess?: (food: any) => void;
  userId?: string;
}

export default function SmartAddFoodModal({
  isOpen,
  onClose,
  initialQuery = '',
  onSuccess,
  userId,
}: SmartAddFoodModalProps) {
  const {
    phase,
    chatMessages,
    chatLoading,
    clarifyResult,
    sourceStatuses,
    sourceResults,
    selections,
    skipped,
    currentSourceIndex,
    foodName,
    commonNames,
    metadata,
    categoryPath,
    portions,
    portionsLoading,
    submitting,
    submitError,
    submitProgress,
    sourcesWithResults,
    sendMessage,
    startSearch,
    selectFood,
    skipSource,
    goToSource,
    goToReview,
    submitFood,
    manualSearch,
    manualSearchLoadMore,
    setFoodName,
    setCommonNames,
    setMetadata,
    setCategoryPath,
    setPortions,
    setPhase,
    reset,
  } = useSmartAddFood(onSuccess, onClose);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(reset, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, reset]);

  // Auto-send initial query
  useEffect(() => {
    if (isOpen && initialQuery && chatMessages.length === 0) {
      sendMessage(initialQuery);
    }
  }, [isOpen, initialQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  return (
    <div className="smart-modal-overlay" onClick={onClose}>
      <div className="smart-modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Progress Overlay - covers entire modal */}
        {phase === 'review' && submitProgress.isActive && (
          <ReviewProgressOverlay
            progress={submitProgress}
            selectedSourceCodes={
              Object.entries(selections)
                .filter(([, food]) => food !== null)
                .map(([code]) => code)
            }
          />
        )}

        {/* Body: sidebar + main */}
        <div className="panel-body">
          {/* Left: persistent AI chat */}
          <div className="panel-sidebar">
            <AISidebarChat
              messages={chatMessages}
              loading={chatLoading}
              onSendMessage={sendMessage}
            />
          </div>

          {/* Right: phase content */}
          <div className="panel-main">
            <div className="panel-main-topbar">
              <button className="close-btn" onClick={onClose} disabled={submitting}>&#x2715;</button>
            </div>
            <div className="panel-main-content">
            {phase === 'clarify' && (
              <SearchCard
                canonicalName={clarifyResult?.canonicalName || ''}
                clarifyResult={clarifyResult}
                initialQuery={initialQuery}
                onStartSearch={startSearch}
              />
            )}

            {phase === 'searching' && (
              <SearchingPhase sourceStatuses={sourceStatuses} />
            )}

            {phase === 'carousel' && (
              <CarouselPhase
                sourcesWithResults={sourcesWithResults}
                sourceResults={sourceResults}
                selections={selections}
                skipped={skipped}
                currentSourceIndex={currentSourceIndex}
                searchQuery={clarifyResult?.searchQuery || ''}
                onSelectFood={selectFood}
                onSkipSource={skipSource}
                onGoToSource={goToSource}
                onGoToReview={goToReview}
                onManualSearch={manualSearch}
                onManualSearchLoadMore={manualSearchLoadMore}
              />
            )}

            {phase === 'review' && (
              <ReviewPhase
                foodName={foodName}
                commonNames={commonNames}
                selections={selections}
                skipped={skipped}
                submitting={submitting}
                submitError={submitError}
                metadata={metadata}
                categoryPath={categoryPath}
                portions={portions}
                portionsLoading={portionsLoading}
                onSetFoodName={setFoodName}
                onSetCommonNames={setCommonNames}
                onSetMetadata={setMetadata}
                onSetCategoryPath={setCategoryPath}
                onSetPortions={setPortions}
                onSubmit={() => submitFood(userId)}
                onGoToCarousel={(idx) => {
                  goToSource(idx);
                  setPhase('carousel');
                }}
                onBack={() => setPhase('carousel')}
                sourcesWithResults={sourcesWithResults}
              />
            )}
            </div>
          </div>
        </div>

        <style jsx>{`
          .panel-body {
            display: flex;
            flex: 1;
            min-height: 0;
            overflow: hidden;
          }

          .panel-sidebar {
            width: 280px;
            flex-shrink: 0;
            border-right: 4px solid var(--border, #1e1e24);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .panel-main {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .panel-main-topbar {
            display: flex;
            justify-content: flex-end;
            padding: 6px 8px;
            flex-shrink: 0;
          }

          .close-btn {
            background: none;
            border: none;
            color: var(--text-3, #484860);
            font-size: 14px;
            cursor: pointer;
            padding: 4px 8px;
            line-height: 1;
            transition: color 0.15s;
          }

          .close-btn:hover:not(:disabled) { color: var(--text-1, #e8e8f4); }
          .close-btn:disabled { opacity: 0.3; cursor: not-allowed; }

          .panel-main-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
          }

          /* Scrollbar */
          .panel-main-content::-webkit-scrollbar { width: 3px; }
          .panel-main-content::-webkit-scrollbar-track { background: transparent; }
          .panel-main-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        `}</style>
      </div>
    </div>
  );
}
