# Flagged Compound Source Mappings

Mappings where the external source doesn't actually have data for the nutrient, or the mapping is otherwise invalid.

| Source | External ID | Compound | Compound ID | Mapping ID | Reason |
|--------|-------------|----------|-------------|------------|--------|
| MATVARETABELLEN | Cl | Chloride | 6e22a30a-abbb-4238-b01a-7def9644b140 | 83155fd6-4aa7-4a1c-b2a8-5f41f7220e18 | Nutrient not found in source staging table |
| MATVARETABELLEN | Alko | Ethanol | c069c427-37d2-4fc6-a24a-26dd92a0c3eb | 2f343460-2733-4488-b8d6-d289912ad5c8 | Nutrient not found in source staging table |

| AFCD | C22FD | Behenic Acid | b62133d4-7895-4e38-8cec-1a9b61438cdf | 8feea02f-6157-41f6-bf13-ba89103e19e7 | Not in AFCD at all |
| AFCD | C24FD | Lignoceric Acid | cefcfabe-3d65-4627-9b61-c4863b5760b9 | 41d76772-5967-46eb-8a15-af708dcafaa7 | Not in AFCD at all |
| FOODFILES | ERGCAL | Vitamin D2 (Ergocalciferol) | 0b9731a0-28b8-4551-8ce4-943c51c7aad5 | 7c1e7876-ab98-45b6-bcad-434fc1519fdd | Only in fortified foods, no whole food option |
| NEVO | ERGCAL | Vitamin D2 (Ergocalciferol) | 0b9731a0-28b8-4551-8ce4-943c51c7aad5 | dd29c3a5-3aca-4c70-82ec-a676068ba54d | Only fortified foods (margarine) |

## KFCT — Nutrient codes not in staging data

KFCT only has 44 nutrients (basic macros, vitamins, minerals). It does not break down individual amino acids, fatty acids, tocopherol/tocotrienol forms, or individual sugars. All 88 codes below do not exist in the `source_kfct_nutrients` table.

### Amino Acids (not in KFCT)
| Source | External ID | Compound |
|--------|-------------|----------|
| KFCT | ALA | Alanine |
| KFCT | ARG | Arginine |
| KFCT | ASP | Aspartic Acid |
| KFCT | CYS | Cystine |
| KFCT | GLU | Glutamic Acid |
| KFCT | GLY | Glycine |
| KFCT | HIS | Histidine |
| KFCT | ILE | Isoleucine |
| KFCT | LEU | Leucine |
| KFCT | LYS | Lysine |
| KFCT | MET | Methionine |
| KFCT | PHE | Phenylalanine |
| KFCT | PRO | Proline |
| KFCT | SER | Serine |
| KFCT | TAUN | Taurine |
| KFCT | THR | Threonine |
| KFCT | TRP | Tryptophan |
| KFCT | TYR | Tyrosine |
| KFCT | VAL | Valine |

### Fatty Acids (not in KFCT)
| Source | External ID | Compound |
|--------|-------------|----------|
| KFCT | F4D0F | Butyric Acid |
| KFCT | F6D0F | Caproic Acid |
| KFCT | F8D0F | Caprylic Acid |
| KFCT | F10D0F | Capric Acid |
| KFCT | F10D1 | Decenoic Acid |
| KFCT | F12D0F | Lauric Acid |
| KFCT | F13D0F | Tridecanoic Acid |
| KFCT | F14D0F | Myristic Acid |
| KFCT | F14D1F | Myristoleic Acid |
| KFCT | F15D0F | Pentadecanoic Acid |
| KFCT | F16D0F | Palmitic Acid |
| KFCT | F16D1 | Palmitoleic Acid |
| KFCT | F17D0F | Margaric Acid |
| KFCT | F17D1F | Heptadecenoic Acid |
| KFCT | F18D0F | Stearic Acid |
| KFCT | F18D1N7F | Vaccenic Acid (cis) |
| KFCT | F18D1N9F | Oleic Acid |
| KFCT | F18D1TN9 | Elaidic Acid |
| KFCT | F18D2N6F | LA |
| KFCT | F18D2TN6 | Linolelaidic Acid |
| KFCT | F18D3N3F | ALA |
| KFCT | F18D3N6F | GLA |
| KFCT | F18D3TN3 | Trans Alpha-Linolenic Acid |
| KFCT | F18D4 | SDA |
| KFCT | F20D0F | Arachidic Acid |
| KFCT | F20D1F | Gondoic Acid |
| KFCT | F20D2N6F | Eicosadienoic Acid |
| KFCT | F20D3N3F | Eicosatrienoic Acid |
| KFCT | F20D3N6F | DGLA |
| KFCT | F20D4N3 | Eicosatetraenoic Acid (n-3) |
| KFCT | F20D4N6F | AA |
| KFCT | F20D5N3F | EPA |
| KFCT | F21D0F | Heneicosanoic Acid |
| KFCT | F22D0F | Behenic Acid |
| KFCT | F22D1F | Erucic Acid |
| KFCT | F22D2F | Docosadienoic Acid |
| KFCT | F22D5N3F | DPA |
| KFCT | F22D5N6 | Docosapentaenoic Acid (n-6) |
| KFCT | F22D6N3F | DHA |
| KFCT | F23D0F | Tricosanoic Acid |
| KFCT | F24D0F | Lignoceric Acid |
| KFCT | F24D1F | Nervonic Acid |
| KFCT | FATRNF | Trans Fat |
| KFCT | FAPUN3F | Omega-3 |
| KFCT | FAPUN6F | Omega-6 |

### Vitamins (not in KFCT)
| Source | External ID | Compound |
|--------|-------------|----------|
| KFCT | TOCPHA | Alpha-Tocopherol |
| KFCT | TOCPHB | Beta-Tocopherol |
| KFCT | TOCPHD | Delta-Tocopherol |
| KFCT | TOCPHG | Gamma-Tocopherol |
| KFCT | TOCTRA | Alpha-Tocotrienol |
| KFCT | TOCTRB | Beta-Tocotrienol |
| KFCT | TOCTRD | Delta-Tocotrienol |
| KFCT | TOCTRG | Gamma-Tocotrienol |
| KFCT | CARTA | Alpha-Carotene |
| KFCT | CRYPX | Beta-Cryptoxanthin |
| KFCT | VITA | Vitamin A (RAE) |
| KFCT | VITA_RAE | Vitamin A (RAE) |
| KFCT | ERGCAL | Vitamin D2 (Ergocalciferol) |
| KFCT | CHOCAL | Vitamin D3 (Cholecalciferol) |
| KFCT | FOLAC | Folic Acid (Synthetic) |
| KFCT | NIAEQ | Niacin Equivalents |

### Sugars & Fiber (not in KFCT)
| Source | External ID | Compound |
|--------|-------------|----------|
| KFCT | FRUS | Fructose |
| KFCT | GALS | Galactose |
| KFCT | GLUS | Glucose |
| KFCT | LACS | Lactose |
| KFCT | MALS | Maltose |
| KFCT | SUCS | Sucrose |
| KFCT | FIBINS | Insoluble Fiber |
| KFCT | FIBSOL | Soluble Fiber |

## FDC — Nutrient IDs not populated in API

These FDC nutrient IDs exist in USDA's schema but are never returned by the FDC API for any food.

| Source | External ID | Compound | Reason |
|--------|-------------|----------|--------|
| FDC | 1235 | Added Sugars | Not returned by FDC API for any food |
| FDC | 344 | Alpha-Tocotrienol | Not returned by FDC API for any food |
| FDC | 345 | Beta-Tocotrienol | Not returned by FDC API for any food |
| FDC | 1137 | Boron | Not returned by FDC API for any food |
| FDC | 1096 | Chromium (Total) | Not returned by FDC API for any food |
| FDC | 347 | Delta-Tocotrienol | Not returned by FDC API for any food |
| FDC | 858 | DTA | Not returned by FDC API for any food |
| FDC | 1181 | Free Choline | Not returned by FDC API (only Total Choline 1180 is) |
| FDC | 346 | Gamma-Tocotrienol | Not returned by FDC API for any food |
| FDC | 1100 | Iodine | Not returned by FDC API for any food |
| FDC | 260 | Mannitol | Not returned by FDC API for any food |
| FDC | 1182 | Phosphatidylcholine | Not returned by FDC API (only Total Choline 1180 is) |
| FDC | 261 | Sorbitol | Not returned by FDC API for any food |
| FDC | 428 | Vitamin K2 MK-4 | Not returned by FDC API for any food |

## FooDB — No standardized content values

These FooDB mappings point to correct compounds but have no `standard_content` data in the staging tables.

### Supplement / Salt Forms
| Source | External ID | Compound | Reason |
|--------|-------------|----------|--------|
| FOODB | FDB015441 | Calcium Carbonate | Supplement form, no food content data |
| FOODB | FDB013371 | Calcium Citrate | Supplement form, no food content data |
| FOODB | FDB012196 | Calcium Pantothenate | Supplement form, no food content data |
| FOODB | FDB013359 | Calcium Phosphate | Supplement form, no food content data |
| FOODB | FDB008431 | Dexpanthenol | Supplement form, no food content data |
| FOODB | FDB003167 | Hydroxocobalamin | Supplement form, no food content data |
| FOODB | FDB015362 | Magnesium Oxide | Supplement form, no food content data |
| FOODB | FDB023102 | Methylcobalamin | Supplement form, no food content data |
| FOODB | FDB023000 | Adenosylcobalamin | Supplement form, no food content data |
| FOODB | FDB023335 | Pantetheine | Supplement form, no food content data |
| FOODB | FDB010178 | Riboflavin-5-Phosphate (R5P) | Supplement form, no food content data |
| FOODB | FDB028064 | Sodium Selenite | Supplement form, no food content data |
| FOODB | FDB008427 | Thiamin Mononitrate | Supplement form, no food content data |
| FOODB | FDB013491 | Zinc Sulfate | Supplement form, no food content data |
| FOODB | FDB022771 | CDP-Choline (Citicoline) | Supplement form, no food content data |

### Synthetic Additives
| Source | External ID | Compound | Reason |
|--------|-------------|----------|--------|
| FOODB | FDB012176 | Acesulfame-K | Synthetic additive, no food content data |
| FOODB | FDB000569 | Aspartame | Synthetic additive, no food content data |
| FOODB | FDB000918 | Saccharin | Synthetic additive, no food content data |
| FOODB | FDB013541 | Stevia (Steviol Glycosides) | Synthetic additive, no food content data |
| FOODB | 1134 | Xylitol | Sugar alcohol, no food content data |
| FOODB | 20377 | Maltitol | Sugar alcohol, no food content data |

### Vitamins — All standard_content NULL or 0 rows
| Source | External ID | Compound | Reason |
|--------|-------------|----------|--------|
| FOODB | FDB002434 | Alpha-Tocotrienol | 26 content rows but all standard_content NULL |
| FOODB | FDB031464 | Beta-Tocopherol | 482 content rows but all standard_content NULL |
| FOODB | FDB121159 | Beta-Tocotrienol | 26 content rows but all standard_content NULL |
| FOODB | FDB001299 | Delta-Tocotrienol | 39 content rows but all standard_content NULL |
| FOODB | FDB001298 | Gamma-Tocotrienol | 40 content rows but all standard_content NULL |
| FOODB | FDB022739 | Retinal | 482 content rows but all standard_content NULL |
| FOODB | FDB022873 | Retinoic Acid | 0 content rows |
| FOODB | FDB022763 | 5-MTHF (Methylfolate) | 0 content rows |
| FOODB | FDB022852 | Folinic Acid | 0 content rows |
| FOODB | FDB022444 | Nicotinamide Riboside (NR) | 0 content rows |

### Fatty Acids — All standard_content NULL
| Source | External ID | Compound | Reason |
|--------|-------------|----------|--------|
| FOODB | 4029 | Arachidic Acid | Content rows but all standard_content NULL |
| FOODB | 5831 | Behenic Acid | Content rows but all standard_content NULL |
| FOODB | 31194 | Butyric Acid | 482 content rows but all standard_content NULL |
| FOODB | 121369 | CLA | 0 content rows |
| FOODB | FDB027692 | Mead Acid | 0 content rows |
| FOODB | 31172 | Myristic Acid | 482 content rows but all standard_content NULL |
| FOODB | 31247 | Palmitic Acid | 482 content rows but all standard_content NULL |
| FOODB | 31346 | Stearic Acid | 482 content rows but all standard_content NULL |
| FOODB | 5763 | Beta-Glucan | Content rows but all standard_content NULL |

### Other
| Source | External ID | Compound | Reason |
|--------|-------------|----------|--------|
| FOODB | FDB029005 | Inorganic Arsenic | 0 content rows |
| FOODB | FDB011222 | Organic Arsenic | 1 content row but standard_content NULL |
