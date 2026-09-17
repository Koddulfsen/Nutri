/**
 * France — ANSES "Actualisation des références nutritionnelles françaises en vitamines et minéraux"
 * (Avis et rapport, saisine 2018-SA-0238, March 2021) -> values.json.
 *
 * Transcribed cell by cell, 2026-09-17, from the avis's summary tables — Tableau 2 (vitamines) and Tableau 3
 * (minéraux), avis pages 12-19 (PDF pages 14-21) of anses-2021-vitamines-mineraux.pdf. Cells were read from the text
 * layer and every table checked against page renders (source/anses-avis-014.png ... 021.png).
 *
 * Mapping decisions:
 *   - BNM (besoin nutritionnel moyen) -> EAR; RNP (référence nutritionnelle pour la population) -> RDA;
 *     AS (apport satisfaisant, also cells marked "*") -> AI; LSS (limite supérieure de sécurité, EFSA's ULs "à titre
 *     indicatif") -> UL.
 *   - "Adolescents de 11 à 14 ans" is one row for both sexes except where the table prints separate girls' rows
 *     (fluoride). 15-17 y is split into adolescents (boys) and adolescentes (girls). Adults are 18 y and older; pregnant
 *     and lactating women carry no age and are stored from 18 y.
 *   - Vitamin B1 and B3 are printed per MJ of energy consumed (mg/MJ, mg NE/MJ) and stored per MJ, as for EFSA; the
 *     mg/day annexes are not stored. Infants under 6 months are printed per day (0.2 mg B1, 2 mg NE B3, per the report).
 *   - Vitamin A µg ER (retinol equivalents) -> Vitamin A (RE). Its LSS is EFSA's UL for preformed vitamin A (report:
 *     "LSS pour le rétinol") -> Retinol. Vitamin B9 µg EFA (dietary folate equivalents); the folic acid LSS -> Folic Acid
 *     (Synthetic), supplementalOnly as for EFSA. Magnesium LSS (EFSA's UL for readily dissociable salts) ->
 *     supplementalOnly. Vitamin K1 -> Vitamin K1 (Phylloquinone).
 *   - Iron: girls 12-17 y and women print two RNPs by menstrual losses (low to moderate / high); the low-to-moderate
 *     value is stored with the high-loss value in the note. Postmenopausal women (6 / 11 mg) are noted on the women's
 *     rows (the model has no menopause dimension).
 *   - Zinc for adults, pregnancy and lactation by phytate intake 300 / 600 / 900 mg/d -> PHYTATE_LOW / PHYTATE_MED_LOW /
 *     PHYTATE_MED_HIGH (EFSA's levels).
 *   - Folate for pregnancy "600*a": an AS that applies to women who may become pregnant and pregnant women, possibly
 *     overestimated for the 2nd and 3rd trimesters (footnote a).
 *
 * Not in the source: manganese (deferred by ANSES), energy and macronutrients (separate ANSES opinions).
 *
 * Run: npx tsx dv-sources/anses-2021/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage, DietaryContext } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const out: SourceValue[] = [];
const BOTH: Sex[] = ['MALE', 'FEMALE'];

// Standard 12 rows of Tableau 2 and most of Tableau 3.
const ROWS: Array<{ label: string; sexes: Sex[]; stage: LifeStage; age: Age }> = [
  { label: 'Nourrissons de moins de 6 mois', sexes: BOTH, stage: 'NONE', age: [0, 5] },
  { label: 'Nourrissons de 6 mois et plus', sexes: BOTH, stage: 'NONE', age: [6, 11] },
  { label: 'Enfants de 1 à 3 ans', sexes: BOTH, stage: 'NONE', age: [12, 47] },
  { label: 'Enfants de 4 à 6 ans', sexes: BOTH, stage: 'NONE', age: [48, 83] },
  { label: 'Enfants de 7 à 10 ans', sexes: BOTH, stage: 'NONE', age: [84, 131] },
  { label: 'Adolescents de 11 à 14 ans', sexes: BOTH, stage: 'NONE', age: [132, 179] },
  { label: 'Adolescents de 15 à 17 ans', sexes: ['MALE'], stage: 'NONE', age: [180, 215] },
  { label: 'Adolescentes de 15 à 17 ans', sexes: ['FEMALE'], stage: 'NONE', age: [180, 215] },
  { label: 'Hommes de 18 ans et plus', sexes: ['MALE'], stage: 'NONE', age: [216, null] },
  { label: 'Femmes de 18 ans et plus', sexes: ['FEMALE'], stage: 'NONE', age: [216, null] },
  { label: 'Femmes enceintes', sexes: ['FEMALE'], stage: 'PREGNANT', age: [216, null] },
  { label: 'Femmes allaitantes', sexes: ['FEMALE'], stage: 'LACTATING', age: [216, null] },
];

interface Col { table: string; label: string; compound: string; type: DvValueType; unit: string; cells: string; note?: string; supp?: boolean; rows?: typeof ROWS }
function push(p: { compound: string; type: DvValueType; sexes: Sex[]; stage: LifeStage; age: Age; value: number; unit: string; supp?: boolean; diet?: DietaryContext | null; note?: string | null; from: string }) {
  for (const sex of p.sexes) out.push({
    compound: p.compound, valueType: p.type, sex, lifeStage: p.stage, ageMinMonths: p.age[0], ageMaxMonths: p.age[1], activityLevel: null,
    dietaryContext: p.diet ?? null, value: p.value, valueMin: null, valueMax: null, unit: p.unit, isPercentOfEnergy: false, isProvisional: false,
    supplementalOnly: p.supp ?? false, note: p.note ?? null, from: p.from,
  });
}
const num = (s: string) => { const v = Number(s.replace(',', '.')); if (Number.isNaN(v)) throw new Error(`number "${s}"`); return v; };

/** cells: one token per row; "-" blank; "x*" apport satisfaisant (AI); "x/unit" a cell printed in another unit. */
function column(c: Col) {
  const rows = c.rows ?? ROWS;
  const t = c.cells.trim().split(/\s+/);
  if (t.length !== rows.length) throw new Error(`${c.label}: ${t.length} cells for ${rows.length} rows`);
  t.forEach((tok, i) => {
    if (tok === '-') return;
    const r = rows[i];
    let type = c.type; let unit = c.unit; let s = tok; const notes: string[] = [];
    if (s.endsWith('*')) { type = 'AI'; s = s.slice(0, -1); notes.push('Apport satisfaisant.'); }
    const perDay = /^(.+)\/j$/.exec(s);
    if (perDay) { s = perDay[1]; unit = c.compound === 'Thiamin (B1)' ? 'mg' : 'mg NE'; notes.push('Printed per day for this age group.'); }
    push({ compound: c.compound, type, sexes: r.sexes, stage: r.stage, age: r.age, value: num(s), unit, supp: c.supp,
      note: [c.note, ...notes].filter(Boolean).join(' ') || null, from: `${c.table}, ${c.label}, ${r.label}` });
  });
}

const T2 = 'Avis Tableau 2 (vitamines)'; const T3 = 'Avis Tableau 3 (minéraux)';
//                                                              <6m  ≥6m  1-3  4-6  7-10  11-14  M15-17 F15-17  M18+  F18+  preg  lact
const COLS: Col[] = [
  { table: T2, label: 'Vitamine A BNM', compound: 'Vitamin A (RE)', type: 'EAR', unit: 'µg RE', cells: '- 190 205 245 320 480 580 490 580 490 540 1020' },
  { table: T2, label: 'Vitamine A RNP', compound: 'Vitamin A (RE)', type: 'RDA', unit: 'µg RE', cells: '350* 250 250 300 400 600 750 650 750 650 700 1300' },
  { table: T2, label: 'Vitamine A LSS', compound: 'Retinol', type: 'UL', unit: 'µg RE', cells: '- - 800 1100 1500 2000 2600 2600 3000 3000 3000 3000', note: "EFSA's upper level for preformed vitamin A (retinol)." },
  { table: T2, label: 'Vitamine B1 BNM (mg/MJ)', compound: 'Thiamin (B1)', type: 'EAR', unit: 'mg/MJ', cells: '- 0,072 0,072 0,072 0,072 0,072 0,072 0,072 0,072 0,072 0,072 0,072', note: 'Per MJ of energy consumed.' },
  { table: T2, label: 'Vitamine B1 RNP (mg/MJ)', compound: 'Thiamin (B1)', type: 'RDA', unit: 'mg/MJ', cells: '0,2/j* 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1', note: 'Per MJ of energy consumed.' },
  { table: T2, label: 'Vitamine B2 BNM', compound: 'Riboflavin (B2)', type: 'EAR', unit: 'mg', cells: '- - 0,5 0,6 0,8 1,1 1,4 1,4 1,3 1,3 1,5 1,7' },
  { table: T2, label: 'Vitamine B2 RNP', compound: 'Riboflavin (B2)', type: 'RDA', unit: 'mg', cells: '0,3* 0,4* 0,6 0,7 1,0 1,4 1,6 1,6 1,6 1,6 1,9 2,0' },
  { table: T2, label: 'Vitamine B3 BNM (mg EN/MJ)', compound: 'Niacin (B3)', type: 'EAR', unit: 'mg NE/MJ', cells: '- 1,3 1,3 1,3 1,3 1,3 1,3 1,3 1,3 1,3 1,3 1,3', note: 'Per MJ of energy consumed.' },
  { table: T2, label: 'Vitamine B3 RNP (mg EN/MJ)', compound: 'Niacin (B3)', type: 'RDA', unit: 'mg NE/MJ', cells: '2/j* 1,6 1,6 1,6 1,6 1,6 1,6 1,6 1,6 1,6 1,6 1,6', note: 'Per MJ of energy consumed.' },
  { table: T2, label: 'Vitamine B3 LSS acide nicotinique', compound: 'Nicotinic Acid', type: 'UL', unit: 'mg', cells: '- - 2 3 4 6 8 8 10 10 - -' },
  { table: T2, label: 'Vitamine B3 LSS nicotinamide', compound: 'Nicotinamide', type: 'UL', unit: 'mg', cells: '- - 150 220 350 500 700 700 900 900 - -' },
  { table: T2, label: 'Vitamine B5 AS', compound: 'Pantothenic Acid (B5)', type: 'AI', unit: 'mg', cells: '2 3 4 4,5 5 6 6 5 6 5 5 7' },
  { table: T2, label: 'Vitamine B6 BNM', compound: 'Vitamin B6', type: 'EAR', unit: 'mg', cells: '- - 0,5 0,6 0,9 1,2 1,5 1,3 1,5 1,3 1,5 1,4' },
  { table: T2, label: 'Vitamine B6 RNP', compound: 'Vitamin B6', type: 'RDA', unit: 'mg', cells: '0,1* 0,3* 0,6 0,7 1,0 1,4 1,7 1,6 1,7 1,6 1,8 1,7' },
  { table: T2, label: 'Vitamine B6 LSS', compound: 'Vitamin B6', type: 'UL', unit: 'mg', cells: '- - 5 7 10 15 20 20 25 25 25 25' },
  { table: T2, label: 'Vitamine B8 AS', compound: 'Biotin (B7)', type: 'AI', unit: 'µg', cells: '4 6 20 25 25 35 35 35 40 40 40 45', note: 'Printed as vitamine B8 (biotin).' },
  { table: T2, label: 'Vitamine B9 BNM', compound: 'Folate (Total)', type: 'EAR', unit: 'µg DFE', cells: '- - 90 110 160 210 250 250 250 250 - 380' },
  { table: T2, label: 'Vitamine B9 RNP', compound: 'Folate (Total)', type: 'RDA', unit: 'µg DFE', cells: '65* 80* 120 140 200 270 330 330 330 330 600* 500' },
  { table: T2, label: 'Acide folique LSS', compound: 'Folic Acid (Synthetic)', type: 'UL', unit: 'µg', cells: '- - 200 300 400 600 800 800 1000 1000 1000 1000', supp: true },
  { table: T2, label: 'Vitamine B12 AS', compound: 'Vitamin B12 (Total)', type: 'AI', unit: 'µg', cells: '0,4 1,5 1,5 1,5 1,5 2,5 2,5 2,5 4 4 4,5 5' },
  { table: T2, label: 'Vitamine C BNM', compound: 'Vitamin C (Total)', type: 'EAR', unit: 'mg', cells: '- - 15 25 40 60 85 85 90 90 100 140' },
  { table: T2, label: 'Vitamine C RNP', compound: 'Vitamin C (Total)', type: 'RDA', unit: 'mg', cells: '20* 20* 20 30 45 70 100 100 110 110 120 170' },
  { table: T2, label: 'Vitamine D AS', compound: 'Vitamin D (Total)', type: 'AI', unit: 'µg', cells: '10 10 15 15 15 15 15 15 15 15 15 15' },
  { table: T2, label: 'Vitamine D LSS', compound: 'Vitamin D (Total)', type: 'UL', unit: 'µg', cells: '25 25 50 50 50 100 100 100 100 100 100 100' },
  { table: T2, label: 'Vitamine E AS', compound: 'Vitamin E (Total)', type: 'AI', unit: 'mg', cells: '4 5 7 7 9 10 10 8 10 9 9 9' },
  { table: T2, label: 'Vitamine K1 AS', compound: 'Vitamin K1 (Phylloquinone)', type: 'AI', unit: 'µg', cells: '5 10 29 42 45 45 45 45 79 79 79 79' },
  { table: T2, label: 'Choline AS', compound: 'Choline (Total)', type: 'AI', unit: 'mg', cells: '120 160 140 170 250 340 400 400 400 400 480 520' },
  // Tableau 3
  { table: T3, label: 'Cuivre AS', compound: 'Copper', type: 'AI', unit: 'mg', cells: '0,3 0,5 0,8 1,0 1,2 1,3 1,5 1,1 1,9 1,5 1,7 1,7' },
  { table: T3, label: 'Cuivre LSS', compound: 'Copper', type: 'UL', unit: 'mg', cells: '- - 1 2 3 4 4 4 5 5 - -' },
  { table: T3, label: 'Iode AS', compound: 'Iodine', type: 'AI', unit: 'µg', cells: '90 70 90 90 90 120 130 130 150 150 200 200' },
  { table: T3, label: 'Iode LSS', compound: 'Iodine', type: 'UL', unit: 'µg', cells: '- - 200 250 300 450 500 500 600 600 600 600' },
  { table: T3, label: 'Magnésium AS', compound: 'Magnesium', type: 'AI', unit: 'mg', cells: '25 80 180 210 240 265 295 225 380 300 300 300' },
  { table: T3, label: 'Magnésium LSS', compound: 'Magnesium', type: 'UL', unit: 'mg', cells: '- - - 250 250 250 250 250 250 250 250 250', supp: true, note: "EFSA's upper level for readily dissociable magnesium salts and compounds (supplements, fortified foods)." },
  { table: T3, label: 'Molybdène AS', compound: 'Molybdenum', type: 'AI', unit: 'µg', cells: '2 30 35 65 75 80 80 80 95 95 95 95' },
  { table: T3, label: 'Molybdène LSS', compound: 'Molybdenum', type: 'UL', unit: 'µg', cells: '- - 100 200 250 400 500 500 600 600 600 600' },
  { table: T3, label: 'Phosphore AS', compound: 'Phosphorus', type: 'AI', unit: 'mg', cells: '100 160 250 440 440 640 640 640 550 550 550 550' },
  { table: T3, label: 'Potassium AS', compound: 'Potassium', type: 'AI', unit: 'mg', cells: '400 750 800 1100 1800 2700 3500 3500 3500 3500 3500 4000' },
  { table: T3, label: 'Sélénium AS', compound: 'Selenium', type: 'AI', unit: 'µg', cells: '12,5 15 15 20 35 55 70 70 70 70 70 85' },
  { table: T3, label: 'Sélénium LSS', compound: 'Selenium', type: 'UL', unit: 'µg', cells: '- - 60 90 130 200 250 250 300 300 300 300' },
];
for (const c of COLS) column(c);

// ── Calcium (own rows: adults 18-24 and 25+) ──
{
  const t = `${T3}, Calcium`;
  const rows: Array<[string, Sex[], LifeStage, Age, string, string, string]> = [
    ['Nourrissons de moins de 6 mois', BOTH, 'NONE', [0, 5], '-', '200*', '-'], ['Nourrissons de 6 mois et plus', BOTH, 'NONE', [6, 11], '-', '280*', '-'],
    ['Enfants de 1 à 3 ans', BOTH, 'NONE', [12, 47], '390', '450', '-'], ['Enfants de 4 à 6 ans', BOTH, 'NONE', [48, 83], '680', '800', '-'],
    ['Enfants de 7 à 10 ans', BOTH, 'NONE', [84, 131], '680', '800', '-'], ['Adolescents de 11 à 14 ans', BOTH, 'NONE', [132, 179], '960', '1150', '-'],
    ['Adolescents de 15 à 17 ans', ['MALE'], 'NONE', [180, 215], '960', '1150', '-'], ['Adolescentes de 15 à 17 ans', ['FEMALE'], 'NONE', [180, 215], '960', '1150', '-'],
    ['Hommes de 18 à 24 ans', ['MALE'], 'NONE', [216, 299], '860', '1000', '2500'], ['Femmes de 18 à 24 ans', ['FEMALE'], 'NONE', [216, 299], '860', '1000', '2500'],
    ['Hommes de 25 ans et plus', ['MALE'], 'NONE', [300, null], '750', '950', '2500'], ['Femmes de 25 ans et plus', ['FEMALE'], 'NONE', [300, null], '750', '950', '2500'],
    ['Femmes enceintes', ['FEMALE'], 'PREGNANT', [216, null], '750', '950', '2500'], ['Femmes allaitantes', ['FEMALE'], 'LACTATING', [216, null], '750', '950', '2500'],
  ];
  for (const [label, sexes, stage, age, bnm, rnp, lss] of rows) {
    if (bnm !== '-') push({ compound: 'Calcium', type: 'EAR', sexes, stage, age, value: num(bnm), unit: 'mg', from: `${t} BNM, ${label}` });
    const ai = rnp.endsWith('*');
    push({ compound: 'Calcium', type: ai ? 'AI' : 'RDA', sexes, stage, age, value: num(rnp.replace('*', '')), unit: 'mg', note: ai ? 'Apport satisfaisant.' : null, from: `${t} RNP, ${label}` });
    if (lss !== '-') push({ compound: 'Calcium', type: 'UL', sexes, stage, age, value: num(lss), unit: 'mg', from: `${t} LSS, ${label}` });
  }
}
// ── Iron ──
{
  const t = `${T3}, Fer`;
  const post = 'Postmenopausal women: BNM 6, RNP 11 mg/d (Femmes ménopausées).';
  const rows: Array<[string, Sex[], LifeStage, Age, string | null, string, string | null]> = [
    ['Nourrissons de moins de 6 mois', BOTH, 'NONE', [0, 5], null, '0,3*', null],
    ['Nourrissons de 6 mois et plus', BOTH, 'NONE', [6, 11], '8', '11', null],
    ['Enfants de 1 à 2 ans', BOTH, 'NONE', [12, 35], '4', '5', null],
    ['Enfants de 3 à 6 ans', BOTH, 'NONE', [36, 83], '3', '4', null],
    ['Enfants de 7 à 11 ans', BOTH, 'NONE', [84, 143], '5', '6', null],
    ['Adolescents de 12 à 17 ans', ['MALE'], 'NONE', [144, 215], '8', '11', null],
    ['Adolescentes de 12 à 17 ans non menstruées ou dont les pertes menstruelles sont faibles à modérées', ['FEMALE'], 'NONE', [144, 215], '7', '11',
      'Not menstruating or low to moderate menstrual losses (stored). High menstrual losses: BNM 7, RNP 13 mg/d.'],
    ['Hommes de plus de 18 ans', ['MALE'], 'NONE', [216, null], '6', '11', null],
    ['Femmes de plus de 18 ans dont les pertes menstruelles sont faibles à modérées', ['FEMALE'], 'NONE', [216, null], '7', '11',
      `Low to moderate menstrual losses (stored). High menstrual losses: BNM 7, RNP 16 mg/d. ${post}`],
    ['Femmes enceintes', ['FEMALE'], 'PREGNANT', [216, null], '7', '16', null],
    ['Femmes allaitantes', ['FEMALE'], 'LACTATING', [216, null], '7', '16', null],
  ];
  for (const [label, sexes, stage, age, bnm, rnp, note] of rows) {
    if (bnm) push({ compound: 'Iron (Total)', type: 'EAR', sexes, stage, age, value: num(bnm), unit: 'mg', note, from: `${t} BNM, ${label}` });
    const ai = rnp.endsWith('*');
    push({ compound: 'Iron (Total)', type: ai ? 'AI' : 'RDA', sexes, stage, age, value: num(rnp.replace('*', '')), unit: 'mg',
      note: [ai ? 'Apport satisfaisant.' : null, note].filter(Boolean).join(' ') || null, from: `${t} RNP, ${label}` });
  }
}
// ── Fluoride (sex-split rows) ──
{
  const t = `${T3}, Fluor`;
  const ai: Array<[string, Sex[], LifeStage, Age, number]> = [
    ['Nourrissons de moins de 6 mois', BOTH, 'NONE', [0, 5], 0.08], ['Nourrissons de 6 mois et plus', BOTH, 'NONE', [6, 11], 0.4],
    ['Enfants de 1 à 3 ans', BOTH, 'NONE', [12, 47], 0.6], ['Garçons de 4 à 6 ans', ['MALE'], 'NONE', [48, 83], 1.0], ['Filles de 4 à 6 ans', ['FEMALE'], 'NONE', [48, 83], 0.9],
    ['Garçons de 7 à 10 ans', ['MALE'], 'NONE', [84, 131], 1.5], ['Filles de 7 à 10 ans', ['FEMALE'], 'NONE', [84, 131], 1.4],
    ['Adolescents de 11 à 14 ans', ['MALE'], 'NONE', [132, 179], 2.2], ['Adolescentes de 11 à 14 ans', ['FEMALE'], 'NONE', [132, 179], 2.3],
    ['Adolescents de 15 à 17 ans', ['MALE'], 'NONE', [180, 215], 3.2], ['Adolescentes de 15 à 17 ans', ['FEMALE'], 'NONE', [180, 215], 2.8],
    ['Hommes de 18 ans et plus', ['MALE'], 'NONE', [216, null], 3.4], ['Femmes de 18 ans et plus', ['FEMALE'], 'NONE', [216, null], 2.9],
    ['Femmes enceintes ou allaitantes', ['FEMALE'], 'PREGNANT', [216, null], 2.9], ['Femmes enceintes ou allaitantes', ['FEMALE'], 'LACTATING', [216, null], 2.9],
  ];
  for (const [label, sexes, stage, age, v] of ai) push({ compound: 'Fluoride', type: 'AI', sexes, stage, age, value: v, unit: 'mg', from: `${t} AS, ${label}` });
  const ul: Array<[string, Sex[], LifeStage, Age, number]> = [
    ['Enfants de 1 à 3 ans', BOTH, 'NONE', [12, 47], 1.5], ['Garçons et filles de 4 à 8 ans', BOTH, 'NONE', [48, 107], 2.5],
    ['Garçons et filles de 9 à 14 ans', BOTH, 'NONE', [108, 179], 5], ['Adolescents et adolescentes de 15 à 17 ans', BOTH, 'NONE', [180, 215], 7],
    ['Hommes et femmes de 18 ans et plus', BOTH, 'NONE', [216, null], 7],
    ['Femmes enceintes ou allaitantes', ['FEMALE'], 'PREGNANT', [216, null], 7], ['Femmes enceintes ou allaitantes', ['FEMALE'], 'LACTATING', [216, null], 7],
  ];
  for (const [label, sexes, stage, age, v] of ul) push({ compound: 'Fluoride', type: 'UL', sexes, stage, age, value: v, unit: 'mg', from: `${t} LSS, ${label}` });
}
// ── Chloride and sodium (own age rows) ──
{
  const t = `${T3}, Chlore / Sodium`;
  const rows: Array<[string, Sex[], LifeStage, Age, number, number, number | null]> = [
    ['Nourrissons de moins de 6 mois', BOTH, 'NONE', [0, 5], 170, 110, null], ['Nourrissons de 6 mois et plus', BOTH, 'NONE', [6, 11], 570, 370, null],
    ['Enfants de 1 à 3 ans', BOTH, 'NONE', [12, 47], 1200, 800, 1200], ['Enfants de 4 à 8 ans', BOTH, 'NONE', [48, 107], 1500, 1000, 1500],
    ['Enfants de 9 à 13 ans', BOTH, 'NONE', [108, 167], 1900, 1200, 1800], ['Adolescents de 14 à 17 ans', BOTH, 'NONE', [168, 215], 2300, 1500, 2300],
    ['Hommes de 18 ans et plus', ['MALE'], 'NONE', [216, null], 2300, 1500, 2300], ['Femmes de 18 ans et plus', ['FEMALE'], 'NONE', [216, null], 2300, 1500, 2300],
    ['Femmes enceintes', ['FEMALE'], 'PREGNANT', [216, null], 2300, 1500, 2300], ['Femmes allaitantes', ['FEMALE'], 'LACTATING', [216, null], 2300, 1500, 2300],
  ];
  for (const [label, sexes, stage, age, cl, na, naLss] of rows) {
    push({ compound: 'Chloride', type: 'AI', sexes, stage, age, value: cl, unit: 'mg', from: `${t}, Chlore AS, ${label}` });
    push({ compound: 'Sodium', type: 'AI', sexes, stage, age, value: na, unit: 'mg', from: `${t}, Sodium AS, ${label}` });
    if (naLss != null) push({ compound: 'Sodium', type: 'UL', sexes, stage, age, value: naLss, unit: 'mg', from: `${t}, Sodium LSS, ${label}` });
  }
}
// ── Zinc ──
{
  const t = `${T3}, Zinc`;
  const kids: Array<[string, Sex[], Age, string | null, string, string | null]> = [
    ['Nourrissons de moins de 6 mois', BOTH, [0, 5], null, '2*', null], ['Nourrissons de 6 mois et plus', BOTH, [6, 11], null, '2,9*', null],
    ['Enfants de 1 à 3 ans', BOTH, [12, 47], '3,6', '4,3', '7'], ['Enfants de 4 à 6 ans', BOTH, [48, 83], '4,6', '5,5', '10'],
    ['Enfants de 7 à 10 ans', BOTH, [84, 131], '6,2', '7,4', '13'], ['Adolescents de 11 à 14 ans', BOTH, [132, 179], '8,8', '10,7', '18'],
    ['Adolescents de 15 à 17 ans', ['MALE'], [180, 215], '11,8', '14,2', '22'], ['Adolescentes de 15 à 17 ans', ['FEMALE'], [180, 215], '9,9', '11,9', '22'],
  ];
  for (const [label, sexes, age, bnm, rnp, lss] of kids) {
    if (bnm) push({ compound: 'Zinc', type: 'EAR', sexes, stage: 'NONE', age, value: num(bnm), unit: 'mg', from: `${t} BNM, ${label}` });
    const ai = rnp.endsWith('*');
    push({ compound: 'Zinc', type: ai ? 'AI' : 'RDA', sexes, stage: 'NONE', age, value: num(rnp.replace('*', '')), unit: 'mg', note: ai ? 'Apport satisfaisant.' : null, from: `${t} RNP, ${label}` });
    if (lss) push({ compound: 'Zinc', type: 'UL', sexes, stage: 'NONE', age, value: num(lss), unit: 'mg', from: `${t} LSS, ${label}` });
  }
  const PHY: Array<[number, DietaryContext]> = [[300, 'PHYTATE_LOW'], [600, 'PHYTATE_MED_LOW'], [900, 'PHYTATE_MED_HIGH']];
  const adults: Array<[string, Sex[], LifeStage, Array<[string | null, string]>]> = [
    ['Hommes de 18 ans et plus', ['MALE'], 'NONE', [['7,5', '9,4'], ['9,3', '11,7'], ['11,0', '14,0']]],
    ['Femmes de 18 ans et plus', ['FEMALE'], 'NONE', [['6,2', '7,5'], ['7,6', '9,3'], ['8,9', '11']]],
    ['Femmes enceintes', ['FEMALE'], 'PREGNANT', [[null, '9,1'], [null, '10,9'], [null, '12,6']]],
    ['Femmes allaitantes', ['FEMALE'], 'LACTATING', [[null, '10,4'], [null, '12,2'], [null, '13,9']]],
  ];
  for (const [label, sexes, stage, cells] of adults) {
    cells.forEach(([bnm, rnp], k) => {
      const [phytate, diet] = PHY[k];
      const note = `Phytate intake ${phytate} mg/d.`;
      if (bnm) push({ compound: 'Zinc', type: 'EAR', sexes, stage, age: [216, null], value: num(bnm), unit: 'mg', diet, note, from: `${t} BNM, ${label}, phytates ${phytate} mg/j` });
      push({ compound: 'Zinc', type: 'RDA', sexes, stage, age: [216, null], value: num(rnp), unit: 'mg', diet, note, from: `${t} RNP, ${label}, phytates ${phytate} mg/j` });
    });
    push({ compound: 'Zinc', type: 'UL', sexes, stage, age: [216, null], value: 25, unit: 'mg', from: `${t} LSS, ${label}` });
  }
}

// Folate in pregnancy (footnote a) and iron row notes are attached above; add the footnote to the folate AS.
for (const v of out) {
  if (v.compound === 'Folate (Total)' && v.lifeStage === 'PREGNANT') {
    v.note = 'Apport satisfaisant. Applies to women who may become pregnant and to pregnant women; possibly overestimated for the 2nd and 3rd trimesters (footnote a).';
  }
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths || (a.dietaryContext ?? '').localeCompare(b.dietaryContext ?? ''));
writeFileSync(path.join(process.cwd(), 'dv-sources', 'anses-2021', 'values.json'), JSON.stringify(out, null, 1) + '\n');
const byType: Record<string, number> = {};
for (const v of out) byType[v.valueType] = (byType[v.valueType] ?? 0) + 1;
console.log(`Wrote ${out.length} values to dv-sources/anses-2021/values.json`, byType);
