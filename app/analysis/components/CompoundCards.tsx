// Compound-group card rendering for /analysis — extracted from AnalysisClient.tsx.
//
// Fully self-contained: takes the compound-group hierarchy and per-compound
// values as props/callbacks, has no dependency on AnalysisClient's own state.
// Card → row → expandable-children, built from the compound group hierarchy.
// Every compound in CORE_COMPOUNDS lands in exactly one card except Energy
// and Water, which the Macros section shows.

import { useState } from 'react';
import CompoundTooltip from './CompoundTooltip';

// Group hierarchy from database
export interface GroupHierarchy {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  level: number;
  compoundTypes: string[];
  compoundNames: string[];
  representativeCompound: string | null;
  hasDv: boolean;
  children: GroupHierarchy[];
}

interface CardRow {
  key: string;
  label: string;
  compound: any | null;
  children: CardRow[];
}

interface CardDef {
  title: string;
  /** Root group(s) whose contents fill the card, in display order */
  slugs: string[];
  /** Render these child groups as subheadings instead of rows */
  sections?: { slug: string; heading: string }[];
}

export const ANALYSIS_CARDS: CardDef[] = [
  { title: 'Carbohydrates', slugs: ['carbohydrates'] },
  { title: 'Fats', slugs: ['fats'] },
  {
    title: 'Amino acids',
    slugs: ['proteins'],
    sections: [
      { slug: 'essential-amino-acids', heading: 'Essential' },
      { slug: 'conditionally-essential-amino-acids', heading: 'Conditionally essential' },
      { slug: 'non-essential-amino-acids', heading: 'Non-essential' },
    ],
  },
  { title: 'B vitamins', slugs: ['b-complex-vitamins'] },
  { title: 'Vitamins', slugs: ['vitamin-a', 'vitamin-c', 'vitamin-d', 'vitamin-e', 'vitamin-k', 'choline'] },
  {
    title: 'Minerals',
    slugs: ['minerals'],
    sections: [
      { slug: 'macro-minerals', heading: 'Macro minerals' },
      { slug: 'trace-minerals', heading: 'Trace minerals' },
    ],
  },
  { title: 'Heavy metals', slugs: ['heavy-metals'] },
];

// portionSize is always grams (the nutrition maths reads it); portionType is
// either a bare unit ("g") or a portion description. Never print grams next
// to a description — "118 medium banana" — show what the user actually chose.
const BARE_UNITS = new Set(['g', 'oz', 'cup', 'tbsp', 'ml']);
export function formatPortion(item: { portionSize: number | string; portionType: string }): string {
  const size = Math.round(Number(item.portionSize) * 10) / 10;
  const type = String(item.portionType ?? '').trim();
  if (BARE_UNITS.has(type.toLowerCase())) return `${size} ${type}`;
  // Portion names often carry their own count ("1 slice"), and older rows have
  // the user's quantity glued in front ("1 1 slice", "2 1 slice").
  const doubled = type.match(/^(\d+(?:\.\d+)?)\s+(\d.*)$/);
  if (doubled) return doubled[1] === '1' ? doubled[2] : `${doubled[1]} × ${doubled[2]}`;
  if (/^\d/.test(type)) return type;
  return `${type} · ${size} g`;
}

function findGroup(groups: GroupHierarchy[], slug: string): GroupHierarchy | null {
  for (const g of groups) {
    if (g.slug === slug) return g;
    const hit = findGroup(g.children || [], slug);
    if (hit) return hit;
  }
  return null;
}

function buildCardRows(
  groups: GroupHierarchy[],
  def: CardDef,
  byName: Map<string, any>
): { heading: string | null; rows: CardRow[] }[] {
  const compRow = (c: any): CardRow => ({ key: c.id, label: c.name, compound: c, children: [] });
  const compsOf = (g: GroupHierarchy) =>
    (g.compoundNames || []).map((n) => byName.get(n)).filter(Boolean);

  // A group becomes one expandable row headed by its representative compound;
  // a group with no compounds of its own passes its children up.
  const groupRows = (g: GroupHierarchy): CardRow[] => {
    const comps = compsOf(g);
    const nested = (g.children || []).flatMap(groupRows);
    if (comps.length === 0) return nested;
    const rep = g.representativeCompound ? byName.get(g.representativeCompound) : null;
    if (rep) {
      const children = [...comps.filter((c: any) => c.id !== rep.id).map(compRow), ...nested];
      return [{ key: g.id, label: rep.name, compound: rep, children }];
    }
    return [{ key: g.id, label: g.name, compound: null, children: [...comps.map(compRow), ...nested] }];
  };

  // The root's own compounds are plain rows, representative first.
  const rootRows = (g: GroupHierarchy, skip: Set<string>): CardRow[] => {
    const comps = compsOf(g).sort((a: any, b: any) =>
      a.name === g.representativeCompound ? -1 : b.name === g.representativeCompound ? 1 : 0
    );
    return [
      ...comps.map(compRow),
      ...(g.children || []).filter((c) => !skip.has(c.slug)).flatMap(groupRows),
    ];
  };

  const sectionSlugs = new Set((def.sections || []).map((s) => s.slug));
  const out: { heading: string | null; rows: CardRow[] }[] = [];
  const top: CardRow[] = [];
  for (const slug of def.slugs) {
    const g = findGroup(groups, slug);
    if (g) top.push(...(def.slugs.length > 1 ? groupRows(g) : rootRows(g, sectionSlugs)));
  }
  if (top.length) out.push({ heading: null, rows: top });
  for (const sec of def.sections || []) {
    const g = findGroup(groups, sec.slug);
    if (g) out.push({ heading: sec.heading, rows: rootRows(g, new Set()) });
  }
  return out;
}

/**
 * Splits the cards into two columns of roughly equal height, keeping reading
 * order: each card goes to whichever column is shorter so far. Height is
 * estimated from row counts (not measured), so expanding a row never makes
 * a card jump columns.
 */
export function balanceCards(
  groups: GroupHierarchy[],
  byName: Map<string, any>
): { def: CardDef; index: number }[][] {
  const cols: { def: CardDef; index: number }[][] = [[], []];
  const heights = [0, 0];
  ANALYSIS_CARDS.forEach((def, index) => {
    const sections = buildCardRows(groups, def, byName);
    // title ≈ 2 rows, subheading ≈ 0.6 row, card padding + gap ≈ 1.5 rows
    const h =
      2 + 1.5 +
      sections.reduce((n, sec) => n + sec.rows.length + (sec.heading ? 0.6 : 0), 0);
    const col = heights[0] <= heights[1] ? 0 : 1;
    cols[col].push({ def, index });
    heights[col] += h;
  });
  return cols;
}

/**
 * Progress bar for a single compound DV.
 *
 * Visual model:
 *  - The bar's full width = 100% of RDA target.
 *  - 0–100% intake: a grey→cyan→magenta gradient fill grows left→right.
 *    At 100% the whole bar shows the full gradient.
 *  - When the compound has a UL > target and intake > 100% of target:
 *    a pure-magenta overlay floods in from the right, scaled to
 *    (intake − target) / (UL − target). At UL the entire bar is magenta.
 *  - Missing DV: police-tape inactive style.
 */
function DvBar({
  rdaPercent,
  dailyValue,
}: {
  rdaPercent: number | null;
  dailyValue: { value: number; upperLimit?: number | null } | null;
}) {
  if (!dailyValue) {
    return (
      <div className="dv-bar-wrapper inactive">
        <div className="dv-bar police-tape">
          <span className="no-dv-label-centered">No DV</span>
        </div>
      </div>
    );
  }

  const pct = rdaPercent ?? 0;
  const fillPct = Math.min(100, pct);

  // UL overlay: only when UL exists AND intake exceeds the target.
  const ul = dailyValue.upperLimit;
  const hasUl = ul != null && ul > dailyValue.value;
  let overflowPct = 0;
  if (hasUl && pct > 100) {
    // pct=100 → 0% overlay; intake at UL → 100% overlay.
    // intake/target = pct/100, so intake = (pct/100)*target.
    // overlay fraction = (intake - target) / (ul - target)
    //                  = (pct/100 * target - target) / (ul - target)
    //                  = target*(pct-100)/100 / (ul - target)
    const target = dailyValue.value;
    overflowPct = Math.min(100, ((target * (pct - 100)) / 100 / (ul! - target)) * 100);
  }

  return (
    <div className="dv-bar-wrapper active">
      <div className="dv-bar">
        {/* Veil covers gradient from fillPct% → 100% (the unfilled portion) */}
        <div className="dv-bar-fill" style={{ left: `${fillPct}%` }} />
        {overflowPct > 0 && (
          <div className="dv-bar-overflow" style={{ width: `${overflowPct}%` }} />
        )}
        <span className="dv-percent-label">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

export function AnalysisCard({
  def,
  index,
  groups,
  byName,
  expanded,
  toggle,
  getNutrientValue,
  formatAmount,
  selectedMealIds,
}: {
  def: CardDef;
  index: number;
  groups: GroupHierarchy[];
  byName: Map<string, any>;
  expanded: { [key: string]: boolean };
  toggle: (id: string) => void;
  getNutrientValue: (id: string) => any;
  formatAmount: (amount: number, unit: string) => string;
  selectedMealIds: string[];
}) {
  const sections = buildCardRows(groups, def, byName);
  // Whole-card collapse; open by default. Local state: a card folding shouldn't
  // re-render its siblings, and it doesn't need to survive a reload.
  const [cardOpen, setCardOpen] = useState(true);

  const renderRow = (row: CardRow, child = false) => {
    const data = row.compound ? getNutrientValue(row.compound.id) : null;
    const hasValue = data && data.amount > 0;
    const open = !!expanded[row.key];
    const canOpen = row.children.length > 0;
    return (
      <div key={row.key} className={`ac-item${child ? ' ac-item--child' : ''}`}>
        <div className="ac-row">
          <button
            type="button"
            className="ac-name"
            onClick={() => canOpen && toggle(row.key)}
            disabled={!canOpen}
            aria-expanded={canOpen ? open : undefined}
          >
            {canOpen && <span className={`ac-caret${open ? ' ac-caret--open' : ''}`} aria-hidden="true">›</span>}
            {row.label}
          </button>
          <span className={`ac-value${hasValue ? ' ac-value--filled' : ''}`}>
            {row.compound ? (hasValue ? formatAmount(data.amount, data.unit) : '—') : ''}
          </span>
          <span className="ac-bar">
            {row.compound && (
              <CompoundTooltip compoundId={row.compound.id} compoundName={row.compound.name} mealIds={selectedMealIds}>
                <DvBar rdaPercent={data?.rdaPercent ?? null} dailyValue={data?.dailyValue ?? null} />
              </CompoundTooltip>
            )}
          </span>
        </div>
        {canOpen && open && (
          <div className="ac-children">{row.children.map((c) => renderRow(c, true))}</div>
        )}
      </div>
    );
  };

  return (
    // order: restores the original card order when the columns collapse
    // into one on a phone (see .ac-col in globals.css)
    <div className={`ac-card${cardOpen ? '' : ' ac-card--closed'}`} style={{ order: index }}>
      <h3 className="ac-title">
        <button
          type="button"
          className="ac-title-btn"
          onClick={() => setCardOpen((o) => !o)}
          aria-expanded={cardOpen}
        >
          <span className={`ac-caret${cardOpen ? ' ac-caret--open' : ''}`} aria-hidden="true">›</span>
          {def.title}
        </button>
      </h3>
      {cardOpen && sections.map((sec, i) => (
        <div key={sec.heading ?? i} className="ac-section">
          {sec.heading && <p className="ac-heading">{sec.heading}</p>}
          {sec.rows.map((r) => renderRow(r))}
        </div>
      ))}
    </div>
  );
}
