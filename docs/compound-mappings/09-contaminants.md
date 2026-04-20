# Contaminants (Heavy Metals) - Compound Source Mappings

> **Category:** 9 of 9 (Core)
> **Compounds:** 10
> **Status:** 10/10 complete ✅

---

## Sources Reference

### Standard Nutrition Sources (unlikely to have contaminant data)

| Source | Type | Version | Docs |
|--------|------|---------|------|
| FDC (USDA) | API | 2024 | https://fdc.nal.usda.gov/api-guide.html |
| CNF (Canada) | API | 2024 | https://food-nutrition.canada.ca/api/ |
| AFCD (Australia) | CSV | 2024 | https://www.foodstandards.gov.au/science-data/monitoringnutrients/afcd |
| CoFID (UK) | CSV | 2021 | https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid |
| CIQUAL (France) | CSV | 2024 | https://ciqual.anses.fr/ |
| FOODfiles (NZ) | CSV | 2024 | https://www.foodcomposition.co.nz/ |
| Fineli (Finland) | CSV | 2024 | https://fineli.fi/ |
| BLS (Germany) | CSV | 4.0 | https://www.blsdb.de/ |
| NEVO (Netherlands) | CSV | 2025 | https://nevo-online.rivm.nl/ |
| Matvaretabellen (Norway) | API | 2024 | https://www.matvaretabellen.no/api/ |
| FRIDA (Denmark) | CSV | 5.4 | https://frida.fooddata.dk/ |
| MEXT (Japan) | CSV | 8th Ed | https://www.mext.go.jp/en/policy/science_technology/policy/title01/detail01/1374030.htm |
| KFCT (Korea) | CSV | 9th Rev | https://www.foodsafetykorea.go.kr/ |
| INDB (India) | CSV | 2024 | https://www.nin.res.in/ |
| ASEANFOODS | CSV | 2014 | http://www.inmu.mahidol.ac.th/aseanfoods/ |
| FooDB | API | 1.0 | https://foodb.ca/api_doc |
| Phenol-Explorer | CSV | 3.6 | http://phenol-explorer.eu/ |
| Duke's Phytochemical | Web | - | https://phytochem.nal.usda.gov/ |

### Contaminant-Specific Sources (primary for this category)

| Source | Type | Version | Docs |
|--------|------|---------|------|
| FDA TDS | CSV | 2024 | https://www.fda.gov/food/fda-total-diet-study-tds/fda-total-diet-study-tds-results |
| EFSA Occurrence | CSV | 2024 | https://zenodo.org/communities/efsa-chem |

---

## Compounds

### Lead (Pb)
**Canonical unit:** μg
**Safety:** ALARA (As Low As Reasonably Achievable) - no safe level
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDA TDS | | | | | | CSV | primary source |
| EFSA Occurrence | | | | | | CSV | |
| FDC | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| CNF | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| AFCD | ✓ | PB | Lead (Pb) | μg | — | CSV | INFOODS: PB |
| CoFID | ✗ | — | — | — | — | CSV | Not in database |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in database |
| FOODfiles | ✓ | PB | Lead | μg | — | CSV | |
| Fineli | ✗ | — | — | — | — | CSV | Not in database |
| BLS | ✗ | — | — | — | — | CSV | Not in database |
| NEVO | ✗ | — | — | — | — | CSV | Not in database |
| Matvaretabellen | ✗ | — | — | — | — | API | Not in database |
| FRIDA | ✓ | 43 | Lead / Bly | μg | — | CSV | EuroFIR: PB |
| MEXT | ✗ | — | — | — | — | CSV | Not in database |
| KFCT | ✗ | — | — | — | — | CSV | Not in database |
| INDB | ✗ | — | — | — | — | CSV | Not in database |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in database |
| FooDB | ✓ | FDB003777 | Lead | — | — | API | Heavy metal contaminant |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | LEAD | Lead | — | — | Web | |

---

### Mercury (Hg) - Total
**Canonical unit:** μg
**Safety:** Varies by form
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDA TDS | | | | | | CSV | primary source |
| EFSA Occurrence | | | | | | CSV | |
| FDC | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| CNF | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| AFCD | ✓ | HG | Mercury (Hg) | μg | — | CSV | INFOODS: HG |
| CoFID | ✗ | — | — | — | — | CSV | Not in database |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in database |
| FOODfiles | ✓ | HG | Mercury | μg | — | CSV | INFOODS: HG |
| Fineli | ✗ | — | — | — | — | CSV | Not in database |
| BLS | ✗ | — | — | — | — | CSV | Not in database |
| NEVO | ✗ | — | — | — | — | CSV | Not in database |
| Matvaretabellen | ✗ | — | — | — | — | API | Not in database |
| FRIDA | ✓ | 174 | Mercury / Kviksølv | μg | — | CSV | EuroFIR: HG |
| MEXT | ✗ | — | — | — | — | CSV | Not in database |
| KFCT | ✗ | — | — | — | — | CSV | Not in database |
| INDB | ✗ | — | — | — | — | CSV | Not in database |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in database |
| FooDB | ✓ | FDB003780 | Mercury | — | — | API | Heavy metal contaminant |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | MERCURY | Mercury | — | — | Web | |

---

### Cadmium (Cd)
**Canonical unit:** μg
**Safety:** ~25 μg/day (EFSA TWI)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDA TDS | | | | | | CSV | primary source |
| EFSA Occurrence | | | | | | CSV | |
| FDC | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| CNF | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| AFCD | ✓ | CD | Cadmium (Cd) | μg | — | CSV | INFOODS: CD |
| CoFID | ✗ | — | — | — | — | CSV | Not in database |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in database |
| FOODfiles | ✓ | CD | Cadmium | μg | — | CSV | INFOODS: CD |
| Fineli | ✗ | — | — | — | — | CSV | Not in database |
| BLS | ✗ | — | — | — | — | CSV | Not in database |
| NEVO | ✗ | — | — | — | — | CSV | Not in database |
| Matvaretabellen | ✗ | — | — | — | — | API | Not in database |
| FRIDA | ✓ | 107 | Cadmium | μg | — | CSV | EuroFIR: CD |
| MEXT | ✗ | — | — | — | — | CSV | Not in database |
| KFCT | ✗ | — | — | — | — | CSV | Not in database |
| INDB | ✗ | — | — | — | — | CSV | Not in database |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in database |
| FooDB | ✓ | FDB003766 | Cadmium | — | — | API | Heavy metal contaminant |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | CADMIUM | Cadmium | — | — | Web | |

---

### Arsenic (As) - Total
**Canonical unit:** μg
**Safety:** Varies by form (inorganic more toxic)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDA TDS | | | | | | CSV | primary source |
| EFSA Occurrence | | | | | | CSV | |
| FDC | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| CNF | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| AFCD | ✓ | AS | Arsenic (As) | μg | — | CSV | INFOODS: AS |
| CoFID | ✗ | — | — | — | — | CSV | Not in database |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in database |
| FOODfiles | ✓ | AS | Arsenic | μg | — | CSV | INFOODS: AS |
| Fineli | ✗ | — | — | — | — | CSV | Not in database |
| BLS | ✗ | — | — | — | — | CSV | Not in database |
| NEVO | ✗ | — | — | — | — | CSV | Not in database |
| Matvaretabellen | ✗ | — | — | — | — | API | Not in database |
| FRIDA | ✓ | 32 | Arsenic / Arsen | μg | — | CSV | EuroFIR: AS |
| MEXT | ✗ | — | — | — | — | CSV | Not in database |
| KFCT | ✗ | — | — | — | — | CSV | Not in database |
| INDB | ✗ | — | — | — | — | CSV | Not in database |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in database |
| FooDB | ✓ | FDB003763 | Arsenic | — | — | API | Heavy metal contaminant |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | ARSENIC | Arsenic | — | — | Web | |

---

### Inorganic Arsenic
**Canonical unit:** μg
**Safety:** EFSA BMDL01 0.3-8 μg/kg bw/day
**Parent:** Arsenic (As)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDA TDS | | | | | | CSV | |
| EFSA Occurrence | | | | | | CSV | |
| FDC | ✗ | — | — | — | — | API | Only total As tracked |
| CNF | ✗ | — | — | — | — | API | Only total As tracked |
| AFCD | ✗ | — | — | — | — | CSV | Only total As tracked |
| CoFID | ✗ | — | — | — | — | CSV | Not in database |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in database |
| FOODfiles | ✗ | — | — | — | — | CSV | Only total As tracked |
| Fineli | ✗ | — | — | — | — | CSV | Not in database |
| BLS | ✗ | — | — | — | — | CSV | Not in database |
| NEVO | ✗ | — | — | — | — | CSV | Not in database |
| Matvaretabellen | ✗ | — | — | — | — | API | Not in database |
| FRIDA | ✗ | — | — | — | — | CSV | Only total As tracked |
| MEXT | ✗ | — | — | — | — | CSV | Not in database |
| KFCT | ✗ | — | — | — | — | CSV | Not in database |
| INDB | ✗ | — | — | — | — | CSV | Not in database |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in database |
| FooDB | ✓ | FDB028842 | Arsenate | — | — | API | Inorganic As(V) |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | Web | Only total As tracked |

---

### Organic Arsenic
**Canonical unit:** μg
**Parent:** Arsenic (As)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDA TDS | | | | | | CSV | |
| EFSA Occurrence | | | | | | CSV | |
| FDC | ✗ | — | — | — | — | API | Only total As tracked |
| CNF | ✗ | — | — | — | — | API | Only total As tracked |
| AFCD | ✗ | — | — | — | — | CSV | Only total As tracked |
| CoFID | ✗ | — | — | — | — | CSV | Not in database |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in database |
| FOODfiles | ✗ | — | — | — | — | CSV | Only total As tracked |
| Fineli | ✗ | — | — | — | — | CSV | Not in database |
| BLS | ✗ | — | — | — | — | CSV | Not in database |
| NEVO | ✗ | — | — | — | — | CSV | Not in database |
| Matvaretabellen | ✗ | — | — | — | — | API | Not in database |
| FRIDA | ✗ | — | — | — | — | CSV | Only total As tracked |
| MEXT | ✗ | — | — | — | — | CSV | Not in database |
| KFCT | ✗ | — | — | — | — | CSV | Not in database |
| INDB | ✗ | — | — | — | — | CSV | Not in database |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in database |
| FooDB | ✓ | FDB011219 | Arsenobetaine | — | — | API | Main organic As; also DMA, MMA |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | Web | Only total As tracked |

---

### Aluminum (Al)
**Canonical unit:** μg
**Safety:** EFSA TWI 1 mg/kg bw/week
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDA TDS | | | | | | CSV | primary source |
| EFSA Occurrence | | | | | | CSV | |
| FDC | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| CNF | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| AFCD | ✓ | AL | Aluminium (Al) | μg | — | CSV | INFOODS: AL |
| CoFID | ✗ | — | — | — | — | CSV | Not in database |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in database |
| FOODfiles | ✓ | AL | Aluminium | μg | — | CSV | INFOODS: AL |
| Fineli | ✗ | — | — | — | — | CSV | Not in database |
| BLS | ✗ | — | — | — | — | CSV | Not in database |
| NEVO | ✗ | — | — | — | — | CSV | Not in database |
| Matvaretabellen | ✗ | — | — | — | — | API | Not in database |
| FRIDA | ✓ | 20 | Aluminum / Aluminium | mg | ×1000 | CSV | EuroFIR: AL |
| MEXT | ✗ | — | — | — | — | CSV | Not in database |
| KFCT | ✗ | — | — | — | — | CSV | Not in database |
| INDB | ✗ | — | — | — | — | CSV | Not in database |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in database |
| FooDB | ✓ | FDB003570 | Aluminum | — | — | API | Metal element |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | ALUMINUM | Aluminum | — | — | Web | |

---

### Nickel (Ni)
**Canonical unit:** μg
**Safety:** EFSA TDI 13 μg/kg bw/day
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDA TDS | | | | | | CSV | primary source |
| EFSA Occurrence | | | | | | CSV | |
| FDC | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| CNF | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| AFCD | ✓ | NI | Nickel (Ni) | μg | — | CSV | INFOODS: NI |
| CoFID | ✗ | — | — | — | — | CSV | Not in database |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in database |
| FOODfiles | ✓ | NI | Nickel | μg | — | CSV | INFOODS: NI |
| Fineli | ✗ | — | — | — | — | CSV | Not in database |
| BLS | ✗ | — | — | — | — | CSV | Not in database |
| NEVO | ✗ | — | — | — | — | CSV | Not in database |
| Matvaretabellen | ✗ | — | — | — | — | API | Not in database |
| FRIDA | ✓ | 204 | Nickel / Nikkel | μg | — | CSV | EuroFIR: NI |
| MEXT | ✗ | — | — | — | — | CSV | Not in database |
| KFCT | ✗ | — | — | — | — | CSV | Not in database |
| INDB | ✗ | — | — | — | — | CSV | Not in database |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in database |
| FooDB | ✓ | FDB013444 | Nickel | — | — | API | Metal element |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | NICKEL | Nickel | — | — | Web | |

---

### Tin (Sn)
**Canonical unit:** μg
**Safety:** EFSA PTWI 14 mg/kg bw/week
**Notes:** Primarily from canned foods
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDA TDS | | | | | | CSV | primary source |
| EFSA Occurrence | | | | | | CSV | |
| FDC | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| CNF | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| AFCD | ✓ | SN | Tin (Sn) | μg | — | CSV | INFOODS: SN |
| CoFID | ✗ | — | — | — | — | CSV | Not in database |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in database |
| FOODfiles | ✓ | SN | Tin | μg | — | CSV | INFOODS: SN |
| Fineli | ✗ | — | — | — | — | CSV | Not in database |
| BLS | ✗ | — | — | — | — | CSV | Not in database |
| NEVO | ✗ | — | — | — | — | CSV | Not in database |
| Matvaretabellen | ✗ | — | — | — | — | API | Not in database |
| FRIDA | ✓ | 260 | Tin | μg | — | CSV | EuroFIR: SN |
| MEXT | ✗ | — | — | — | — | CSV | Not in database |
| KFCT | ✗ | — | — | — | — | CSV | Not in database |
| INDB | ✗ | — | — | — | — | CSV | Not in database |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in database |
| FooDB | ✓ | FDB003722 | Tin | — | — | API | Metal element |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | TIN | Tin | — | — | Web | |

---

### Uranium (U)
**Canonical unit:** μg
**Safety:** WHO TDI 0.6 μg/kg bw/day
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDA TDS | | | | | | CSV | primary source |
| EFSA Occurrence | | | | | | CSV | |
| FDC | ✗ | — | — | — | — | API | Not tracked |
| CNF | ✗ | — | — | — | — | API | Not tracked |
| AFCD | ✗ | — | — | — | — | CSV | Not in database |
| CoFID | ✗ | — | — | — | — | CSV | Not in database |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in database |
| FOODfiles | ✗ | — | — | — | — | CSV | Not in database |
| Fineli | ✗ | — | — | — | — | CSV | Not in database |
| BLS | ✗ | — | — | — | — | CSV | Not in database |
| NEVO | ✗ | — | — | — | — | CSV | Not in database |
| Matvaretabellen | ✗ | — | — | — | — | API | Not in database |
| FRIDA | ✗ | — | — | — | — | CSV | Not in database |
| MEXT | ✗ | — | — | — | — | CSV | Not in database |
| KFCT | ✗ | — | — | — | — | CSV | Not in database |
| INDB | ✗ | — | — | — | — | CSV | Not in database |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in database |
| FooDB | ✓ | FDB003727 | Uranium | — | — | API | Radioactive element |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | URANIUM | Uranium | — | — | Web | |

---

### Cobalt (Co)
**Canonical unit:** μg
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDA TDS | | | | | | CSV | |
| EFSA Occurrence | | | | | | CSV | |
| FDC | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| CNF | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| AFCD | ✓ | CO | Cobalt (Co) | μg | — | CSV | INFOODS: CO |
| CoFID | ✗ | — | — | — | — | CSV | Not in database |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in database |
| FOODfiles | ✓ | CO | Cobalt | μg | — | CSV | INFOODS: CO |
| Fineli | ✗ | — | — | — | — | CSV | Not in database |
| BLS | ✗ | — | — | — | — | CSV | Not in database |
| NEVO | ✗ | — | — | — | — | CSV | Not in database |
| Matvaretabellen | ✗ | — | — | — | — | API | Not in database |
| FRIDA | ✓ | 120 | Cobalt / Cobolt | μg | — | CSV | EuroFIR: CO |
| MEXT | ✗ | — | — | — | — | CSV | Not in database |
| KFCT | ✗ | — | — | — | — | CSV | Not in database |
| INDB | ✗ | — | — | — | — | CSV | Not in database |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in database |
| FooDB | ✓ | FDB003581 | Cobalt | — | — | API | Metal element |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | COBALT | Cobalt | — | — | Web | |

---

### Antimony (Sb)
**Canonical unit:** μg
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDA TDS | | | | | | CSV | |
| EFSA Occurrence | | | | | | CSV | |
| FDC | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| CNF | ✗ | — | — | — | — | API | Not tracked (contaminant) |
| AFCD | ✓ | SB | Antimony (Sb) | μg | — | CSV | INFOODS: SB |
| CoFID | ✗ | — | — | — | — | CSV | Not in database |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in database |
| FOODfiles | ✗ | — | — | — | — | CSV | Not in database |
| Fineli | ✗ | — | — | — | — | CSV | Not in database |
| BLS | ✗ | — | — | — | — | CSV | Not in database |
| NEVO | ✗ | — | — | — | — | CSV | Not in database |
| Matvaretabellen | ✗ | — | — | — | — | API | Not in database |
| FRIDA | ✗ | — | — | — | — | CSV | Not in database |
| MEXT | ✗ | — | — | — | — | CSV | Not in database |
| KFCT | ✗ | — | — | — | — | CSV | Not in database |
| INDB | ✗ | — | — | — | — | CSV | Not in database |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in database |
| FooDB | ✓ | FDB003762 | Antimony | — | — | API | Metalloid element |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | ANTIMONY | Antimony | — | — | Web | |

---

## Notes

- **Primary sources for contaminants:** FDA TDS and EFSA Occurrence data
- **Standard nutrition databases** (CNF, FDC, AFCD, etc.) typically do NOT include contaminant data
- **Arsenic forms matter:** Inorganic arsenic is carcinogenic, organic forms (in seafood) are less toxic
- **ALARA:** As Low As Reasonably Achievable - used for compounds with no safe threshold (Lead)
