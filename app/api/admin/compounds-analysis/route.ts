/**
 * Compound Data Quality Analysis API
 *
 * Comprehensive validation of compound mappings across all sources.
 * Detects errors, inconsistencies, and potential data quality issues.
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { compounds, compoundSources } from '@/db/schema';
import { eq, sql, count, asc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/api-guard';

// ============================================================================
// Known Correct IDs (Reference Tables from MEMORY.md)
// ============================================================================

const KNOWN_FDC_IDS: Record<string, number> = {
  // Minerals (1087-1103 range)
  'Calcium (Total)': 1087,
  'Iron (Total)': 1089,
  'Magnesium (Total)': 1090,
  'Phosphorus': 1091,
  'Potassium': 1092,
  'Sodium': 1093,
  'Zinc (Total)': 1095,
  'Chromium (Total)': 1096,
  'Copper (Total)': 1098,
  'Fluoride': 1099,
  'Iodine': 1100,
  'Manganese': 1101,
  'Molybdenum': 1102,
  'Selenium': 1103,
  // Tocopherols
  'Beta-Tocopherol': 1125,
  'Gamma-Tocopherol': 1126,
  'Delta-Tocopherol': 1127,
  'Alpha-Tocotrienol': 1128,
  // Vitamins
  'Vitamin A (RAE)': 1106,
  'Retinol': 1105,
  'Vitamin C (Total)': 1162,
  'Vitamin D (Total)': 1114,
  'Vitamin E (Total)': 1109,
  'Alpha-Tocopherol': 1109,
  'Vitamin K (Total)': 1185,
  'Thiamin (B1)': 1165,
  'Riboflavin (B2)': 1166,
  'Niacin (B3)': 1167,
  'Pantothenic Acid (B5)': 1170,
  'Vitamin B6 (Total)': 1175,
  'Biotin (B7)': 1176,
  'Folate (Total)': 1177,
  'Vitamin B12 (Total)': 1178,
  'Choline (Total)': 1180,
  // Macros
  'Protein': 1003,
  'Total Fat': 1004,
  'Carbohydrates': 1005,
  'Dietary Fiber': 1079,
  'Total Sugars': 2000,
  'Energy': 1008,
  // Sugars
  'Glucose': 1011,
  'Fructose': 1012,
  'Galactose': 1075,
  'Sucrose': 1010,
  'Lactose': 1013,
  'Maltose': 1014,
  'Starch': 1009,
};

const KNOWN_CNF_IDS: Record<string, number> = {
  // Minerals
  'Calcium (Total)': 301,
  'Iron (Total)': 303,
  'Magnesium (Total)': 304,
  'Phosphorus': 305,
  'Potassium': 306,
  'Sodium': 307,
  'Zinc (Total)': 309,
  'Chromium (Total)': 310,
  'Copper (Total)': 312,
  'Fluoride': 313,
  'Iodine': 314,
  'Manganese': 315,
  'Molybdenum': 316,
  'Selenium': 317,
  // Vitamins
  'Vitamin A (RAE)': 318,
  'Vitamin C (Total)': 401,
  'Thiamin (B1)': 404,
  'Riboflavin (B2)': 405,
  'Niacin (B3)': 406,
  'Vitamin B6 (Total)': 415,
  'Folate (Total)': 417,
  'Vitamin B12 (Total)': 418,
  'Vitamin D (Total)': 324,
  'Vitamin E (Total)': 323,
  'Vitamin K (Total)': 329,
};

// Valid INFOODS tagnames for sources that use them
const VALID_INFOODS_TAGNAMES = new Set([
  // Energy
  'ENERC', 'ENERA',
  // Macros
  'PROCNT', 'PROT', 'FAT', 'FASAT', 'FAMS', 'FAPU', 'FATRN',
  'CHOCDF', 'CHOAVL', 'SUGAR', 'STARCH', 'FIBTG', 'FIBC',
  // Sugars
  'GLUS', 'FRUS', 'GALS', 'SUCS', 'LACS', 'MALS',
  // Minerals
  'CA', 'FE', 'MG', 'P', 'K', 'NA', 'ZN', 'CU', 'MN', 'SE', 'CR', 'MO', 'ID', 'F', 'CL',
  // Vitamins
  'VITA', 'VITA_RAE', 'VITA_IU', 'RETOL', 'CARTB', 'CARTA', 'CRYPX',
  'VITC', 'THIA', 'RIBF', 'NIA', 'NIAEQ', 'PANTAC', 'VITB6', 'VITPYRID',
  'FOL', 'FOLAC', 'FOLFD', 'FOLDFE', 'VITB12',
  'VITD', 'VITD2', 'VITD3', 'VITE', 'TOCPHA', 'TOCPHB', 'TOCPHG', 'TOCPHD',
  'VITK', 'VITK1', 'VITK2',
  'CHOLN', 'BETN',
  // Amino acids
  'AAT', 'TRP', 'THR', 'ILE', 'LEU', 'LYS', 'MET', 'CYS', 'PHE', 'TYR', 'VAL',
  'ARG', 'HIS', 'ALA', 'ASP', 'GLU', 'GLY', 'PRO', 'SER', 'HYP',
  // Fatty acids
  'F4D0', 'F6D0', 'F8D0', 'F10D0', 'F12D0', 'F14D0', 'F16D0', 'F18D0', 'F20D0', 'F22D0', 'F24D0',
  'F14D1', 'F16D1', 'F18D1', 'F20D1', 'F22D1', 'F24D1',
  'F18D2', 'F18D3', 'F18D4', 'F20D4', 'F20D5', 'F22D5', 'F22D6',
  // Other
  'WATER', 'ASH', 'ALC', 'CAFFN', 'THEBRN',
]);

// Expected conversion factors (common ones)
const VALID_CONVERSION_FACTORS = new Set([
  '1', '1.0', '1.00',
  '0.001', // mg to g
  '1000', // g to mg
  '0.239', '0.2388', // kJ to kcal
  '4.184', // kcal to kJ
  '0.3', '0.33', '0.333', // RE conversions
  '0.05', '0.0833', // IU conversions for vitamins
  '40', '0.025', // Vitamin D IU conversions
]);

// FDC ID ranges by compound type
const FDC_ID_RANGES: Record<string, [number, number]> = {
  'MACRONUTRIENT': [1003, 2100],
  'MINERAL': [1087, 1104],
  'VITAMIN': [1104, 1200],
  'AMINO_ACID': [1210, 1300],
};

// Sources that use INFOODS tagnames
const INFOODS_SOURCES = new Set(['FOODfiles', 'Fineli', 'BLS', 'NEVO', 'KFCT', 'ASEANFOODS']);

// Sources that use numeric IDs
const NUMERIC_ID_SOURCES = new Set(['FDC', 'CNF', 'FRIDA', 'CIQUAL', 'Matvaretabellen']);

export async function GET() {
  // Admin-only. Middleware is a second line of defence, not a boundary
  // (see CVE-2025-29927: middleware can be skipped entirely).
  const denied = await requireAdmin();
  if (denied) return denied;


  try {
    // 1. Get all compounds with mapping counts
    const compoundsWithCounts = await db
      .select({
        id: compounds.id,
        name: compounds.name,
        compoundType: compounds.compoundType,
        mappingCount: count(compoundSources.id),
      })
      .from(compounds)
      .leftJoin(compoundSources, eq(compounds.id, compoundSources.compoundId))
      .groupBy(compounds.id, compounds.name, compounds.compoundType)
      .orderBy(asc(compounds.name));

    // 2. Get source distribution
    const sourceDistribution = await db
      .select({
        source: compoundSources.externalSource,
        count: count(),
      })
      .from(compoundSources)
      .groupBy(compoundSources.externalSource)
      .orderBy(sql`count(*) DESC`);

    // 3. Find duplicate external IDs within sources
    const duplicateIds = await db.execute(sql`
      SELECT external_source, external_id, array_agg(c.name) as compounds
      FROM compound_sources cs
      JOIN compounds c ON cs.compound_id = c.id
      GROUP BY external_source, external_id
      HAVING COUNT(*) > 1
    `);

    // 4. Get all mappings for detailed analysis
    const allMappings = await db
      .select({
        compoundId: compoundSources.compoundId,
        compoundName: compounds.name,
        compoundType: compounds.compoundType,
        externalSource: compoundSources.externalSource,
        externalId: compoundSources.externalId,
        sourceName: compoundSources.sourceName,
        sourceUnit: compoundSources.sourceUnit,
        conversionFactor: compoundSources.conversionFactor,
      })
      .from(compoundSources)
      .innerJoin(compounds, eq(compoundSources.compoundId, compounds.id))
      .orderBy(compounds.name, compoundSources.externalSource);

    // 5. Analyze for issues
    const issues: {
      type: string;
      severity: 'error' | 'warning' | 'info';
      compound: string;
      source?: string;
      externalId?: string;
      message: string;
      details?: string;
    }[] = [];

    // ========================================================================
    // CHECK 1: Compounds with no mappings
    // ========================================================================
    const noMappings = compoundsWithCounts.filter(c => c.mappingCount === 0);
    for (const c of noMappings) {
      issues.push({
        type: 'no_mappings',
        severity: 'error',
        compound: c.name,
        message: 'No source mappings',
        details: 'This compound cannot be imported from any data source',
      });
    }

    // ========================================================================
    // CHECK 2: Low mapping counts (< 3)
    // ========================================================================
    const lowMappings = compoundsWithCounts.filter(c => c.mappingCount > 0 && c.mappingCount < 3);
    for (const c of lowMappings) {
      issues.push({
        type: 'low_mappings',
        severity: 'warning',
        compound: c.name,
        message: `Only ${c.mappingCount} source mapping(s)`,
        details: 'Consider adding more source mappings for better coverage',
      });
    }

    // ========================================================================
    // CHECK 3: Duplicate IDs within a source
    // ========================================================================
    for (const dup of ((duplicateIds as any).rows ?? duplicateIds) as any[]) {
      issues.push({
        type: 'duplicate_id',
        severity: 'error',
        compound: dup.compounds.join(', '),
        source: dup.external_source,
        externalId: dup.external_id,
        message: `Duplicate ID: ${dup.external_id}`,
        details: `Same external ID used by multiple compounds`,
      });
    }

    // ========================================================================
    // CHECK 4: Known FDC ID validation
    // ========================================================================
    const fdcMappings = allMappings.filter(m => m.externalSource === 'FDC');
    for (const m of fdcMappings) {
      const knownId = KNOWN_FDC_IDS[m.compoundName];
      if (knownId && m.externalId !== String(knownId)) {
        issues.push({
          type: 'wrong_fdc_id',
          severity: 'error',
          compound: m.compoundName,
          source: 'FDC',
          externalId: m.externalId,
          message: `FDC ID mismatch`,
          details: `Has ${m.externalId}, expected ${knownId}`,
        });
      }
    }

    // ========================================================================
    // CHECK 5: Known CNF ID validation
    // ========================================================================
    const cnfMappings = allMappings.filter(m => m.externalSource === 'CNF');
    for (const m of cnfMappings) {
      const knownId = KNOWN_CNF_IDS[m.compoundName];
      if (knownId && m.externalId !== String(knownId)) {
        issues.push({
          type: 'wrong_cnf_id',
          severity: 'error',
          compound: m.compoundName,
          source: 'CNF',
          externalId: m.externalId,
          message: `CNF ID mismatch`,
          details: `Has ${m.externalId}, expected ${knownId}`,
        });
      }
    }

    // ========================================================================
    // CHECK 6: FDC ID range validation
    // ========================================================================
    for (const m of fdcMappings) {
      const id = parseInt(m.externalId);
      if (isNaN(id)) {
        issues.push({
          type: 'invalid_id_format',
          severity: 'error',
          compound: m.compoundName,
          source: 'FDC',
          externalId: m.externalId,
          message: 'FDC ID should be numeric',
          details: `Got "${m.externalId}" which is not a valid number`,
        });
        continue;
      }

      const range = FDC_ID_RANGES[m.compoundType];
      if (range && (id < range[0] || id > range[1])) {
        // Only warn, don't error - ranges aren't strict
        issues.push({
          type: 'id_out_of_range',
          severity: 'info',
          compound: m.compoundName,
          source: 'FDC',
          externalId: m.externalId,
          message: `ID outside typical range for ${m.compoundType}`,
          details: `Expected ${range[0]}-${range[1]}, got ${id}`,
        });
      }
    }

    // ========================================================================
    // CHECK 7: INFOODS tagname validation
    // ========================================================================
    for (const m of allMappings) {
      if (!INFOODS_SOURCES.has(m.externalSource)) continue;

      const tagname = m.externalId.toUpperCase();
      // Allow numeric IDs for some sources
      if (/^\d+$/.test(m.externalId)) continue;

      if (!VALID_INFOODS_TAGNAMES.has(tagname) && !/^F\d+D\d+/.test(tagname)) {
        issues.push({
          type: 'unknown_infoods_tagname',
          severity: 'info',
          compound: m.compoundName,
          source: m.externalSource,
          externalId: m.externalId,
          message: `Unknown INFOODS tagname: ${tagname}`,
          details: 'Verify this is a valid tagname for this source',
        });
      }
    }

    // ========================================================================
    // CHECK 8: Numeric ID format for numeric sources
    // ========================================================================
    for (const m of allMappings) {
      if (!NUMERIC_ID_SOURCES.has(m.externalSource)) continue;
      if (m.externalSource === 'FDC') continue; // Already checked above

      if (!/^\d+$/.test(m.externalId)) {
        issues.push({
          type: 'invalid_id_format',
          severity: 'warning',
          compound: m.compoundName,
          source: m.externalSource,
          externalId: m.externalId,
          message: `${m.externalSource} ID should be numeric`,
          details: `Got "${m.externalId}"`,
        });
      }
    }

    // ========================================================================
    // CHECK 9: Conversion factor validation
    // ========================================================================
    for (const m of allMappings) {
      if (!m.conversionFactor) continue;

      const factor = m.conversionFactor.toString();
      if (!VALID_CONVERSION_FACTORS.has(factor)) {
        const num = parseFloat(factor);
        // Allow factors between 0.001 and 10000
        if (isNaN(num) || num <= 0 || num > 10000) {
          issues.push({
            type: 'unusual_conversion_factor',
            severity: 'warning',
            compound: m.compoundName,
            source: m.externalSource,
            message: `Unusual conversion factor: ${factor}`,
            details: 'Verify this conversion is correct',
          });
        } else if (num !== 1 && num !== 0.001 && num !== 1000) {
          // Flag non-standard factors as info
          issues.push({
            type: 'non_standard_conversion',
            severity: 'info',
            compound: m.compoundName,
            source: m.externalSource,
            message: `Non-standard conversion: ${factor}`,
            details: 'Double-check unit conversion is correct',
          });
        }
      }
    }

    // ========================================================================
    // CHECK 10: Unit inconsistency across sources
    // ========================================================================
    const compoundUnits: Record<string, Set<string>> = {};
    for (const m of allMappings) {
      if (!compoundUnits[m.compoundName]) {
        compoundUnits[m.compoundName] = new Set();
      }
      if (m.sourceUnit) {
        compoundUnits[m.compoundName].add(m.sourceUnit.toLowerCase());
      }
    }
    for (const compound of Object.keys(compoundUnits)) {
      const units = compoundUnits[compound];
      if (units.size > 2) {
        issues.push({
          type: 'unit_inconsistency',
          severity: 'warning',
          compound,
          message: `Multiple units: ${Array.from(units).join(', ')}`,
          details: 'Different sources report different units',
        });
      }
    }

    // ========================================================================
    // CHECK 11: Cross-source name consistency
    // ========================================================================
    const compoundSourceNames: Record<string, Array<{ source: string; name: string }>> = {};
    for (const m of allMappings) {
      if (!m.sourceName) continue;
      if (!compoundSourceNames[m.compoundName]) {
        compoundSourceNames[m.compoundName] = [];
      }
      compoundSourceNames[m.compoundName].push({
        source: m.externalSource,
        name: m.sourceName,
      });
    }

    for (const [compound, sourceNames] of Object.entries(compoundSourceNames)) {
      if (sourceNames.length < 3) continue;

      // Normalize names for comparison
      const normalized = sourceNames.map(sn => ({
        ...sn,
        normalized: sn.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      }));

      // Find names that don't share any common substring with others
      for (const sn of normalized) {
        const others = normalized.filter(x => x.source !== sn.source);
        const hasMatch = others.some(other =>
          sn.normalized.includes(other.normalized.slice(0, 4)) ||
          other.normalized.includes(sn.normalized.slice(0, 4))
        );

        if (!hasMatch && sn.normalized.length > 3) {
          issues.push({
            type: 'cross_source_name_mismatch',
            severity: 'warning',
            compound,
            source: sn.source,
            message: `Name differs from other sources: "${sn.name}"`,
            details: `Other sources use different names - verify mapping is correct`,
          });
        }
      }
    }

    // ========================================================================
    // CHECK 12: Source name very different from compound name
    // ========================================================================
    for (const m of allMappings) {
      if (!m.sourceName) continue;
      const compoundLower = m.compoundName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const sourceLower = m.sourceName.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Skip known aliases
      const isKnownAlias =
        (m.compoundName.includes('Vitamin') && m.sourceName.toLowerCase().includes('vitamin')) ||
        (m.compoundName.includes('Vitamin C') && sourceLower.includes('ascorb')) ||
        (m.compoundName.includes('Vitamin B1') && sourceLower.includes('thiamin')) ||
        (m.compoundName.includes('Vitamin B2') && sourceLower.includes('riboflavin')) ||
        (m.compoundName.includes('Vitamin B3') && (sourceLower.includes('niacin') || sourceLower.includes('nicotinic'))) ||
        (m.compoundName.includes('Vitamin B9') && sourceLower.includes('fol')) ||
        (m.compoundName.includes('Folate') && sourceLower.includes('fol'));

      if (isKnownAlias) continue;

      // Check if names share any common substring
      if (compoundLower.slice(0, 4) !== sourceLower.slice(0, 4) &&
          !sourceLower.includes(compoundLower.slice(0, 4)) &&
          !compoundLower.includes(sourceLower.slice(0, 4))) {
        issues.push({
          type: 'name_mismatch',
          severity: 'info',
          compound: m.compoundName,
          source: m.externalSource,
          externalId: m.externalId,
          message: `Name differs: "${m.sourceName}"`,
          details: 'Source name is different - verify this is correct',
        });
      }
    }

    // ========================================================================
    // CHECK 13: Missing major sources for core nutrients
    // ========================================================================
    const coreCompounds = compoundsWithCounts.filter(c =>
      c.compoundType === 'VITAMIN' || c.compoundType === 'MINERAL'
    );
    for (const c of coreCompounds) {
      const mappings = allMappings.filter(m => m.compoundId === c.id);
      const hasFDC = mappings.some(m => m.externalSource === 'FDC');
      const hasCNF = mappings.some(m => m.externalSource === 'CNF');

      if (!hasFDC && c.name !== 'Chloride') {
        issues.push({
          type: 'missing_fdc',
          severity: 'warning',
          compound: c.name,
          source: 'FDC',
          message: 'Missing FDC mapping',
          details: 'Core nutrient should have FDC (USDA) mapping',
        });
      }
      if (!hasCNF) {
        issues.push({
          type: 'missing_cnf',
          severity: 'info',
          compound: c.name,
          source: 'CNF',
          message: 'Missing CNF mapping',
          details: 'Consider adding CNF (Canadian) mapping',
        });
      }
    }

    // ========================================================================
    // CHECK 14: FooDB ID format (should be numeric or FDBxxxxxx)
    // ========================================================================
    const foodbMappings = allMappings.filter(m => m.externalSource === 'FooDB');
    for (const m of foodbMappings) {
      if (!/^\d+$/.test(m.externalId) && !/^FDB\d+$/.test(m.externalId)) {
        issues.push({
          type: 'invalid_id_format',
          severity: 'warning',
          compound: m.compoundName,
          source: 'FooDB',
          externalId: m.externalId,
          message: 'Invalid FooDB ID format',
          details: 'Expected numeric ID or FDBxxxxxx format',
        });
      }
    }

    // ========================================================================
    // CHECK 15: Missing source_name (useful for verification)
    // ========================================================================
    const missingSourceName = allMappings.filter(m => !m.sourceName);
    if (missingSourceName.length > 0) {
      const grouped: Record<string, number> = {};
      for (const m of missingSourceName) {
        grouped[m.externalSource] = (grouped[m.externalSource] || 0) + 1;
      }
      for (const [source, count] of Object.entries(grouped)) {
        issues.push({
          type: 'missing_source_name',
          severity: 'info',
          compound: `${count} mappings`,
          source,
          message: `${count} mappings without source_name`,
          details: 'Source names help verify mapping correctness',
        });
      }
    }

    // ========================================================================
    // Build summary stats
    // ========================================================================
    const summary = {
      totalCompounds: compoundsWithCounts.length,
      totalMappings: allMappings.length,
      avgMappingsPerCompound: (allMappings.length / compoundsWithCounts.length).toFixed(1),
      compoundsWithNoMappings: noMappings.length,
      compoundsWithLowMappings: lowMappings.length,
      issuesByType: {} as Record<string, number>,
      issuesBySeverity: {
        error: issues.filter(i => i.severity === 'error').length,
        warning: issues.filter(i => i.severity === 'warning').length,
        info: issues.filter(i => i.severity === 'info').length,
      },
    };

    for (const issue of issues) {
      summary.issuesByType[issue.type] = (summary.issuesByType[issue.type] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        sourceDistribution: sourceDistribution.map(s => ({
          source: s.source,
          count: Number(s.count),
        })),
        compoundsByType: Object.entries(
          compoundsWithCounts.reduce((acc, c) => {
            acc[c.compoundType] = (acc[c.compoundType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([type, count]) => ({ type, count })),
        issues: issues.sort((a, b) => {
          const severityOrder = { error: 0, warning: 1, info: 2 };
          if (severityOrder[a.severity] !== severityOrder[b.severity]) {
            return severityOrder[a.severity] - severityOrder[b.severity];
          }
          return a.compound.localeCompare(b.compound);
        }),
        compoundsWithCounts,
      },
    });
  } catch (error: any) {
    console.error('Compounds analysis error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
