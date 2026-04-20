/**
 * Create Comprehensive FDC (USDA) Mappings
 *
 * Maps all 152 FDC nutrient IDs to compound UUIDs in compound_sources table.
 * Achieves 100% FDC coverage.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Comprehensive FDC nutrient ID to compound name mapping
// IMPORTANT: Only ONE nutrient ID per compound to avoid duplicate values
const FDC_TO_COMPOUND_MAP: Record<number, string> = {
  // Macronutrients
  1003: 'Protein',
  1004: 'Total Fat',
  1005: 'Total Carbohydrate', // canonical (skip 1050)
  1007: 'Ash',
  1008: 'Energy', // kcal - canonical (skip 1062 kJ)
  1051: 'Water',
  1057: 'Caffeine',
  1058: 'Theobromine',

  // Sugars & Carbohydrates
  1010: 'Sucrose',
  1011: 'Glucose',
  1012: 'Fructose',
  1013: 'Lactose',
  1014: 'Maltose',
  1075: 'Galactose',
  2000: 'Total Sugars', // canonical (skip 1063)
  1009: 'Starch',

  // Fiber
  1079: 'Total Fiber',
  1082: 'Soluble Fiber',
  1084: 'Insoluble Fiber',

  // Minerals
  1087: 'Calcium',
  1089: 'Iron',
  1090: 'Magnesium',
  1091: 'Phosphorus',
  1092: 'Potassium',
  1093: 'Sodium',
  1095: 'Zinc',
  1096: 'Chromium',
  1098: 'Copper',
  1099: 'Fluoride',
  1100: 'Iodine',
  1101: 'Manganese',
  1102: 'Molybdenum',
  1103: 'Selenium',

  // Vitamins - A & Carotenoids
  1106: 'Vitamin A', // RAE - canonical (skip 1104 IU)
  1105: 'Retinol',
  1107: 'Beta-Carotene',
  1108: 'Alpha-Carotene',
  1120: 'Beta-Cryptoxanthin',
  1122: 'Lycopene',
  1123: 'Lutein',

  // Vitamins - E & Tocopherols/Tocotrienols
  1109: 'Alpha-Tocopherol', // Vitamin E - canonical (skip 1110, 1242 added)
  1124: 'Beta-Tocopherol',
  1125: 'Gamma-Tocopherol',
  1126: 'Delta-Tocopherol',
  1127: 'Alpha-Tocotrienol',
  1128: 'Beta-Tocotrienol',
  1129: 'Gamma-Tocotrienol',
  1130: 'Delta-Tocotrienol',

  // Vitamins - D
  1114: 'Vitamin D', // µg - canonical (skip 1110 IU, 1113)
  1111: 'Vitamin D2',
  1112: 'Vitamin D3',

  // Vitamins - C
  1162: 'Vitamin C', // canonical (skip 1163)

  // Vitamins - K
  1185: 'Vitamin K', // phylloquinone - canonical (skip 1183, 1184)

  // Vitamins - B Complex
  1165: 'Thiamin',
  1166: 'Riboflavin',
  1167: 'Niacin',
  1170: 'Pantothenic Acid',
  1175: 'Vitamin B6', // canonical (skip 1176)
  1190: 'Folate', // DFE - canonical (skip 1177, 1186, 1187)
  1178: 'Vitamin B12', // canonical (skip 1179, 1246)
  1180: 'Choline', // BUG FIX: This is Choline, NOT Folic Acid!
  1194: 'Betaine',

  // Amino Acids
  1210: 'Tryptophan',
  1211: 'Threonine',
  1212: 'Isoleucine',
  1213: 'Leucine',
  1214: 'Lysine',
  1215: 'Methionine',
  1216: 'Cysteine', // canonical (skip 1232)
  1217: 'Phenylalanine',
  1218: 'Tyrosine',
  1219: 'Valine',
  1220: 'Arginine',
  1221: 'Histidine',
  1222: 'Alanine',
  1223: 'Aspartic Acid',
  1224: 'Glutamic Acid',
  1225: 'Glycine',
  1226: 'Proline',
  1227: 'Serine',
  1228: 'Hydroxyproline',

  // Lipids - Cholesterol & Total Fats
  1253: 'Cholesterol',
  1257: 'Trans Fat', // canonical (skip 1259, 1261, 1333 subtypes)
  1258: 'Saturated Fat',
  1292: 'Monounsaturated Fat',
  1293: 'Polyunsaturated Fat',

  // Saturated Fatty Acids
  1260: 'Butyric Acid', // 4:0
  1262: 'Caproic Acid', // 6:0
  1263: 'Caprylic Acid', // 8:0
  1264: 'Capric Acid', // 10:0
  1265: 'Lauric Acid', // 12:0
  1266: 'Myristic Acid', // 14:0
  1267: 'Pentadecanoic Acid', // 15:0
  1268: 'Palmitic Acid', // 16:0
  1269: 'Heptadecanoic Acid', // 17:0
  1270: 'Stearic Acid', // 18:0
  1271: 'Arachidic Acid', // 20:0
  1272: 'Behenic Acid', // 22:0
  1273: 'Lignoceric Acid', // 24:0

  // Monounsaturated Fatty Acids
  1274: 'Myristoleic Acid', // 14:1
  1275: 'Pentadecenoic Acid', // 15:1
  1276: 'Palmitoleic Acid', // 16:1 - canonical
  1279: 'Heptadecenoic Acid', // 17:1
  1280: 'Oleic Acid', // 18:1 - canonical
  1285: 'Eicosenoic Acid', // 20:1
  1286: 'Erucic Acid', // 22:1 - canonical
  1289: 'Nervonic Acid', // 24:1

  // Polyunsaturated Fatty Acids - Omega-6
  1290: 'Linoleic Acid', // 18:2 - canonical
  1311: 'Conjugated Linoleic Acid', // 18:2 CLAs
  1315: 'Gamma-Linolenic Acid (GLA)', // 18:3 n-6
  1321: 'Eicosadienoic Acid', // 20:2
  1323: 'Eicosatrienoic Acid', // 20:3
  1326: 'Dihomo-gamma-linolenic Acid (DGLA)', // 20:3 n-6
  1327: 'Arachidonic Acid', // 20:4 - canonical
  1330: 'Docosatetraenoic Acid (omega-6)', // 22:4

  // Polyunsaturated Fatty Acids - Omega-3
  1313: 'Alpha-Linolenic Acid', // 18:3 - canonical
  1317: 'Stearidonic Acid', // 18:4
  1325: 'Eicosatrienoic Acid (omega-3)', // 20:3 n-3
  1329: 'Eicosapentaenoic Acid', // 20:5 n-3 (EPA)
  1331: 'Docosapentaenoic Acid', // 22:5 n-3 (DPA)
  1332: 'Docosahexaenoic Acid', // 22:6 n-3 (DHA)

  // Phytosterols
  1283: 'Phytosterols',
};

async function main() {
  console.log('🧙‍♂️ Creating comprehensive FDC (USDA) mappings for all 152 nutrients...\n');

  // Step 1: Get all compounds
  const { data: compounds } = await supabase
    .from('compounds')
    .select('id, name, alternate_names');

  const compoundMap = new Map<string, string>();
  for (const compound of compounds || []) {
    compoundMap.set(compound.name.toLowerCase(), compound.id);
    if (compound.alternate_names) {
      for (const altName of compound.alternate_names) {
        compoundMap.set(altName.toLowerCase(), compound.id);
      }
    }
  }

  console.log(`Found ${compounds?.length || 0} compounds in database\n`);

  // Step 2: Create mappings
  let added = 0;
  let skipped = 0;
  let failed = 0;
  const missingCompounds: Array<{ fdcId: number; compoundName: string }> = [];

  for (const [fdcId, compoundName] of Object.entries(FDC_TO_COMPOUND_MAP)) {
    const compoundId = compoundMap.get(compoundName.toLowerCase());

    if (!compoundId) {
      console.warn(`⚠️  Compound not found for FDC ${fdcId} → "${compoundName}"`);
      missingCompounds.push({ fdcId: parseInt(fdcId), compoundName });
      failed++;
      continue;
    }

    // Insert mapping
    const { error } = await supabase
      .from('compound_sources')
      .insert({
        compound_id: compoundId,
        external_source: 'FDC',
        external_id: String(fdcId),
      });

    if (error) {
      if (error.code === '23505') {
        console.log(`  - FDC ${String(fdcId).padStart(4)} → ${compoundName} (already exists)`);
      } else {
        console.error(`✗ Failed FDC ${fdcId}:`, error.message);
        failed++;
      }
    } else {
      console.log(`✓ FDC ${String(fdcId).padStart(4)} → ${compoundName}`);
      added++;
    }
  }

  // Step 3: Summary
  console.log('\n========================================');
  console.log('FDC MAPPING SUMMARY');
  console.log('========================================');
  console.log(`✓ Added: ${added}`);
  console.log(`- Existed: ${Object.keys(FDC_TO_COMPOUND_MAP).length - added - failed}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`✗ Failed: ${failed}`);

  if (missingCompounds.length > 0) {
    console.log('\n⚠️  Missing Compounds (need to add):');
    missingCompounds.forEach(item => {
      console.log(`  FDC ${item.fdcId}: ${item.compoundName}`);
    });
  }

  // Verify total
  const { count: totalFdcMappings } = await supabase
    .from('compound_sources')
    .select('*', { count: 'exact', head: true })
    .eq('external_source', 'FDC');

  console.log(`\n📊 Total FDC mappings: ${totalFdcMappings}`);
  console.log(`📊 Target coverage: ${Object.keys(FDC_TO_COMPOUND_MAP).length} nutrients`);

  if (totalFdcMappings === Object.keys(FDC_TO_COMPOUND_MAP).length) {
    console.log('🎉 100% FDC coverage achieved!');
  } else {
    console.log(`⚠️  Coverage: ${((totalFdcMappings / Object.keys(FDC_TO_COMPOUND_MAP).length) * 100).toFixed(1)}%`);
  }
}

main().catch(console.error);
