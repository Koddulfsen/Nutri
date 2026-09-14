/**
 * Print CNS 2023 raw values laid out like the printed appendix tables, for
 * cell-by-cell verification against the PDF.
 * Run: npx tsx scripts/dv-verify/print-cns-table.ts <ARRAY_NAME> [<ARRAY_NAME> ...]
 */
import * as RV from '../../dv-sources/cns-2023/raw-values';
const names = process.argv.slice(2);
const rows = RV.DEMO_KEYS;
const fmt = (v: unknown) => (v == null ? '—' : String(v));
console.log(['demo', ...names].map((n) => n.padEnd(12)).join(''));
for (const k of rows) {
  console.log([k, ...names.map((n) => fmt((RV as any)[n]?.[k]))].map((c) => String(c).padEnd(12)).join(''));
}
