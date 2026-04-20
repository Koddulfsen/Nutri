'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, parseISO, addMonths, subMonths } from 'date-fns';
import { CalendarGrid } from './CalendarGrid';

interface CalendarPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onGoToToday: () => void;
}

export function CalendarPopup({
  isOpen,
  onClose,
  selectedDate,
  onDateSelect,
  onGoToToday,
}: CalendarPopupProps) {
  const [viewMonth, setViewMonth] = useState(() => parseISO(selectedDate));
  const overlayRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setViewMonth(parseISO(selectedDate));
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  const handleDateSelect = useCallback(
    (date: string) => {
      onDateSelect(date);
      onClose();
    },
    [onDateSelect, onClose]
  );

  const handleTodayClick = useCallback(() => {
    onGoToToday();
    onClose();
  }, [onGoToToday, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="calendar-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Date picker"
    >
      <div ref={popupRef} className="calendar-popup">
        <div className="popup-header">
          <button
            onClick={() => setViewMonth(subMonths(viewMonth, 1))}
            className="month-nav-btn"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="month-label">{format(viewMonth, 'MMMM yyyy')}</span>

          <button
            onClick={() => setViewMonth(addMonths(viewMonth, 1))}
            className="month-nav-btn"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>

          <button
            onClick={onClose}
            className="close-btn"
            aria-label="Close calendar"
          >
            <X size={18} />
          </button>
        </div>

        <CalendarGrid
          month={viewMonth}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />

        <div className="popup-footer">
          <button onClick={handleTodayClick} className="today-btn">
            Today
          </button>
        </div>
      </div>

      <style jsx>{`
        .calendar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: fadeIn 150ms ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .calendar-popup {
          background: rgba(20, 20, 20, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 20px;
          width: 320px;
          max-width: 90vw;
          animation: slideUp 200ms ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .popup-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .month-label {
          flex: 1;
          text-align: center;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }

        .month-nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .month-nav-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 150ms ease;
          margin-left: 8px;
        }

        .close-btn:hover {
          color: #fff;
        }

        .popup-footer {
          display: flex;
          justify-content: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .today-btn {
          background: rgba(34, 211, 238, 0.15);
          border: 1px solid var(--cyan);
          color: var(--cyan);
          padding: 8px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .today-btn:hover {
          background: rgba(34, 211, 238, 0.25);
        }
      `}</style>
    </div>
  );
}
