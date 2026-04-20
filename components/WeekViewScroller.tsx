'use client';

import type { WeekDay } from '@/lib/types';

interface WeekViewScrollerProps {
  weekDays: WeekDay[];
  onDayClick: (date: number) => void;
}

export default function WeekViewScroller({
  weekDays,
  onDayClick
}: WeekViewScrollerProps) {
  const getZoneEmoji = (zone: 'optimal' | 'warning' | 'deficient' | null) => {
    if (!zone) return '—';
    switch (zone) {
      case 'optimal':
        return '🟢';
      case 'warning':
        return '🟡';
      case 'deficient':
        return '🔴';
      default:
        return '—';
    }
  };

  return (
    <section className="col-16" aria-label="Week navigation">
      <h2 className="card-header-text">Week View</h2>
      <div className="week-scroller">
        <div className="week-cards">
          {weekDays?.map((day) => (
            <div
              key={`${day?.dayName}-${day?.date}`}
              className={`week-day-card${day?.isActive ? ' active' : ''}`}
              onClick={() => day?.date && onDayClick(day.date)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && day?.date) {
                  e.preventDefault();
                  onDayClick(day.date);
                }
              }}
            >
              <div className="day-name">{day?.dayName ?? '—'}</div>
              <div className="day-date">{day?.date ?? '—'}</div>
              <div className="day-score">{getZoneEmoji(day?.zone ?? null)}</div>
              <div
                className={`day-value${day?.zone ? ` zone-${day.zone}` : ''}`}
                style={
                  day?.score === null
                    ? { color: 'rgba(255,255,255,0.3)' }
                    : undefined
                }
              >
                {day?.score ?? '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
