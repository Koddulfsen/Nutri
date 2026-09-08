import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/api-guard';

export async function GET() {
  // Admin-only. Middleware is a second line of defence, not a boundary
  // (see CVE-2025-29927: middleware can be skipped entirely).
  const denied = await requireAdmin();
  if (denied) return denied;


  try {
    // Get all foods with their merged nutrients for sanity checking
    const results = await db.execute(sql`
      SELECT
        f.id as food_id,
        f.name as food_name,
        mn.nutrient_name,
        mn.compound_id,
        mn.average_value::numeric as value,
        mn.unit,
        comp.name as compound_name,
        comp.compound_type
      FROM foods f
      JOIN merged_nutrients mn ON mn.food_id = f.id
      LEFT JOIN compounds comp ON comp.id = mn.compound_id
      ORDER BY f.name, mn.nutrient_name
    `);

    const rows = (results as any).rows ?? results;

    // Group by food
    const foodMap = new Map<string, {
      foodId: string;
      foodName: string;
      nutrients: Array<{
        name: string;
        compoundId: string | null;
        value: number;
        unit: string;
        compoundType: string | null;
      }>;
    }>();

    for (const row of rows as any[]) {
      if (!foodMap.has(row.food_id)) {
        foodMap.set(row.food_id, {
          foodId: row.food_id,
          foodName: row.food_name,
          nutrients: [],
        });
      }
      foodMap.get(row.food_id)!.nutrients.push({
        name: row.compound_name || row.nutrient_name,
        compoundId: row.compound_id,
        value: parseFloat(row.value),
        unit: row.unit,
        compoundType: row.compound_type,
      });
    }

    const issues: Array<{
      foodId: string;
      foodName: string;
      type: 'macro_sum' | 'energy_equation' | 'negative_value' | 'extreme_value';
      severity: 'error' | 'warning' | 'info';
      message: string;
      details: string;
    }> = [];

    for (const [, food] of foodMap) {
      // Find key nutrients (case-insensitive partial match)
      const find = (names: string[]) =>
        food.nutrients.find(n => names.some(name => n.name.toLowerCase().includes(name.toLowerCase())));

      const protein = find(['Protein']);
      const fat = find(['Total Fat', 'Total lipid']);
      const carbs = find(['Carbohydrate']);
      const fiber = find(['Dietary Fiber', 'Fibre']);
      const water = find(['Water', 'Moisture']);
      const ash = find(['Ash']);
      const energy = find(['Energy']);

      // Check 1: Negative values
      for (const n of food.nutrients) {
        if (n.value < 0) {
          issues.push({
            foodId: food.foodId,
            foodName: food.foodName,
            type: 'negative_value',
            severity: 'error',
            message: `Negative value: ${n.name} = ${n.value} ${n.unit}`,
            details: `${n.name} has a negative value of ${n.value}`,
          });
        }
      }

      // Check 2: Extreme values (>1000g per 100g or >10000 kcal)
      for (const n of food.nutrients) {
        if (n.unit === 'g' && n.value > 1000) {
          issues.push({
            foodId: food.foodId,
            foodName: food.foodName,
            type: 'extreme_value',
            severity: 'error',
            message: `Extreme value: ${n.name} = ${n.value}g (>1000g per 100g)`,
            details: `Value exceeds physical possibility for per-100g measurement`,
          });
        }
        if (n.unit === 'kcal' && n.value > 10000) {
          issues.push({
            foodId: food.foodId,
            foodName: food.foodName,
            type: 'extreme_value',
            severity: 'error',
            message: `Extreme energy: ${n.value} kcal (>10,000)`,
            details: `Energy value exceeds maximum reasonable amount`,
          });
        }
      }

      // Check 3: Macro sum (protein + fat + carbs + fiber + ash + water ~= 100g ±10g)
      if (protein && fat && carbs) {
        const macroSum = (protein?.value || 0) + (fat?.value || 0) + (carbs?.value || 0) +
          (fiber?.value || 0) + (ash?.value || 0) + (water?.value || 0);

        if (water && macroSum > 0) {
          const deviation = Math.abs(macroSum - 100);
          if (deviation > 10) {
            issues.push({
              foodId: food.foodId,
              foodName: food.foodName,
              type: 'macro_sum',
              severity: deviation > 25 ? 'error' : 'warning',
              message: `Macro sum = ${macroSum.toFixed(1)}g (expected ~100g, deviation: ${deviation.toFixed(1)}g)`,
              details: `P:${protein?.value || 0} + F:${fat?.value || 0} + C:${carbs?.value || 0} + Fiber:${fiber?.value || 0} + Ash:${ash?.value || 0} + Water:${water?.value || 0}`,
            });
          }
        }
      }

      // Check 4: Energy equation (protein*4 + fat*9 + carbs*4 vs reported kcal, within 15%)
      if (energy && protein && fat && carbs && energy.unit === 'kcal') {
        const computed = (protein.value * 4) + (fat.value * 9) + (carbs.value * 4);
        if (computed > 0 && energy.value > 0) {
          const ratio = energy.value / computed;
          if (ratio < 0.85 || ratio > 1.15) {
            issues.push({
              foodId: food.foodId,
              foodName: food.foodName,
              type: 'energy_equation',
              severity: (ratio < 0.7 || ratio > 1.3) ? 'error' : 'warning',
              message: `Energy mismatch: reported ${energy.value} kcal vs computed ${computed.toFixed(0)} kcal (ratio: ${ratio.toFixed(2)})`,
              details: `Computed: P(${protein.value}*4) + F(${fat.value}*9) + C(${carbs.value}*4) = ${computed.toFixed(0)}`,
            });
          }
        }
      }
    }

    // Sort issues by severity
    const severityOrder = { error: 0, warning: 1, info: 2 };
    issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return NextResponse.json({
      summary: {
        totalFoods: foodMap.size,
        foodsWithIssues: new Set(issues.map(i => i.foodId)).size,
        issuesByType: {
          macro_sum: issues.filter(i => i.type === 'macro_sum').length,
          energy_equation: issues.filter(i => i.type === 'energy_equation').length,
          negative_value: issues.filter(i => i.type === 'negative_value').length,
          extreme_value: issues.filter(i => i.type === 'extreme_value').length,
        },
        issuesBySeverity: {
          error: issues.filter(i => i.severity === 'error').length,
          warning: issues.filter(i => i.severity === 'warning').length,
          info: issues.filter(i => i.severity === 'info').length,
        },
      },
      issues,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
