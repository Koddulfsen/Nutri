/**
 * Source Nutrient Reference Service
 *
 * Looks up the ACTUAL nutrient name from each external source for a given external ID.
 * Used by the mapping verification tool to confirm compound_sources mappings are correct.
 *
 * All 16 sources resolve from local catalog tables (source_<x>_nutrients).
 * FDC + CNF originally queried APIs but are now seeded into source_fdc_nutrients
 * and source_cnf_nutrients catalogs (see scripts/seed-fdc-nutrients.ts).
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
  { source: 'FDC', table: 'source_fdc_nutrients', idColumn: 'nutrient_id', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'CNF', table: 'source_cnf_nutrients', idColumn: 'nutrient_id', nameColumn: 'name', unitColumn: 'unit' },
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

  // 2. FooDB compounds (separate structure — no unit column)
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

  // 3. Duke chemicals (separate structure — no unit column)
  const dukePromise = (async () => {
    try {
      const rows = await db.execute(sql`
        SELECT chem_id as external_id, name, '' as unit
        FROM source_duke_chemicals
      `);
      const resultRows = (rows as any).rows ?? rows;
      for (const row of resultRows) {
        const r = row as { external_id: string; name: string; unit: string };
        ref.set(makeKey('DUKE', r.external_id), { name: r.name, unit: r.unit });
      }
    } catch {
      // skip
    }
  })();

  // FDC + CNF are loaded via STAGING_SOURCES (local source_fdc_nutrients / source_cnf_nutrients catalogs).

  await Promise.all([...stagingPromises, foodbPromise, dukePromise]);

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

  onProgress('staging', 'Loading Duke chemicals...', 34);
  try {
    const rows = await db.execute(sql`
      SELECT chem_id as external_id, name, '' as unit FROM source_duke_chemicals
    `);
    const resultRows = (rows as any).rows ?? rows;
    for (const row of resultRows) {
      const r = row as { external_id: string; name: string; unit: string };
      ref.set(makeKey('DUKE', r.external_id), { name: r.name, unit: r.unit });
    }
  } catch {}

  // FDC + CNF nutrients are loaded via STAGING_SOURCES above (local catalog tables).

  onProgress('complete', `Loaded ${ref.size} nutrient definitions`, 100);
  return ref;
}
