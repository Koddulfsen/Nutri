import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/api-guard';
import { parseUnit } from '@/lib/food-health/units';

export async function GET() {
  // Admin-only. Middleware is a second line of defence, not a boundary
  // (see CVE-2025-29927: middleware can be skipped entirely).
  const denied = await requireAdmin();
  if (denied) return denied;


  try {
    // Get all compound_sources with their compound info
    const results = await db.execute(sql`
      SELECT
        cs.id,
        cs.external_source,
        cs.external_id,
        cs.source_name,
        cs.source_unit,
        cs.conversion_factor,
        cs.is_canonical,
        comp.name as compound_name,
        comp.unit as canonical_unit,
        comp.compound_type
      FROM compound_sources cs
      JOIN compounds comp ON comp.id = cs.compound_id
      ORDER BY
        CASE WHEN cs.conversion_factor::numeric != 1.0 THEN 0 ELSE 1 END,
        cs.external_source,
        comp.name
    `);

    const rows = (results as any).rows ?? results;

    // Separate into non-trivial conversions and flag issues
    const conversions = rows.map((row: any) => {
      const factor = parseFloat(row.conversion_factor || '1');
      const flags: string[] = [];

      const src = parseUnit(row.source_unit);
      const canon = parseUnit(row.canonical_unit);

      // Same scale? Then the factor should be 1. Different scale? Then it should not be.
      const sameMagnitude = src.magnitude === canon.magnitude;
      const haveBothUnits = Boolean(src.magnitude && canon.magnitude);

      if (haveBothUnits && sameMagnitude && factor !== 1.0) {
        flags.push('SAME_UNIT_DIFFERENT_FACTOR');
      }

      if (haveBothUnits && !sameMagnitude && factor === 1.0) {
        flags.push('DIFFERENT_UNIT_NO_CONVERSION');
      }

      // Same magnitude, differing qualifier ('mg' vs 'mg NE'). Not a maths error —
      // reported separately so it never inflates the real count.
      const qualifierMismatch =
        haveBothUnits && sameMagnitude && src.qualifier !== canon.qualifier;

      // 314 rows carry no source_unit at all. That is a completeness gap, not a
      // maths error, so it gets its own counter rather than inflating flags.
      const missingUnit = !row.source_unit || !row.canonical_unit;

      return {
        id: row.id,
        externalSource: row.external_source,
        externalId: row.external_id,
        sourceName: row.source_name,
        sourceUnit: row.source_unit,
        canonicalUnit: row.canonical_unit,
        normalizedSourceUnit: src.magnitude,
        normalizedCanonicalUnit: canon.magnitude,
        conversionFactor: factor,
        isCanonical: row.is_canonical,
        compoundName: row.compound_name,
        compoundType: row.compound_type,
        flags,
        qualifierMismatch,
        missingUnit,
        isNonTrivial: factor !== 1.0,
      };
    });

    const nonTrivialCount = conversions.filter((c: any) => c.isNonTrivial).length;
    const flaggedCount = conversions.filter((c: any) => c.flags.length > 0).length;
    const qualifierCount = conversions.filter((c: any) => c.qualifierMismatch).length;
    const missingUnitCount = conversions.filter((c: any) => c.missingUnit).length;

    return NextResponse.json({
      summary: {
        totalMappings: conversions.length,
        nonTrivialConversions: nonTrivialCount,
        flaggedIssues: flaggedCount,
        qualifierMismatches: qualifierCount,
        missingUnits: missingUnitCount,
      },
      conversions,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
