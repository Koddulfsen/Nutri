'use client';

/**
 * ReviewPhase - Review selections and submit
 *
 * Phase 4 of the Smart Add Food flow.
 * User confirms food name, category, and portions. Everything else is AI-handled.
 */

import { useState } from 'react';
import { FOOD_SOURCES } from '../add-food/source-config';
import type { NormalizedResult, FoodMetadata, PortionEntry, OriginType } from './types';

const ORIGIN_OPTIONS: OriginType[] = ['animal', 'plant', 'fungi', 'composite', 'supplement', 'other'];

interface ReviewPhaseProps {
  foodName: string;
  commonNames: string[];
  selections: Record<string, NormalizedResult | null>;
  skipped: Set<string>;
  submitting: boolean;
  submitError: string | null;
  metadata: FoodMetadata | null;
  categoryPath: string | null;
  portions: PortionEntry[];
  portionsLoading: boolean;
  onSetFoodName: (name: string) => void;
  onSetCommonNames: (names: string[]) => void;
  onSetMetadata: (metadata: FoodMetadata | null) => void;
  onSetCategoryPath: (path: string | null) => void;
  onSetPortions: (portions: PortionEntry[]) => void;
  onSubmit: () => void;
  onGoToCarousel: (sourceIndex: number) => void;
  onBack: () => void;
  sourcesWithResults: Array<{ code: string }>;
}

export default function ReviewPhase({
  foodName,
  categoryPath,
  portions,
  portionsLoading,
  submitting,
  submitError,
  selections,
  onSetFoodName,
  onSetCategoryPath,
  onSetPortions,
  onSubmit,
  onBack,
}: ReviewPhaseProps) {
  const [newPortionDesc, setNewPortionDesc] = useState('');
  const [newPortionGrams, setNewPortionGrams] = useState('');

  const selectedCount = Object.values(selections).filter(Boolean).length;

  const updatePortion = (index: number, field: keyof PortionEntry, value: any) => {
    const updated = [...portions];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'isDefault' && value === true) {
      updated.forEach((p, i) => { if (i !== index) p.isDefault = false; });
    }
    onSetPortions(updated);
  };

  const removePortion = (index: number) => {
    const updated = portions.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((p) => p.isDefault)) {
      updated[0].isDefault = true;
    }
    onSetPortions(updated);
  };

  const addCustomPortion = () => {
    const desc = newPortionDesc.trim();
    const grams = parseFloat(newPortionGrams);
    if (!desc || isNaN(grams) || grams <= 0) return;
    onSetPortions([
      ...portions,
      { description: desc, gramWeight: Math.round(grams), isDefault: portions.length === 0 },
    ]);
    setNewPortionDesc('');
    setNewPortionGrams('');
  };

  return (
    <div className="review-phase">
      <button className="back-btn" onClick={onBack} disabled={submitting}>
        {'\u2190'} Back to selection
      </button>

      {/* Food Name */}
      <div className="field-group">
        <label className="field-label">Food Name</label>
        <input
          type="text"
          className="field-input"
          value={foodName}
          onChange={(e) => onSetFoodName(e.target.value)}
          disabled={submitting}
        />
      </div>

      {/* Category */}
      <div className="field-group">
        <label className="field-label">Category</label>
        <input
          type="text"
          className="field-input"
          value={categoryPath || ''}
          onChange={(e) => onSetCategoryPath(e.target.value || null)}
          placeholder="e.g. Dairy &gt; Cheese"
          disabled={submitting}
        />
      </div>

      {/* Portions */}
      <div className="field-group">
        <label className="field-label">
          Portions
          {portionsLoading && <span className="loading-hint"> loading...</span>}
        </label>

        {portions.length > 0 && (
          <div className="portions-list">
            {portions.map((p, i) => (
              <div key={i} className={`portion-row ${p.isDefault ? 'is-default' : ''}`}>
                <button
                  className="default-star"
                  onClick={() => updatePortion(i, 'isDefault', true)}
                  disabled={submitting}
                  title={p.isDefault ? 'Default portion' : 'Set as default'}
                >
                  {p.isDefault ? '\u2605' : '\u2606'}
                </button>
                <input
                  type="text"
                  className="portion-desc"
                  value={p.description}
                  onChange={(e) => updatePortion(i, 'description', e.target.value)}
                  disabled={submitting}
                />
                <div className="portion-weight-wrap">
                  <input
                    type="number"
                    className="portion-weight"
                    value={p.gramWeight}
                    onChange={(e) => updatePortion(i, 'gramWeight', Math.round(parseFloat(e.target.value) || 0))}
                    disabled={submitting}
                    min={1}
                  />
                  <span className="gram-unit">g</span>
                </div>
                <button
                  className="portion-remove"
                  onClick={() => removePortion(i)}
                  disabled={submitting}
                >
                  {'\u2715'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="add-portion-row">
          <input
            type="text"
            className="add-portion-desc"
            placeholder="e.g. 1 cup"
            value={newPortionDesc}
            onChange={(e) => setNewPortionDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomPortion())}
            disabled={submitting}
          />
          <input
            type="number"
            className="add-portion-grams"
            placeholder="grams"
            value={newPortionGrams}
            onChange={(e) => setNewPortionGrams(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomPortion())}
            disabled={submitting}
            min={1}
          />
          <button
            className="add-portion-btn"
            onClick={addCustomPortion}
            disabled={!newPortionDesc.trim() || !newPortionGrams || submitting}
          >
            +
          </button>
        </div>
      </div>

      {submitError && <div className="error-msg">{submitError}</div>}

      <button
        className="review-submit-btn"
        onClick={onSubmit}
        disabled={submitting || !foodName.trim() || selectedCount === 0}
      >
        {submitting ? 'Adding...' : `Add Food`}
      </button>

      <style jsx>{`
        .review-phase {
          display: flex;
          flex-direction: column;
          gap: 20px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
        }

        .back-btn {
          align-self: flex-start;
          background: transparent;
          border: none;
          color: var(--text-3, #484860);
          font-size: 12px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          cursor: pointer;
          padding: 2px 4px;
          transition: color 0.15s;
        }

        .back-btn:hover:not(:disabled) {
          color: var(--text-1, #e8e8f4);
        }

        .back-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-3, #484860);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .loading-hint {
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
          color: var(--text-3, #484860);
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .field-input {
          padding: 10px 12px;
          background: var(--surface, #050505);
          border: 1px solid transparent;
          border-radius: 3px;
          box-shadow: none;
          color: var(--text-1, #e8e8f4);
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          outline: none;
          transition: border-color 0.15s;
          width: 100%;
          box-sizing: border-box;
        }

        .field-input:focus { border-color: var(--accent, #508898); }
        .field-input:disabled { opacity: 0.5; }
        .field-input::placeholder { color: var(--text-3, #484860); }

        /* Portions */
        .portions-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-bottom: 6px;
        }

        .portion-row {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          background: var(--bg-accent, #0f0f0f);
          border: 1px solid var(--border, #1e1e24);
          border-radius: 3px;
          transition: border-color 0.15s;
        }

        .portion-row.is-default {
          border-color: var(--accent-border, rgba(80,136,152,0.14));
          background: var(--accent-soft, rgba(80,136,152,0.06));
        }

        .default-star {
          background: none;
          border: none;
          color: var(--text-3, #484860);
          cursor: pointer;
          font-size: 13px;
          padding: 2px;
          line-height: 1;
          transition: color 0.15s;
          flex-shrink: 0;
        }

        .portion-row.is-default .default-star { color: var(--accent, #508898); }

        .portion-desc {
          flex: 1;
          padding: 3px 6px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 3px;
          color: var(--text-1, #e8e8f4);
          font-size: 13px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          outline: none;
          transition: border-color 0.15s;
        }

        .portion-desc:focus {
          border-color: var(--border, #1e1e24);
          background: var(--surface, #050505);
        }

        .portion-weight-wrap {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .portion-weight {
          width: 56px;
          padding: 3px 6px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 3px;
          color: var(--text-2, #8080a0);
          font-size: 13px;
          font-family: var(--font-mono, 'DM Mono', monospace);
          text-align: right;
          outline: none;
          transition: border-color 0.15s;
        }

        .portion-weight:focus {
          border-color: var(--border, #1e1e24);
          background: var(--surface, #050505);
        }

        .gram-unit {
          font-size: 11px;
          color: var(--text-3, #484860);
        }

        .portion-remove {
          background: none;
          border: none;
          color: var(--text-3, #484860);
          cursor: pointer;
          font-size: 11px;
          padding: 2px 4px;
          flex-shrink: 0;
          transition: color 0.15s;
        }

        .portion-remove:hover:not(:disabled) { color: #ef4444; }
        .portion-remove:disabled { opacity: 0.3; cursor: not-allowed; }

        .add-portion-row {
          display: flex;
          gap: 5px;
        }

        .add-portion-desc {
          flex: 1;
          padding: 7px 10px;
          background: var(--surface, #050505);
          border: 1px solid transparent;
          border-radius: 3px;
          box-shadow: none;
          color: var(--text-1, #e8e8f4);
          font-size: 13px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          outline: none;
          transition: border-color 0.15s;
        }

        .add-portion-desc:focus { border-color: var(--accent, #508898); }
        .add-portion-desc::placeholder { color: var(--text-3, #484860); }

        .add-portion-grams {
          width: 70px;
          padding: 7px 8px;
          background: var(--surface, #050505);
          border: 1px solid transparent;
          border-radius: 3px;
          box-shadow: none;
          color: var(--text-1, #e8e8f4);
          font-size: 13px;
          font-family: var(--font-mono, 'DM Mono', monospace);
          text-align: right;
          outline: none;
          transition: border-color 0.15s;
        }

        .add-portion-grams:focus { border-color: var(--accent, #508898); }
        .add-portion-grams::placeholder { color: var(--text-3, #484860); }

        .add-portion-btn {
          padding: 7px 12px;
          background: transparent;
          border: 1px solid var(--border, #1e1e24);
          border-radius: 3px;
          color: var(--text-2, #8080a0);
          font-size: 16px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }

        .add-portion-btn:hover:not(:disabled) {
          border-color: var(--accent-border, rgba(80,136,152,0.14));
          color: var(--text-1, #e8e8f4);
        }

        .add-portion-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .error-msg {
          color: #ef4444;
          font-size: 12px;
          text-align: center;
          padding: 4px;
        }

        .review-submit-btn {
          align-self: center;
          width: fit-content;
          padding: 12px 36px;
          background: var(--accent, #508898);
          color: #fff;
          border: none;
          outline: none;
          border-radius: 3px;
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          cursor: pointer;
          box-shadow: 0 5px 0 var(--accent-dark, #306070);
          transform: translateY(0);
          transition: transform 0.08s, box-shadow 0.08s;
        }

        .review-submit-btn:hover:not(:disabled) {
          transform: translateY(2px);
          box-shadow: 0 3px 0 var(--accent-dark, #306070);
        }

        .review-submit-btn:active:not(:disabled) {
          transform: translateY(5px);
          box-shadow: 0 0px 0 var(--accent-dark, #306070);
        }

        .review-submit-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .review-submit-btn:focus,
        .review-submit-btn:focus-visible {
          outline: none;
        }
      `}</style>
    </div>
  );
}
