'use client';

interface PageHeaderProps {
  date: Date;
  onBack: () => void;
}

export default function PageHeader({ date, onBack }: PageHeaderProps) {
  const formatDate = (d: Date) => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    const month = months[d?.getMonth()] ?? 'Jan';
    const day = d?.getDate() ?? 1;
    const year = d?.getFullYear() ?? 2025;
    return `${month} ${day}, ${year}`;
  };

  return (
    <header className="page-header">
      <button className="back-btn" aria-label="Back to timeline" onClick={onBack}>
        ← Back to Timeline
      </button>
      <h1 className="page-title">Daily Totals: {formatDate(date)}</h1>
    </header>
  );
}
