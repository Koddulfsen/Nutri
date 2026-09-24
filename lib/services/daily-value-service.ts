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
  userEncryptionKeys,
  compounds,
  compoundGroups,
} from '@/db/schema';
import { eq, and, inArray, avg, sql, isNotNull } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { redis } from './redis';
import { encryptPHI, decryptPHI } from '@/lib/security/encryption';
import { resolveBar, toUnit, type DvRow } from '@/lib/dv/resolve';
import { formLinksOf } from '@/lib/dv/compound-links';

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
        lifeStageEncrypted: userProfiles.lifeStageEncrypted,
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

    // life_stage is Article 9 health data — stored as AES-256-GCM ciphertext.
    // NULL means NONE (never encrypted, since NONE discloses nothing). Any other
    // value requires decrypting with the user's own DEK from user_encryption_keys.
    let lifeStage: LifeStage = 'NONE';
    if (profile.lifeStageEncrypted) {
      const keyRow = await db.query.userEncryptionKeys.findFirst({
        where: eq(userEncryptionKeys.userId, userId),
      });
      if (!keyRow) {
        logger.error(
          { service: 'daily-value-service', userId },
          'life_stage is encrypted but no encryption key exists for this user — falling back to NONE'
        );
      } else {
        lifeStage = (await decryptPHI(profile.lifeStageEncrypted, keyRow.dataEncryptionKey)) as LifeStage;
      }
    }

    const demographics: UserDemographics = {
      birthYear: profile.birthYear ?? null,
      birthMonth: profile.birthMonth ?? null,
      biologicalSex: profile.biologicalSex as BiologicalSex | null,
      lifeStage,
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
    // Encrypt life_stage before it touches the database. NONE is stored as NULL
    // (unencrypted — it discloses nothing); anything else requires the user's DEK.
    let lifeStageEncrypted: string | null | undefined = undefined;
    if (data.lifeStage !== undefined) {
      if (data.lifeStage === 'NONE') {
        lifeStageEncrypted = null;
      } else {
        const keyRow = await db.query.userEncryptionKeys.findFirst({
          where: eq(userEncryptionKeys.userId, userId),
        });
        if (!keyRow) {
          throw new Error(`Cannot set life_stage: no encryption key exists for user ${userId}`);
        }
        lifeStageEncrypted = await encryptPHI(data.lifeStage, keyRow.dataEncryptionKey);
      }
    }

    await db
      .update(userProfiles)
      .set({
        birthYear: data.birthYear ?? undefined,
        birthMonth: data.birthMonth ?? undefined,
        biologicalSex: data.biologicalSex,
        lifeStageEncrypted,
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
  /**
   * The user's own body weight, when they have given one. Without it, values published per kilogram —
   * EFSA's, DACH's and the Nordic council's protein, every amino acid Vietnam publishes, every
   * contaminant limit — cannot be turned into an amount and are excluded with that reason. The
   * reference-weight fallback is G1 of dv-sources/DV-ACCURACY-TASKS.md and is not built yet.
   */
  weightKg?: number | null;
}

export interface DvLookupRow {
  target: number | null;       // median RDA/AI across the independent sources
  targetUnit: string | null;
  targetType: 'RDA' | 'AI' | 'MIXED' | null; // what the sources published
  targetSourceCount: number;   // independent bodies behind the target, each counted once
  upperLimit: number | null;   // median food ceiling (UL or CDRR), if any
  upperLimitUnit: string | null;
  upperLimitSourceCount: number;

  /**
   * What the number rests on. A target from one book and a target from ten look identical without this, and the
   * whole point of the source audit (dv-sources/PROVENANCE.md) is that they are not the same claim.
   */
  targetSources: string[];              // the bodies, named
  targetSpread: [number, number] | null; // lowest and highest, in targetUnit — how much they disagree
  /** Intake for lower chronic-disease risk, where a body sets one. A different question from adequacy. */
  diseaseFloor: { value: number; unit: string; sourceCount: number } | null;
  /** A ceiling that applies only to supplements or fortified foods. Never compare it with intake from food. */
  supplementLimit: { value: number; unit: string; sourceCount: number } | null;
  /** Ceilings on a FORM of the nutrient (retinol within vitamin A). Only comparable with intake of that form. */
  formLimits: Array<{ compound: string; value: number; unit: string; sourceCount: number; unitNote?: string }>;
  /** Values published as a share of energy, still in percent — they need the user's energy intake to become amounts. */
  energyShare: { goal: number | null; limit: number | null } | null;
  /** Range to stay inside, where the sources publish one (macronutrients). */
  range: { min: number; max: number; unit: string } | null;
  /** 1 for a daily target, 7 or 30 where the bodies set a weekly or monthly one. */
  averagingDays: number;
  /** Reference points for a margin of exposure — never a limit. See lib/dv/resolve.ts. */
  referencePoints: Array<{ value: number; unit: string; sourceCount: number }>;
  /** The body weight per-kg values were resolved against, and whether it was theirs or a default. */
  weightBasis: { kg: number; source: 'measured' | 'reference'; note?: string } | null;
}

/**
 * Batch lookup of the targets a user sees, resolved by lib/dv/resolve.ts.
 *
 * That resolver is the single place where the source audit is applied: only the 10 bodies that derive their own
 * values count (never a copy, never Spain's median-of-others), values that two bodies share count once, the median
 * replaces the mean, units are converted rather than matched as text, chronic-disease ceilings count as limits, and
 * a limit that applies only to supplements never constrains food. See dv-sources/PROVENANCE.md and VALUE-TYPES.md.
 *
 * This function returns the flat shape the UI already consumes; the resolver also produces a disease-prevention
 * floor, macronutrient ranges and form-specific limits, which this shape cannot carry yet.
 */
export async function getDailyValuesBatchByDemographics(
  args: BatchDvByDemographicsArgs
): Promise<Map<string, DvLookupRow>> {
  const { compoundIds, ageYears, sex, weightKg } = args;
  const results = new Map<string, DvLookupRow>();
  if (compoundIds.length === 0) return results;

  // Age in months at the upper end of the user's current year.
  // E.g. ageYears=30 → 30*12 = 360 months. Most sources index in whole-year ranges so
  // landing on year-boundaries is consistent with the source bracketing convention.
  const ageMonths = Math.max(0, Math.floor(ageYears * 12));

  // Compound names, because the resolver keys its rules (shared judgements, form links) on them.
  const compoundRows = await db
    .select({ id: compounds.id, name: compounds.name })
    .from(compounds)
    .where(inArray(compounds.id, compoundIds));
  const nameById = new Map<string, string>(compoundRows.map((c) => [c.id, c.name]));

  // A limit may live on a FORM of the nutrient (retinol within vitamin A), so those compounds are loaded too.
  const formNames = [...new Set(compoundRows.flatMap((c) => formLinksOf(c.name).map((l) => l.form)))];
  const formCompounds = formNames.length
    ? await db.select({ id: compounds.id, name: compounds.name }).from(compounds).where(inArray(compounds.name, formNames))
    : [];
  for (const c of formCompounds) nameById.set(c.id, c.name);

  const rows = await db
    .select({
      compoundId: referenceDailyValues.compoundId,
      sourceRegion: referenceDailyValues.sourceRegion,
      value: referenceDailyValues.value,
      valueMin: referenceDailyValues.valueMin,
      valueMax: referenceDailyValues.valueMax,
      unit: referenceDailyValues.unit,
      valueType: referenceDailyValues.valueType,
      isPercentOfEnergy: referenceDailyValues.isPercentOfEnergy,
      supplementalOnly: referenceDailyValues.supplementalOnly,
      perKgBodyWeight: referenceDailyValues.perKgBodyWeight,
      averagingDays: referenceDailyValues.averagingDays,
    })
    .from(referenceDailyValues)
    .where(
      and(
        inArray(referenceDailyValues.compoundId, [...compoundIds, ...formCompounds.map((c) => c.id)]),
        eq(referenceDailyValues.sex, sex),
        eq(referenceDailyValues.lifeStage, 'NONE'),
        sql`(${referenceDailyValues.ageMinMonths} IS NULL OR ${referenceDailyValues.ageMinMonths} <= ${ageMonths})`,
        sql`(${referenceDailyValues.ageMaxMonths} IS NULL OR ${referenceDailyValues.ageMaxMonths} >= ${ageMonths})`,
      )
    );

  const byCompoundName = new Map<string, DvRow[]>();
  for (const r of rows) {
    const name = nameById.get(r.compoundId);
    if (!name) continue;
    const value = parseFloat(r.value as unknown as string);
    if (Number.isNaN(value)) continue;
    const num = (x: unknown) => (x == null ? null : parseFloat(x as string));
    byCompoundName.set(name, [
      ...(byCompoundName.get(name) ?? []),
      {
        region: r.sourceRegion as string,
        compound: name,
        valueType: r.valueType as DvRow['valueType'],
        value,
        valueMin: num(r.valueMin),
        valueMax: num(r.valueMax),
        unit: r.unit,
        isPercentOfEnergy: r.isPercentOfEnergy ?? false,
        supplementalOnly: r.supplementalOnly ?? false,
        perKgBodyWeight: r.perKgBodyWeight ?? false,
        averagingDays: r.averagingDays ?? 1,
      },
    ]);
  }

  for (const compoundId of compoundIds) {
    const name = nameById.get(compoundId);
    const own = name ? byCompoundName.get(name) ?? [] : [];
    if (!name || own.length === 0) {
      results.set(compoundId, {
        target: null, targetUnit: null, targetType: null, targetSourceCount: 0,
        upperLimit: null, upperLimitUnit: null, upperLimitSourceCount: 0,
        targetSources: [], targetSpread: null, diseaseFloor: null, supplementLimit: null,
        formLimits: [], energyShare: null, range: null, averagingDays: 1, referencePoints: [], weightBasis: null,
      });
      continue;
    }
    const formRows: Record<string, DvRow[]> = {};
    for (const link of formLinksOf(name)) formRows[link.form] = byCompoundName.get(link.form) ?? [];
    const bar = resolveBar(name, own, formRows, { weightKg });

    // Only surface a limit the caller can compare with the target: a % -of-energy ceiling cannot be read against a
    // target in grams, and a form limit counts a different thing (preformed vitamin A, not total). Those are carried
    // by the resolver and belong to a richer UI, not to this number.
    const limit = bar.limit && (!bar.goal || toUnit(bar.limit.value, bar.limit.unit, bar.goal.unit) != null) ? bar.limit : null;

    const agg = (a: { value: number; unit: string; sources: string[] } | null) =>
      a ? { value: a.value, unit: a.unit, sourceCount: a.sources.length } : null;

    results.set(compoundId, {
      target: bar.goal?.value ?? null,
      targetUnit: bar.goal?.unit ?? null,
      targetType: bar.goal?.type ?? null,
      targetSourceCount: bar.goal?.sources.length ?? 0,
      upperLimit: limit?.value ?? null,
      upperLimitUnit: limit?.unit ?? null,
      upperLimitSourceCount: limit?.sources.length ?? 0,
      targetSources: bar.goal?.sources ?? [],
      targetSpread: bar.goal?.spread ?? null,
      diseaseFloor: agg(bar.diseaseFloor),
      supplementLimit: agg(bar.supplementLimit),
      formLimits: bar.formLimits.map((f) => ({ compound: f.compound, value: f.value, unit: f.unit, sourceCount: f.sources.length, unitNote: f.unitNote })),
      energyShare: bar.energyShare ? { goal: bar.energyShare.goal?.value ?? null, limit: bar.energyShare.limit?.value ?? null } : null,
      range: bar.range ? { min: bar.range.min, max: bar.range.max, unit: bar.range.unit } : null,
      averagingDays: bar.goal?.averagingDays ?? bar.limit?.averagingDays ?? 1,
      referencePoints: bar.referencePoints.map((r) => ({ value: r.value, unit: r.unit, sourceCount: r.sources.length })),
      weightBasis: bar.weightBasis,
    });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════
// DV Calculations
// ═══════════════════════════════════════════════════════════════

// Shared with the browser — see lib/nutrition/totals.ts
export { calculatePercentDV, type DvStatus } from '@/lib/nutrition/totals';

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
