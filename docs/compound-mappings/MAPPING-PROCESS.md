# Compound Mapping - Quick Reference

How to find a compound in each source. Replace `{compound}` with search term.

## Workflow

**ONE COMPOUND AT A TIME - 18 TASKS PER COMPOUND - SEQUENTIAL EXECUTION**

⚠️ **CRITICAL: THOROUGHNESS > SPEED** ⚠️
- Execute ONE task at a time
- NEVER run tasks in parallel
- Complete each task fully before starting the next
- Quality of mapping is more important than speed

1. Pick ONE compound (e.g., "Histidine")
2. Create 18 tasks with the **exact search method in the task description** (see Task Templates below)
3. Execute task #1, search with regional name variations
4. Update the mapping table row for that source
5. Mark task #1 complete
6. Execute task #2, search with regional name variations
7. Repeat steps 4-6 for ALL 18 tasks
8. After all 18 tasks done, mark compound ✅ Complete
9. Move to NEXT compound, repeat

## Task Templates

**Copy these exactly when creating tasks. Replace {compound} with the compound name.**

⚠️ **EXECUTE SEQUENTIALLY - ONE AT A TIME - NEVER IN PARALLEL** ⚠️

```
Task 1:  {compound} - FDC | WebSearch: "USDA FDC {compound} nutrient ID" | Search with regional name variations
Task 2:  {compound} - CNF | WebSearch: "Canada CNF {compound} nutrient ID" | Search with regional name variations
Task 3:  {compound} - AFCD | Grep: /home/kodd/Nutri/data/afcd/nutrient-list.json | Search with regional name variations
Task 4:  {compound} - CoFID | Grep: /home/kodd/Nutri/data/uk-cofid/nutrients.json | Search with regional name variations
Task 5:  {compound} - CIQUAL | Grep: /home/kodd/Nutri/data/ciqual/nutrients.json | Search with regional name variations
Task 6:  {compound} - FOODfiles | Grep: /home/kodd/Nutri/data/foodfiles/extracted/foodfiles-codes.json | Search with regional name variations
Task 7:  {compound} - Fineli | Grep: /home/kodd/Nutri/data/fineli/component.csv | Search with regional name variations
Task 8:  {compound} - BLS | Grep: /home/kodd/Nutri/data/bls/nutrients.json | Search with regional name variations
Task 9:  {compound} - NEVO | Grep: /home/kodd/Nutri/data/nevo/NEVO2025_v9.0_Nutrienten_Nutrients.csv | Search with regional name variations
Task 10: {compound} - Matvaretabellen | Grep: /home/kodd/Nutri/data/matvaretabellen/nutrients.json | Search with regional name variations
Task 11: {compound} - FRIDA | Grep: /home/kodd/Nutri/data/frida/nutrients.json | Search with regional name variations
Task 12: {compound} - MEXT | Grep: /home/kodd/Nutri/data/mext/nutrients.json | Search with regional name variations
Task 13: {compound} - KFCT | Grep: /home/kodd/Nutri/data/kfct/nutrients.json | Search with regional name variations
Task 14: {compound} - INDB | Grep: /home/kodd/Nutri/data/indb/nutrients.json | Search with regional name variations
Task 15: {compound} - ASEANFOODS | Grep: /home/kodd/Nutri/data/aseanfoods/nutrients.json | Search with regional name variations
Task 16: {compound} - FooDB | Grep: /home/kodd/Nutri/data/foodb/foodb_2020_04_07_csv/Nutrient.csv | Search with regional name variations
Task 17: {compound} - Phenol-Explorer | Grep: /home/kodd/Nutri/data/phenol-explorer/compounds.csv | Search with regional name variations
Task 18: {compound} - Duke's | Grep: /home/kodd/Nutri/data/duke/CHEMICALS.csv | Search with regional name variations
```

**Search terms to use:** English name + INFOODS code + local language (see Multi-Language table)

## Multi-Language Search Terms

**Always search both English AND local names for these sources:**

| Source | Language | Example (Histidine) |
|--------|----------|---------------------|
| MEXT | Japanese | ヒスチジン |
| KFCT | Korean | 히스티딘 |
| BLS | German | Histidin |
| CIQUAL | French | Histidine |
| FRIDA | Danish | Histidin |
| NEVO | Dutch | Histidine |
| Matvaretabellen | Norwegian | Histidin |
| Fineli | Finnish | Histidiini |

**Tip:** Also search by INFOODS/EuroFIR codes (HIS, PROT, FAT, etc.) - these are standardized across databases.

## Local Files (grep)

```bash
# 1. FDC (USA) - use web search, IDs like 1051
# 2. CNF (Canada) - use web search, IDs like 255

# 3. AFCD (Australia) - column names
grep -i "{compound}" /home/kodd/Nutri/data/afcd/nutrient-list.json

# 4. CoFID (UK) - column names with units
grep -i "{compound}" /home/kodd/Nutri/data/uk-cofid/nutrients.json

# 5. CIQUAL (France) - numeric ID + INFOODS
grep -i "{compound}" /home/kodd/Nutri/data/ciqual/nutrients.json

# 6. FOODfiles (NZ) - INFOODS tagnames
grep -i "{compound}" /home/kodd/Nutri/data/foodfiles/extracted/foodfiles-codes.json

# 7. Fineli (Finland) - EuroFIR codes
grep -i "{compound}" /home/kodd/Nutri/data/fineli/component.csv

# 8. BLS (Germany) - short codes
grep -i "{compound}" /home/kodd/Nutri/data/bls/nutrients.json

# 9. NEVO (Netherlands) - EuroFIR codes
grep -i "{compound}" /home/kodd/Nutri/data/nevo/NEVO2025_v9.0_Nutrienten_Nutrients.csv

# 10. Matvaretabellen (Norway) - nutrientId + EuroFIR
grep -i "{compound}" /home/kodd/Nutri/data/matvaretabellen/nutrients.json

# 11. FRIDA (Denmark) - numeric ID + EuroFIR
grep -i "{compound}" /home/kodd/Nutri/data/frida/nutrients.json

# 12. MEXT (Japan) - column index, Japanese names
grep -i "{compound}" /home/kodd/Nutri/data/mext/nutrients.json

# 13. KFCT (Korea) - INFOODS tagnames, Korean names
grep -i "{compound}" /home/kodd/Nutri/data/kfct/nutrients.json

# 14. INDB (India) - column names (limited nutrients)
grep -i "{compound}" /home/kodd/Nutri/data/indb/nutrients.json

# 15. ASEANFOODS - INFOODS tagnames
grep -i "{compound}" /home/kodd/Nutri/data/aseanfoods/nutrients.json

# 16. FooDB - basic nutrients only
grep -i "{compound}" /home/kodd/Nutri/data/foodb/foodb_2020_04_07_csv/Nutrient.csv

# 17. Phenol-Explorer - POLYPHENOLS ONLY
grep -i "{compound}" /home/kodd/Nutri/data/phenol-explorer/compounds.csv

# 18. Duke's - PHYTOCHEMICALS ONLY
grep -i "{compound}" /home/kodd/Nutri/data/duke/CHEMICALS.csv
```

## Web Search (FDC & CNF)

For FDC: search "USDA FDC {compound} nutrient ID"
For CNF: search "Canada CNF {compound} nutrient ID"

## Known IDs

| Compound | FDC | CNF | EuroFIR/INFOODS |
|----------|-----|-----|-----------------|
| Energy (kcal) | 1008 | 208 | ENERC |
| Energy (kJ) | 1062 | - | ENERKJ |
| Water | 1051 | 255 | WATER |
| Protein | 1003 | 203 | PROT |
| Fat | 1004 | 204 | FAT |
| Carbohydrate | 1005 | 205 | CHO |
| Fiber | 1079 | 291 | FIBT |

## Notes

- **AFCD**: Uses column names like "Moisture", "Energy, with dietary fibre"
- **CoFID**: Column names with units like "Water (g)", "Energy (kcal)"
- **MEXT**: Japanese names - Water=水分, Energy=エネルギー, Protein=たんぱく質
- **KFCT**: Korean names - Water=수분, uses INFOODS tagnames
- **ASEANFOODS**: Uses INFOODS tagnames (21 nutrients only)
- **INDB**: Limited - no water, basic macros + vitamins/minerals only
- **FooDB**: Has Energy but no Water
- **Phenol-Explorer**: Polyphenols only - mark basic nutrients N/A
- **Duke's**: Phytochemicals only - mark basic nutrients N/A

## Unit Conversions

| From | To | Multiply |
|------|-----|----------|
| kJ | kcal | 0.239 |
| mg | g | 0.001 |
| µg | mg | 0.001 |
