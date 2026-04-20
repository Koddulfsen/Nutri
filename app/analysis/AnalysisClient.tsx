'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { User } from '@supabase/supabase-js';
import { apiUrl } from '@/lib/utils/base-path';
import AnalysisHeader from '@/app/components/navigation/AnalysisHeader';
import GuestAnalysisView from './GuestAnalysisView';
import SmartAddFoodModal from '@/app/components/modals/SmartAddFoodModal';
import DvSourceSelector from './components/DvSourceSelector';
import SymptomDropdown from './components/SymptomDropdown';
import CompoundTooltip from './components/CompoundTooltip';
import { useDateNavigation } from '@/lib/hooks/useDateNavigation';
import { WeekStrip, CalendarPopup, CalendarGrid } from '@/components/calendar';

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
            <div className={`dv-bar-wrapper ${representativeData?.dailyValue ? 'active' : 'inactive'}`}>
              <div className={`dv-bar ${!representativeData?.dailyValue ? 'police-tape' : ''}`}>
                <div
                  className="dv-bar-fill"
                  style={{
                    width: representativeData?.dailyValue ? `${representativeDvPercent}%` : '0%',
                    background: representativeData?.dailyValue ? getZoneColor(representativeZone) : 'transparent',
                  }}
                ></div>
                {!representativeData?.dailyValue && (
                  <span className="no-dv-label-centered">No DV</span>
                )}
                {representativeData?.dailyValue && (
                  <span className="dv-percent-label">{Math.round(representativeData.rdaPercent || 0)}%</span>
                )}
              </div>
            </div>
          </CompoundTooltip>
        ) : (
          <div className={`dv-bar-wrapper ${representativeData?.dailyValue ? 'active' : 'inactive'}`}>
            <div className={`dv-bar ${!representativeData?.dailyValue ? 'police-tape' : ''}`}>
              <div
                className="dv-bar-fill"
                style={{
                  width: representativeData?.dailyValue ? `${representativeDvPercent}%` : '0%',
                  background: representativeData?.dailyValue ? getZoneColor(representativeZone) : 'transparent',
                }}
              ></div>
              {!representativeData?.dailyValue && (
                <span className="no-dv-label-centered">No DV</span>
              )}
              {representativeData?.dailyValue && (
                <span className="dv-percent-label">{Math.round(representativeData.rdaPercent || 0)}%</span>
              )}
            </div>
          </div>
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
                  <div className={`dv-bar-wrapper ${nutrientData?.dailyValue ? 'active' : 'inactive'}`}>
                    <div className={`dv-bar ${!nutrientData?.dailyValue ? 'police-tape' : ''}`}>
                      <div
                        className="dv-bar-fill"
                        style={{
                          width: nutrientData?.dailyValue ? `${dvPercent}%` : '0%',
                          background: nutrientData?.dailyValue ? getZoneColor(zone) : 'transparent',
                        }}
                      ></div>
                      {!nutrientData?.dailyValue && (
                        <span className="no-dv-label-centered">No DV</span>
                      )}
                      {nutrientData?.dailyValue && (
                        <span className="dv-percent-label">{Math.round(nutrientData.rdaPercent || 0)}%</span>
                      )}
                    </div>
                  </div>
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
                  <div className={`dv-bar-wrapper ${nutrientData?.dailyValue ? 'active' : 'inactive'}`}>
                    <div className={`dv-bar ${!nutrientData?.dailyValue ? 'police-tape' : ''}`}>
                      <div
                        className="dv-bar-fill"
                        style={{
                          width: nutrientData?.dailyValue ? `${dvPercent}%` : '0%',
                          background: nutrientData?.dailyValue ? getZoneColor(zone) : 'transparent',
                        }}
                      ></div>
                      {!nutrientData?.dailyValue && (
                        <span className="no-dv-label-centered">No DV</span>
                      )}
                      {nutrientData?.dailyValue && (
                        <span className="dv-percent-label">{Math.round(nutrientData.rdaPercent || 0)}%</span>
                      )}
                    </div>
                  </div>
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
    goToPreviousDay,
    goToNextDay,
    goToToday,
    weekDays,
    formattedDate,
  } = useDateNavigation({ initialDate });

  // Calendar popup state
  const [showCalendar, setShowCalendar] = useState(false);

  // Day strip scroll offset (independent of selected date)
  const [dayStripOffset, setDayStripOffset] = useState(0);

  // Inline calendar
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate + 'T12:00:00'));

  // Dates that have food data (for dot indicators)
  const [datesWithData, setDatesWithData] = useState<Set<string>>(new Set());

  // Fetch dates with food data for a range
  const fetchDatesWithData = async (from: string, to: string) => {
    try {
      const res = await fetch(apiUrl(`/api/meals/dates?from=${from}&to=${to}`));
      if (res.ok) {
        const json = await res.json();
        setDatesWithData(prev => {
          const next = new Set(prev);
          (json.dates as string[]).forEach(d => next.add(d));
          return next;
        });
      }
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
  const [compoundDVs, setCompoundDVs] = useState<Record<string, { value: number; unit: string; source: string }>>({});

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

  // Fetch DVs for all compounds on mount (independent of intake data)
  useEffect(() => {
    async function fetchCompoundDVs() {
      if (initialCompounds.length === 0) return;

      try {
        // Use POST to avoid URL length limits with 2000+ compound IDs
        const compoundIds = initialCompounds.map((c: any) => c.id);
        const res = await fetch(apiUrl('/api/daily-values'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ compoundIds }),
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
  }, [initialCompounds]);

  // Fetch meals when date changes
  useEffect(() => {
    fetchMealsForDate(selectedDate);
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
      const params = new URLSearchParams({ date });

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
    dailyValue: { value: number; unit: string; source: string | null } | null;
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
        dailyValue: intakeData.dailyValue || (dvData ? { value: dvData.value, unit: dvData.unit, source: dvData.source } : null),
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
      dailyValue: dvData ? { value: dvData.value, unit: dvData.unit, source: dvData.source } : null,
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AnalysisHeader user={{
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url
      }} />

      {/* Date Navigation — hidden */}
      <div style={{ display: 'none' }}>
        <WeekStrip
          weekDays={weekDays}
          onDayClick={goToDate}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
          formattedDate={formattedDate}
          onOpenCalendar={() => setShowCalendar(true)}
        />
      </div>

      {/* Calendar Popup */}
      <CalendarPopup
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        selectedDate={selectedDate}
        onDateSelect={goToDate}
        onGoToToday={goToToday}
      />

      {/* Main: Page Layout */}
      <main style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="page-layout">

          {/* LEFT SIDEBAR */}
          <aside className="food-list-sidebar">
            {/* Day picker — collapsed: 3-day strip / expanded: full month in same format */}
            <div className="sidebar-day-picker">
              <button className="day-strip-arrow" onClick={() => setDayStripOffset(o => o - 1)} aria-label="Previous day">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              {[-1, 0, 1].map((offset) => {
                const d = new Date(selectedDate + 'T12:00:00');
                d.setDate(d.getDate() + dayStripOffset + offset);
                const dateStr = d.toISOString().slice(0, 10);
                const isSelected = dateStr === selectedDate;
                return (
                  <div key={offset} style={{ display: 'contents' }}>
                    {offset === 0 && <div className="day-divider" />}
                    <button
                      className={`day-cell${isSelected ? ' day-cell--current' : ''}`}
                      onClick={() => { goToDate(dateStr); setDayStripOffset(0); }}
                    >
                      {datesWithData.has(dateStr) && <span className="day-cell-dot" />}
                      <span className="day-cell-weekday">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className="day-cell-number">{d.getDate()}</span>
                      <span className="day-cell-month">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                    </button>
                    {offset === 0 && <div className="day-divider" />}
                  </div>
                );
              })}
              <button className="day-strip-arrow" onClick={() => setDayStripOffset(o => o + 1)} aria-label="Next day">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            <button className="calendar-expand-btn" onClick={() => setCalendarExpanded(e => !e)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: calendarExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {calendarExpanded && (() => {
              const year = viewMonth.getFullYear();
              const month = viewMonth.getMonth();
              const firstDay = new Date(year, month, 1);
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const leadingBlanks = (firstDay.getDay() + 6) % 7; // Monday-based
              const cells: (number | null)[] = [
                ...Array(leadingBlanks).fill(null),
                ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
              ];
              return (
                <div className="sidebar-month-section">
                  <div className="sidebar-month-nav">
                    <button className="day-strip-arrow" onClick={() => setViewMonth(m => { const n = new Date(m); n.setMonth(n.getMonth() - 1); return n; })}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <span className="month-grid-header" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                      {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button className="day-strip-arrow" onClick={() => setViewMonth(m => { const n = new Date(m); n.setMonth(n.getMonth() + 1); return n; })}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                <div className="sidebar-month-grid">
                  {['M','T','W','T','F','S','S'].map((d, i) => (
                    <span key={i} className="month-grid-header">{d}</span>
                  ))}
                  {cells.map((day, i) => {
                    if (!day) return <span key={`blank-${i}`} />;
                    const d = new Date(year, month, day);
                    const dateStr = d.toISOString().slice(0, 10);
                    const isSelected = dateStr === selectedDate;
                    return (
                      <button
                        key={dateStr}
                        className={`day-cell day-cell--compact${isSelected ? ' day-cell--current' : ''}`}
                        onClick={() => { goToDate(dateStr); setDayStripOffset(0); setCalendarExpanded(false); }}
                      >
                        {datesWithData.has(dateStr) && <span className="day-cell-dot" />}
                        <span className="day-cell-number">{day}</span>
                      </button>
                    );
                  })}
                </div>
                </div>
              );
            })()}

            <div className="food-list">
              <p className="food-list-label">Added today</p>
              {mealsLoading ? (
                <div style={{ padding: '12px 24px', color: 'var(--text-3)', fontSize: '13px' }}>Loading...</div>
              ) : (() => {
                const allItems = meals.flatMap(m => m.items || []);
                return allItems.length === 0 ? (
                  <div style={{ padding: '12px 24px', color: 'var(--text-3)', fontSize: '13px' }}>No foods logged yet</div>
                ) : (
                  <>
                    {allItems.map((item: any) => (
                      <div key={item.id} className="food-item">
                        <span className="food-item-name">{item.food?.name || 'Unknown'}</span>
                        <span className="food-item-meta">{item.portionSize}{item.portionType}</span>
                        <button className="food-item-remove" onClick={() => handleRemoveMealItem(item.id)}>✕</button>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>

            {/* Symptom tracker */}
            <SymptomDropdown
              date={selectedDate}
              symptoms={symptoms}
              definitions={symptomDefinitions}
              loading={symptomsLoading}
              onRefresh={() => fetchSymptomsForDate(selectedDate)}
              onRefreshDefinitions={fetchDefinitions}
            />
          </aside>

          {/* RIGHT: Main content */}
          <div className="main-content">
            <div className="stacked-layout">

              {/* Search + Macros row */}
              <div className="search-macros-row">

              {/* Search */}
              <section className="search-section">
                <p className="section-label">Search</p>
                <div ref={searchWrapperRef} className="search-field-outer">
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

                {/* Add row — always visible, dimmed until food selected */}
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
                      {addingFood ? 'Adding...' : 'Add food'}
                    </button>
                  </div>
              </section>

              {/* Macros */}
              <section className="macros-section">
                <p className="section-label">Macros</p>
                {(() => {
                  const C = 213.63;
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
                                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="6"/>
                                <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="6"
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

              </div>{/* end search-macros-row */}

              {/* Compound analysis */}
              <section className="compounds-section">
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
                      <span className={`picker-opt${sex === 'male' ? ' sel' : ''}`} onClick={() => setSex('male')}>
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="10" cy="14" r="6"/>
                          <line x1="14.5" y1="9.5" x2="20" y2="4"/>
                          <polyline points="16 4 20 4 20 8"/>
                        </svg>
                      </span>
                      <span className="picker-divider" />
                      <span className={`picker-opt${sex === 'female' ? ' sel' : ''}`} onClick={() => setSex('female')}>
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="6"/>
                          <line x1="12" y1="14" x2="12" y2="20"/>
                          <line x1="9" y1="18" x2="15" y2="18"/>
                        </svg>
                      </span>
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

            </div>{/* end stacked-layout */}
          </div>{/* end main-content */}
        </div>{/* end page-layout */}
      </main>

      {/* Smart Add Food Modal (AI-Assisted) */}
      {/* Search dropdown portal — renders above all containers to avoid overflow clipping */}
      {!selectedFood && searchQuery && dropdownOpen && dropdownPos && createPortal(
        <div
          ref={dropdownPortalRef}
          className="search-dropdown"
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

        .dv-bar-fill {
          /* Zone color set via inline style */
          transition: width 0.3s ease, background 0.3s ease;
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
      `}</style>
    </div>
  );
}
