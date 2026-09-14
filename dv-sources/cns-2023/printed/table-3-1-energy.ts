/**
 * CNS 2023 附表 3-1 膳食能量需要量 (EER), kcal/d — transcribed cell by cell from
 * cns-2023.pdf PDF pages 644-645 (printed pp.628-629), 2026-09-14. Rows are YEARLY_ROWS.
 *
 * PAL I / II / III = low / moderate / high physical activity (table footnote a-c).
 * Ages 1-5 publish PAL II only; 65+ publish no PAL III.
 *
 * Infants (0, 0.5 y) are printed PER KG of body weight (90 and 75 kcal/(kg·d)).
 * They are NOT converted to kcal/d here: the table gives no reference weight, so any
 * kcal/d figure would be ours, not CNS's. The former seed stored 540/600 by assuming
 * 6 and 8 kg; those rows are dropped.
 */
const _ = null;

export const INFANT_PER_KG_KCAL = { '0': 90, '0.5': 75 } as const;

export interface EnergyByPal {
  m: (number | null)[];
  f: (number | null)[];
}

export const TABLE_3_1_ENERGY: { I: EnergyByPal; II: EnergyByPal; III: EnergyByPal; preg: [number, number, number, number] } = {
  I: {
    m: [_, _, _, _, _, _, _, 1400, 1500, 1600, 1700, 1800, 1900, 2300, 2600, 2150, 2050, 1950, 1900, 1800],
    f: [_, _, _, _, _, _, _, 1300, 1350, 1450, 1550, 1650, 1750, 1950, 2100, 1700, 1700, 1600, 1550, 1500],
  },
  II: {
    m: [_, _, 900, 1100, 1250, 1300, 1400, 1600, 1700, 1850, 1950, 2050, 2200, 2600, 2950, 2550, 2500, 2400, 2300, 2200],
    f: [_, _, 800, 1000, 1150, 1250, 1300, 1450, 1550, 1700, 1800, 1900, 2000, 2200, 2350, 2100, 2050, 1950, 1850, 1750],
  },
  III: {
    m: [_, _, _, _, _, _, _, 1800, 1900, 2100, 2200, 2300, 2450, 2900, 3300, 3000, 2950, 2800, _, _],
    f: [_, _, _, _, _, _, _, 1650, 1750, 1900, 2000, 2100, 2250, 2450, 2650, 2450, 2400, 2300, _, _],
  },
  // Printed identically under PAL I, II and III.
  preg: [0, 250, 400, 400],
};
