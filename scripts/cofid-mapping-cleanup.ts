/**
 * One-shot UK_COFID mapping cleanup.
 * Groups A (saturated xb), B (unsaturated cis/omega-specific), C (wrong identity / method).
 */
import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

interface Action {
  compound: string;
  keep: { externalId: string; note: string };
  flag: { externalId: string; note: string };
}

const SAT_NOTE_KEEP = (n: string) => `Primary mapping. ${n} = straight-chain only (excludes branched-chain isomers). More accurate than the plain FOD<N>:0 column which includes branched C<N>:0 (e.g. methyl-branched isomers common in animal fats).`;
const SAT_NOTE_FLAG = (xb: string) => `Duplicate of ${xb} (primary). Plain FOD<N>:0 = total C<N>:0 band including branched-chain isomers, which overstates true straight-chain saturated FA in animal fats and processed foods.`;

const ACTIONS: Action[] = [
  // Group A — saturated FAs: keep xb, flag plain
  {
    compound: 'Behenic Acid',
    keep: { externalId: 'FOD22:0xb', note: SAT_NOTE_KEEP('FOD22:0xb') },
    flag: { externalId: 'FOD22:0', note: SAT_NOTE_FLAG('FOD22:0xb') },
  },
  {
    compound: 'Lauric Acid',
    keep: { externalId: 'FOD12:0xb', note: SAT_NOTE_KEEP('FOD12:0xb') },
    flag: { externalId: 'FOD12:0', note: SAT_NOTE_FLAG('FOD12:0xb') },
  },
  {
    compound: 'Lignoceric Acid',
    keep: { externalId: 'FOD24:0xb', note: SAT_NOTE_KEEP('FOD24:0xb') },
    flag: { externalId: 'FOD24:0', note: SAT_NOTE_FLAG('FOD24:0xb') },
  },
  {
    compound: 'Myristic Acid',
    keep: { externalId: 'FOD14:0xb', note: SAT_NOTE_KEEP('FOD14:0xb') },
    flag: { externalId: 'FOD14:0', note: SAT_NOTE_FLAG('FOD14:0xb') },
  },
  {
    compound: 'Palmitic Acid',
    keep: { externalId: 'FOD16:0xb', note: SAT_NOTE_KEEP('FOD16:0xb') },
    flag: { externalId: 'FOD16:0', note: SAT_NOTE_FLAG('FOD16:0xb') },
  },
  {
    compound: 'Stearic Acid',
    keep: { externalId: 'FOD18:0xb', note: SAT_NOTE_KEEP('FOD18:0xb') },
    flag: { externalId: 'FOD18:0', note: SAT_NOTE_FLAG('FOD18:0xb') },
  },

  // Group B — unsaturated FAs: prefer cis/omega-specific
  {
    compound: 'Decenoic Acid',
    keep: { externalId: 'FOD10:1c', note: 'Primary mapping. FOD10:1c = cis-C10:1 only. Natural form in whole foods is cis (trans-C10:1 is rare).' },
    flag: { externalId: 'FOD10:1', note: 'Duplicate of FOD10:1c (primary). Plain FOD10:1 = total C10:1 including any trans isomers, which is not the natural form.' },
  },
  {
    compound: 'Palmitoleic Acid',
    keep: { externalId: 'FOD16:1c', note: 'Primary mapping. FOD16:1c = cis-C16:1 only. Natural form is cis-9-C16:1 (palmitoleic); trans-C16:1 is industrial.' },
    flag: { externalId: 'FOD16:1', note: 'Duplicate of FOD16:1c (primary). Plain FOD16:1 = total C16:1 including trans isomers.' },
  },
  {
    compound: 'Hexadecatetraenoic Acid',
    keep: { externalId: 'FOD16:4c', note: 'Primary mapping. FOD16:4c = cis-C16:4 only. Natural form is cis.' },
    flag: { externalId: 'FOD16:4', note: 'Duplicate of FOD16:4c (primary). Plain FOD16:4 = total C16:4 including any trans isomers.' },
  },
  {
    compound: 'Oleic Acid',
    keep: { externalId: 'FOD18:1n9', note: 'Primary mapping. FOD18:1n9 = omega-9 specific (cis+trans 18:1n-9). Closest available match for oleic acid (cis-9-C18:1) — UK COFID does not publish a cis-omega-9 specific column.' },
    flag: { externalId: 'FOD18:1', note: 'Duplicate of FOD18:1n9 (primary). Plain FOD18:1 = total C18:1 including non-omega-9 isomers and elaidic; less specific to oleic.' },
  },
  {
    compound: 'Erucic Acid',
    keep: { externalId: 'FOD22:1n9', note: 'Primary mapping. FOD22:1n9 = omega-9 specific. Erucic = cis-13-C22:1 ω-9.' },
    flag: { externalId: 'FOD22:1', note: 'Duplicate of FOD22:1n9 (primary). Plain FOD22:1 = total C22:1 including other isomers.' },
  },
  {
    compound: 'Monounsaturated Fat',
    keep: { externalId: 'MONOFODc', note: 'Primary mapping. MONOFODc = cis-monounsaturated only. Excludes industrial trans-monounsaturated FAs (which Nutri tracks separately as Trans Fat).' },
    flag: { externalId: 'MONOFOD', note: 'Duplicate of MONOFODc (primary). MONOFOD = total monounsaturated including industrial trans-mono, which is double-counted with Trans Fat.' },
  },

  // Group C — wrong identity / wrong method (flag only, no replacement to verify)
  {
    compound: 'Beta-Carotene',
    keep: { externalId: 'BCAR', note: 'Primary mapping. BCAR = beta-carotene specifically.' },
    flag: { externalId: 'CAREQU', note: 'Wrong identity. CAREQU = total carotene equivalents (β + ½α + ½γ-carotene) used for vitamin A activity calculation, not beta-carotene specifically. BCAR is the correct mapping for beta-carotene as a compound.' },
  },
  {
    compound: 'Vitamin A (RAE)',
    keep: { externalId: '__SKIP__', note: '' },
    flag: { externalId: 'RETEQU', note: 'Wrong method. RETEQU = legacy Retinol Equivalents (1 RE = 6 µg β-carotene), not modern Retinol Activity Equivalents (1 RAE = 12 µg β-carotene). UK COFID does not publish RAE; flagging this conflation. Either re-frame the Nutri compound as Vitamin A (RE) or accept that COFID overstates carotenoid contribution by 2x.' },
  },
  {
    compound: 'Energy',
    keep: { externalId: 'KCALS', note: 'Primary mapping. KCALS = energy in kcal (Nutri canonical unit).' },
    flag: { externalId: 'KJ', note: 'Duplicate of KCALS. KJ = same energy value in kJ (1 kcal = 4.184 kJ exactly). Keeping KCALS as primary (no conversion needed).' },
  },
  {
    compound: 'Dietary Fiber',
    keep: { externalId: 'AOACFIB', note: 'Primary mapping. AOACFIB = AOAC fibre method (modern standard, includes insoluble + soluble + resistant starch + lignin). Matches FDA/EU labels.' },
    flag: { externalId: 'ENGFIB', note: 'Duplicate of AOACFIB. ENGFIB = NSP (Englyst non-starch polysaccharides), legacy method that excludes lignin and resistant starch. Values run ~75-80% of AOAC.' },
  },
];

async function main() {
  const summary: Array<{ compound: string; keep: string; flag: string; status: string }> = [];

  for (const action of ACTIONS) {
    // KEEP — verify (skip if marked __SKIP__ — Group C "flag-only" entries)
    if (action.keep.externalId !== '__SKIP__') {
      const keepRow = await db.execute(sql`
        SELECT cs.id FROM compound_sources cs
        JOIN compounds c ON c.id = cs.compound_id
        WHERE cs.external_source = 'UK_COFID'
          AND cs.external_id = ${action.keep.externalId}
          AND c.name = ${action.compound}
      `);
      const keep = ((keepRow as any).rows ?? keepRow)[0];
      if (!keep) {
        summary.push({ compound: action.compound, keep: action.keep.externalId, flag: action.flag.externalId, status: 'KEEP NOT FOUND — skipping' });
        continue;
      }
      await db.execute(sql`
        INSERT INTO compound_source_verifications (compound_source_id, status, notes, verified_at)
        VALUES (${keep.id}, 'verified', ${action.keep.note}, NOW())
        ON CONFLICT (compound_source_id) DO UPDATE SET
          status = 'verified',
          notes = EXCLUDED.notes,
          verified_at = NOW()
      `);
    }

    // FLAG
    const flagRow = await db.execute(sql`
      SELECT cs.id FROM compound_sources cs
      JOIN compounds c ON c.id = cs.compound_id
      WHERE cs.external_source = 'UK_COFID'
        AND cs.external_id = ${action.flag.externalId}
        AND c.name = ${action.compound}
    `);
    const flag = ((flagRow as any).rows ?? flagRow)[0];
    if (!flag) {
      summary.push({ compound: action.compound, keep: action.keep.externalId, flag: action.flag.externalId, status: 'FLAG NOT FOUND — skipping' });
      continue;
    }
    await db.execute(sql`
      INSERT INTO compound_source_verifications (compound_source_id, status, notes, verified_at)
      VALUES (${flag.id}, 'flagged', ${action.flag.note}, NOW())
      ON CONFLICT (compound_source_id) DO UPDATE SET
        status = 'flagged',
        notes = EXCLUDED.notes,
        verified_at = NOW()
    `);

    summary.push({ compound: action.compound, keep: action.keep.externalId, flag: action.flag.externalId, status: 'OK' });
  }

  console.log('Cleanup summary:');
  for (const s of summary) {
    console.log(`  ${s.status === 'OK' ? '✓' : '⚠'} ${s.compound}: keep ${s.keep} / flag ${s.flag} — ${s.status}`);
  }
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
