'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Six macro-visualization shapes, switchable from the gear menu next to
 * "Macros" on /analysis. Trimmed 2026-09-18 from an original 18-style
 * exploration down to just these — the ring-family variants (A-L) and the
 * conic-donut/segmented-dial ones (H/K) didn't make the cut; O covers "ring."
 * Reference gallery (design rationale for each): docs/design/macro-viz-styles.html
 */
export type MacroVizStyle = 'M' | 'N' | 'O' | 'P' | 'Q' | 'R';

export const MACRO_VIZ_STYLES: { id: MacroVizStyle; name: string }[] = [
  { id: 'M', name: 'Horizontal bars' },
  { id: 'N', name: 'Speedometer arcs' },
  { id: 'O', name: 'Macro split ring' },
  { id: 'P', name: 'Vertical bars' },
  { id: 'Q', name: 'Dot stepper' },
  { id: 'R', name: 'Flat tiles' },
];

export const DEFAULT_MACRO_VIZ_STYLE: MacroVizStyle = 'O';
const STORAGE_KEY = 'nutri.macroVizStyle.v2';

export function loadMacroVizStyle(): MacroVizStyle {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && MACRO_VIZ_STYLES.some(s => s.id === v)) return v as MacroVizStyle;
  } catch { /* private mode / blocked storage — fall through to default */ }
  return DEFAULT_MACRO_VIZ_STYLE;
}

export function saveMacroVizStyle(style: MacroVizStyle) {
  try { localStorage.setItem(STORAGE_KEY, style); } catch { /* best-effort only */ }
}

export interface MacroSlice {
  label: string;
  value: number | null;
  goal: number;
  unit: string;
}

const RING_COLORS = ['var(--ring-1)', 'var(--ring-2)', 'var(--ring-3)'];
/** Soft pink-tinted track — the site's brown `--border` reads muddy against
    a white card; a low-opacity coral tint matches the reference gallery. */
const TRACK = 'rgba(212, 42, 85, 0.10)';
const LABEL_CSS = `
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: rgba(46, 26, 14, 0.45);
`;

function pctOf(m: MacroSlice) {
  return m.value != null && m.goal > 0 ? Math.min(m.value / m.goal, 1) : 0;
}
function fmt(m: MacroSlice) {
  return m.value != null ? Math.round(m.value) : '--';
}

/* ═══ Gear menu ═══ */
export function MacroVizPicker({ style, onChange }: { style: MacroVizStyle; onChange: (s: MacroVizStyle) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="mv-picker" ref={ref}>
      <button
        type="button"
        className="mv-gear"
        aria-label="Choose macro visualization style"
        onClick={() => setOpen(o => !o)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
      {open && (
        <div className="mv-menu">
          {MACRO_VIZ_STYLES.map(s => (
            <button
              key={s.id}
              type="button"
              className={`mv-menu-item${s.id === style ? ' sel' : ''}`}
              onClick={() => { onChange(s.id); saveMacroVizStyle(s.id); setOpen(false); }}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <style jsx>{`
        .mv-picker { position: relative; }
        .mv-gear {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          box-shadow: none;
          color: rgba(46, 26, 14, 0.4);
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .mv-gear:hover { color: #2e1a0e; }
        .mv-menu {
          position: absolute;
          top: 38px;
          right: 0;
          z-index: 20;
          width: 190px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 34px rgba(46, 26, 14, 0.18);
          padding: 8px;
        }
        .mv-menu-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 8px 10px;
          border: none;
          background: none;
          border-radius: 6px;
          font-family: var(--font-body);
          font-size: 13.5px;
          color: #2e1a0e;
          cursor: pointer;
        }
        .mv-menu-item:hover { background: rgba(212, 42, 85, 0.06); }
        .mv-menu-item.sel { background: var(--ring-1); color: #ffffff; }
      `}</style>
    </div>
  );
}

/* ═══ M — horizontal bars ═══ */
function BarRows({ macros }: { macros: MacroSlice[] }) {
  return (
    <div className="mv-bars">
      {macros.map((m, i) => (
        <div key={m.label} className="mv-bar-row">
          <span className="mv-bar-label">{m.label}</span>
          <div className="mv-bar-track">
            <div
              className="mv-bar-fill"
              style={{
                width: `${Math.max(pctOf(m) * 100, 3)}%`,
                background: `linear-gradient(90deg, color-mix(in srgb, ${RING_COLORS[i % 3]} 25%, #ffffff), ${RING_COLORS[i % 3]})`,
              }}
            />
          </div>
          <span className="mv-bar-val">{fmt(m)}{m.unit}</span>
        </div>
      ))}
      <style jsx>{`
        .mv-bars { display: flex; flex-direction: column; gap: 22px; width: 100%; }
        .mv-bar-row { display: flex; align-items: center; gap: 16px; }
        .mv-bar-label { ${LABEL_CSS} width: 64px; flex-shrink: 0; }
        .mv-bar-track { flex: 1; height: 14px; background: ${TRACK}; border-radius: 999px; overflow: hidden; }
        .mv-bar-fill { height: 100%; border-radius: 999px; }
        .mv-bar-val { font-family: var(--font-body); font-weight: 500; font-size: 15px; color: #2e1a0e; width: 56px; text-align: right; flex-shrink: 0; }
      `}</style>
    </div>
  );
}

/* ═══ N — speedometer arcs ═══ */
function GaugeArcs({ macros }: { macros: MacroSlice[] }) {
  const PATH = 'M9 62 A45 45 0 0 1 99 62';
  const LEN = 141.5;
  return (
    <div className="mv-gauges">
      {macros.map((m, i) => {
        const gradId = `mv-gauge-${m.label}`.replace(/\s+/g, '-');
        return (
          <div key={m.label} className="mv-gauge-item">
            <div className="mv-gauge">
              <svg viewBox="0 0 108 66">
                <defs>
                  <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="color-mix(in srgb, var(--ring-1) 25%, #ffffff)" />
                    <stop offset="100%" stopColor={RING_COLORS[i % 3]} />
                  </linearGradient>
                </defs>
                <path d={PATH} fill="none" stroke={TRACK} strokeWidth="9" strokeLinecap="round" />
                <path d={PATH} fill="none" stroke={`url(#${gradId})`} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${Math.max(pctOf(m) * LEN, 4)} ${LEN}`} />
              </svg>
              <span className="mv-gauge-num">{fmt(m)}<span className="mv-gauge-unit">{m.unit}</span></span>
            </div>
            <p className="mv-gauge-label">{m.label}</p>
          </div>
        );
      })}
      <style jsx>{`
        .mv-gauges { display: flex; justify-content: space-around; gap: 12px; width: 100%; }
        .mv-gauge-item { display: flex; flex-direction: column; align-items: center; }
        .mv-gauge { position: relative; width: 108px; height: 66px; }
        .mv-gauge svg { position: absolute; inset: 0; }
        .mv-gauge-num { position: absolute; bottom: 2px; left: 0; right: 0; text-align: center; font-family: var(--font-display); font-size: 26px; line-height: 1; color: #2e1a0e; }
        .mv-gauge-unit { font-family: var(--font-mono); font-size: 13px; color: rgba(46, 26, 14, 0.45); margin-left: 2px; }
        .mv-gauge-label { ${LABEL_CSS} margin: 6px 0 0; }
      `}</style>
    </div>
  );
}

/* ═══ O — one ring, macro composition (default) ═══ */
function SplitRing({ macros, kcal }: { macros: MacroSlice[]; kcal: number | null }) {
  const r = 82;
  const C = 2 * Math.PI * r;
  const gap = macros.length > 1 ? 6 : 0; // px gap between segments
  const totalG = macros.reduce((s, m) => s + (m.value ?? 0), 0) || 1;
  let offset = 0;
  const arcs = macros.map((m, i) => {
    const share = (m.value ?? 0) / totalG;
    const len = Math.max(share * C - gap, 0);
    const arc = { len, offset, color: RING_COLORS[i % 3] };
    offset += share * C;
    return arc;
  });
  return (
    <div className="mv-split">
      <div className="mv-split-ring">
        <svg viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="100" cy="100" r={r} fill="none" stroke={TRACK} strokeWidth="20" />
          {arcs.map((a, i) => (
            <circle
              key={macros[i].label}
              cx="100" cy="100" r={r} fill="none"
              stroke={a.color} strokeWidth="20"
              strokeDasharray={`${a.len} ${C}`}
              strokeDashoffset={-a.offset}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="mv-split-center">
          <span className="mv-split-kcal">{kcal ?? '--'}</span>
          <span className="mv-split-kcal-label">kcal</span>
        </div>
      </div>
      <div className="mv-split-legend">
        {macros.map((m, i) => (
          <div key={m.label} className="mv-split-legend-item">
            <span className="mv-split-dot" style={{ background: RING_COLORS[i % 3] }} />
            <span className="mv-split-legend-label">{m.label}</span>
            <span className="mv-split-legend-val">{fmt(m)}{m.unit}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .mv-split { text-align: center; }
        .mv-split-ring { position: relative; width: 200px; height: 200px; margin: 0 auto; }
        .mv-split-ring svg { position: absolute; inset: 0; }
        .mv-split-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .mv-split-kcal { font-family: var(--font-display); font-size: 46px; line-height: 1; color: #2e1a0e; }
        .mv-split-kcal-label { ${LABEL_CSS} margin-top: 4px; }
        .mv-split-legend { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px 26px; margin-top: 24px; }
        .mv-split-legend-item { display: flex; align-items: center; gap: 7px; font-family: var(--font-body); font-size: 13.5px; color: rgba(46, 26, 14, 0.65); }
        .mv-split-legend-label { text-transform: uppercase; letter-spacing: 0.04em; font-size: 12px; color: rgba(46, 26, 14, 0.5); }
        .mv-split-legend-val { font-weight: 500; color: #2e1a0e; }
        .mv-split-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
      `}</style>
    </div>
  );
}

/* ═══ P — vertical bars ═══ */
function VBars({ macros }: { macros: MacroSlice[] }) {
  return (
    <div className="mv-vbars">
      {macros.map((m, i) => (
        <div key={m.label} className="mv-vbar-item">
          <div className="mv-vbar-track">
            <div
              className="mv-vbar-fill"
              style={{
                height: `${Math.max(pctOf(m) * 100, 6)}%`,
                background: `linear-gradient(180deg, ${RING_COLORS[i % 3]}, color-mix(in srgb, ${RING_COLORS[i % 3]} 30%, #ffffff))`,
              }}
            />
          </div>
          <span className="mv-vbar-val">{fmt(m)}{m.unit}</span>
          <p className="mv-vbar-label">{m.label}</p>
        </div>
      ))}
      <style jsx>{`
        .mv-vbars { display: flex; justify-content: space-around; align-items: flex-end; height: 168px; gap: 28px; width: 100%; }
        .mv-vbar-item { display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
        .mv-vbar-track { width: 36px; height: 130px; background: ${TRACK}; border-radius: 999px; display: flex; align-items: flex-end; overflow: hidden; }
        .mv-vbar-fill { width: 100%; border-radius: 999px; }
        .mv-vbar-val { font-family: var(--font-body); font-weight: 500; font-size: 14px; margin-top: 10px; color: #2e1a0e; }
        .mv-vbar-label { ${LABEL_CSS} margin: 2px 0 0; }
      `}</style>
    </div>
  );
}

/* ═══ Q — dot stepper ═══ */
function DotStepper({ macros }: { macros: MacroSlice[] }) {
  const N = 10;
  return (
    <div className="mv-dots-wrap">
      {macros.map((m, i) => {
        const lit = Math.round(pctOf(m) * N);
        return (
          <div key={m.label} className="mv-dot-row">
            <span className="mv-dot-label">{m.label}</span>
            <div className="mv-dots">
              {Array.from({ length: N }, (_, d) => (
                <span key={d} className="mv-dot" style={d < lit ? { background: RING_COLORS[i % 3] } : undefined} />
              ))}
            </div>
            <span className="mv-dot-val">{fmt(m)}{m.unit}</span>
          </div>
        );
      })}
      <style jsx>{`
        .mv-dots-wrap { display: flex; flex-direction: column; gap: 22px; width: 100%; }
        .mv-dot-row { display: flex; align-items: center; gap: 14px; }
        .mv-dot-label { ${LABEL_CSS} width: 64px; flex-shrink: 0; }
        .mv-dots { display: flex; gap: 6px; flex: 1; }
        .mv-dot { width: 10px; height: 10px; border-radius: 50%; background: ${TRACK}; flex-shrink: 0; }
        .mv-dot-val { font-family: var(--font-body); font-weight: 500; font-size: 15px; color: #2e1a0e; width: 56px; text-align: right; flex-shrink: 0; }
      `}</style>
    </div>
  );
}

/* ═══ R — flat tiles ═══ */
function FlatTiles({ macros }: { macros: MacroSlice[] }) {
  return (
    <div className="mv-tiles">
      {macros.map((m, i) => (
        <div key={m.label} className="mv-tile">
          <div className="mv-tile-num">{fmt(m)}<span className="mv-tile-unit">{m.unit}</span></div>
          <p className="mv-tile-label">{m.label}</p>
          <div className="mv-tile-bar"><div className="mv-tile-bar-fill" style={{ width: `${Math.max(pctOf(m) * 100, 4)}%`, background: RING_COLORS[i % 3] }} /></div>
        </div>
      ))}
      <style jsx>{`
        .mv-tiles { display: flex; gap: 16px; width: 100%; }
        .mv-tile {
          flex: 1;
          background: #ffffff;
          border: 1px solid rgba(46, 26, 14, 0.07);
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(46, 26, 14, 0.08);
          padding: 20px 18px 16px;
          text-align: center;
        }
        .mv-tile-num { font-family: var(--font-display); font-size: 32px; line-height: 1; color: #2e1a0e; }
        .mv-tile-unit { font-family: var(--font-mono); font-size: 14px; color: rgba(46, 26, 14, 0.45); margin-left: 2px; }
        .mv-tile-label { ${LABEL_CSS} margin: 8px 0 12px; }
        .mv-tile-bar { height: 3px; border-radius: 3px; background: ${TRACK}; overflow: hidden; }
        .mv-tile-bar-fill { height: 100%; border-radius: 3px; }
      `}</style>
    </div>
  );
}

/* ═══ Dispatcher ═══ */
export default function MacroViz({ style, macros, kcal }: { style: MacroVizStyle; macros: MacroSlice[]; kcal: number | null }) {
  switch (style) {
    case 'M': return <BarRows macros={macros} />;
    case 'N': return <GaugeArcs macros={macros} />;
    case 'P': return <VBars macros={macros} />;
    case 'Q': return <DotStepper macros={macros} />;
    case 'R': return <FlatTiles macros={macros} />;
    case 'O':
    default:
      return <SplitRing macros={macros} kcal={kcal} />;
  }
}
