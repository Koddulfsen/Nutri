/**
 * Cleanup Duplicate Compounds
 *
 * Merges alternate names and deletes duplicate compound entries.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CleanupAction {
  description: string;
  keepId: string;
  deleteId: string;
  mergeAltNames?: string[];
}

const cleanupActions: CleanupAction[] = [
  // 1. Betaine (VITAMIN vs ALKALOID)
  {
    description: 'Betaine: Keep VITAMIN entry, delete ALKALOID duplicate',
    keepId: '86f94319-b3fa-4791-95fa-285da9ffebef',
    deleteId: 'e60458f6-aa70-4c88-99ff-edd92c064a38',
  },

  // 2. Choline (two VITAMIN entries)
  {
    description: 'Choline: Merge entries, keep one with "Choline Total"',
    keepId: '17dea975-ae4d-4b90-804d-516bf79e3b33',
    deleteId: 'cec973e2-3b91-483a-a918-ebd7dfb7d8c1',
    mergeAltNames: ['Trimethylethanolamine'],
  },

  // 3. Phytic Acid / Inositol Hexaphosphate
  {
    description: 'Phytic Acid: Keep ANTI_NUTRIENT, delete VITAMIN duplicate',
    keepId: 'a4750338-0c19-43e4-8efb-40a244bb8267',
    deleteId: '548fc866-1da4-481e-b552-70270fe0a5f6',
  },

  // 4. PHA / Phytohemagglutinin
  {
    description: 'PHA: Merge Phytohemagglutinin as alternate name',
    keepId: 'ebb4e134-5433-44eb-a25c-5d8ec9a93a2e',
    deleteId: '290097c4-d3a6-453d-b51b-f9babfa48a4b',
    mergeAltNames: ['Phytohemagglutinin'],
  },

  // 5. Nervonic Acid (two entries)
  {
    description: 'Nervonic Acid: Merge entries',
    keepId: '56ac6711-d5af-4209-bea8-64ee9a858368',
    deleteId: '2db8159d-ff3f-402f-8898-ebcfdaaa6f2c',
    mergeAltNames: ['24:1c'],
  },

  // 6. Omega-3 Fatty Acids (two entries)
  {
    description: 'Omega-3 Fatty Acids: Merge entries',
    keepId: '72f36c9e-9e9a-454a-bedd-695053016030',
    deleteId: '3babc195-d323-4006-bc46-6a47710de735',
    mergeAltNames: ['n-3 PUFA'],
  },

  // 7. Omega-6 Fatty Acids (two entries)
  {
    description: 'Omega-6 Fatty Acids: Merge entries',
    keepId: '0f02efed-2137-4894-b455-7ec396be6837',
    deleteId: '10549d09-0f33-4c55-b99d-e1dc7bec0c70',
    mergeAltNames: ['n-6 PUFA'],
  },

  // 8. Alpha-Linolenic Acid
  {
    description: 'Alpha-Linolenic Acid: Merge (ALA) variant',
    keepId: '5b8eb357-ab2b-4b2e-b6d2-c0296214bf18',
    deleteId: 'ec578dfd-3d7d-4e6d-96be-34826cf0f1c6',
    mergeAltNames: ['18:3n3cccn-3'],
  },

  // 9. Arachidonic Acid
  {
    description: 'Arachidonic Acid: Merge (AA) variant',
    keepId: '92fe8ae4-6d8b-44ef-a88e-410062f1fd53',
    deleteId: 'f335d7e9-68df-4de8-b2f6-0866c0407d33',
  },

  // 10. Dihomo-gamma-linolenic Acid
  {
    description: 'Dihomo-gamma-linolenic Acid: Merge (DGLA) variant',
    keepId: '9e8db768-4841-4263-b7cb-314d21214bc8',
    deleteId: '7d8519e5-d8bc-41b3-8fe2-3d677796110f',
  },

  // 11. Docosatetraenoic Acid
  {
    description: 'Docosatetraenoic Acid: Merge (omega-6) variant',
    keepId: '87b7cece-3820-4ac2-b4a1-5ab0648cf229',
    deleteId: '0ae7e88b-d447-4a5d-880b-bfdc18c0bf0d',
  },

  // 12. Gamma-Linolenic Acid
  {
    description: 'Gamma-Linolenic Acid: Merge (GLA) variant',
    keepId: '43b828df-a3b2-4df3-8a04-c4da36c768a6',
    deleteId: '3cbfa4ce-aa71-48d3-b484-646ac93773f7',
  },

  // 13. Eicosenoic Acid / Gadoleic Acid
  {
    description: 'Eicosenoic/Gadoleic Acid: Merge as same compound',
    keepId: 'cc2a8bdd-b6d9-4ca0-9143-4e65dfb717e7',
    deleteId: '5dc2d5ef-a947-401f-b725-11bf3570004d',
    mergeAltNames: ['Gadoleic Acid', '20:1 n-9'],
  },
];

async function main() {
  console.log('Cleaning up duplicate compounds...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const action of cleanupActions) {
    console.log(`Processing: ${action.description}`);

    try {
      // Step 1: Get current compound to keep
      const { data: keepCompound, error: fetchError } = await supabase
        .from('compounds')
        .select('id, name, alternate_names')
        .eq('id', action.keepId)
        .single();

      if (fetchError || !keepCompound) {
        console.log(`  ERROR: Could not find compound to keep: ${action.keepId}`);
        errorCount++;
        continue;
      }

      // Step 2: Merge alternate names if needed
      if (action.mergeAltNames && action.mergeAltNames.length > 0) {
        const currentAltNames = keepCompound.alternate_names || [];
        const newAltNames = [...new Set([...currentAltNames, ...action.mergeAltNames])];

        const { error: updateError } = await supabase
          .from('compounds')
          .update({ alternate_names: newAltNames })
          .eq('id', action.keepId);

        if (updateError) {
          console.log(`  ERROR updating alternate names: ${updateError.message}`);
          errorCount++;
          continue;
        }
        console.log(`  Merged alt names: ${action.mergeAltNames.join(', ')}`);
      }

      // Step 3: Check for compound_sources referencing the duplicate
      const { data: sources } = await supabase
        .from('compound_sources')
        .select('id')
        .eq('compound_id', action.deleteId);

      if (sources && sources.length > 0) {
        // Move sources to the kept compound
        const { error: moveError } = await supabase
          .from('compound_sources')
          .update({ compound_id: action.keepId })
          .eq('compound_id', action.deleteId);

        if (moveError) {
          console.log(`  ERROR moving sources: ${moveError.message}`);
          errorCount++;
          continue;
        }
        console.log(`  Moved ${sources.length} source mappings`);
      }

      // Step 4: Delete the duplicate
      const { error: deleteError } = await supabase
        .from('compounds')
        .delete()
        .eq('id', action.deleteId);

      if (deleteError) {
        console.log(`  ERROR deleting duplicate: ${deleteError.message}`);
        errorCount++;
        continue;
      }

      console.log(`  Deleted duplicate: ${action.deleteId}`);
      successCount++;

    } catch (err) {
      console.log(`  EXCEPTION: ${err}`);
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log('CLEANUP SUMMARY');
  console.log('========================================');
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);

  // Verify final count
  const { count } = await supabase
    .from('compounds')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal compounds remaining: ${count}`);
  console.log(`Expected: 368 - 13 = 355`);
}

main().catch(console.error);
