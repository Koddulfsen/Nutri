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
  'USA_CANADA', 'EU', 'WHO_FAO', 'JAPAN', 'CHINA', 'KOREA', 'NORDIC', 'UK', 'DACH', 'AU_NZ', 'RUSSIA',
  'MALAYSIA', 'PHILIPPINES', 'VIETNAM', 'FRANCE', 'SPAIN', 'ITALY', 'TAIWAN', 'INDONESIA', 'SINGAPORE', 'INDIA',
];
