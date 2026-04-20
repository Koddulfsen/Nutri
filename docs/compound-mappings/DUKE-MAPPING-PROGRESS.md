# Duke's Phytochemical Database - Compound Source Mapping Progress

> **Source:** Dr. Duke's Phytochemical and Ethnobotanical Databases
> **Staging table:** `source_duke_chemicals` (29,572 chemicals)
> **Data table:** `source_duke_farmacy` (2,315 plants)
> **Mappable compounds:** 155 / 274 Nutri core compounds (57%)
> **Status:** 155/155 mapped (2026-03-14)

---

## Mapping Process

For Duke, the standard 18-source research phase is not needed — we already have the staging data loaded and have identified which Duke chemicals match Nutri core compounds. The process is:

1. **Create seed script** — `scripts/seed/duke-compound-mappings.ts`
   - Maps Duke `chem_id` → Nutri `compound_id` via `compound_sources`
   - `external_source = 'DUKE'`
   - `external_id = chem_id` (e.g., `'CAFFEINE'`, `'CALCIUM'`, `'OLEICACID'`)
   - `source_name` = Duke chemical name (e.g., `'CAFFEINE'`, `'CALCIUM'`, `'OLEIC-ACID'`)
   - `conversion_factor` = `'1.0'` (Duke uses ppm, conversion handled in duke-client.ts)
   - `is_canonical = false` (Duke is supplementary, not a primary source)
   - Uses `ON CONFLICT (external_source, external_id) DO NOTHING`

2. **Run seed script** — `npx tsx scripts/seed/duke-compound-mappings.ts`
   - Watch for X/Y discrepancy in "mappings inserted" output
   - If less than expected, check for external_id conflicts

3. **Verify** — Query `compound_sources WHERE external_source = 'DUKE'`
   - Confirm count matches expected (155)
   - Spot-check a few mappings (Caffeine, Protein, Calcium, etc.)

4. **Test pipeline** — Re-add a food with Duke source (e.g., coffee)
   - Verify `nutrient_source_values` now includes DUKE entries
   - Check coverage page shows DUKE with non-zero values

---

## Compounds

### Alkaloids (3)
- [x] Caffeine — `CAFFEINE`
- [x] Theobromine — `THEOBROMINE`
- [x] Theophylline — `THEOPHYLLINE`

### Amino Acids (23)
- [x] Alanine — `ALANINE`
- [x] Arginine — `ARGININE`
- [x] Asparagine — `ASPARAGINE`
- [x] Aspartic Acid — `ASPARTICACID`
- [x] Cysteine — `CYSTEINE`
- [x] Cystine — `CYSTINE`
- [x] Glutamic Acid — `GLUTAMICACID`
- [x] Glutamine — `GLUTAMINE`
- [x] Glycine — `GLYCINE`
- [x] Histidine — `HISTIDINE`
- [x] Hydroxyproline — `HYDROXYPROLINE`
- [x] Isoleucine — `ISOLEUCINE`
- [x] Leucine — `LEUCINE`
- [x] Lysine — `LYSINE`
- [x] Methionine — `METHIONINE`
- [x] Phenylalanine — `PHENYLALANINE`
- [x] Proline — `PROLINE`
- [x] Serine — `SERINE`
- [x] Taurine — `TAURINE`
- [x] Threonine — `THREONINE`
- [x] Tryptophan — `TRYPTOPHAN`
- [x] Tyrosine — `TYROSINE`
- [x] Valine — `VALINE`

### Carbohydrates (1)
- [x] Oligosaccharide — `OLIGOSACCHARIDE`

### Carotenoids (3)
- [x] Lutein — `LUTEIN`
- [x] Lycopene — `LYCOPENE`
- [x] Zeaxanthin — `ZEAXANTHIN`

### Fatty Acids (19)
- [x] Decenoic Acid — `DECENOICACID`
- [x] Eicosadienoic Acid — `EICOSADIENOICACID`
- [x] Elaidic Acid — `ELAIDICACID`
- [x] Heneicosanoic Acid — `HENEICOSANOICACID`
- [x] Heptadecenoic Acid — `HEPTADECENOICACID`
- [x] Heptanoic Acid — `HEPTANOICACID`
- [x] Hexadecadienoic Acid — `HEXADECADIENOICACID`
- [x] Hexadecatrienoic Acid — `HEXADECATRIENOICACID`
- [x] Iso-Palmitic Acid — `ISOPALMITICACID`
- [x] Margaric Acid — `MARGARICACID`
- [x] Myristoleic Acid — `MYRISTOLEICACID`
- [x] Nervonic Acid — `NERVONICACID`
- [x] Nonadecanoic Acid — `NONADECANOICACID`
- [x] Pentacosanoic Acid — `PENTACOSANOICACID`
- [x] Pentadecanoic Acid — `PENTADECANOICACID`
- [x] Pentadecenoic Acid — `PENTADECENOICACID`
- [x] Tricosanoic Acid — `TRICOSANOICACID`
- [x] Tridecanoic Acid — `TRIDECANOICACID`
- [x] Undecanoic Acid — `UNDECANOICACID`

### Macronutrients (38)
- [x] Arachidic Acid — `ARACHIDICACID`
- [x] Ash — `ASH`
- [x] Behenic Acid — `BEHENICACID`
- [x] Beta-Glucan — `BETAGLUCAN`
- [x] Butyric Acid — `BUTYRICACID`
- [x] Capric Acid — `CAPRICACID`
- [x] Caproic Acid — `CAPROICACID`
- [x] Caprylic Acid — `CAPRYLICACID`
- [x] Carbohydrates — `CARBOHYDRATES`
- [x] Cholesterol — `CHOLESTEROL`
- [x] Dietary Fiber — `FIBER`
- [x] Energy — `KILOCALORIES`
- [x] Erucic Acid — `ERUCICACID`
- [x] Erythritol — `ERYTHRITOL`
- [x] Ethanol — `ETHANOL`
- [x] Fructose — `FRUCTOSE`
- [x] Galactose — `GALACTOSE`
- [x] Glucose — `GLUCOSE`
- [x] Inulin — `INULIN`
- [x] Lactose — `LACTOSE`
- [x] Lauric Acid — `LAURICACID`
- [x] Lignoceric Acid — `LIGNOCERICACID`
- [x] Maltose — `MALTOSE`
- [x] Mannitol — `MANNITOL`
- [x] Myristic Acid — `MYRISTICACID`
- [x] Nitrogen — `NITROGEN`
- [x] Oleic Acid — `OLEICACID`
- [x] Palmitic Acid — `PALMITICACID`
- [x] Palmitoleic Acid — `PALMITOLEICACID`
- [x] Pectin — `PECTIN`
- [x] Protein — `PROTEIN`
- [x] Sorbitol — `SORBITOL`
- [x] Starch — `STARCH`
- [x] Stearic Acid — `STEARICACID`
- [x] Sucrose — `SUCROSE`
- [x] Total Fat — `FAT`
- [x] Water — `WATER`
- [x] Xylitol — `XYLITOL`

### Minerals (31)
- [x] Aluminum (Al) — `ALUMINUM`
- [x] Arsenic (As) - Total — `ARSENIC`
- [x] Boron — `BORON`
- [x] Cadmium (Cd) — `CADMIUM`
- [x] Calcium (Total) — `CALCIUM`
- [x] Calcium Citrate — `CALCIUMCITRATE`
- [x] Calcium Phosphate — `CALCIUMPHOSPHATE`
- [x] Chloride — `CHLORIDE`
- [x] Chromium (Total) — `CHROMIUM`
- [x] Cobalt (Co) — `COBALT`
- [x] Copper — `COPPER`
- [x] Fluoride — `FLUORIDE`
- [x] Iodine — `IODINE`
- [x] Iron (Total) — `IRON`
- [x] Lead (Pb) — `LEAD`
- [x] Lithium — `LITHIUM`
- [x] Magnesium (Total) — `MAGNESIUM`
- [x] Magnesium Oxide — `MAGNESIUMOXIDE`
- [x] Manganese — `MANGANESE`
- [x] Mercury (Hg) - Total — `MERCURY`
- [x] Molybdenum — `MOLYBDENUM`
- [x] Nickel (Ni) — `NICKEL`
- [x] Phosphorus — `PHOSPHORUS`
- [x] Potassium — `POTASSIUM`
- [x] Selenium (Total) — `SELENIUM`
- [x] Silicon — `SILICON`
- [x] Sodium — `SODIUM`
- [x] Sulfur — `SULFUR`
- [x] Tin (Sn) — `TIN`
- [x] Vanadium — `VANADIUM`
- [x] Zinc (Total) — `ZINC`

### Organic Acids (7)
- [x] Acetic Acid — `ACETICACID`
- [x] Citric Acid — `CITRICACID`
- [x] Lactic Acid — `LACTICACID`
- [x] Malic Acid — `MALICACID`
- [x] Oxalic Acid — `OXALICACID`
- [x] Quinic Acid — `QUINICACID`
- [x] Succinic Acid — `SUCCINICACID`

### Sterols (5)
- [x] Brassicasterol — `BRASSICASTEROL`
- [x] Delta-5-Avenasterol — `DELTA5AVENASTEROL`
- [x] Delta-7-Avenasterol — `DELTA7AVENASTEROL`
- [x] Delta-7-Stigmastenol — `DELTA7STIGMASTENOL`
- [x] Total Plant Sterols — `PHYTOSTEROLS`

### Vitamins (25)
- [x] Alpha-Carotene — `ALPHACAROTENE`
- [x] Alpha-Tocopherol — `ALPHATOCOPHEROL`
- [x] Alpha-Tocotrienol — `ALPHATOCOTRIENOL`
- [x] Ascorbic Acid — `ASCORBICACID`
- [x] Beta-Carotene — `BETACAROTENE`
- [x] Beta-Cryptoxanthin — `BETACRYPTOXANTHIN`
- [x] Beta-Tocopherol — `BETATOCOPHEROL`
- [x] Beta-Tocotrienol — `BETATOCOTRIENOL`
- [x] Biotin (B7) — `BIOTIN`
- [x] Choline (Total) — `CHOLINE`
- [x] Cyanocobalamin — `CYANOCOBALAMIN`
- [x] Dehydroascorbic Acid — `DEHYDROASCORBICACID`
- [x] Delta-Tocopherol — `DELTATOCOPHEROL`
- [x] Delta-Tocotrienol — `DELTATOCOTRIENOL`
- [x] Folate (Total) — `FOLATE`
- [x] Folinic Acid — `FOLINICACID`
- [x] Gamma-Tocopherol — `GAMMATOCOPHEROL`
- [x] Gamma-Tocotrienol — `GAMMATOCOTRIENOL`
- [x] Niacin (B3) — `NIACIN`
- [x] Nicotinamide — `NICOTINAMIDE`
- [x] Nicotinic Acid — `NICOTINICACID`
- [x] Pyridoxine — `PYRIDOXINE`
- [x] Retinoic Acid — `RETINOICACID`
- [x] Riboflavin (B2) — `RIBOFLAVIN`
- [x] Thiamin (B1) — `THIAMIN`

---

## Summary

| Category | Mappable | Mapped |
|----------|----------|--------|
| Alkaloids | 3 | 3 |
| Amino Acids | 23 | 23 |
| Carbohydrates | 1 | 1 |
| Carotenoids | 3 | 3 |
| Fatty Acids | 19 | 19 |
| Macronutrients | 38 | 38 |
| Minerals | 31 | 31 |
| Organic Acids | 7 | 7 |
| Sterols | 5 | 5 |
| Vitamins | 25 | 25 |
| **TOTAL** | **155** | **155** |

---

## Not Mappable (119 Nutri compounds without Duke equivalent)

These Nutri core compounds have no matching Duke chemical. Mostly specialized vitamin forms, supplement-specific compounds, and aggregate categories:

- Vitamin aggregates: Vitamin A (RAE), Vitamin C (Total), Vitamin D (Total), Vitamin E (Total), Vitamin K (Total), Vitamin B6, Vitamin B12 (Total)
- Specialized vitamin forms: Methylcobalamin, Adenosylcobalamin, Hydroxocobalamin, P5P, Thiamin HCl, etc.
- Fat aggregates: Saturated Fat, Monounsaturated Fat, Polyunsaturated Fat, Trans Fat, Omega-3, Omega-6
- Specific fatty acids: DHA, EPA, DPA, AA, LA, ALA, GLA, SDA, CLA, DGLA, DTA, Mead Acid
- Supplement forms: Calcium Carbonate, Zinc Sulfate, Sodium Selenite, etc.
- Synthetic additives: Aspartame, Saccharin, Acesulfame-K, Stevia
- Other: Added Sugars, Free Sugars, Total Sugars, Sugar Alcohols, Salt, Resistant Starch, etc.
