import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';

/**
 * Add Duke Compounds to Nutri
 * Step 4 of SOURCE_MAPPING_GUIDE.md
 *
 * 1. Adds forms (3 compounds with parent relationships)
 * 2. Adds new standalone compounds (428 compounds)
 */

// Valid compound types from db/schema/enums.ts
type CompoundType =
  | 'MACRONUTRIENT'
  | 'VITAMIN'
  | 'MINERAL'
  | 'AMINO_ACID'
  | 'NUCLEOTIDE'
  | 'FATTY_ACID'
  | 'CARBOHYDRATE'
  | 'POLYPHENOL'
  | 'CAROTENOID'
  | 'ALKALOID'
  | 'GLUCOSINOLATE'
  | 'TERPENOID'
  | 'STEROL'
  | 'ORGANIC_ACID'
  | 'MYCOTOXIN'
  | 'PESTICIDE_RESIDUE'
  | 'PLASTICIZER'
  | 'PROCESSING_COMPOUND'
  | 'SYNTHETIC_ADDITIVE'
  | 'ANTI_NUTRIENT';

interface FormCompound {
  dukeId: string;
  name: string;
  type: string;
  parent: string;
}

interface NewCompound {
  dukeId: string;
  name: string;
  type: string;
  healthActs: number;
  plants: number;
}

interface MappingData {
  matched: Array<{ dukeId: string; compoundId: string; compoundName: string }>;
  forms: FormCompound[];
  newCompounds: NewCompound[];
}

function inferCompoundType(name: string, inferredType: string): CompoundType {
  // If the inferred type is already valid, use it
  const validTypes: CompoundType[] = [
    'MACRONUTRIENT', 'VITAMIN', 'MINERAL', 'AMINO_ACID', 'NUCLEOTIDE',
    'FATTY_ACID', 'CARBOHYDRATE', 'POLYPHENOL', 'CAROTENOID', 'ALKALOID',
    'GLUCOSINOLATE', 'TERPENOID', 'STEROL', 'ORGANIC_ACID', 'MYCOTOXIN',
    'PESTICIDE_RESIDUE', 'PLASTICIZER', 'PROCESSING_COMPOUND',
    'SYNTHETIC_ADDITIVE', 'ANTI_NUTRIENT',
  ];

  if (validTypes.includes(inferredType as CompoundType)) {
    return inferredType as CompoundType;
  }

  // Re-infer from name if type is "OTHER" or invalid
  const n = name.toUpperCase();

  // Polyphenols / Flavonoids
  if (/FLAVON|FLAVAN|CATECHIN|QUERCETIN|RUTIN|KAEMPFEROL|LUTEOLIN|APIGENIN|MYRICETIN|ANTHOCYAN|HESPERIDIN|NARINGIN|ISORHAMNETI|CYANIDIN|DELPHINIDIN|PEONIDIN|PETUNIDIN|MALVIDIN|GLYCOSID|OSIDE|CHALCONE/.test(n)) {
    return 'POLYPHENOL';
  }

  // Terpenoids
  if (/TERPENE|TERPINENE|PINENE|LIMONENE|LINALOOL|MENTHOL|CARVONE|THUJONE|CAMPHOR|BORNEOL|CINEOLE|MYRCENE|OCIMENE|PHELLANDRENE|SABINENE|CYMENE|CARYOPHYLLENE|HUMULENE|FARNESENE|BISABOLENE|CADINENE|ELEMENE|GERMACRENE|SELINENE|EUDESMOL|GUAIOL|SPATHULENOL|NEROLIDOL|SQUALENE|PHYTOL|SAPONIN|GINSENOSIDE|GINGEROL|SHOGAOL|BETULIN|AMYRIN|LUPEOL/.test(n)) {
    return 'TERPENOID';
  }

  // Sterols
  if (/STEROL|STEROID|SITOSTEROL|STIGMASTEROL|CAMPESTEROL|BRASSICASTEROL/.test(n)) {
    return 'STEROL';
  }

  // Alkaloids - ending in -ine, -idine, -inine
  if (/INE$|IDINE$|ININE$|BERBER|PALMAT|JATRORRHIZ|COPTISIN/.test(n)) {
    return 'ALKALOID';
  }

  // Organic acids
  if (/ACID$|-ACID|ACIDIC/.test(n)) {
    return 'ORGANIC_ACID';
  }

  // Vitamins
  if (/VITAMIN|RETINOL|TOCOPHEROL|THIAMIN|RIBOFLAVIN|NIACIN|PYRIDOXINE|FOLATE|COBALAMIN|BIOTIN|PANTOTHENIC|ASCORB/.test(n)) {
    return 'VITAMIN';
  }

  // Minerals
  if (/CALCIUM|MAGNESIUM|POTASSIUM|SODIUM|IRON|ZINC|COPPER|MANGANESE|SELENIUM|IODINE|CHROMIUM|MOLYBDENUM|PHOSPHORUS/.test(n)) {
    return 'MINERAL';
  }

  // Amino acids
  if (/AMINO|TRYPTOPHAN|TYROSINE|PHENYLALANINE|LEUCINE|ISOLEUCINE|VALINE|METHIONINE|THREONINE|LYSINE|HISTIDINE|ARGININE|CYSTEINE|GLYCINE|PROLINE|SERINE|ALANINE|ASPARAGINE|ASPARTATE|GLUTAMINE|GLUTAMATE/.test(n)) {
    return 'AMINO_ACID';
  }

  // Carotenoids
  if (/CAROTENE|CAROTENOID|LYCOPENE|LUTEIN|ZEAXANTHIN|CRYPTOXANTHIN|XANTHOPHYLL|ASTAXANTHIN|FUCOXANTHIN/.test(n)) {
    return 'CAROTENOID';
  }

  // Glucosinolates
  if (/GLUCOSINOLATE|SINIGRIN|GLUCORAPHANIN|SULFORAPHANE|ISOTHIOCYANATE/.test(n)) {
    return 'GLUCOSINOLATE';
  }

  // Fatty acids
  if (/FATTY|LINOLEIC|LINOLENIC|OLEIC|PALMITIC|STEARIC|ARACHIDONIC|EPA|DHA|OMEGA/.test(n)) {
    return 'FATTY_ACID';
  }

  // Carbohydrates / Fiber
  if (/FIBER|PECTIN|CELLULOSE|INULIN|FOS|GOS|OLIGOSACCHARIDE|POLYSACCHARIDE/.test(n)) {
    return 'CARBOHYDRATE';
  }

  // Default to POLYPHENOL for phytochemicals (most common in Duke)
  return 'POLYPHENOL';
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  // Load mapping data
  const data: MappingData = JSON.parse(
    fs.readFileSync('data/duke-mapping-data.json', 'utf-8')
  );

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('ADD DUKE COMPOUNDS TO NUTRI - Step 4');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log('Data loaded:');
  console.log('  Already matched: ' + data.matched.length);
  console.log('  Forms to add: ' + data.forms.length);
  console.log('  New compounds to add: ' + data.newCompounds.length);

  // Get existing compounds for lookup
  const existingCompounds = await sql`
    SELECT id, LOWER(name) as name FROM compounds
  `;
  const compoundByName = new Map(existingCompounds.map(c => [c.name, c.id]));

  // Stats
  let formsAdded = 0;
  let formsSkipped = 0;
  let compoundsAdded = 0;
  let compoundsSkipped = 0;

  // ============================================================
  // 1. Add Forms (compounds with parent relationships)
  // ============================================================
  console.log('\n--- Adding Forms (Category B) ---\n');

  for (const form of data.forms) {
    // Check if already exists
    if (compoundByName.has(form.name.toLowerCase())) {
      console.log(`⏭️  ${form.name} (already exists)`);
      formsSkipped++;
      continue;
    }

    // Find parent compound
    const parentId = compoundByName.get(form.parent.toLowerCase());
    if (!parentId) {
      console.log(`❌ ${form.name} - parent "${form.parent}" not found`);
      formsSkipped++;
      continue;
    }

    // Infer proper compound type
    const compoundType = inferCompoundType(form.name, form.type);

    // Insert compound
    const [inserted] = await sql`
      INSERT INTO compounds (
        name,
        compound_type,
        parent_compound_id,
        unit,
        description
      ) VALUES (
        ${form.name},
        ${compoundType},
        ${parentId},
        ${'mg'},
        ${'Form of ' + form.parent + ' from Dr. Duke database'}
      )
      RETURNING id
    `;

    // Track for future lookups
    compoundByName.set(form.name.toLowerCase(), inserted.id);

    console.log(`✅ ${form.name} → parent: ${form.parent} (${compoundType})`);
    formsAdded++;
  }

  // ============================================================
  // 2. Add New Standalone Compounds (Category C)
  // ============================================================
  console.log('\n--- Adding New Compounds (Category C) ---\n');

  // Sort by health activities (most valuable first)
  const sortedNew = [...data.newCompounds].sort((a, b) => b.healthActs - a.healthActs);

  for (const compound of sortedNew) {
    // Check if already exists
    if (compoundByName.has(compound.name.toLowerCase())) {
      console.log(`⏭️  ${compound.name} (already exists)`);
      compoundsSkipped++;
      continue;
    }

    // Infer proper compound type
    const compoundType = inferCompoundType(compound.name, compound.type);

    // Insert compound
    const [inserted] = await sql`
      INSERT INTO compounds (
        name,
        compound_type,
        unit,
        description
      ) VALUES (
        ${compound.name},
        ${compoundType},
        ${'mg'},
        ${'Phytochemical from Dr. Duke database with ' + compound.healthActs + ' health activities, found in ' + compound.plants + ' plants'}
      )
      RETURNING id
    `;

    // Track for future lookups
    compoundByName.set(compound.name.toLowerCase(), inserted.id);

    console.log(`✅ ${compound.name} (${compoundType}) - ${compound.healthActs} health acts`);
    compoundsAdded++;
  }

  // ============================================================
  // Summary
  // ============================================================
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log('Forms:');
  console.log('  Added: ' + formsAdded);
  console.log('  Skipped: ' + formsSkipped);

  console.log('\nNew Compounds:');
  console.log('  Added: ' + compoundsAdded);
  console.log('  Skipped: ' + compoundsSkipped);

  console.log('\nTotal Added: ' + (formsAdded + compoundsAdded));

  // Get new total
  const [{ count }] = await sql`SELECT COUNT(*) as count FROM compounds`;
  console.log('Total Compounds in Database: ' + count);

  await sql.end();
}

main().catch(console.error);
