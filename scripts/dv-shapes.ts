/**
 * Classify each compound by its DV "shape" — which combination of value types
 * is published. This tells us what kind of progress bar makes sense for each.
 *
 * Shapes:
 *   FULL          — has target (RDA/AI) AND upper limit (UL). Classic 3-zone bar.
 *   TARGET_ONLY   — has target (RDA/AI) but no UL. Fill toward target, no cap.
 *   UL_ONLY       — only UL published. "Stay under" bar (red when exceeded).
 *   RANGE_ONLY    — AMDR (% of calories) only. Macro-style range bar.
 *   CAP_ONLY      — CDRR/SDT only. "Lower is better" bar.
 *   MIXED         — uncommon combinations.
 *
 * Run: npx tsx scripts/dv-shapes.ts
 */

import 'dotenv/config';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function main() {
  const rows = await db.execute(sql`
    SELECT c.name AS compound,
           BOOL_OR(rdv.value_type IN ('RDA','AI')) AS has_target,
           BOOL_OR(rdv.value_type = 'UL') AS has_ul,
           BOOL_OR(rdv.value_type = 'AMDR') AS has_amdr,
           BOOL_OR(rdv.value_type = 'CDRR') AS has_cdrr,
           BOOL_OR(rdv.value_type = 'EAR') AS has_ear,
           STRING_AGG(DISTINCT rdv.value_type::text, ',' ORDER BY rdv.value_type::text) AS types,
           COUNT(DISTINCT rdv.source_region)::int AS sources
    FROM reference_daily_values rdv
    JOIN compounds c ON c.id = rdv.compound_id
    GROUP BY c.name
    ORDER BY c.name
  `) as unknown as Array<{
    compound: string; has_target: boolean; has_ul: boolean;
    has_amdr: boolean; has_cdrr: boolean; has_ear: boolean;
    types: string; sources: number;
  }>;

  const shape = (r: typeof rows[number]) => {
    const t = r.has_target, u = r.has_ul, a = r.has_amdr, c = r.has_cdrr;
    if (t && u) return 'FULL';
    if (t && !u && !a && !c) return 'TARGET_ONLY';
    if (!t && u && !a && !c) return 'UL_ONLY';
    if (!t && !u && a && !c) return 'RANGE_ONLY';
    if (!t && !u && !a && c) return 'CAP_ONLY';
    if (t && a && !u) return 'TARGET_WITH_RANGE';
    return 'MIXED';
  };

  const byShape: Record<string, Array<{ compound: string; sources: number; types: string }>> = {};
  for (const r of rows) {
    const s = shape(r);
    (byShape[s] ??= []).push({ compound: r.compound, sources: r.sources, types: r.types });
  }

  const order = ['FULL', 'TARGET_ONLY', 'TARGET_WITH_RANGE', 'UL_ONLY', 'RANGE_ONLY', 'CAP_ONLY', 'MIXED'];
  for (const shapeName of order) {
    const items = byShape[shapeName];
    if (!items?.length) continue;
    console.log(`\n=== ${shapeName} (${items.length} compounds) ===`);
    console.table(items);
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
