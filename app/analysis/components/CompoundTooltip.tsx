'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiUrl } from '@/lib/utils/base-path';
import type { CompoundBreakdown, FoodBreakdown } from '@/lib/services/compound-breakdown-service';

interface CompoundTooltipProps {
  compoundId: string;
  compoundName: string;
  mealIds: string[];
  children: React.ReactNode;
}

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
              font-size: 13px;
            }

            .confidence-badge {
              font-size: 12px;
              letter-spacing: 1px;
            }

            .tooltip-loading,
            .tooltip-error,
            .tooltip-empty {
              color: rgba(46, 26, 14, 0.6);
              font-size: 12px;
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
              font-size: 12px;
            }

            .total-value {
              color: var(--accent-dark, #306070);
              font-weight: 600;
              font-size: 14px;
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
              font-size: 12px;
              flex: 1;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .food-amount {
              color: rgba(46, 26, 14, 0.8);
              font-size: 12px;
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
              font-size: 10px;
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
