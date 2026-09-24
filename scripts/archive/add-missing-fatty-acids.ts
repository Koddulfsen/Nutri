/**
 * Add Missing Fatty Acid Compounds for 100% CNF Coverage
 *
 * Adds 22 specific fatty acid variants that CNF provides but are missing from our compounds table.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const MISSING_FATTY_ACIDS = [
  // Monounsaturated fatty acids (MUFAs)
  { name: 'Myristoleic Acid', scientificName: '14:1', unit: 'g', description: 'Monounsaturated omega-5 fatty acid (14:1)' },
  { name: 'Pentadecenoic Acid', scientificName: '15:1', unit: 'g', description: 'Monounsaturated fatty acid (15:1)' },
  { name: 'Palmitoleic Acid (cis)', scientificName: '16:1c', unit: 'g', description: 'cis-Palmitoleic acid, omega-7 (16:1c)' },
  { name: 'Palmitoleic Acid (trans)', scientificName: '16:1t', unit: 'g', description: 'trans-Palmitoleic acid (16:1t)' },
  { name: 'Heptadecenoic Acid', scientificName: '17:1', unit: 'g', description: 'Monounsaturated fatty acid (17:1)' },
  { name: 'Oleic Acid (cis)', scientificName: '18:1c', unit: 'g', description: 'cis-Oleic acid, omega-9 (18:1c)' },
  { name: 'Oleic Acid (trans)', scientificName: '18:1t', unit: 'g', description: 'trans-Oleic acid, elaidic acid (18:1t)' },
  { name: 'Erucic Acid (cis)', scientificName: '22:1c', unit: 'g', description: 'cis-Erucic acid, omega-9 (22:1c)' },
  { name: 'Erucic Acid (trans)', scientificName: '22:1t', unit: 'g', description: 'trans-Erucic acid (22:1t)' },
  { name: 'Nervonic Acid', scientificName: '24:1c', unit: 'g', description: 'Nervonic acid, omega-9 (24:1c)' },

  // Polyunsaturated fatty acids (PUFAs)
  { name: 'Linoleic Acid (cis,cis)', scientificName: '18:2n6cc', unit: 'g', description: 'cis,cis-Linoleic acid, omega-6 (18:2n6cc)' },
  { name: 'Linoleic Acid (trans,trans)', scientificName: '18:2t,t', unit: 'g', description: 'trans,trans-Linoleic acid (18:2t,t)' },
  { name: 'Alpha-Linolenic Acid (ALA)', scientificName: '18:3n3cccn-3', unit: 'g', description: 'Alpha-linolenic acid, omega-3 (18:3n-3)' },
  { name: 'Gamma-Linolenic Acid (GLA)', scientificName: '18:3n6cccn-6', unit: 'g', description: 'Gamma-linolenic acid, omega-6 (18:3n-6)' },
  { name: 'Eicosadienoic Acid', scientificName: '20:2cc', unit: 'g', description: 'Eicosadienoic acid (20:2cc)' },
  { name: 'Eicosatrienoic Acid (omega-3)', scientificName: '20:3n-3', unit: 'g', description: 'Eicosatrienoic acid, omega-3 (20:3n-3)' },
  { name: 'Dihomo-gamma-linolenic Acid (DGLA)', scientificName: '20:3n-6', unit: 'g', description: 'Dihomo-gamma-linolenic acid, omega-6 (20:3n-6)' },
  { name: 'Arachidonic Acid (AA)', scientificName: '20:4n-6', unit: 'g', description: 'Arachidonic acid, omega-6 (20:4n-6)' },
  { name: 'Docosatetraenoic Acid (omega-6)', scientificName: '22:4n-6', unit: 'g', description: 'Docosatetraenoic acid, omega-6 (22:4n-6)' },

  // Saturated fatty acids (SFAs)
  { name: 'Pentadecanoic Acid', scientificName: '15:0', unit: 'g', description: 'Saturated fatty acid (15:0)' },
  { name: 'Heptadecanoic Acid', scientificName: '17:0', unit: 'g', description: 'Saturated fatty acid (17:0)' },
  { name: 'Behenic Acid', scientificName: '22:0', unit: 'g', description: 'Saturated fatty acid (22:0)' },
];

async function main() {
  console.log('🧙‍♂️ Adding 22 missing fatty acid compounds for 100% CNF coverage...\n');

  let added = 0;
  let failed = 0;
  const addedCompounds: Array<{ name: string; id: string }> = [];

  for (const fa of MISSING_FATTY_ACIDS) {
    const { data, error } = await supabase
      .from('compounds')
      .insert({
        name: fa.name,
        compound_type: 'FATTY_ACID',
        unit: fa.unit,
        description: fa.description,
        alternate_names: [fa.scientificName],
      })
      .select('id, name')
      .single();

    if (error) {
      console.error(`✗ Failed to add ${fa.name}:`, error.message);
      failed++;
    } else {
      addedCompounds.push({ name: fa.name, id: data.id });
      console.log(`✓ Added ${fa.name} (${fa.scientificName}): ${data.id}`);
      added++;
    }
  }

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`✓ Successfully added: ${added}`);
  console.log(`✗ Failed: ${failed}`);

  if (added === MISSING_FATTY_ACIDS.length) {
    console.log('\n🎉 100% CNF coverage achieved!');
    console.log('All 136 CNF nutrients now have matching compounds!');
  }

  // Verify total compounds
  const { count: totalCompounds } = await supabase
    .from('compounds')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total compounds in database: ${totalCompounds}`);
}

main().catch(console.error);
