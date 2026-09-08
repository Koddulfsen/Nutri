'use client';

import { useState, useRef, useEffect } from 'react';

// Source preference options
const SOURCE_OPTIONS = [
  { value: 'AVERAGE', label: 'Average (all sources)', description: 'Mean of all regional values' },
  { value: 'USA_CANADA', label: 'USA/Canada (NIH)', description: 'National Institutes of Health DRIs' },
  { value: 'EU', label: 'European Union (EFSA)', description: 'European Food Safety Authority PRIs' },
  { value: 'UK', label: 'United Kingdom (SACN)', description: 'Scientific Advisory Committee on Nutrition' },
  { value: 'JAPAN', label: 'Japan (MHLW)', description: 'Ministry of Health, Labour and Welfare' },
  { value: 'CHINA', label: 'China (CNS)', description: 'Chinese Nutrition Society DRIs' },
  { value: 'AU_NZ', label: 'Australia/NZ (NHMRC)', description: 'National Health and Medical Research Council' },
] as const;

type SourcePreference = typeof SOURCE_OPTIONS[number]['value'];

interface DvSourceSelectorProps {
  currentSource: SourcePreference;
  onSourceChange: (source: SourcePreference) => void;
  isLoading?: boolean;
  compact?: boolean;
}

export default function DvSourceSelector({
  currentSource,
  onSourceChange,
  isLoading = false,
  compact = false,
}: DvSourceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current source label for tooltip
  const currentLabel = SOURCE_OPTIONS.find((opt) => opt.value === currentSource)?.label || 'Average';

  return (
    <div className={`dv-source-selector ${compact ? 'compact' : ''}`} ref={dropdownRef}>
      <button
        className={`selector-button ${isOpen ? 'active' : ''} ${compact ? 'compact' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        title={`Daily Value Source: ${currentLabel}`}
        aria-label={`Daily Value Source: ${currentLabel}. Click to change.`}
        aria-expanded={isOpen}
      >
        <svg
          className={`cogwheel-icon ${isLoading ? 'spinning' : ''} ${compact ? 'compact' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 15a3 3 0 100-6 3 3 0 000 6z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">Daily Value Source</div>
          <div className="dropdown-options">
            {SOURCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`option-item ${currentSource === option.value ? 'selected' : ''}`}
                onClick={() => {
                  onSourceChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="option-radio">
                  {currentSource === option.value && (
                    <span className="radio-dot" />
                  )}
                </span>
                <div className="option-content">
                  <span className="option-label">{option.label}</span>
                  <span className="option-description">{option.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .dv-source-selector {
          position: relative;
          display: inline-block;
        }

        .selector-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s;
        }

        .selector-button.compact {
          width: 28px;
          height: 28px;
          border-radius: 6px;
        }

        .cogwheel-icon.compact {
          width: 16px;
          height: 16px;
        }

        .selector-button:hover {
          background: rgba(255, 255, 255, 0.85);
          border-color: var(--coral, #d42a55);
          color: var(--coral, #d42a55);
        }

        .selector-button.active {
          background: rgba(212, 42, 85, 0.10);
          border-color: var(--coral, #d42a55);
          color: var(--coral, #d42a55);
        }

        .selector-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cogwheel-icon {
          width: 20px;
          height: 20px;
          transition: transform 0.3s ease;
        }

        .cogwheel-icon.spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 280px;
          background: #fff7f4;
          color: #2e1a0e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 8px 28px rgba(46, 26, 14, 0.22);
          z-index: 1000;
          overflow: hidden;
        }

        .dropdown-header {
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .dropdown-options {
          padding: 8px;
        }

        .option-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }

        .option-item:hover {
          background: rgba(255, 255, 255, 0.55);
        }

        .option-item.selected {
          background: rgba(212, 42, 85, 0.10);
        }

        .option-radio {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .option-item.selected .option-radio {
          border-color: var(--coral, #d42a55);
        }

        .radio-dot {
          width: 10px;
          height: 10px;
          background: var(--coral, #d42a55);
          border-radius: 50%;
        }

        .option-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .option-label {
          font-size: 14px;
          color: #fff;
          font-weight: 500;
        }

        .option-item.selected .option-label {
          color: var(--coral, #d42a55);
        }

        .option-description {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
