/**
 * Source Nutrient Reference Service
 *
 * Looks up the ACTUAL nutrient name from each external source for a given external ID.
 * Used by the mapping verification tool to confirm compound_sources mappings are correct.
 *
 * For staging table sources: queries local DB nutrient tables
 * For FDC/CNF: calls external APIs and caches results
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';

export interface SourceNutrientInfo {
  name: string;
  unit: string;
}

type ReferenceMap = Map<string, SourceNutrientInfo>;

// In-memory cache (lives for the lifetime of the server process)
let cachedReference: ReferenceMap | null = null;

function makeKey(source: string, externalId: string): string {
  return `${source}:${externalId}`;
}

/**
 * Get actual nutrient name from source for a given external ID.
 * Returns null if the source/ID combination isn't found.
 */
export async function lookupSourceNutrient(
  source: string,
  externalId: string
): Promise<SourceNutrientInfo | null> {
  const ref = await getSourceNutrientReference();
  return ref.get(makeKey(source, externalId)) ?? null;
}

/**
 * Get the full reference map (cached after first call).
 */
export async function getSourceNutrientReference(): Promise<ReferenceMap> {
  if (cachedReference) return cachedReference;
  cachedReference = await buildReference();
  return cachedReference;
}

/** Check if the reference is already cached */
export function isSourceNutrientReferenceCached(): boolean {
  return cachedReference !== null;
}

/**
 * Build the reference with progress callbacks for SSE streaming.
 * Returns cached if already built.
 */
export async function getSourceNutrientReferenceWithProgress(
  onProgress: (step: string, detail: string, percent: number) => void
): Promise<ReferenceMap> {
  if (cachedReference) {
    onProgress('cached', 'Using cached reference', 100);
    return cachedReference;
  }
  cachedReference = await buildReferenceWithProgress(onProgress);
  return cachedReference;
}

/** Force rebuild of the cache */
export function invalidateSourceNutrientCache(): void {
  cachedReference = null;
}

// ----- Staging table source configs -----

interface StagingSourceConfig {
  source: string;
  table: string;
  idColumn: string;
  nameColumn: string;
  unitColumn: string;
}

const STAGING_SOURCES: StagingSourceConfig[] = [
  { source: 'AFCD', table: 'source_afcd_nutrients', idColumn: 'nutrient_index', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'CIQUAL', table: 'source_ciqual_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'UK_COFID', table: 'source_cofid_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'FINELI', table: 'source_fineli_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'BLS', table: 'source_bls_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'NEVO', table: 'source_nevo_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'FRIDA', table: 'source_frida_nutrients', idColumn: 'eurofir_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'MATVARETABELLEN', table: 'source_matvaretabellen_nutrients', idColumn: 'eurofir_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'FOODFILES', table: 'source_foodfiles_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'MEXT', table: 'source_mext_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'KFCT', table: 'source_kfct_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'INDB', table: 'source_indb_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'ASEANFOODS', table: 'source_aseanfoods_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
];

async function buildReference(): Promise<ReferenceMap> {
  const ref: ReferenceMap = new Map();

  // 1. Query all staging table nutrients in parallel
  const stagingPromises = STAGING_SOURCES.map(async (config) => {
    try {
      const rows = await db.execute(sql.raw(
        `SELECT CAST(${config.idColumn} AS TEXT) as external_id, ${config.nameColumn} as name, ${config.unitColumn} as unit
         FROM ${config.table}
         WHERE ${config.idColumn} IS NOT NULL`
      ));
      const resultRows = (rows as any).rows ?? rows;
      for (const row of resultRows) {
        const r = row as { external_id: string; name: string; unit: string };
        ref.set(makeKey(config.source, r.external_id), { name: r.name, unit: r.unit });
      }
    } catch {
      // Table might not exist yet — skip silently
    }
  });

  // 2. FooDB compounds (separate structure)
  const foodbPromise = (async () => {
    try {
      const rows = await db.execute(sql`
        SELECT CAST(foodb_id AS TEXT) as external_id, name, '' as unit
        FROM source_foodb_compounds
      `);
      const resultRows = (rows as any).rows ?? rows;
      for (const row of resultRows) {
        const r = row as { external_id: string; name: string; unit: string };
        ref.set(makeKey('FOODB', r.external_id), { name: r.name, unit: r.unit });
      }
    } catch {
      // skip
    }
  })();

  // 3. FDC nutrients — fetch from USDA API via reference foods
  const fdcPromise = buildFdcReference(ref);

  // 4. CNF nutrients — fetch from CNF API via reference food
  const cnfPromise = buildCnfReference(ref);

  await Promise.all([...stagingPromises, foodbPromise, fdcPromise, cnfPromise]);

  return ref;
}

async function buildReferenceWithProgress(
  onProgress: (step: string, detail: string, percent: number) => void
): Promise<ReferenceMap> {
  const ref: ReferenceMap = new Map();

  // Staging tables — load sequentially with progress
  for (let i = 0; i < STAGING_SOURCES.length; i++) {
    const config = STAGING_SOURCES[i];
    const pct = Math.round((i / STAGING_SOURCES.length) * 30);
    onProgress('staging', `Loading ${config.source}... (${i + 1}/${STAGING_SOURCES.length})`, pct);
    try {
      const rows = await db.execute(sql.raw(
        `SELECT CAST(${config.idColumn} AS TEXT) as external_id, ${config.nameColumn} as name, ${config.unitColumn} as unit
         FROM ${config.table}
         WHERE ${config.idColumn} IS NOT NULL`
      ));
      const resultRows = (rows as any).rows ?? rows;
      for (const row of resultRows) {
        const r = row as { external_id: string; name: string; unit: string };
        ref.set(makeKey(config.source, r.external_id), { name: r.name, unit: r.unit });
      }
    } catch {}
  }

  onProgress('staging', 'Loading FooDB compounds...', 32);
  try {
    const rows = await db.execute(sql`
      SELECT CAST(foodb_id AS TEXT) as external_id, name, '' as unit FROM source_foodb_compounds
    `);
    const resultRows = (rows as any).rows ?? rows;
    for (const row of resultRows) {
      const r = row as { external_id: string; name: string; unit: string };
      ref.set(makeKey('FOODB', r.external_id), { name: r.name, unit: r.unit });
    }
  } catch {}

  // FDC API calls with timeout
  const fdcFoods = [
    { id: 170567, name: 'Cheddar cheese' },
    { id: 171477, name: 'Chicken breast' },
    { id: 170148, name: 'Egg, whole, raw' },
    { id: 169228, name: 'Apple, raw' },
    { id: 175167, name: 'Salmon, Atlantic' },
  ];
  try {
    const { usdaClient } = await import('@/lib/services/usda-client');
    for (let i = 0; i < fdcFoods.length; i++) {
      const { id, name } = fdcFoods[i];
      const pct = 35 + Math.round((i / fdcFoods.length) * 35);
      onProgress('fdc', `USDA API ${i + 1}/${fdcFoods.length}: ${name}`, pct);
      try {
        const food = await Promise.race([
          usdaClient.getFoodDetails(id),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
        ]);
        if (food?.foodNutrients) {
          for (const fn of food.foodNutrients) {
            const nutrient = fn.nutrient;
            if (nutrient?.id) {
              const key = makeKey('FDC', String(nutrient.id));
              if (!ref.has(key)) ref.set(key, { name: nutrient.name || 'Unknown', unit: nutrient.unitName || '' });
            }
          }
        }
      } catch {}
    }
  } catch {}

  // CNF API calls with timeout
  const cnfFoods = [
    { id: 2626, name: 'Chicken breast, roasted' },
    { id: 12, name: 'Butter, salted' },
    { id: 133, name: 'Egg, whole, cooked' },
  ];
  try {
    const { cnfClient } = await import('@/lib/services/cnf-client');
    for (let i = 0; i < cnfFoods.length; i++) {
      const { id, name } = cnfFoods[i];
      const pct = 70 + Math.round((i / cnfFoods.length) * 25);
      onProgress('cnf', `CNF API ${i + 1}/${cnfFoods.length}: ${name}`, pct);
      try {
        const nutrients = await Promise.race([
          cnfClient.getNutrients(id),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
        ]);
        if (nutrients) {
          for (const n of nutrients) {
            const key = makeKey('CNF', String(n.nutrient_name_id));
            if (!ref.has(key)) ref.set(key, { name: n.nutrient_web_name || 'Unknown', unit: '' });
          }
        }
      } catch {}
    }
  } catch {}

  onProgress('complete', `Loaded ${ref.size} nutrient definitions`, 100);
  return ref;
}

/**
 * FDC: Fetch a few diverse reference foods from USDA API to collect nutrient definitions.
 * Each food response includes nutrient objects with {id, name, unitName}.
 */
async function buildFdcReference(ref: ReferenceMap): Promise<void> {
  try {
    // Dynamic import to avoid circular deps
    const { usdaClient } = await import('@/lib/services/usda-client');

    // Reference foods that collectively cover many nutrients:
    // 170567 = Cheddar cheese, 171477 = Chicken breast, 170148 = Egg whole raw,
    // 169228 = Apple raw, 175167 = Salmon Atlantic raw
    const referenceFoods = [170567, 171477, 170148, 169228, 175167];

    for (const fdcId of referenceFoods) {
      try {
        const food = await usdaClient.getFoodDetails(fdcId);
        if (food?.foodNutrients) {
          for (const fn of food.foodNutrients) {
            const nutrient = fn.nutrient;
            if (nutrient?.id) {
              const key = makeKey('FDC', String(nutrient.id));
              if (!ref.has(key)) {
                ref.set(key, {
                  name: nutrient.name || 'Unknown',
                  unit: nutrient.unitName || '',
                });
              }
            }
          }
        }
      } catch {
        // Individual food fetch failed — continue with others
      }
    }
  } catch {
    // USDA client not available
  }
}

/**
 * CNF: Fetch nutrient definitions from CNF API via a reference food.
 */
async function buildCnfReference(ref: ReferenceMap): Promise<void> {
  try {
    const { cnfClient } = await import('@/lib/services/cnf-client');

    // Reference food: 2626 = Chicken breast, without skin, roasted (has many nutrients)
    const referenceFoods = [2626, 12, 133];

    for (const foodCode of referenceFoods) {
      try {
        const nutrients = await cnfClient.getNutrients(foodCode);
        if (nutrients) {
          for (const n of nutrients) {
            const key = makeKey('CNF', String(n.nutrient_name_id));
            if (!ref.has(key)) {
              ref.set(key, {
                name: n.nutrient_web_name || 'Unknown',
                unit: '', // CNF doesn't include unit in nutrient response
              });
            }
          }
        }
      } catch {
        // Individual food fetch failed
      }
    }
  } catch {
    // CNF client not available
  }
}
