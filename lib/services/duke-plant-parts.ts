/**
 * Duke Phytochemical Database — plant_part code → readable label.
 *
 * Duke uses 2-letter codes (e.g., "LF" = leaf). Coverage is good for the top
 * codes; uncovered codes fall through to the raw code so the user still sees
 * something meaningful.
 */
const PLANT_PART_LABELS: Record<string, string> = {
  PL: 'Plant (whole)',
  LF: 'Leaf',
  FR: 'Fruit',
  SD: 'Seed',
  SH: 'Shoot',
  RT: 'Root',
  FL: 'Flower',
  EO: 'Essential Oil',
  BK: 'Bark',
  RH: 'Rhizome',
  ST: 'Stem',
  BU: 'Bud',
  EL: 'Essential Oil (Leaf)',
  WD: 'Wood',
  TU: 'Tuber',
  RE: 'Resin',
  TC: 'Tincture',
  SP: 'Sprout',
  OD: 'Oil (Distilled)',
  ER: 'Essential Oil (Rind)',
  PC: 'Pericarp',
  EF: 'Essential Oil (Fruit)',
  RB: 'Root Bark',
  ED: 'Essential Oil (Distilled)',
  FJ: 'Fruit Juice',
  SB: 'Stem Bark',
  EA: 'Essential Oil (Aerial)',
  LX: 'Latex',
  SI: 'Sap',
  PO: 'Pollen',
};

export function plantPartLabel(code: string): string {
  return PLANT_PART_LABELS[code] ?? code;
}
