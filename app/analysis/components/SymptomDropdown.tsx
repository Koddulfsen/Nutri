'use client';

import { useState, useRef, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import { apiUrl } from '@/lib/utils/base-path';

interface SymptomDefinition {
  id: string;
  name: string;
  slug: string;
  category: 'ENERGY_MENTAL' | 'DIGESTIVE' | 'PHYSICAL';
  description: string | null;
  icon: string | null;
  isSystemDefined?: boolean;
  userId?: string | null;
}

interface SymptomLog {
  id: string;
  symptomDefinitionId: string;
  date: string;
  intensity: number;
  notes: string | null;
  loggedAt: string;
  symptomDefinition: SymptomDefinition;
}

interface SymptomDropdownProps {
  date: string;
  symptoms: SymptomLog[];
  definitions: SymptomDefinition[];
  loading?: boolean;
  onRefresh: () => void;
  onRefreshDefinitions: () => void;
}

// The 3 system defaults — always shown first
const DEFAULT_SLUGS = ['energy-level', 'sleep-quality', 'digestion'];

export default function SymptomDropdown({
  date,
  symptoms,
  definitions,
  onRefresh,
  onRefreshDefinitions,
}: SymptomDropdownProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setAdding(false);
        setNewName('');
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  // Build the ordered list: system defaults first, then user customs
  const defaultItems = DEFAULT_SLUGS
    .map(slug => definitions.find(d => d.slug === slug))
    .filter(Boolean) as SymptomDefinition[];

  const customItems = definitions.filter(d => !d.isSystemDefined && d.userId);

  const items = [...defaultItems, ...customItems];

  const getLog = (definitionId: string) =>
    symptoms.find(s => s.symptomDefinitionId === definitionId);

  const handleDotClick = async (def: SymptomDefinition, dotValue: number) => {
    const existing = getLog(def.id);
    setSaving(def.id);
    try {
      if (!existing) {
        await fetch(apiUrl('/api/symptoms'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptomDefinitionId: def.id, intensity: dotValue, notes: '', date }),
        });
      } else if (existing.intensity === dotValue) {
        await fetch(apiUrl(`/api/symptoms/${existing.id}`), { method: 'DELETE' });
      } else {
        await fetch(apiUrl(`/api/symptoms/${existing.id}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intensity: dotValue }),
        });
      }
      onRefresh();
    } finally {
      setSaving(null);
    }
  };

  const handleRemove = async (def: SymptomDefinition) => {
    setSaving(def.id);
    try {
      await fetch(apiUrl(`/api/symptom-definitions/${def.id}`), { method: 'DELETE' });
      onRefreshDefinitions();
    } finally {
      setSaving(null);
    }
  };

  const handleAddCustom = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving('new');
    try {
      await fetch(apiUrl('/api/symptom-definitions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category: 'ENERGY_MENTAL' }),
      });
      setNewName('');
      setAdding(false);
      onRefreshDefinitions();
    } finally {
      setSaving(null);
    }
  };

  const loggedCount = items.filter(def => getLog(def.id)).length;

  return (
    <div className="wellness-container" ref={containerRef}>
      {/* Header */}
      <button
        className={`wellness-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg
          className={`chevron ${isOpen ? 'open' : ''}`}
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        <span className="trigger-row">
          <ClipboardList size={14} strokeWidth={1.5} />
          Wellness Log
          {loggedCount > 0 && <span className="badge">{loggedCount}</span>}
        </span>
      </button>

      {/* Panel */}
      <div className={`wellness-panel ${isOpen ? 'open' : ''}`}>
        {items.map((def) => {
          const log = getLog(def.id);
          const current = log?.intensity ?? 0;
          const isSaving = saving === def.id;
          const isCustom = !def.isSystemDefined;

          return (
            <div key={def.id} className={`wellness-row ${log ? 'logged' : ''}`}>
              <span className="row-label">{def.name}</span>
              <div className="row-right">
                <div className="dots">
                  {[1, 2, 3, 4, 5].map((dot) => (
                    <button
                      key={dot}
                      className={`dot ${dot <= current ? 'filled' : ''}`}
                      onClick={() => handleDotClick(def, dot)}
                      disabled={isSaving}
                      aria-label={`${def.name} ${dot}/5`}
                    />
                  ))}
                </div>
                {isCustom && (
                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(def)}
                    disabled={isSaving}
                    title="Remove tracker"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add custom */}
        {adding ? (
          <div className="add-row">
            <input
              ref={inputRef}
              className="add-input"
              placeholder="Tracker name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddCustom();
                if (e.key === 'Escape') { setAdding(false); setNewName(''); }
              }}
            />
            <button
              className="add-confirm"
              onClick={handleAddCustom}
              disabled={saving === 'new' || !newName.trim()}
            >
              {saving === 'new' ? '…' : 'Add'}
            </button>
          </div>
        ) : (
          <button className="wellness-add-btn" onClick={() => { setIsOpen(true); setAdding(true); }}>
            +
          </button>
        )}
      </div>

      <style jsx>{`
        .wellness-container {
          border-top: 4px solid var(--border, #1e1e24);
          flex-shrink: 0;
        }

        .wellness-trigger {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          width: 100%;
          padding: 12px 20px;
          background: none;
          border: none;
          color: var(--text-3, #484860);
          cursor: pointer;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: color 150ms ease;
        }

        .wellness-trigger:hover { color: var(--text-2, #8080a0); }
        .wellness-trigger.open { color: var(--accent, #508898); }

        .chevron {
          opacity: 0.4;
          transform: rotate(180deg);
          transition: transform 0.25s ease, opacity 0.25s ease;
          flex-shrink: 0;
        }

        .chevron.open { transform: rotate(0deg); opacity: 0.7; }

        .trigger-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .trigger-row svg { opacity: 0.6; flex-shrink: 0; }

        .badge {
          margin-left: auto;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          background: var(--accent, #508898);
          border-radius: 8px;
          font-size: 9px;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono, 'DM Mono', monospace);
        }

        /* Panel */
        .wellness-panel {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .wellness-panel.open {
          max-height: 400px;
          overflow-y: auto;
          scrollbar-gutter: stable;
        }

        /* Rows */
        .wellness-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 20px;
        }

        .row-label {
          flex-shrink: 0;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 13px;
          font-weight: 400;
          color: var(--text-3, #484860);
          transition: color 0.15s ease;
        }

        .wellness-row.logged .row-label { color: var(--text-2, #8080a0); }

        .row-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Dots */
        .dots {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid var(--border, #1e1e24);
          background: transparent;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
          transition: background 0.12s ease, border-color 0.12s ease, transform 0.1s ease;
        }

        .dot:hover:not(:disabled) {
          border-color: var(--text-3, #484860);
          transform: scale(1.2);
        }

        .dot.filled {
          background: var(--accent, #508898);
          border-color: var(--accent, #508898);
        }

        .dot.filled:hover:not(:disabled) {
          background: var(--accent-dark, #306070);
          border-color: var(--accent-dark, #306070);
        }

        .dot:disabled { cursor: default; opacity: 0.5; }

        /* Remove button */
        .remove-btn {
          width: 16px;
          height: 16px;
          background: none;
          border: none;
          color: var(--text-3, #484860);
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s ease, color 0.15s ease;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wellness-row:hover .remove-btn { opacity: 0.5; }
        .remove-btn:hover { opacity: 1 !important; color: var(--text-1, #e8e8f4); }
        .remove-btn:disabled { cursor: default; }

        /* Add tracker */
        .wellness-add-btn {
          width: 100%;
          padding: 8px 20px;
          background: none;
          border: none;
          outline: none;
          color: var(--text-3, #484860);
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 18px;
          text-align: center;
          cursor: pointer;
          transition: color 0.15s ease;
          line-height: 1;
        }

        .wellness-add-btn:hover { color: var(--text-2, #8080a0); }

        .add-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 20px 10px;
        }

        .add-input {
          flex: 1;
          padding: 5px 8px;
          background: var(--surface, #0e0e12);
          border: 1px solid var(--border, #1e1e24);
          border-radius: 3px;
          color: var(--text-1, #e8e8f4);
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 12px;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .add-input:focus { border-color: var(--accent, #508898); }
        .add-input::placeholder { color: var(--text-3, #484860); }

        .add-confirm {
          padding: 5px 10px;
          background: var(--accent, #508898);
          border: none;
          border-radius: 3px;
          color: #fff;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }

        .add-confirm:hover:not(:disabled) { opacity: 0.85; }
        .add-confirm:disabled { opacity: 0.4; cursor: default; }
      `}</style>
    </div>
  );
}
