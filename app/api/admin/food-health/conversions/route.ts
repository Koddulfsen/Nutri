import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
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

      // Flag: source_unit matches canonical but factor != 1 (likely error)
      if (row.source_unit && row.canonical_unit &&
          row.source_unit.toLowerCase() === row.canonical_unit.toLowerCase() &&
          factor !== 1.0) {
        flags.push('SAME_UNIT_DIFFERENT_FACTOR');
      }

      // Flag: factor is 1.0 but units differ (missing conversion)
      if (factor === 1.0 && row.source_unit && row.canonical_unit &&
          row.source_unit.toLowerCase() !== row.canonical_unit.toLowerCase()) {
        flags.push('DIFFERENT_UNIT_NO_CONVERSION');
      }

      return {
        id: row.id,
        externalSource: row.external_source,
        externalId: row.external_id,
        sourceName: row.source_name,
        sourceUnit: row.source_unit,
        canonicalUnit: row.canonical_unit,
        conversionFactor: factor,
        isCanonical: row.is_canonical,
        compoundName: row.compound_name,
        compoundType: row.compound_type,
        flags,
        isNonTrivial: factor !== 1.0,
      };
    });

    const nonTrivialCount = conversions.filter((c: any) => c.isNonTrivial).length;
    const flaggedCount = conversions.filter((c: any) => c.flags.length > 0).length;

    return NextResponse.json({
      summary: {
        totalMappings: conversions.length,
        nonTrivialConversions: nonTrivialCount,
        flaggedIssues: flaggedCount,
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
