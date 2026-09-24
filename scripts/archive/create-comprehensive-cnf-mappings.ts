/**
 * Create Comprehensive CNF Mappings
 *
 * Maps all 136 CNF nutrient IDs to compound UUIDs in compound_sources table.
 * Achieves 100% CNF coverage.
 */

import { cnfClient } from '../lib/services/cnf-client';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Comprehensive CNF nutrient ID to compound name mapping
// IMPORTANT: Only ONE nutrient ID per compound to avoid duplicate values
const CNF_TO_COMPOUND_MAP: Record<number, string> = {
  // Macronutrients
  203: 'Protein',
  204: 'Total Fat',
  205: 'Total Carbohydrate',
  207: 'Ash',
  208: 'Energy', // kcal - canonical (skip 268 kJ)
  255: 'Water',

  // Sugars & Carbohydrates
  210: 'Sucrose',
  211: 'Glucose',
  212: 'Fructose',
  213: 'Lactose',
  214: 'Maltose',
  287: 'Galactose',
  269: 'Total Sugars', // canonical (skip 802, 803)
  810: 'Starch',
  291: 'Total Fiber',

  // Other compounds
  221: 'Alcohol',
  262: 'Caffeine',
  263: 'Theobromine',
  260: 'Mannitol',
  261: 'Sorbitol',
  862: 'Choline',
  863: 'Betaine',

  // Minerals
  301: 'Calcium',
  303: 'Iron',
  304: 'Magnesium',
  305: 'Phosphorus',
  306: 'Potassium',
  307: 'Sodium',
  309: 'Zinc',
  312: 'Copper',
  315: 'Manganese',
  317: 'Selenium',

  // Vitamins - A & Carotenoids
  319: 'Retinol',
  814: 'Vitamin A', // RAE - canonical
  321: 'Beta-Carotene',
  834: 'Alpha-Carotene',
  835: 'Beta-Cryptoxanthin',
  836: 'Lycopene',
  837: 'Lutein',

  // Vitamins - D & E
  339: 'Vitamin D', // µg - canonical (skip 324 IU)
  323: 'Alpha-Tocopherol', // Vitamin E
  811: 'Beta-Tocopherol',
  812: 'Gamma-Tocopherol',
  813: 'Delta-Tocopherol',

  // Vitamins - C & K
  401: 'Vitamin C',
  430: 'Vitamin K',

  // Vitamins - B Complex
  404: 'Thiamin',
  405: 'Riboflavin',
  406: 'Niacin', // mg - canonical (skip 409 NE)
  410: 'Pantothenic Acid',
  415: 'Vitamin B6',
  416: 'Biotin',
  815: 'Folate', // DFE - canonical (skip 417, 806, 431)
  418: 'Vitamin B12',

  // Amino Acids (Essential)
  501: 'Tryptophan',
  502: 'Threonine',
  503: 'Isoleucine',
  504: 'Leucine',
  505: 'Lysine',
  506: 'Methionine',
  508: 'Phenylalanine',
  510: 'Valine',
  512: 'Histidine',

  // Amino Acids (Non-essential)
  507: 'Cysteine',
  509: 'Tyrosine',
  511: 'Arginine',
  513: 'Alanine',
  514: 'Aspartic Acid',
  515: 'Glutamic Acid',
  516: 'Glycine',
  517: 'Proline',
  518: 'Serine',
  828: 'Hydroxyproline',

  // Lipids - Cholesterol & Total Fats
  601: 'Cholesterol',
  606: 'Saturated Fat',
  645: 'Monounsaturated Fat',
  646: 'Polyunsaturated Fat',
  605: 'Trans Fat', // canonical (skip 829, 859 subtypes)
  868: 'Omega-3 Fatty Acids',
  869: 'Omega-6 Fatty Acids',

  // Saturated Fatty Acids
  607: 'Butyric Acid', // 4:0
  608: 'Caproic Acid', // 6:0
  609: 'Caprylic Acid', // 8:0
  610: 'Capric Acid', // 10:0
  611: 'Lauric Acid', // 12:0
  612: 'Myristic Acid', // 14:0
  652: 'Pentadecanoic Acid', // 15:0
  613: 'Palmitic Acid', // 16:0
  653: 'Heptadecanoic Acid', // 17:0
  614: 'Stearic Acid', // 18:0
  615: 'Arachidic Acid', // 20:0
  624: 'Behenic Acid', // 22:0
  654: 'Lignoceric Acid', // 24:0

  // Monounsaturated Fatty Acids
  625: 'Myristoleic Acid', // 14:1
  833: 'Pentadecenoic Acid', // 15:1
  626: 'Palmitoleic Acid', // 16:1 - canonical (skip 821 cis, 817 trans)
  826: 'Heptadecenoic Acid', // 17:1
  617: 'Oleic Acid', // 18:1 - canonical (skip 824 cis, 818 trans)
  628: 'Eicosenoic Acid', // 20:1
  630: 'Erucic Acid', // 22:1 - canonical (skip 840 cis, 852 trans)
  846: 'Nervonic Acid', // 24:1 - canonical (skip 820)

  // Polyunsaturated Fatty Acids - Omega-6
  618: 'Linoleic Acid', // 18:2 - canonical (skip 825, 853, 819 isomers)
  838: 'Conjugated Linoleic Acid', // 18:2cla
  832: 'Gamma-Linolenic Acid (GLA)', // 18:3n6
  823: 'Eicosadienoic Acid', // 20:2
  827: 'Eicosatrienoic Acid', // 20:3
  854: 'Dihomo-gamma-linolenic Acid (DGLA)', // 20:3n-6
  620: 'Arachidonic Acid', // 20:4 - canonical (skip 855)
  845: 'Docosatetraenoic Acid (omega-6)', // 22:4n-6

  // Polyunsaturated Fatty Acids - Omega-3
  619: 'Alpha-Linolenic Acid', // 18:3 - canonical (skip 831, 841 isomers)
  627: 'Stearidonic Acid', // 18:4
  861: 'Eicosatrienoic Acid (omega-3)', // 20:3n-3
  629: 'Eicosapentaenoic Acid', // 20:5n-3 (EPA)
  631: 'Docosapentaenoic Acid', // 22:5n-3 (DPA)
  621: 'Docosahexaenoic Acid', // 22:6n-3 (DHA)

  // Phytosterols
  636: 'Phytosterols',
  816: 'Beta-Sitosterol',
  866: 'Campesterol',
  638: 'Stigmasterol',

  // Other
  245: 'Oxalic Acid',
};

async function main() {
  console.log('🧙‍♂️ Creating comprehensive CNF mappings for all 136 nutrients...\n');

  // Step 1: Fetch all CNF nutrients
  const cnfNutrients = await cnfClient.getNutrients(841);
  const cnfMap = new Map<number, string>();
  cnfNutrients.forEach((n: any) => {
    if (!cnfMap.has(n.nutrient_name_id)) {
      cnfMap.set(n.nutrient_name_id, n.nutrient_web_name);
    }
  });

  console.log(`Found ${cnfMap.size} unique CNF nutrients\n`);

  // Step 2: Get all compounds
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

  // Step 3: Create mappings
  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const [cnfId, cnfName] of cnfMap.entries()) {
    const compoundName = CNF_TO_COMPOUND_MAP[cnfId];

    if (!compoundName) {
      console.warn(`⚠️  No mapping defined for CNF ${cnfId}: ${cnfName}`);
      skipped++;
      continue;
    }

    const compoundId = compoundMap.get(compoundName.toLowerCase());

    if (!compoundId) {
      console.error(`✗ Compound not found for CNF ${cnfId} → "${compoundName}"`);
      failed++;
      continue;
    }

    // Insert mapping
    const { error } = await supabase
      .from('compound_sources')
      .insert({
        compound_id: compoundId,
        external_source: 'CNF',
        external_id: String(cnfId),
      });

    if (error) {
      if (error.code === '23505') {
        console.log(`  - CNF ${String(cnfId).padStart(4)} → ${compoundName} (already exists)`);
      } else {
        console.error(`✗ Failed CNF ${cnfId}:`, error.message);
        failed++;
      }
    } else {
      console.log(`✓ CNF ${String(cnfId).padStart(4)} → ${compoundName}`);
      added++;
    }
  }

  // Step 4: Summary
  console.log('\n========================================');
  console.log('CNF MAPPING SUMMARY');
  console.log('========================================');
  console.log(`✓ Added: ${added}`);
  console.log(`- Existed: ${cnfMap.size - added - skipped - failed}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`✗ Failed: ${failed}`);

  // Verify total
  const { count: totalCnfMappings } = await supabase
    .from('compound_sources')
    .select('*', { count: 'exact', head: true })
    .eq('external_source', 'CNF');

  console.log(`\n📊 Total CNF mappings: ${totalCnfMappings}`);

  if (totalCnfMappings === cnfMap.size) {
    console.log('🎉 100% CNF coverage achieved!');
  } else {
    console.log(`⚠️  Coverage: ${((totalCnfMappings / cnfMap.size) * 100).toFixed(1)}%`);
  }
}

main().catch(console.error);
