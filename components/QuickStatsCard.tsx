import React from 'react';
import type { DailyStats } from '@/lib/types';

interface QuickStatsCardProps {
  stats: DailyStats | null;
}

export default function QuickStatsCard({ stats }: QuickStatsCardProps) {
  // Helper to determine health score status
  const getHealthScoreStatus = (score: number): { label: string; zone: string } => {
    if (score >= 80) return { label: 'Good', zone: 'optimal' };
    if (score >= 60) return { label: 'Fair', zone: 'warning' };
    return { label: 'Needs Improvement', zone: 'deficient' };
  };

  // Helper to determine calorie status (assuming 1800-2200 is optimal)
  const getCalorieStatus = (calories: number): { label: string; zone: string } => {
    if (calories >= 1800 && calories <= 2200) return { label: 'On track', zone: 'optimal' };
    if (calories < 1800) return { label: 'Below target', zone: 'warning' };
    return { label: 'Above target', zone: 'warning' };
  };

  // Helper to determine macro balance status
  const getMacroStatus = (
    macros: DailyStats['macros']
  ): { label: string; zone: string } => {
    // Ideal balance roughly: 40-50% carbs, 25-35% protein, 20-30% fat
    const { carbs, protein, fat } = macros;

    if (
      carbs >= 40 &&
      carbs <= 50 &&
      protein >= 25 &&
      protein <= 35 &&
      fat >= 20 &&
      fat <= 30
    ) {
      return { label: 'Optimal', zone: 'optimal' };
    }

    return { label: 'Check balance', zone: 'warning' };
  };

  if (!stats) {
    return (
      <section className="col-6" aria-label="Quick statistics">
        <article className="card-elevated">
          <div className="card-header-text">Quick Stats</div>
          <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.5)' }}>
            No stats available
          </div>
        </article>
      </section>
    );
  }

  const calorieStatus = getCalorieStatus(stats.calories);
  const healthScoreStatus = getHealthScoreStatus(stats.healthScore);
  const macroStatus = getMacroStatus(stats.macros);

  return (
    <section className="col-6" aria-label="Quick statistics">
      <article className="card-elevated">
        <div className="card-header-text">Quick Stats</div>
        <div className="totals-grid">
          <div className="total-item">
            <div className="total-name">Calories</div>
            <div className="total-value">{stats.calories?.toLocaleString() ?? 0} kcal</div>
            <span className={`total-badge zone-${calorieStatus.zone}`}>
              <span>{calorieStatus.zone === 'optimal' ? '✓' : '⚠️'}</span>
              <span>{calorieStatus.label}</span>
            </span>
          </div>
          <div className="total-item">
            <div className="total-name">Health Score</div>
            <div className="total-value">{stats.healthScore ?? 0} / 100</div>
            <span className={`total-badge zone-${healthScoreStatus.zone}`}>
              <span>{healthScoreStatus.zone === 'optimal' ? '✓' : '⚠️'}</span>
              <span>{healthScoreStatus.label}</span>
            </span>
          </div>
        </div>
        <div className="total-item" style={{ marginTop: '16px' }}>
          <div className="total-name">Macros Balance</div>
          <div className="total-value">
            {stats.macros?.carbs ?? 0}C / {stats.macros?.protein ?? 0}P /{' '}
            {stats.macros?.fat ?? 0}F
          </div>
          <span className={`total-badge zone-${macroStatus.zone}`}>
            <span>{macroStatus.zone === 'optimal' ? '✓' : '⚠️'}</span>
            <span>{macroStatus.label}</span>
          </span>
        </div>
      </article>
    </section>
  );
}
