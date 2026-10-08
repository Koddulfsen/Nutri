/**
 * The one place a resolved DV row becomes the {value, unit} a bar is drawn from.
 *
 * It exists because this rule was written twice and the copies drifted. Both said "emit nothing unless
 * there is a target", which silently hid the eleven compounds that have a ceiling and no requirement
 * (cadmium, mercury, cholesterol, retinol, nicotinamide, nicotinic acid, boron, nickel, lutein, lycopene,
 * total plant sterols). Fixing `buildDvValues` in daily-totals-payload.ts on 2026-10-08 made the bars
 * appear on a server-rendered load, while POST /api/daily-values still dropped them — so the bars vanished
 * again the moment the browser recomputed a day locally after adding a food. The amounts kept updating,
 * because those come from the locally computed totals; only the bars went blank, which is exactly what
 * Jens reported.
 *
 * Two callers, one rule. Add a third caller here rather than inlining it again.
 */
import type { DvValue } from '@/lib/nutrition/totals';
import type { DvLookupRow } from '@/lib/services/daily-value-service';

/**
 * Returns what the bar should measure against, or null when the row supports no bar at all.
 *
 * A target wins when there is one: it answers "how much do I need", and a ceiling beside it is extra
 * information the target bar already renders as its overflow. Only when no body sets a requirement does
 * the ceiling itself become the bar, and then `limitOnly` tells the UI the number means the opposite —
 * headroom used, where full is bad.
 */
export function dvValueFromRow(row: DvLookupRow): DvValue | null {
  if (row.target != null && row.targetUnit) {
    return {
      value: row.target,
      unit: row.targetUnit,
      source: 'average',
      upperLimit: row.upperLimit,
      upperLimitUnit: row.upperLimitUnit,
      sourceCount: row.targetSourceCount,
      sources: row.targetSources,
      spread: row.targetSpread,
      supplementLimit: row.supplementLimit,
    };
  }

  if (row.upperLimit != null && row.upperLimitUnit) {
    // Weekly and monthly ceilings are divided down to a day so they sit beside everything else on a
    // one-day page (Jens, 2026-10-08). `perDayFrom` keeps what was actually published, because no body
    // sets a daily cadmium or mercury ceiling — EFSA's is a weekly TWI, JECFA's a monthly PTMI — and a
    // bare daily number would state something nobody published.
    const days = row.averagingDays > 1 ? row.averagingDays : 1;
    return {
      value: row.upperLimit / days,
      unit: row.upperLimitUnit,
      source: 'limit',
      sourceCount: row.upperLimitSourceCount,
      limitOnly: true,
      perDayFrom: days > 1 ? { averagingDays: days, publishedValue: row.upperLimit } : null,
    };
  }

  // Everything left over is a shape no bar can draw: a % -of-energy value with no amount behind it, a
  // range, a disease floor, a supplement-only ceiling, an EAR. The resolver still carries each of those;
  // they belong to a richer UI than a single bar.
  return null;
}
