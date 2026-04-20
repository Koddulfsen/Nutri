import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get per-source stats for each compound from nutrient_source_values
    const results = await db.execute(sql`
      SELECT
        mn.compound_id,
        comp.name as compound_name,
        comp.unit,
        comp.compound_type,
        cg.name as group_name,
        nsv.api_source,
        COUNT(*) as food_count,
        AVG(nsv.value::numeric) as source_mean,
        STDDEV(nsv.value::numeric) as source_stddev,
        MIN(nsv.value::numeric) as source_min,
        MAX(nsv.value::numeric) as source_max
      FROM nutrient_source_values nsv
      JOIN merged_nutrients mn ON mn.id = nsv.merged_nutrient_id
      LEFT JOIN compounds comp ON comp.id = mn.compound_id
      LEFT JOIN compound_groups cg ON cg.id = comp.group_id
      WHERE mn.compound_id IS NOT NULL
      GROUP BY mn.compound_id, comp.name, comp.unit, comp.compound_type, cg.name, nsv.api_source
      HAVING COUNT(*) >= 2
      ORDER BY comp.name, nsv.api_source
    `);

    const rows = (results as any).rows ?? results;

    // Group by compound and compute cross-source stats
    const compoundMap = new Map<string, {
      compoundId: string;
      compoundName: string;
      unit: string;
      compoundType: string;
      groupName: string | null;
      sources: Array<{
        apiSource: string;
        foodCount: number;
        mean: number;
        stddev: number;
        min: number;
        max: number;
        zScore: number | null;
        flagged: boolean;
      }>;
      globalMean: number;
      globalStddev: number;
    }>();

    for (const row of rows as any[]) {
      const key = row.compound_id;
      if (!compoundMap.has(key)) {
        compoundMap.set(key, {
          compoundId: row.compound_id,
          compoundName: row.compound_name,
          unit: row.unit,
          compoundType: row.compound_type,
          groupName: row.group_name,
          sources: [],
          globalMean: 0,
          globalStddev: 0,
        });
      }
      compoundMap.get(key)!.sources.push({
        apiSource: row.api_source,
        foodCount: parseInt(row.food_count),
        mean: parseFloat(row.source_mean),
        stddev: parseFloat(row.source_stddev || '0'),
        min: parseFloat(row.source_min),
        max: parseFloat(row.source_max),
        zScore: null,
        flagged: false,
      });
    }

    // Compute global stats and z-scores
    const compounds = Array.from(compoundMap.values()).map(compound => {
      if (compound.sources.length < 2) return compound;

      // Weighted mean across sources (weighted by food count)
      const totalFoods = compound.sources.reduce((s, src) => s + src.foodCount, 0);
      const weightedSum = compound.sources.reduce((s, src) => s + src.mean * src.foodCount, 0);
      compound.globalMean = totalFoods > 0 ? weightedSum / totalFoods : 0;

      // Compute stddev of source means
      const meanOfMeans = compound.sources.reduce((s, src) => s + src.mean, 0) / compound.sources.length;
      const variance = compound.sources.reduce((s, src) => s + Math.pow(src.mean - meanOfMeans, 2), 0) / compound.sources.length;
      compound.globalStddev = Math.sqrt(variance);

      // Compute z-scores and flag outliers
      for (const src of compound.sources) {
        if (compound.globalStddev > 0) {
          src.zScore = (src.mean - meanOfMeans) / compound.globalStddev;
          src.flagged = Math.abs(src.zScore) > 2;
        }
      }

      return compound;
    });

    // Filter to only compounds with multiple sources
    const multiSource = compounds.filter(c => c.sources.length >= 2);
    const flaggedCompounds = multiSource.filter(c => c.sources.some(s => s.flagged));

    return NextResponse.json({
      summary: {
        totalCompounds: multiSource.length,
        flaggedCompounds: flaggedCompounds.length,
      },
      compounds: multiSource,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
