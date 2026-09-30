'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiUrl } from '@/lib/utils/base-path';
import type { CompoundBreakdown, FoodBreakdown } from '@/lib/services/compound-breakdown-service';
import type { DvValue } from '@/lib/nutrition/totals';

interface CompoundTooltipProps {
  compoundId: string;
  compoundName: string;
  mealIds: string[];
  /**
   * The resolved daily value, so the tooltip can say where the target came from.
   *
   * Everything below the bar answers "what did I eat"; this answers "says who". The distinction is the
   * point of the whole source audit (dv-sources/PROVENANCE.md): a target that ten national authorities
   * agree on and a target one book asserts are different claims, and they should not look identical.
   */
  dailyValue?: DvValue | null;
  children: React.ReactNode;
}

/** How a body's region code is written for a person rather than for the database. */
const BODY_NAMES: Record<string, string> = {
  USA_CANADA: 'US/Canada', EU: 'EFSA', WHO_FAO: 'WHO/FAO', JAPAN: 'Japan', CHINA: 'China',
  KOREA: 'Korea', UK: 'UK', DACH: 'Germany/Austria/Switzerland', RUSSIA: 'Russia', INDIA: 'India',
};

// Confidence tier badge component
function ConfidenceBadge({ tier, confidence }: { tier: 1 | 2 | 3; confidence: number }) {
  const dots = tier === 1 ? '●○○' : tier === 2 ? '●●○' : '●●●';
  const color = tier === 1 ? 'var(--red)' : tier === 2 ? 'var(--yellow)' : 'var(--green)';

  return (
    <span className="confidence-badge" style={{ color }} title={`${confidence}% confidence`}>
      {dots}
    </span>
  );
}

// Format value with appropriate precision
function formatValue(value: number, unit: string): string {
  if (value === 0) return `0 ${unit}`;
  if (value < 0.01) return `<0.01 ${unit}`;
  if (value < 1) return `${value.toFixed(2)} ${unit}`;
  if (value < 100) return `${value.toFixed(1)} ${unit}`;
  return `${Math.round(value)} ${unit}`;
}

export default function CompoundTooltip({
  compoundId,
  compoundName,
  mealIds,
  dailyValue,
  children,
}: CompoundTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [breakdown, setBreakdown] = useState<CompoundBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch breakdown data when tooltip becomes visible
  const fetchBreakdown = useCallback(async () => {
    if (!compoundId || mealIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        compoundId,
        mealIds: mealIds.join(','),
      });

      const res = await fetch(apiUrl(`/api/compound-breakdown?${params}`));

      if (!res.ok) {
        if (res.status === 404) {
          setBreakdown(null);
          return;
        }
        throw new Error('Failed to fetch breakdown');
      }

      const data = await res.json();
      setBreakdown(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [compoundId, mealIds]);

  // Handle mouse enter with delay
  const handleMouseEnter = (e: React.MouseEvent) => {
    // Position tooltip near cursor
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    // Delay showing tooltip to avoid accidental triggers
    hoverTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      fetchBreakdown();
    }, 300);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsVisible(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tooltip-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative', display: 'inline-block', width: '100%' }}
    >
      {children}

      {isVisible && (
        <div
          ref={tooltipRef}
          className="compound-tooltip"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '100%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            zIndex: 1000,
          }}
        >
          <div className="tooltip-header">
            <span className="tooltip-title">{compoundName}</span>
            {breakdown && (
              <ConfidenceBadge
                tier={breakdown.totalConfidenceTier}
                confidence={breakdown.totalConfidence}
              />
            )}
          </div>

          {loading && (
            <div className="tooltip-loading">Loading...</div>
          )}

          {error && (
            <div className="tooltip-error">{error}</div>
          )}

          {!loading && !error && !breakdown && (
            <div className="tooltip-empty">Not in selected meals</div>
          )}

          {dailyValue && (
            <div className="tooltip-dv">
              <div className="dv-target">
                <span className="dv-label">Target</span>
                <span className="dv-value">
                  {formatValue(dailyValue.value, dailyValue.unit)}
                  {dailyValue.sourceCount ? (
                    <span className="dv-bodies">
                      {' '}· median of {dailyValue.sourceCount}{' '}
                      {dailyValue.sourceCount === 1 ? 'authority' : 'authorities'}
                    </span>
                  ) : null}
                </span>
              </div>

              {/* One body is not a consensus, and the bar should not imply it is. */}
              {dailyValue.sourceCount === 1 && dailyValue.sources?.[0] && (
                <div className="dv-caution">
                  Only {BODY_NAMES[dailyValue.sources[0]] ?? dailyValue.sources[0]} publishes a value for this.
                </div>
              )}

              {dailyValue.spread && dailyValue.spread[0] !== dailyValue.spread[1] && (
                <div className="dv-spread">
                  They range from {formatValue(dailyValue.spread[0], dailyValue.unit)} to{' '}
                  {formatValue(dailyValue.spread[1], dailyValue.unit)}
                </div>
              )}

              {dailyValue.sources && dailyValue.sources.length > 0 && (
                <div className="dv-sources">
                  {dailyValue.sources.map((r) => BODY_NAMES[r] ?? r).join(' · ')}
                </div>
              )}

              {dailyValue.upperLimit != null && (
                <div className="dv-limit">
                  Upper limit {formatValue(dailyValue.upperLimit, dailyValue.upperLimitUnit ?? dailyValue.unit)}
                </div>
              )}

              {/* Stated apart, and never as a limit on food: several bodies set this one only for
                  supplements and fortified foods, and showing it against a meal would be wrong. */}
              {dailyValue.supplementLimit && (
                <div className="dv-limit dv-limit--supplement">
                  {formatValue(dailyValue.supplementLimit.value, dailyValue.supplementLimit.unit)} limit applies to
                  supplements and fortified foods only — not to food
                </div>
              )}
            </div>
          )}

          {breakdown && breakdown.foods.length > 0 && (
            <div className="tooltip-content">
              {/* Total row */}
              <div className="tooltip-total">
                <span className="total-label">Total:</span>
                <span className="total-value">
                  {formatValue(breakdown.totalAmount, breakdown.unit)}
                </span>
              </div>

              {/* Food breakdown */}
              <div className="tooltip-foods">
                {breakdown.foods.map((food) => (
                  <div key={food.foodId} className="food-row">
                    <div className="food-header">
                      <span className="food-name">
                        {food.portionGrams}g {food.foodName}
                      </span>
                      <span className="food-amount">
                        {formatValue(food.amountFromFood, food.unit)}
                      </span>
                      <ConfidenceBadge
                        tier={food.confidenceTier}
                        confidence={food.confidence}
                      />
                    </div>

                    {/* Source values */}
                    {food.sources.length > 0 && (
                      <div className="source-list">
                        {food.sources.map((source, idx) => (
                          <span key={idx} className="source-item">
                            {source.source}: {formatValue(source.value, source.unit)}/100g
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <style jsx>{`
            .tooltip-dv {
              padding: 8px 10px;
              border-bottom: 1px solid rgba(46, 26, 14, 0.12);
              display: flex;
              flex-direction: column;
              gap: 3px;
            }
            .dv-target {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              gap: 10px;
            }
            .dv-label {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              opacity: 0.6;
            }
            .dv-value {
              font-size: 13px;
              font-weight: 500;
            }
            .dv-bodies {
              font-weight: 400;
              opacity: 0.65;
            }
            .dv-spread,
            .dv-sources,
            .dv-limit,
            .dv-caution {
              font-size: 11px;
              line-height: 1.35;
              opacity: 0.7;
            }
            .dv-sources {
              opacity: 0.5;
            }
            .dv-caution {
              opacity: 0.85;
            }
            .dv-limit--supplement {
              opacity: 0.85;
            }
            .compound-tooltip {
              background: #fff7f4;
              color: #2e1a0e;
              border: 1px solid rgba(34, 211, 238, 0.3);
              border-radius: 8px;
              padding: 12px;
              min-width: 280px;
              max-width: 350px;
              box-shadow: 0 8px 28px rgba(46, 26, 14, 0.22);
              border: 1px solid rgba(46, 26, 14, 0.16);
              backdrop-filter: blur(8px);
            }

            .tooltip-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 8px;
              padding-bottom: 8px;
              border-bottom: 1px solid rgba(46, 26, 14, 0.12);
              margin-bottom: 8px;
            }

            .tooltip-title {
              font-weight: 600;
              color: var(--accent-dark, #306070);
              font-size: 17px;
            }

            .confidence-badge {
              font-size: 16px;
              letter-spacing: 1px;
            }

            .tooltip-loading,
            .tooltip-error,
            .tooltip-empty {
              color: rgba(46, 26, 14, 0.6);
              font-size: 16px;
              padding: 8px 0;
            }

            .tooltip-error {
              color: var(--red, #ef4444);
            }

            .tooltip-total {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 6px 0;
              border-bottom: 1px solid rgba(46, 26, 14, 0.12);
              margin-bottom: 8px;
            }

            .total-label {
              color: rgba(46, 26, 14, 0.72);
              font-size: 16px;
            }

            .total-value {
              color: var(--accent-dark, #306070);
              font-weight: 600;
              font-size: 17px;
            }

            .tooltip-foods {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }

            .food-row {
              padding: 6px 0;
            }

            .food-header {
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .food-name {
              color: #2e1a0e;
              font-size: 16px;
              flex: 1;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .food-amount {
              color: rgba(46, 26, 14, 0.8);
              font-size: 16px;
              font-weight: 500;
            }

            .source-list {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-top: 4px;
              padding-left: 8px;
            }

            .source-item {
              font-size: 15px;
              color: rgba(46, 26, 14, 0.6);
              background: rgba(46, 26, 14, 0.05);
              padding: 2px 6px;
              border-radius: 4px;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
