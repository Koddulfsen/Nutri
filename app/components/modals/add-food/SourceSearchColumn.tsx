'use client';

/**
 * Source Search Column Component
 *
 * Reusable search column for any food data source.
 * Handles search, pagination, selection, and nutrient count display.
 *
 * Usage:
 *   <SourceSearchColumn
 *     source={cnfConfig}
 *     selected={selectedCnf}
 *     onSelect={setSelectedCnf}
 *   />
 *
 * Generated: 2026-01-18
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@/lib/utils/base-path';
import { FoodSourceConfig } from './source-config';

/**
 * Selected food item from any source
 */
export interface SelectedFood {
  apiSource: string;
  apiFoodId: string;
  name: string;
  description?: string;
  variant?: string; // Specific variant/preparation (e.g., FooDB orig_food_name)
  // Multi-variant blend (parent foods only — Duke plant_parts, FooDB variants).
  // When set, `variant` is ignored. Percents sum to 100.
  composition?: Array<{ variant: string; percent: number }>;
}

/**
 * One selectable child variant under a parent food.
 * Variant code (e.g., Duke "LF") + a human label, with its compound count.
 */
interface VariantOption {
  variant: string;
  label: string;
  compoundCount: number;
}

/**
 * Search result from API (unified format)
 */
interface SearchResult {
  apiSource: string;
  apiId: string;
  name: string;
  description?: string;
  category?: string;
  relevanceScore?: number;
  variant?: string; // Specific variant/preparation (e.g., FooDB orig_food_name)
  nutrientCount?: number; // Compound count (available for local sources like FooDB)
  // FooDB only: variants are returned inline by the search endpoint.
  variants?: Array<{ origFoodName: string; preparationType: string | null; compoundCount: number }>;
}

interface SourceSearchColumnProps {
  source: FoodSourceConfig;
  selected: SelectedFood | null;
  onSelect: (food: SelectedFood | null) => void;
  disabled?: boolean;
}

export default function SourceSearchColumn({
  source,
  selected,
  onSelect,
  disabled = false,
}: SourceSearchColumnProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Nutrient count state
  const [nutrientCount, setNutrientCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  // Composition expansion (DUKE plant_parts, FOODB variants).
  // Only one row can be in "compose" mode at a time per column.
  const isParentSource = source.code === 'DUKE' || source.code === 'FOODB';
  const [composeFoodId, setComposeFoodId] = useState<string | null>(null);
  const [variantsByFood, setVariantsByFood] = useState<Record<string, VariantOption[]>>({});
  const [variantsLoading, setVariantsLoading] = useState(false);
  // variant code -> percent (string while editing so user can clear / type "75")
  const [draftPercents, setDraftPercents] = useState<Record<string, string>>({});

  // Debounced search effect
  useEffect(() => {
    // Clear results if query is empty
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      setPage(1);
      setHasMore(true);
      setError(null);
      return;
    }

    // Reset pagination on new query
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setError(null);

    // Debounce: wait 500ms after user stops typing
    const timeoutId = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: searchQuery, limit: '20', page: '1' });
        const res = await fetch(apiUrl(`${source.searchEndpoint}?${params}`));

        if (!res.ok) {
          throw new Error(`${source.shortName} search failed`);
        }

        const data = await res.json();
        setResults(data.results || []);
        setHasMore(data.metadata?.hasMore ?? false);
      } catch (err) {
        setError(err instanceof Error ? err.message : `${source.shortName} search failed`);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, source.searchEndpoint, source.shortName]);

  // Load more results (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !searchQuery.trim()) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams({ q: searchQuery, limit: '20', page: nextPage.toString() });
      const res = await fetch(apiUrl(`${source.searchEndpoint}?${params}`));

      if (!res.ok) {
        throw new Error(`${source.shortName} search failed`);
      }

      const data = await res.json();
      setResults(prev => [...prev, ...(data.results || [])]);
      setPage(nextPage);
      setHasMore(data.metadata?.hasMore ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : `${source.shortName} search failed`);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, searchQuery, page, source.searchEndpoint, source.shortName]);

  // Fetch nutrient count when item is selected
  const fetchNutrientCount = useCallback(async (foodId: string, variant?: string) => {
    setCountLoading(true);
    setNutrientCount(null);
    try {
      const params = new URLSearchParams({ source: source.code, id: foodId });
      // Pass variant for FooDB to get accurate nutrient count for specific preparation
      if (variant) {
        params.set('variant', variant);
      }
      const res = await fetch(apiUrl(`/api/foods/nutrient-count?${params}`));
      if (res.ok) {
        const data = await res.json();
        setNutrientCount(data.nutrientCount);
      }
    } catch (err) {
      console.error(`Failed to fetch ${source.shortName} nutrient count:`, err);
    } finally {
      setCountLoading(false);
    }
  }, [source.code, source.shortName]);

  // Handle scroll for infinite loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (bottom) {
      loadMore();
    }
  };

  // Handle item selection (flat sources, or shortcut for parent sources with no expansion)
  const handleSelect = (food: SearchResult) => {
    const foodId = food.apiId.toString();
    onSelect({
      apiSource: source.code,
      apiFoodId: foodId,
      name: food.name,
      description: food.description,
      variant: food.variant, // Pass variant for FooDB (orig_food_name)
    });
    fetchNutrientCount(foodId, food.variant);
  };

  // Reset nutrient count when selection clears
  useEffect(() => {
    if (!selected) {
      setNutrientCount(null);
    }
  }, [selected]);

  // Toggle compose panel for a parent food. Loads variants on open.
  const handleToggleCompose = useCallback(async (food: SearchResult) => {
    const foodId = food.apiId.toString();
    if (composeFoodId === foodId) {
      setComposeFoodId(null);
      return;
    }
    setComposeFoodId(foodId);
    setDraftPercents({});

    // FooDB: variants come in the search payload — no roundtrip.
    if (source.code === 'FOODB' && food.variants) {
      setVariantsByFood((prev) => ({
        ...prev,
        [foodId]: food.variants!.map((v) => ({
          variant: v.origFoodName,
          label: v.origFoodName,
          compoundCount: v.compoundCount,
        })),
      }));
      return;
    }

    // Duke: fetch parts on demand.
    if (source.code === 'DUKE') {
      if (variantsByFood[foodId]) return;
      setVariantsLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/foods/duke/parts?fnfNum=${encodeURIComponent(foodId)}`));
        if (res.ok) {
          const data = await res.json();
          setVariantsByFood((prev) => ({
            ...prev,
            [foodId]: (data.parts as Array<{ plantPart: string; label: string; compoundCount: number }>).map((p) => ({
              variant: p.plantPart,
              label: p.label,
              compoundCount: p.compoundCount,
            })),
          }));
        }
      } finally {
        setVariantsLoading(false);
      }
    }
  }, [composeFoodId, source.code, variantsByFood]);

  const handleVariantToggle = (variant: string) => {
    setDraftPercents((prev) => {
      const next = { ...prev };
      if (variant in next) delete next[variant];
      else next[variant] = '';
      return next;
    });
  };

  const handlePercentChange = (variant: string, raw: string) => {
    // Allow empty while editing; clamp digits to 0..100.
    if (raw === '') {
      setDraftPercents((prev) => ({ ...prev, [variant]: '' }));
      return;
    }
    const n = Math.max(0, Math.min(100, Number(raw)));
    if (Number.isNaN(n)) return;
    setDraftPercents((prev) => ({ ...prev, [variant]: String(n) }));
  };

  const draftEntries = Object.entries(draftPercents);
  const draftSum = draftEntries.reduce((s, [, v]) => s + (Number(v) || 0), 0);
  const draftValid =
    draftEntries.length > 0 &&
    draftEntries.every(([, v]) => Number(v) > 0) &&
    Math.round(draftSum * 100) === 10000;

  const handleApplyComposition = (food: SearchResult) => {
    if (!draftValid) return;
    const composition = draftEntries.map(([variant, v]) => ({ variant, percent: Number(v) }));
    const foodId = food.apiId.toString();
    onSelect({
      apiSource: source.code,
      apiFoodId: foodId,
      name: food.name,
      description: food.description,
      composition,
    });
    // Compose count = sum of variant counts (rough but useful preview).
    const variants = variantsByFood[foodId] ?? [];
    const total = variants
      .filter((v) => composition.some((c) => c.variant === v.variant))
      .reduce((s, v) => s + v.compoundCount, 0);
    setNutrientCount(total);
    setComposeFoodId(null);
  };

  return (
    <div className={`source-column ${disabled ? 'disabled' : ''}`}>
      {/* Header */}
      <div className="column-header">
        <span className="column-icon">{source.icon}</span>
        <span className="column-title">{source.shortName}</span>
        {selected && (
          <span className="selected-info">
            <span className="selected-badge">✓</span>
            {countLoading ? (
              <span className="nutrient-count loading">...</span>
            ) : nutrientCount !== null ? (
              <span className="nutrient-count">{nutrientCount} compounds</span>
            ) : null}
          </span>
        )}
      </div>

      {/* Search Input */}
      <input
        type="text"
        className="api-search-input"
        placeholder={`Search ${source.shortName}...`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={disabled}
      />

      {/* Error Message */}
      {error && <div className="search-error">{error}</div>}

      {/* Results List */}
      <div className="results-list" onScroll={handleScroll}>
        {results.length === 0 && loading ? (
          <div className="no-results searching">Searching...</div>
        ) : results.length === 0 && !loading ? (
          <div className="no-results">
            {searchQuery.trim() ? 'No results' : 'Type to search'}
          </div>
        ) : (
          <>
            {results.map((food) => {
              const foodId = food.apiId.toString();
              // Use apiId + variant for unique key (FooDB has multiple variants per apiId — legacy)
              const uniqueKey = food.variant ? `${foodId}-${food.variant}` : foodId;
              const isSelected = selected?.apiFoodId === foodId &&
                                 (selected?.variant === food.variant || (!selected?.variant && !food.variant));
              const isExpanded = composeFoodId === foodId;
              const variants = variantsByFood[foodId];
              // FooDB rows with only one variant don't need expansion.
              const isComposable = isParentSource && (
                source.code === 'DUKE' ||
                (source.code === 'FOODB' && (food.variants?.length ?? 0) > 1)
              );

              return (
              <div key={uniqueKey} className={`result-item ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}>
                <div
                  className="result-row"
                  onClick={() => (isComposable ? handleToggleCompose(food) : handleSelect(food))}
                >
                  <div className="result-main">
                    <div className="result-name">{food.name}</div>
                    {food.description && <div className="result-desc">{food.description}</div>}
                    {food.category && <div className="result-category">{food.category}</div>}
                    <div className="result-meta">
                      <span>ID: {food.apiId}</span>
                      {food.nutrientCount !== undefined && food.nutrientCount > 0 && (
                        <span className="result-nutrient-count">{food.nutrientCount} compounds</span>
                      )}
                      {isComposable && (
                        <span className="result-variant-count">
                          {source.code === 'DUKE' ? 'plant parts' : `${food.variants?.length ?? 0} variants`}
                        </span>
                      )}
                    </div>
                  </div>
                  {isComposable && <div className="chevron">{isExpanded ? '▾' : '▸'}</div>}
                </div>

                {isExpanded && (
                  <div className="compose-panel" onClick={(e) => e.stopPropagation()}>
                    {variantsLoading && !variants ? (
                      <div className="compose-loading">Loading parts…</div>
                    ) : !variants || variants.length === 0 ? (
                      <div className="compose-loading">No parts available</div>
                    ) : (
                      <>
                        <div className="compose-list">
                          {variants.map((v) => {
                            const checked = v.variant in draftPercents;
                            return (
                              <label key={v.variant} className={`variant-row ${checked ? 'checked' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => handleVariantToggle(v.variant)}
                                />
                                <span className="variant-label">{v.label}</span>
                                <span className="variant-count">{v.compoundCount}</span>
                                <input
                                  type="number"
                                  className="variant-percent"
                                  min={0}
                                  max={100}
                                  step={1}
                                  placeholder="%"
                                  value={draftPercents[v.variant] ?? ''}
                                  disabled={!checked}
                                  onChange={(e) => handlePercentChange(v.variant, e.target.value)}
                                />
                              </label>
                            );
                          })}
                        </div>
                        <div className="compose-footer">
                          <span className={`compose-sum ${draftValid ? 'valid' : ''}`}>
                            {draftSum} / 100
                          </span>
                          <button
                            type="button"
                            className="compose-apply"
                            disabled={!draftValid}
                            onClick={() => handleApplyComposition(food)}
                          >
                            Use composition
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              );
            })}
            {loading && (
              <div className="loading-msg">Loading...</div>
            )}
            {!loading && results.length > 0 && !hasMore && (
              <div className="no-more-msg">No more results</div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .source-column {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .source-column.disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .column-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
        }

        .column-icon {
          font-size: 16px;
        }

        .column-title {
          flex: 1;
        }

        .selected-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .selected-badge {
          color: var(--green);
          font-size: 14px;
        }

        .nutrient-count {
          font-size: 11px;
          color: var(--cyan, #22d3ee);
          background: rgba(34, 211, 238, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .nutrient-count.loading {
          color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.05);
        }

        .api-search-input {
          width: 100%;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #fff;
          font-size: 13px;
          transition: all 0.2s;
        }

        .api-search-input:focus {
          outline: none;
          border-color: var(--purple);
          background: rgba(255, 255, 255, 0.06);
        }

        .api-search-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .search-error {
          color: var(--red);
          font-size: 12px;
          padding: 4px;
        }

        .results-list {
          max-height: 300px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .result-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .result-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .result-item.selected {
          background: rgba(106, 255, 149, 0.1);
          border-color: var(--green);
        }

        .result-item.expanded {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .result-row {
          padding: 10px 12px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
        }

        .result-main {
          flex: 1;
          min-width: 0;
        }

        .chevron {
          color: rgba(255, 255, 255, 0.4);
          font-size: 12px;
          line-height: 1;
          padding-top: 2px;
        }

        .result-variant-count {
          font-size: 10px;
          color: var(--accent-text, #906070);
          background: rgba(144, 96, 112, 0.12);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .compose-panel {
          padding: 8px 12px 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .compose-loading {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          padding: 6px 0;
        }

        .compose-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 200px;
          overflow-y: auto;
        }

        .variant-row {
          display: grid;
          grid-template-columns: 16px 1fr auto 60px;
          gap: 8px;
          align-items: center;
          padding: 6px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .variant-row:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .variant-row.checked {
          background: rgba(80, 136, 152, 0.08);
        }

        .variant-label {
          color: rgba(255, 255, 255, 0.85);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .variant-count {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
        }

        .variant-percent {
          width: 60px;
          padding: 4px 6px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          color: #fff;
          font-size: 12px;
          text-align: right;
          font-family: var(--font-mono, monospace);
        }

        .variant-percent:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .compose-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-top: 4px;
        }

        .compose-sum {
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .compose-sum.valid {
          color: var(--green, #6aff95);
        }

        .compose-apply {
          padding: 6px 12px;
          background: var(--accent, #508898);
          border: none;
          border-radius: 3px;
          color: #fff;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .compose-apply:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .result-name {
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .result-desc {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .result-category {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 3px;
          display: inline-block;
          margin-bottom: 4px;
        }

        .result-meta {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .result-nutrient-count {
          font-size: 10px;
          color: var(--cyan, #22d3ee);
          background: rgba(34, 211, 238, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .no-results {
          padding: 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.3);
          font-size: 12px;
        }

        .no-results.searching {
          color: rgba(217, 70, 239, 0.7);
          animation: pulse-search 1.5s ease-in-out infinite;
        }

        @keyframes pulse-search {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .loading-msg {
          padding: 12px;
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          font-style: italic;
        }

        .no-more-msg {
          padding: 12px;
          text-align: center;
          color: rgba(255, 255, 255, 0.3);
          font-size: 11px;
          font-style: italic;
        }

        /* Scrollbar Styles */
        .results-list::-webkit-scrollbar {
          width: 6px;
        }

        .results-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 3px;
        }

        .results-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .results-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
