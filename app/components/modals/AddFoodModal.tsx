'use client';

/**
 * Add Food Modal Component
 *
 * Sticky bottom-left panel for adding foods to Nutri database with multi-source API integration
 *
 * Layout: Single page with food name input + dynamic source search columns
 *
 * Architecture: Multi-Source Food Database System
 * Updated: 2026-01-22 - Added SSE streaming progress bar
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@/lib/utils/base-path';
import SourceSearchColumn, { SelectedFood } from './add-food/SourceSearchColumn';
import { getEnabledSources, FoodSourceConfig } from './add-food/source-config';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSuccess?: (food: any) => void;
  userId?: string;
}

// Map source codes to API source codes used by the backend
const SOURCE_CODE_MAP: Record<string, string> = {
  CNF: 'CNF',
  FDC: 'FDC',
  FOODB: 'FOODB',
  PHENOL: 'PHENOL',
  DUKE: 'DUKE',
  AFCD: 'AFCD',
};

// Source display info for progress UI
const SOURCE_DISPLAY: Record<string, { icon: string; name: string }> = {
  CNF: { icon: '🇨🇦', name: 'Canadian Nutrient File' },
  FDC: { icon: '🇺🇸', name: 'USDA FoodData Central' },
  FOODB: { icon: '🧬', name: 'FooDB' },
  PHENOL: { icon: '🍇', name: 'Phenol-Explorer' },
  DUKE: { icon: '🌿', name: "Dr. Duke's Phytochemical" },
  AFCD: { icon: '🇦🇺', name: 'Australian Food Composition' },
};

// Progress event from SSE stream
interface ProgressEvent {
  type: 'progress' | 'complete' | 'error' | 'preview';
  preview?: PreviewPayload;
  step?: string;
  percent?: number;
  detail?: string;
  sourceCode?: string;
  food?: any;
  error?: string;
}

// Progress state
interface OutlierFlag {
  source: string;
  value: number;
  matchedName?: string | null;
  ratio: number;
  severity: 'high' | 'medium' | 'low';
  reason: string;
}

interface Finding {
  compound: string;
  unit: string | null;
  n: number;
  median: number;
  min: number;
  max: number;
  flags: OutlierFlag[];
  worst: 'high' | 'medium' | 'low' | null;
}

interface PreviewPayload {
  name: string;
  sources: Array<{
    apiSource: string;
    apiFoodId: string | null;
    matchedName: string | null;
    valueCount: number;
    flagCount: number;
    highFlagCount: number;
  }>;
  comparedCompounds: number;
  flaggedCompounds: number;
  totalCompounds: number;
  findings: Finding[];
}

interface ProgressState {
  isActive: boolean;
  percent: number;
  step: string;
  detail: string;
  completedSources: string[];
  currentSource: string | null;
}

export default function AddFoodModal({
  isOpen,
  onClose,
  initialQuery = '',
  onSuccess,
  userId,
}: AddFoodModalProps) {
  // Food data
  const [foodName, setFoodName] = useState(initialQuery);
  const [commonNames, setCommonNames] = useState<string[]>([]);
  const [commonNameInput, setCommonNameInput] = useState('');

  // Selected sources - keyed by source code
  const [selectedSources, setSelectedSources] = useState<Record<string, SelectedFood | null>>({});

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Populated by a dry run: everything fetched and analysed, nothing written yet.
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [showLowSeverity, setShowLowSeverity] = useState(false);

  // Progress state
  const [progress, setProgress] = useState<ProgressState>({
    isActive: false,
    percent: 0,
    step: '',
    detail: '',
    completedSources: [],
    currentSource: null,
  });

  // Get enabled sources
  const enabledSources = getEnabledSources();

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFoodName('');
        setCommonNames([]);
        setCommonNameInput('');
        setSelectedSources({});
        setSubmitError(null);
        setProgress({
          isActive: false,
          percent: 0,
          step: '',
          detail: '',
          completedSources: [],
          currentSource: null,
        });
      }, 300);
    } else if (initialQuery) {
      setFoodName(initialQuery);
    }
  }, [isOpen, initialQuery]);

  // Add common name
  const handleAddCommonName = () => {
    const trimmed = commonNameInput.trim();
    if (trimmed && !commonNames.includes(trimmed)) {
      setCommonNames([...commonNames, trimmed]);
      setCommonNameInput('');
    }
  };

  // Remove common name
  const handleRemoveCommonName = (name: string) => {
    setCommonNames(commonNames.filter((n) => n !== name));
  };

  // Handle source selection
  const handleSourceSelect = (sourceCode: string) => (food: SelectedFood | null) => {
    setSelectedSources((prev) => ({
      ...prev,
      [sourceCode]: food,
    }));
  };

  // Get selected sources for submit
  const getSelectedSourcesForSubmit = useCallback(() => {
    return Object.entries(selectedSources)
      .filter(([, food]) => food !== null)
      .map(([sourceCode, food]) => ({
        apiSource: SOURCE_CODE_MAP[sourceCode] || sourceCode,
        apiFoodId: food!.apiFoodId,
        // The source's own name for the match. Comparing these side by side is the
        // fastest way to spot a wrong pick — "Gelatin, dried" vs "Gelatin desserts, dry mix".
        apiFoodName: food!.name,
        apiFoodVariant: food!.variant,
        composition: food!.composition,
      }));
  }, [selectedSources]);

  // Check if at least one source is selected
  const hasSelectedSource = Object.values(selectedSources).some((s) => s !== null);

  // Get list of selected source codes for progress display
  const selectedSourceCodes = Object.entries(selectedSources)
    .filter(([, food]) => food !== null)
    .map(([code]) => code);

  // Submit food with SSE streaming
  // Two-phase by design: the first pass is a dry run that writes nothing, so a wrong
  // source match is caught while the food does not exist yet. Only an explicit Save commits.
  const handleSubmit = async (dryRun: boolean) => {
    const sources = getSelectedSourcesForSubmit();

    if (sources.length === 0) {
      setSubmitError('Please select at least one food source');
      return;
    }

    if (!foodName.trim()) {
      setSubmitError('Please enter a food name');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    if (dryRun) setPreview(null);
    setProgress({
      isActive: true,
      percent: 0,
      step: 'init',
      detail: 'Starting...',
      completedSources: [],
      currentSource: null,
    });

    try {
      const response = await fetch(apiUrl('/api/foods'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: foodName.trim(),
          commonNames,
          sources,
          userId,
          dryRun,
        }),
      });

      // Check for non-streaming error responses
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to add food');
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: ProgressEvent = JSON.parse(line.slice(6));

              if (event.type === 'progress') {
                setProgress((prev) => {
                  const newState = {
                    ...prev,
                    percent: event.percent ?? prev.percent,
                    step: event.step ?? prev.step,
                    detail: event.detail ?? prev.detail,
                  };

                  // Track source completion
                  if (event.step === 'fetched' && event.sourceCode) {
                    newState.completedSources = [...prev.completedSources, event.sourceCode];
                    newState.currentSource = null;
                  } else if (event.step === 'fetching' && event.sourceCode) {
                    newState.currentSource = event.sourceCode;
                  }

                  return newState;
                });
              } else if (event.type === 'complete') {
                setProgress((prev) => ({
                  ...prev,
                  percent: 100,
                  step: 'complete',
                  detail: event.detail || 'Complete!',
                }));

                // Success!
                if (onSuccess && event.food) {
                  onSuccess(event.food);
                }

                // Close modal after brief delay to show completion
                setTimeout(() => {
                  onClose();
                }, 500);
              } else if (event.type === 'preview') {
                // Nothing was written. Show the review and wait for a decision.
                setPreview(event.preview ?? null);
                setProgress((prev) => ({ ...prev, isActive: false }));
              } else if (event.type === 'error') {
                throw new Error(event.error || 'Unknown error');
              }
            } catch (parseError) {
              // Ignore parse errors for incomplete data
              if (parseError instanceof SyntaxError) continue;
              throw parseError;
            }
          }
        }
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to add food');
      setProgress((prev) => ({ ...prev, isActive: false }));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="panel-header">
          <h2>Add Food</h2>
          <button className="close-btn" onClick={onClose} disabled={submitting}>
            ✕
          </button>
        </div>

        {/* Review step — a dry run has completed and NOTHING has been written yet. */}
        {preview && !progress.isActive && (
          <div className="review-overlay">
            <div className="review-content">
              <div className="review-head">
                <div className="review-title">Review before saving</div>
                <div className="review-sub">
                  {preview.totalCompounds} compounds · {preview.comparedCompounds} comparable across sources ·{' '}
                  {preview.flaggedCompounds > 0 ? (
                    <span className="warn">{preview.flaggedCompounds} flagged</span>
                  ) : (
                    <span className="good">nothing flagged</span>
                  )}
                </div>
                <div className="review-note">Nothing has been saved yet.</div>
              </div>

              {/* Source match table — comparing these names catches a wrong pick instantly */}
              <div className="review-section-title">Matched food per source</div>
              <div className="review-table">
                <div className="rt-head">
                  <span>Source</span><span>Matched as</span><span className="num">Values</span><span className="num">Flags</span><span />
                </div>
                {preview.sources.map((src) => (
                  <div key={src.apiSource} className={`rt-row ${src.highFlagCount > 0 ? 'suspect' : ''}`}>
                    <span className="rt-src">{src.apiSource}</span>
                    <span className="rt-name" title={src.matchedName ?? ''}>
                      {src.matchedName || <em>(name not recorded)</em>}
                    </span>
                    <span className="num">{src.valueCount}</span>
                    <span className="num">
                      {src.highFlagCount > 0 ? <b className="warn">{src.highFlagCount}</b> : src.flagCount || '—'}
                    </span>
                    <span>
                      <button
                        className="drop-btn"
                        title="Remove this source and check again"
                        onClick={() => {
                          const code = Object.keys(selectedSources).find(
                            (k) => (SOURCE_CODE_MAP[k] || k) === src.apiSource
                          );
                          if (code) {
                            setSelectedSources((prev) => ({ ...prev, [code]: null }));
                            setPreview(null);
                          }
                        }}
                      >
                        remove
                      </button>
                    </span>
                  </div>
                ))}
              </div>

              {/* Findings */}
              {preview.findings.length > 0 && (
                <>
                  <div className="review-section-title">
                    Disagreements
                    <button className="link-btn" onClick={() => setShowLowSeverity((v) => !v)}>
                      {showLowSeverity ? 'hide minor' : 'show minor'}
                    </button>
                  </div>
                  <div className="findings">
                    {preview.findings
                      .filter((f) => showLowSeverity || f.worst !== 'low')
                      .map((f) => (
                        <div key={f.compound} className="finding">
                          <div className="finding-head">
                            <span className="fc-name">{f.compound}</span>
                            <span className="fc-meta">
                              {f.n} sources · median {Number(f.median).toPrecision(3)} {f.unit ?? ''}
                            </span>
                          </div>
                          {f.flags.map((fl) => (
                            <div key={fl.source} className={`flag sev-${fl.severity}`}>
                              <span className="fl-src">{fl.source}</span>
                              <span className="fl-val">{Number(fl.value).toPrecision(3)}</span>
                              <span className="fl-reason">{fl.reason}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                  </div>
                </>
              )}

              <div className="review-actions">
                <button className="ghost-btn" onClick={() => setPreview(null)} disabled={submitting}>
                  Back to selection
                </button>
                <button
                  className="add-btn"
                  onClick={() => { setPreview(null); handleSubmit(false); }}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save food'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Overlay */}
        {progress.isActive && (
          <div className="progress-overlay">
            <div className="progress-content">
              <div className="progress-title">Adding Food</div>

              {/* Source Progress Indicators */}
              <div className="source-progress-list">
                {selectedSourceCodes.map((code) => {
                  const display = SOURCE_DISPLAY[code] || { icon: '📦', name: code };
                  const isCompleted = progress.completedSources.includes(code);
                  const isCurrent = progress.currentSource === code;

                  return (
                    <div
                      key={code}
                      className={`source-progress-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      <span className="source-icon">{display.icon}</span>
                      <span className="source-name">{display.name}</span>
                      <span className="source-status">
                        {isCompleted ? '✓' : isCurrent ? '...' : '○'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              {/* Progress Detail */}
              <div className="progress-detail">{progress.detail}</div>
              <div className="progress-percent">{progress.percent}%</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="panel-content">
          {/* Food Name Input */}
          <div className="input-section">
            <label className="input-label">Food Name</label>
            <input
              type="text"
              className="food-name-input"
              placeholder="e.g., Chicken Breast, Raw"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              autoFocus
              disabled={submitting}
            />
          </div>

          {/* Common Names */}
          {commonNames.length > 0 && (
            <div className="common-names">
              {commonNames.map((name) => (
                <span key={name} className="tag">
                  {name}
                  <button onClick={() => handleRemoveCommonName(name)} disabled={submitting}>
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Source Search Columns */}
          <div className="sources-grid">
            {enabledSources.map((source) => (
              <SourceSearchColumn
                key={source.code}
                source={source}
                selected={selectedSources[source.code] || null}
                onSelect={handleSourceSelect(source.code)}
                disabled={submitting}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="panel-footer">
          {submitError && <div className="error-msg">{submitError}</div>}

          {/* Selection Summary */}
          {hasSelectedSource && !progress.isActive && (
            <div className="selection-summary">
              Selected:{' '}
              {Object.entries(selectedSources)
                .filter(([, food]) => food !== null)
                .map(([code]) => {
                  const source = enabledSources.find((s) => s.code === code);
                  return source ? `${source.icon} ${source.shortName}` : code;
                })
                .join(', ')}
            </div>
          )}

          <button
            className="add-btn"
            onClick={() => handleSubmit(true)}
            disabled={submitting || !foodName.trim() || !hasSelectedSource}
          >
            {submitting ? 'Checking...' : 'Review & Add'}
          </button>
        </div>

        <style jsx>{`
          /* ---- Review step (charcoal x teal, per CLAUDE.md section 8) ---- */
          .review-overlay {
            position: absolute; inset: 0; background: #1a1a1a; border-radius: 12px;
            display: flex; flex-direction: column; z-index: 20; overflow: hidden;
          }
          .review-content {
            display: flex; flex-direction: column; gap: 18px;
            padding: 22px 24px; overflow-y: auto; height: 100%;
          }
          .review-head { display: flex; flex-direction: column; gap: 4px; }
          .review-title {
            font-family: 'Instrument Serif', Georgia, serif;
            font-size: 22px; font-weight: 400; color: #fff;
          }
          .review-sub { font-size: 13px; color: rgba(255,255,255,0.62); font-family: 'DM Mono', monospace; }
          .review-note { font-size: 12px; color: rgba(255,255,255,0.38); margin-top: 2px; }
          .warn { color: #d946ef; }
          .good { color: #6aff95; }

          .review-section-title {
            font-size: 11px; letter-spacing: .09em; text-transform: uppercase;
            color: rgba(255,255,255,0.38); border-bottom: 1px solid rgba(255,255,255,0.10);
            padding-bottom: 6px; display: flex; justify-content: space-between; align-items: baseline;
          }
          .link-btn {
            background: none; border: none; color: #6aff95;
            font-size: 11px; cursor: pointer; padding: 0; text-transform: none; letter-spacing: 0;
          }

          .review-table { display: flex; flex-direction: column; }
          .rt-head, .rt-row {
            display: grid; grid-template-columns: 108px 1fr 62px 52px 64px;
            gap: 10px; align-items: center; padding: 7px 8px; font-size: 12.5px;
          }
          .rt-head { color: rgba(255,255,255,0.38); font-size: 10.5px; text-transform: uppercase; letter-spacing: .07em; }
          .rt-row { border-top: 1px solid rgba(255,255,255,0.10); color: #fff; }
          .rt-row:nth-child(even) { background: rgba(255,255,255,0.03); }
          .rt-row.suspect { background: rgba(217, 70, 239, 0.09); }
          .rt-src { font-family: 'DM Mono', monospace; color: rgba(255,255,255,0.62); font-size: 11.5px; }
          .rt-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .rt-name em { color: rgba(255,255,255,0.38); }
          .num { text-align: right; font-family: 'DM Mono', monospace; }
          .drop-btn {
            background: none; border: 1px solid rgba(255,255,255,0.10); border-radius: 3px;
            color: rgba(255,255,255,0.62); font-size: 10.5px; padding: 3px 7px; cursor: pointer;
          }
          .drop-btn:hover { border-color: #d946ef; color: #d946ef; }

          .findings { display: flex; flex-direction: column; gap: 12px; }
          .finding { border-left: 2px solid rgba(255,255,255,0.10); padding-left: 10px; }
          .finding-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
          .fc-name { color: #fff; font-size: 13.5px; }
          .fc-meta { color: rgba(255,255,255,0.38); font-size: 11px; font-family: 'DM Mono', monospace; }
          .flag {
            display: grid; grid-template-columns: 108px 82px 1fr; gap: 10px;
            font-size: 12px; padding: 3px 0; color: rgba(255,255,255,0.62);
          }
          .fl-src { font-family: 'DM Mono', monospace; font-size: 11.5px; }
          .fl-val { font-family: 'DM Mono', monospace; text-align: right; color: #fff; }
          .fl-reason { font-size: 11.5px; }
          /* Dusty rose, not red: most of these are worth a look, not errors. */
          .sev-high .fl-val, .sev-high .fl-src { color: #d946ef; }
          .sev-medium .fl-val { color: #fff; }
          .sev-low { opacity: .62; }

          .review-actions {
            display: flex; justify-content: flex-end; gap: 10px;
            margin-top: auto; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.10);
          }
          .ghost-btn {
            background: none; border: 1px solid rgba(255,255,255,0.10); border-radius: 3px;
            color: rgba(255,255,255,0.62); padding: 9px 16px; font-size: 13px; cursor: pointer;
          }
          .ghost-btn:hover { color: #fff; border-color: rgba(255,255,255,0.38); }

          /* Overlay - Click outside to close */
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
            pointer-events: none;
          }

          /* Sticky Panel - Bottom Left */
          .modal-panel {
            position: fixed;
            bottom: 24px;
            left: 24px;
            width: calc(100vw - 48px);
            max-width: 900px;
            max-height: 80vh;
            background: #1a1a1a;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            pointer-events: all;
            animation: slideUp 0.3s ease-out;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Progress Overlay */
          .progress-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(26, 26, 26, 0.95);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            backdrop-filter: blur(4px);
          }

          .progress-content {
            width: 100%;
            max-width: 400px;
            padding: 32px;
            text-align: center;
          }

          .progress-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 24px;
            color: #fff;
          }

          /* Source Progress List */
          .source-progress-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 24px;
          }

          .source-progress-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 14px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
          }

          .source-progress-item.current {
            background: rgba(217, 70, 239, 0.1);
            border-color: rgba(217, 70, 239, 0.3);
          }

          .source-progress-item.completed {
            background: rgba(106, 255, 149, 0.1);
            border-color: rgba(106, 255, 149, 0.2);
          }

          .source-icon {
            font-size: 18px;
          }

          .source-name {
            flex: 1;
            text-align: left;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.8);
          }

          .source-status {
            font-size: 14px;
            width: 20px;
            text-align: center;
          }

          .source-progress-item.completed .source-status {
            color: #6aff95;
          }

          .source-progress-item.current .source-status {
            color: var(--purple);
            animation: pulse 1s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          /* Progress Bar */
          .progress-bar-container {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 16px;
          }

          .progress-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--purple), #6aff95);
            border-radius: 4px;
            transition: width 0.3s ease;
          }

          .progress-detail {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 8px;
          }

          .progress-percent {
            font-size: 24px;
            font-weight: 700;
            color: var(--purple);
          }

          /* Header */
          .panel-header {
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .panel-header h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
          }

          .close-btn {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            font-size: 20px;
            cursor: pointer;
            padding: 4px 8px;
            line-height: 1;
            transition: color 0.2s;
          }

          .close-btn:hover:not(:disabled) {
            color: #fff;
          }

          .close-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }

          /* Content */
          .panel-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          /* Input Section */
          .input-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .input-label {
            font-size: 12px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.7);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          /* Food Name Input */
          .food-name-input {
            width: 100%;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            transition: all 0.2s;
          }

          .food-name-input:focus {
            outline: none;
            border-color: var(--purple);
            background: rgba(255, 255, 255, 0.08);
          }

          .food-name-input:disabled {
            opacity: 0.5;
          }

          /* Common Names */
          .common-names {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            background: rgba(106, 255, 149, 0.1);
            border: 1px solid rgba(106, 255, 149, 0.2);
            border-radius: 12px;
            font-size: 12px;
          }

          .tag button {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            padding: 0;
            font-size: 12px;
            line-height: 1;
          }

          .tag button:hover:not(:disabled) {
            color: #fff;
          }

          /* Sources Grid - Dynamic columns based on enabled sources */
          .sources-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;
          }

          /* Footer */
          .panel-footer {
            padding: 16px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .error-msg {
            color: var(--red);
            font-size: 12px;
            text-align: center;
          }

          .selection-summary {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            text-align: center;
          }

          .add-btn {
            width: 100%;
            padding: 12px;
            background: var(--purple);
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .add-btn:hover:not(:disabled) {
            background: var(--purple-dark);
            transform: translateY(-1px);
          }

          .add-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* Scrollbar Styles */
          .panel-content::-webkit-scrollbar {
            width: 6px;
          }

          .panel-content::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 3px;
          }

          .panel-content::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }

          .panel-content::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `}</style>
      </div>
    </div>
  );
}
