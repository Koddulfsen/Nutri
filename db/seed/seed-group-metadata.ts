/**
 * Seed Group Metadata
 *
 * Populates compound_types, compound_names, and representative_compound fields
 * on compound_groups table to match the frontend hierarchy structure.
 */

import 'dotenv/config';
import { supabase } from '../supabase-client';

// Group metadata matching the hardcoded COMPOUND_HIERARCHY in AnalysisClient.tsx
const GROUP_METADATA: Record<string, {
  compoundTypes?: string[];
  compoundNames?: string[];
  representativeCompound?: string;
}> = {
  // Top-level groups with representative macros
  'Carbohydrates': {
    compoundTypes: ['CARBOHYDRATE'],
    representativeCompound: 'Total Carbohydrate',
  },
  'Fats': {
    compoundTypes: ['FATTY_ACID'],
    representativeCompound: 'Total Fat',
  },
  'Proteins': {
    compoundTypes: ['AMINO_ACID'],
    representativeCompound: 'Protein',
  },
  'Vitamins': {
    compoundTypes: ['VITAMIN'],
  },
  'Minerals': {
    compoundTypes: ['MINERAL'],
  },
  'Phytonutrients': {
    compoundTypes: ['POLYPHENOL', 'CAROTENOID', 'GLUCOSINOLATE', 'TERPENOID'],
  },
  'Other Compounds': {
    compoundTypes: ['ALKALOID', 'NUCLEOTIDE', 'ANTI_NUTRIENT'],
  },
  'Safety Compounds': {
    compoundTypes: ['PROCESSING_COMPOUND', 'MYCOTOXIN', 'PESTICIDE_RESIDUE', 'PLASTICIZER', 'SYNTHETIC_ADDITIVE'],
  },

  // Carbohydrate children
  'Sugars': {
    compoundTypes: ['CARBOHYDRATE'],
    compoundNames: ['Total Sugars', 'Glucose', 'Fructose', 'Galactose', 'Sucrose', 'Lactose', 'Maltose'],
    representativeCompound: 'Total Sugars',
  },
  'Fiber': {
    compoundTypes: ['CARBOHYDRATE'],
    compoundNames: ['Total Fiber', 'Soluble Fiber', 'Insoluble Fiber', 'Inulin'],
    representativeCompound: 'Total Fiber',
  },
  'Starches': {
    compoundTypes: ['CARBOHYDRATE'],
    compoundNames: ['Resistant Starch'],
  },
  'Sugar Alcohols': {
    compoundTypes: ['CARBOHYDRATE'],
    compoundNames: ['Sorbitol', 'Mannitol'],
  },

  // Fat children
  'Saturated Fatty Acids': {
    compoundTypes: ['FATTY_ACID'],
    compoundNames: ['Saturated Fat', 'Butyric Acid', 'Capric Acid', 'Caprylic Acid', 'Lauric Acid', 'Myristic Acid', 'Palmitic Acid', 'Stearic Acid'],
    representativeCompound: 'Saturated Fat',
  },
  'Monounsaturated Fatty Acids': {
    compoundTypes: ['FATTY_ACID'],
    compoundNames: ['Monounsaturated Fat', 'Oleic Acid', 'Palmitoleic Acid'],
    representativeCompound: 'Monounsaturated Fat',
  },
  'Polyunsaturated Fatty Acids': {
    compoundTypes: ['FATTY_ACID'],
    compoundNames: ['Polyunsaturated Fat'],
    representativeCompound: 'Polyunsaturated Fat',
  },
  'Trans Fatty Acids': {
    compoundTypes: ['FATTY_ACID'],
    compoundNames: ['Trans Fat', 'Elaidic Acid'],
    representativeCompound: 'Trans Fat',
  },
  'Sterols': {
    compoundTypes: ['FATTY_ACID'],
    compoundNames: ['Cholesterol'],
  },
  'Omega-3 Fatty Acids': {
    compoundTypes: ['FATTY_ACID'],
    compoundNames: ['Omega-3 Fatty Acids', 'Alpha-Linolenic Acid', 'Eicosapentaenoic Acid', 'Docosahexaenoic Acid', 'Docosapentaenoic Acid'],
    representativeCompound: 'Omega-3 Fatty Acids',
  },
  'Omega-6 Fatty Acids': {
    compoundTypes: ['FATTY_ACID'],
    compoundNames: ['Omega-6 Fatty Acids', 'Linoleic Acid', 'Arachidonic Acid', 'Gamma-Linolenic Acid'],
    representativeCompound: 'Omega-6 Fatty Acids',
  },

  // Protein children
  'Essential Amino Acids': {
    compoundTypes: ['AMINO_ACID'],
    compoundNames: ['Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine', 'Phenylalanine', 'Threonine', 'Tryptophan', 'Valine'],
  },
  'Non-Essential Amino Acids': {
    compoundTypes: ['AMINO_ACID'],
    compoundNames: ['Alanine', 'Asparagine', 'Aspartic Acid', 'Glutamic Acid', 'Serine'],
  },
  'Conditionally Essential Amino Acids': {
    compoundTypes: ['AMINO_ACID'],
    compoundNames: ['Arginine', 'Cysteine', 'Glutamine', 'Glycine', 'Proline', 'Tyrosine'],
  },
  'Other Amino Compounds': {
    compoundTypes: ['AMINO_ACID'],
    compoundNames: ['Taurine', 'Carnitine', 'Creatine', 'Beta-Alanine'],
  },

  // Vitamin children
  'Fat-Soluble Vitamins': {
    compoundTypes: ['VITAMIN'],
  },
  'Water-Soluble Vitamins': {
    compoundTypes: ['VITAMIN'],
  },
  'Vitamin-Like Compounds': {
    compoundTypes: ['VITAMIN'],
    compoundNames: ['Choline', 'Inositol', 'Lipoic Acid'],
  },
  'Vitamin A': {
    compoundTypes: ['VITAMIN'],
    compoundNames: ['Vitamin A', 'Retinol', 'Beta-Carotene'],
    representativeCompound: 'Vitamin A',
  },
  'Vitamin D': {
    compoundTypes: ['VITAMIN'],
    compoundNames: ['Vitamin D', 'Vitamin D2', 'Vitamin D3'],
    representativeCompound: 'Vitamin D',
  },
  'Vitamin E': {
    compoundTypes: ['VITAMIN'],
    compoundNames: ['Vitamin E', 'Alpha-Tocopherol', 'Gamma-Tocopherol'],
    representativeCompound: 'Vitamin E',
  },
  'Vitamin K': {
    compoundTypes: ['VITAMIN'],
    compoundNames: ['Vitamin K', 'Vitamin K1', 'Vitamin K2'],
    representativeCompound: 'Vitamin K',
  },
  'B-Complex Vitamins': {
    compoundTypes: ['VITAMIN'],
    compoundNames: ['Thiamin', 'Riboflavin', 'Niacin', 'Pantothenic Acid', 'Vitamin B6', 'Biotin', 'Folate', 'Vitamin B12'],
  },
  'Vitamin C': {
    compoundTypes: ['VITAMIN'],
    compoundNames: ['Vitamin C'],
    representativeCompound: 'Vitamin C',
  },

  // Mineral children
  'Macro Minerals': {
    compoundTypes: ['MINERAL'],
    compoundNames: ['Calcium', 'Phosphorus', 'Magnesium', 'Sodium', 'Potassium', 'Chloride', 'Sulfur'],
  },
  'Trace Minerals': {
    compoundTypes: ['MINERAL'],
    compoundNames: ['Iron', 'Zinc', 'Copper', 'Manganese', 'Selenium', 'Iodine', 'Molybdenum', 'Chromium', 'Fluoride'],
  },

  // Phytonutrient children
  'Polyphenols': {
    compoundTypes: ['POLYPHENOL'],
  },
  'Carotenoids': {
    compoundTypes: ['CAROTENOID'],
  },
  'Glucosinolates': {
    compoundTypes: ['GLUCOSINOLATE'],
  },
  'Terpenoids': {
    compoundTypes: ['TERPENOID'],
  },

  // Other compound children
  'Alkaloids': {
    compoundTypes: ['ALKALOID'],
  },
  'Nucleotides': {
    compoundTypes: ['NUCLEOTIDE'],
  },
  'Anti-Nutrients': {
    compoundTypes: ['ANTI_NUTRIENT'],
  },

  // Safety compound children
  'Processing Compounds': {
    compoundTypes: ['PROCESSING_COMPOUND'],
  },
  'Mycotoxins': {
    compoundTypes: ['MYCOTOXIN'],
  },
  'Pesticide Residues': {
    compoundTypes: ['PESTICIDE_RESIDUE'],
  },
  'Plasticizers': {
    compoundTypes: ['PLASTICIZER'],
  },
  'Synthetic Additives': {
    compoundTypes: ['SYNTHETIC_ADDITIVE'],
  },
};

export async function seedGroupMetadata() {
  console.log('\n🌱 Starting Group Metadata seed...\n');

  let updatedCount = 0;
  let notFoundCount = 0;

  for (const [groupName, metadata] of Object.entries(GROUP_METADATA)) {
    const { data, error } = await supabase
      .from('compound_groups')
      .update({
        compound_types: metadata.compoundTypes || [],
        compound_names: metadata.compoundNames || [],
        representative_compound: metadata.representativeCompound || null,
      })
      .eq('name', groupName)
      .select('id');

    if (error) {
      console.log(`   ⚠️  Error updating ${groupName}: ${error.message}`);
    } else if (!data || data.length === 0) {
      console.log(`   ⚠️  Group not found: ${groupName}`);
      notFoundCount++;
    } else {
      updatedCount++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Group Metadata seed complete!`);
  console.log(`📊 Updated: ${updatedCount} groups`);
  console.log(`⚠️  Not found: ${notFoundCount} groups`);
  console.log('═'.repeat(60) + '\n');

  return updatedCount;
}

if (require.main === module) {
  seedGroupMetadata()
    .then((count) => {
      console.log(`✨ Seed script completed: ${count} groups updated`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed script failed:', error);
      process.exit(1);
    });
}

export default seedGroupMetadata;
