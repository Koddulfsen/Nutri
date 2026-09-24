/**
 * Analyze FDC/USDA Nutrient Coverage
 *
 * Since FDC API times out, we'll use a well-documented list of standard FDC nutrients
 * based on USDA's nutrient database structure.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// FDC Standard Nutrient Numbers (from USDA FoodData Central documentation)
// https://fdc.nal.usda.gov/api-guide.html
const FDC_NUTRIENTS = {
  // Macronutrients
  1003: 'Protein',
  1004: 'Total lipid (fat)',
  1005: 'Carbohydrate, by difference',
  1007: 'Ash',
  1008: 'Energy',
  1050: 'Carbohydrate, by summation',
  1051: 'Water',
  1057: 'Caffeine',
  1058: 'Theobromine',

  // Fiber & Sugars
  1079: 'Fiber, total dietary',
  1082: 'Fiber, soluble',
  1084: 'Fiber, insoluble',
  1063: 'Sugars, total including NLEA',
  2000: 'Sugars, total',
  1010: 'Sucrose',
  1011: 'Glucose (dextrose)',
  1012: 'Fructose',
  1013: 'Lactose',
  1014: 'Maltose',
  1075: 'Galactose',

  // Minerals
  1087: 'Calcium, Ca',
  1089: 'Iron, Fe',
  1090: 'Magnesium, Mg',
  1091: 'Phosphorus, P',
  1092: 'Potassium, K',
  1093: 'Sodium, Na',
  1095: 'Zinc, Zn',
  1098: 'Copper, Cu',
  1101: 'Manganese, Mn',
  1103: 'Selenium, Se',
  1096: 'Chromium, Cr',
  1102: 'Molybdenum, Mo',
  1100: 'Iodine, I',
  1099: 'Fluoride, F',

  // Vitamins - A & Carotenoids
  1104: 'Vitamin A, IU',
  1105: 'Retinol',
  1106: 'Vitamin A, RAE',
  1107: 'Carotene, beta',
  1108: 'Carotene, alpha',
  1120: 'Cryptoxanthin, beta',
  1122: 'Lycopene',
  1123: 'Lutein + zeaxanthin',

  // Vitamins - E & K
  1109: 'Vitamin E (alpha-tocopherol)',
  1110: 'Vitamin E, added',
  1124: 'Tocopherol, beta',
  1125: 'Tocopherol, gamma',
  1126: 'Tocopherol, delta',
  1127: 'Tocotrienol, alpha',
  1128: 'Tocotrienol, beta',
  1129: 'Tocotrienol, gamma',
  1130: 'Tocotrienol, delta',
  1183: 'Vitamin K (phylloquinone)',
  1184: 'Vitamin K (Dihydrophylloquinone)',
  1185: 'Vitamin K (Menaquinone-4)',

  // Vitamins - D
  1114: 'Vitamin D (D2 + D3)',
  1111: 'Vitamin D2 (ergocalciferol)',
  1112: 'Vitamin D3 (cholecalciferol)',
  1113: 'Vitamin D',

  // Vitamins - C
  1162: 'Vitamin C, total ascorbic acid',
  1163: 'Vitamin C, reduced ascorbic acid',

  // Vitamins - B Complex
  1165: 'Thiamin',
  1166: 'Riboflavin',
  1167: 'Niacin',
  1170: 'Pantothenic acid',
  1175: 'Vitamin B-6',
  1176: 'Vitamin B-6, added',
  1177: 'Folate, total',
  1178: 'Vitamin B-12',
  1179: 'Vitamin B-12, added',
  1180: 'Folic acid',
  1186: 'Folate, food',
  1190: 'Folate, DFE',
  1191: 'Choline, total',
  1192: 'Choline, free',
  1194: 'Betaine',

  // Amino Acids
  1210: 'Tryptophan',
  1211: 'Threonine',
  1212: 'Isoleucine',
  1213: 'Leucine',
  1214: 'Lysine',
  1215: 'Methionine',
  1216: 'Cystine',
  1217: 'Phenylalanine',
  1218: 'Tyrosine',
  1219: 'Valine',
  1220: 'Arginine',
  1221: 'Histidine',
  1222: 'Alanine',
  1223: 'Aspartic acid',
  1224: 'Glutamic acid',
  1225: 'Glycine',
  1226: 'Proline',
  1227: 'Serine',
  1228: 'Hydroxyproline',
  1232: 'Cysteine',

  // Lipids - Cholesterol & Total Fats
  1253: 'Cholesterol',
  1258: 'Fatty acids, total saturated',
  1292: 'Fatty acids, total monounsaturated',
  1293: 'Fatty acids, total polyunsaturated',
  1257: 'Fatty acids, total trans',
  1259: 'Fatty acids, total trans-monoenoic',
  1261: 'Fatty acids, total trans-polyenoic',

  // Saturated Fatty Acids
  1260: '4:0',
  1262: '6:0',
  1263: '8:0',
  1264: '10:0',
  1265: '12:0',
  1266: '14:0',
  1267: '15:0',
  1268: '16:0',
  1269: '17:0',
  1270: '18:0',
  1271: '20:0',
  1272: '22:0',
  1273: '24:0',

  // Monounsaturated Fatty Acids
  1274: '14:1',
  1275: '15:1',
  1276: '16:1 undifferentiated',
  1277: '16:1 c',
  1278: '16:1 t',
  1279: '17:1',
  1280: '18:1 undifferentiated',
  1281: '18:1 c',
  1282: '18:1 t',
  1283: '18:1-11 t (18:1t n-7)',
  1285: '20:1',
  1286: '22:1 undifferentiated',
  1287: '22:1 c',
  1288: '22:1 t',
  1289: '24:1 c',

  // Polyunsaturated Fatty Acids
  1290: '18:2 undifferentiated',
  1291: '18:2 n-6 c,c',
  1310: '18:2 t,t',
  1311: '18:2 CLAs',
  1312: '18:2 t not further defined',
  1313: '18:3 undifferentiated',
  1314: '18:3 n-3 c,c,c (ALA)',
  1315: '18:3 n-6 c,c,c',
  1316: '18:3i',
  1317: '18:4',
  1321: '20:2 n-6 c,c',
  1323: '20:3 undifferentiated',
  1325: '20:3 n-3',
  1326: '20:3 n-6',
  1327: '20:4 undifferentiated',
  1328: '20:4 n-6',
  1329: '20:5 n-3 (EPA)',
  1330: '22:4',
  1331: '22:5 n-3 (DPA)',
  1332: '22:6 n-3 (DHA)',
  1333: 'Fatty acids, total trans-dienoic',
  1404: '18:2 conjugated linoleic acid',
};

async function main() {
  console.log('🔍 Analyzing FDC nutrient coverage...\n');
  console.log(`Total FDC nutrients to map: ${Object.keys(FDC_NUTRIENTS).length}\n`);

  // Get all compounds
  const { data: compounds } = await supabase
    .from('compounds')
    .select('id, name, alternate_names');

  const compoundMap = new Map<string, any>();
  for (const compound of compounds || []) {
    compoundMap.set(compound.name.toLowerCase(), compound);
    if (compound.alternate_names) {
      for (const altName of compound.alternate_names) {
        compoundMap.set(altName.toLowerCase(), compound);
      }
    }
  }

  // Check existing FDC mappings
  const { data: existingMappings } = await supabase
    .from('compound_sources')
    .select('external_id')
    .eq('external_source', 'FDC');

  const existingSet = new Set(existingMappings?.map(m => m.external_id) || []);

  console.log(`Existing FDC mappings: ${existingSet.size}\n`);
  console.log('========================================');
  console.log('FDC NUTRIENTS');
  console.log('========================================\n');

  let found = 0;
  let missing = 0;
  const missingList: Array<{ id: number; name: string }> = [];

  for (const [id, name] of Object.entries(FDC_NUTRIENTS)) {
    const alreadyMapped = existingSet.has(id);
    const status = alreadyMapped ? '✓ (mapped)' : '';

    console.log(`${id.padStart(4)}: ${name} ${status}`);

    if (!alreadyMapped) {
      // Try to find matching compound
      const compoundMatch = compoundMap.get(name.toLowerCase());
      if (compoundMatch) {
        found++;
      } else {
        missing++;
        missingList.push({ id: parseInt(id), name });
      }
    }
  }

  console.log('\n========================================');
  console.log('COVERAGE ANALYSIS');
  console.log('========================================');
  console.log(`Already mapped: ${existingSet.size}`);
  console.log(`Can be mapped: ${found}`);
  console.log(`Missing compounds: ${missing}`);

  if (missingList.length > 0) {
    console.log('\n⚠️  Missing Compounds:');
    missingList.forEach(item => {
      console.log(`  ${item.id}: ${item.name}`);
    });
  }

  console.log(`\n📊 Potential FDC coverage: ${Object.keys(FDC_NUTRIENTS).length} nutrients`);
}

main().catch(console.error);
