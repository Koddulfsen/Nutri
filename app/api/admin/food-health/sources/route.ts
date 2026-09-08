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
    // Query all staging sources in parallel
    const sourceConfigs = [
      { key: 'AFCD', foodTable: 'source_afcd_foods', nutrientTable: 'source_afcd_nutrients', idColumn: 'nutrient_index' },
      { key: 'UK_COFID', foodTable: 'source_cofid_foods', nutrientTable: 'source_cofid_nutrients', idColumn: 'nutrient_code' },
      { key: 'CIQUAL', foodTable: 'source_ciqual_foods', nutrientTable: 'source_ciqual_nutrients', idColumn: 'nutrient_code' },
      { key: 'BLS', foodTable: 'source_bls_foods', nutrientTable: 'source_bls_nutrients', idColumn: 'nutrient_code' },
      { key: 'FRIDA', foodTable: 'source_frida_foods', nutrientTable: 'source_frida_nutrients', idColumn: 'eurofir_code' },
      { key: 'FINELI', foodTable: 'source_fineli_foods', nutrientTable: 'source_fineli_nutrients', idColumn: 'nutrient_code' },
      { key: 'NEVO', foodTable: 'source_nevo_foods', nutrientTable: 'source_nevo_nutrients', idColumn: 'nutrient_code' },
      { key: 'MATVARETABELLEN', foodTable: 'source_matvaretabellen_foods', nutrientTable: 'source_matvaretabellen_nutrients', idColumn: 'eurofir_code' },
      { key: 'FOODFILES', foodTable: 'source_foodfiles_foods', nutrientTable: 'source_foodfiles_nutrients', idColumn: 'nutrient_code' },
      { key: 'MEXT', foodTable: 'source_mext_foods', nutrientTable: 'source_mext_nutrients', idColumn: 'nutrient_code' },
      { key: 'KFCT', foodTable: 'source_kfct_foods', nutrientTable: 'source_kfct_nutrients', idColumn: 'nutrient_code' },
      { key: 'INDB', foodTable: 'source_indb_foods', nutrientTable: 'source_indb_nutrients', idColumn: 'nutrient_code' },
      { key: 'ASEANFOODS', foodTable: 'source_aseanfoods_foods', nutrientTable: 'source_aseanfoods_nutrients', idColumn: 'nutrient_code' },
    ];

    // Use a single SQL query to get all source stats
    // For each source: food count, nutrient count, mapped count, unmapped nutrients
    const results = await Promise.all(sourceConfigs.map(async (config) => {
      const [foodCount, nutrientStats] = await Promise.all([
        db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${config.foodTable}`)),
        db.execute(sql.raw(`
          SELECT
            n.${config.idColumn} as nutrient_id,
            n.name,
            n.unit,
            CASE WHEN cs.compound_id IS NOT NULL THEN true ELSE false END as is_mapped,
            comp.name as compound_name
          FROM ${config.nutrientTable} n
          LEFT JOIN compound_sources cs ON cs.external_id = CAST(n.${config.idColumn} AS TEXT)
            AND cs.external_source = '${config.key}'
          LEFT JOIN compounds comp ON comp.id = cs.compound_id
          ORDER BY n.name
        `)),
      ]);

      const foodRows = (foodCount as any).rows ?? foodCount;
      const nutrientRows = (nutrientStats as any).rows ?? nutrientStats;

      const totalNutrients = nutrientRows.length;
      const mappedNutrients = nutrientRows.filter((r: any) => r.is_mapped).length;
      const unmappedNutrients = nutrientRows.filter((r: any) => !r.is_mapped).map((r: any) => ({
        nutrientId: r.nutrient_id,
        name: r.name,
        unit: r.unit,
      }));

      return {
        source: config.key,
        foodCount: parseInt(foodRows[0]?.count || '0'),
        totalNutrients,
        mappedNutrients,
        mappingCoverage: totalNutrients > 0 ? Math.round((mappedNutrients / totalNutrients) * 100) : 0,
        unmappedNutrients,
      };
    }));

    // Add FooDB and Duke (different table structures)
    // FooDB
    const [foodbFoods, foodbNutrients] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as count FROM source_foodb_foods`),
      db.execute(sql`
        SELECT
          fc.foodb_id as nutrient_id,
          fc.name,
          CASE WHEN cs.compound_id IS NOT NULL THEN true ELSE false END as is_mapped,
          comp.name as compound_name
        FROM source_foodb_compounds fc
        LEFT JOIN compound_sources cs ON cs.external_id = fc.foodb_id::text AND cs.external_source = 'FOODB'
        LEFT JOIN compounds comp ON comp.id = cs.compound_id
        ORDER BY fc.name
      `),
    ]);

    const foodbFoodRows = (foodbFoods as any).rows ?? foodbFoods;
    const foodbNutrientRows = (foodbNutrients as any).rows ?? foodbNutrients;
    const foodbTotal = foodbNutrientRows.length;
    const foodbMapped = foodbNutrientRows.filter((r: any) => r.is_mapped).length;

    results.push({
      source: 'FOODB',
      foodCount: parseInt(foodbFoodRows[0]?.count || '0'),
      totalNutrients: foodbTotal,
      mappedNutrients: foodbMapped,
      mappingCoverage: foodbTotal > 0 ? Math.round((foodbMapped / foodbTotal) * 100) : 0,
      unmappedNutrients: foodbNutrientRows.filter((r: any) => !r.is_mapped).map((r: any) => ({
        nutrientId: r.nutrient_id,
        name: r.name,
        unit: '',
      })),
    });

    // Duke
    const [dukePlants, dukeChemicals] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as count FROM source_duke_plants`),
      db.execute(sql`
        SELECT
          c.chem_id as nutrient_id,
          c.name,
          CASE WHEN cs.compound_id IS NOT NULL THEN true ELSE false END as is_mapped,
          comp.name as compound_name
        FROM source_duke_chemicals c
        LEFT JOIN compound_sources cs ON cs.external_id = c.chem_id AND cs.external_source = 'DUKE'
        LEFT JOIN compounds comp ON comp.id = cs.compound_id
        ORDER BY c.name
      `),
    ]);

    const dukePlantRows = (dukePlants as any).rows ?? dukePlants;
    const dukeChemRows = (dukeChemicals as any).rows ?? dukeChemicals;
    const dukeTotal = dukeChemRows.length;
    const dukeMapped = dukeChemRows.filter((r: any) => r.is_mapped).length;

    results.push({
      source: 'DUKE',
      foodCount: parseInt(dukePlantRows[0]?.count || '0'),
      totalNutrients: dukeTotal,
      mappedNutrients: dukeMapped,
      mappingCoverage: dukeTotal > 0 ? Math.round((dukeMapped / dukeTotal) * 100) : 0,
      unmappedNutrients: dukeChemRows.filter((r: any) => !r.is_mapped).map((r: any) => ({
        nutrientId: r.nutrient_id,
        name: r.name,
        unit: '',
      })),
    });

    return NextResponse.json({ sources: results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
