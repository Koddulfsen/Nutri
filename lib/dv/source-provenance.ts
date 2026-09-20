/**
 * Where each source's values actually come from.
 *
 * A median over our sources is only meaningful if they are independent judgements, and several are not: they adopt
 * EFSA, IOM or WHO/FAO wholesale. This table records, per source and nutrient group, whether the body derived the
 * value itself, re-derived it for its own population, or took it as published — so the aggregator can count one
 * derivation once instead of counting its copies.
 *
 * Every entry carries a quote and a page from the source document. Provenance is never inferred from matching
 * numbers alone; see dv-sources/PROVENANCE.md for the method, the rules and the audit's run state.
 */

/** Primary bodies a value can descend from. `SELF` = derived by the source itself. */
export type Deriver = 'SELF' | 'EFSA' | 'IOM' | 'WHO_FAO' | 'NORDIC' | 'DACH' | 'JAPAN' | 'UK' | 'CHINA' | 'IZINCG';

export type ProvenanceClass =
  /** Derived from evidence by this body. */
  | 'primary'
  /** Another body's value, re-derived for this population (own reference weights, age bands, bioavailability). */
  | 'adapted'
  /** Another body's value, taken as published. Not an independent vote. */
  | 'adopted'
  /** The report does not say. Never collapsed by the aggregator. */
  | 'unknown';

export type NutrientGroup =
  | 'energy' | 'protein' | 'fat' | 'carbohydrate' | 'fibre'
  | 'vitamins' | 'minerals' | 'electrolytes' | 'upper_levels' | 'water';

export interface ProvenanceEntry {
  class: ProvenanceClass;
  /** Whose judgement this descends from. Empty for `primary`. Several means the source mixes them per nutrient. */
  derivedFrom: Deriver[];
  /** Quoted from the source document, with the page. Translated quotes keep the original in the note. */
  evidence: string;
  /** Compounds inside the group that differ from the group's class, with their own class. */
  exceptions?: Array<{ compounds: string[]; class: ProvenanceClass; derivedFrom: Deriver[]; evidence: string }>;
}

export type SourceProvenance = {
  /** Set when a single row in our data carries the origin, so it can be read per value rather than per group. */
  perValueOrigin?: string;
  groups: Partial<Record<NutrientGroup, ProvenanceEntry>>;
};

export const SOURCE_PROVENANCE: Record<string, SourceProvenance> = {
  USA_CANADA: {
    groups: {
      energy: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'Dietary Reference Intakes for Energy (NASEM 2023), Summary (NCBI NBK591034): the committee assembled doubly ' +
          'labeled water data "obtained from the International Atomic Energy Agency (IAEA), the Institute of Medicine (IOM), ' +
          '[SOLNAS], and the Children\'s Nutrition Research Center" and "engaged a consultant group to analyze the DLW data ' +
          'and generate prediction equations for TEE by age/sex and life-stage groups" — new equations from pooled measurement ' +
          'data, not adopted from any other body. It also rejected the 2005 PAL coefficients as not constant across ages.',
      },
      electrolytes: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'Dietary Reference Intakes for Sodium and Potassium (NASEM 2019), potassium chapter (NCBI NBK545428): an AHRQ ' +
          'systematic review "served as a primary source of evidence", supplemented by the committee\'s "own supplemental ' +
          'literature searches"; where evidence was insufficient for an EAR/RDA it set AIs from "median intakes observed in an ' +
          'apparently healthy group of people". This report also introduced the CDRR category we store for sodium.',
      },
      vitamins: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'Dietary Reference Intakes for Calcium and Vitamin D (IOM 2011), Summary (NCBI nap13050/summary): the "U.S. and ' +
          'Canadian governments requested that the IOM conduct a study to assess current data and to update as appropriate the ' +
          'DRIs", a 14-member committee reviewed "systematic evidence-based reviews from the Agency for Healthcare Research and ' +
          'Quality (AHRQ)" and set EAR/RDA/UL itself. SCOPE: this quote covers vitamin D (and calcium); the 1997-2001 reports ' +
          'behind the other vitamins have not been read yet — see dv-sources/PROVENANCE.md.',
      },
      minerals: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'Dietary Reference Intakes for Calcium and Vitamin D (IOM 2011), Summary (NCBI nap13050/summary): committee-set ' +
          'EAR/RDA/UL from AHRQ systematic reviews, commissioned jointly by the U.S. and Canadian governments. SCOPE: quote ' +
          'covers calcium; the 1997-2001 reports behind the other minerals have not been read yet.',
      },
      upper_levels: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'Dietary Reference Intakes for Calcium and Vitamin D (IOM 2011), Summary (NCBI nap13050/summary): the committee ' +
          'specified "Estimated Average Requirement (EAR), Recommended Dietary Allowance (RDA), and Tolerable Upper Intake Levels ' +
          '(UL), based on the strength and quality of available evidence" — ULs are the body\'s own, and are what most other ' +
          'sources in this project copy.',
      },
    },
  },
  EU: {
    groups: {
      vitamins: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'Summary of Dietary Reference Values v4 (Sept 2017), overview p. 1: DRVs are "derived by the EFSA Panel on Dietetic ' +
          'Products, Nutrition and Allergies (NDA)" in 34 nutrient-by-nutrient scientific opinions (2009-2019). The work "was ' +
          'based on a request from the European Commission, which asked EFSA to update previous European advice (SCF, 1993), ' +
          'taking into account new scientific evidence and recent recommendations issued at national and international level" — ' +
          'other bodies\' recommendations are an input to its own deliberation, not the value itself; "the detailed reasoning ' +
          'for establishing individual values can be found in the related opinions of the NDA Panel."',
      },
      minerals: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'Summary of Dietary Reference Values v4 (Sept 2017), overview p. 1: same NDA Panel process, one scientific opinion per ' +
          'nutrient. Where an Average Requirement cannot be determined the Panel sets an AI from "the average observed or ' +
          'experimentally determined approximations or estimates of nutrient intake by a population group ... of apparently ' +
          'healthy people" — EU intake data, its own basis rather than another body\'s number.',
      },
      electrolytes: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'Dietary reference values for sodium (EFSA NDA Panel, EFSA Journal 2019;17(9):5778; snapshot in ' +
          'dv-sources/efsa-drv/source/efsa-2019-sodium.xml): the Panel weighed its own review of balance studies and ' +
          'intake-blood-pressure evidence — "there is strong evidence for a positive relationship between UNa and SBP and DBP" — ' +
          'and concluded "that 2.0 g sodium/day is a safe and adequate intake for the general EU population of adults", with ' +
          "children's values extrapolated from the adult value. Chloride likewise (2019;17(9):5779).",
      },
      energy: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'Summary of Dietary Reference Values v4 (Sept 2017), Table 1: Average Requirements for energy by age and four physical ' +
          'activity levels, derived by the NDA Panel in its own 2013 opinion on energy.',
      },
      carbohydrate: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'Summary of Dietary Reference Values v4 (Sept 2017), overview p. 1 and macronutrient tables: Reference Intake ranges ' +
          '(RI) for macronutrients are EFSA\'s own category, "the intake range for macronutrients, expressed as % of the energy ' +
          'intake ... adequate for maintaining health and associated with a low risk of selected chronic diseases", set in the ' +
          'Panel\'s 2010 macronutrient opinions.',
      },
    },
  },
  WHO_FAO: {
    groups: {
      vitamins: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'Vitamin and mineral requirements in human nutrition, 2nd ed. (FAO/WHO 2004), ch. 1 (fao.org/4/y2809e/y2809e07.htm): ' +
          'a joint FAO/WHO expert consultation set the RNI as "the daily intake, which meets the nutrient requirements of almost ' +
          'all (97.5 percent) apparently healthy individuals in an age and sex-specific population group", computed as ' +
          '"RNI = EAR + 2SD" from biological criteria for adequacy. The chapter notes the RNI concept "is equivalent to that of ' +
          'recommended dietary allowance (RDA) as used by the Food and Nutrition Board of the US National Academy of Sciences" — ' +
          'an equivalence of definition, not of values.',
      },
      minerals: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'Vitamin and mineral requirements in human nutrition, 2nd ed. (FAO/WHO 2004), ch. 1 and Appendix 1 Table 1 (snapshot ' +
          'dv-sources/who-fao/source/y2809e0o.htm): same expert-consultation derivation, and the mineral tables are published by ' +
          'bioavailability level (iron at 5/10/12/15%, zinc at low/moderate/high) — a judgement about diets in developing ' +
          'countries that no other body in this set makes.',
      },
      energy: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'Human energy requirements (FAO/WHO/UNU 2001), ch. 4 (snapshot fao-2001-energy-ch4-children.htm): "The 2001 expert ' +
          'consultation analysed a number of studies on TEE, growth and habitual activity patterns of children and adolescents in ' +
          'different parts of the world", making it possible "to estimate energy requirements from measurements of TEE and energy ' +
          'needs for growth, rather than from food intake data" as the 1985 consultation had done.',
      },
      electrolytes: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'WHO Guideline: Sodium intake for adults and children (2012) and Potassium intake (2012) (snapshots who-2012-sodium.html, ' +
          'who-2012-potassium.html): developed through WHO\'s guideline process with a guideline development group grading the ' +
          'evidence; the sodium guideline defines the scope of its own evidence review ("these subpopulations were not considered ' +
          'in the review of the evidence and generation of the guideline") and issues a strong recommendation.',
      },
      carbohydrate: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'WHO Guideline: Sugars intake for adults and children (2015) (snapshot who-2015-sugars.html): "WHO developed the present ' +
          'evidence-informed guideline using the procedures outlined in the WHO handbook for guideline development", with ' +
          '"Grading of Recommendations Assessment, Development and Evaluation (GRADE) methodology ... to assess the quality of ' +
          'evidence identified through recent systematic reviews", reviewed by the NUGAG Subgroup on Diet and Health.',
      },
      fat: {
        class: 'primary',
        derivedFrom: [],
        evidence:
          'WHO Guideline: Saturated fatty acid and trans-fatty acid intake (2023) (snapshot who-2023-sfa-tfa.html): the limits are ' +
          '"based on evidence from four systematic reviews that assessed the effects of lower compared with higher SFA intake", ' +
          'graded via GRADE by the WHO guideline development group. Also FAO 2010 Fats and fatty acids in human nutrition, report ' +
          'of an expert consultation (snapshot fao-2010-fats-report.txt).',
      },
    },
  },
  INDONESIA: {
    groups: {
      vitamins: {
        class: 'unknown',
        derivedFrom: [],
        evidence:
          'Permenkes 28/2019 states no derivation. Lampiran II (p. 16) records only the institutional history — the AKG was ' +
          'first set in 1968 and is "diperbaharui melalui Widyakarya Nasional Pangan dan Gizi (WNPG)", the national food and ' +
          'nutrition workshop, most recently WNPG XI (2018) — and the only citation anywhere in the regulation is Lampiran I ' +
          'footnote 3 (p. 14), which credits IOM 2001/2006 for the zinc bioavailability assumption. NUMERIC SIGNAL (not a ' +
          'finding): 17 of 31 adult-male values are identical to IOM\'s, including distinctive ones (choline 550 mg, biotin 30 µg, ' +
          'pantothenic acid 5 mg, vitamin C 90 mg, vitamin E 15 mg, vitamin D 15 µg), while only 7 of 19 match WHO/FAO. Potassium ' +
          '4,700 mg matches IOM\'s *2005* adequate intake, superseded by 3,400 mg in 2019 — consistent with values taken from IOM ' +
          'at some earlier point. The WNPG XI proceedings would settle it; the regulation alone cannot.',
      },
      minerals: {
        class: 'unknown',
        derivedFrom: [],
        evidence:
          'Permenkes 28/2019: as for vitamins, no stated derivation beyond the WNPG process (Lampiran II p. 16) and the IOM ' +
          'zinc-bioavailability footnote (Lampiran I p. 14). Numeric signal: calcium, iodine, zinc, copper, phosphorus, manganese ' +
          'and fluoride equal IOM\'s adult values, but selenium (30 vs 55 µg), iron (9 vs 8 mg) and magnesium (360 vs 400 mg) do ' +
          'not — so not a wholesale copy either way.',
      },
    },
  },
  MALAYSIA: {
    groups: {
      vitamins: {
        class: 'adapted',
        derivedFrom: ['WHO_FAO', 'IOM', 'EFSA'],
        evidence:
          'RNI for Malaysia 2017, Summary of Vitamins Recommendations (book p. 122): "for all the 8 vitamins in the RNI (2005), ' +
          'except for vitamin D, the TSC decided to retain the original values, ie ADAPTING the values from WHO/FAO (2004). For ' +
          'vitamin D, the Committee decided to adapt the values from IOM (2011)"; vitamin K, B6 and pantothenic acid "are ' +
          'appropriate to be adapted"; B12 follows "the EFSA (2015) values". The committee\'s word is "adapting", and it means it: ' +
          'in the ascorbic acid chapter (book p. 227) it weighs WHO/FAO 45 mg against EFSA 110/95 mg and D-A-CH 100 mg, judges the ' +
          'chronic-disease evidence "not conclusive and consistent", and then "proposed that 25 mg per day ascorbic acid be added ' +
          'on to the WHO/FAO (2004) recommended intake of 45 mg per day for all groups above 10 years of age" — hence Malaysia\'s ' +
          '70 mg. That is a Malaysian judgement on top of WHO\'s value, not a copy of it.',
      },
      minerals: {
        class: 'adapted',
        derivedFrom: ['WHO_FAO', 'IOM'],
        evidence:
          'RNI for Malaysia 2017, Summary of Minerals and Trace Elements Recommendations (book p. 300): "The TSC agreed to adopt ' +
          'the recommendations of WHO/FAO (2004) as a priority. However, for minerals and trace elements that the WHO/FAO did not ' +
          'have available guidelines, the recommendations of IOM (various years) were used instead." Classed adapted rather than ' +
          'adopted because the published values are re-derived on Malaysian reference body weights — e.g. adult male iodine 121-123 ' +
          'µg against WHO/FAO\'s flat 150 µg (Summary Table 3a, book p. 522) — so they are not the originals\' numbers.',
      },
      upper_levels: {
        class: 'adopted',
        derivedFrom: ['IOM'],
        evidence:
          'RNI for Malaysia 2017, chapter UL tables (e.g. Table 7.2 p. 155 niacin, Table 17.2 p. 311 calcium, Table 30.4 p. 496 ' +
          'fluoride): every one carries "Source: IOM" with a year. No Malaysian upper level is independently derived.',
      },
    },
  },
  PHILIPPINES: {
    groups: {
      upper_levels: {
        class: 'adopted',
        derivedFrom: ['WHO_FAO', 'IOM'],
        evidence:
          'PDRI 2015 Summary Tables p. 6 note: "Adapted from WHO/FAO Guidelines on Food Fortification with Micronutrients ' +
          '(WHO/FAO, 2006); however, WHO/FAO have only recommended ULs for vitamins A, niacin, B6, C, D and E, calcium, selenium ' +
          'and zinc for adults. The remaining values are those recommended by IOM-FNB."',
      },
      electrolytes: {
        class: 'adopted',
        derivedFrom: ['WHO_FAO'],
        evidence:
          'PDRI 2015 Summary Tables p. 7 "Additional Recommendations", sources a-c: the free sugars, sodium and potassium limits ' +
          'are WHO\'s own guidelines (WHO 2015 sugars; WHO 2012 sodium; WHO 2012 potassium), with children extrapolated from the ' +
          'adult value by energy requirement. These duplicate rows we already hold under WHO_FAO.',
      },
      vitamins: {
        class: 'unknown',
        derivedFrom: [],
        evidence:
          'PDRI 2015 Summary Tables (all 7 pages) carry no origin statement for the RNIs themselves — only the UL and page-7 notes ' +
          'cite other bodies. Numeric corroboration argues against adoption: adult male vitamin C is 70 mg against IOM 90 and ' +
          'WHO/FAO 45; calcium 750 mg against 1000 in both. The full PDRI report (not the summary tables we load) would state the ' +
          'derivation. Left unknown rather than guessed — see dv-sources/PROVENANCE.md.',
      },
      minerals: {
        class: 'unknown',
        derivedFrom: [],
        evidence:
          'PDRI 2015 Summary Tables: as for vitamins, no stated origin. Adult male iron 12 mg vs IOM 8 and WHO/FAO 11 (at 15% ' +
          'bioavailability); zinc 6.5 mg vs IOM 11. Values match neither, so adoption cannot be inferred; the matches that do ' +
          'exist are with Malaysia (vitamin C 70, zinc 6.5), which points at the ILSI South-East Asia harmonisation rather than ' +
          'at IOM or WHO. Recorded as a lead, not a finding.',
      },
    },
  },
  VIETNAM: {
    perValueOrigin: 'Most chapter tables carry their own "Nguồn:" (source) line, so provenance is attributable table by table.',
    groups: {
      vitamins: {
        class: 'adopted',
        derivedFrom: ['IOM', 'JAPAN', 'WHO_FAO'],
        evidence:
          'Per-table "Nguồn:" lines: vitamin A (Bảng 27) and vitamins E and K (Bảng 29-30) cite "Dietary Reference Intakes for ' +
          'Japanese 2015"; niacin, pantothenic acid, B6, folate, B12, biotin and choline (Bảng 35-42) cite "IOM, Dietary Reference ' +
          'Intakes: The Essential Guide to Nutrient Requirements. 2006" together with the Japanese DRIs.',
        exceptions: [
          {
            compounds: ['Thiamin (B1)', 'Riboflavin (B2)', 'Vitamin C (Total)', 'Vitamin D (Total)'],
            class: 'unknown',
            derivedFrom: [],
            evidence: 'Bảng 31, 33, 41 and 28 print no "Nguồn:" line, unlike the neighbouring tables. Left unknown rather than assumed to follow them.',
          },
        ],
      },
      minerals: {
        class: 'adopted',
        derivedFrom: ['IOM', 'JAPAN', 'WHO_FAO'],
        evidence:
          'Per-table "Nguồn:" lines: phosphorus and magnesium (Bảng 17-18) cite the Japanese DRIs 2015; iodine (Bảng 21) IOM 2006 ' +
          'plus Japan; selenium (Bảng 22) FAO/WHO 2004 plus IOM; copper, chromium, manganese and fluoride (Bảng 23-26) IOM 2006; ' +
          'iron and zinc (Bảng 19-20) "FAO/WHO ... A report of a joint FAO/WHO expert consultation. Bangkok: FAO/WHO; 2004" with ' +
          'the ILSI South-East Asia harmonisation.',
      },
      protein: {
        class: 'adopted',
        derivedFrom: ['WHO_FAO'],
        evidence:
          'Bảng 8 "Nguồn:": "WHO/FAO/UNU Expert consultation, Protein and Amino acid Requirements in Human Nutrition. WHO ' +
          'technical report series 935. 2007", with the ILSI recommended-intake harmonisation.',
      },
      fibre: {
        class: 'adopted',
        derivedFrom: ['IOM'],
        evidence:
          'Bảng 15 "Nguồn:": "The Food and Nutrition Board, Commission on Life Sciences, National Research Council, 1996" — the US ' +
          'Food and Nutrition Board, the body that became the IOM DRI committees.',
      },
      electrolytes: {
        class: 'adopted',
        derivedFrom: ['WHO_FAO', 'JAPAN', 'IOM'],
        evidence:
          'Bảng 46-48 "Nguồn:": sodium and potassium cite "WHO. Guideline: Sodium intake for adults and children. 2012" and the ' +
          'potassium guideline, plus the Japanese DRIs 2015; chloride cites the WHO sodium guideline with IOM.',
      },
      energy: {
        class: 'unknown',
        derivedFrom: [],
        evidence:
          'Bảng 6 (energy) prints no "Nguồn:" line. The chapter text cites Vietnamese basal-metabolic-rate studies (Nhung et al.), ' +
          'which suggests own derivation, but that is not a statement about the table. Left unknown.',
      },
    },
  },
  NETHERLANDS: {
    perValueOrigin: "Each adult value's note records the report's own \"Herkomst\" column (EFSA / NCM 2014 / GR).",
    groups: {
      vitamins: {
        class: 'adopted',
        derivedFrom: ['EFSA', 'NORDIC'],
        evidence:
          'GR 2018/19 §4.1 (p. 24): "Voor ongeveer de helft van deze stoffen zijn de EFSA-normen overgenomen (Tabel 3). ' +
          'De adequate innames voor de resterende voedingsstoffen hebben een zwakke onderbouwing en zijn alle overgenomen ' +
          'van EFSA (Tabel 4)." — about half the well-founded values and all of the weakly-founded adequate intakes are ' +
          "taken from EFSA. Tabel 3's Herkomst column names EFSA, NCM 2014 (Nordic) or a GR report per value; vitamin C is NCM 2014.",
        exceptions: [
          {
            compounds: ['Vitamin A (RAE)'],
            class: 'adapted',
            derivedFrom: ['EFSA'],
            evidence:
              'GR 2018/19 Tabel 3 footnote b (p. 25): the values are "berekend met EFSA\'s methode, maar voor Nederland is ' +
              'uitgegaan van een hoger lichaamsgewicht" — EFSA\'s method re-run on Dutch body weights. Herkomst: "dit rapport".',
          },
          {
            compounds: ['Vitamin B6', 'Folate (Total)', 'Vitamin B12 (Total)', 'Vitamin D (Total)'],
            class: 'primary',
            derivedFrom: [],
            evidence: 'GR 2018/19 Tabel 3 Herkomst column (p. 25): GR 2003 for B6, folate and B12; GR 2012 for vitamin D — the council\'s own earlier derivations, retained after review.',
          },
        ],
      },
      minerals: {
        class: 'adopted',
        derivedFrom: ['EFSA', 'NORDIC'],
        evidence:
          'GR 2018/19 Tabel 3 and Tabel 4 Herkomst column (pp. 25-26): EFSA for calcium, iron, iodine, potassium, magnesium, ' +
          'phosphorus, selenium, manganese, molybdenum; NCM 2014 for copper and zinc. Tabel 4 header states "De herkomst van al deze waarden is EFSA."',
        exceptions: [
          {
            compounds: ['Copper'],
            class: 'adopted',
            derivedFrom: ['NORDIC', 'IOM'],
            evidence: 'GR 2018/19 Tabel 3 footnote f (p. 25): "De normen voor koper van NCM 2014 komen overeen met de IOM-normen uit 2001." — the Nordic copper values are themselves IOM 2001, so this descends from IOM.',
          },
          {
            compounds: ['Calcium'],
            class: 'primary',
            derivedFrom: [],
            evidence: 'GR 2018/19 Tabel 3 (p. 25): calcium for women 50-69 y and everyone 70+ carries Herkomst "GR 2000"; the 18-49 y values are EFSA.',
          },
        ],
      },
      upper_levels: {
        class: 'adopted',
        derivedFrom: ['EFSA'],
        evidence:
          'GR 2025/06 §1.2 (p. 7): "Sinds 2023 worden deze [aanvaardbare bovengrenzen] in Nederland direct van EFSA overgenomen." ' +
          'Upper levels are taken directly from EFSA since 2023. (We store no Dutch ULs: neither loaded report publishes them.)',
      },
      electrolytes: {
        class: 'unknown',
        derivedFrom: [],
        evidence:
          'GR 2025/06 §1.1 (p. 5): "Natrium en chloride zijn in de vorm van keukenzout (natriumchloride) onderdeel van de ' +
          'Richtlijnen goede voeding en deze stoffen komen daarom niet terug in dit advies." — the Netherlands sets no sodium ' +
          'or chloride reference values, and none are stored. Potassium is in the mineral table with Herkomst EFSA.',
      },
    },
  },
};

/** Sources whose values are loaded but whose provenance has not been audited yet (see dv-sources/PROVENANCE.md). */
export const PROVENANCE_PENDING = [
  'JAPAN', 'CHINA', 'KOREA', 'NORDIC', 'UK', 'DACH', 'AU_NZ', 'RUSSIA',
  'FRANCE', 'SPAIN', 'ITALY', 'TAIWAN', 'SINGAPORE', 'INDIA',
];
