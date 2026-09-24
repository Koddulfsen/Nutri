/**
 * Whether two spellings of a unit are the same quantity, decided per compound, with the source's own words.
 *
 * A qualifier — `µg DFE`, `mg NE`, `mg α-TE`, `µg RAE` — is sometimes only a label on the same number and sometimes
 * a different quantity entirely, and which one it is depends on the nutrient:
 *
 *   - Vitamin E: the USA, EFSA, DGE and CNS all print a bare `mg` that their own text defines as α-tocopherol.
 *     Refusing to compare it with Japan's `mg α-TE` drops half the bodies from the bar for nothing.
 *   - Folate: `µg DFE` counts synthetic folic acid at 1.7× the weight of food folate. A bare `µg` from a book that
 *     predates that convention is a smaller quantity. Equating them inflates the target by up to 70 %.
 *
 * So neither a blanket "qualifiers are cosmetic" nor a blanket "different qualifier, different thing" is correct;
 * each is wrong in one direction, and both fail silently. Hence a ruling per compound, each carrying a quote with a
 * locator, checked by `scripts/dv-verify/check-unit-rulings.ts`.
 *
 * Qualifier tokens are the canonical ones `parseUnit()` returns ('' for a bare unit, 'alpha-te' for every spelling
 * of α-tocopherol equivalents). A pair with no ruling is treated as DIFFERENT — the safe direction, because the
 * value is then excluded and counted in `excluded`, rather than silently averaged into the target.
 */

export interface UnitRuling {
  compound: string;
  /** The two canonical qualifier tokens this ruling is about; '' means the bare unit. */
  qualifiers: [string, string];
  /** True when they are the same quantity under two names, so a value may cross between them. */
  same: boolean;
  /** Why. One quote per region whose rows depend on this ruling. */
  evidence: Array<{ region: string; quote: string }>;
  /** What differs, required when `same` is false. */
  difference?: string;
}

export const UNIT_RULINGS: UnitRuling[] = [
  {
    compound: 'Vitamin E (Total)',
    qualifiers: ['', 'alpha-te'],
    same: true,
    evidence: [
      { region: 'USA_CANADA', quote: 'DRI summary tables print "Vitamin E (mg/d)" with the footnote "As α-tocopherol ... includes RRR-α-tocopherol, the only form of α-tocopherol that occurs naturally in foods, and the 2R-stereoisomeric forms".' },
      { region: 'EU', quote: 'EFSA DRV Tables 9 and 11 name the row "α-Tocopherol" and print it in mg — the AI is for α-tocopherol, not a tocopherol mixture.' },
      { region: 'DACH', quote: 'DGE Referenzwerte-Tool (2025 vitamin E revision), unit note transcribed in dv-sources/dge-dach/extract.ts: "vitamin E mg RRR-α-tocopherol" — RRR-α-tocopherol, printed without the qualifier in the tool\'s unit column.' },
      { region: 'CHINA', quote: 'CNS 2023 prints vitamin E as α-TE (α-生育酚当量) in mg; the transcription records "α-TE." on every row while the unit column reads mg.' },
      { region: 'JAPAN', quote: 'MHLW DRIs 2025 p. 195 prints ビタミンE as mg α-TE, defined as α-トコフェロール — α-tocopherol only, other tocopherols excluded.' },
      { region: 'KOREA', quote: 'KDRI 2020 p. 259 prints vitamin E as mg α-TE.' },
      { region: 'WHO_FAO', quote: 'WHO/FAO Vitamin and Mineral Requirements in Human Nutrition (2nd ed., 2004), vitamin E table: the AI is printed as mg α-TE (α-tocopherol equivalents).' },
      { region: 'RUSSIA', quote: 'MR 2.3.1.0253-21 (2021), vitamin table row "Витамин Е (α-токоферол), мг" — the row names α-tocopherol itself; transcribed as mg α-TE.' },
    ],
  },
  {
    compound: 'Retinol',
    qualifiers: ['', 're'],
    same: true,
    evidence: [
      { region: 'EU', quote: 'EFSA UL summary v11 footnote (e): "ULs apply to preformed vitamin A, i.e. retinol and retinyl esters" — the limit counts retinol, and 1 µg RE is 1 µg retinol by definition; RE and retinol differ only in how carotenoids are counted, and carotenoids are excluded here.' },
      { region: 'USA_CANADA', quote: 'DRI summary tables: the vitamin A UL is "as preformed vitamin A only", printed in µg.' },
      { region: 'CHINA', quote: 'CNS 2023 第十一章第一节 (printed p. 332): "维生素A的UL只针对视黄醇" — the UL applies to retinol only, so the unit is µg/d and not µg RAE.' },
      { region: 'JAPAN', quote: 'MHLW DRIs 2025: the vitamin A UL excludes provitamin A carotenoids and is stored on Retinol in µg.' },
    ],
  },
  {
    compound: 'Folate (Total)',
    qualifiers: ['', 'dfe'],
    same: false,
    difference:
      'A dietary folate equivalent counts synthetic folic acid at 1.7× the weight of naturally occurring food folate ' +
      '(1 µg DFE = 1 µg food folate = 0.6 µg folic acid taken with food). A book that states its values as food ' +
      'folate or as pteroylmonoglutamic acid is measuring a different quantity, so the numbers cannot be pooled.',
    evidence: [
      { region: 'JAPAN', quote: 'MHLW DRIs 2025 p. 251: 葉酸 EAR/RDA are printed in µg and stated as pteroylmonoglutamic acid (プテロイルモノグルタミン酸), not as dietary folate equivalents.' },
      { region: 'UK', quote: 'COMA 1991 RNIs, as reprinted by the BNF 2021 summary (p. 5): the folate column header is "Folate µg/d" with no equivalents basis; the RNI of 200 µg predates the DFE convention.' },
      { region: 'RUSSIA', quote: 'MR 2.3.1.0253-21 (2021), vitamin table row "Фолаты, мкг" — printed in µg with no equivalents basis stated.' },
      { region: 'EU', quote: 'EFSA DRV summary table, folate row: the PRI is given in "µg DFE" (dietary folate equivalents), the convention that weights synthetic folic acid at 1.7.' },
      { region: 'WHO_FAO', quote: 'WHO/FAO Vitamin and Mineral Requirements (2nd ed., 2004), folate table: RNIs are stated as µg DFE.' },
      { region: 'INDIA', quote: 'ICMR-NIN 2020 short tables: folate is printed as µg DFE.' },
      { region: 'DACH', quote: 'DGE Referenzwerte-Tool, snapshot source/dge-referenzwerte-tool-all.html (2025 edition), unit note transcribed in dv-sources/dge-dach/extract.ts: "folate µg folate equivalents (DFE)".' },
      { region: 'KOREA', quote: 'KDRI 2020 p. 260 (water-soluble vitamins): folate is printed in µg DFE, and the UL footnote restricts that limit to folic acid from supplements or fortified foods.' },
      { region: 'CHINA', quote: 'CNS 2023 第十二章第五节 (printed p. 394): folate is given as µg DFE, the UL computed from synthetic folic acid intake in µg/d.' },
      { region: 'USA_CANADA', quote: 'DRI summary tables print "Folate (µg/d)" with the footnote defining dietary folate equivalents: "1 DFE = 1 µg food folate = 0.6 µg of folic acid from fortified food or as a supplement consumed with food".' },
    ],
  },
  {
    compound: 'Niacin (B3)',
    qualifiers: ['', 'ne'],
    same: false,
    difference:
      'A niacin equivalent counts niacin made from dietary tryptophan (60 mg tryptophan = 1 mg NE) as well as ' +
      'preformed niacin. A value in plain mg counts only preformed niacin unless its source says otherwise — and ' +
      'for the three bodies below, the document in hand does not say.',
    evidence: [
      { region: 'UK', quote: 'BNF 2021 reprint of the COMA 1991 RNIs (p. 5): the column is headed "Niacin mg/d" with no equivalents basis stated in the snapshot held. COMA itself defines niacin as nicotinic acid equivalents, but that document is not in hand, so the bare mg is not equated here.' },
      { region: 'CHINA', quote: 'CNS 2023: the niacin row is transcribed in mg with no NE basis recorded; the UL is set on the separate Nicotinic Acid and Nicotinamide compounds.' },
      { region: 'INDIA', quote: 'ICMR-NIN 2020 short tables print niacin in mg; the brief does not state an equivalents basis.' },
      { region: 'USA_CANADA', quote: 'DRI summary tables print "Niacin (mg/d)" footnoted "As niacin equivalents (NE); 1 mg of niacin = 60 mg of tryptophan" — the US rows that carry a bare mg are the UL, which is for synthetic forms, not the RDA.' },
      { region: 'JAPAN', quote: 'MHLW DRIs 2025 p. 248: ナイアシン EAR/RDA/AI are printed in mg NE; only the 0–5 month AI is printed in plain mg niacin (footnote 4).' },
      { region: 'EU', quote: 'EFSA DRV summary table: niacin is expressed per unit of energy as mg NE/MJ, i.e. in niacin equivalents.' },
      { region: 'WHO_FAO', quote: 'WHO/FAO Vitamin and Mineral Requirements (2nd ed., 2004), niacin table: RNIs are stated as mg NE (niacin equivalents).' },
      { region: 'DACH', quote: 'DGE Referenzwerte-Tool, snapshot source/dge-referenzwerte-tool-all.html (2025 edition), unit note transcribed in dv-sources/dge-dach/extract.ts: "niacin mg NE".' },
      { region: 'RUSSIA', quote: 'MR 2.3.1.0253-21 (2021), vitamin table row "Ниацин, мг" — transcribed as mg NE with the note "As niacin equivalents."' },
      { region: 'KOREA', quote: 'KDRI 2020 p. 260 (water-soluble vitamins): niacin EAR/RDA/AI are printed in mg NE; the UL is set separately on nicotinic acid and nicotinamide.' },
    ],
  },
  {
    compound: 'Vitamin A (RAE)',
    qualifiers: ['', 'rae'],
    same: false,
    difference:
      'A retinol activity equivalent counts β-carotene at 1/12 of retinol by weight (the older RE convention used ' +
      '1/6). A value printed as plain µg states neither convention, and the two differ by up to a factor of two on ' +
      'a carotenoid-rich diet.',
    evidence: [
      { region: 'INDIA', quote: 'ICMR-NIN 2020: vitamin A is printed as µg; the transcription records "Printed as µg; the brief note does not state the retinol-equivalent basis." Pooling it with µg RAE would assume a convention the source never states.' },
      { region: 'USA_CANADA', quote: 'DRI summary tables print "Vitamin A (µg/d)" footnoted "As retinol activity equivalents (RAEs). 1 RAE = 1 µg retinol, 12 µg β-carotene".' },
      { region: 'JAPAN', quote: 'MHLW DRIs 2025 p. 193: ビタミンA is printed in µg RAE; the EAR and RDA include provitamin A carotenoids while the UL does not.' },
      { region: 'KOREA', quote: 'KDRI 2020 p. 259 (fat-soluble vitamins): vitamin A EAR/RDA/AI/UL are printed in µg RAE.' },
      { region: 'CHINA', quote: 'CNS 2023 vitamin tables print vitamin A as µg RAE; 第十一章第一节 (printed p. 332) states the UL alone is in µg/d because it covers retinol only.' },
      { region: 'DACH', quote: 'DGE Referenzwerte-Tool, snapshot source/dge-referenzwerte-tool-all.html (2025 edition), unit note transcribed in dv-sources/dge-dach/extract.ts: "Vitamin A µg RAE".' },
    ],
  },
];

/** '' is the bare unit. Returns null when nothing has been ruled — the caller must treat that as "do not pool". */
export function qualifiersInterchangeable(compound: string, a: string, b: string): boolean | null {
  if (a === b) return true;
  const r = UNIT_RULINGS.find(
    (x) => x.compound === compound && ((x.qualifiers[0] === a && x.qualifiers[1] === b) || (x.qualifiers[0] === b && x.qualifiers[1] === a))
  );
  return r ? r.same : null;
}

export const rulingFor = (compound: string, a: string, b: string) =>
  UNIT_RULINGS.find((x) => x.compound === compound && ((x.qualifiers[0] === a && x.qualifiers[1] === b) || (x.qualifiers[0] === b && x.qualifiers[1] === a)));

/** True when this nutrient has a ruling that mentions the qualifier at all; the bare unit always counts as known. */
export const isRuledQualifier = (compound: string, q: string) =>
  q === '' || UNIT_RULINGS.some((r) => r.compound === compound && (r.qualifiers[0] === q || r.qualifiers[1] === q));
