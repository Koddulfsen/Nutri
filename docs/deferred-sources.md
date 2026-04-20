# Deferred Data Sources

**Purpose**: Track nutrition databases deferred for future integration
**Status**: Using CNF + USDA only (Phase 1)
**Updated**: 2025-11-18

---

## ⏸️ Deferred Sources

### 1. FooDB (Phytochemicals Database)

**Status**: ⏸️ **Client built, integration deferred**

**Reason**: License concern
- License: CC BY-NC 4.0 (Non-Commercial)
- Commercial use requires explicit permission
- Seeding database = redistribution = requires license

**Next Steps**:
1. Request commercial license from: shhan@ualberta.ca
2. If approved → integrate with existing client
3. If denied → use API dynamically (fetch, don't store)

**Client Location**: `/lib/services/foodb-client.ts` ✅ Ready to use

**What we're missing without FooDB**:
- 28,000+ phytochemicals
- Flavonoids, polyphenols
- Chemical composition data
- BUT: CNF + USDA still cover basic nutrients well!

---

### 2. AFCD (Australian Food Composition Database)

**Status**: 📥 **Downloadable, not yet imported**

**Why valuable**:
- **256 nutrients** (highest count of any source!)
- Government-verified
- CC BY-SA 3.0 license (✅ commercial allowed with attribution)

**Why deferred**:
- No API - must download CSV and import
- 1,616 foods (smaller than CNF/USDA)
- Regional focus (Australian foods)

**Integration effort**: Medium
- Download CSV from FSANZ
- Parse and import to database
- Map nutrients to standard names
- Create food_sources mappings

**Priority**: Phase 2 (after core multi-source system working)

---

### 3. CoFID (UK McCance & Widdowson)

**Status**: 📥 **Downloadable, not yet imported**

**Why valuable**:
- 3,000+ UK foods
- Government database
- Open Government Licence v3 (✅ commercial allowed)
- Well-maintained (2021 version)

**Why deferred**:
- No API - must download from GOV.UK
- Overlap with USDA/CNF for common foods
- UK-specific foods may not match North American diet

**Integration effort**: Medium
- Download from GOV.UK
- Parse format (likely Excel/CSV)
- Import and map nutrients
- Create food_sources mappings

**Priority**: Phase 3 (nice to have, but not critical)

---

## ✅ Current Active Sources (Phase 1)

### 1. CNF (Canadian Nutrient File)
- **Status**: ✅ Fully integrated
- **Foods**: 5,690 whole foods
- **Nutrients**: 152 nutrients in 7 groups
- **API**: Free, unlimited
- **License**: Public domain
- **Client**: `/lib/services/cnf-client.ts`

### 2. USDA FoodData Central (FDC)
- **Status**: ✅ Fully integrated
- **Foods**: 7,793+ whole foods (Foundation + SR Legacy)
- **Nutrients**: Up to 150 components
- **API**: Free (1,000 req/hr)
- **License**: Public domain (CC0)
- **Client**: `/lib/services/usda-client.ts`

**Combined Coverage**: ~13,000+ unique whole foods, 150+ nutrients

---

## 🎯 Integration Priority

**Phase 1 (Current)**: CNF + USDA ✅
- Build multi-source system
- Get core functionality working
- Zero legal risk

**Phase 2 (Next 3-6 months)**:
- AFCD import (256 nutrients = great for extended coverage)
- FooDB integration (if license approved)

**Phase 3 (Future)**:
- CoFID import (UK foods)
- Additional regional databases as needed

---

## 📝 Notes

### Why CNF + USDA is Enough for Now

1. **Coverage**: 13,000+ foods covers most common items
2. **Nutrients**: 150+ nutrients covers standard macro/micro needs
3. **Legal**: 100% public domain, zero restrictions
4. **API**: Both have free APIs (CNF unlimited, USDA 1,000/hr)
5. **Quality**: Government-verified data

### Missing Compounds (vs FooDB)

Without FooDB, we don't have extensive data on:
- Specific flavonoids (quercetin, kaempferol, etc.)
- Polyphenols (resveratrol, curcumin, etc.)
- Carotenoid breakdown (beyond beta-carotene)
- Alkaloids, terpenes, phenolic acids

**Workaround**: CNF + USDA still have:
- Major vitamins/minerals
- Basic carotenoids (beta-carotene, lycopene)
- Major polyphenols (where tested)
- Complete amino acid profiles
- Detailed fatty acid breakdowns

**Good enough for Phase 1!**

---

## 🔄 Review Schedule

**Quarterly Review**: Re-evaluate deferred sources
- Q1 2025: Check FooDB license status
- Q2 2025: Assess AFCD import value
- Q3 2025: Consider CoFID if user demand

**Trigger for activation**:
- User requests specific nutrients only in deferred source
- Commercial license approved
- Community contributes import script

---

**Last Updated**: 2025-11-18
**Current Focus**: Build multi-source system with CNF + USDA
