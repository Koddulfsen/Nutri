'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WeekDay } from '@/lib/hooks/useDateNavigation';

interface WeekStripProps {
  weekDays: WeekDay[];
  onDayClick: (date: string) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  datesWithData?: Set<string>;
}

export function WeekStrip({
  weekDays,
  onDayClick,
  onPreviousWeek,
  onNextWeek,
  datesWithData,
}: WeekStripProps) {
  return (
    <div className="week-strip-container">
      <div className="week-strip">
        <button
          onClick={onPreviousWeek}
          className="week-nav-btn"
          aria-label="Previous week"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="week-days">
          {weekDays.map((day) => (
            <button
              key={day.date}
              onClick={() => onDayClick(day.date)}
              className={`week-day-card ${day.isSelected ? 'selected' : ''} ${day.isToday && !day.isSelected ? 'today' : ''}`}
              aria-label={`${day.dayName} ${day.dayNumber}`}
              aria-pressed={day.isSelected}
            >
              <span className="day-name">{day.dayName}</span>
              <span className="day-number">{day.dayNumber}</span>
              {datesWithData?.has(day.date) && <span className="data-dot" />}
              {day.isToday && <span className="today-dot" />}
            </button>
          ))}
        </div>

        <button
          onClick={onNextWeek}
          className="week-nav-btn"
          aria-label="Next week"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <style jsx>{`
        .week-strip-container {
          padding: 42px 0;
        }

        .week-strip {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
        }

        .week-nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 200ms ease;
          flex-shrink: 0;
        }

        .week-nav-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-color: var(--cyan);
        }

        .week-days {
          display: flex;
          gap: 6px;
          min-width: 0;
          flex: 1;
        }

        .week-day-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1 1 0;
          min-width: 0;
          padding: 8px 10px;
          background: var(--ws-card-bg, rgba(255, 255, 255, 0.03));
          border: 1px solid var(--ws-card-border, rgba(255, 255, 255, 0.1));
          border-radius: 10px;
          cursor: pointer;
          transition: all 200ms ease;
          position: relative;
        }

        .week-day-card:hover {
          background: var(--ws-card-hover, rgba(255, 255, 255, 0.08));
          transform: translateY(-2px);
        }

        .week-day-card.selected {
          background: rgba(34, 211, 238, 0.15);
          border-color: var(--cyan);
          box-shadow: 0 0 12px rgba(34, 211, 238, 0.3);
        }

        .week-day-card.today {
          border-color: var(--magenta);
        }

        .week-day-card.today .today-dot {
          display: block;
        }

        .day-name {
          font-size: 11px;
          color: var(--ws-day-name, rgba(255, 255, 255, 0.5));
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .week-day-card.selected .day-name {
          color: var(--cyan);
        }

        .day-number {
          font-size: 16px;
          font-weight: 600;
          color: var(--ws-day-number, #fff);
          margin-top: 2px;
        }

        .today-dot {
          display: none;
          position: absolute;
          bottom: 4px;
          width: 4px;
          height: 4px;
          background: var(--magenta);
          border-radius: 50%;
        }

        .data-dot {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 5px;
          height: 5px;
          background: var(--accent, #508898);
          border-radius: 50%;
          box-shadow: 0 0 4px rgba(80, 136, 152, 0.6);
        }

        @media (max-width: 640px) {
          .week-day-card {
            padding: 6px 8px;
          }

          .day-name {
            font-size: 10px;
          }

          .day-number {
            font-size: 14px;
          }
        }

        @media (max-width: 500px) {
          .week-strip {
            gap: 4px;
          }
          .week-days {
            gap: 3px;
          }
          .week-day-card {
            padding: 6px 2px;
          }
          .week-nav-btn {
            width: 30px;
            height: 30px;
          }
        }
      `}</style>
    </div>
  );
}
