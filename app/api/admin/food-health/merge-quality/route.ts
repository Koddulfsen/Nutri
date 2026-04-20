/**
 * Food Health Dashboard - Merge Quality API
 *
 * Tab 5: Merge quality metrics
 * - Null compoundId count
 * - Single-source nutrients
 * - High disagreement (CV > 50%)
 * - Confidence distribution
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // 1. Null compoundId count
    const nullCompoundResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM merged_nutrients
      WHERE compound_id IS NULL
    `);
    const nullRows = (nullCompoundResult as any).rows ?? nullCompoundResult;
    const nullCompoundCount = parseInt(nullRows[0]?.count || '0');

    // 2. Single-source nutrients (only 1 source value)
    const singleSourceResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM merged_nutrients mn
      WHERE mn.source_count = 1
        AND mn.compound_id IS NOT NULL
    `);
    const singleRows = (singleSourceResult as any).rows ?? singleSourceResult;
    const singleSourceCount = parseInt(singleRows[0]?.count || '0');

    // 3. Multi-source nutrients total
    const multiSourceResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM merged_nutrients mn
      WHERE mn.source_count > 1
        AND mn.compound_id IS NOT NULL
    `);
    const multiRows = (multiSourceResult as any).rows ?? multiSourceResult;
    const multiSourceCount = parseInt(multiRows[0]?.count || '0');

    // 4. High disagreement - nutrients where source values have >50% coefficient of variation
    const disagreementResult = await db.execute(sql`
      SELECT
        mn.id as merged_nutrient_id,
        f.name as food_name,
        f.id as food_id,
        mn.nutrient_name,
        mn.average_value::numeric as avg_value,
        mn.unit,
        mn.source_count,
        comp.name as compound_name,
        STDDEV(nsv.value::numeric) as value_stddev,
        AVG(nsv.value::numeric) as value_mean,
        CASE
          WHEN AVG(nsv.value::numeric) > 0
          THEN (STDDEV(nsv.value::numeric) / AVG(nsv.value::numeric)) * 100
          ELSE 0
        END as cv_percent
      FROM merged_nutrients mn
      JOIN foods f ON f.id = mn.food_id
      JOIN nutrient_source_values nsv ON nsv.merged_nutrient_id = mn.id
      LEFT JOIN compounds comp ON comp.id = mn.compound_id
      WHERE mn.source_count > 1
        AND mn.compound_id IS NOT NULL
      GROUP BY mn.id, f.name, f.id, mn.nutrient_name, mn.average_value, mn.unit, mn.source_count, comp.name
      HAVING STDDEV(nsv.value::numeric) > 0
        AND AVG(nsv.value::numeric) > 0
        AND (STDDEV(nsv.value::numeric) / AVG(nsv.value::numeric)) * 100 > 50
      ORDER BY cv_percent DESC
      LIMIT 100
    `);
    const disagreementRows = (disagreementResult as any).rows ?? disagreementResult;

    const highDisagreement = (disagreementRows as any[]).map((row: any) => ({
      foodId: row.food_id,
      foodName: row.food_name,
      nutrientName: row.compound_name || row.nutrient_name,
      averageValue: parseFloat(row.avg_value),
      unit: row.unit,
      sourceCount: parseInt(row.source_count),
      stddev: parseFloat(row.value_stddev),
      mean: parseFloat(row.value_mean),
      cvPercent: parseFloat(row.cv_percent),
    }));

    // 5. Per-source value details for high disagreement items (top 20)
    const topDisagreementIds = (disagreementRows as any[]).slice(0, 20).map((r: any) => r.merged_nutrient_id);

    let sourceDetails: any[] = [];
    if (topDisagreementIds.length > 0) {
      const detailResult = await db.execute(sql`
        SELECT
          nsv.merged_nutrient_id,
          nsv.api_source,
          nsv.value::numeric as value,
          nsv.source_unit
        FROM nutrient_source_values nsv
        WHERE nsv.merged_nutrient_id = ANY(${topDisagreementIds})
        ORDER BY nsv.merged_nutrient_id, nsv.api_source
      `);
      sourceDetails = ((detailResult as any).rows ?? detailResult) as any[];
    }

    // Group source details by merged_nutrient_id
    const detailMap = new Map<string, Array<{ apiSource: string; value: number; sourceUnit: string | null }>>();
    for (const row of sourceDetails) {
      const key = row.merged_nutrient_id;
      if (!detailMap.has(key)) detailMap.set(key, []);
      detailMap.get(key)!.push({
        apiSource: row.api_source,
        value: parseFloat(row.value),
        sourceUnit: row.source_unit,
      });
    }

    // 6. Confidence distribution
    const confidenceResult = await db.execute(sql`
      SELECT
        confidence::numeric as conf,
        COUNT(*) as count
      FROM nutrient_source_values
      GROUP BY confidence
      ORDER BY confidence
    `);
    const confRows = (confidenceResult as any).rows ?? confidenceResult;
    const confidenceDistribution = (confRows as any[]).map((row: any) => ({
      confidence: parseFloat(row.conf),
      count: parseInt(row.count),
    }));

    // 7. Total merged nutrients
    const totalResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM merged_nutrients
    `);
    const totalRows = (totalResult as any).rows ?? totalResult;
    const totalMergedNutrients = parseInt(totalRows[0]?.count || '0');

    return NextResponse.json({
      summary: {
        totalMergedNutrients,
        nullCompoundCount,
        singleSourceCount,
        multiSourceCount,
        highDisagreementCount: highDisagreement.length,
      },
      highDisagreement: highDisagreement.slice(0, 20).map(item => ({
        ...item,
        sourceValues: detailMap.get(
          (disagreementRows as any[]).find((r: any) =>
            r.food_id === item.foodId && (r.compound_name || r.nutrient_name) === item.nutrientName
          )?.merged_nutrient_id
        ) || [],
      })),
      confidenceDistribution,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
