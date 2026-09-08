# Food coverage list — foods to load so every compound gets real values

**Purpose:** give `/admin/verify-mappings` something to chew on. Each food below is chosen
because it makes one or more of our 280 compounds show up with a *non-zero* value in the
food composition databases. A compound that is never non-zero in any loaded food can't be
verified — the matrix just shows blanks.

**Status of this list: PROPOSED, not verified.** It is built from nutrition knowledge plus
our actual compound table (queried 2026-08-22), *not* from querying the 17 source databases —
they're empty. Expect some misses, especially in Tier B. Treat a blank cell after loading as
"check whether this source carries that nutrient at all", not as a bug.

**Counts it's based on:** 280 compounds; 276 have at least one source mapping; 4 have none
(see the last section — no food will ever fill those).

---

## How to use this

Load Tier A first. That alone should light up the great majority of the matrix, because
mainstream foods are what the composition databases actually measure well. Then add Tier B
only for the compounds still showing blank. Tier C is a different category — fortification
and supplement forms that whole foods will never produce.

Prefer **raw / minimally processed** entries where the source offers them, and prefer the
same food across sources (e.g. "carrot, raw") so cross-source comparison is apples to apples.
That is the whole point of the verify page.

---

## Tier A — the backbone (~22 foods)

These are high-coverage, well-measured foods. Between them they cover nearly all
macronutrients, most vitamins and minerals, the common fatty acids, all amino acids, and the
main sugars and fibers.

| Food | Pulls in |
|---|---|
| **Beef liver** | Vitamin B12 forms, retinol, folate, copper, heme iron, cobalt, vitamin K2 MK-4, cholesterol, arachidonic acid, glycogen, 25-hydroxy D3 |
| **Whole egg (incl. yolk)** | Choline, phosphatidylcholine, lutein/zeaxanthin, cystine, cholesterol, biotin, vitamin D3, arachidonic acid, sulfur |
| **Salmon, wild** | EPA, DHA, long-chain omega-3, vitamin D3, selenium, astaxanthin-adjacent carotenoids, 25-hydroxy D3 |
| **Cod, Atlantic** | Iodine, lean protein baseline, low-fat contrast to salmon |
| **Oyster** | Zinc, copper, taurine, glycogen, cadmium, vitamin B12 |
| **Whole milk** | Lactose, galactose, calcium, odd-chain fatty acids (pentadecanoic, margaric), CLA, vaccenic acid, iodine |
| **Butter** | Butyric, caproic, caprylic, capric, myristic acids; CLA; trans (ruminant); branched-chain fatty acids |
| **Plain yogurt** | Lactic acid, live-culture contrast against milk |
| **Cheddar cheese** | Concentrated dairy minerals, succinic acid, sodium/chloride/salt |
| **Chicken breast** | Baseline lean poultry; full amino acid panel |
| **Beef, ground** | Heme iron, zinc, creatine-adjacent, saturated/monounsaturated split |
| **Spinach, raw** | Oxalic acid, folate, vitamin K1, lutein, magnesium, non-heme iron, boron |
| **Kale, raw** | Vitamin K1, lutein/zeaxanthin, calcium (plant), glucosinolate-adjacent sulfur |
| **Carrot, raw** | Alpha-carotene, beta-carotene, total carotenoids |
| **Tomato paste** | Lycopene (far higher than fresh), potassium, citric/malic acid |
| **Sweet potato** | Beta-carotene, starch, resistant starch (cooked-cooled) |
| **Potato, cooked then cooled** | Resistant starch, potassium, vitamin C |
| **Apple, with skin** | Pectin, malic acid, fructose, sorbitol, soluble/insoluble fiber |
| **Banana** | Potassium, silicon, resistant starch (green), fructose/glucose/sucrose split |
| **Orange** | Vitamin C, beta-cryptoxanthin, citric acid, folate |
| **Rolled oats** | Beta-glucan, HMW/LMW fiber fractions, silicon, nickel, avenasterols, manganese |
| **Whole wheat bread** | Starch, selenomethionine, molybdenum, fiber fractions, sodium |

---

## Tier B — targeted unlockers (~24 foods)

Each of these exists to hit compounds Tier A leaves blank. Add them as needed.

### Fats, oils and unusual fatty acids
| Food | Unlocks |
|---|---|
| **Coconut oil** | Lauric, myristic, caprylic, capric acids — the medium-chain block |
| **Olive oil, extra virgin** | Oleic acid, beta-sitosterol, campesterol, delta-5-avenasterol, squalene-adjacent sterols |
| **Rapeseed / canola oil** | **Brassicasterol** (essentially its unique marker), erucic acid, gondoic acid |
| **Mustard seed or mustard oil** | Erucic acid (high), nervonic acid, gondoic acid |
| **Flaxseed** | Alpha-linolenic acid (ALA) at its highest common level |
| **Hemp seed** | Gamma-linolenic acid (GLA), stearidonic acid |
| **Evening primrose or borage oil** | GLA (the classic reference source) |
| **Sunflower oil** | Linoleic acid, alpha-tocopherol, plant sterols |
| **Cod liver oil** | Vitamin D3, vitamin A retinol, EPA/DHA at supplement strength |
| **Macadamia nut** | Palmitoleic acid (unusually high) |
| **Partially hydrogenated shortening** *(if any source still lists it)* | Elaidic acid, trans-monoenoic and trans-polyenoic fats, linolelaidic acid |

### Minerals and trace elements
| Food | Unlocks |
|---|---|
| **Brazil nut** | Selenium, selenomethionine — no substitute, it's 10–100× anything else |
| **Kelp / nori / wakame** | Iodine, organic arsenic, sodium, vanadium |
| **Table salt (iodized)** | Sodium, chloride, salt, iodine (fortified form) |
| **Black tea, brewed** | Fluoride, manganese, aluminum, caffeine, theophylline |
| **Rice, white and brown** | **Inorganic arsenic** (brown notably higher), starch |
| **Canned fish or canned tomato** | Tin, aluminum, bisphenol-adjacent processing compounds |
| **Tuna, canned or swordfish** | Mercury |
| **Mineral water** | Lithium, uranium, silicon, calcium/magnesium in inorganic form |
| **Legumes — lentils or soybeans** | Molybdenum, nickel, phytate-adjacent, non-heme iron |
| **Garlic and onion** | Sulfur compounds |
| **Raisins or avocado** | Boron |
| **Brewer's yeast** | Chromium, B-vitamin spread |

### Plant compounds, sugars, acids and alkaloids
| Food | Unlocks |
|---|---|
| **Coffee, brewed** | Caffeine, quinic acid, niacin (roasting-derived) |
| **Cocoa / dark chocolate** | Theobromine, caffeine, nickel, copper, magnesium |
| **Natto** | **Vitamin K2 MK-7** — practically the only common food source |
| **Hard cheese, aged (Gouda/Edam)** | Vitamin K2 MK-4 and other menaquinones |
| **Shiitake or UV-exposed mushroom** | **Vitamin D2 (ergocalciferol)**, mannitol, vanadium |
| **Chicory root or Jerusalem artichoke** | Inulin, oligosaccharides |
| **Barley** | Beta-glucan (contrast against oats) |
| **Rhubarb** | Oxalic acid at its extreme |
| **Lemon or lime** | Citric acid |
| **Vinegar** | Acetic acid |
| **Sauerkraut or kimchi** | Lactic acid, fermentation contrast |
| **Cranberry** | Quinic acid, benzoic-adjacent organic acids |
| **Pear or prune** | Sorbitol |
| **Gelatin or pork skin** | **Hydroxyproline** — collagen is the only real source |
| **Beer** | Ethanol, silicon |
| **Red wine** | Ethanol, tartaric/malic acids, polyphenol-adjacent |

---

## Tier C — fortified and supplement forms (~8 items)

A meaningful block of our compound table is *supplement and fortification chemistry*, not
food chemistry. Whole foods will never produce these, no matter how many you load. If you
want these rows populated you need products that declare them.

| Item | Unlocks |
|---|---|
| **Fortified breakfast cereal** | Folic acid (synthetic), thiamin mononitrate, pyridoxine HCl, cyanocobalamin, nicotinamide, ferrous forms, zinc sulfate |
| **Multivitamin tablet** | Calcium pantothenate, dexpanthenol, thiamin HCl, riboflavin-5-phosphate, P5P, methylcobalamin, hydroxocobalamin, adenosylcobalamin, folinic acid, 5-MTHF |
| **Mineral supplement** | Calcium carbonate, calcium citrate, calcium phosphate, magnesium oxide, sodium selenite, zinc sulfate |
| **Nicotinamide riboside supplement** | Nicotinamide riboside (NR) |
| **Citicoline supplement** | CDP-Choline, free choline |
| **Diet soda** | Aspartame, acesulfame-K, saccharin |
| **Stevia tabletop sweetener** | Steviol glycosides, erythritol, maltodextrin |
| **Sugar-free gum or candy** | Xylitol, sorbitol, maltitol, lactitol, mannitol, polyols, sugar alcohols |

---

## What no food will cover

**4 compounds have zero source mappings** — nothing to import them from, in any of the 17
sources. Loading foods will not help; these need a mapping added or the compound retired:

- `Carotenoids` (CAROTENOID) — note `Total Carotenoids` and `Carotenoids (excl. Beta-Carotene)` exist separately; this may be a duplicate
- `Sulphur` (MINERAL) — duplicate of `Sulfur`, which *is* mapped
- `Intrinsic Folate` (VITAMIN)
- `Vitamin K2 MK-9` (VITAMIN)

**Also flagged:** `Adrenic Acid` exists **twice** as two separate compound rows with different
UUIDs. It will appear as two rows in the verify matrix until merged.

**Likely to stay blank even when mapped** — these are analytical or clinical measures that
food composition tables rarely carry: `Retinoic Acid`, `Retinal`, `Retinaldehyde`,
`13-cis-Retinol`, `Dehydroretinol`, `Mead Acid`, `Pantetheine`, `Heneicosapentaenoic Acid`,
`Pentacosanoic Acid`, `Anteiso-Margaric Acid`. Don't treat blanks here as a loading failure.

---

## Suggested order

1. **Tier A, all 22.** Check the verify matrix — expect most compounds to light up.
2. **Fix the duplicates** (`Adrenic Acid`, `Sulfur`/`Sulphur`) before verifying, so you don't
   review the same compound twice.
3. **Tier B, only for what's still blank.** Don't load all 24 blindly.
4. **Tier C last**, and only if you want the fortification forms verified for alpha.
5. Remember **Duke and FooDB load last** — they're the two parent/child sources.
