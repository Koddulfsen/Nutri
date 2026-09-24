/**
 * Limits that live on a *form* of a nutrient, and the nutrient whose goal they belong beside.
 *
 * Some upper levels do not limit a nutrient, they limit one chemical form of it: retinol rather than all vitamin A,
 * synthetic folic acid rather than all folate, free nicotinic acid rather than all niacin. Each is stored on its own
 * compound, because that is what the source limits — but a bar for the parent nutrient still has to find it, and must
 * not compare it to the wrong intake.
 *
 * The distinction that matters for the app is `countsParentTotal`:
 *   false — the limit counts only the form. Comparing it to the parent's total intake would flag food the limit does
 *           not cover (carrots against the vitamin A limit, spinach against the folic acid limit). It can only be
 *           shown once intake of that form is known separately.
 *   true  — the limit and the parent goal count the same thing.
 *
 * Every entry quotes the source that says so. See dv-sources/VALUE-TYPES.md for the wider inventory, and
 * scripts/dv-verify/check-compound-links.ts for the checks.
 */

export interface FormLink {
  /** Compound the limit is stored on. */
  form: string;
  /** Compound the goal is stored on — the bar this limit belongs beside. */
  parent: string;
  /** False when the limit counts only the form, so it cannot be read against the parent's total intake. */
  countsParentTotal: boolean;
  /** How the form's unit relates to the parent's, where they differ. */
  unitNote?: string;
  /** What each source says the limit covers. One quote per region that publishes it. */
  evidence: Array<{ region: string; quote: string }>;
}

export const FORM_LINKS: FormLink[] = [
  {
    form: 'Retinol',
    parent: 'Vitamin A (RAE)',
    countsParentTotal: false,
    unitNote:
      'Stored in µg retinol (EFSA labels it µg RE). 1 µg retinol = 1 µg RAE = 1 µg RE, so the numbers are directly ' +
      'comparable once intake is restricted to preformed vitamin A. The parent goal is in µg RAE and includes ' +
      'carotenoids, which the limit excludes.',
    evidence: [
      { region: 'USA_CANADA', quote: 'DRI summary tables: the vitamin A UL is "as preformed vitamin A only".' },
      { region: 'EU', quote: 'EFSA UL summary v11, footnote (e): "ULs apply to preformed vitamin A, i.e. retinol and retinyl esters."' },
      { region: 'JAPAN', quote: 'DRIs 2025: printed as vitamin A (µg RAE) but excludes provitamin A carotenoids (footnote).' },
      { region: 'CHINA', quote: 'CNS 2023, 第十一章第一节 (printed p. 332): "维生素A的UL只针对视黄醇" — the UL applies to retinol only, because carotenoid toxicity is very low; the unit is therefore µg/d, not µg RAE.' },
    ],
  },
  {
    form: 'Folic Acid (Synthetic)',
    parent: 'Folate (Total)',
    countsParentTotal: false,
    unitNote:
      'Stored in µg folic acid; the parent goal is in µg DFE. These are NOT the same scale — 1 µg folic acid taken ' +
      'with food counts as 1.7 µg DFE — so the limit must be compared with folic acid intake in µg, never with a DFE ' +
      'total. (Korea prints its folate UL in µg DFE while restricting it to folic acid; it is stored in µg.)',
    evidence: [
      { region: 'USA_CANADA', quote: 'DRI summary tables: applies to "synthetic forms from supplements and/or fortified foods".' },
      { region: 'EU', quote: 'EFSA UL summary v11, footnote (d): ULs apply to folic acid and authorised MTHF salts "added to foods or used in food supplements ... do not include folate naturally present in foods and beverages".' },
      { region: 'JAPAN', quote: 'DRIs 2025: applies to folic acid in foods other than ordinary foods (footnote 2).' },
      { region: 'KOREA', quote: 'KDRI 2020 summary footnote: "엽산의 상한섭취량은 보충제 또는 강화식품의 형태로 섭취한 μg/일에 해당됨" — the folate UL corresponds to µg/day taken as supplements or fortified foods.' },
      { region: 'CHINA', quote: 'CNS 2023, 第十二章第五节 (printed p. 394): "过量摄入天然食物叶酸未发现不良反应，叶酸的 UL 根据食物强化和补充剂的合成叶酸摄入量（µg/d）计算" — computed from synthetic folic acid in fortified foods and supplements.' },
    ],
  },
  {
    form: 'Nicotinic Acid',
    parent: 'Niacin (B3)',
    countsParentTotal: false,
    unitNote: 'Stored in mg nicotinic acid; the parent goal is in mg niacin equivalents (NE), which also counts nicotinamide and niacin made from tryptophan.',
    evidence: [
      { region: 'EU', quote: 'SCF 2002 (behind EFSA UL Table 3): "The upper level for free nicotinic acid has been derived from data on flushing ... Flushing has not been reported for the bound forms of nicotinic acid that are present in foods."' },
      { region: 'JAPAN', quote: 'DRIs 2025: printed in parentheses as the nicotinic acid weight (footnote 3).' },
      { region: 'KOREA', quote: 'KDRI 2020: printed as the niacin UL "nicotinic acid/nicotinamide", set for supplements and fortified foods.' },
      { region: 'CHINA', quote: 'CNS 2023, 第十二章第三节 (printed p. 379): "食物中的烟酸不会引起摄入过量的不良反应。烟酸的不良反应多由于服用烟酸补充剂、强化食品所致" — the 35 mg NE UL comes from the flushing LOAEL of nicotinic acid.' },
    ],
  },
  {
    form: 'Nicotinamide',
    parent: 'Niacin (B3)',
    countsParentTotal: false,
    unitNote: 'Stored in mg nicotinamide; the parent goal is in mg NE.',
    evidence: [
      { region: 'EU', quote: 'EFSA UL Table 3 lists nicotinamide separately from nicotinic acid (SCF 2002a); SCF states no restriction to supplemental forms for nicotinamide, unlike free nicotinic acid.' },
      { region: 'JAPAN', quote: 'DRIs 2025: the niacin UL is printed as the nicotinamide weight (footnote 3).' },
      { region: 'KOREA', quote: 'KDRI 2020: printed as the niacin UL "nicotinic acid/nicotinamide", set for supplements and fortified foods.' },
      { region: 'CHINA', quote: 'CNS 2023, 第十二章第三节 (printed p. 379): nicotinamide does not cause flushing; NOAEL 25 mg/kg bw/d with UF 5 gives the adult UL of 310 mg/d.' },
    ],
  },
];

/** Compounds whose only DV is a limit and that legitimately have no parent goal — they are not nutrients with targets. */
export const LIMIT_ONLY_COMPOUNDS: Array<{ compound: string; reason: string }> = [
  { compound: 'Boron', reason: 'No body in the alpha set sets a boron requirement; IOM and EFSA publish a UL only.' },
  { compound: 'Nickel', reason: 'IOM publishes a UL only; nickel has no established requirement.' },
];

export const formLinkFor = (compound: string) => FORM_LINKS.find((l) => l.form === compound);
export const formLinksOf = (parent: string) => FORM_LINKS.filter((l) => l.parent === parent);
