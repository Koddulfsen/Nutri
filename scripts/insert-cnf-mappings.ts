/**
 * Insert CNF Mappings into compound_sources
 *
 * Inserts all 152 CNF nutrient ID mappings to Nutri compounds.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CNFMapping {
  cnfId: string;
  cnfName: string;
  cnfUnit: string;
  nutriCompound: string;
  isCanonical: boolean;
  conversionFactor?: string; // For unit conversions (e.g., kJ to kcal)
}

const cnfMappings: CNFMapping[] = [
  // Category 1: Macronutrients & Energy
  { cnfId: '203', cnfName: 'Protein', cnfUnit: 'g', nutriCompound: 'Protein', isCanonical: true },
  { cnfId: '204', cnfName: 'Total Fat', cnfUnit: 'g', nutriCompound: 'Total Fat', isCanonical: true },
  { cnfId: '205', cnfName: 'Carbohydrate', cnfUnit: 'g', nutriCompound: 'Total Carbohydrate', isCanonical: true },
  { cnfId: '207', cnfName: 'Ash', cnfUnit: 'g', nutriCompound: 'Ash', isCanonical: true },
  { cnfId: '208', cnfName: 'Energy (kcal)', cnfUnit: 'kCal', nutriCompound: 'Energy', isCanonical: true },
  { cnfId: '268', cnfName: 'Energy (kJ)', cnfUnit: 'kJ', nutriCompound: 'Energy', isCanonical: false, conversionFactor: '0.239006' },

  // Category 2: Sugars & Carbohydrates
  { cnfId: '210', cnfName: 'Sucrose', cnfUnit: 'g', nutriCompound: 'Sucrose', isCanonical: true },
  { cnfId: '211', cnfName: 'Glucose', cnfUnit: 'g', nutriCompound: 'Glucose', isCanonical: true },
  { cnfId: '212', cnfName: 'Fructose', cnfUnit: 'g', nutriCompound: 'Fructose', isCanonical: true },
  { cnfId: '213', cnfName: 'Lactose', cnfUnit: 'g', nutriCompound: 'Lactose', isCanonical: true },
  { cnfId: '214', cnfName: 'Maltose', cnfUnit: 'g', nutriCompound: 'Maltose', isCanonical: true },
  { cnfId: '269', cnfName: 'Sugars, total', cnfUnit: 'g', nutriCompound: 'Total Sugars', isCanonical: true },
  { cnfId: '287', cnfName: 'Galactose', cnfUnit: 'g', nutriCompound: 'Galactose', isCanonical: true },
  { cnfId: '291', cnfName: 'Fibre, total dietary', cnfUnit: 'g', nutriCompound: 'Total Fiber', isCanonical: true },
  { cnfId: '802', cnfName: 'Total monosaccharides', cnfUnit: 'g', nutriCompound: 'Total Monosaccharides', isCanonical: true },
  { cnfId: '803', cnfName: 'Total disaccharides', cnfUnit: 'g', nutriCompound: 'Total Disaccharides', isCanonical: true },
  { cnfId: '810', cnfName: 'Starch', cnfUnit: 'g', nutriCompound: 'Starch', isCanonical: true },
  { cnfId: '255', cnfName: 'Moisture', cnfUnit: 'g', nutriCompound: 'Water', isCanonical: true },
  { cnfId: '221', cnfName: 'Alcohol', cnfUnit: 'g', nutriCompound: 'Alcohol', isCanonical: true },

  // Category 3: Other Compounds
  { cnfId: '245', cnfName: 'Oxalic Acid', cnfUnit: 'mg', nutriCompound: 'Oxalic Acid', isCanonical: true },
  { cnfId: '260', cnfName: 'Mannitol', cnfUnit: 'g', nutriCompound: 'Mannitol', isCanonical: true },
  { cnfId: '261', cnfName: 'Sorbitol', cnfUnit: 'g', nutriCompound: 'Sorbitol', isCanonical: true },
  { cnfId: '262', cnfName: 'Caffeine', cnfUnit: 'mg', nutriCompound: 'Caffeine', isCanonical: true },
  { cnfId: '263', cnfName: 'Theobromine', cnfUnit: 'mg', nutriCompound: 'Theobromine', isCanonical: true },
  { cnfId: '550', cnfName: 'Aspartame', cnfUnit: 'mg', nutriCompound: 'Aspartame', isCanonical: true },

  // Category 4: Minerals
  { cnfId: '301', cnfName: 'Calcium, Ca', cnfUnit: 'mg', nutriCompound: 'Calcium', isCanonical: true },
  { cnfId: '303', cnfName: 'Iron, Fe', cnfUnit: 'mg', nutriCompound: 'Iron', isCanonical: true },
  { cnfId: '304', cnfName: 'Magnesium, Mg', cnfUnit: 'mg', nutriCompound: 'Magnesium', isCanonical: true },
  { cnfId: '305', cnfName: 'Phosphorus, P', cnfUnit: 'mg', nutriCompound: 'Phosphorus', isCanonical: true },
  { cnfId: '306', cnfName: 'Potassium, K', cnfUnit: 'mg', nutriCompound: 'Potassium', isCanonical: true },
  { cnfId: '307', cnfName: 'Sodium, Na', cnfUnit: 'mg', nutriCompound: 'Sodium', isCanonical: true },
  { cnfId: '309', cnfName: 'Zinc, Zn', cnfUnit: 'mg', nutriCompound: 'Zinc', isCanonical: true },
  { cnfId: '312', cnfName: 'Copper, Cu', cnfUnit: 'mg', nutriCompound: 'Copper', isCanonical: true },
  { cnfId: '315', cnfName: 'Manganese, Mn', cnfUnit: 'mg', nutriCompound: 'Manganese', isCanonical: true },
  { cnfId: '317', cnfName: 'Selenium, Se', cnfUnit: 'µg', nutriCompound: 'Selenium', isCanonical: true },

  // Category 5: Vitamins - A & Carotenoids
  { cnfId: '319', cnfName: 'Retinol', cnfUnit: 'µg', nutriCompound: 'Retinol', isCanonical: true },
  { cnfId: '321', cnfName: 'Beta carotene', cnfUnit: 'µg', nutriCompound: 'Beta-Carotene', isCanonical: true },
  { cnfId: '814', cnfName: 'Retinol activity equivalents, RAE', cnfUnit: 'µg', nutriCompound: 'Vitamin A', isCanonical: true },
  { cnfId: '834', cnfName: 'Alpha carotene', cnfUnit: 'µg', nutriCompound: 'Alpha-Carotene', isCanonical: true },
  { cnfId: '835', cnfName: 'Beta cryptoxanthin', cnfUnit: 'µg', nutriCompound: 'Beta-Cryptoxanthin', isCanonical: true },
  { cnfId: '836', cnfName: 'Lycopene', cnfUnit: 'µg', nutriCompound: 'Lycopene', isCanonical: true },
  { cnfId: '837', cnfName: 'Lutein and zeaxanthin', cnfUnit: 'µg', nutriCompound: 'Lutein', isCanonical: true },

  // Category 6: Vitamins - D
  { cnfId: '324', cnfName: 'Vitamin D (IU)', cnfUnit: 'IU', nutriCompound: 'Vitamin D', isCanonical: false, conversionFactor: '0.025' },
  { cnfId: '339', cnfName: 'Vitamin D', cnfUnit: 'µg', nutriCompound: 'Vitamin D', isCanonical: true },
  { cnfId: '876', cnfName: 'Vitamin D2 (ergocalciferol)', cnfUnit: 'µg', nutriCompound: 'Vitamin D2', isCanonical: true },

  // Category 7: Vitamins - E / Tocopherols
  { cnfId: '323', cnfName: 'Tocopherol, alpha', cnfUnit: 'mg', nutriCompound: 'Alpha-Tocopherol', isCanonical: true },
  { cnfId: '811', cnfName: 'Tocopherol, beta', cnfUnit: 'mg', nutriCompound: 'Beta-Tocopherol', isCanonical: true },
  { cnfId: '812', cnfName: 'Tocopherol, gamma', cnfUnit: 'mg', nutriCompound: 'Gamma-Tocopherol', isCanonical: true },
  { cnfId: '813', cnfName: 'Tocopherol, delta', cnfUnit: 'mg', nutriCompound: 'Delta-Tocopherol', isCanonical: true },
  { cnfId: '875', cnfName: 'Alpha-tocopherol, added', cnfUnit: 'mg', nutriCompound: 'Alpha-Tocopherol', isCanonical: false },

  // Category 8: Vitamins - C & K
  { cnfId: '401', cnfName: 'Vitamin C', cnfUnit: 'mg', nutriCompound: 'Vitamin C', isCanonical: true },
  { cnfId: '430', cnfName: 'Vitamin K', cnfUnit: 'µg', nutriCompound: 'Vitamin K', isCanonical: true },

  // Category 9: Vitamins - B Complex
  { cnfId: '404', cnfName: 'Thiamin', cnfUnit: 'mg', nutriCompound: 'Thiamin', isCanonical: true },
  { cnfId: '405', cnfName: 'Riboflavin', cnfUnit: 'mg', nutriCompound: 'Riboflavin', isCanonical: true },
  { cnfId: '406', cnfName: 'Niacin', cnfUnit: 'mg', nutriCompound: 'Niacin', isCanonical: true },
  { cnfId: '409', cnfName: 'Niacin equivalents', cnfUnit: 'NE', nutriCompound: 'Niacin', isCanonical: false },
  { cnfId: '410', cnfName: 'Pantothenic acid', cnfUnit: 'mg', nutriCompound: 'Pantothenic Acid', isCanonical: true },
  { cnfId: '415', cnfName: 'Vitamin B-6', cnfUnit: 'mg', nutriCompound: 'Vitamin B6', isCanonical: true },
  { cnfId: '416', cnfName: 'Biotin', cnfUnit: 'µg', nutriCompound: 'Biotin', isCanonical: true },
  { cnfId: '417', cnfName: 'Folacin, total', cnfUnit: 'µg', nutriCompound: 'Folate', isCanonical: false },
  { cnfId: '418', cnfName: 'Vitamin B-12', cnfUnit: 'µg', nutriCompound: 'Vitamin B12', isCanonical: true },
  { cnfId: '431', cnfName: 'Folic acid, synthetic form', cnfUnit: 'µg', nutriCompound: 'Folate', isCanonical: false },
  { cnfId: '806', cnfName: 'Folate, naturally occurring', cnfUnit: 'µg', nutriCompound: 'Folate', isCanonical: false },
  { cnfId: '815', cnfName: 'Dietary folate equivalents, DFE', cnfUnit: 'µg', nutriCompound: 'Folate', isCanonical: true },
  { cnfId: '862', cnfName: 'Choline, total', cnfUnit: 'mg', nutriCompound: 'Choline', isCanonical: true },
  { cnfId: '863', cnfName: 'Betaine', cnfUnit: 'mg', nutriCompound: 'Betaine', isCanonical: true },
  { cnfId: '874', cnfName: 'Vitamin B-12, added', cnfUnit: 'µg', nutriCompound: 'Vitamin B12', isCanonical: false },

  // Category 10: Amino Acids
  { cnfId: '501', cnfName: 'Tryptophan', cnfUnit: 'g', nutriCompound: 'Tryptophan', isCanonical: true },
  { cnfId: '502', cnfName: 'Threonine', cnfUnit: 'g', nutriCompound: 'Threonine', isCanonical: true },
  { cnfId: '503', cnfName: 'Isoleucine', cnfUnit: 'g', nutriCompound: 'Isoleucine', isCanonical: true },
  { cnfId: '504', cnfName: 'Leucine', cnfUnit: 'g', nutriCompound: 'Leucine', isCanonical: true },
  { cnfId: '505', cnfName: 'Lysine', cnfUnit: 'g', nutriCompound: 'Lysine', isCanonical: true },
  { cnfId: '506', cnfName: 'Methionine', cnfUnit: 'g', nutriCompound: 'Methionine', isCanonical: true },
  { cnfId: '507', cnfName: 'Cystine', cnfUnit: 'g', nutriCompound: 'Cysteine', isCanonical: true },
  { cnfId: '508', cnfName: 'Phenylalanine', cnfUnit: 'g', nutriCompound: 'Phenylalanine', isCanonical: true },
  { cnfId: '509', cnfName: 'Tyrosine', cnfUnit: 'g', nutriCompound: 'Tyrosine', isCanonical: true },
  { cnfId: '510', cnfName: 'Valine', cnfUnit: 'g', nutriCompound: 'Valine', isCanonical: true },
  { cnfId: '511', cnfName: 'Arginine', cnfUnit: 'g', nutriCompound: 'Arginine', isCanonical: true },
  { cnfId: '512', cnfName: 'Histidine', cnfUnit: 'g', nutriCompound: 'Histidine', isCanonical: true },
  { cnfId: '513', cnfName: 'Alanine', cnfUnit: 'g', nutriCompound: 'Alanine', isCanonical: true },
  { cnfId: '514', cnfName: 'Aspartic acid', cnfUnit: 'g', nutriCompound: 'Aspartic Acid', isCanonical: true },
  { cnfId: '515', cnfName: 'Glutamic acid', cnfUnit: 'g', nutriCompound: 'Glutamic Acid', isCanonical: true },
  { cnfId: '516', cnfName: 'Glycine', cnfUnit: 'g', nutriCompound: 'Glycine', isCanonical: true },
  { cnfId: '517', cnfName: 'Proline', cnfUnit: 'g', nutriCompound: 'Proline', isCanonical: true },
  { cnfId: '518', cnfName: 'Serine', cnfUnit: 'g', nutriCompound: 'Serine', isCanonical: true },
  { cnfId: '828', cnfName: 'Hydroxyproline', cnfUnit: 'g', nutriCompound: 'Hydroxyproline', isCanonical: true },

  // Category 11: Lipids - Totals & Cholesterol
  { cnfId: '601', cnfName: 'Cholesterol', cnfUnit: 'mg', nutriCompound: 'Cholesterol', isCanonical: true },
  { cnfId: '605', cnfName: 'Fatty acids, trans, total', cnfUnit: 'g', nutriCompound: 'Trans Fat', isCanonical: true },
  { cnfId: '606', cnfName: 'Fatty acids, saturated, total', cnfUnit: 'g', nutriCompound: 'Saturated Fat', isCanonical: true },
  { cnfId: '645', cnfName: 'Fatty acids, monounsaturated, total', cnfUnit: 'g', nutriCompound: 'Monounsaturated Fat', isCanonical: true },
  { cnfId: '646', cnfName: 'Fatty acids, polyunsaturated, total', cnfUnit: 'g', nutriCompound: 'Polyunsaturated Fat', isCanonical: true },
  { cnfId: '829', cnfName: 'Fatty acids, trans, total, monoenoic', cnfUnit: 'g', nutriCompound: 'Trans Fat (Monoenoic)', isCanonical: true },
  { cnfId: '859', cnfName: 'Fatty acids, trans, total, polyenoic', cnfUnit: 'g', nutriCompound: 'Trans Fat (Polyenoic)', isCanonical: true },
  { cnfId: '868', cnfName: 'Fatty acids, polyunsaturated, total omega n-3', cnfUnit: 'g', nutriCompound: 'Omega-3 Fatty Acids', isCanonical: true },
  { cnfId: '869', cnfName: 'Fatty acids, polyunsaturated, total omega n-6', cnfUnit: 'g', nutriCompound: 'Omega-6 Fatty Acids', isCanonical: true },

  // Category 12: Saturated Fatty Acids
  { cnfId: '607', cnfName: '4:0', cnfUnit: 'g', nutriCompound: 'Butyric Acid', isCanonical: true },
  { cnfId: '608', cnfName: '6:0', cnfUnit: 'g', nutriCompound: 'Caproic Acid', isCanonical: true },
  { cnfId: '609', cnfName: '8:0', cnfUnit: 'g', nutriCompound: 'Caprylic Acid', isCanonical: true },
  { cnfId: '610', cnfName: '10:0', cnfUnit: 'g', nutriCompound: 'Capric Acid', isCanonical: true },
  { cnfId: '611', cnfName: '12:0', cnfUnit: 'g', nutriCompound: 'Lauric Acid', isCanonical: true },
  { cnfId: '612', cnfName: '14:0', cnfUnit: 'g', nutriCompound: 'Myristic Acid', isCanonical: true },
  { cnfId: '613', cnfName: '16:0', cnfUnit: 'g', nutriCompound: 'Palmitic Acid', isCanonical: true },
  { cnfId: '614', cnfName: '18:0', cnfUnit: 'g', nutriCompound: 'Stearic Acid', isCanonical: true },
  { cnfId: '615', cnfName: '20:0', cnfUnit: 'g', nutriCompound: 'Arachidic Acid', isCanonical: true },
  { cnfId: '624', cnfName: '22:0', cnfUnit: 'g', nutriCompound: 'Behenic Acid', isCanonical: true },
  { cnfId: '652', cnfName: '15:0', cnfUnit: 'g', nutriCompound: 'Pentadecanoic Acid', isCanonical: true },
  { cnfId: '653', cnfName: '17:0', cnfUnit: 'g', nutriCompound: 'Heptadecanoic Acid', isCanonical: true },
  { cnfId: '654', cnfName: '24:0', cnfUnit: 'g', nutriCompound: 'Lignoceric Acid', isCanonical: true },
  { cnfId: '830', cnfName: '13:0', cnfUnit: 'g', nutriCompound: 'Tridecanoic Acid', isCanonical: true },

  // Category 13: Monounsaturated Fatty Acids
  { cnfId: '617', cnfName: '18:1', cnfUnit: 'g', nutriCompound: 'Oleic Acid', isCanonical: true },
  { cnfId: '625', cnfName: '14:1', cnfUnit: 'g', nutriCompound: 'Myristoleic Acid', isCanonical: true },
  { cnfId: '626', cnfName: '16:1', cnfUnit: 'g', nutriCompound: 'Palmitoleic Acid', isCanonical: true },
  { cnfId: '628', cnfName: '20:1', cnfUnit: 'g', nutriCompound: 'Eicosenoic Acid', isCanonical: true },
  { cnfId: '630', cnfName: '22:1', cnfUnit: 'g', nutriCompound: 'Erucic Acid', isCanonical: true },
  { cnfId: '817', cnfName: '16:1t', cnfUnit: 'g', nutriCompound: 'Palmitoleic Acid (trans)', isCanonical: true },
  { cnfId: '818', cnfName: '18:1t', cnfUnit: 'g', nutriCompound: 'Oleic Acid (trans)', isCanonical: true },
  { cnfId: '820', cnfName: '24:1c', cnfUnit: 'g', nutriCompound: 'Nervonic Acid', isCanonical: false },
  { cnfId: '821', cnfName: '16:1c', cnfUnit: 'g', nutriCompound: 'Palmitoleic Acid (cis)', isCanonical: true },
  { cnfId: '824', cnfName: '18:1c', cnfUnit: 'g', nutriCompound: 'Oleic Acid (cis)', isCanonical: true },
  { cnfId: '826', cnfName: '17:1', cnfUnit: 'g', nutriCompound: 'Heptadecenoic Acid', isCanonical: true },
  { cnfId: '833', cnfName: '15:1', cnfUnit: 'g', nutriCompound: 'Pentadecenoic Acid', isCanonical: true },
  { cnfId: '840', cnfName: '22:1c', cnfUnit: 'g', nutriCompound: 'Erucic Acid (cis)', isCanonical: true },
  { cnfId: '846', cnfName: '24:1', cnfUnit: 'g', nutriCompound: 'Nervonic Acid', isCanonical: true },
  { cnfId: '847', cnfName: '12:1', cnfUnit: 'g', nutriCompound: 'Dodecenoic Acid', isCanonical: true },
  { cnfId: '852', cnfName: '22:1t', cnfUnit: 'g', nutriCompound: 'Erucic Acid (trans)', isCanonical: true },

  // Category 14: Polyunsaturated Fatty Acids
  { cnfId: '618', cnfName: '18:2', cnfUnit: 'g', nutriCompound: 'Linoleic Acid', isCanonical: true },
  { cnfId: '619', cnfName: '18:3', cnfUnit: 'g', nutriCompound: 'Alpha-Linolenic Acid', isCanonical: true },
  { cnfId: '620', cnfName: '20:4', cnfUnit: 'g', nutriCompound: 'Arachidonic Acid', isCanonical: true },
  { cnfId: '621', cnfName: '22:6n-3 (DHA)', cnfUnit: 'g', nutriCompound: 'Docosahexaenoic Acid', isCanonical: true },
  { cnfId: '627', cnfName: '18:4', cnfUnit: 'g', nutriCompound: 'Stearidonic Acid', isCanonical: true },
  { cnfId: '629', cnfName: '20:5n-3 (EPA)', cnfUnit: 'g', nutriCompound: 'Eicosapentaenoic Acid', isCanonical: true },
  { cnfId: '631', cnfName: '22:5n-3 (DPA)', cnfUnit: 'g', nutriCompound: 'Docosapentaenoic Acid', isCanonical: true },
  { cnfId: '819', cnfName: '18:2i', cnfUnit: 'g', nutriCompound: 'Linoleic Acid', isCanonical: false },
  { cnfId: '823', cnfName: '20:2cc', cnfUnit: 'g', nutriCompound: 'Eicosadienoic Acid', isCanonical: true },
  { cnfId: '825', cnfName: '18:2n6cc', cnfUnit: 'g', nutriCompound: 'Linoleic Acid (cis,cis)', isCanonical: true },
  { cnfId: '827', cnfName: '20:3', cnfUnit: 'g', nutriCompound: 'Eicosatrienoic Acid', isCanonical: true },
  { cnfId: '831', cnfName: '18:3n3cccn-3', cnfUnit: 'g', nutriCompound: 'Alpha-Linolenic Acid', isCanonical: false },
  { cnfId: '832', cnfName: '18:3n6cccn-6', cnfUnit: 'g', nutriCompound: 'Gamma-Linolenic Acid', isCanonical: true },
  { cnfId: '838', cnfName: '18:2cla', cnfUnit: 'g', nutriCompound: 'Conjugated Linoleic Acid', isCanonical: true },
  { cnfId: '841', cnfName: '18:3i', cnfUnit: 'g', nutriCompound: 'Alpha-Linolenic Acid', isCanonical: false },
  { cnfId: '843', cnfName: '21:5', cnfUnit: 'g', nutriCompound: 'Heneicosapentaenoic Acid', isCanonical: true },
  { cnfId: '845', cnfName: '22:4n-6', cnfUnit: 'g', nutriCompound: 'Docosatetraenoic Acid', isCanonical: true },
  { cnfId: '848', cnfName: '22:3', cnfUnit: 'g', nutriCompound: 'Docosatrienoic Acid', isCanonical: true },
  { cnfId: '849', cnfName: '22:2', cnfUnit: 'g', nutriCompound: 'Docosadienoic Acid', isCanonical: true },
  { cnfId: '853', cnfName: '18:2t,t', cnfUnit: 'g', nutriCompound: 'Linoleic Acid (trans,trans)', isCanonical: true },
  { cnfId: '854', cnfName: '20:3n-6', cnfUnit: 'g', nutriCompound: 'Dihomo-gamma-linolenic Acid', isCanonical: true },
  { cnfId: '855', cnfName: '20:4n-6', cnfUnit: 'g', nutriCompound: 'Arachidonic Acid', isCanonical: false },
  { cnfId: '861', cnfName: '20:3n-3', cnfUnit: 'g', nutriCompound: 'Eicosatrienoic Acid (omega-3)', isCanonical: true },

  // Category 15: Phytosterols
  { cnfId: '636', cnfName: 'Total plant sterol', cnfUnit: 'mg', nutriCompound: 'Total Plant Sterols', isCanonical: true },
  { cnfId: '638', cnfName: 'Stigmasterol', cnfUnit: 'mg', nutriCompound: 'Stigmasterol', isCanonical: true },
  { cnfId: '816', cnfName: 'Beta-sitosterol', cnfUnit: 'mg', nutriCompound: 'Beta-Sitosterol', isCanonical: true },
  { cnfId: '866', cnfName: 'Campesterol', cnfUnit: 'mg', nutriCompound: 'Campesterol', isCanonical: true },
];

async function main() {
  console.log('Inserting 152 CNF mappings into compound_sources...\n');

  // First, get all compounds to build a name->id map
  const { data: compounds, error: fetchError } = await supabase
    .from('compounds')
    .select('id, name');

  if (fetchError || !compounds) {
    console.error('Failed to fetch compounds:', fetchError);
    return;
  }

  const compoundMap = new Map<string, string>();
  for (const c of compounds) {
    compoundMap.set(c.name.toLowerCase(), c.id);
  }

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const mapping of cnfMappings) {
    const compoundId = compoundMap.get(mapping.nutriCompound.toLowerCase());

    if (!compoundId) {
      console.log(`❌ ${mapping.cnfName} -> "${mapping.nutriCompound}" NOT FOUND`);
      errors.push(`${mapping.nutriCompound} not found`);
      errorCount++;
      continue;
    }

    const { error } = await supabase
      .from('compound_sources')
      .insert({
        compound_id: compoundId,
        external_source: 'CNF',
        external_id: mapping.cnfId,
        source_name: mapping.cnfName,
        source_unit: mapping.cnfUnit,
        conversion_factor: mapping.conversionFactor || '1.0',
        is_canonical: mapping.isCanonical,
      });

    if (error) {
      if (error.code === '23505') {
        // Duplicate - already exists
        console.log(`⏭️  ${mapping.cnfId} ${mapping.cnfName} (already exists)`);
      } else {
        console.log(`❌ ${mapping.cnfName}: ${error.message}`);
        errors.push(`${mapping.cnfName}: ${error.message}`);
        errorCount++;
      }
    } else {
      console.log(`✅ ${mapping.cnfId} ${mapping.cnfName} -> ${mapping.nutriCompound}`);
      successCount++;
    }
  }

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  // Verify count
  const { count } = await supabase
    .from('compound_sources')
    .select('*', { count: 'exact', head: true })
    .eq('external_source', 'CNF');

  console.log(`\nTotal CNF mappings in database: ${count}`);
}

main().catch(console.error);
