/**
 * Compact wire format for food vectors.
 *
 * Sent the obvious way (an object per nutrient, with a 36-character compound
 * id, a name and a unit on every row) one food is ~35 KB. Here each row is a
 * 4-number tuple pointing into two small dictionaries shared by the whole
 * response, which is roughly a tenth of that. Pure, so the server packs and
 * the browser unpacks with the same code.
 */

import type { FoodVector } from './totals';

/** [index into `compounds`, value per 100 g, index into `units`, sourceCount] */
export type PackedRow = [number, number, number, number];

export interface VectorPack {
  compounds: Array<{ id: string; name: string }>;
  units: string[];
  foods: Record<string, PackedRow[]>;
}

export function packVectors(vectors: Record<string, FoodVector>): VectorPack {
  const compoundIndex = new Map<string, number>();
  const unitIndex = new Map<string, number>();
  const pack: VectorPack = { compounds: [], units: [], foods: {} };

  for (const [foodId, rows] of Object.entries(vectors)) {
    pack.foods[foodId] = rows.map((r) => {
      let c = compoundIndex.get(r.compoundId);
      if (c === undefined) {
        c = pack.compounds.length;
        compoundIndex.set(r.compoundId, c);
        pack.compounds.push({ id: r.compoundId, name: r.name });
      }
      let u = unitIndex.get(r.unit);
      if (u === undefined) {
        u = pack.units.length;
        unitIndex.set(r.unit, u);
        pack.units.push(r.unit);
      }
      return [c, r.value, u, r.sourceCount];
    });
  }
  return pack;
}

export function unpackVectors(pack: VectorPack): Map<string, FoodVector> {
  const out = new Map<string, FoodVector>();
  for (const [foodId, rows] of Object.entries(pack.foods)) {
    out.set(
      foodId,
      rows.map(([c, value, u, sourceCount]) => ({
        compoundId: pack.compounds[c].id,
        name: pack.compounds[c].name,
        value,
        unit: pack.units[u],
        sourceCount,
      }))
    );
  }
  return out;
}
