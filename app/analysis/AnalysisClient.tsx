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
import { WeekStrip } from '@/components/calendar';

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

// Helper to get zone color for progress bars
function getZoneColor(zone: string): string {
  switch (zone) {
    case 'deficient': return '#ef4444'; // Red
    case 'low': return '#f97316'; // Orange
    case 'optimal': return '#22c55e'; // Green
    case 'high': return '#eab308'; // Yellow
    case 'excess': return '#ef4444'; // Red
    default: return '#6b7280'; // Gray for unknown
  }
}

// Confidence badge component
function ConfidenceBadge({ tier }: { tier: 1 | 2 | 3 | null }) {
  if (tier === null) return <span className="confidence-badge">---</span>;

  const dots = tier === 1 ? '●○○' : tier === 2 ? '●●○' : '●●●';
  return <span className={`confidence-badge tier-${tier}`}>{dots}</span>;
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

// Recursive component for hierarchical group display
function HierarchicalGroup({
  group,
  expandedGroups,
  toggleGroup,
  allCompounds,
  getNutrientValue,
  formatAmount,
  selectedMealIds,
  depth = 0,
  rowIndex = 0,
}: {
  group: any;
  expandedGroups: { [key: string]: boolean };
  toggleGroup: (id: string) => void;
  allCompounds: any[];
  getNutrientValue: (id: string) => {
    amount: number;
    unit: string;
    rdaPercent: number | null;
    zone: 'deficient' | 'low' | 'optimal' | 'high' | 'excess' | 'unknown';
    dailyValue: { value: number; unit: string; source: string | null } | null;
    showProgressBar: boolean;
    confidence: number | null;
    confidenceTier: 1 | 2 | 3 | null;
  } | null;
  formatAmount: (amount: number, unit: string) => string;
  selectedMealIds: string[];
  depth?: number;
  rowIndex?: number;
}) {
  const isExpanded = expandedGroups[group.id];
  const hasChildren = group.children && group.children.length > 0;

  // Get compounds for this group
  const excludedCompounds = ['Energy', 'Water', 'Ash', 'Protein', 'Total Carbohydrate', 'Total Fat'];
  const groupCompounds = allCompounds.filter((c) => {
    if (excludedCompounds.includes(c.name)) return false;

    // If group has specific compound names, match by name
    if (group.compoundNames && group.compoundNames.length > 0) {
      return group.compoundNames.includes(c.name);
    }

    // Otherwise match by compound type (for leaf nodes without specific names)
    if (!hasChildren && group.compoundTypes) {
      return group.compoundTypes.includes(c.compound_type);
    }

    return false;
  });

  // Get representative compound data (for showing value on group header)
  // Note: We search ALL compounds here, not filtered by excludedCompounds
  const representativeCompound = group.representativeCompound
    ? allCompounds.find((c) => c.name === group.representativeCompound)
    : null;
  const representativeData = representativeCompound
    ? getNutrientValue(representativeCompound.id)
    : null;
  const hasRepresentativeValue = representativeData && representativeData.amount > 0;
  const representativeDisplayValue = hasRepresentativeValue
    ? formatAmount(representativeData.amount, representativeData.unit)
    : representativeCompound ? `-- ${representativeCompound.unit}` : null;
  // Use real DV percent from API, capped at 100% for display
  const representativeDvPercent = representativeData?.rdaPercent != null
    ? Math.min(100, representativeData.rdaPercent)
    : 0;
  const representativeZone = representativeData?.zone || 'unknown';
  const representativeShowBar = representativeData?.showProgressBar ?? false;

  // Filter out the representative compound from nested display
  const nestedCompounds = group.representativeCompound
    ? groupCompounds.filter((c) => c.name !== group.representativeCompound)
    : groupCompounds;

  // Show compounds at leaf nodes (no children) or if group has specific compound names
  const showCompounds = (!hasChildren || group.compoundNames) && nestedCompounds.length > 0;
  const hasContent = hasChildren || showCompounds;

  // Count total compounds in this group and all children (excluding representative)
  const countCompounds = (g: any): number => {
    let count = 0;
    if (g.compoundNames) {
      const compounds = allCompounds.filter((c) => !excludedCompounds.includes(c.name) && g.compoundNames.includes(c.name));
      // Don't count representative compound
      count += compounds.filter((c) => c.name !== g.representativeCompound).length;
    } else if (!g.children && g.compoundTypes) {
      count += allCompounds.filter((c) => !excludedCompounds.includes(c.name) && g.compoundTypes.includes(c.compound_type)).length;
    }
    if (g.children) {
      g.children.forEach((child: any) => count += countCompounds(child));
    }
    return count;
  };
  const totalCount = countCompounds(group);

  // Determine if this is a "value-only" group (has representative but no nested children to show)
  const isValueOnlyGroup = group.representativeCompound && nestedCompounds.length === 0 && !hasChildren;

  return (
    <div className="category-section" style={{ marginLeft: depth > 0 ? `${depth * 12}px` : 0, marginRight: depth > 0 ? `${depth * 8}px` : 0 }}>
      <div
        className={`nutrient-row group-row${rowIndex % 2 === 1 ? ' banded' : ''}`}
        onClick={() => hasContent && !isValueOnlyGroup && toggleGroup(group.id)}
        style={{
          cursor: hasContent && !isValueOnlyGroup ? 'pointer' : 'default',
          paddingTop: `${8 + Math.max(0, 8 - depth * 2)}px`,
          paddingBottom: `${8 + Math.max(0, 8 - depth * 2)}px`,
        }}
      >
        <div className="nutrient-name">
          {hasContent && !isValueOnlyGroup && (isExpanded ? '▼' : '▶')}
          {(!hasContent || isValueOnlyGroup) && '•'}
          {' '}
          {group.name}
        </div>
        <div className={`nutrient-value ${hasRepresentativeValue ? 'has-value' : ''}`}>
          {representativeDisplayValue || (totalCount > 0 ? `${totalCount}` : '')}
        </div>
        <ConfidenceBadge tier={representativeData?.confidenceTier ?? null} />
        {representativeCompound ? (
          <CompoundTooltip
            compoundId={representativeCompound.id}
            compoundName={representativeCompound.name}
            mealIds={selectedMealIds}
          >
            <DvBar rdaPercent={representativeData?.rdaPercent ?? null} dailyValue={representativeData?.dailyValue ?? null} />
          </CompoundTooltip>
        ) : (
          <DvBar rdaPercent={representativeData?.rdaPercent ?? null} dailyValue={representativeData?.dailyValue ?? null} />
        )}
      </div>

      {isExpanded && !isValueOnlyGroup && (
        <div className="category-content">
          {/* Render compounds for this group if it has specific names (excluding representative) */}
          {group.compoundNames && nestedCompounds.map((compound: any) => {
            const nutrientData = getNutrientValue(compound.id);
            const hasValue = nutrientData && nutrientData.amount > 0;
            const displayValue = hasValue
              ? formatAmount(nutrientData.amount, nutrientData.unit)
              : `-- ${compound.unit}`;
            // Use real DV percent from API
            const dvPercent = nutrientData?.rdaPercent != null
              ? Math.min(100, nutrientData.rdaPercent)
              : 0;
            const zone = nutrientData?.zone || 'unknown';
            const showBar = nutrientData?.showProgressBar ?? false;

            return (
              <div key={compound.id} className="nutrient-row">
                <div className="nutrient-name">{compound.name}</div>
                <div className={`nutrient-value ${hasValue ? 'has-value' : ''}`}>
                  {displayValue}
                </div>
                <ConfidenceBadge tier={nutrientData?.confidenceTier ?? null} />
                {/* Always show progress bar - active if DV exists, inactive if not */}
                <CompoundTooltip
                  compoundId={compound.id}
                  compoundName={compound.name}
                  mealIds={selectedMealIds}
                >
                  <DvBar rdaPercent={nutrientData?.rdaPercent ?? null} dailyValue={nutrientData?.dailyValue ?? null} />
                </CompoundTooltip>
              </div>
            );
          })}

          {/* Render child groups */}
          {hasChildren && group.children.map((child: any, index: number) => (
            <HierarchicalGroup
              key={child.id}
              group={child}
              expandedGroups={expandedGroups}
              toggleGroup={toggleGroup}
              allCompounds={allCompounds}
              getNutrientValue={getNutrientValue}
              formatAmount={formatAmount}
              selectedMealIds={selectedMealIds}
              depth={depth + 1}
              rowIndex={index}
            />
          ))}

          {/* Render compounds at leaf nodes (no children, no specific names) */}
          {!hasChildren && !group.compoundNames && nestedCompounds.map((compound: any) => {
            const nutrientData = getNutrientValue(compound.id);
            const hasValue = nutrientData && nutrientData.amount > 0;
            const displayValue = hasValue
              ? formatAmount(nutrientData.amount, nutrientData.unit)
              : `-- ${compound.unit}`;
            // Use real DV percent from API
            const dvPercent = nutrientData?.rdaPercent != null
              ? Math.min(100, nutrientData.rdaPercent)
              : 0;
            const zone = nutrientData?.zone || 'unknown';

            return (
              <div key={compound.id} className="nutrient-row">
                <div className="nutrient-name">{compound.name}</div>
                <div className={`nutrient-value ${hasValue ? 'has-value' : ''}`}>
                  {displayValue}
                </div>
                <ConfidenceBadge tier={nutrientData?.confidenceTier ?? null} />
                {/* Always show progress bar - active if DV exists, inactive if not */}
                <CompoundTooltip
                  compoundId={compound.id}
                  compoundName={compound.name}
                  mealIds={selectedMealIds}
                >
                  <DvBar rdaPercent={nutrientData?.rdaPercent ?? null} dailyValue={nutrientData?.dailyValue ?? null} />
                </CompoundTooltip>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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
  const [logOpen, setLogOpen] = useState(false);

  // Esc closes the logging modal; body scroll is locked while it's open.
  useEffect(() => {
    if (!logOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLogOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [logOpen]);

  // Day strip scroll offset (independent of selected date)
  const [dayStripOffset, setDayStripOffset] = useState(0);

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

  // Fetch a ±45-day window around selected date on mount / date change
  useEffect(() => {
    const center = new Date(selectedDate + 'T12:00:00');
    const from = new Date(center);
    from.setDate(from.getDate() - 45);
    const to = new Date(center);
    to.setDate(to.getDate() + 45);
    fetchDatesWithData(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10));
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
  useEffect(() => {
    async function fetchCompoundDVs() {
      if (initialCompounds.length === 0) return;

      try {
        const compoundIds = initialCompounds.map((c: any) => c.id);
        const res = await fetch(apiUrl('/api/daily-values'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            compoundIds,
            age: profileAge,
            sex: sex === 'male' ? 'MALE' : 'FEMALE',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setCompoundDVs(data.dailyValues || {});
        } else {
          console.error('Failed to fetch compound DVs:', res.status, res.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch compound DVs:', error);
      }
    }
    fetchCompoundDVs();
  }, [initialCompounds, profileAge, sex]);

  // Fetch meals when date changes
  useEffect(() => {
    fetchMealsForDate(selectedDate);
  }, [selectedDate]);

  // Refetch daily totals when the DV picker (age/sex) changes — needed so rdaPercent
  // is recomputed server-side against the new demographic-driven targets.
  useEffect(() => {
    fetchDailyTotals(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileAge, sex]);

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

  useEffect(() => { fetchDefinitions(); }, []);

  // Fetch symptoms when date changes
  useEffect(() => {
    fetchSymptomsForDate(selectedDate);
  }, [selectedDate]);

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
    } catch (error) {
      console.error('Failed to fetch symptoms:', error);
      setSymptoms([]);
    } finally {
      setSymptomsLoading(false);
    }
  }

  // Debounced food search
  useEffect(() => {
    // Clear results if query is empty
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    // Debounce search (wait 500ms after user stops typing)
    setSearchLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          limit: '20',
        });

        const res = await fetch(apiUrl(`/api/foods/search?${params}`));

        if (!res.ok) {
          throw new Error(`Search failed: ${res.statusText}`);
        }

        const data = await res.json();
        setSearchResults(data.results || []);

        // Show suggestions if no results
        if (data.metadata?.suggestions?.length > 0) {
        }
      } catch (error) {
        console.error('Food search error:', error);
        setSearchError(error instanceof Error ? error.message : 'Search failed');
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    // Cleanup timeout on query change
    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  async function fetchDailyTotals(date: string, mealIdsToFilter?: string[]) {
    try {
      setTotalsLoading(true);
      const params = new URLSearchParams({
        date,
        age: String(profileAge),
        sex: sex === 'male' ? 'MALE' : 'FEMALE',
      });

      // Add meal filter if specific meals are selected (not all)
      const filterIds = mealIdsToFilter || selectedMealIds;
      if (filterIds.length > 0 && filterIds.length < meals.length) {
        params.append('mealIds', filterIds.join(','));
      }

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

  async function fetchMealsForDate(date: string, preserveActiveTab = false) {
    try {
      setMealsLoading(true);
      if (!preserveActiveTab) {
        setActiveTab(''); // Reset active tab only when changing dates
      }
      const params = new URLSearchParams({ date });
      const res = await fetch(apiUrl(`/api/meals?${params}`));

      if (!res.ok) {
        throw new Error('Failed to fetch meals');
      }

      const data = await res.json();
      const loadedMeals = data.meals || [];
      setMeals(loadedMeals);

      // Initialize selected meals to ALL meals (default behavior)
      const allMealIds = loadedMeals.map((m: any) => m.id);
      setSelectedMealIds(allMealIds);

      // Set active tab to first meal if not already set
      if (loadedMeals.length > 0 && !activeTab) {
        setActiveTab(loadedMeals[0].mealType || loadedMeals[0].id);
      }


      // Fetch daily totals after meals are loaded (with all meals selected)
      fetchDailyTotals(date, allMealIds);
    } catch (error) {
      console.error('Failed to fetch meals:', error);
      setMeals([]);
      setSelectedMealIds([]);
    } finally {
      setMealsLoading(false);
    }
  }

  // Selected food handlers
  const handleSelectFood = async (food: any) => {
    setSelectedFood(food);
    setSearchQuery(''); // Clear search
    setDropdownOpen(false);
    setFoodPortions([]);
    setSelectedQuantity('100');
    setSelectedUnit('g');

    // Fetch portions for imported foods (UUIDs)
    if (food?.isImported && food?.id) {
      try {
        const res = await fetch(apiUrl(`/api/foods/${food.id}/portions`));
        if (res.ok) {
          const data = await res.json();
          const portions = data.portions || [];
          if (portions.length > 0) {
            setFoodPortions(portions);
            const def = portions.find((p: any) => p.isDefault) || portions[0];
            setSelectedUnit(def.id);
            setSelectedQuantity('1');
          }
        }
      } catch (error) {
        console.error('Failed to fetch food portions:', error);
      }
    }
  };

  const handleRemoveSelectedFood = () => {
    setSelectedFood(null);
    setSelectedQuantity('100');
    setSelectedUnit('g');
    setFoodPortions([]);
  };

  const handleRemoveMealItem = async (mealItemId: string) => {
    try {

      const res = await fetch(apiUrl(`/api/meals/items/${mealItemId}`), {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to remove meal item');
      }

      // Refresh meals to show updated list (preserve active tab)
      await fetchMealsForDate(selectedDate, true);

    } catch (error) {
      console.error('Failed to remove meal item:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to remove item');
    }
  };

  const handleAddFoodToMeal = async () => {
    if (!selectedFood) return;

    // Import USDA food if needed (if it's not already in database)
    let foodId = selectedFood.id;

    try {
      setAddingFood(true);

      // If food is from USDA (not imported), import it first
      if (!selectedFood.isImported) {
        const importRes = await fetch(apiUrl('/api/foods/import'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fdcId: selectedFood.fdcId })
        });

        if (!importRes.ok) {
          throw new Error('Failed to import food');
        }

        const importData = await importRes.json();
        foodId = importData.food.id;
      }

      // Compute actual grams — if a portion is selected, multiply quantity by its gramWeight.
      // Otherwise treat selectedQuantity as raw grams (legacy hardcoded-unit fallback).
      const qty = parseFloat(selectedQuantity);
      const chosenPortion = foodPortions.find((p) => p.id === selectedUnit);
      const portionGrams = chosenPortion ? qty * chosenPortion.gramWeight : qty;
      const portionLabel = chosenPortion ? chosenPortion.description : selectedUnit;

      // Use first existing meal for the day, or auto-create "Today"
      const existingMeal = meals[0];

      let res;
      if (existingMeal) {
        res = await fetch(apiUrl(`/api/meals/${existingMeal.id}/items`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            foods: [{
              foodId: foodId,
              portionSize: portionGrams,
              portionType: portionLabel,
            }]
          })
        });
      } else {
        res = await fetch(apiUrl('/api/meals'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: selectedDate,
            mealType: 'Today',
            foods: [{
              foodId: foodId,
              portionSize: portionGrams,
              portionType: portionLabel,
            }]
          })
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add food to meal');
      }

      // Refresh meals (preserve active tab) and clear food selection
      await fetchMealsForDate(selectedDate, true);
      handleRemoveSelectedFood();

    } catch (error) {
      console.error('Failed to add food to meal:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to add food');
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

          {/* ── PANEL — today's food list ── */}
          <section className="an-panel an-panel--foods">
            <div className="an-foods-head">
              <p className="section-label">Today</p>
              <button
                type="button"
                className="an-add"
                onClick={() => setLogOpen(true)}
                aria-label="Add food"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="an-foods">
              <div className="food-list">
                {mealsLoading ? (
                  <div className="lc-empty">Loading…</div>
                ) : (() => {
                  const allItems = meals.flatMap(m => m.items || []);
                  return allItems.length === 0 ? (
                    <div className="lc-empty">No foods logged yet</div>
                  ) : (
                    allItems.map((item: any) => (
                      <div key={item.id} className="food-item">
                        <span className="food-item-name">{item.food?.name || 'Unknown'}</span>
                        <span className="food-item-meta">{item.portionSize}{item.portionType}</span>
                        <button className="food-item-remove" onClick={() => handleRemoveMealItem(item.id)}>✕</button>
                      </div>
                    ))
                  );
                })()}
              </div>
            </div>
          </section>{/* end foods panel */}

          {/* ── PANEL — macros ── */}
          <section className="an-panel an-panel--macros">
            <div className="an-macros">
            <section className="rc-macros macros-section">
                <p className="section-label">Macros</p>
                {(() => {
                  // Ring geometry: r + strokeWidth/2 must equal the viewBox
                  // half-size (40) so the stroke's outer edge is flush with the
                  // .macro-ring disc behind it. C is that radius' circumference.
                  const C = 232.48; // 2π × 37
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
                  const protein = proteinData?.amount ?? null;
                  const carbs   = carbData?.amount    ?? null;
                  const fat     = fatData?.amount     ?? null;

                  const rings = [
                    { label: 'Protein', val: protein, fill: protein ? Math.min(protein / 50,  1) * C : 0, unit: 'g', color: 'var(--ring-1)' },
                    { label: 'Carbs',   val: carbs,   fill: carbs   ? Math.min(carbs   / 275, 1) * C : 0, unit: 'g', color: 'var(--ring-2)' },
                    { label: 'Fat',     val: fat,     fill: fat     ? Math.min(fat     / 78,  1) * C : 0, unit: 'g', color: 'var(--ring-3)' },
                  ];

                  return (
                    <>
                      <div className="hero-row">
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
                      <div className="macros-grid">
                        {rings.map(({ label, val, fill, unit, color }) => (
                          <div key={label} className="macro-item">
                            <div className="macro-ring">
                              <svg width="80" height="80" viewBox="0 0 80 80">
                                <circle cx="40" cy="40" r="37" fill="none" stroke="var(--border)" strokeWidth="6"/>
                                <circle cx="40" cy="40" r="37" fill="none" stroke={color} strokeWidth="6"
                                  strokeDasharray={`${fill} ${C}`} strokeLinecap="round" opacity="0.45"/>
                              </svg>
                              <span>
                                <span className="macro-ring-val">{val !== null ? Math.round(val) : '--'}</span>
                                <span className="macro-ring-unit">{unit}</span>
                              </span>
                            </div>
                            <p className="macro-label">{label}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </section>

            </div>{/* end an-macros */}
          </section>{/* end panel 1 */}

          {/* ── PANEL 2 — in-depth compounds ── */}
          <section className="an-panel an-panel--compounds">
              <section className="rc-compounds compounds-section">
                <p className="section-label">Analysis</p>
                <div className="compounds-header">
                  <div className="picker">
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
                    <div className="picker-group">
                      <span className={`picker-opt picker-opt--male${sex === 'male' ? ' sel' : ''}`} onClick={() => setSex('male')}>
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="10" cy="14" r="6"/>
                          <line x1="14.5" y1="9.5" x2="20" y2="4"/>
                          <polyline points="16 4 20 4 20 8"/>
                        </svg>
                      </span>
                      <span className="picker-divider" />
                      <span className={`picker-opt picker-opt--female${sex === 'female' ? ' sel' : ''}`} onClick={() => setSex('female')}>
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="6"/>
                          <line x1="12" y1="14" x2="12" y2="20"/>
                          <line x1="9" y1="18" x2="15" y2="18"/>
                        </svg>
                      </span>
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
                <div className="nutrient-categories">
                  {initialCompoundGroups.map((group, index) => (
                    <HierarchicalGroup
                      key={group.id}
                      group={group}
                      expandedGroups={expandedGroups}
                      toggleGroup={toggleGroup}
                      allCompounds={allCompounds}
                      getNutrientValue={getNutrientValue}
                      formatAmount={formatAmount}
                      selectedMealIds={selectedMealIds}
                      rowIndex={index}
                    />
                  ))}
                </div>
              </section>

          </section>{/* end panel 2 */}
        </div>{/* end an-container */}
      </main>

      {/* ── Logging modal — AI chat / manual search ── */}
      {logOpen && (
        <div
          className="an-log-scrim"
          onClick={() => setLogOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Add food"
        >
          <div className="an-log-modal" onClick={(e) => e.stopPropagation()}>
            <div className="an-log-head">
              <p className="section-label">Add food</p>
              <button
                type="button"
                className="an-log-close"
                onClick={() => setLogOpen(false)}
                aria-label="Close"
              >
                &#x2715;
              </button>
            </div>
            <div className="an-log-body">
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

                  {centerTab === 'chat' ? (
                    <FoodLogChat
                      date={selectedDate}
                      onMealLogged={() => {
                        fetchMealsForDate(selectedDate, true);
                      }}
                    />
                  ) : (
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
                            placeholder="Search foods..."
                            value={selectedFood ? selectedFood.name : searchQuery}
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
                          disabled={addingFood}
                        >
                          {addingFood ? 'Adding…' : 'Add food'}
                        </button>
                      </div>
                    </div>
                  )}
            </div>
          </div>
        </div>
      )}

      {/* Smart Add Food Modal (AI-Assisted) */}
      {/* Search dropdown portal — renders above all containers to avoid overflow clipping */}
      {!selectedFood && searchQuery && dropdownOpen && dropdownPos && createPortal(
        <div
          ref={dropdownPortalRef}
          className="search-dropdown an-portal"
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
        >
          {searchLoading && (
            <div className="search-dropdown-item" style={{ color: 'var(--text-3)' }}>Searching...</div>
          )}
          {searchError && (
            <div className="search-dropdown-item" style={{ color: 'var(--red)' }}>Error: {searchError}</div>
          )}
          {!searchLoading && !searchError && searchResults.length === 0 && (
            <div className="search-dropdown-item" style={{ color: 'var(--text-3)' }}>No results for &ldquo;{searchQuery}&rdquo;</div>
          )}
          {!searchLoading && !searchError && searchResults.map((food, i) => (
            <div key={food.fdcId || food.id} className={`search-dropdown-item${i % 2 === 1 ? ' banded' : ''}`} onClick={() => handleSelectFood(food)}>
              <div className="search-dropdown-name">{food.name}</div>
              <div className="search-dropdown-meta">
                {food.brand ? `${food.brand} · ` : ''}{food.dataSource}
              </div>
            </div>
          ))}
          {!searchLoading && !searchError && (
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
          font-size: 9px;
          letter-spacing: 0.3px;
        }
        .lc-section--calendar :global(.day-number) {
          font-size: 14px;
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
          font-size: 11px;
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
          font-size: 13px;
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
        .center-col > :global(.fc-root) {
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
          font-size: 11px;
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
        .rc-macros :global(.hero-row) {
          gap: 52px;
          margin-bottom: 32px;
        }
        .rc-macros :global(.hero-stat-num) {
          font-size: 40px;
        }
        .rc-macros :global(.hero-stat-label) {
          font-size: 12px;
        }
        .rc-macros :global(.hero-stat-icon) {
          margin-bottom: 4px;
        }
        .rc-macros :global(.macros-grid) {
          row-gap: 28px;
          column-gap: 44px;
        }
        .rc-macros :global(.macro-ring) {
          width: 76px;
          height: 76px;
        }
        .rc-macros :global(.macro-ring svg) {
          width: 76px;
          height: 76px;
        }
        .rc-macros :global(.macro-ring-val) {
          font-size: 20px;
        }
        .rc-macros :global(.macro-ring-unit) {
          font-size: 11px;
        }
        .rc-macros :global(.macro-label) {
          font-size: 12px;
        }

        /* Make the analysis age/sex picker wrap nicely in narrow column */
        .rc-compounds :global(.compounds-header) {
          flex-direction: column;
          align-items: center;
          gap: 14px;
          margin-top: 18px;
          margin-bottom: 28px;
        }

        /* Slightly larger fonts in the analysis section */
        .rc-compounds :global(.section-label) {
          font-size: 12px;
        }
        .rc-compounds :global(.nutrient-name) {
          font-size: 15px;
        }
        .rc-compounds :global(.nutrient-value) {
          font-size: 15px;
        }
        .rc-compounds :global(.picker-label) {
          font-size: 13px;
        }
        .rc-compounds :global(.age-input) {
          font-size: 15px;
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
          font-size: 14px;
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
          font-size: 13px;
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
          font-size: 14px;
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
          font-size: 12px;
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
          font-size: 13px;
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
          font-size: 14px;
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
          font-size: 18px;
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
          font-size: 12px;
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
          font-size: 13px;
          font-weight: 500;
          color: #fff;
        }

        .meal-card-foods {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .no-meals-hint {
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
          padding: 12px;
        }

        .select-all-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          padding: 6px 12px;
          font-size: 12px;
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
          font-size: 13px;
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
          font-size: 24px;
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
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          text-align: right;
        }

        .group-icon {
          margin-right: 6px;
        }

        .group-count {
          font-size: 11px;
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
          font-size: 14px;
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
          background-image: url('/nutri/design/bakgrunn.png');
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
        .an-page :global(textarea) {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(46, 26, 14, 0.2);
          border-radius: 8px;
          color: #2e1a0e;
        }
        .an-page :global(input::placeholder),
        .an-page :global(textarea::placeholder) { color: rgba(46, 26, 14, 0.42); }
        .an-page :global(input:focus-visible),
        .an-page :global(select:focus-visible),
        .an-page :global(textarea:focus-visible) {
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
          font-size: 22px !important;
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

        /* Chat pane sits directly on the cream panel */
        .an-page :global(.fc-root) { background: transparent; }

        /* ── Dark-mode leftovers found in review (2026-08-23) ── */

        /* Macro rings: a fill just lighter than the panel, no edge.
           globals.css filled this with a hard #000000 circle. */
        .an-page :global(.macro-ring) {
          background: rgba(255, 255, 255, 0.75) !important;
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
        .an-page :global(.fc-send),
        .an-page :global(.add-btn) {
          background: var(--action) !important;
          color: var(--action-ink) !important;
          box-shadow: 0 4px 0 var(--action-dark) !important;
        }
        .an-page :global(.fc-send:hover:not(:disabled)),
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
        .an-page :global(textarea:focus-visible),
        .an-page :global(button:focus-visible) {
          outline: none !important;
          box-shadow: 0 0 0 2px var(--sel-border) !important;
        }
        .an-page :global(input:focus),
        .an-page :global(textarea:focus) {
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

        /* Chat: user bubble + send button in the highlight */
        .an-page :global(.fc-msg-user .fc-bubble) {
          background: var(--action) !important;
          color: var(--action-ink) !important;
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
        .an-page :global(textarea),
        .an-page :global(.search-input-clean),
        .an-page :global(.quantity-input),
        .an-page :global(.unit-select),
        .an-page :global(.age-input),
        .an-page :global(.activity-select),
        .an-page :global(.fc-input) {
          box-shadow: none !important;
          border-width: 2px !important;
          border-style: solid !important;
          border-color: rgba(46, 26, 14, 0.22) !important;
        }
        .an-page :global(input:focus),
        .an-page :global(select:focus),
        .an-page :global(textarea:focus),
        .an-page :global(.search-input-clean:focus),
        .an-page :global(.fc-input:focus) {
          box-shadow: none !important;
          border-color: var(--sel-border) !important;
        }
        .an-page :global(input:focus-visible),
        .an-page :global(select:focus-visible),
        .an-page :global(textarea:focus-visible) {
          box-shadow: none !important;
          border-color: var(--sel-border) !important;
        }
        .an-page :global(button:focus-visible) {
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
        .an-page :global(.fc-bubble) {
          border-width: 2px !important;
        }
        .an-page :global(.fc-input-wrap) {
          border-top-width: 2px !important;
          border-top-color: rgba(46, 26, 14, 0.16) !important;
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
        .an-page :global(textarea),
        .an-page :global(.search-input-clean),
        .an-page :global(.quantity-input),
        .an-page :global(.unit-select),
        .an-page :global(.age-input),
        .an-page :global(.activity-select),
        .an-page :global(.fc-input) {
          background: rgba(255, 255, 255, 0.78) !important;
        }
        .an-page :global(.cc-tab--active) {
          background: rgba(255, 255, 255, 0.78) !important;
        }
        .an-page :global(.fc-msg-assistant .fc-bubble) {
          background: rgba(255, 255, 255, 0.72) !important;
        }
        .an-page :global(button:focus-visible),
        .an-page :global(input:focus-visible),
        .an-page :global(select:focus-visible),
        .an-page :global(textarea:focus-visible) {
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
        .an-page :global(.hero-row) {
          justify-content: center !important;
        }

        /* Ring sizing — the SVG scales with the box (inset:0 / 100%), so only
           these two numbers need to change. */
        .an-page :global(.macro-ring) {
          width: 104px !important;
          height: 104px !important;
        }
        .an-page :global(.macro-ring-val) { font-size: 26px !important; }
        .an-page :global(.macro-ring-unit) { font-size: 13px !important; }
        .an-page :global(.macro-label) { font-size: 12px !important; }
        .an-page :global(.macros-grid) { column-gap: 20px !important; }

        /* ═══ Layout v2 (2026-08-24) — logging moved out to a modal ═══
           The page is now read-only at a glance: today's food, then macros,
           then the compound analysis. Logging is one deliberate action away
           behind the FAB, which is what makes this work on a phone. */

        .an-panel--foods,
        .an-panel--macros {
          display: block;
        }
        .an-panel--foods :global(.food-list) {
          max-height: none !important;
          overflow: visible !important;
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
        .an-foods-head :global(.section-label) { margin: 0 !important; }
        .an-add {
          flex: 0 0 auto;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: none;
          background: var(--coral);
          color: var(--coral-ink);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 1px 3px 0 var(--coral-dark), 2px 5px 12px rgba(46, 26, 14, 0.22);
          transition: transform 0.08s ease, box-shadow 0.08s ease;
        }
        .an-add:hover {
          transform: translate(1px, 1px);
          box-shadow: 0 2px 0 var(--coral-dark), 1px 4px 10px rgba(46, 26, 14, 0.2);
        }
        .an-add:active {
          transform: translate(1px, 3px);
          box-shadow: 0 0 0 var(--coral-dark), 1px 2px 7px rgba(46, 26, 14, 0.18);
        }
        .an-add:focus-visible {
          outline: none;
          box-shadow: 1px 3px 0 var(--coral-dark), 0 0 0 4px rgba(46, 26, 14, 0.3);
        }

        /* ── Logging modal ── */
        .an-log-scrim {
          position: fixed;
          inset: 0;
          z-index: 3500;
          background: rgba(46, 26, 14, 0.34);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .an-log-modal {
          width: 100%;
          max-width: 620px;
          max-height: min(760px, 88vh);
          display: flex;
          flex-direction: column;
          background: var(--panel);
          border-radius: 18px;
          box-shadow: 0 24px 60px rgba(46, 26, 14, 0.34);
          overflow: hidden;
        }
        .an-log-head {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 20px 22px 0;
        }
        .an-log-head :global(.section-label) { margin: 0 !important; }
        .an-log-close {
          background: none;
          border: none;
          color: rgba(46, 26, 14, 0.5);
          font-size: 15px;
          line-height: 1;
          padding: 8px;
          cursor: pointer;
          border-radius: 8px;
        }
        .an-log-close:hover { color: #2e1a0e; }
        .an-log-body {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          padding: 14px 22px 22px;
          overflow-y: auto;
        }
        .an-log-body :global(.fc-root) {
          flex: 1;
          min-height: 300px;
        }

        /* ── Phone ── */
        @media (max-width: 820px) {
          .an-container {
            grid-template-columns: 1fr;
          }
          .an-log-scrim {
            padding: 0;
            align-items: flex-end;
          }
          .an-log-modal {
            max-width: none;
            max-height: 92vh;
            border-radius: 18px 18px 0 0;
          }
          .an-log-body { padding: 12px 16px 20px; }
          .an-log-head { padding: 16px 16px 0; }
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
          .an-page :global(.macro-ring-val) { font-size: 19px !important; }
          .an-page :global(.macro-ring-unit) { font-size: 11px !important; }
          .an-page :global(.macros-grid) {
            column-gap: 4px !important;
            min-width: 0;
            max-width: 100%;
          }
          .an-page :global(.macro-label) { font-size: 11px !important; }
          /* KCAL / WATER header stats — 80px gap is too wide on a phone */
          .an-page :global(.hero-row) { gap: 24px !important; }
          .an-page :global(.hero-stat-num) { font-size: 40px !important; }

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
