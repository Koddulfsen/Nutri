/**
 * Daily Value Service
 *
 * Purpose: Personalized daily value lookups and calculations
 * Features:
 *   - Multi-source RDA aggregation (6 regional sources)
 *   - Demographics-based value selection
 *   - Age group calculation from birth date
 *   - Custom user overrides (premium)
 *   - Display settings for progress bars
 *
 * Generated: 2025-01-06
 * Architecture: Phase 2 - Personalized Nutrition
 */

import { db } from '@/db';
import {
  referenceDailyValues,
  userCustomDailyValues,
  userProfiles,
  compounds,
  compoundGroups,
} from '@/db/schema';
import { eq, and, inArray, avg, sql, isNotNull } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { redis } from './redis';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type AgeGroup =
  | 'INFANT_0_6M'
  | 'INFANT_7_12M'
  | 'CHILD_1_3Y'
  | 'CHILD_4_8Y'
  | 'CHILD_9_13Y'
  | 'TEEN_14_18Y'
  | 'ADULT_19_30Y'
  | 'ADULT_31_50Y'
  | 'ADULT_51_70Y'
  | 'ADULT_71_PLUS';

export type BiologicalSex = 'MALE' | 'FEMALE';
export type LifeStage = 'NONE' | 'PREGNANT' | 'LACTATING';
export type SourceRegion = 'USA_CANADA' | 'EU' | 'UK' | 'JAPAN' | 'CHINA' | 'AU_NZ';
export type SourcePreference = 'AVERAGE' | SourceRegion;

export interface UserDemographics {
  birthYear: number | null;
  birthMonth: number | null;
  biologicalSex: BiologicalSex | null;
  lifeStage: LifeStage;
  manualAgeGroup: AgeGroup | null;
  dvSourcePreference: SourcePreference;
}

export interface DailyValueResult {
  compoundId: string;
  value: number;
  unit: string;
  valueType: 'RDA' | 'AI' | 'UL';
  source: 'custom' | 'single_region' | 'average';
  sourceCount?: number;
  regions?: SourceRegion[];
}

export interface DvStatus {
  percent: number;
  status: 'deficient' | 'low' | 'optimal' | 'high' | 'excess';
}

export interface DisplaySettings {
  showProgressBar: boolean;
  displayPriority: number;
}

// ═══════════════════════════════════════════════════════════════
// Age Group Calculation
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate age group from birth year and month.
 *
 * Takes year+month rather than a full date because the day was never used: the
 * previous signature accepted a Date and read only getFullYear()/getMonth().
 * Storing the day was therefore pure over-collection of a strong quasi-identifier.
 *
 * @param birthYear  four-digit year, e.g. 1990
 * @param birthMonth 1-12 (note: NOT zero-based, unlike JS Date)
 */
export function calculateAgeGroup(birthYear: number, birthMonth: number): AgeGroup {
  const today = new Date();
  const ageInMonths =
    (today.getFullYear() - birthYear) * 12 + (today.getMonth() - (birthMonth - 1));

  if (ageInMonths <= 6) return 'INFANT_0_6M';
  if (ageInMonths <= 12) return 'INFANT_7_12M';

  const ageInYears = Math.floor(ageInMonths / 12);

  if (ageInYears <= 3) return 'CHILD_1_3Y';
  if (ageInYears <= 8) return 'CHILD_4_8Y';
  if (ageInYears <= 13) return 'CHILD_9_13Y';
  if (ageInYears <= 18) return 'TEEN_14_18Y';
  if (ageInYears <= 30) return 'ADULT_19_30Y';
  if (ageInYears <= 50) return 'ADULT_31_50Y';
  if (ageInYears <= 70) return 'ADULT_51_70Y';
  return 'ADULT_71_PLUS';
}

/**
 * Get effective age group for a user (manual override or calculated)
 */
export function getEffectiveAgeGroup(demographics: UserDemographics): AgeGroup | null {
  if (demographics.manualAgeGroup) {
    return demographics.manualAgeGroup;
  }
  if (demographics.birthYear && demographics.birthMonth) {
    return calculateAgeGroup(demographics.birthYear, demographics.birthMonth);
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// User Demographics
// ═══════════════════════════════════════════════════════════════

// In-memory cache for user demographics
const demographicsCache = new Map<string, { data: UserDemographics; timestamp: number }>();
const DEMOGRAPHICS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get user demographics from profile
 * OPTIMIZED: Uses in-memory cache + Supabase client
 */
export async function getUserDemographics(userId: string): Promise<UserDemographics | null> {
  // Check in-memory cache first (fastest)
  const cached = demographicsCache.get(userId);
  if (cached && Date.now() - cached.timestamp < DEMOGRAPHICS_CACHE_TTL_MS) {
    logger.debug({ service: 'daily-value-service', userId, cacheHit: true }, 'Demographics memory cache hit');
    return cached.data;
  }

  try {
    // Read through Drizzle, the same path the write below uses.
    //
    // This previously constructed a raw @supabase/supabase-js client inline from
    // NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Two problems:
    //   1. It bypassed @/lib/supabase/server, so it never went through the app's
    //      client at all — and once the hosted project was retired it pointed at a
    //      dead host, silently returning null for every user's demographics.
    //   2. It used the SERVICE ROLE key — which bypasses row-level security — for
    //      an ordinary user-scoped read. That is a privilege the request does not
    //      need, in a path that runs on every DV calculation.
    // The `.where(eq(userId))` below is the ownership check; there is no RLS.
    const rows = await db
      .select({
        birthYear: userProfiles.birthYear,
        birthMonth: userProfiles.birthMonth,
        biologicalSex: userProfiles.biologicalSex,
        lifeStage: userProfiles.lifeStage,
        manualAgeGroup: userProfiles.manualAgeGroup,
        dvSourcePreference: userProfiles.dvSourcePreference,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    const profile = rows[0];
    if (!profile) {
      return null;
    }

    const demographics: UserDemographics = {
      birthYear: profile.birthYear ?? null,
      birthMonth: profile.birthMonth ?? null,
      biologicalSex: profile.biologicalSex as BiologicalSex | null,
      lifeStage: (profile.lifeStage as LifeStage) || 'NONE',
      manualAgeGroup: profile.manualAgeGroup as AgeGroup | null,
      dvSourcePreference: (profile.dvSourcePreference as SourcePreference) || 'AVERAGE',
    };

    // Store in memory cache
    demographicsCache.set(userId, { data: demographics, timestamp: Date.now() });

    return demographics;
  } catch (error) {
    logger.error(
      { service: 'daily-value-service', userId, error: error instanceof Error ? error.message : String(error) },
      'Failed to get user demographics from database'
    );
    // Return null instead of throwing - allows API to continue with defaults
    return null;
  }
}

/**
 * Update user demographics
 */
export async function updateUserDemographics(
  userId: string,
  data: Partial<UserDemographics>
): Promise<void> {
  try {
    await db
      .update(userProfiles)
      .set({
        birthYear: data.birthYear ?? undefined,
        birthMonth: data.birthMonth ?? undefined,
        biologicalSex: data.biologicalSex,
        lifeStage: data.lifeStage,
        manualAgeGroup: data.manualAgeGroup,
        dvSourcePreference: data.dvSourcePreference,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId));

    // Invalidate cache — best effort, never fatal.
    //
    // This was previously unguarded, so when the cache backend became
    // unreachable the await threw AFTER the database write had already
    // succeeded, and the user saw a 500 for an update that actually landed.
    // A cache is an optimisation; it must never be able to fail a write.
    // The in-memory cache is cleared unconditionally for the same reason.
    demographicsCache.delete(userId);
    if (redis) {
      try {
        await redis.del(`user-demographics:${userId}`);
      } catch (cacheError) {
        logger.warn(
          {
            service: 'daily-value-service',
            userId,
            error: cacheError instanceof Error ? cacheError.message : String(cacheError),
          },
          'Cache invalidation failed; write succeeded. Stale demographics possible until TTL.'
        );
      }
    }

    logger.info({ service: 'daily-value-service', userId }, 'User demographics updated');
  } catch (error) {
    logger.error(
      { service: 'daily-value-service', userId, error: error instanceof Error ? error.message : String(error) },
      'Failed to update user demographics'
    );
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// Daily Value Lookups
// ═══════════════════════════════════════════════════════════════

/**
 * Get daily value for a single compound
 *
 * Lookup chain:
 * 1. User custom value (premium)
 * 2. User's preferred source + demographic
 * 3. Average across all sources for demographic
 * 4. Default adult average
 * 5. null
 */
export async function getDailyValue(
  userId: string,
  compoundId: string,
  options?: { sourceOverride?: SourceRegion }
): Promise<DailyValueResult | null> {
  try {
    // Step 1: Check for custom user value
    const [customValue] = await db
      .select({
        value: userCustomDailyValues.value,
        unit: userCustomDailyValues.unit,
      })
      .from(userCustomDailyValues)
      .where(and(eq(userCustomDailyValues.userId, userId), eq(userCustomDailyValues.compoundId, compoundId)))
      .limit(1);

    if (customValue) {
      return {
        compoundId,
        value: parseFloat(customValue.value),
        unit: customValue.unit,
        valueType: 'RDA',
        source: 'custom',
      };
    }

    // Step 2: Get user demographics
    const demographics = await getUserDemographics(userId);
    if (!demographics) {
      // No demographics - use default adult values
      return getDefaultDailyValue(compoundId);
    }

    const ageGroup = getEffectiveAgeGroup(demographics);
    const sex = demographics.biologicalSex;
    const lifeStage = demographics.lifeStage;
    const sourcePreference = options?.sourceOverride || demographics.dvSourcePreference;

    if (!ageGroup || !sex) {
      // Missing critical demographics - use default
      return getDefaultDailyValue(compoundId);
    }

    // Step 3: Lookup based on preference
    if (sourcePreference !== 'AVERAGE') {
      // Single region lookup
      const [regionalValue] = await db
        .select({
          value: referenceDailyValues.value,
          unit: referenceDailyValues.unit,
          valueType: referenceDailyValues.valueType,
        })
        .from(referenceDailyValues)
        .where(
          and(
            eq(referenceDailyValues.compoundId, compoundId),
            eq(referenceDailyValues.sourceRegion, sourcePreference),
            eq(referenceDailyValues.ageGroup, ageGroup),
            eq(referenceDailyValues.sex, sex),
            eq(referenceDailyValues.lifeStage, lifeStage)
          )
        )
        .limit(1);

      if (regionalValue) {
        return {
          compoundId,
          value: parseFloat(regionalValue.value),
          unit: regionalValue.unit,
          valueType: regionalValue.valueType as 'RDA' | 'AI' | 'UL',
          source: 'single_region',
          regions: [sourcePreference],
        };
      }
    }

    // Step 4: Average across all sources
    const averageResult = await db
      .select({
        avgValue: sql<number>`AVG(${referenceDailyValues.value}::numeric)`,
        unit: referenceDailyValues.unit,
        count: sql<number>`COUNT(*)`,
      })
      .from(referenceDailyValues)
      .where(
        and(
          eq(referenceDailyValues.compoundId, compoundId),
          eq(referenceDailyValues.ageGroup, ageGroup),
          eq(referenceDailyValues.sex, sex),
          eq(referenceDailyValues.lifeStage, lifeStage)
        )
      )
      .groupBy(referenceDailyValues.unit)
      .limit(1);

    if (averageResult.length > 0 && averageResult[0].avgValue) {
      return {
        compoundId,
        value: parseFloat(averageResult[0].avgValue.toString()),
        unit: averageResult[0].unit,
        valueType: 'RDA',
        source: 'average',
        sourceCount: averageResult[0].count,
      };
    }

    // Step 5: Fall back to default
    return getDefaultDailyValue(compoundId);
  } catch (error) {
    logger.error(
      {
        service: 'daily-value-service',
        userId,
        compoundId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to get daily value'
    );
    throw error;
  }
}

/**
 * Get default daily value (adult average)
 */
async function getDefaultDailyValue(compoundId: string): Promise<DailyValueResult | null> {
  const result = await db
    .select({
      avgValue: sql<number>`AVG(${referenceDailyValues.value}::numeric)`,
      unit: referenceDailyValues.unit,
      count: sql<number>`COUNT(*)`,
    })
    .from(referenceDailyValues)
    .where(
      and(
        eq(referenceDailyValues.compoundId, compoundId),
        eq(referenceDailyValues.ageGroup, 'ADULT_19_30Y'),
        eq(referenceDailyValues.lifeStage, 'NONE')
      )
    )
    .groupBy(referenceDailyValues.unit)
    .limit(1);

  if (result.length > 0 && result[0].avgValue) {
    return {
      compoundId,
      value: parseFloat(result[0].avgValue.toString()),
      unit: result[0].unit,
      valueType: 'RDA',
      source: 'average',
      sourceCount: result[0].count,
    };
  }

  return null;
}

/**
 * Get daily values for multiple compounds (batch lookup)
 * OPTIMIZED: Uses Supabase client for faster queries + in-memory caching
 */

// In-memory cache for DV lookups (faster than Redis for same-request lookups)
const dvCache = new Map<string, { data: Record<string, DailyValueResult>; timestamp: number }>();
const DV_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getDailyValuesBatch(
  userId: string,
  compoundIds: string[]
): Promise<Map<string, DailyValueResult>> {
  const startTime = Date.now();
  const results = new Map<string, DailyValueResult>();

  if (compoundIds.length === 0) {
    return results;
  }

  try {
    // Get user demographics (cached)
    const demographics = await getUserDemographics(userId);
    const ageGroup = (demographics ? getEffectiveAgeGroup(demographics) : null) || 'ADULT_19_30Y';
    const sex = demographics?.biologicalSex || 'MALE';
    const lifeStage = demographics?.lifeStage || 'NONE';
    const sourcePreference = demographics?.dvSourcePreference || 'AVERAGE';

    // Check in-memory cache first (much faster than Redis)
    const cacheKey = `${ageGroup}:${sex}:${lifeStage}:${sourcePreference}`;
    const cached = dvCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < DV_CACHE_TTL_MS) {
      // Use cached data
      for (const compoundId of compoundIds) {
        if (cached.data[compoundId]) {
          results.set(compoundId, cached.data[compoundId]);
        }
      }

      logger.debug({
        service: 'daily-value-service',
        userId,
        requestedCount: compoundIds.length,
        foundCount: results.size,
        durationMs: Date.now() - startTime,
        cached: true,
      }, 'Batch daily values from memory cache');

      return results;
    }

    // Query using Supabase client (faster connection pooling)
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: allDvs, error } = await supabase
      .from('reference_daily_values')
      .select('compound_id, value, unit, value_type, source_region')
      .eq('age_group', ageGroup)
      .eq('sex', sex)
      .eq('life_stage', lifeStage);

    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    // Group by compound and compute averages/single source in memory
    const compoundDvs = new Map<string, { values: number[]; unit: string; regions: SourceRegion[]; preferredValue?: { value: number; unit: string; region: SourceRegion } }>();

    for (const dv of allDvs || []) {
      const compoundId = dv.compound_id;
      if (!compoundDvs.has(compoundId)) {
        compoundDvs.set(compoundId, { values: [], unit: dv.unit, regions: [] });
      }
      const entry = compoundDvs.get(compoundId)!;
      entry.values.push(parseFloat(dv.value));
      entry.regions.push(dv.source_region as SourceRegion);

      // Track preferred source value
      if (sourcePreference !== 'AVERAGE' && dv.source_region === sourcePreference) {
        entry.preferredValue = { value: parseFloat(dv.value), unit: dv.unit, region: dv.source_region as SourceRegion };
      }
    }

    // Build results map for ALL compounds (for caching)
    const allResultsForCache: Record<string, DailyValueResult> = {};

    for (const [compoundId, data] of compoundDvs) {
      let result: DailyValueResult;

      if (sourcePreference !== 'AVERAGE' && data.preferredValue) {
        // Use preferred source
        result = {
          compoundId,
          value: data.preferredValue.value,
          unit: data.preferredValue.unit,
          valueType: 'RDA',
          source: 'single_region',
          regions: [data.preferredValue.region],
        };
      } else {
        // Average across all sources
        const avgValue = data.values.reduce((a, b) => a + b, 0) / data.values.length;
        result = {
          compoundId,
          value: avgValue,
          unit: data.unit,
          valueType: 'RDA',
          source: 'average',
          sourceCount: data.values.length,
        };
      }

      allResultsForCache[compoundId] = result;

      // Only add to results if it was requested
      if (compoundIds.includes(compoundId)) {
        results.set(compoundId, result);
      }
    }

    // Store in memory cache
    dvCache.set(cacheKey, { data: allResultsForCache, timestamp: Date.now() });

    logger.debug({
      service: 'daily-value-service',
      userId,
      requestedCount: compoundIds.length,
      foundCount: results.size,
      durationMs: Date.now() - startTime,
      cached: false,
    }, 'Batch daily values retrieved');

    return results;
  } catch (error) {
    logger.error({
      service: 'daily-value-service',
      userId,
      compoundCount: compoundIds.length,
      error: error instanceof Error ? error.message : String(error),
    }, 'Failed to get batch daily values');
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// New demographics-driven batch lookup (age-range columns)
// ═══════════════════════════════════════════════════════════════

export interface BatchDvByDemographicsArgs {
  compoundIds: string[];
  ageYears: number;
  sex: 'MALE' | 'FEMALE';
}

export interface DvLookupRow {
  target: number | null;       // averaged RDA/AI across sources
  targetUnit: string | null;
  targetType: 'RDA' | 'AI' | 'MIXED' | null; // what we averaged
  targetSourceCount: number;
  upperLimit: number | null;   // averaged UL across sources (if any)
  upperLimitUnit: string | null;
  upperLimitSourceCount: number;
}

/**
 * Batch lookup using explicit demographics + the new age-range columns.
 * - Selects rows where the user's age (in months) falls inside [age_min_months, age_max_months]
 *   (NULL age_max_months = no upper bound).
 * - life_stage = 'NONE' (alpha: no pregnancy/lactation paths).
 * - activity_level / dietary_context ignored (averaged across whatever the source published).
 * - For the "target" we average RDA + AI rows per compound. Per (compound, source) we prefer RDA
 *   when both exist so we don't double-count a single source.
 * - For "upper limit" we average UL rows per compound.
 */
export async function getDailyValuesBatchByDemographics(
  args: BatchDvByDemographicsArgs
): Promise<Map<string, DvLookupRow>> {
  const { compoundIds, ageYears, sex } = args;
  const results = new Map<string, DvLookupRow>();
  if (compoundIds.length === 0) return results;

  // Age in months at the upper end of the user's current year.
  // E.g. ageYears=30 → 30*12 = 360 months. Most sources index in whole-year ranges so
  // landing on year-boundaries is consistent with the source bracketing convention.
  const ageMonths = Math.max(0, Math.floor(ageYears * 12));

  // One query for everything we need; we'll bucket in JS.
  const rows = await db
    .select({
      compoundId: referenceDailyValues.compoundId,
      sourceRegion: referenceDailyValues.sourceRegion,
      value: referenceDailyValues.value,
      unit: referenceDailyValues.unit,
      valueType: referenceDailyValues.valueType,
    })
    .from(referenceDailyValues)
    .where(
      and(
        inArray(referenceDailyValues.compoundId, compoundIds),
        eq(referenceDailyValues.sex, sex),
        eq(referenceDailyValues.lifeStage, 'NONE'),
        sql`(${referenceDailyValues.ageMinMonths} IS NULL OR ${referenceDailyValues.ageMinMonths} <= ${ageMonths})`,
        sql`(${referenceDailyValues.ageMaxMonths} IS NULL OR ${referenceDailyValues.ageMaxMonths} >= ${ageMonths})`,
        inArray(referenceDailyValues.valueType, ['RDA', 'AI', 'UL']),
      )
    );

  // Bucket: compoundId → { perSourceTarget: Map<region, {val, unit, type}>, ulRows: [{val, unit}] }
  type Bucket = {
    perSourceTarget: Map<string, { value: number; unit: string; type: 'RDA' | 'AI' }>;
    ulRows: { value: number; unit: string }[];
  };
  const buckets = new Map<string, Bucket>();

  for (const r of rows) {
    let b = buckets.get(r.compoundId);
    if (!b) {
      b = { perSourceTarget: new Map(), ulRows: [] };
      buckets.set(r.compoundId, b);
    }
    const val = parseFloat(r.value as unknown as string);
    if (Number.isNaN(val)) continue;

    if (r.valueType === 'UL') {
      b.ulRows.push({ value: val, unit: r.unit });
    } else if (r.valueType === 'RDA' || r.valueType === 'AI') {
      const existing = b.perSourceTarget.get(r.sourceRegion);
      // Prefer RDA over AI when a single source publishes both
      if (!existing || (existing.type === 'AI' && r.valueType === 'RDA')) {
        b.perSourceTarget.set(r.sourceRegion, { value: val, unit: r.unit, type: r.valueType });
      }
    }
  }

  for (const compoundId of compoundIds) {
    const b = buckets.get(compoundId);
    if (!b) {
      results.set(compoundId, {
        target: null, targetUnit: null, targetType: null, targetSourceCount: 0,
        upperLimit: null, upperLimitUnit: null, upperLimitSourceCount: 0,
      });
      continue;
    }

    // Target: average across sources, grouped by unit. Pick the dominant unit if mixed.
    const byUnit = new Map<string, { sum: number; n: number; types: Set<'RDA' | 'AI'> }>();
    for (const row of b.perSourceTarget.values()) {
      const u = byUnit.get(row.unit) ?? { sum: 0, n: 0, types: new Set() };
      u.sum += row.value;
      u.n += 1;
      u.types.add(row.type);
      byUnit.set(row.unit, u);
    }
    let target: number | null = null;
    let targetUnit: string | null = null;
    let targetType: 'RDA' | 'AI' | 'MIXED' | null = null;
    let targetSourceCount = 0;
    if (byUnit.size > 0) {
      // Pick unit with the most sources
      const [pickedUnit, picked] = [...byUnit.entries()].sort((a, b) => b[1].n - a[1].n)[0];
      target = picked.sum / picked.n;
      targetUnit = pickedUnit;
      targetSourceCount = picked.n;
      targetType = picked.types.size === 1 ? [...picked.types][0] : 'MIXED';
    }

    // UL: average across sources, grouped by unit. Same idea.
    const ulByUnit = new Map<string, { sum: number; n: number }>();
    for (const row of b.ulRows) {
      const u = ulByUnit.get(row.unit) ?? { sum: 0, n: 0 };
      u.sum += row.value;
      u.n += 1;
      ulByUnit.set(row.unit, u);
    }
    let upperLimit: number | null = null;
    let upperLimitUnit: string | null = null;
    let upperLimitSourceCount = 0;
    if (ulByUnit.size > 0) {
      const [pickedUnit, picked] = [...ulByUnit.entries()].sort((a, b) => b[1].n - a[1].n)[0];
      upperLimit = picked.sum / picked.n;
      upperLimitUnit = pickedUnit;
      upperLimitSourceCount = picked.n;
    }

    results.set(compoundId, {
      target, targetUnit, targetType, targetSourceCount,
      upperLimit, upperLimitUnit, upperLimitSourceCount,
    });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════
// DV Calculations
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate percent daily value and status
 */
export function calculatePercentDV(intake: number, dailyValue: number): DvStatus {
  if (dailyValue <= 0) {
    return { percent: 0, status: 'optimal' };
  }

  const percent = (intake / dailyValue) * 100;

  let status: DvStatus['status'];
  if (percent < 10) {
    status = 'deficient';
  } else if (percent < 50) {
    status = 'low';
  } else if (percent <= 150) {
    status = 'optimal';
  } else if (percent <= 200) {
    status = 'high';
  } else {
    status = 'excess';
  }

  return { percent, status };
}

// ═══════════════════════════════════════════════════════════════
// Display Settings
// ═══════════════════════════════════════════════════════════════
//
// Single source of truth: a compound shows a progress bar iff it has
// ≥1 row in reference_daily_values. Groups still use compound_groups.has_dv
// because groups are aggregation buckets, not individual nutrients.

export async function getDisplaySettings(
  compoundIds: string[],
  groupIds: string[]
): Promise<Map<string, DisplaySettings>> {
  const results = new Map<string, DisplaySettings>();

  try {
    if (compoundIds.length > 0) {
      const rows = await db
        .selectDistinct({ compoundId: referenceDailyValues.compoundId })
        .from(referenceDailyValues)
        .where(inArray(referenceDailyValues.compoundId, compoundIds));

      const withDv = new Set(rows.map((r) => r.compoundId));

      for (const id of compoundIds) {
        results.set(id, {
          showProgressBar: withDv.has(id),
          displayPriority: 0,
        });
      }
    }

    if (groupIds.length > 0) {
      const groupsWithDv = await db
        .select({
          id: compoundGroups.id,
          hasDv: compoundGroups.hasDv,
        })
        .from(compoundGroups)
        .where(inArray(compoundGroups.id, groupIds));

      for (const group of groupsWithDv) {
        results.set(group.id, {
          showProgressBar: group.hasDv,
          displayPriority: 0,
        });
      }
    }

    return results;
  } catch (error) {
    logger.error(
      { service: 'daily-value-service', error: error instanceof Error ? error.message : String(error) },
      'Failed to get display settings'
    );
    throw error;
  }
}

export async function getAllDisplaySettings(): Promise<
  Array<{
    compoundId: string | null;
    groupId: string | null;
    showProgressBar: boolean;
    displayPriority: number;
  }>
> {
  const results: Array<{
    compoundId: string | null;
    groupId: string | null;
    showProgressBar: boolean;
    displayPriority: number;
  }> = [];

  const compoundsWithDv = await db
    .selectDistinct({ compoundId: referenceDailyValues.compoundId })
    .from(referenceDailyValues);

  for (const row of compoundsWithDv) {
    results.push({
      compoundId: row.compoundId,
      groupId: null,
      showProgressBar: true,
      displayPriority: 0,
    });
  }

  const groupsWithDv = await db
    .select({
      id: compoundGroups.id,
      hasDv: compoundGroups.hasDv,
    })
    .from(compoundGroups)
    .where(eq(compoundGroups.hasDv, true));

  for (const group of groupsWithDv) {
    results.push({
      compoundId: null,
      groupId: group.id,
      showProgressBar: true,
      displayPriority: 0,
    });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════
// Custom Daily Values (Premium)
// ═══════════════════════════════════════════════════════════════

/**
 * Set custom daily value for a user
 */
export async function setCustomDailyValue(
  userId: string,
  compoundId: string,
  value: number,
  unit: string,
  note?: string
): Promise<void> {
  await db
    .insert(userCustomDailyValues)
    .values({
      userId,
      compoundId,
      value: value.toString(),
      unit,
      note,
    })
    .onConflictDoUpdate({
      target: [userCustomDailyValues.userId, userCustomDailyValues.compoundId],
      set: {
        value: value.toString(),
        unit,
        note,
        updatedAt: new Date(),
      },
    });

  logger.info({ service: 'daily-value-service', userId, compoundId }, 'Custom daily value set');
}

/**
 * Delete custom daily value
 */
export async function deleteCustomDailyValue(userId: string, compoundId: string): Promise<void> {
  await db
    .delete(userCustomDailyValues)
    .where(
      and(eq(userCustomDailyValues.userId, userId), eq(userCustomDailyValues.compoundId, compoundId))
    );

  logger.info({ service: 'daily-value-service', userId, compoundId }, 'Custom daily value deleted');
}

/**
 * Get all custom daily values for a user
 */
export async function getUserCustomValues(
  userId: string
): Promise<
  Array<{
    compoundId: string;
    compoundName: string;
    value: number;
    unit: string;
    note: string | null;
  }>
> {
  const values = await db
    .select({
      compoundId: userCustomDailyValues.compoundId,
      compoundName: compounds.name,
      value: userCustomDailyValues.value,
      unit: userCustomDailyValues.unit,
      note: userCustomDailyValues.note,
    })
    .from(userCustomDailyValues)
    .leftJoin(compounds, eq(userCustomDailyValues.compoundId, compounds.id))
    .where(eq(userCustomDailyValues.userId, userId));

  return values.map((v) => ({
    compoundId: v.compoundId,
    compoundName: v.compoundName || '',
    value: parseFloat(v.value),
    unit: v.unit,
    note: v.note,
  }));
}
