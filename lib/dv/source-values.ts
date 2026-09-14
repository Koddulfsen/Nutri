/**
 * The flat format every DV source is loaded from: dv-sources/<slug>/values.json.
 *
 * One record per published value. A source's extractor or transcription produces
 * it; db/seed/dv/load-source.ts loads it (replacing that source's rows);
 * scripts/dv-verify/check-source-db.ts proves the database equals it.
 */
import { readFileSync } from 'fs';
import path from 'path';
import type { DvValueType } from './value-types';

export type Sex = 'MALE' | 'FEMALE';
export type LifeStage = 'NONE' | 'PREGNANT' | 'PREGNANT_T1' | 'PREGNANT_T2' | 'PREGNANT_T3' | 'LACTATING' | 'LACTATING_0_6M' | 'LACTATING_7_12M';
export type Activity = 'SEDENTARY' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
export type DietaryContext = 'PHYTATE_LOW' | 'PHYTATE_MED_LOW' | 'PHYTATE_MED_HIGH' | 'PHYTATE_HIGH';

export interface SourceValue {
  compound: string;
  valueType: DvValueType;
  sex: Sex;
  lifeStage: LifeStage;
  /** Inclusive month bounds; null max = no upper bound. */
  ageMinMonths: number;
  ageMaxMonths: number | null;
  activityLevel: Activity | null;
  dietaryContext: DietaryContext | null;
  value: number;
  valueMin: number | null;
  valueMax: number | null;
  /** As published. Unit normalization happens at read time, not here. */
  unit: string;
  isPercentOfEnergy: boolean;
  isProvisional: boolean;
  /** Applies only to supplements / fortified or synthetic forms, not to total food intake. */
  supplementalOnly: boolean;
  note: string | null;
  /** Where in the source document this value was read, e.g. "Table J-3, Iron, Females 19–30 y". */
  from: string;
}

export interface SourceMeta {
  region: string;
  slug: string;
  authorityName: string;
  versionYear: number;
  url: string;
  note: string;
  retrievedDate: string;
}

export function readSourceValues(slug: string): SourceValue[] {
  const file = path.join(process.cwd(), 'dv-sources', slug, 'values.json');
  return JSON.parse(readFileSync(file, 'utf8')) as SourceValue[];
}

/** The unique key the database enforces (idx_ref_dv_compound_demo_source). */
export function valueKey(v: Pick<SourceValue, 'compound' | 'ageMinMonths' | 'ageMaxMonths' | 'sex' | 'lifeStage' | 'valueType' | 'activityLevel' | 'dietaryContext'>): string {
  return [v.compound, v.ageMinMonths, v.ageMaxMonths, v.sex, v.lifeStage, v.valueType, v.activityLevel ?? '-', v.dietaryContext ?? '-'].join('|');
}
