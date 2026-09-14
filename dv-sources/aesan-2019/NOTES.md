# AESAN 2019 — Source notes

## Authority
- **AESAN** (Agencia Española de Seguridad Alimentaria y Nutrición) — Spanish Food Safety Agency
- *Informe del Comité Científico sobre Ingestas Nutricionales de Referencia para la población española*
- Reference: AESAN-2019-003, approved 22 May 2019
- Replaces FESNAD 2010

## Source material
- `aesan-inr-2019.pdf` (26 pages) — full Spanish report with Appendix I data tables (pages 58-68 / internal)
- URL: https://www.aesan.gob.es/AECOSAN/docs/documentos/seguridad_alimentaria/evaluacion_riesgos/informes_comite/INR.pdf

## Region code
**SPAIN** (new — added to source_region_enum via ALTER TYPE)

## Methodology
AESAN uses a decision-making algorithm based on FESNAD 2010:
- Searches reference intakes from official international organizations
- Compiles post-2010 data
- Harmonizes recommendations by age/sex intervals
- Applies algorithm:
  1. Compute mode + median of nutrient value across sources
  2. If match → use if published; else compute mean
  3. Else take value closest to mean
- For macronutrients + energy: **directly adopts EFSA 2017 values** (no modification)
- For vitamins/minerals: applies the harmonization algorithm

## Value types
- **INR** (Ingestas Nutricionales de Referencia) → Nutri `RDA` (97-98% population coverage)
- Macros use EFSA reference ranges → AMDR

## Native age buckets
- Infants: 0-6 mo, 7-12 mo
- Children: 1-3, 4-5, 6-9 y
- Adolescents: M/F 10-13, 14-19 y
- Adults: M/F 20-29, 30-39, 40-49, 50-59, 60-69, >70 y
- Pregnancy (single row)
- Lactation (single row)

Note: Energy Table 1 uses different bands (monthly infants 7-11, single-year children 1-17, 10-year adult bands 18-29/30-39/... 70-79). We'll align to the micronutrient age structure where possible.

## Special cases

### 1. Adopts EFSA values directly for macros + energy
No modification — identical to EFSA 2017. Could be seen as duplication. We seed anyway for completeness.

### 2. Different age buckets between Energy (Table 1) and Vitamin/Mineral tables (6a-7d)
- Energy: 18-29 / 30-39 / 40-49 / 50-59 / 60-69 / 70-79 y (adults)
- Vitamins/Minerals: 20-29 / 30-39 / 40-49 / 50-59 / 60-69 / >70 y

We use each table's native boundaries.

### 3. Vitamin A in µg RE
Same as WHO/FAO pattern. Stored in `Vitamin A (RAE)` with caveat.

### 4. Vitamin D uniquely higher for middle-aged adults
INR: 10 µg for children, **12.5 µg for 20-59 y**, **15 µg for 60+** (Spain mid-range between low-sun and high-sun countries).

### 5. Activity level mapping (Energy)
- AF 1.4 (Sedentario) → SEDENTARY
- AF 1.6 (Moderadamente activo) → MODERATE
- AF 1.8 (Activo) → ACTIVE
- AF 2.0 (Muy activo) → VERY_ACTIVE

### 6. Protein as g/kg — not absolute
All protein values in Table 2 are g/kg body weight per day (not absolute g/d). Would need reference body weights for absolute. We store as **g/kg** unit and document.

### 7. Pregnancy/lactation as increments
All values in Tables 1-7 preg/lact rows are increments over non-preg/non-lact baseline. Compute absolute = base + increment.

### 8. Fluoride age 0-6 mo: 0.25 mg
Much higher than WHO/FAO (0.1 mg) — likely driven by Spanish fluoridated water context.

## Compounds covered (28)
**Vitamins (13):** A, D, E, K, C, B1 (Thiamin), B2 (Riboflavin), B3 (Niacin), B5 (Pantothenic), B6, B9 (Folate), B12, Biotin
**Minerals (15):** Ca, Cl, Cr, Cu, F (fluoride), P, Fe, I, Mg, Mn, Mo, K, Se, Na, Zn
**Macros/Energy:** Energy, Protein (g/kg), Total Fat + Saturated + n-6 LA + n-3 ALA + EPA+DHA, Carbohydrate, Fiber, Water

## Estimated rows
- Vitamins (13) × ~14 age-sex buckets + preg/lact = ~195
- Minerals (15) × ~14 = ~220
- Macros (10) × ~13 = ~130
- Energy × 4 activity levels × ~13 age/sex = ~200
- Total estimate: **~700-900 rows**
