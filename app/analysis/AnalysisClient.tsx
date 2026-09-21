'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { User } from '@supabase/supabase-js';
import { apiUrl } from '@/lib/utils/base-path';
import AnalysisHeader from '@/app/components/navigation/AnalysisHeader';
import GuestAnalysisView from './GuestAnalysisView';
import SmartAddFoodModal from '@/app/components/modals/SmartAddFoodModal';
import FoodLogChat from './FoodLogChat';
import DvSourceSelector from './components/DvSourceSelector';
import SymptomDropdown from './components/SymptomDropdown';
import CompoundTooltip from './components/CompoundTooltip';
import { useDateNavigation } from '@/lib/hooks/useDateNavigation';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { WeekStrip } from '@/components/calendar';
import {
  assemblePayload,
  computeCompoundValues,
  portionGrams as portionGramsOf,
  type FoodVector,
} from '@/lib/nutrition/totals';
import { unpackVectors } from '@/lib/nutrition/wire';
import MacroViz, { MacroVizPicker, loadMacroVizStyle, type MacroVizStyle, type MacroSlice } from './MacroViz';

type SourcePreference = 'AVERAGE' | 'USA_CANADA' | 'EU' | 'UK' | 'JAPAN' | 'CHINA' | 'AU_NZ';

// Symptom types
type SymptomCategory = 'ENERGY_MENTAL' | 'DIGESTIVE' | 'PHYSICAL';

interface SymptomDefinition {
  id: string;
  name: string;
  slug: string;
  category: SymptomCategory;
  description: string | null;
  icon: string | null;
  isSystemDefined?: boolean;
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

// Group hierarchy from database
interface GroupHierarchy {
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

interface AnalysisClientProps {
  user: User | null;
  initialDate: string;
  initialCompounds: any[];
  initialCompoundGroups: GroupHierarchy[];
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

// ── Analysis cards ──
// Flat cards (card → row → expandable children) built from the compound
// group hierarchy. Every compound in CORE_COMPOUNDS lands in exactly one card
// except Energy and Water, which the Macros section shows.

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

const ANALYSIS_CARDS: CardDef[] = [
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
function formatPortion(item: { portionSize: number | string; portionType: string }): string {
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
function balanceCards(
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

function AnalysisCard({
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
    <div className="ac-card" style={{ order: index }}>
      <h3 className="ac-title">{def.title}</h3>
      {sections.map((sec, i) => (
        <div key={sec.heading ?? i} className="ac-section">
          {sec.heading && <p className="ac-heading">{sec.heading}</p>}
          {sec.rows.map((r) => renderRow(r))}
        </div>
      ))}
    </div>
  );
}

// One change POST /api/meals/sync can apply before returning the day's state.
type SyncChange =
  | { type: 'add'; mealId: string | null; food: { foodId: string; portionSize: number; portionType: string } }
  | { type: 'remove'; mealItemId: string };

export default function AnalysisClient({ user, initialDate, initialCompounds, initialCompoundGroups }: AnalysisClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const dropdownPortalRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [allCompounds, setAllCompounds] = useState<any[]>(initialCompounds);
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});
  const [activeTab, setActiveTab] = useState<string>(''); // Empty until meals load

  // Food search state
  // Whole-catalog client-side search: fetched once (any tab, so it's ready
  // the moment Manual search is opened), then every keystroke filters it in
  // memory — no request, no debounce. See app/api/foods/catalog/route.ts;
  // revisit this approach if the catalog grows past a few thousand foods.
  const [foodCatalog, setFoodCatalog] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  // Surfaces add/remove-meal-item failures, shown under the add-row.
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Selected food state (for preview before adding to meal)
  const [selectedFood, setSelectedFood] = useState<any | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState('100');
  const [selectedUnit, setSelectedUnit] = useState('g');
  const [foodPortions, setFoodPortions] = useState<Array<{ id: string; description: string; gramWeight: number; isDefault: boolean }>>([]);

  // Date navigation (URL-synced)
  const {
    selectedDate,
    goToDate,
    goToPreviousWeek,
    goToNextWeek,
    weekDays,
  } = useDateNavigation({ initialDate });

  // Center column tab — AI chat vs manual food search
  const [centerTab, setCenterTab] = useState<'chat' | 'search'>('chat');

  // Day strip scroll offset (independent of selected date)
  const [dayStripOffset, setDayStripOffset] = useState(0);
  const [macroVizStyle, setMacroVizStyle] = useState<MacroVizStyle>('O');
  useEffect(() => { setMacroVizStyle(loadMacroVizStyle()); }, []);

  // Inline calendar
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate + 'T12:00:00'));

  // Dates that have food data (for dot indicators)
  const [datesWithData, setDatesWithData] = useState<Set<string>>(new Set());

  // Fetch dates with food OR wellness data for a range
  const fetchDatesWithData = async (from: string, to: string) => {
    try {
      const [mealsRes, symptomsRes] = await Promise.all([
        fetch(apiUrl(`/api/meals/dates?from=${from}&to=${to}`)),
        fetch(apiUrl(`/api/symptoms/dates?from=${from}&to=${to}`)),
      ]);
      const mealDates = mealsRes.ok ? ((await mealsRes.json()).dates as string[]) : [];
      const symptomDates = symptomsRes.ok ? ((await symptomsRes.json()).dates as string[]) : [];
      setDatesWithData(prev => {
        const next = new Set(prev);
        mealDates.forEach(d => next.add(d));
        symptomDates.forEach(d => next.add(d));
        return next;
      });
    } catch {
      // non-critical — silently ignore
    }
  };

  // Load the dots for a ±45-day window around the selected date — and only
  // again once the selection gets within 14 days of the window's edge, rather
  // than on every day click.
  const firstDotsRunRef = useRef(true);
  useEffect(() => {
    if (firstDotsRunRef.current) {
      firstDotsRunRef.current = false; // the startup request loads the first window
      return;
    }
    const loaded = datesWindowRef.current;
    if (loaded) {
      const inner = (d: string, days: number) => {
        const x = new Date(d + 'T12:00:00');
        x.setDate(x.getDate() + days);
        return x.toISOString().slice(0, 10);
      };
      if (selectedDate >= inner(loaded.from, 14) && selectedDate <= inner(loaded.to, -14)) return;
    }
    const center = new Date(selectedDate + 'T12:00:00');
    const from = new Date(center);
    from.setDate(from.getDate() - 45);
    const to = new Date(center);
    to.setDate(to.getDate() + 45);
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);
    datesWindowRef.current = { from: fromStr, to: toStr };
    fetchDatesWithData(fromStr, toStr);
  }, [selectedDate]);

  // Fetch expanded calendar month when it changes
  useEffect(() => {
    if (!calendarExpanded) return;
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const from = new Date(year, month, 1).toISOString().slice(0, 10);
    const to = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    fetchDatesWithData(from, to);
  }, [calendarExpanded, viewMonth]);


  // Meal state
  const [meals, setMeals] = useState<any[]>([]);
  // Always the real, server-confirmed "Today" meal id (or null) — not
  // affected by any optimistic item currently showing on screen. Reading
  // this instead of `meals[0]` in handleAddFoodToMeal is what makes adding
  // two foods back-to-back safe even before the first one's request lands.
  const mealIdRef = useRef<string | null>(null);
  // syncDay() calls run one at a time, in the order they were made.
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingSyncsRef = useRef(0);
  // Each food's nutrients per 100 g, so totals can be recalculated right here
  // (see recalcLocally). Kept in memory only, never persisted: which foods
  // someone looked at is part of their food diary.
  const vectorsRef = useRef<Map<string, FoodVector>>(new Map());
  const vectorsRequestedRef = useRef<Set<string>>(new Set());
  // Days already loaded (or prefetched), so opening one shows instantly and is
  // then refreshed quietly. Memory only, like the nutrient numbers above.
  const dayCacheRef = useRef<Map<string, { meals: any[]; symptoms: any[] | null }>>(new Map());
  const prefetchingRef = useRef<Set<string>>(new Set());
  // The span of days the calendar dots were last loaded for
  const datesWindowRef = useRef<{ from: string; to: string } | null>(null);
  const mealsRef = useRef<any[]>([]);
  mealsRef.current = meals;
  const [mealsLoading, setMealsLoading] = useState(false);
  const [addingFood, setAddingFood] = useState(false);

  // Add Food modal state
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [addFoodQuery, setAddFoodQuery] = useState('');

  // Daily totals state (nutrient aggregation)
  const [dailyTotals, setDailyTotals] = useState<any>(null);
  const [totalsLoading, setTotalsLoading] = useState(false);

  // Meal selector state (for nutrient analysis filtering)
  const [selectedMealIds, setSelectedMealIds] = useState<string[]>([]);
  // Food-list items the user has clicked. Empty = no filter (everything counts);
  // otherwise the macros and compound analysis cover only these foods.
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const selectedItemIdsRef = useRef<string[]>([]);
  selectedItemIdsRef.current = selectedItemIds;

  // DV source preference state
  const [dvSourcePreference, setDvSourcePreference] = useState<SourcePreference>('AVERAGE');
  const [dvSourceLoading, setDvSourceLoading] = useState(false);

  // Compound DVs state (fetched separately from intake data)
  const [compoundDVs, setCompoundDVs] = useState<Record<string, {
    value: number; unit: string; source: string;
    upperLimit?: number | null; upperLimitUnit?: string | null;
  }>>({});

  // Meal management state
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editingMealName, setEditingMealName] = useState('');
  const [showNewMealInput, setShowNewMealInput] = useState(false);
  const [newMealName, setNewMealName] = useState('');

  // Symptom tracking state
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [symptomDefinitions, setSymptomDefinitions] = useState<SymptomDefinition[]>([]);
  const [symptomsLoading, setSymptomsLoading] = useState(false);

  // Profile picker state (for DV context)
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [profileAge, setProfileAge] = useState<number>(25);
  // The age everything else reacts to: typing "34" shouldn't send requests for
  // "3" and then "34".
  const debouncedAge = useDebouncedValue(profileAge, 350);
  const [activityLevel, setActivityLevel] = useState<'SEDENTARY' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE'>('MODERATE');

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const inWrapper = searchWrapperRef.current?.contains(e.target as Node);
      const inPortal = dropdownPortalRef.current?.contains(e.target as Node);
      if (!inWrapper && !inPortal) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute dropdown position when it opens
  useEffect(() => {
    if (dropdownOpen && searchBarRef.current) {
      const rect = searchBarRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom, left: rect.left, width: rect.width });
    }
  }, [dropdownOpen, searchQuery]);

  // Initialize expanded groups from server-side compounds
  useEffect(() => {
    const compoundTypes = [...new Set(initialCompounds.map((c: any) => c.compound_type))] as string[];
    const initialGroups: {[key: string]: boolean} = compoundTypes.reduce((acc, type) => ({ ...acc, [type]: false }), {});
    setExpandedGroups(initialGroups);

  }, [initialCompounds, initialCompoundGroups]);

  // Fetch user demographics on mount (for DV source preference)
  useEffect(() => {
    async function fetchDemographics() {
      try {
        const res = await fetch(apiUrl('/api/user/demographics'));
        if (res.ok) {
          const data = await res.json();
          if (data.dvSourcePreference) {
            setDvSourcePreference(data.dvSourcePreference as SourcePreference);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user demographics:', error);
      }
    }
    fetchDemographics();
  }, []);

  // Fetch DVs for all compounds, refetch when picker age/sex changes
  // Daily values for the picker's age and sex. Remembered per combination, so
  // going back to one already used needs no request. Anything else the picker
  // sends in future (activity level, ...) must go into `dvKey` too.
  const dvCacheRef = useRef<Map<string, Record<string, any>>>(new Map());
  const latestDvKeyRef = useRef('');
  const dvLoadedOnceRef = useRef(false);
  const dvRecalcNeededRef = useRef(false);
  useEffect(() => {
    async function fetchCompoundDVs() {
      if (initialCompounds.length === 0) return;

      const sexParam = sex === 'male' ? 'MALE' : 'FEMALE';
      const dvKey = `${debouncedAge}:${sexParam}`;
      latestDvKeyRef.current = dvKey;

      // A new set of daily values; after the first one, the totals need
      // recalculating against it (done in the effect below, locally).
      const apply = (dvs: Record<string, any>) => {
        setCompoundDVs(dvs);
        if (dvLoadedOnceRef.current) dvRecalcNeededRef.current = true;
        dvLoadedOnceRef.current = true;
      };

      const cached = dvCacheRef.current.get(dvKey);
      if (cached) {
        apply(cached);
        return;
      }

      try {
        const compoundIds = initialCompounds.map((c: any) => c.id);
        const res = await fetch(apiUrl('/api/daily-values'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            compoundIds,
            age: debouncedAge,
            sex: sexParam,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const dvs = data.dailyValues || {};
          dvCacheRef.current.set(dvKey, dvs);
          // The picker may have moved on while this was in flight
          if (latestDvKeyRef.current === dvKey) apply(dvs);
        } else {
          console.error('Failed to fetch compound DVs:', res.status, res.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch compound DVs:', error);
      }
    }
    fetchCompoundDVs();
  }, [initialCompounds, debouncedAge, sex]);

  // The picker changed the daily values: recalculate the totals here, from the
  // nutrient numbers already held, instead of asking the server again. Falls
  // back to the server only if some food's numbers haven't arrived.
  useEffect(() => {
    if (!dvRecalcNeededRef.current) return;
    dvRecalcNeededRef.current = false;
    if (!recalcLocally(mealsRef.current, selectedItemIdsRef.current)) fetchDailyTotals(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compoundDVs]);

  // Startup: one request for everything the first screen needs — the day, the
  // food catalog, the symptom list, the calendar dots — instead of one request
  // each. If it fails, each part loads the old way.
  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const date = selectedDate;
      const center = new Date(date + 'T12:00:00');
      const from = new Date(center);
      from.setDate(from.getDate() - 45);
      const to = new Date(center);
      to.setDate(to.getDate() + 45);
      const datesFrom = from.toISOString().slice(0, 10);
      const datesTo = to.toISOString().slice(0, 10);
      datesWindowRef.current = { from: datesFrom, to: datesTo };

      setMealsLoading(true);
      setSymptomsLoading(true);
      try {
        const res = await fetch(apiUrl('/api/analysis/bootstrap'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            age: debouncedAge,
            sex: sex === 'male' ? 'MALE' : 'FEMALE',
            datesFrom,
            datesTo,
          }),
        });
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        if (cancelled) return;

        setFoodCatalog(data.catalog || []);
        setCatalogLoading(false);
        setSymptomDefinitions(data.symptomDefinitions || []);
        setDatesWithData((prev) => {
          const next = new Set(prev);
          (data.dates || []).forEach((d: string) => next.add(d));
          return next;
        });
        // Show the day unless the date was changed while this was on its way
        ingestDay(date, data.day, selectedDateRef.current === date);
      } catch (error) {
        console.error('Startup request failed; loading each part separately:', error);
        if (cancelled) return;
        loadCatalog();
        fetchDefinitions();
        fetchDatesWithData(datesFrom, datesTo);
        fetchMealsForDate(selectedDateRef.current);
      } finally {
        if (!cancelled) {
          setMealsLoading(false);
          setSymptomsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the date changes: show the day at once if it is already loaded, then
  // refresh it from the server — quietly if it was shown from the cache.
  const firstDayRunRef = useRef(true);
  useEffect(() => {
    if (firstDayRunRef.current) {
      firstDayRunRef.current = false; // the startup request loads the first day
      return;
    }
    const shownFromCache = showCachedDay(selectedDate);
    fetchMealsForDate(selectedDate, false, { silent: shownFromCache });
  }, [selectedDate]);

  // Once the day is up, quietly load the rest of the visible week so clicking
  // any of them is instant. One cheap request per day (meals, symptoms and food
  // numbers — no totals; the browser works those out if the day is opened).
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      for (const day of weekDays) {
        if (cancelled) return;
        if (day.date !== selectedDate) await prefetchDay(day.date);
      }
    }, 800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedDate]);

  // Fetch symptom definitions
  const fetchDefinitions = async () => {
    try {
      const res = await fetch(apiUrl('/api/symptom-definitions'));
      if (res.ok) {
        const data = await res.json();
        setSymptomDefinitions(data.definitions || []);
      }
    } catch (error) {
      console.error('Failed to fetch symptom definitions:', error);
    }
  };

  // (Loaded by the startup request below; fetchDefinitions is its fallback.)

  // (A day's symptoms now arrive with its meals — see syncDay — so there is no
  // separate request when the date changes.)

  // Fetch symptoms for a date
  async function fetchSymptomsForDate(date: string) {
    try {
      setSymptomsLoading(true);
      const params = new URLSearchParams({ date });
      const res = await fetch(apiUrl(`/api/symptoms?${params}`));

      if (!res.ok) {
        throw new Error('Failed to fetch symptoms');
      }

      const data = await res.json();
      setSymptoms(data.symptoms || []);
      const cachedDay = dayCacheRef.current.get(date);
      if (cachedDay) cachedDay.symptoms = data.symptoms || [];
    } catch (error) {
      console.error('Failed to fetch symptoms:', error);
      setSymptoms([]);
    } finally {
      setSymptomsLoading(false);
    }
  }

  // Loader for the food catalog, used only if the combined startup request
  // (below) fails — normally the catalog arrives with it.
  const loadCatalog = async () => {
    try {
      const res = await fetch(apiUrl('/api/foods/catalog'));
      if (!res.ok) throw new Error(`Failed to load food catalog: ${res.statusText}`);
      const data = await res.json();
      setFoodCatalog(data.foods || []);
    } catch (error) {
      console.error('Food catalog fetch error:', error);
      setCatalogError(error instanceof Error ? error.message : 'Failed to load foods');
    } finally {
      setCatalogLoading(false);
    }
  };

  // Instant search: filters the already-loaded catalog in memory on every
  // keystroke. No request, so nothing to debounce.
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const terms = q.split(/\s+/);
    const matches = foodCatalog.filter((food) => {
      const name = food.name.toLowerCase();
      return terms.every((term) => name.includes(term));
    });
    setSearchResults(matches.slice(0, 20));
  }, [searchQuery, foodCatalog]);

  async function fetchDailyTotals(date: string, mealIdsToFilter?: string[], itemIdsOverride?: string[]) {
    try {
      setTotalsLoading(true);
      const params = new URLSearchParams({
        date,
        age: String(debouncedAge),
        sex: sex === 'male' ? 'MALE' : 'FEMALE',
      });

      // Add meal filter if specific meals are selected (not all)
      const filterIds = mealIdsToFilter || selectedMealIds;
      if (filterIds.length > 0 && filterIds.length < meals.length) {
        params.append('mealIds', filterIds.join(','));
      }
      const itemIds = itemIdsOverride ?? selectedItemIdsRef.current;
      if (itemIds.length > 0) params.append('itemIds', itemIds.join(','));

      const res = await fetch(apiUrl(`/api/daily-totals?${params}`));

      if (!res.ok) {
        console.error('Failed to fetch daily totals:', res.statusText);
        return;
      }

      const data = await res.json();
      setDailyTotals(data);
      // Debug: show key macros
      const protein = data.compounds?.find((c: any) => c.name === 'Protein');
      const fat = data.compounds?.find((c: any) => c.name === 'Total Fat');
      const carbs = data.compounds?.find((c: any) => c.name === 'Total Carbohydrate');
    } catch (error) {
      console.error('❌ Failed to fetch daily totals:', error);
    } finally {
      setTotalsLoading(false);
    }
  }

  // Recalculate the day's totals right here, from each food's nutrient
  // numbers, instead of waiting for the server. It is the same arithmetic the
  // server runs (lib/nutrition/totals.ts), and the server's answer replaces
  // this one when it arrives. Returns false, changing nothing, when some
  // food's numbers haven't arrived yet — the server's answer is still needed.
  // An empty `onlyItemIds` means every item.
  const recalcLocally = (mealsNow: any[], onlyItemIds: string[] = []): boolean => {
    if (Object.keys(compoundDVs).length === 0) return false; // percentages need the daily values
    const items = mealsNow
      .flatMap((m) => m.items || [])
      .filter((it: any) => onlyItemIds.length === 0 || onlyItemIds.includes(it.id));
    if (items.some((it: any) => !it.foodId || !vectorsRef.current.has(it.foodId))) return false;
    const compounds = computeCompoundValues(
      items.map((it: any) => ({ foodId: it.foodId, grams: portionGramsOf(it.portionSize) })),
      vectorsRef.current
    );
    setDailyTotals(assemblePayload({ date: selectedDate, compounds, lastUpdated: new Date(), dvValues: compoundDVs }));
    return true;
  };

  // Dev only: the browser's arithmetic must equal the server's. Logs when it doesn't.
  const warnOnTotalsDrift = (mealsNow: any[], serverTotals: any) => {
    const items = mealsNow.flatMap((m) => m.items || []);
    if (items.some((it: any) => !vectorsRef.current.has(it.foodId))) return;
    const local = computeCompoundValues(
      items.map((it: any) => ({ foodId: it.foodId, grams: portionGramsOf(it.portionSize) })),
      vectorsRef.current
    );
    const server = new Map<string, any>((serverTotals?.compounds || []).map((c: any) => [c.compoundId, c]));
    const bad = local.filter((c) => {
      const t = server.get(c.compoundId);
      return !t || Math.abs(t.amount - c.amount) > 1e-9 * Math.max(Math.abs(t.amount), 1e-12);
    });
    if (bad.length > 0 || local.length !== server.size) {
      console.warn('[totals drift] browser and server disagree', { differing: bad.map((c) => c.name), local: local.length, server: server.size });
    }
  };

  // Show a day straight from the cache. Returns false if it isn't there.
  const showCachedDay = (date: string): boolean => {
    const cached = dayCacheRef.current.get(date);
    if (!cached) return false;
    setMeals(cached.meals);
    setSelectedMealIds(cached.meals.map((m: any) => m.id));
    mealIdRef.current = cached.meals[0]?.id ?? null;
    if (cached.symptoms) setSymptoms(cached.symptoms);
    // Totals from the numbers we hold; if any are missing the server's answer
    // (already on its way) fills them in — until then, not the previous day's.
    if (!recalcLocally(cached.meals)) setDailyTotals(null);
    return true;
  };

  // Load a neighbouring day into the cache without showing it.
  const prefetchDay = async (date: string) => {
    if (dayCacheRef.current.has(date) || prefetchingRef.current.has(date)) return;
    prefetchingRef.current.add(date);
    try {
      const res = await fetch(apiUrl('/api/meals/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          skipTotals: true,
          withSymptoms: true,
          knownFoodIds: [...vectorsRef.current.keys()],
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.vectors) {
        for (const [id, v] of unpackVectors(data.vectors)) vectorsRef.current.set(id, v);
      }
      const dayMeals = data.meals || [];
      dayCacheRef.current.set(date, { meals: dayMeals, symptoms: data.symptoms ?? null });
      if (dayMeals.some((m: any) => (m.items || []).length > 0)) {
        setDatesWithData((prev) => (prev.has(date) ? prev : new Set(prev).add(date)));
      }
    } catch {
      // a prefetch failing costs nothing: the day just loads normally when opened
    } finally {
      prefetchingRef.current.delete(date);
    }
  };

  // Fetch nutrient numbers for foods we don't have yet — e.g. the moment one is
  // picked in search, so adding it can update the totals instantly.
  const ensureVectors = async (foodIds: string[]) => {
    const missing = foodIds.filter((id) => id && !vectorsRef.current.has(id) && !vectorsRequestedRef.current.has(id));
    if (missing.length === 0) return;
    missing.forEach((id) => vectorsRequestedRef.current.add(id));
    try {
      const res = await fetch(apiUrl('/api/foods/nutrients'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodIds: missing }),
      });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      for (const [id, v] of unpackVectors(data.vectors)) vectorsRef.current.set(id, v);
    } catch (error) {
      console.error('Failed to load food nutrients:', error);
      missing.forEach((id) => vectorsRequestedRef.current.delete(id)); // allow a retry
    }
  };

  // Take a day's data from the server into the page: the food numbers, the
  // cache, the calendar dot — and, when `show`, the screen itself. `show` is
  // false for an answer that has been overtaken by a later request, which
  // would otherwise briefly undo it.
  const ingestDay = (date: string, data: any, show: boolean) => {
    const loadedMeals = data.meals || [];
    mealIdRef.current = loadedMeals[0]?.id ?? null;
    if (data.vectors) {
      for (const [id, v] of unpackVectors(data.vectors)) vectorsRef.current.set(id, v);
    }
    // Remember this day whatever happens to the response below
    dayCacheRef.current.set(date, {
      meals: loadedMeals,
      symptoms: data.symptoms ?? dayCacheRef.current.get(date)?.symptoms ?? null,
    });
    if (loadedMeals.some((m: any) => (m.items || []).length > 0)) {
      setDatesWithData((prev) => (prev.has(date) ? prev : new Set(prev).add(date)));
    }

    if (show) {
      setMeals(loadedMeals);
      // Selected meals default to ALL meals
      setSelectedMealIds(loadedMeals.map((m: any) => m.id));
      // Set active tab to first meal if not already set
      if (loadedMeals.length > 0 && !activeTab) {
        setActiveTab(loadedMeals[0].mealType || loadedMeals[0].id);
      }
      if (data.symptoms) setSymptoms(data.symptoms);
      setDailyTotals(data.dailyTotals);
      if (process.env.NODE_ENV !== 'production') warnOnTotalsDrift(loadedMeals, data.dailyTotals);
      // The sync returns unfiltered totals; keep an active food selection
      // (minus anything just removed) applied on top.
      const present = new Set(loadedMeals.flatMap((m: any) => (m.items || []).map((i: any) => i.id)));
      const kept = selectedItemIdsRef.current.filter((id) => present.has(id));
      if (kept.length !== selectedItemIdsRef.current.length) {
        selectedItemIdsRef.current = kept;
        setSelectedItemIds(kept);
      }
      if (kept.length > 0 && !recalcLocally(loadedMeals, kept)) fetchDailyTotals(date, undefined, kept);
    }
  };

  // Applies one change (or none) and loads the day's meals AND totals in a
  // single request — this used to be three calls in a row (change, meals,
  // totals), each re-checking auth. Calls are queued so they reach the server
  // in the order they were made, and only the last response is shown: an
  // earlier one can't include changes still waiting behind it, so showing it
  // would briefly undo them. `getChange` is read when the call actually runs,
  // so it sees the meal id an earlier queued call may have just created.
  const syncDay = (date: string, getChange?: () => SyncChange | undefined): Promise<void> => {
    pendingSyncsRef.current += 1;
    const attempt = async () => {
      try {
        setTotalsLoading(true);
        const res = await fetch(apiUrl('/api/meals/sync'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            age: debouncedAge,
            sex: sex === 'male' ? 'MALE' : 'FEMALE',
            change: getChange?.(),
            knownFoodIds: [...vectorsRef.current.keys()],
            // a plain load also wants the day's symptoms; a change doesn't
            withSymptoms: getChange === undefined,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || 'Failed to update meals');
        }

        ingestDay(date, await res.json(), pendingSyncsRef.current === 1);
      } finally {
        pendingSyncsRef.current -= 1;
        if (pendingSyncsRef.current === 0) setTotalsLoading(false);
      }
    };

    const result = syncQueueRef.current.then(attempt);
    // A failed call must not block the ones queued behind it.
    syncQueueRef.current = result.catch(() => {});
    return result;
  };

  async function fetchMealsForDate(date: string, preserveActiveTab = false, options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;
    try {
      // Silent: this is reconciling an optimistic add/remove with the
      // server's real data. The list already shows the right thing, so
      // don't flash "Loading…" over it while we double-check.
      if (!silent) {
        setMealsLoading(true);
        setSymptomsLoading(true);
      }
      if (!preserveActiveTab) {
        setActiveTab(''); // Reset active tab only when changing dates
        selectedItemIdsRef.current = [];
        setSelectedItemIds([]);
      }
      await syncDay(date);
    } catch (error) {
      console.error('Failed to fetch meals:', error);
      if (!silent) {
        setMeals([]);
        setSelectedMealIds([]);
      }
    } finally {
      if (!silent) {
        setMealsLoading(false);
        setSymptomsLoading(false);
      }
    }
  }

  // Selected food handlers
  const handleSelectFood = (food: any) => {
    setSelectedFood(food);
    setSearchQuery(''); // Clear search
    setDropdownOpen(false);
    // Fetch its nutrient numbers now, while the quantity is being chosen, so
    // clicking Add can update the totals instantly.
    if (food.id) ensureVectors([food.id]);

    // Portions came bundled with the catalog entry (see /api/foods/catalog),
    // so there is nothing left to fetch — selecting a food is instant.
    const portions = food.portions || [];
    setFoodPortions(portions);
    if (portions.length > 0) {
      const def = portions.find((p: any) => p.isDefault) || portions[0];
      setSelectedUnit(def.id);
      setSelectedQuantity('1');
    } else {
      // No portions on file for this food — grams is the only option.
      setSelectedQuantity('100');
      setSelectedUnit('g');
    }
  };

  const handleRemoveSelectedFood = () => {
    setSelectedFood(null);
    setSelectedQuantity('100');
    setSelectedUnit('g');
    setFoodPortions([]);
  };

  const handleRemoveMealItem = async (mealItemId: string) => {
    setActionError(null);

    // Optimistic: gone from the screen immediately; if the server disagrees,
    // the list is re-read from it below.
    const mealsAfterRemove = mealsRef.current.map((m) => ({
      ...m,
      items: (m.items || []).filter((it: any) => it.id !== mealItemId),
    }));
    setMeals(mealsAfterRemove);
    recalcLocally(mealsAfterRemove, selectedItemIdsRef.current.filter((id) => id !== mealItemId));

    // An item still being added has no server-side id to delete yet, so
    // there is nothing to send a DELETE for. Known gap: if the add's own
    // request is still in flight, it will still succeed and the item will
    // reappear once the reconciliation fetch below runs — removing something
    // mid-add is rare enough that this hasn't been worth building a cancel
    // path for.
    if (mealItemId.startsWith('optimistic-')) return;

    try {
      // One request: removes the item and returns the updated meals + totals.
      await syncDay(selectedDate, () => ({ type: 'remove', mealItemId }));
    } catch (error) {
      console.error('Failed to remove meal item:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to remove item');
      // Put back whatever the server actually has.
      fetchMealsForDate(selectedDate, true, { silent: true });
    }
  };

  const handleAddFoodToMeal = async () => {
    if (!selectedFood) return;
    setActionError(null);

    // Compute actual grams — if a portion is selected, multiply quantity by its gramWeight.
    // Otherwise treat selectedQuantity as raw grams (legacy hardcoded-unit fallback).
    const qty = parseFloat(selectedQuantity);
    const chosenPortion = foodPortions.find((p) => p.id === selectedUnit);
    const portionGrams = chosenPortion ? qty * chosenPortion.gramWeight : qty;
    const portionLabel = chosenPortion
      ? (/^\d/.test(chosenPortion.description)
          ? (qty === 1 ? chosenPortion.description : `${qty} × ${chosenPortion.description}`)
          : `${qty} ${chosenPortion.description}`)
      : selectedUnit;
    const foodBeingAdded = selectedFood;

    // Optimistic: on screen the instant you click, before the server has
    // even heard about it. If it fails, the list is re-read from the server.
    const optimisticItem = {
      id: `optimistic-${Date.now()}`,
      foodId: foodBeingAdded.id,
      food: { name: foodBeingAdded.name },
      portionSize: Math.round(portionGrams * 100) / 100,
      portionType: portionLabel,
    };
    const mealsNow = mealsRef.current;
    const mealsAfterAdd =
      mealsNow.length > 0
        ? [{ ...mealsNow[0], items: [...(mealsNow[0].items || []), optimisticItem] }, ...mealsNow.slice(1)]
        : // No meal for today yet — show one so the item has somewhere to land;
          // the real meal (with its real id) arrives on reconciliation below.
          [{ id: 'optimistic-meal', mealType: 'Today', items: [optimisticItem] }];
    setMeals(mealsAfterAdd);
    // Totals update right now too, if this food's numbers have arrived
    // (they start loading when the food is picked). Otherwise the server's
    // answer, already on its way, fills them in.
    recalcLocally(mealsAfterAdd, selectedItemIdsRef.current);
    handleRemoveSelectedFood();

    // Import USDA food if needed (if it's not already in database)
    let foodId = foodBeingAdded.id;

    try {
      setAddingFood(true);

      // If food is from USDA (not imported), import it first
      if (!foodBeingAdded.isImported) {
        const importRes = await fetch(apiUrl('/api/foods/import'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fdcId: foodBeingAdded.fdcId })
        });

        if (!importRes.ok) {
          throw new Error('Failed to import food');
        }

        const importData = await importRes.json();
        foodId = importData.food.id;
      }

      // One request: adds the food and returns the updated meals + totals.
      // The meal id is read when the call runs (see syncDay), so it is never
      // the optimistic one above, which has no server-side id.
      await syncDay(selectedDate, () => ({
        type: 'add',
        mealId: mealIdRef.current,
        food: { foodId, portionSize: portionGrams, portionType: portionLabel },
      }));

    } catch (error) {
      console.error('Failed to add food to meal:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to add food');
      // Take the optimistic item back out: show what the server actually has.
      fetchMealsForDate(selectedDate, true, { silent: true });
    } finally {
      setAddingFood(false);
    }
  };

  // Meal selection handler (for nutrient analysis filtering)
  const toggleMealSelection = (mealId: string) => {
    setSelectedMealIds((prev) => {
      const newSelection = prev.includes(mealId)
        ? prev.filter((id) => id !== mealId)
        : [...prev, mealId];

      // Refetch daily totals with new selection
      fetchDailyTotals(selectedDate, newSelection);

      return newSelection;
    });
  };

  // Click a food in the list to include/exclude it from the analysis
  const toggleItemSelection = (itemId: string) => {
    if (itemId.startsWith('optimistic-')) return; // no server id to filter on yet
    const next = selectedItemIdsRef.current.includes(itemId)
      ? selectedItemIdsRef.current.filter((id) => id !== itemId)
      : [...selectedItemIdsRef.current, itemId];
    selectedItemIdsRef.current = next;
    setSelectedItemIds(next);
    if (!recalcLocally(mealsRef.current, next)) fetchDailyTotals(selectedDate, undefined, next);
  };
  const clearItemSelection = () => {
    selectedItemIdsRef.current = [];
    setSelectedItemIds([]);
    if (!recalcLocally(mealsRef.current, [])) fetchDailyTotals(selectedDate, undefined, []);
  };

  // Select all meals
  const selectAllMeals = () => {
    const allIds = meals.map((m) => m.id);
    setSelectedMealIds(allIds);
    fetchDailyTotals(selectedDate, allIds);
  };

  // Handle DV source preference change
  const handleDvSourceChange = async (newSource: SourcePreference) => {
    setDvSourceLoading(true);
    try {
      const res = await fetch(apiUrl('/api/user/demographics'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dvSourcePreference: newSource }),
      });

      if (res.ok) {
        setDvSourcePreference(newSource);
        // Refresh daily totals to get updated DV calculations
        fetchDailyTotals(selectedDate);
      } else {
        console.error('Failed to update DV source preference');
      }
    } catch (error) {
      console.error('Failed to update DV source preference:', error);
    } finally {
      setDvSourceLoading(false);
    }
  };

  // Meal management: Create new meal
  const handleCreateMeal = async () => {
    if (!newMealName.trim()) return;

    try {
      const res = await fetch(apiUrl('/api/meals'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          mealType: newMealName.trim(),
          foods: [], // Empty meal
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create meal');
      }

      setNewMealName('');
      setShowNewMealInput(false);
      await fetchMealsForDate(selectedDate);
    } catch (error) {
      console.error('Failed to create meal:', error);
    }
  };

  // Meal management: Update meal name
  const handleUpdateMealName = async (mealId: string) => {
    if (!editingMealName.trim()) {
      setEditingMealId(null);
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/meals/${mealId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType: editingMealName.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update meal');
      }

      setEditingMealId(null);
      setEditingMealName('');
      await fetchMealsForDate(selectedDate, true);
    } catch (error) {
      console.error('Failed to update meal:', error);
    }
  };

  // Meal management: Delete meal
  const handleDeleteMeal = async (mealId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/meals/${mealId}`), {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete meal');
      }

      await fetchMealsForDate(selectedDate);
    } catch (error) {
      console.error('Failed to delete meal:', error);
    }
  };

  // Start editing a meal name
  const startEditingMeal = (meal: any) => {
    setEditingMealId(meal.id);
    setEditingMealName(meal.mealType || '');
  };

  // Group compounds by type
  const compoundsByType = allCompounds.reduce((acc, compound) => {
    const type = compound.compound_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(compound);
    return acc;
  }, {} as {[key: string]: any[]});

  // Helper to calculate confidence tier from confidence value
  const getConfidenceTier = (confidence: number): 1 | 2 | 3 => {
    if (confidence <= 33) return 1;
    if (confidence <= 66) return 2;
    return 3;
  };

  // Helper function to get nutrient value from daily totals (now includes DV data)
  // Falls back to compoundDVs for DV info even when no intake is logged
  const getNutrientValue = (compoundId: string): {
    amount: number;
    unit: string;
    rdaPercent: number | null;
    zone: 'deficient' | 'low' | 'optimal' | 'high' | 'excess' | 'unknown';
    dailyValue: {
      value: number; unit: string; source: string | null;
      upperLimit?: number | null; upperLimitUnit?: string | null;
    } | null;
    showProgressBar: boolean;
    confidence: number | null;
    confidenceTier: 1 | 2 | 3 | null;
  } | null => {
    // Check if we have intake data from daily totals
    const intakeData = dailyTotals?.compounds?.find((c: any) => c.compoundId === compoundId);

    // Check if this compound has a DV defined (from separate DV fetch)
    const dvData = compoundDVs[compoundId];

    if (intakeData) {
      // We have intake data - use it (includes DV from API)
      const confidence = intakeData.confidence ?? null;
      return {
        amount: intakeData.amount,
        unit: intakeData.unit,
        rdaPercent: intakeData.rdaPercent ?? null,
        zone: intakeData.zone || 'unknown',
        dailyValue: intakeData.dailyValue || (dvData ? {
          value: dvData.value, unit: dvData.unit, source: dvData.source,
          upperLimit: dvData.upperLimit ?? null, upperLimitUnit: dvData.upperLimitUnit ?? null,
        } : null),
        showProgressBar: true,
        confidence,
        confidenceTier: confidence !== null ? getConfidenceTier(confidence) : null,
      };
    }

    // No intake data - but we might still have a DV defined
    // Return zero intake with DV info so progress bar shows correctly
    const compoundInfo = allCompounds.find((c: any) => c.id === compoundId);
    return {
      amount: 0,
      unit: compoundInfo?.unit || 'g',
      rdaPercent: dvData ? 0 : null, // 0% if DV exists, null if no DV
      zone: dvData ? 'deficient' : 'unknown',
      dailyValue: dvData ? {
        value: dvData.value, unit: dvData.unit, source: dvData.source,
        upperLimit: dvData.upperLimit ?? null, upperLimitUnit: dvData.upperLimitUnit ?? null,
      } : null,
      showProgressBar: true,
      confidence: null,
      confidenceTier: null,
    };
  };

  // Helper function to format nutrient amount
  const formatAmount = (amount: number, unit: string): string => {
    if (amount === 0) return `0 ${unit}`;
    if (amount < 0.01) return `<0.01 ${unit}`;
    if (amount < 1) return `${amount.toFixed(2)} ${unit}`;
    if (amount < 100) return `${amount.toFixed(1)} ${unit}`;
    return `${Math.round(amount)} ${unit}`;
  };

  // Helper function to get friendly type names
  const getTypeName = (type: string) => {
    const names: {[key: string]: string} = {
      'MACRONUTRIENT': 'Macronutrients',
      'VITAMIN': 'Vitamins',
      'MINERAL': 'Minerals',
      'AMINO_ACID': 'Amino Acids',
      'FATTY_ACID': 'Fatty Acids',
      'CARBOHYDRATE': 'Carbohydrates',
      'POLYPHENOL': 'Polyphenols',
      'CAROTENOID': 'Carotenoids',
      'ALKALOID': 'Alkaloids',
      'GLUCOSINOLATE': 'Glucosinolates',
      'TERPENOID': 'Terpenoids',
    };
    return names[type] || type;
  };

  const toggleGroup = (type: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const dropdownItemStyle: React.CSSProperties = {
    fontFamily: 'var(--font-space-grotesk), sans-serif',
    fontWeight: 400,
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
    padding: '8px',
    textAlign: 'left',
    cursor: 'pointer',
    background: '#000',
    letterSpacing: '0.03em',
  };

  if (!user) {
    return <GuestAnalysisView />;
  }

  return (
    <div className="an-page">
      <AnalysisHeader user={{
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url
      }} />

      {/* Main: Page Layout */}
      <main className="an-main">
        <div className="an-container">

          {/* Date picker — centered, above the first panel */}
          <div className="an-datebar">
            <p className="section-label an-month">{(() => {
              // A week can straddle two months — name both when it does.
              const first = weekDays[0];
              const last = weekDays[weekDays.length - 1];
              if (!first || !last) return '';
              const year = new Date(last.date + 'T00:00:00').getFullYear();
              return first.monthName === last.monthName
                ? `${first.monthName} ${year}`
                : `${first.monthName} – ${last.monthName} ${year}`;
            })()}</p>
            <WeekStrip
              weekDays={weekDays}
              onDayClick={goToDate}
              onPreviousWeek={goToPreviousWeek}
              onNextWeek={goToNextWeek}
              datesWithData={datesWithData}
            />
          </div>

          {/* ── PANEL — logging: the AI chat is the page's primary action ── */}
          <section className="an-panel an-panel--log">
                  <div className="cc-tabs">
                    <button
                      type="button"
                      className={`cc-tab${centerTab === 'chat' ? ' cc-tab--active' : ''}`}
                      onClick={() => setCenterTab('chat')}
                    >
                      AI chat
                    </button>
                    <span className="cc-tab-sep" aria-hidden="true" />
                    <button
                      type="button"
                      className={`cc-tab${centerTab === 'search' ? ' cc-tab--active' : ''}`}
                      onClick={() => setCenterTab('search')}
                    >
                      Manual search
                    </button>
                  </div>

                  {(() => {
                    // Desktop: this renders as the chat's side list (.chat-aside),
                    // same as before. On mobile it's hidden here — the standalone
                    // .an-panel--foods section below takes over instead of the
                    // squeezed bottom-of-chatbox version we used to have.
                    const foodListAside = (
                      <>
                        <p className="chat-aside-title">Today</p>
                        {selectedItemIds.length > 0 && (
                          <button type="button" className="food-select-clear" onClick={clearItemSelection}>
                            Unselect all
                          </button>
                        )}
                        {mealsLoading ? (
                          <p className="chat-aside-empty">Loading…</p>
                        ) : (() => {
                          const allItems = meals.flatMap(m => m.items || []);
                          return allItems.length === 0 ? (
                            <p className="chat-aside-empty">No foods logged</p>
                          ) : (
                            <ul className="chat-aside-list">
                              {allItems.map((item: any) => (
                                <li
                                  key={item.id}
                                  className={`chat-aside-item food-selectable${selectedItemIds.includes(item.id) ? ' is-selected' : ''}`}
                                  role="button"
                                  tabIndex={0}
                                  aria-pressed={selectedItemIds.includes(item.id)}
                                  onClick={() => toggleItemSelection(item.id)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleItemSelection(item.id); } }}
                                >
                                  <span className="chat-aside-name">{item.food?.name || 'Unknown'}</span>
                                  <span className="chat-aside-meta">{formatPortion(item)}</span>
                                  <button
                                    type="button"
                                    className="chat-aside-remove"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveMealItem(item.id); }}
                                    aria-label={`Remove ${item.food?.name || 'item'}`}
                                  >
                                    ✕
                                  </button>
                                </li>
                              ))}
                            </ul>
                          );
                        })()}
                      </>
                    );

                    return centerTab === 'chat' ? (
                      <FoodLogChat
                        aside={foodListAside}
                        date={selectedDate}
                        onMealLogged={() => {
                          fetchMealsForDate(selectedDate, true, { silent: true });
                        }}
                      />
                    ) : (
                      <div className="chat-box chat-box--split">
                        <div className="chat-main">
                          <div className="cc-search-pane" ref={searchWrapperRef}>
                            <div className="search-field-outer">
                              <div className="search-bar-wrap" ref={searchBarRef}>
                                <span className="search-icon">
                                  <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>
                                  </svg>
                                </span>
                                <input
                                  type="text"
                                  className="search-input-clean"
                                  placeholder={catalogLoading ? 'Loading foods…' : 'Search foods...'}
                                  value={selectedFood ? selectedFood.name : searchQuery}
                                  disabled={catalogLoading}
                                  onChange={(e) => {
                                    if (selectedFood) { setSelectedFood(null); setSelectedQuantity('100'); setSelectedUnit('g'); }
                                    setSearchQuery(e.target.value);
                                    setDropdownOpen(true);
                                  }}
                                  onFocus={() => {
                                    setSearchFocused(true);
                                    if (selectedFood) { setSelectedFood(null); setSelectedQuantity('100'); setSelectedUnit('g'); setSearchQuery(''); }
                                    else if (searchQuery) { setDropdownOpen(true); }
                                  }}
                                  onBlur={() => setSearchFocused(false)}
                                  readOnly={!!selectedFood}
                                />
                                {selectedFood && (
                                  <button className="search-clear-btn" onClick={handleRemoveSelectedFood}>✕</button>
                                )}
                              </div>
                            </div>

                            <div className="add-row">
                              <input
                                type="number"
                                className="quantity-input"
                                value={selectedQuantity}
                                onChange={(e) => setSelectedQuantity(e.target.value)}
                                min="1"
                              />
                              <select
                                className="unit-select"
                                value={selectedUnit}
                                onChange={(e) => setSelectedUnit(e.target.value)}
                              >
                                {foodPortions.length > 0 ? (
                                  foodPortions.map((p) => (
                                    <option key={p.id} value={p.id}>{p.description}</option>
                                  ))
                                ) : (
                                  <>
                                    <option value="g">g</option>
                                    <option value="oz">oz</option>
                                    <option value="cup">cup</option>
                                    <option value="tbsp">tbsp</option>
                                  </>
                                )}
                              </select>
                              <button
                                className="add-btn"
                                onClick={handleAddFoodToMeal}
                                disabled={addingFood || !selectedFood}
                              >
                                {addingFood ? 'Adding…' : 'Add food'}
                              </button>
                            </div>
                            {actionError && <p className="cc-action-error">{actionError}</p>}
                          </div>
                        </div>
                        <aside className="chat-aside">{foodListAside}</aside>
                      </div>
                    );
                  })()}
          </section>{/* end log panel */}

          {/* ── PANEL — today's food list, its own section ── */}
          <section className="an-panel an-panel--foods">
            <div className="an-foods-head">
              <p className="section-label">Today</p>
              {selectedItemIds.length > 0 && (
                <button type="button" className="food-select-clear" onClick={clearItemSelection}>
                  Unselect all
                </button>
              )}
            </div>
            {(() => {
              if (mealsLoading) return <p className="lc-empty">Loading…</p>;
              const allItems = meals.flatMap(m => m.items || []);
              if (allItems.length === 0) return <p className="lc-empty">No foods logged</p>;
              return (
                <ul className="food-list">
                  {allItems.map((item: any) => (
                    <li
                      key={item.id}
                      className={`food-item food-selectable${selectedItemIds.includes(item.id) ? ' is-selected' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selectedItemIds.includes(item.id)}
                      onClick={() => toggleItemSelection(item.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleItemSelection(item.id); } }}
                    >
                      <span className="food-item-name">{item.food?.name || 'Unknown'}</span>
                      <span className="food-item-meta">{formatPortion(item)}</span>
                      <button
                        type="button"
                        className="food-item-remove"
                        onClick={(e) => { e.stopPropagation(); handleRemoveMealItem(item.id); }}
                        aria-label={`Remove ${item.food?.name || 'item'}`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </section>{/* end foods panel */}

          {/* ── PANEL — today's food list ── */}

          {/* ── PANEL — macros ── */}
          <section className="an-panel an-panel--macros">
            <div className="an-macros">
            <section className="rc-macros macros-section">
                {(() => {
                  const energyCompound  = allCompounds.find(c => c.name === 'Energy');
                  const waterCompound   = allCompounds.find(c => c.name === 'Water');
                  const proteinCompound = allCompounds.find(c => c.name === 'Protein');
                  const carbCompound    = allCompounds.find(c => c.name === 'Total Carbohydrate');
                  const fatCompound     = allCompounds.find(c => c.name === 'Total Fat');

                  const energyData  = energyCompound  ? getNutrientValue(energyCompound.id)  : null;
                  const waterData   = waterCompound   ? getNutrientValue(waterCompound.id)   : null;
                  const proteinData = proteinCompound ? getNutrientValue(proteinCompound.id) : null;
                  const carbData    = carbCompound    ? getNutrientValue(carbCompound.id)    : null;
                  const fatData     = fatCompound     ? getNutrientValue(fatCompound.id)     : null;

                  const kcal    = energyData?.amount  ? Math.round(energyData.amount)  : null;
                  const waterG  = waterData?.amount   ?? null;
                  const waterMl = waterG !== null ? Math.round(waterG) : null;

                  const macros: MacroSlice[] = [
                    { label: 'Protein', value: proteinData?.amount ?? null, goal: 50,  unit: 'g' },
                    { label: 'Carbs',   value: carbData?.amount    ?? null, goal: 275, unit: 'g' },
                    { label: 'Fat',     value: fatData?.amount     ?? null, goal: 78,  unit: 'g' },
                  ];

                  return (
                    <div className="mv-layout">
                      <div className="mv-card">
                        <div className="mv-section-head">
                          <MacroVizPicker style={macroVizStyle} onChange={setMacroVizStyle} />
                        </div>
                        <MacroViz style={macroVizStyle} macros={macros} kcal={kcal} />
                      </div>
                      <div className="mv-hero-col">
                        <div className="hero-stat">
                          <svg className="hero-stat-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M11.5 2L6 11h4.5l-2 7L14 9H9.5l2-7z" fill="var(--accent)" opacity="0.7"/>
                          </svg>
                          <p className="hero-stat-num">{kcal ?? '--'}</p>
                          <p className="hero-stat-label">kcal</p>
                        </div>
                        <div className="hero-stat">
                          <svg className="hero-stat-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 3C10 3 5 9.5 5 12.5C5 15.54 7.24 18 10 18C12.76 18 15 15.54 15 12.5C15 9.5 10 3 10 3z" fill="var(--accent)" opacity="0.7"/>
                          </svg>
                          <p className="hero-stat-num">
                            {waterMl !== null
                              ? waterMl >= 200
                                ? `${(waterMl / 1000).toFixed(1)} L`
                                : `${waterMl} mL`
                              : '--'}
                          </p>
                          <p className="hero-stat-label">water</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </section>

            </div>{/* end an-macros */}
          </section>{/* end panel 1 */}

          {/* ── PANEL 2 — in-depth compounds ── */}
          <section className="an-panel an-panel--compounds">
              <section className="rc-compounds compounds-section">
                <div className="an-analysis-head">
                  <div className="picker picker--bare">
                  <div className="picker-group">
                      <span className={`picker-opt picker-opt--male${sex === 'male' ? ' sel' : ''}`} onClick={() => setSex('male')}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="10" cy="14" r="6"/>
                          <line x1="14.5" y1="9.5" x2="20" y2="4"/>
                          <polyline points="16 4 20 4 20 8"/>
                        </svg>
                      </span>
                      <span className="picker-divider" />
                      <span className={`picker-opt picker-opt--female${sex === 'female' ? ' sel' : ''}`} onClick={() => setSex('female')}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="6"/>
                          <line x1="12" y1="14" x2="12" y2="20"/>
                          <line x1="9" y1="18" x2="15" y2="18"/>
                        </svg>
                      </span>
                    </div>
                    <div className="picker-fields">
                    <div className="picker-age-row">
                      <span className="picker-label">Age</span>
                      <input
                        className="age-input"
                        type="number"
                        value={profileAge}
                        min={1}
                        max={120}
                        onChange={(e) => setProfileAge(parseInt(e.target.value) || 25)}
                      />
                    </div>
                      <div className="picker-activity-row">
                      <span className="picker-label">Activity</span>
                      <select
                        className="activity-select"
                        value={activityLevel}
                        onChange={(e) => setActivityLevel(e.target.value as typeof activityLevel)}
                      >
                        <option value="SEDENTARY">Sedentary</option>
                        <option value="MODERATE">Moderate</option>
                        <option value="ACTIVE">Active</option>
                        <option value="VERY_ACTIVE">Very Active</option>
                      </select>
                    </div>
                    </div>
                  </div>
                </div>
                <div className="compounds-header">
                  {/* Highlighted compounds — % of daily target, gradient rings (option A) */}
                  <div className="hl-card">
                    <h3 className="ac-title">Highlighted</h3>
                    <div className="hl-rings">
                      {(() => {
                        const HL: Array<[string, string[]]> = [
                          ['Vitamin D', ['vitamin d']],
                          ['Iron', ['iron']],
                          ['Magnesium', ['magnesium']],
                          ['Omega-3', ['omega-3', 'omega 3', 'total omega-3']],
                          ['Vitamin B12', ['vitamin b12', 'vitamin b-12', 'cobalamin']],
                          ['Fiber', ['fiber', 'dietary fiber', 'fiber, total dietary']],
                        ];
                        const R = 40, STROKE = 11, C = 2 * Math.PI * R;
                        return HL.map(([label, aliases]) => {
                          const compound = allCompounds.find((c: any) => aliases.includes(String(c.name).toLowerCase()));
                          const pct = compound ? getNutrientValue(compound.id)?.rdaPercent ?? null : null;
                          const gid = `hl-grad-${label.replace(/\W+/g, '')}`;
                          return (
                            <div key={label} className="hl-item">
                              <div className="hl-ring">
                                <svg viewBox="0 0 100 100">
                                  <defs>
                                    <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="color-mix(in srgb, #d42a55 25%, #ffffff)" />
                                      <stop offset="100%" stopColor="#d42a55" />
                                    </linearGradient>
                                  </defs>
                                  <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(212, 42, 85, 0.10)" strokeWidth={STROKE} />
                                  <circle cx="50" cy="50" r={R} fill="none" stroke={`url(#${gid})`} strokeWidth={STROKE}
                                    strokeLinecap="round" strokeDasharray={`${(Math.min(pct ?? 0, 100) / 100) * C} ${C}`} />
                                </svg>
                                <span className="hl-ring-val">
                                  {pct !== null ? Math.round(pct) : '--'}<small>%</small>
                                </span>
                              </div>
                              <p className="hl-label">{label}</p>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
                <div className="ac-grid">
                  {(() => {
                    const byName = new Map(allCompounds.map((c: any) => [c.name, c]));
                    return balanceCards(initialCompoundGroups, byName).map((col, ci) => (
                      <div key={ci} className="ac-col">
                        {col.map(({ def, index }) => (
                      <AnalysisCard
                        key={def.title}
                        def={def}
                        index={index}
                        groups={initialCompoundGroups}
                        byName={byName}
                        expanded={expandedGroups}
                        toggle={toggleGroup}
                        getNutrientValue={getNutrientValue}
                        formatAmount={formatAmount}
                        selectedMealIds={selectedMealIds}
                      />
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              </section>

          </section>{/* end panel 2 */}
        </div>{/* end an-container */}
      </main>

      {/* Smart Add Food Modal (AI-Assisted) */}
      {/* Search dropdown portal — renders above all containers to avoid overflow clipping */}
      {!selectedFood && searchQuery && dropdownOpen && dropdownPos && createPortal(
        <div
          ref={dropdownPortalRef}
          className="search-dropdown an-portal"
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
        >
          {catalogError && (
            <div className="search-dropdown-item" style={{ color: 'var(--red)' }}>Error: {catalogError}</div>
          )}
          {!catalogError && searchResults.length === 0 && (
            <div className="search-dropdown-item" style={{ color: 'var(--text-3)' }}>No results for &ldquo;{searchQuery}&rdquo;</div>
          )}
          {!catalogError && searchResults.map((food, i) => (
            <div key={food.id} className={`search-dropdown-item${i % 2 === 1 ? ' banded' : ''}`} onClick={() => handleSelectFood(food)}>
              <div className="search-dropdown-name">{food.name}</div>
              {food.compoundCount > 0 && (
                <div className="search-dropdown-meta">{food.compoundCount} compounds</div>
              )}
            </div>
          ))}
          {!catalogError && (
            <div className="search-add-unknown">
              <button
                className="search-add-unknown-btn"
                onClick={() => { setAddFoodQuery(searchQuery); setSearchQuery(''); setShowAddFoodModal(true); }}
              >
                Add &ldquo;{searchQuery}&rdquo; to NutriDB
              </button>
            </div>
          )}
        </div>,
        document.body
      )}

      <SmartAddFoodModal
        isOpen={showAddFoodModal}
        onClose={() => {
          setShowAddFoodModal(false);
          setAddFoodQuery('');
        }}
        initialQuery={addFoodQuery}
        onSuccess={(food) => {
          // Clear search to trigger re-search
          setSearchQuery('');
          setSearchResults([]);
          setShowAddFoodModal(false);
          setAddFoodQuery('');
        }}
        userId={user.id}
      />

      <style jsx>{`
        /* ─────────── New layout overrides (May 2026 refactor) ─────────── */

        /* ─────────── 3-column layout (chat-centric refactor, May 2026) ─────────── */

        /* Page layout — 3-column grid: left sidebar | chat | right sidebar */
        :global(.page-layout) {
          display: grid !important;
          grid-template-columns: minmax(300px, 340px) minmax(0, 1fr) minmax(440px, 520px);
          flex-direction: row;
          flex: 1;
          min-height: 0;
          width: 100%;
          overflow: hidden;
        }

        /* ── LEFT column ── */
        .left-col {
          display: flex;
          flex-direction: column;
          background: var(--bg-soft);
          border-right: 4px solid var(--divider);
          overflow: hidden;
          position: relative;
        }
        .lc-section {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-bottom: 4px solid var(--divider);
        }
        .lc-section:last-child {
          border-bottom: none;
        }
        .lc-section--calendar {
          flex: 0 0 auto;
          padding: 14px 8px 12px;
        }
        .lc-section--calendar :global(.week-strip-container) {
          padding: 0;
        }
        .lc-section--calendar :global(.week-strip) {
          gap: 4px;
        }
        .lc-section--calendar :global(.week-nav-btn) {
          width: 26px;
          height: 32px;
          border-radius: 4px;
        }
        .lc-section--calendar :global(.week-nav-btn svg) {
          width: 14px;
          height: 14px;
        }
        .lc-section--calendar :global(.week-days) {
          gap: 3px;
          flex: 1;
          justify-content: space-between;
        }
        .lc-section--calendar :global(.week-day-card) {
          min-width: 0;
          flex: 1;
          padding: 5px 2px;
          border-radius: 4px;
        }
        .lc-section--calendar :global(.day-name) {
          font-size: 15px;
          letter-spacing: 0.3px;
        }
        .lc-section--calendar :global(.day-number) {
          font-size: 17px;
          margin-top: 1px;
        }
        .lc-section--foods {
          flex: 1 1 auto;
          min-height: 0;
          padding: 16px 0 14px;
        }
        .lc-section--wellness {
          flex: 0 0 auto;
          padding: 14px 18px;
        }
        .lc-label {
          padding: 0 18px;
          margin: 0 0 10px;
          font-family: var(--font-mono);
          font-size: 15px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-3);
        }
        .lc-section--foods .food-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 0;
        }
        .lc-empty {
          padding: 12px 18px;
          color: var(--text-3);
          font-size: 17px;
        }

        /* ── CENTER column — tabbed: AI chat / Manual search ── */
        .center-col {
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
          background: var(--bg);
          border-right: 4px solid var(--divider);
        }
        .center-col > :global(.chat-box) {
          flex: 1;
          min-height: 0;
        }

        /* Subtle tab header — two mono labels divided by a thin vertical rule */
        .cc-tabs {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border-soft);
          background: var(--bg);
        }
        .cc-tab {
          background: transparent;
          border: none;
          padding: 4px 14px;
          font-family: var(--font-mono);
          font-size: 15px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-3);
          cursor: pointer;
          transition: color 0.12s;
        }
        .cc-tab:hover {
          color: var(--text-2);
        }
        .cc-tab--active {
          color: var(--text-1);
        }
        .cc-tab-sep {
          display: inline-block;
          width: 1px;
          height: 12px;
          background: var(--border);
        }

        /* Manual search pane sits where the chat would render */
        .cc-search-pane {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .cc-search-pane :global(.search-bar-wrap) {
          max-width: 100%;
        }

        /* ── RIGHT column — compact macros + scrolling analysis ── */
        .right-col {
          display: flex;
          flex-direction: column;
          background: var(--bg);
          overflow: hidden;
          min-width: 0;
        }
        .rc-macros {
          flex: 0 0 auto;
          width: 100%;
          padding: 28px 28px 26px !important;
          border-bottom: 4px solid var(--divider);
        }
        .rc-compounds {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 22px 20px !important;
        }

        /* Compact macros for narrow right column */
        .rc-macros :global(.hero-stat-num) {
          font-size: 48px;
        }
        .rc-macros :global(.hero-stat-label) {
          font-size: 16px;
        }
        .rc-macros :global(.hero-stat-icon) {
          margin-bottom: 4px;
        }

        /* Make the analysis age/sex picker wrap nicely in narrow column */
        /* Top of the analysis box: highlighted compounds left, personal
           info right, on one line (stacked on a phone) */
        .rc-compounds :global(.compounds-header) {
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: stretch;
          justify-content: space-between;
          gap: 24px;
          margin-top: 0;
          margin-bottom: 0;
        }
        @media (max-width: 820px) {
          .rc-compounds :global(.compounds-header) {
            flex-direction: column;
          }
        }

        /* Slightly larger fonts in the analysis section */
        .rc-compounds :global(.section-label) {
          font-size: 16px;
        }
        .rc-compounds :global(.nutrient-name) {
          font-size: 18px;
        }
        .rc-compounds :global(.nutrient-value) {
          font-size: 18px;
        }
        .rc-compounds :global(.picker-label) {
          font-size: 17px;
        }
        .rc-compounds :global(.age-input) {
          font-size: 18px;
        }
        .rc-compounds :global(.picker-activity-row) {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rc-compounds :global(.activity-select) {
          background: var(--surface);
          color: var(--text-1);
          border: 1px solid var(--border);
          border-radius: 3px;
          padding: 5px 26px 5px 10px;
          font-family: var(--font-body);
          font-size: 17px;
          line-height: 1.2;
          cursor: pointer;
          outline: none;
          appearance: none;
          background-image: linear-gradient(45deg, transparent 50%, var(--text-2) 50%),
                            linear-gradient(135deg, var(--text-2) 50%, transparent 50%);
          background-position: calc(100% - 14px) 50%, calc(100% - 9px) 50%;
          background-size: 5px 5px, 5px 5px;
          background-repeat: no-repeat;
          transition: border-color 0.15s ease;
        }
        .rc-compounds :global(.activity-select:focus) {
          border-color: var(--accent);
        }

        /* Stack to single column on narrow viewports */
        @media (max-width: 1080px) {
          :global(.page-layout) {
            grid-template-columns: 1fr !important;
            grid-auto-rows: auto;
            overflow-y: auto;
          }
          .left-col,
          .center-col,
          .right-col {
            border-right: none;
            border-bottom: 4px solid var(--divider);
            overflow: visible;
          }
          .center-col {
            min-height: 70vh;
          }
          .rc-compounds {
            overflow: visible;
          }
        }

        /* ─────────── End 3-column layout ─────────── */

        /* Date Navigation Row */
        .date-nav-row {
          position: relative;
        }

        /* Section Layout - Responsive */
        .split-layout {
          display: flex;
          flex-direction: column;
        }

        /* Desktop: Side by side */
        @media (min-width: 768px) {
          .split-layout {
            display: grid;
            grid-template-columns: 1fr 3px 1.618fr;
            gap: 0;
          }
        }

        .meal-builder,
        .nutrient-analysis {
          background: var(--bg);
          padding: 24px;
          border: none;
        }

        /* Separator line - only visible on desktop */
        .section-separator {
          display: none;
          background: linear-gradient(
            to bottom,
            rgba(34, 211, 238, 0),
            rgba(34, 211, 238, 0.1) 20%,
            rgba(34, 211, 238, 0.3) 35%,
            rgba(34, 211, 238, 0.8) 40%,
            rgba(100, 140, 238, 0.8) 50%,
            rgba(217, 70, 239, 0.8) 60%,
            rgba(217, 70, 239, 0.3) 65%,
            rgba(217, 70, 239, 0.1) 80%,
            rgba(217, 70, 239, 0)
          );
        }

        @media (min-width: 768px) {
          .section-separator {
            display: block;
            width: 3px;
          }

          .meal-builder {
            padding-right: 32px;
          }

          .nutrient-analysis {
            padding-left: 32px;
          }
        }

        /* Section Headers */
        .section-title {
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-size: 20px;
          margin-bottom: 20px;
        }

        .meal-title {
          color: #22d3ee;
        }

        .nutrient-title {
          color: #d946ef;
        }

        /* Category and Compound Text - White */
        .category-header {
          color: #fff;
        }

        .category-header span {
          color: #fff;
        }

        .group-count {
          color: rgba(255, 255, 255, 0.6);
        }

        .nutrient-name {
          color: #fff;
          font-size: var(--text-body-size);
          font-weight: var(--text-body-weight);
        }

        .btn-add-food {
          padding: 10px 16px;
          background: var(--purple);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 17px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-add-food:hover {
          background: var(--purple-dark);
          transform: translateY(-1px);
        }

        /* Persistent Add Food button at bottom of search */
        .search-result-add-food {
          position: sticky;
          bottom: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 60%, rgba(0, 0, 0, 0));
          padding: 16px 12px 12px;
          margin-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-add-food-persistent {
          width: 100%;
          padding: 12px 16px;
          background: linear-gradient(135deg, var(--purple, #d946ef), var(--purple-dark, #a21caf));
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          text-align: center;
          box-shadow: 0 2px 8px rgba(217, 70, 239, 0.3);
        }

        .btn-add-food-persistent:hover {
          background: linear-gradient(135deg, var(--purple-dark, #a21caf), var(--purple, #d946ef));
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(217, 70, 239, 0.4);
        }

        .nutrient-value.has-value {
          color: var(--cyan, #22d3ee);
          font-weight: 500;
        }

        /* Meal Tab Styles */
        .meal-tabs .tab {
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
        }

        .meal-tabs .tab span {
          cursor: pointer;
        }

        .edit-meal-btn,
        .delete-meal-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          padding: 2px 4px;
          font-size: 16px;
          opacity: 0;
          transition: all 0.2s;
        }

        .meal-tabs .tab:hover .edit-meal-btn,
        .meal-tabs .tab:hover .delete-meal-btn {
          opacity: 1;
        }

        .edit-meal-btn:hover {
          color: var(--cyan, #22d3ee);
        }

        .delete-meal-btn:hover {
          color: var(--red, #ef4444);
        }

        .edit-meal-input,
        .new-meal-input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--cyan, #22d3ee);
          border-radius: 4px;
          color: #fff;
          padding: 4px 8px;
          font-size: 17px;
          width: 100px;
        }

        .new-meal-tab {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .confirm-meal-btn,
        .cancel-meal-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          padding: 2px 6px;
          font-size: 17px;
        }

        .confirm-meal-btn:hover {
          color: var(--green, #22c55e);
        }

        .cancel-meal-btn:hover {
          color: var(--red, #ef4444);
        }

        .add-meal-tab {
          background: rgba(255, 255, 255, 0.05);
          border: 1px dashed rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 8px 16px;
          font-size: 20px;
          transition: all 0.2s;
        }

        .add-meal-tab:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--cyan, #22d3ee);
          color: var(--cyan, #22d3ee);
        }

        /* Meal Card Selector Styles */
        .meal-cards {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .meal-card {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .meal-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .meal-card.selected {
          background: rgba(34, 211, 238, 0.1);
          border-color: var(--cyan, #22d3ee);
        }

        .meal-card-checkbox {
          width: 18px;
          height: 18px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: var(--cyan, #22d3ee);
        }

        .meal-card.selected .meal-card-checkbox {
          background: var(--cyan, #22d3ee);
          border-color: var(--cyan, #22d3ee);
          color: #000;
        }

        .meal-card-info {
          display: flex;
          flex-direction: column;
        }

        .meal-card-title {
          font-size: 17px;
          font-weight: 500;
          color: #fff;
        }

        .meal-card-foods {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.5);
        }

        .no-meals-hint {
          color: rgba(255, 255, 255, 0.4);
          font-size: 17px;
          padding: 12px;
        }

        .select-all-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          padding: 6px 12px;
          font-size: 16px;
          transition: all 0.2s;
        }

        .select-all-btn:hover {
          border-color: var(--cyan, #22d3ee);
          color: var(--cyan, #22d3ee);
        }


        /* GENERAL Section - Energy & Water */
        .general-section {
          margin-bottom: 24px;
        }

        .general-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .general-metric {
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(34, 211, 238, 0.02));
          border: 1px solid rgba(34, 211, 238, 0.15);
          border-radius: 12px;
          padding: 16px;
        }

        .general-metric-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .general-metric-icon {
          font-size: 20px;
        }

        .general-metric-label {
          font-size: var(--text-micro-size);
          font-weight: var(--text-label-weight);
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: var(--text-micro-spacing);
          text-transform: var(--text-micro-transform);
        }

        .general-metric-value {
          font-size: var(--text-h2-size);
          font-weight: var(--text-h1-weight);
          color: #22d3ee;
          margin-bottom: 12px;
        }

        .general-metric-bar-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .segmented-bar {
          display: flex;
          gap: 3px;
          flex: 1;
          padding: 0 4px;
        }

        .segmented-bar .segment {
          flex: 1;
          height: 14px;
          transform: skewX(-20deg);
          transition: background 0.3s ease;
        }

        .segmented-bar .segment.empty {
          background: rgba(255, 255, 255, 0.1);
        }

        .segmented-bar .segment.filled {
          box-shadow: 0 0 6px currentColor;
        }

        .general-metric-percent {
          font-size: 17px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          min-width: 40px;
          text-align: right;
        }

        /* MACRO Section */
        .macro-section {
          margin-bottom: 24px;
        }

        /* Macro Ratio Bar */
        .macro-ratio-container {
          margin-bottom: 16px;
        }

        .macro-ratio-bar {
          display: flex;
          height: 24px;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .macro-ratio-segment {
          height: 100%;
          transition: width 0.4s ease;
          position: relative;
        }

        .macro-ratio-segment.carbs {
          background: linear-gradient(135deg, #eab308, #ca8a04);
        }

        .macro-ratio-segment.protein {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .macro-ratio-segment.fat {
          background: linear-gradient(135deg, #22c55e, #16a34a);
        }

        .macro-ratio-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          padding: 0 4px;
        }

        .macro-ratio-label {
          font-size: var(--text-micro-size);
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .macro-ratio-label.carbs .macro-ratio-dot { color: #eab308; }
        .macro-ratio-label.protein .macro-ratio-dot { color: #ef4444; }
        .macro-ratio-label.fat .macro-ratio-dot { color: #22c55e; }

        /* Macro Cards */
        .macro-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        @media (max-width: 600px) {
          .macro-cards {
            grid-template-columns: 1fr;
          }
        }

        .macro-card {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .macro-card.carbs {
          border-color: rgba(234, 179, 8, 0.3);
          background: linear-gradient(135deg, rgba(234, 179, 8, 0.1), transparent);
        }

        .macro-card.protein {
          border-color: rgba(239, 68, 68, 0.3);
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), transparent);
        }

        .macro-card.fat {
          border-color: rgba(34, 197, 94, 0.3);
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), transparent);
        }

        .macro-card-icon {
          font-size: 30px;
        }

        .macro-card-info {
          display: flex;
          flex-direction: column;
        }

        .macro-card-label {
          font-size: var(--text-micro-size);
          font-weight: var(--text-label-weight);
          color: rgba(255, 255, 255, 0.5);
          text-transform: var(--text-micro-transform);
          letter-spacing: var(--text-micro-spacing);
        }

        .macro-card-value {
          font-size: var(--text-h2-size);
          font-weight: var(--text-h1-weight);
          color: #fff;
        }

        .macro-card-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .macro-card.carbs .macro-card-bar-fill {
          height: 100%;
          background: #eab308;
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        .macro-card.protein .macro-card-bar-fill {
          height: 100%;
          background: #ef4444;
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        .macro-card.fat .macro-card-bar-fill {
          height: 100%;
          background: #22c55e;
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        .macro-card-dv {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.5);
          text-align: right;
        }

        .group-icon {
          margin-right: 6px;
        }

        .group-count {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.4);
        }

        /* Nutrient Analysis Loading State */
        .nutrient-analysis {
          position: relative;
          transition: opacity 0.3s ease;
        }

        .nutrient-analysis.loading {
          pointer-events: none;
        }

        .nutrient-analysis.loading > *:not(.analysis-loading-overlay) {
          opacity: 0.4;
          filter: blur(1px);
          transition: opacity 0.3s ease, filter 0.3s ease;
        }

        .analysis-loading-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          background: rgba(0, 0, 0, 0.8);
          padding: 24px 32px;
          border-radius: 12px;
          border: 1px solid rgba(217, 70, 239, 0.3);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
        }

        .analysis-loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(217, 70, 239, 0.2);
          border-top-color: var(--purple, #d946ef);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .analysis-loading-text {
          font-size: 17px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        /* ═══════════════════════════════════════════════════════════════
           ALPHA SKETCH (2026-08-23) — light "pink/coral" restyle.
           Low-poly art as the page ground; content lives in rounded
           panels tinted the homepage cream (#ffe1d9). Overrides the
           dark rules above, so it must stay last in this block.
           ═══════════════════════════════════════════════════════════ */

        .an-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-image: url('/design/bakgrunn.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          background-repeat: no-repeat;
          color: #2e1a0e;
        }

        .an-page :global(header) {
          background: transparent;
          border-bottom: none;
        }
        .an-page :global(.logo) { color: #2e1a0e; }
        .an-page :global(nav a) { color: rgba(46, 26, 14, 0.72); }
        .an-page :global(nav a:hover) { color: #2e1a0e; }
        .an-page :global(.user-avatar) {
          background: rgba(46, 26, 14, 0.06);
          border-color: rgba(46, 26, 14, 0.28);
          color: #2e1a0e;
        }

        .an-main {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .an-container {
          max-width: 1180px;
          width: 100%;
          margin: 0 auto;
          padding: 20px 24px 72px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        /* Grid/flex children default to min-width:auto and will force the
           container wider than the viewport when their content (the week
           strip, the macro-ring row) has a large min-content size. */
        .an-container > * { min-width: 0; }

        /* ── Date picker: centred, floating above the first panel ── */
        .an-datebar {
          display: flex;
          justify-content: center;
          padding: 4px 0 2px;
        }
        .an-datebar {
          --ws-card-bg: rgba(255, 255, 255, 0.42);
          --ws-card-border: rgba(46, 26, 14, 0.14);
          --ws-card-hover: rgba(255, 255, 255, 0.7);
          --ws-day-name: rgba(46, 26, 14, 0.55);
          --ws-day-number: #2e1a0e;
        }
        .an-datebar :global(.week-strip-container) {
          padding: 8px 10px;
          background: rgba(255, 247, 244, 0.82);
          border: 1px solid rgba(46, 26, 14, 0.14);
          border-radius: 14px;
          backdrop-filter: blur(6px);
        }
        .an-datebar :global(.week-day-card) {
          border-radius: 8px;
          color: #2e1a0e;
        }
        .an-datebar :global(.day-name) { color: rgba(46, 26, 14, 0.55); }
        .an-datebar :global(.day-number) { color: #2e1a0e; }
        .an-datebar :global(.week-nav-btn) {
          color: #2e1a0e;
          border-radius: 8px;
        }

        /* ── The panels ── */
        .an-panel {
          background: var(--panel);
          border: 1px solid rgba(46, 26, 14, 0.12);
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(46, 26, 14, 0.10);
          color: #2e1a0e;
        }

        /* Panel 1: logging left, macros right */
        .an-panel--top {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
          gap: 28px;
          align-items: start;
        }

        .an-log {
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-width: 0;
        }
        .an-logger { order: 1; display: flex; flex-direction: column; min-width: 0; }
        .an-foods  { order: 2; display: flex; flex-direction: column; min-width: 0; }

        .an-macros { min-width: 0; }

        /* Panel 2 */
        .an-panel--compounds { padding: 24px; }

        /* ── Re-tone the dark inner components ── */
        .an-page :global(.section-label),
        .an-page :global(.lc-label) {
          color: rgba(46, 26, 14, 0.55);
        }

        .an-page :global(.cc-tabs) {
          justify-content: flex-start;
          background: transparent;
          border-bottom: 1px solid rgba(46, 26, 14, 0.14);
          padding: 0 0 10px;
          margin-bottom: 14px;
        }
        .an-page :global(.cc-tab) { color: rgba(46, 26, 14, 0.5); padding-left: 0; }
        .an-page :global(.cc-tab--active) { color: #2e1a0e; }
        .an-page :global(.cc-tab-sep) { background: rgba(46, 26, 14, 0.2); }

        .an-page :global(.food-item) {
          color: #2e1a0e;
          border-color: rgba(46, 26, 14, 0.12);
        }
        .an-page :global(.food-item-name) { color: #2e1a0e; }
        .an-page :global(.food-item-meta),
        .an-page :global(.lc-empty) { color: rgba(46, 26, 14, 0.55); }
        .an-page :global(.food-list) { max-height: 220px; overflow-y: auto; }

        /* Inputs on the cream ground */
        .an-page :global(input),
        .an-page :global(select),
        .an-page :global(textarea:not(.chat-input)) {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(46, 26, 14, 0.2);
          border-radius: 8px;
          color: #2e1a0e;
        }
        .an-page :global(input::placeholder),
        .an-page :global(textarea::placeholder) { color: rgba(46, 26, 14, 0.42); }
        .an-page :global(input:focus-visible),
        .an-page :global(select:focus-visible),
        .an-page :global(textarea:not(.chat-input):focus-visible) {
          outline: none;
          box-shadow: 0 0 0 2px #2e1a0e;
        }

        .an-page :global(.add-btn),
        .an-page :global(.search-add-unknown-btn) {
          background: #2e1a0e;
          color: #fff;
          border: none;
          border-radius: 8px;
        }

        /* Macros */
        .an-page :global(.hero-stat-num) { color: #2e1a0e; }
        .an-page :global(.hero-stat-label),
        .an-page :global(.macro-label),
        .an-page :global(.macro-ring-unit) { color: rgba(46, 26, 14, 0.6); }
        .an-page :global(.macro-ring-val) { color: #2e1a0e; }

        /* Compound rows */
        .an-page :global(.nutrient-categories) { color: #2e1a0e; }
        .an-page :global(.picker-label),
        .an-page :global(.picker-opt) { color: rgba(46, 26, 14, 0.6); }
        .an-page :global(.picker-opt.sel) { color: #2e1a0e; }

        @media (max-width: 900px) {
          .an-panel--top { grid-template-columns: 1fr; gap: 24px; }
          .an-container { padding: 16px 14px 56px; }
          .an-panel { padding: 18px; border-radius: 14px; }
        }

        /* ── Palette overrides scoped to this page ──
           The rings and the week strip read these vars, so redefining them
           here re-tones both without touching the dark app-wide theme. */
        .an-page {
          /* ── HIGHLIGHT COLOUR — single source of truth ──
             Change these two lines to re-tone every accent on the page. */
          /* ── TWO HIGHLIGHTS (2026-08-23) ──
             --coral   = data highlight (Rouge). Bars, rings, the selected date,
                         data dots — things that carry a value.
             --action  = interactive highlight (Espresso). Buttons and anything
                         the user presses. Rouge on buttons was too loud. */
          --coral: #d42a55;
          --coral-dark: #9f1f40;
          --coral-ink: #fff9f7;

          --action: #2e1a0e;
          --action-dark: #180c05;
          --action-ink: #fff9f7;

          /* Panel ground — "Petal white", locked 2026-08-23 */
          --panel: #fff7f4;

          /* Everything below DERIVES from --coral, so the picker re-tones the
             whole page rather than just the buttons. */
          --accent: var(--coral);
          --accent-dark: var(--coral-dark);
          --accent-text: var(--coral);
          --cyan: var(--coral);
          --magenta: var(--coral);

          /* The dark theme's surface + neutral tokens, re-pointed to the light
             palette. Most remaining dark backgrounds resolved through these. */
          --bg: transparent;
          --bg-soft: rgba(255, 255, 255, 0.42);
          --bg-accent: rgba(255, 255, 255, 0.34);
          --surface: rgba(255, 255, 255, 0.70);
          --divider: rgba(46, 26, 14, 0.12);
          --border-soft: rgba(46, 26, 14, 0.10);
          --white: #2e1a0e;
          --gray-50: rgba(46, 26, 14, 0.03);
          --gray-100: rgba(255, 255, 255, 0.62);
          --gray-200: rgba(255, 255, 255, 0.80);
          --gray-300: rgba(46, 26, 14, 0.18);

          /* Neutral selection colour — used where the accent would be too loud */
          --sel-border: rgba(46, 26, 14, 0.38);

          --ring-1: var(--coral);
          --ring-2: color-mix(in srgb, var(--coral) 62%, #ffffff);
          --ring-3: color-mix(in srgb, var(--coral) 34%, #ffffff);
          --border: rgba(46, 26, 14, 0.16);
          --cyan: #2e1a0e;
          --text-1: #2e1a0e;
          --text-2: rgba(46, 26, 14, 0.72);
          --text-3: rgba(46, 26, 14, 0.5);
        }

        /* Strip the dark grounds + grayscale textures off the inner sections */
        .an-page :global(.macros-section),
        .an-page :global(.compounds-section) {
          background: transparent !important;
          background-color: transparent !important;
          padding: 0 !important;
          overflow: visible !important;
          flex: none !important;
        }
        .an-page :global(.macros-section::before),
        .an-page :global(.compounds-section::before),
        .an-page :global(.compounds-section::after) {
          display: none !important;
          content: none !important;
        }

        /* Compounds panel grows with its content — no inner scrollbar */
        .an-page :global(.rc-compounds),
        .an-page :global(.nutrient-categories),
        .an-page :global(.category-content) {
          overflow: visible !important;
          max-height: none !important;
          min-height: 0;
        }
        .an-panel--compounds { overflow: visible; }

        /* Section titles in the display serif, espresso */
        .an-page :global(.section-label) {
          font-family: var(--font-display) !important;
          font-size: 30px !important;
          font-weight: 400 !important;
          letter-spacing: -0.01em !important;
          text-transform: none !important;
          color: #2e1a0e !important;
          margin-bottom: 14px !important;
        }

        /* Week strip: espresso selection instead of cyan */
        /* Selection is carried by the border alone — no fill change.
           Every card keeps a 2px border so selecting one doesn't reflow the row. */
        .an-datebar :global(.week-day-card) {
          border-width: 2px !important;
        }
        .an-datebar :global(.week-day-card.active),
        .an-datebar :global(.week-day-card.selected) {
          border-color: var(--coral) !important;
          background: rgba(255, 255, 255, 0.42) !important;
          box-shadow: none !important;
        }
        .an-datebar :global(.week-day-card.selected .day-name) {
          color: rgba(46, 26, 14, 0.55) !important;
        }
        .an-datebar :global(.data-dot) {
          background: var(--coral) !important;
          box-shadow: none !important;
        }
        .an-datebar :global(.today-dot),
        .an-datebar :global(.week-day-card.today) {
          border-color: var(--coral) !important;
        }
        .an-datebar :global(.today-dot) { background: var(--coral) !important; }

        /* Macro numerals — display serif */
        .an-page :global(.hero-stat-num),
        .an-page :global(.macro-ring-val) {
          font-family: var(--font-display) !important;
          color: #2e1a0e !important;
        }
        .an-page :global(.hero-stat-icon path) { fill: #2e1a0e !important; }

        /* Compound rows */
        .an-page :global(.category-header),
        .an-page :global(.nutrient-name),
        .an-page :global(.category-name) { color: #2e1a0e; }
        .an-page :global(.nutrient-row) {
          border-color: rgba(46, 26, 14, 0.10);
        }
        /* Desktop (>500px): confidence dots move to the right of the DV bar.
           DOM order is name, value, badge, bar — so widen to 4 tracks and
           swap the last two by explicit column placement. Below 500px the
           row switches to flex (see the narrow-phone block) and this is inert. */
        .an-page :global(.nutrient-row) {
          grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 2fr) auto !important;
        }
        .an-page :global(.nutrient-row) > :global(.tooltip-container),
        .an-page :global(.nutrient-row) > :global(.dv-bar-wrapper) {
          grid-column: 3;
          grid-row: 1;
        }
        .an-page :global(.nutrient-row) > :global(.confidence-badge) {
          grid-column: 4;
          grid-row: 1;
          justify-self: end;
        }
        .an-page :global(.activity-select),
        .an-page :global(.age-input) {
          background: rgba(255, 255, 255, 0.7) !important;
          color: #2e1a0e !important;
          border: 1px solid rgba(46, 26, 14, 0.2) !important;
          border-radius: 8px !important;
        }
        .an-page :global(.picker-opt svg) { color: rgba(46, 26, 14, 0.45); }
        .an-page :global(.picker-opt.sel svg) { color: #2e1a0e; }
        .an-page :global(.picker-divider) { background: rgba(46, 26, 14, 0.2); }

        /* ── Dark-mode leftovers found in review (2026-08-23) ── */

        /* Macro rings: solid white disc, same card shadow as the chat
           input and analysis category cards. */
        .an-page :global(.macro-ring) {
          background: #ffffff !important;
          box-shadow: 0 6px 22px rgba(46, 26, 14, 0.12) !important;
        }

        /* Banded compound rows used --bg-accent (#0f0f0f) */
        .an-page :global(.nutrient-row:nth-child(even)),
        .an-page :global(.nutrient-row.banded) {
          background: rgba(255, 255, 255, 0.34) !important;
        }
        .an-page :global(.nutrient-row) {
          border-bottom: 1px solid rgba(46, 26, 14, 0.10) !important;
        }
        .an-page :global(.category-header) {
          background: transparent !important;
        }

        /* Progress bars */
        .an-page :global(.nutrient-bar),
        .an-page :global(.progress-track) {
          background: rgba(46, 26, 14, 0.12) !important;
        }
        .an-page :global(.nutrient-bar-fill),
        .an-page :global(.progress-fill) {
          background: var(--coral) !important;
        }

        /* Send button + primary actions take the highlight colour */
        .an-page :global(.add-btn) {
          background: var(--action) !important;
          color: var(--action-ink) !important;
          box-shadow: 0 4px 0 var(--action-dark) !important;
        }
        .an-page :global(.add-btn:hover:not(:disabled)) {
          box-shadow: 0 2px 0 var(--action-dark) !important;
        }

        /* ── Highlight colour, applied across the page (2026-08-23) ──
           All of these resolve through --coral. */

        /* Compound DV bars: the gradient IS the highlight; .dv-bar-fill is an
           opaque veil masking the unfilled portion, so it must not be
           translucent or the gradient shows through it. */
        .an-page :global(.dv-bar) {
          background: linear-gradient(
            to right,
            color-mix(in srgb, var(--coral) 32%, #ffffff) 0%,
            color-mix(in srgb, var(--coral) 70%, #ffffff) 45%,
            var(--coral) 100%
          ) !important;
          height: 14px !important;
          border-radius: 7px !important;
        }
        .an-page :global(.dv-bar-fill) {
          background: #f2e7e2 !important;
        }
        .an-page :global(.dv-bar-overflow) {
          background: var(--coral-dark) !important;
        }
        .an-page :global(.dv-bar.police-tape),
        .an-page :global(.header-bar.police-tape) {
          background: repeating-linear-gradient(
            -45deg,
            rgba(46, 26, 14, 0.10),
            rgba(46, 26, 14, 0.10) 4px,
            rgba(46, 26, 14, 0.04) 4px,
            rgba(46, 26, 14, 0.04) 8px
          ) !important;
        }
        .an-page :global(.dv-percent-label) { color: #fff9f7 !important; }
        .an-page :global(.no-dv-label-centered) { color: rgba(46, 26, 14, 0.45) !important; }

        /* Active tab reads as a neutral selected chip — the accent is saved for
           data and actions, not for every piece of UI state. */
        .an-page :global(.cc-tabs) {
          gap: 8px;
        }
        .an-page :global(.cc-tab) {
          border: 1.5px solid transparent !important;
          border-radius: 9px !important;
          padding: 6px 14px !important;
        }
        .an-page :global(.cc-tab--active) {
          color: #2e1a0e !important;
          border-color: var(--sel-border) !important;
          background: rgba(255, 255, 255, 0.5) !important;
        }
        .an-page :global(.cc-tab-sep) { display: none !important; }

        /* Macro block */
        .an-page :global(.hero-stat-icon path) { fill: var(--coral) !important; }

        /* Sex picker + section chrome */
        .an-page :global(.picker-opt.sel svg) { color: var(--coral) !important; }
        .an-page :global(.search-icon svg) { stroke: var(--coral) !important; }

        /* Focus rings follow the highlight */
        .an-page :global(input:focus-visible),
        .an-page :global(select:focus-visible),
        .an-page :global(textarea:not(.chat-input):focus-visible),
        .an-page :global(button:not(.chat-send):focus-visible) {
          outline: none !important;
          box-shadow: 0 0 0 2px var(--sel-border) !important;
        }
        .an-page :global(input:focus),
        .an-page :global(textarea:not(.chat-input):focus) {
          border-color: var(--sel-border) !important;
        }

        /* Food rows: remove-button and hover accent */
        .an-page :global(.food-item-remove) { color: rgba(46, 26, 14, 0.35) !important; }
        .an-page :global(.food-item-remove:hover) { color: var(--coral) !important; }
        .an-page :global(.food-item:hover) {
          background: color-mix(in srgb, var(--coral) 8%, transparent) !important;
        }

        /* Expanded compound group header keeps a highlight rail */
        .an-page :global(.group-row) {
          border-left: 3px solid transparent;
        }
        .an-page :global(.category-section.expanded) > :global(.group-row),
        .an-page :global(.group-row:hover) {
          border-left-color: var(--coral);
        }

        .an-page :global(.search-dropdown-item:hover) {
          background: color-mix(in srgb, var(--coral) 10%, transparent) !important;
        }

        /* ── Portalled surfaces ──
           The search dropdown renders into document.body, so it sits OUTSIDE
           .an-page and none of the scoped overrides above can reach it.
           These are deliberately unscoped. */
        :global(.search-dropdown.an-portal) {
          background: #fff7f4 !important;
          border: 1px solid rgba(46, 26, 14, 0.16) !important;
          border-radius: 12px !important;
          box-shadow: 0 14px 40px rgba(46, 26, 14, 0.22) !important;
          overflow: hidden;
        }
        :global(.an-portal .search-dropdown-item) {
          border-bottom: 1px solid rgba(46, 26, 14, 0.10) !important;
        }
        :global(.an-portal .search-dropdown-item.banded) {
          background: rgba(46, 26, 14, 0.035) !important;
        }
        :global(.an-portal .search-dropdown-item:hover) {
          background: rgba(212, 42, 85, 0.10) !important;
        }
        :global(.an-portal .search-dropdown-name) { color: #2e1a0e !important; }
        :global(.an-portal .search-dropdown-meta) { color: rgba(46, 26, 14, 0.5) !important; }
        :global(.an-portal .search-add-unknown) {
          border-top: 1px solid rgba(46, 26, 14, 0.12) !important;
          background: transparent !important;
        }
        :global(.an-portal .search-add-unknown-btn) {
          background: #d42a55 !important;
          color: #fff9f7 !important;
          border: none !important;
          border-radius: 8px !important;
        }

        /* Manual-search pane inputs */
        .an-page :global(.search-input-clean) {
          background: rgba(255, 255, 255, 0.7) !important;
          color: #2e1a0e !important;
          border: 1px solid rgba(46, 26, 14, 0.2) !important;
          border-radius: 10px !important;
          box-shadow: none !important;
        }
        .an-page :global(.search-input-clean::placeholder) { color: rgba(46, 26, 14, 0.42) !important; }
        .an-page :global(.quantity-input),
        .an-page :global(.unit-select) {
          background: rgba(255, 255, 255, 0.7) !important;
          color: #2e1a0e !important;
          border: 1px solid rgba(46, 26, 14, 0.2) !important;
          border-radius: 10px !important;
        }
        .an-page :global(.search-clear-btn) {
          background: transparent !important;
          color: rgba(46, 26, 14, 0.5) !important;
        }
        .an-page :global(.search-bar-wrap) {
          background: transparent !important;
          border: none !important;
        }
        .an-page :global(.search-bar-wrapper::after) { display: none !important; }

        /* ── Border + shadow pass (2026-08-23) ──
           Kill the dark inset shadows inherited from the dark theme, and give
           every edge a 2px border — the 1px hairlines read as unfinished. */

        .an-page :global(input),
        .an-page :global(select),
        .an-page :global(textarea:not(.chat-input)),
        .an-page :global(.search-input-clean),
        .an-page :global(.quantity-input),
        .an-page :global(.unit-select),
        .an-page :global(.age-input),
        .an-page :global(.activity-select) {
          box-shadow: none !important;
          border-width: 2px !important;
          border-style: solid !important;
          border-color: rgba(46, 26, 14, 0.22) !important;
        }
        .an-page :global(input:focus),
        .an-page :global(select:focus),
        .an-page :global(textarea:not(.chat-input):focus),
        .an-page :global(.search-input-clean:focus) {
          box-shadow: none !important;
          border-color: var(--sel-border) !important;
        }
        .an-page :global(input:focus-visible),
        .an-page :global(select:focus-visible),
        .an-page :global(textarea:not(.chat-input):focus-visible) {
          box-shadow: none !important;
          border-color: var(--sel-border) !important;
        }
        .an-page :global(button:not(.chat-send):focus-visible) {
          outline: none !important;
          box-shadow: 0 0 0 2px var(--sel-border) !important;
        }

        /* Panels + surfaces */
        .an-panel {
          border-width: 2px;
        }
        .an-datebar :global(.week-strip-container) {
          border-width: 2px !important;
        }
        .an-page :global(.cc-tab) {
          border-width: 2px !important;
        }
        .an-page :global(.cc-tabs) {
          border-bottom-width: 2px !important;
          border-bottom-color: rgba(46, 26, 14, 0.16) !important;
        }


        /* Selected date: thick, softened border; no fill change */
        .an-datebar :global(.week-day-card) {
          border-width: 3px !important;
        }
        .an-datebar :global(.week-day-card.active),
        .an-datebar :global(.week-day-card.selected) {
          border-color: rgba(212, 42, 85, 0.55) !important;
        }

        :global(.search-dropdown.an-portal) {
          border-width: 2px !important;
        }
        :global(.an-portal .search-dropdown-item) {
          border-bottom-width: 2px !important;
        }

        /* ── Borders off (2026-08-23) ──
           Stripped wholesale to judge whether any are needed. Separation now
           comes from surface tint and shadow alone. Re-add selectively. */
        .an-page :global(*),
        .an-page :global(*::before),
        .an-page :global(*::after),
        :global(.an-portal),
        :global(.an-portal *) {
          border: none !important;
        }

        /* Chat exceptions: the food-list row lines, and the
           input's focus border (transparent at rest, so layout never shifts). */
        .an-page :global(.chat-aside-item) {
          border-bottom: 1px solid rgba(46, 26, 14, 0.08) !important;
        }
        .an-page :global(.chat-aside-item:last-child) {
          border-bottom: none !important;
        }
        .an-page :global(.chat-input) {
          border: 3px solid transparent !important;
        }
        .an-page :global(.chat-input:focus) {
          border-color: #2e1a0e !important;
        }

        /* The two exceptions that carry meaning rather than decoration:
           the selected date, and the accent rail on an open compound group. */
        .an-datebar :global(.week-day-card.active),
        .an-datebar :global(.week-day-card.selected) {
          border: 3px solid rgba(212, 42, 85, 0.55) !important;
        }

        /* Surfaces lean on tint + shadow now that edges are gone */
        .an-panel {
          box-shadow: 0 10px 34px rgba(46, 26, 14, 0.13);
        }
        .an-page :global(input),
        .an-page :global(select),
        .an-page :global(textarea:not(.chat-input)),
        .an-page :global(.search-input-clean),
        .an-page :global(.quantity-input),
        .an-page :global(.unit-select),
        .an-page :global(.age-input),
        .an-page :global(.activity-select) {
          background: rgba(255, 255, 255, 0.78) !important;
        }
        .an-page :global(.cc-tab--active) {
          background: rgba(255, 255, 255, 0.78) !important;
        }
        .an-page :global(button:focus-visible),
        .an-page :global(input:focus-visible),
        .an-page :global(select:focus-visible),
        .an-page :global(textarea:not(.chat-input):focus-visible) {
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(46, 26, 14, 0.30) !important;
        }
        .an-datebar :global(.week-strip-container) {
          box-shadow: 0 6px 20px rgba(46, 26, 14, 0.10);
        }
        :global(.search-dropdown.an-portal) {
          box-shadow: 0 16px 44px rgba(46, 26, 14, 0.24) !important;
        }
        :global(.an-portal .search-dropdown-item.banded) {
          background: rgba(46, 26, 14, 0.045) !important;
        }
        .an-page :global(.search-add-unknown-btn) {
          background: var(--action) !important;
          color: var(--action-ink) !important;
        }
        :global(.an-portal .search-add-unknown-btn) {
          background: var(--action, #2e1a0e) !important;
          color: #fff9f7 !important;
        }

        /* Sex picker: each sign keeps its own colour when selected —
           male reads black, female keeps the rouge. */
        .an-page :global(.picker-opt--male.sel svg) { color: #14100e !important; }
        .an-page :global(.picker-opt--female.sel svg) { color: var(--coral) !important; }

        /* ── Add-food modal: stays dark on purpose ──
           .smart-modal-panel hardcodes #1a1a1a in globals.css, but it lives
           inside .an-page and was inheriting that scope's LIGHT text tokens —
           dark ink on a dark panel. Re-assert the dark-theme values for its
           subtree so the two halves agree. Internal tool, not customer-facing. */
        :global(.smart-modal-panel) {
          --text-1: #e8e8f4;
          --text-2: #a0a0b8;
          --text-3: #7a7a90;
          --white: #ffffff;
          --bg: #101014;
          --bg-soft: #16161c;
          --bg-accent: #0f0f0f;
          --surface: #0e0e12;
          --border: #2a2a32;
          --border-soft: #22222a;
          --divider: #2a2a32;
          --gray-50: rgba(255, 255, 255, 0.03);
          --gray-100: rgba(255, 255, 255, 0.06);
          --gray-200: rgba(255, 255, 255, 0.10);
          --gray-300: rgba(255, 255, 255, 0.18);
          color: #e8e8f4;
        }
        :global(.smart-modal-panel input),
        :global(.smart-modal-panel select),
        :global(.smart-modal-panel textarea) {
          background: rgba(255, 255, 255, 0.07) !important;
          color: #e8e8f4 !important;
        }
        :global(.smart-modal-panel input::placeholder),
        :global(.smart-modal-panel textarea::placeholder) {
          color: rgba(232, 232, 244, 0.42) !important;
        }
        :global(.smart-modal-panel .progress-overlay) {
          background: rgba(10, 10, 12, 0.94) !important;
        }
        :global(.smart-modal-panel button:focus-visible),
        :global(.smart-modal-panel input:focus-visible),
        :global(.smart-modal-panel textarea:focus-visible) {
          box-shadow: 0 0 0 3px rgba(232, 232, 244, 0.35) !important;
        }

        /* Section titles sit ABOVE their content.
           globals.css positions .section-label absolute (top:8px/left:14px) so
           it floated over the panel; that only worked with the old 150px
           padding, which this layout drops. */
        .an-page :global(.section-label) {
          position: static !important;
          display: block !important;
          top: auto !important;
          left: auto !important;
          text-align: left !important;
          order: -1;
        }
        /* the logging column's title leads the stack */
        .an-log > :global(.section-label) { order: -2; }
        .an-log { position: relative; }

        /* Month title above the week strip */
        .an-datebar {
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .an-datebar :global(.an-month) {
          margin: 0 !important;
          align-self: center;
          text-align: center !important;
        }

        /* Macro rings: centre the SVG on the disc regardless of either size.
           globals.css pins it top:0/left:0 at a fixed 80px while .rc-macros
           resizes the box to 76px, so any size change knocks it off-centre. */
        .an-page :global(.macros-grid) {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          justify-items: center !important;
          align-items: start !important;
        }
        .an-page :global(.macro-item) {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        .an-page :global(.macro-ring) {
          position: relative !important;
          margin: 0 auto 8px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex: 0 0 auto !important;
        }
        .an-page :global(.macro-ring svg) {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          margin: auto !important;
        }
        /* the value sits above the arc, dead centre */
        .an-page :global(.macro-ring > span) {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: baseline;
          justify-content: center;
          line-height: 1;
        }
        /* Ring sizing — the SVG scales with the box (inset:0 / 100%), so only
           these two numbers need to change. */
        .an-page :global(.macro-ring) {
          width: 104px !important;
          height: 104px !important;
        }
        .an-page :global(.macro-ring-val) { font-size: 30px !important; }
        .an-page :global(.macro-ring-unit) { font-size: 17px !important; }
        .an-page :global(.macro-label) { font-size: 16px !important; }
        .an-page :global(.macros-grid) { column-gap: 20px !important; }

        /* ═══ Layout v3 (2026-09-14) — the AI chat is the page ═══
           Logging sits inline at the top, full width: chat first, manual
           search as a secondary tab. Below it: today's food and macros side
           by side, then the compound analysis. The + button / modal is gone. */

        .an-panel--macros {
          display: block;
        }
        /* Desktop: the chat's side list (.chat-aside) is the food list —
           this standalone section is mobile-only, see the media query
           below where the breakpoint matches .chat-box--split's. */
        .an-panel--foods {
          display: none;
        }
        .an-panel--foods :global(.food-list) {
          max-height: none !important;
          overflow: visible !important;
          padding: 4px 0 !important;
        }
        /* Touch-first: no hover on mobile, so the remove button can't be
           hover-gated the way the old sidebar version had it. */
        .an-panel--foods :global(.food-item-remove) {
          opacity: 1 !important;
          width: 32px;
          height: 32px;
          margin-left: 10px;
          padding: 0 !important;
          border-radius: 50%;
          background: rgba(212, 42, 85, 0.10) !important;
          color: #d42a55 !important;
          font-size: 14px;
        }
        .an-page :global(.food-selectable) {
          cursor: pointer;
          padding: 9px 14px !important;
          margin-bottom: 3px;
          gap: 14px !important;
          border-radius: 10px;
          transition: background 0.15s ease;
        }
        .an-page :global(.food-selectable:hover) { background: rgba(46, 26, 14, 0.04); }
        .an-page :global(.food-selectable.is-selected) { background: rgba(212, 42, 85, 0.09); }
        .an-page :global(.food-selectable:focus-visible) { outline: 2px solid #d42a55; outline-offset: -2px; }
        /* Floats in the corner so showing/hiding it never moves the list */
        .an-page :global(.food-select-clear) {
          position: absolute;
          top: 22px;
          right: 24px;
          border: none;
          background: none;
          padding: 0;
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #d42a55;
          cursor: pointer;
        }
        .an-foods-head { position: relative; }
        .an-foods-head :global(.food-select-clear) { top: 50%; right: 0; transform: translateY(-50%); }
        .an-panel--foods :global(.food-item-remove:hover) {
          background: #d42a55 !important;
          color: #ffffff !important;
        }
        @media (max-width: 820px) {
          .an-panel--foods { display: block; }
        }

        /* Two boxes side by side on desktop, stacked on a phone */
        .an-container {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 20px;
        }
        .an-datebar,
        .an-panel--compounds {
          grid-column: 1 / -1;
        }

        /* ── "Today" panel header — label left, add button top-right ── */
        .an-foods-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .an-foods-head :global(.section-label) { margin: 0 0 -6px !important; }
        /* ── Log panel — chat first, full width, always open ── */
        /* Bare: the chat box is its own container, styled like the front
           page input (see FoodLogChat). Size must match CHAT_* in
           lib/chat-handoff.ts or the front-page transition lands off-target. */
        .an-panel--log {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .an-panel--log :global(.chat-box) {
          width: 100%;
          height: var(--chat-h);
          margin: 0 auto;
        }
        /* Chrome-style tabs: the active tab is cut from the same material as
           the box below and merges into it; inactive tabs sit on the page. */
        .an-panel--log .cc-tabs {
          width: 100%;
          margin: 0 !important;
          padding: 0 0 0 24px !important;
          border: none !important;
          background: transparent !important;
          gap: 4px !important;
          align-items: flex-end !important;
          justify-content: flex-start !important;
          position: relative;
          z-index: 1;
        }
        .an-panel--log .cc-tab-sep { display: none !important; }
        .an-panel--log .cc-tab {
          position: relative;
          padding: 10px 22px !important;
          margin-bottom: -2px;
          border: 2px solid transparent !important;
          border-bottom: none !important;
          border-radius: 14px 14px 0 0 !important;
          background: rgba(255, 247, 244, 0.4) !important;
          color: rgba(46, 26, 14, 0.55) !important;
          box-shadow: none !important;
        }
        .an-panel--log .cc-tab:hover:not(.cc-tab--active) {
          background: rgba(255, 247, 244, 0.65) !important;
          color: #2e1a0e !important;
        }
        .an-panel--log .cc-tab--active {
          background: #fff7f4 !important;
          border-color: rgba(46, 26, 14, 0.12) !important;
          color: #2e1a0e !important;
          padding-bottom: 12px !important;
        }
        /* Covers the box's top border under the tab, so they read as one piece */
        .an-panel--log .cc-tab--active::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: -2px;
          height: 4px;
          background: #fff7f4;
        }
        /* Manual search renders inside a plain .chat-box (no aside — the
           food list moved out to its own .an-panel--foods section below,
           2026-09-18) so it gets that box's sizing, background and shadow
           for free. This is just the content inside .chat-main: a big
           centered search field, then a slim add-row beneath it. */
        .an-panel--log .cc-search-pane {
          flex: 1;
          min-height: 0;
          box-sizing: border-box;
          width: 100%;
          padding: var(--chat-pad) 0 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 24px;
        }
        .an-panel--log .search-field-outer,
        .an-panel--log .add-row {
          width: 100%;
          max-width: 640px;
        }
        .an-panel--log .search-bar-wrap { max-width: 100%; }

        /* Search field — same material as the chat input: white, soft
           shadow, a border that only shows up on focus. */
        .an-page .an-panel--log :global(.search-icon) {
          left: 24px;
        }
        .an-page .an-panel--log :global(.search-icon svg) {
          width: 22px;
          height: 22px;
        }
        .an-page .an-panel--log :global(.search-input-clean) {
          width: 100%;
          box-sizing: border-box;
          padding: 22px 52px 22px 58px !important;
          font-family: var(--font-body);
          font-size: clamp(1.1rem, 2.6vw, 1.4rem) !important;
          background: #ffffff !important;
          border: 3px solid transparent !important;
          border-radius: 12px !important;
          box-shadow: 0 6px 22px rgba(46, 26, 14, 0.12) !important;
        }
        .an-page .an-panel--log :global(.search-input-clean:focus) {
          border-color: #2e1a0e !important;
          box-shadow: 0 6px 22px rgba(46, 26, 14, 0.12) !important;
        }
        .an-page .an-panel--log :global(.search-input-clean:disabled) {
          opacity: 0.6;
          cursor: default;
        }
        .cc-action-error {
          width: 100%;
          max-width: 640px;
          margin: 0;
          font-family: var(--font-mono);
          font-size: 14px;
          color: var(--warn);
        }
        .an-page .an-panel--log :global(.search-clear-btn) {
          right: 20px;
          font-size: 20px;
        }

        /* Quantity / unit / add — a slim pill row under the search field */
        .an-panel--log .add-row {
          margin: 0;
          gap: 12px;
          flex-wrap: wrap;
        }
        .an-page .an-panel--log :global(.quantity-input),
        .an-page .an-panel--log :global(.unit-select) {
          height: 54px !important;
          min-height: 54px;
          font-family: var(--font-body);
          font-size: 17px !important;
          background: #ffffff !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 14px rgba(46, 26, 14, 0.08) !important;
        }
        .an-page .an-panel--log :global(.add-btn) {
          height: 54px !important;
          margin-top: 0 !important;
          padding: 0 26px !important;
          border-radius: 10px !important;
          font-size: 17px !important;
          font-weight: 500 !important;
          box-shadow: 0 5px 0 var(--action-dark) !important;
        }
        .an-page .an-panel--log :global(.add-btn:hover:not(:disabled)) {
          box-shadow: 0 2px 0 var(--action-dark) !important;
        }


        /* Phone: quantity + unit share a row, Add food takes its own —
           three equal flex items get too cramped to read below ~480px. */
        @media (max-width: 480px) {
          .an-panel--log .add-row {
            flex-wrap: wrap;
          }
          .an-page .an-panel--log :global(.quantity-input) { flex: 1 1 30%; }
          .an-page .an-panel--log :global(.unit-select) { flex: 1 1 30%; }
          .an-page .an-panel--log :global(.add-btn) { flex: 1 1 100%; }
        }

        /* ═══ Layout v4 (2026-09-14) — one column, cause → effect ═══
           Chat (what you say) → Today (what got logged) → Macros (what it
           adds up to) → Compounds (the detail). Every panel full width. */
        .an-container {
          grid-template-columns: minmax(0, 1fr);
        }

        /* Macros: the gear header + shapes live in their own white card;
           kcal/water sit outside it, plain, on the page background. */
        .an-panel--macros .rc-macros {
          border-bottom: none;
        }
        .an-panel--macros {
          padding: 32px !important;
        }
        .an-page :global(.mv-card) {
          position: relative;
          width: 100%;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 6px 22px rgba(46, 26, 14, 0.12);
          padding: 32px 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        /* Gear floats in the card's corner so it adds no header row */
        .an-page :global(.mv-section-head) {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 2;
        }

        /* Mobile default: kcal/water above, card below, no divider */
        .an-page :global(.mv-layout) {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          width: 100%;
        }
        .an-page :global(.mv-hero-col) {
          display: flex;
          flex-direction: row;
          justify-content: space-evenly;
          width: 100%;
          gap: 24px;
          order: -1;
        }
        .an-page :global(.mv-hero-col) :global(.hero-stat-icon) {
          width: 60px !important;
          height: 60px !important;
          margin: 0 auto 10px !important;
          display: block;
        }

        /* Desktop: macros card and kcal/water side by side, equal width,
           no separator — stacks back to the mobile order below 860px. */
        @media (min-width: 860px) {
          .an-page :global(.mv-layout) {
            flex-direction: row;
            justify-content: center;
            align-items: stretch;
            gap: 44px;
          }
          .an-page :global(.mv-card) {
            width: auto;
            flex: 1 1 0;
          }
          .an-page :global(.mv-hero-col) {
            flex: 1 1 0;
            flex-direction: row;
            justify-content: space-evenly;
            align-items: center;
            gap: 0;
            order: 0;
          }
        }

        @media (max-width: 600px) {
          .an-page :global(.mv-card) { padding: 26px 22px 22px; }
          .an-page :global(.mv-hero-col) :global(.hero-stat-icon) {
            width: 46px !important;
            height: 46px !important;
          }
        }

        /* Today: roomy full-width rows, name left, portion + remove right */
        .an-panel--foods :global(.food-item) {
          padding: 14px 4px !important;
          gap: 16px;
        }
        .an-panel--foods :global(.food-item-name) {
          flex: 1;
          min-width: 0;
        }
        .an-panel--foods :global(.food-item-meta) {
          margin-left: auto;
          white-space: nowrap;
        }

        /* ── Personal info: one slim strip in a white box, same recipe as the
           chat input (white, 12px radius, house shadow). ── */
        .an-analysis-head {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 72px;
        }
        .picker--bare {
          display: grid !important;
          grid-template-columns: 1fr 1fr 1.3fr;
          align-items: center !important;
          width: min(600px, 100%);
          padding: 14px 28px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 6px 22px rgba(46, 26, 14, 0.12);
        }
        /* Three equal-feeling cells, content centred in each, hairlines between */
        .picker--bare :global(.picker-group) { display: flex; align-items: center; justify-content: center; gap: 14px; }
        .picker--bare :global(.picker-divider) { height: 22px; }
        .picker--bare :global(.picker-opt svg) { width: 32px; height: 32px; }
        .picker--bare :global(.picker-fields) { display: contents; }
        .picker--bare :global(.picker-age-row),
        .picker--bare :global(.picker-activity-row) {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 10px;
          padding: 6px 0;
          border-left: 2px solid rgba(46, 26, 14, 0.12);
        }
        .an-page .picker--bare :global(.picker-label) {
          font-family: var(--font-mono);
          font-size: 12px !important;
          font-weight: 400;
          letter-spacing: 0.1em;
          color: rgba(46, 26, 14, 0.5);
        }
        /* Inputs as bare text on a hairline underline (a box-shadow: the page
           strips borders) */
        .an-page .picker--bare :global(.age-input),
        .an-page .picker--bare :global(.activity-select) {
          appearance: none;
          -webkit-appearance: none;
          background-color: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: inset 0 -1px 0 rgba(46, 26, 14, 0.25) !important;
          padding: 2px 0 !important;
          font-family: var(--font-mono);
          font-size: 16px !important;
          color: #2e1a0e;
          outline: none;
        }
        .an-page .picker--bare :global(.age-input) {
          width: 32px;
          text-align: center;
        }
        .an-page .picker--bare :global(.activity-select) {
          padding-right: 16px !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%232e1a0e' stroke-opacity='0.5' stroke-width='1.5'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 2px center !important;
          cursor: pointer;
        }
        .an-page .picker--bare :global(.age-input:focus),
        .an-page .picker--bare :global(.activity-select:focus) {
          box-shadow: inset 0 -2px 0 #2e1a0e !important;
        }
        @media (max-width: 600px) {
          .picker--bare { grid-template-columns: 1fr 1fr; row-gap: 10px; padding: 14px 20px; }
          .picker--bare :global(.picker-group) { grid-column: 1 / -1; }
          .picker--bare :global(.picker-age-row) { border-left: none; }
        }

        /* ── Phone ── */
        @media (max-width: 820px) {
          .an-container {
            grid-template-columns: 1fr;
          }
        }

        /* ── Grid children must be allowed to shrink ──
           fr / auto tracks default to min-width:auto, so a long nutrient
           name refuses to shrink and pushes the row past the viewport (the
           "cuts off to the right" bug below ~450px). */
        .an-page :global(.nutrient-row) > :global(*) { min-width: 0; }
        .an-page :global(.nutrient-name) {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ── Narrow phones — scale down instead of overflowing ── */
        @media (max-width: 500px) {
          .an-container { padding: 12px 10px 48px; gap: 14px; }
          .an-panel { padding: 14px; border-radius: 12px; min-width: 0; }

          /* Macro rings: 3-up no longer fits at 104px — shrink the disc.
             The SVG is inset:0/100%, so only the box size needs changing. */
          .an-page :global(.macro-ring) { width: 76px !important; height: 76px !important; }
          .an-page :global(.macro-ring-val) { font-size: 20px !important; }
          .an-page :global(.macro-ring-unit) { font-size: 15px !important; }
          .an-page :global(.macros-grid) {
            column-gap: 4px !important;
            min-width: 0;
            max-width: 100%;
          }
          .an-page :global(.macro-label) { font-size: 15px !important; }
          /* KCAL / WATER header stats — 80px gap is too wide on a phone */
          .an-page :global(.hero-row) { gap: 24px !important; }
          .an-page :global(.hero-stat-num) { font-size: 48px !important; }

          /* Nutrient rows: two columns (name | value), the DV bar wraps to its
             own full-width line. flex-wrap can't overflow the way the 4-track
             grid does. */
          .an-page :global(.nutrient-row) {
            display: flex !important;
            flex-wrap: wrap;
            align-items: center;
            gap: 4px 8px !important;
            padding: 9px 8px !important;
          }
          .an-page :global(.nutrient-row) > :global(.nutrient-name) { flex: 1 1 auto; }
          .an-page :global(.nutrient-row) > :global(.nutrient-value) { flex: 0 0 auto; }
          /* confidence dots right-aligned at the row's edge */
          .an-page :global(.nutrient-row) > :global(.confidence-badge) {
            flex: 0 0 auto;
            margin-left: auto;
            text-align: right;
          }
          /* the tooltip wrapper around the DV bar (and any bare bar) goes full width */
          .an-page :global(.nutrient-row) > :global(.tooltip-container),
          .an-page :global(.nutrient-row) > :global(.dv-bar-wrapper) {
            flex: 1 1 100%;
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
}
