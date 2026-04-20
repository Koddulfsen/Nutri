/**
 * Add Missing CNF Compounds
 *
 * Adds 12 compounds that exist in CNF but were missing from our database:
 * - 3 carbohydrates (Starch, Total Monosaccharides, Total Disaccharides)
 * - 5 fatty acids (13:0, 12:1, 21:5, 22:3, 22:2)
 * - 4 phytosterols (Beta-Sitosterol, Campesterol, Stigmasterol, Total Plant Sterols)
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NewCompound {
  name: string;
  compound_type: string;
  unit: string;
  alternate_names?: string[];
  description?: string;
}

const newCompounds: NewCompound[] = [
  // Carbohydrates
  {
    name: 'Starch',
    compound_type: 'CARBOHYDRATE',
    unit: 'g',
    alternate_names: ['Amylum'],
    description: 'Complex carbohydrate made of glucose units; primary energy storage in plants. Distinct from Resistant Starch which resists digestion.',
  },
  {
    name: 'Total Monosaccharides',
    compound_type: 'CARBOHYDRATE',
    unit: 'g',
    alternate_names: ['Simple sugars'],
    description: 'Sum of all monosaccharides (glucose, fructose, galactose).',
  },
  {
    name: 'Total Disaccharides',
    compound_type: 'CARBOHYDRATE',
    unit: 'g',
    description: 'Sum of all disaccharides (sucrose, lactose, maltose).',
  },

  // Saturated Fatty Acids
  {
    name: 'Tridecanoic Acid',
    compound_type: 'FATTY_ACID',
    unit: 'g',
    alternate_names: ['13:0', 'Tridecylic acid'],
    description: 'Rare odd-chain saturated fatty acid with 13 carbons.',
  },

  // Monounsaturated Fatty Acids
  {
    name: 'Dodecenoic Acid',
    compound_type: 'FATTY_ACID',
    unit: 'g',
    alternate_names: ['12:1', 'Lauroleic acid'],
    description: 'Rare monounsaturated fatty acid with 12 carbons and one double bond.',
  },

  // Polyunsaturated Fatty Acids
  {
    name: 'Heneicosapentaenoic Acid',
    compound_type: 'FATTY_ACID',
    unit: 'g',
    alternate_names: ['21:5', 'HPA'],
    description: 'Rare omega-3 polyunsaturated fatty acid with 21 carbons and 5 double bonds.',
  },
  {
    name: 'Docosatrienoic Acid',
    compound_type: 'FATTY_ACID',
    unit: 'g',
    alternate_names: ['22:3'],
    description: 'Polyunsaturated fatty acid with 22 carbons and 3 double bonds.',
  },
  {
    name: 'Docosadienoic Acid',
    compound_type: 'FATTY_ACID',
    unit: 'g',
    alternate_names: ['22:2'],
    description: 'Polyunsaturated fatty acid with 22 carbons and 2 double bonds.',
  },

  // Phytosterols (classified as FATTY_ACID like Cholesterol - they're structurally similar sterols)
  {
    name: 'Beta-Sitosterol',
    compound_type: 'FATTY_ACID',
    unit: 'mg',
    alternate_names: ['β-Sitosterol', 'Sitosterol'],
    description: 'Most abundant phytosterol in plants. Reduces cholesterol absorption and may support prostate health.',
  },
  {
    name: 'Campesterol',
    compound_type: 'FATTY_ACID',
    unit: 'mg',
    description: 'Common phytosterol found in vegetable oils, nuts, and seeds. Competes with cholesterol for absorption.',
  },
  {
    name: 'Stigmasterol',
    compound_type: 'FATTY_ACID',
    unit: 'mg',
    alternate_names: ['Stigmasterin'],
    description: 'Phytosterol found in soy, nuts, and vegetables. May have anti-inflammatory properties.',
  },
  {
    name: 'Total Plant Sterols',
    compound_type: 'FATTY_ACID',
    unit: 'mg',
    alternate_names: ['Total Phytosterols', 'Plant sterols'],
    description: 'Sum of all plant sterols (sitosterol, campesterol, stigmasterol, etc.). Recommended 2g/day for cholesterol reduction.',
  },
];

async function main() {
  console.log('Adding 12 missing CNF compounds...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const compound of newCompounds) {
    try {
      const { data, error } = await supabase
        .from('compounds')
        .insert({
          name: compound.name,
          compound_type: compound.compound_type,
          unit: compound.unit,
          alternate_names: compound.alternate_names || [],
          description: compound.description,
        })
        .select('id, name')
        .single();

      if (error) {
        console.log(`❌ ${compound.name}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${compound.name} (${data.id})`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${compound.name}: ${err}`);
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);

  // Verify final count
  const { count } = await supabase
    .from('compounds')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal compounds in database: ${count}`);
}

main().catch(console.error);
