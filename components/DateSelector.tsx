import React from 'react';

interface DateSelectorProps {
  currentDate: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
}

export default function DateSelector({
  currentDate,
  onPreviousDay,
  onNextDay
}: DateSelectorProps) {
  // Format date as "Today, Nov 15" or "Mon, Nov 15"
  const formatDate = (date: Date): string => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    const dayName = isToday
      ? 'Today'
      : date.toLocaleDateString('en-US', { weekday: 'short' });

    const monthDay = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return `${dayName}, ${monthDay}`;
  };

  return (
    <section className="col-16" aria-label="Date selector">
      <div className="date-selector">
        <button
          className="date-arrow"
          onClick={onPreviousDay}
          aria-label="Previous day"
        >
          ←
        </button>
        <div className="date-display">{formatDate(currentDate)}</div>
        <button
          className="date-arrow"
          onClick={onNextDay}
          aria-label="Next day"
        >
          →
        </button>
      </div>
    </section>
  );
}
