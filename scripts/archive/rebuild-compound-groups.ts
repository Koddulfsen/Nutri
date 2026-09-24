/**
 * Rebuild Compound Groups from Core Compounds
 *
 * Creates a fresh hierarchy based on the 188 core compounds.
 * Uses exact compound names from the database.
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

// Group definitions with exact compound names from our core
const GROUP_HIERARCHY = {
  // ============================================================================
  // CARBOHYDRATES (Level 0)
  // ============================================================================
  'Carbohydrates': {
    icon: '🍞',
    level: 0,
    representative: 'Carbohydrates',
    compounds: ['Carbohydrates'],
    children: {
      'Sugars': {
        level: 1,
        representative: 'Total Sugars',
        compounds: ['Total Sugars', 'Glucose', 'Fructose', 'Galactose', 'Sucrose', 'Lactose', 'Maltose'],
      },
      'Sugar Alcohols': {
        level: 1,
        compounds: ['Erythritol', 'Mannitol', 'Sorbitol', 'Xylitol', 'Maltitol', 'Lactitol'],
      },
      'Fiber': {
        level: 1,
        representative: 'Dietary Fiber',
        compounds: ['Dietary Fiber', 'Soluble Fiber', 'Insoluble Fiber', 'Beta-Glucan', 'Pectin', 'Inulin', 'Resistant Starch'],
      },
      'Starches': {
        level: 1,
        representative: 'Starch',
        compounds: ['Starch', 'Resistant Starch'],
      },
    },
  },

  // ============================================================================
  // FATS (Level 0)
  // ============================================================================
  'Fats': {
    icon: '🧈',
    level: 0,
    representative: 'Total Fat',
    compounds: ['Total Fat'],
    children: {
      'Saturated Fatty Acids': {
        level: 1,
        representative: 'Saturated Fat',
        compounds: ['Saturated Fat', 'Butyric Acid', 'Caproic Acid', 'Caprylic Acid', 'Capric Acid', 'Lauric Acid', 'Myristic Acid', 'Palmitic Acid', 'Stearic Acid', 'Arachidic Acid', 'Behenic Acid', 'Lignoceric Acid'],
      },
      'Monounsaturated Fatty Acids': {
        level: 1,
        representative: 'Monounsaturated Fat',
        compounds: ['Monounsaturated Fat', 'Oleic Acid', 'Palmitoleic Acid', 'Erucic Acid', 'Vaccenic Acid (cis)', 'Mead Acid'],
      },
      'Polyunsaturated Fatty Acids': {
        level: 1,
        children: {
          'Omega-3 Fatty Acids': {
            level: 2,
            representative: 'Omega-3',
            compounds: ['Omega-3', 'ALA', 'EPA', 'DHA', 'DPA', 'SDA'],
          },
          'Omega-6 Fatty Acids': {
            level: 2,
            representative: 'Omega-6',
            compounds: ['Omega-6', 'LA', 'GLA', 'DGLA', 'AA', 'DTA'],
          },
        },
      },
      'Trans Fatty Acids': {
        level: 1,
        representative: 'Trans Fat',
        compounds: ['Trans Fat', 'Vaccenic Acid (trans)', 'CLA'],
      },
      'Sterols': {
        level: 1,
        compounds: ['Cholesterol'],
      },
    },
  },

  // ============================================================================
  // PROTEINS (Level 0)
  // ============================================================================
  'Proteins': {
    icon: '🥩',
    level: 0,
    representative: 'Protein',
    compounds: ['Protein'],
    children: {
      'Essential Amino Acids': {
        level: 1,
        compounds: ['Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine', 'Phenylalanine', 'Threonine', 'Tryptophan', 'Valine'],
      },
      'Non-Essential Amino Acids': {
        level: 1,
        compounds: ['Alanine', 'Asparagine', 'Aspartic Acid', 'Glutamic Acid', 'Serine'],
      },
      'Conditionally Essential Amino Acids': {
        level: 1,
        compounds: ['Arginine', 'Cysteine', 'Glutamine', 'Glycine', 'Proline', 'Tyrosine'],
      },
    },
  },

  // ============================================================================
  // OTHER MACROS (Level 0)
  // ============================================================================
  'Other Macros': {
    icon: '⚡',
    level: 0,
    representative: 'Energy',
    compounds: ['Energy', 'Water', 'Ethanol', 'Added Sugars'],
  },

  // ============================================================================
  // VITAMINS (Level 0)
  // ============================================================================
  'Vitamins': {
    icon: '💊',
    level: 0,
    children: {
      'Fat-Soluble Vitamins': {
        level: 1,
        children: {
          'Vitamin A': {
            level: 2,
            representative: 'Vitamin A (RAE)',
            compounds: ['Vitamin A (RAE)', 'Retinol', 'Retinal', 'Retinoic Acid', 'Alpha-Carotene', 'Beta-Carotene', 'Beta-Cryptoxanthin'],
          },
          'Vitamin D': {
            level: 2,
            representative: 'Vitamin D (Total)',
            compounds: ['Vitamin D (Total)', 'Vitamin D2 (Ergocalciferol)', 'Vitamin D3 (Cholecalciferol)'],
          },
          'Vitamin E': {
            level: 2,
            representative: 'Vitamin E (Total)',
            compounds: ['Vitamin E (Total)', 'Alpha-Tocopherol', 'Beta-Tocopherol', 'Gamma-Tocopherol', 'Delta-Tocopherol', 'Alpha-Tocotrienol', 'Beta-Tocotrienol', 'Gamma-Tocotrienol', 'Delta-Tocotrienol'],
          },
          'Vitamin K': {
            level: 2,
            representative: 'Vitamin K (Total)',
            compounds: ['Vitamin K (Total)', 'Vitamin K1 (Phylloquinone)', 'Vitamin K2 MK-4', 'Vitamin K2 MK-7', 'Vitamin K2 MK-9'],
          },
        },
      },
      'Water-Soluble Vitamins': {
        level: 1,
        children: {
          'B-Complex Vitamins': {
            level: 2,
            children: {
              'Vitamin B1 (Thiamin)': {
                level: 3,
                representative: 'Thiamin (B1)',
                compounds: ['Thiamin (B1)', 'Thiamin HCl', 'Thiamin Mononitrate'],
              },
              'Vitamin B2 (Riboflavin)': {
                level: 3,
                representative: 'Riboflavin (B2)',
                compounds: ['Riboflavin (B2)', 'Riboflavin-5-Phosphate (R5P)'],
              },
              'Vitamin B3 (Niacin)': {
                level: 3,
                representative: 'Niacin (B3)',
                compounds: ['Niacin (B3)', 'Nicotinic Acid', 'Nicotinamide', 'Nicotinamide Riboside (NR)'],
              },
              'Vitamin B5 (Pantothenic Acid)': {
                level: 3,
                representative: 'Pantothenic Acid (B5)',
                compounds: ['Pantothenic Acid (B5)', 'Calcium Pantothenate', 'Dexpanthenol', 'Pantetheine'],
              },
              'Vitamin B6': {
                level: 3,
                representative: 'Vitamin B6',
                compounds: ['Vitamin B6', 'Pyridoxine', 'Pyridoxal', 'Pyridoxamine', 'Pyridoxal-5-Phosphate (P5P)'],
              },
              'Vitamin B7 (Biotin)': {
                level: 3,
                representative: 'Biotin (B7)',
                compounds: ['Biotin (B7)'],
              },
              'Vitamin B9 (Folate)': {
                level: 3,
                representative: 'Folate (Total)',
                compounds: ['Folate (Total)', 'Folic Acid (Synthetic)', 'Food Folate (Natural)', '5-MTHF (Methylfolate)', 'Folinic Acid'],
              },
              'Vitamin B12': {
                level: 3,
                representative: 'Vitamin B12 (Total)',
                compounds: ['Vitamin B12 (Total)', 'Cyanocobalamin', 'Methylcobalamin', 'Hydroxocobalamin', 'Adenosylcobalamin'],
              },
            },
          },
          'Vitamin C': {
            level: 2,
            representative: 'Vitamin C (Total)',
            compounds: ['Vitamin C (Total)', 'Ascorbic Acid', 'Dehydroascorbic Acid'],
          },
          'Choline': {
            level: 2,
            representative: 'Choline (Total)',
            compounds: ['Choline (Total)', 'Free Choline', 'Phosphatidylcholine', 'CDP-Choline (Citicoline)'],
          },
        },
      },
    },
  },

  // ============================================================================
  // MINERALS (Level 0)
  // ============================================================================
  'Minerals': {
    icon: '💎',
    level: 0,
    children: {
      'Macro Minerals': {
        level: 1,
        children: {
          'Calcium (Total)': {
            level: 2,
            representative: 'Calcium (Total)',
            compounds: ['Calcium (Total)', 'Calcium Carbonate', 'Calcium Citrate', 'Calcium Phosphate'],
          },
          'Magnesium (Total)': {
            level: 2,
            representative: 'Magnesium (Total)',
            compounds: ['Magnesium (Total)', 'Magnesium Oxide'],
          },
          'Other Macro Minerals': {
            level: 2,
            compounds: ['Phosphorus', 'Sodium', 'Potassium', 'Chloride', 'Sulfur'],
          },
        },
      },
      'Trace Minerals': {
        level: 1,
        children: {
          'Iron (Total)': {
            level: 2,
            representative: 'Iron (Total)',
            compounds: ['Iron (Total)', 'Heme Iron', 'Non-Heme Iron'],
          },
          'Zinc (Total)': {
            level: 2,
            representative: 'Zinc (Total)',
            compounds: ['Zinc (Total)', 'Zinc Sulfate'],
          },
          'Selenium (Total)': {
            level: 2,
            representative: 'Selenium (Total)',
            compounds: ['Selenium (Total)', 'Selenomethionine', 'Sodium Selenite'],
          },
          'Other Trace Minerals': {
            level: 2,
            compounds: ['Copper', 'Manganese', 'Iodine', 'Fluoride', 'Chromium (Total)', 'Molybdenum', 'Boron', 'Silicon', 'Cobalt (Co)'],
          },
        },
      },
    },
  },

  // ============================================================================
  // HEAVY METALS (Level 0)
  // ============================================================================
  'Heavy Metals': {
    icon: '⚠️',
    level: 0,
    compounds: ['Lead (Pb)', 'Mercury (Hg) - Total', 'Cadmium (Cd)', 'Arsenic (As) - Total', 'Inorganic Arsenic', 'Organic Arsenic', 'Aluminum (Al)', 'Nickel (Ni)', 'Tin (Sn)', 'Uranium (U)', 'Antimony (Sb)'],
  },

  // ============================================================================
  // ALKALOIDS (Level 0)
  // ============================================================================
  'Alkaloids': {
    icon: '☕',
    level: 0,
    compounds: ['Caffeine', 'Theobromine', 'Theophylline'],
  },

  // ============================================================================
  // SYNTHETIC ADDITIVES (Level 0)
  // ============================================================================
  'Synthetic Additives': {
    icon: '🧪',
    level: 0,
    compounds: ['Acesulfame-K', 'Aspartame', 'Saccharin', 'Stevia (Steviol Glycosides)'],
  },
};

interface GroupDef {
  icon?: string;
  level: number;
  representative?: string;
  compounds?: string[];
  children?: Record<string, GroupDef>;
}

async function main() {
  console.log('Rebuilding compound_groups...\n');

  // Get all core compounds for validation
  const coreCompounds = await sql`SELECT name FROM compounds WHERE tier = 'core'`;
  const coreNames = new Set(coreCompounds.map(c => c.name));

  console.log(`Found ${coreNames.size} core compounds\n`);

  // Clear existing groups
  await sql`DELETE FROM compound_groups`;
  console.log('Cleared existing compound_groups\n');

  let displayOrder = 0;
  const insertedGroups: Map<string, string> = new Map(); // name -> id

  async function insertGroup(
    name: string,
    def: GroupDef,
    parentId: string | null
  ): Promise<string> {
    // Validate compound names
    const validCompounds = (def.compounds || []).filter(c => {
      if (!coreNames.has(c)) {
        console.log(`  ⚠ Compound not found: "${c}"`);
        return false;
      }
      return true;
    });

    // Validate representative
    let representative = def.representative;
    if (representative && !coreNames.has(representative)) {
      console.log(`  ⚠ Representative not found: "${representative}"`);
      representative = undefined;
    }

    const result = await sql`
      INSERT INTO compound_groups (
        name, slug, icon, level, compound_names, compound_types,
        representative_compound, has_dv, parent_group_id, display_order
      ) VALUES (
        ${name},
        ${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')},
        ${def.icon || null},
        ${def.level},
        ${validCompounds.length > 0 ? validCompounds : null},
        ${null},
        ${representative || null},
        ${false},
        ${parentId},
        ${displayOrder++}
      )
      RETURNING id
    `;

    const groupId = result[0].id;
    insertedGroups.set(name, groupId);

    const compoundCount = validCompounds.length;
    console.log(`+ ${name} (level ${def.level}, ${compoundCount} compounds)`);

    // Insert children recursively
    if (def.children) {
      for (const [childName, childDef] of Object.entries(def.children)) {
        await insertGroup(childName, childDef, groupId);
      }
    }

    return groupId;
  }

  // Insert all groups
  for (const [name, def] of Object.entries(GROUP_HIERARCHY)) {
    await insertGroup(name, def as GroupDef, null);
  }

  console.log(`\n✓ Inserted ${insertedGroups.size} groups`);

  // Verify coverage
  const groupCompoundNames = await sql`
    SELECT DISTINCT unnest(compound_names) as name
    FROM compound_groups
    WHERE compound_names IS NOT NULL
  `;
  const coveredNames = new Set(groupCompoundNames.map(r => r.name));

  const uncovered = [...coreNames].filter(n => !coveredNames.has(n));
  if (uncovered.length > 0) {
    console.log(`\n⚠ ${uncovered.length} compounds not in any group:`);
    uncovered.forEach(n => console.log(`  - ${n}`));
  } else {
    console.log('\n✓ All core compounds are in groups');
  }

  await sql.end();
}

main().catch(console.error);
