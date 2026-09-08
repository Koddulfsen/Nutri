/**
 * POST /api/admin/sanity-check-food-compound
 *
 * Runs a web-search-backed sanity check for a (compound, food) value pair,
 * caches the result in compound_food_sanity_checks (unique per pair), and
 * optionally marks outlier source mappings for review.
 *
 * Body: { compoundId, foodId, compoundName, compoundType, compoundUnit,
 *         foodName, ourValue, sourceValues?: Record<source, value>, force?: boolean }
 * Response: { cached: boolean, result: SanityCheckResult, ... }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { compoundFoodSanityChecks } from '@/db/schema/compound_food_sanity_checks';
import { compoundSources } from '@/db/schema/compounds';
import { eq, and } from 'drizzle-orm';
import { isSanityCheckConfigured, runSanityCheck, type SanityCheckResult } from '@/lib/services/sanity-check';
import { requireAdmin } from '@/lib/auth/api-guard';

export async function POST(request: NextRequest) {
  // Admin-only. Middleware is a second line of defence, not a boundary
  // (see CVE-2025-29927: middleware can be skipped entirely).
  const denied = await requireAdmin();
  if (denied) return denied;


  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSanityCheckConfigured()) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const body = await request.json();
    const {
      compoundId, foodId, compoundName, compoundType, compoundUnit,
      foodName, ourValue, sourceValues, force,
    } = body;

    if (!compoundId || !foodId || !compoundName || !compoundUnit || !foodName || typeof ourValue !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check DB cache first unless forced
    if (!force) {
      const cached = await db
        .select()
        .from(compoundFoodSanityChecks)
        .where(and(
          eq(compoundFoodSanityChecks.compoundId, compoundId),
          eq(compoundFoodSanityChecks.foodId, foodId),
        ))
        .limit(1);

      if (cached.length > 0) {
        const row = cached[0];
        const result: SanityCheckResult = {
          expected_range: {
            low: Number(row.expectedLow ?? 0),
            high: Number(row.expectedHigh ?? 0),
            unit: row.unit,
          },
          typical_value: Number(row.typicalValue ?? 0),
          verdict: row.verdict as SanityCheckResult['verdict'],
          confidence: row.confidence as SanityCheckResult['confidence'],
          sources: row.sources as SanityCheckResult['sources'],
          note: row.note ?? '',
        };
        return NextResponse.json({
          cached: true,
          checkedAt: row.checkedAt,
          ourValueAtCheck: Number(row.ourValueAtCheck),
          result,
        });
      }
    }

    // Run the sanity check
    const result = await runSanityCheck({
      compoundName, compoundType: compoundType || 'unknown',
      compoundUnit, foodName, ourValue,
    });

    // Upsert into cache
    await db.execute(sql`
      INSERT INTO compound_food_sanity_checks (
        compound_id, food_id, verdict, confidence,
        expected_low, expected_high, typical_value, unit,
        our_value_at_check, sources, note, checked_by, checked_at
      )
      VALUES (
        ${compoundId}, ${foodId}, ${result.verdict}, ${result.confidence},
        ${result.expected_range.low}, ${result.expected_range.high}, ${result.typical_value}, ${result.expected_range.unit},
        ${ourValue}, ${JSON.stringify(result.sources)}::jsonb, ${result.note}, ${user.id}, NOW()
      )
      ON CONFLICT (compound_id, food_id) DO UPDATE SET
        verdict = EXCLUDED.verdict,
        confidence = EXCLUDED.confidence,
        expected_low = EXCLUDED.expected_low,
        expected_high = EXCLUDED.expected_high,
        typical_value = EXCLUDED.typical_value,
        unit = EXCLUDED.unit,
        our_value_at_check = EXCLUDED.our_value_at_check,
        sources = EXCLUDED.sources,
        note = EXCLUDED.note,
        checked_by = EXCLUDED.checked_by,
        checked_at = NOW()
    `);

    // If outlier + we have per-source values, mark the source mappings whose
    // values fall outside the expected range for review. Don't overwrite
    // flagged (dead) status — that's terminal from a separate process.
    const markedSources: string[] = [];
    if (
      (result.verdict === 'low_outlier' || result.verdict === 'high_outlier') &&
      sourceValues && typeof sourceValues === 'object'
    ) {
      const { low, high } = result.expected_range;
      const outliers = Object.entries(sourceValues as Record<string, unknown>)
        .filter(([, v]) => typeof v === 'number' && (Number(v) < low || Number(v) > high))
        .map(([source]) => source);

      if (outliers.length > 0) {
        // Find compound_source rows for this compound + these external_sources
        const csRows = await db
          .select({ id: compoundSources.id, externalSource: compoundSources.externalSource })
          .from(compoundSources)
          .where(eq(compoundSources.compoundId, compoundId));

        const matching = csRows.filter(r => outliers.includes(r.externalSource));

        for (const row of matching) {
          const note = `Sanity check: ${foodName} value ${sourceValues[row.externalSource]}${compoundUnit} outside expected ${low}-${high}${compoundUnit}. ${result.note}`;
          // Upsert to 'review' unless already 'flagged' (terminal). Overwrites verified/review.
          await db.execute(sql`
            INSERT INTO compound_source_verifications (compound_source_id, status, notes, verified_by, verified_at)
            VALUES (${row.id}, 'review', ${note}, ${user.id}, NOW())
            ON CONFLICT (compound_source_id) DO UPDATE SET
              status = CASE WHEN compound_source_verifications.status = 'flagged' THEN 'flagged' ELSE 'review' END,
              notes = CASE WHEN compound_source_verifications.status = 'flagged' THEN compound_source_verifications.notes ELSE EXCLUDED.notes END,
              verified_by = CASE WHEN compound_source_verifications.status = 'flagged' THEN compound_source_verifications.verified_by ELSE EXCLUDED.verified_by END,
              verified_at = CASE WHEN compound_source_verifications.status = 'flagged' THEN compound_source_verifications.verified_at ELSE NOW() END
          `);
          markedSources.push(row.externalSource);
        }
      }
    }

    return NextResponse.json({
      cached: false,
      checkedAt: new Date().toISOString(),
      ourValueAtCheck: ourValue,
      result,
      markedSources,
    });
  } catch (error: any) {
    console.error('Sanity check error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
