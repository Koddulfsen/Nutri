/**
 * Second pass on conversion factors, from the two audits added alongside this.
 *
 * scripts/fix-conversion-factors.ts fixed 23 rows in August from
 * docs/AUDIT-2026-08-11.md. These are different rows, found by checking every
 * mapping rather than the ones already known, and each is confirmed two ways:
 *
 *   - scripts/audit-source-units.ts  expected factor from the source catalogue's
 *                                    own unit column
 *   - scripts/audit-magnitudes.ts    the source against the median of its peers
 *                                    on the same food, using values not labels
 *
 * Agreement matters here because neither method is sound alone. MEXT's unit
 * column declares 'g' for calcium while publishing beef liver at 5, which is
 * milligrams — its units were parsed out of the Japanese Standard Tables and
 * still carry leader-dot artifacts. Trusting the label would have "fixed" 13
 * correct MEXT factors into 1000x errors. Every row below is either corroborated
 * by the value audit or verified by reading the staging table by hand; the note
 * on each says which.
 *
 * Two MEXT rows are the mirror image: someone previously DID trust that junk 'g'
 * and scaled them. They are the only factors here that are not 1.0, and both are
 * wrong in the direction that label implies.
 *
 * Factors apply at read time, so none of this changes stored source values — but
 * the 71 existing foods carry merged averages computed with the old factors and
 * need re-importing.
 *
 * Idempotent: each update matches on the current factor, so a second run reports
 * 0 changes. --dry-run prints without writing.
 *
 * Run: npx tsx scripts/fix-conversion-factors-2.ts --dry-run
 */
import 'dotenv/config';
import postgres from 'postgres';

const DRY = process.argv.includes('--dry-run');

type Fix = {
  source: string;
  compound: string;
  externalId: string;
  from: number;
  to: number;
  /** Unit the source actually publishes, written back so the next audit is not blind. */
  sourceUnit: string;
  note: string;
};

const MEXT_AMINO_ACIDS = [
  ['Alanine', 'ALA'], ['Aspartic Acid', 'ASP'], ['Isoleucine', 'ILE'],
  ['Leucine', 'LEU'], ['Lysine', 'LYS'], ['Methionine', 'MET'],
  ['Phenylalanine', 'PHE'], ['Proline', 'PRO'], ['Serine', 'SER'],
  ['Threonine', 'THR'], ['Tryptophan', 'TRP'], ['Tyrosine', 'TYR'],
  ['Valine', 'VAL'],
];

const FIXES: Fix[] = [
  // MEXT amino acids: catalogue says mg, values confirm mg (casein tryptophan
  // 1100, the right order for mg/100g), canonical is g. Every one of these was
  // also flagged ~900-1000x high by the value audit across 40+ foods.
  ...MEXT_AMINO_ACIDS.map(([compound, externalId]): Fix => ({
    source: 'MEXT', compound, externalId, from: 1, to: 0.001, sourceUnit: 'mg',
    note: 'mg -> g; both audits agree',
  })),
  {
    source: 'MEXT', compound: 'Butyric Acid', externalId: 'F4D0',
    from: 1, to: 0.001, sourceUnit: 'mg',
    note: 'mg -> g; both audits agree (5 comparable foods)',
  },
  // The two MEXT rows someone had already scaled by trusting the junk 'g' unit.
  // MEXT publishes vitamin A in micrograms — chicken liver 14000, which is the
  // right order for ug RAE/100g, not grams. Canonical is ug, so the factor is 1.
  {
    source: 'MEXT', compound: 'Vitamin A (RAE)', externalId: 'VITA_RAE',
    from: 1000000, to: 1, sourceUnit: 'µg',
    note: 'catalogue "g" is a parse artifact; values are ug. Value audit: 1.09e6x high',
  },
  // Same shape: soybean oil gamma-tocopherol 81, which is mg/100g, not g.
  {
    source: 'MEXT', compound: 'Gamma-Tocopherol', externalId: 'TOCPHG',
    from: 1000, to: 1, sourceUnit: 'mg',
    note: 'catalogue "g" is a parse artifact; values are mg. Value audit: 1.5e3x high',
  },
  // FRIDA amino acids missed by the August pass, which fixed 14 of them.
  ...[['Threonine', 'THR'], ['Tryptophan', 'TRP'], ['Tyrosine', 'TYR'], ['Valine', 'VAL']]
    .map(([compound, externalId]): Fix => ({
      source: 'FRIDA', compound, externalId, from: 1, to: 0.001, sourceUnit: 'mg/100g',
      note: 'mg -> g; both audits agree (45+ foods)',
    })),
  {
    source: 'FINELI', compound: 'Tryptophan', externalId: 'TRP',
    from: 1, to: 0.001, sourceUnit: 'mg',
    note: 'mg -> g; both audits agree (48 foods)',
  },
  // Matvaretabellen publishes salt in grams; canonical is mg. No value
  // corroboration (too few comparable foods), but Matvaretabellen's unit column
  // is clean, unlike MEXT's.
  {
    source: 'MATVARETABELLEN', compound: 'Salt', externalId: 'NaCl',
    from: 1, to: 1000, sourceUnit: 'g',
    note: 'g -> mg; label audit only, catalogue unit is reliable for this source',
  },
  // CoFID publishes energy twice, as KJ and KCALS, both mapped to Energy. The
  // kcal row is right at 1.0; the kJ row needs converting or the two get
  // averaged together (Apple: 60 and 254 -> 157).
  {
    source: 'UK_COFID', compound: 'Energy', externalId: 'KJ',
    from: 1, to: 1 / 4.184, sourceUnit: 'kJ',
    note: 'kJ -> kcal',
  },
];

const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('Set MIGRATION_DATABASE_URL');
  process.exit(1);
}
const sql = postgres(url, { max: 1 });

async function main() {
  let applied = 0;
  let skipped = 0;

  console.log('\n%s — %d fixes\n', DRY ? 'DRY RUN' : 'APPLYING', FIXES.length);

  for (const f of FIXES) {
    const rows = await sql<{ id: string; conversion_factor: string }[]>`
      SELECT cs.id, cs.conversion_factor
      FROM compound_sources cs
      JOIN compounds c ON c.id = cs.compound_id
      WHERE cs.external_source::text = ${f.source}
        AND c.name = ${f.compound}
        AND cs.external_id = ${f.externalId}`;

    if (rows.length === 0) {
      console.log('  skip   %s %s — no such mapping', f.source.padEnd(16), f.compound);
      skipped++;
      continue;
    }
    if (rows.length > 1) {
      console.log('  ABORT  %s %s — %d mappings share this id', f.source.padEnd(16), f.compound, rows.length);
      skipped++;
      continue;
    }

    const current = parseFloat(rows[0].conversion_factor);
    if (Math.abs(current - f.to) / f.to < 1e-9) {
      console.log('  done   %s %s — already x%s', f.source.padEnd(16), f.compound.padEnd(22), f.to);
      skipped++;
      continue;
    }
    if (Math.abs(current - f.from) / f.from > 1e-9) {
      console.log(
        '  ABORT  %s %s — expected x%s, found x%s; not touching it',
        f.source.padEnd(16), f.compound.padEnd(22), f.from, current
      );
      skipped++;
      continue;
    }

    console.log(
      '  %s  %s %s x%s -> x%s  (%s)',
      DRY ? 'would ' : 'apply ', f.source.padEnd(16), f.compound.padEnd(22),
      f.from, f.to.toPrecision(6), f.note
    );
    if (!DRY) {
      await sql`
        UPDATE compound_sources
        SET conversion_factor = ${f.to}, source_unit = ${f.sourceUnit}
        WHERE id = ${rows[0].id}`;
    }
    applied++;
  }

  console.log('\n%s: %d change%s, %d skipped\n', DRY ? 'DRY RUN' : 'APPLIED', applied, applied === 1 ? '' : 's', skipped);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
