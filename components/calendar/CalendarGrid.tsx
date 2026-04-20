'use client';

import { useMemo } from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday as checkIsToday,
} from 'date-fns';

interface CalendarGridProps {
  month: Date;
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarGrid({
  month,
  selectedDate,
  onDateSelect,
}: CalendarGridProps) {
  const selectedDateObj = useMemo(() => parseISO(selectedDate), [selectedDate]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [month]);

  return (
    <div className="calendar-grid">
      <div className="calendar-header">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="weekday-label">
            {label}
          </div>
        ))}
      </div>

      <div className="calendar-body">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = isSameDay(day, selectedDateObj);
          const isCurrentMonth = isSameMonth(day, month);
          const isToday = checkIsToday(day);

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
              className={`calendar-day ${isSelected ? 'selected' : ''} ${!isCurrentMonth ? 'outside-month' : ''} ${isToday ? 'today' : ''}`}
              aria-label={format(day, 'EEEE, MMMM d, yyyy')}
              aria-pressed={isSelected}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .calendar-grid { width: 100%; }

        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 4px;
        }

        .weekday-label {
          text-align: center;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 9px;
          font-weight: 500;
          color: var(--text-3, #686048);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 2px 0;
        }

        .calendar-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 11px;
          font-weight: 400;
          color: var(--text-2, #9A8E6E);
          background: transparent;
          border: 1px solid transparent;
          border-radius: 3px;
          cursor: pointer;
          transition: background 150ms ease, color 150ms ease;
        }

        .calendar-day:hover {
          background: var(--bg-accent, #181610);
          color: var(--text-1, #E0D4B8);
        }

        .calendar-day.outside-month {
          color: var(--text-3, #686048);
          opacity: 0.5;
        }

        .calendar-day.today {
          border-color: var(--border, #262218);
          color: var(--accent-text, #E8B880);
        }

        .calendar-day.selected {
          background: var(--accent, #D4A468);
          color: var(--bg, #0A0A06);
          border-color: transparent;
        }

        .calendar-day.selected:hover {
          background: var(--accent-text, #E8B880);
        }
      `}</style>
    </div>
  );
}
