/**
 * Match CNF Nutrients to Existing Compounds
 *
 * Analyzes which of the 136 CNF nutrients have matching compounds in our database
 * and identifies gaps that need new compounds.
 */

import { cnfClient } from '../lib/services/cnf-client';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Matching CNF nutrients to existing compounds...\n');

  // Step 1: Fetch all CNF nutrients
  const cnfNutrients = await cnfClient.getNutrients(841); // Chicken breast
  const cnfMap = new Map<number, string>();
  cnfNutrients.forEach((n: any) => {
    if (!cnfMap.has(n.nutrient_name_id)) {
      cnfMap.set(n.nutrient_name_id, n.nutrient_web_name);
    }
  });

  console.log(`Found ${cnfMap.size} unique CNF nutrients\n`);

  // Step 2: Fetch all compounds from database
  const { data: compounds } = await supabase
    .from('compounds')
    .select('id, name, alternate_names, compound_type');

  console.log(`Found ${compounds?.length || 0} compounds in database\n`);

  // Step 3: Create lookup maps (case-insensitive)
  const compoundNameMap = new Map<string, any>();

  for (const compound of compounds || []) {
    // Add main name
    compoundNameMap.set(compound.name.toLowerCase(), compound);

    // Add alternate names
    if (compound.alternate_names) {
      for (const altName of compound.alternate_names) {
        compoundNameMap.set(altName.toLowerCase(), compound);
      }
    }
  }

  // Step 4: Manual mapping rules for known variations
  const manualMappings: Record<string, string> = {
    'protein': 'protein',
    'total fat': 'total fat',
    'carbohydrate': 'total carbohydrate',
    'ash': 'ash',
    'energy (kcal)': 'energy',
    'energy (kj)': 'energy',
    'sucrose': 'sucrose',
    'glucose': 'glucose',
    'fructose': 'fructose',
    'lactose': 'lactose',
    'maltose': 'maltose',
    'alcohol': 'alcohol',
    'moisture': 'water',
    'caffeine': 'caffeine',
    'fibre, total dietary': 'total fiber',
    'calcium, ca': 'calcium',
    'iron, fe': 'iron',
    'magnesium, mg': 'magnesium',
    'phosphorus, p': 'phosphorus',
    'potassium, k': 'potassium',
    'sodium, na': 'sodium',
    'zinc, zn': 'zinc',
    'copper, cu': 'copper',
    'manganese, mn': 'manganese',
    'selenium, se': 'selenium',
    'retinol': 'retinol',
    'beta carotene': 'beta-carotene',
    'tocopherol, alpha': 'alpha-tocopherol',
    'vitamin d': 'vitamin d',
    'vitamin d (iu)': 'vitamin d',
    'vitamin c': 'vitamin c',
    'thiamin': 'thiamin',
    'riboflavin': 'riboflavin',
    'niacin': 'niacin',
    'pantothenic acid': 'pantothenic acid',
    'vitamin b-6': 'vitamin b6',
    'folacin, total': 'folate',
    'vitamin b-12': 'vitamin b12',
    'vitamin k': 'vitamin k',
    'cholesterol': 'cholesterol',
    'fatty acids, saturated, total': 'saturated fat',
    'fatty acids, monounsaturated, total': 'monounsaturated fat',
    'fatty acids, polyunsaturated, total': 'polyunsaturated fat',
    'fatty acids, trans, total': 'trans fat',
    'fatty acids, trans, total, monoenoic': 'trans fat (monoenoic)',
    'fatty acids, trans, total, polyenoic': 'trans fat (polyenoic)',

    // Amino acids
    'tryptophan': 'tryptophan',
    'threonine': 'threonine',
    'isoleucine': 'isoleucine',
    'leucine': 'leucine',
    'lysine': 'lysine',
    'methionine': 'methionine',
    'phenylalanine': 'phenylalanine',
    'valine': 'valine',
    'histidine': 'histidine',
    'alanine': 'alanine',
  };

  // Step 5: Try to match each CNF nutrient
  const matched: Array<{ cnfId: number; cnfName: string; compound: any }> = [];
  const unmatched: Array<{ cnfId: number; cnfName: string }> = [];

  for (const [cnfId, cnfName] of cnfMap.entries()) {
    const cnfLower = cnfName.toLowerCase();

    // Try manual mapping first
    let mappedName = manualMappings[cnfLower];
    if (mappedName) {
      const compound = compoundNameMap.get(mappedName.toLowerCase());
      if (compound) {
        matched.push({ cnfId, cnfName, compound });
        continue;
      }
    }

    // Try direct match
    const directMatch = compoundNameMap.get(cnfLower);
    if (directMatch) {
      matched.push({ cnfId, cnfName, compound: directMatch });
      continue;
    }

    // Try partial matches (for fatty acids like "18:2" matching compounds)
    let found = false;
    for (const [compoundName, compound] of compoundNameMap.entries()) {
      if (compoundName.includes(cnfLower) || cnfLower.includes(compoundName)) {
        matched.push({ cnfId, cnfName, compound });
        found = true;
        break;
      }
    }

    if (!found) {
      unmatched.push({ cnfId, cnfName });
    }
  }

  // Step 6: Report findings
  console.log('========================================');
  console.log('MATCHING SUMMARY');
  console.log('========================================\n');

  console.log(`✅ Matched: ${matched.length} CNF nutrients`);
  console.log(`❌ Unmatched: ${unmatched.length} CNF nutrients\n`);

  console.log('========================================');
  console.log('UNMATCHED CNF NUTRIENTS (Need Compounds)');
  console.log('========================================\n');

  // Group unmatched by category
  const categories = {
    'Sugars & Carbs': [] as any[],
    'Fatty Acids': [] as any[],
    'Vitamins': [] as any[],
    'Amino Acids': [] as any[],
    'Other': [] as any[],
  };

  for (const item of unmatched) {
    const name = item.cnfName.toLowerCase();

    if (name.includes('sugar') || name.includes('starch') || name.includes('saccharide') ||
        name.includes('galactose') || name.includes('sorbitol') || name.includes('mannitol')) {
      categories['Sugars & Carbs'].push(item);
    } else if (name.includes(':') || name.includes('fatty') || name.includes('dha') ||
               name.includes('epa') || name.includes('dpa')) {
      categories['Fatty Acids'].push(item);
    } else if (name.includes('vitamin') || name.includes('tocopherol') || name.includes('folate') ||
               name.includes('folic') || name.includes('retinol') || name.includes('carotene') ||
               name.includes('lycopene') || name.includes('lutein') || name.includes('theobromine')) {
      categories['Vitamins'].push(item);
    } else if (name.includes('cystine') || name.includes('tyrosine') || name.includes('arginine') ||
               name.includes('aspartic') || name.includes('glutamic') || name.includes('glycine') ||
               name.includes('proline') || name.includes('serine')) {
      categories['Amino Acids'].push(item);
    } else {
      categories['Other'].push(item);
    }
  }

  for (const [category, items] of Object.entries(categories)) {
    if (items.length > 0) {
      console.log(`\n${category} (${items.length}):`);
      items.forEach(item => {
        console.log(`  ${String(item.cnfId).padStart(4)}: ${item.cnfName}`);
      });
    }
  }

  console.log('\n========================================');
  console.log(`COVERAGE: ${((matched.length / cnfMap.size) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  if (unmatched.length > 0) {
    console.log(`⚠️  Need to add ${unmatched.length} new compounds to achieve 100% CNF coverage`);
  } else {
    console.log('🎉 100% coverage! All CNF nutrients have matching compounds!');
  }
}

main().catch(console.error);
