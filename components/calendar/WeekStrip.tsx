'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WeekDay } from '@/lib/hooks/useDateNavigation';

interface WeekStripProps {
  weekDays: WeekDay[];
  onDayClick: (date: string) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  formattedDate: string;
  onOpenCalendar?: () => void;
}

export function WeekStrip({
  weekDays,
  onDayClick,
  onPreviousWeek,
  onNextWeek,
  formattedDate,
  onOpenCalendar,
}: WeekStripProps) {
  return (
    <div className="week-strip-container">
      <div className="week-strip-header">
        <button
          onClick={onOpenCalendar}
          className="current-date-btn"
          aria-label="Open calendar"
        >
          {formattedDate}
        </button>
      </div>

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
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .week-strip-header {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
        }

        .current-date-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 200ms ease;
        }

        .current-date-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--cyan);
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
        }

        .week-day-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 48px;
          padding: 8px 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          cursor: pointer;
          transition: all 200ms ease;
          position: relative;
        }

        .week-day-card:hover {
          background: rgba(255, 255, 255, 0.08);
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
          color: rgba(255, 255, 255, 0.5);
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
          color: #fff;
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

        @media (max-width: 640px) {
          .week-day-card {
            min-width: 40px;
            padding: 6px 8px;
          }

          .day-name {
            font-size: 10px;
          }

          .day-number {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
