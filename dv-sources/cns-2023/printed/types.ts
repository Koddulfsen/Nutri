/**
 * Shape of a CNS 2023 printed appendix table, transcribed cell by cell.
 *
 * Rows follow the printed order (ROWS). `m`/`f` hold the 男/女 columns; a value
 * printed once for both sexes appears in both. `preg` holds the printed "+x"
 * increments for 孕早期 / 孕中期 / 孕晚期 / 乳母. null = printed "—".
 */
export const ROWS = ['0', '0.5', '1', '4', '7', '9', '12', '15', '18', '30', '50', '65', '75'] as const;

/** Age bands (months, inclusive) of the 13-row micronutrient tables (附表 3-6/3-7/3-8/3-10). */
export const BAND_ROWS: Array<[number, number | null]> = [
  [0, 5], [6, 11], [12, 47], [48, 83], [84, 107], [108, 143],
  [144, 179], [180, 215], [216, 359], [360, 599], [600, 779], [780, 899], [900, null],
];

/** Age rows of the per-year tables (附表 3-1 energy, 3-2 protein): 0, 0.5, 1..11, 12, 15, 18, 30, 50, 65, 75. */
export const YEARLY_ROWS: Array<[number, number | null]> = [
  [0, 5], [6, 11],
  [12, 23], [24, 35], [36, 47], [48, 59], [60, 71], [72, 83], [84, 95], [96, 107], [108, 119], [120, 131], [132, 143],
  [144, 179], [180, 215], [216, 359], [360, 599], [600, 779], [780, 899], [900, null],
];

export interface PrintedNutrient {
  unit: string;
  m: (number | null)[];
  f: (number | null)[];
  preg: [number, number, number, number];
  /** Row indices printed with "(AI)" inside a column whose header type is RNI/EAR. */
  aiRows?: number[];
  /** Row index -> printed range, e.g. sodium 1 y "500~700". `m`/`f` hold the midpoint. */
  ranges?: Record<number, [number, number]>;
  note?: string;
}

export interface PrintedTable {
  /** e.g. '附表 3-7' */
  id: string;
  /** PDF page (not the printed page number). */
  pdfPage: number;
  /** Stored dv_type_enum for cells without an (AI) marker. */
  valueType: 'EAR' | 'RDA' | 'AI' | 'UL' | 'CDRR';
  nutrients: Record<string, PrintedNutrient & { valueType?: 'EAR' | 'RDA' | 'AI' | 'UL' | 'CDRR' }>;
}

export const same = (v: (number | null)[]) => ({ m: v, f: v });
