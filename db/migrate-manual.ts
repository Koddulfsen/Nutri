import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const client = postgres(process.env.DATABASE_URL!);

async function migrate() {
  try {
    console.log('🔄 Starting manual migration...\n');

    // 1. Create risk_level_enum
    console.log('Creating risk_level_enum...');
    await client.unsafe(`
      DO $$ BEGIN
        CREATE TYPE risk_level_enum AS ENUM('MINIMAL', 'LOW', 'MODERATE', 'HIGH');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ risk_level_enum created\n');

    // 2. Create food_compound_flags table
    console.log('Creating food_compound_flags table...');
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS food_compound_flags (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        food_id uuid NOT NULL,
        compound_id uuid NOT NULL,
        risk_level risk_level_enum NOT NULL,
        detection_frequency real,
        source text NOT NULL,
        notes text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log('✅ food_compound_flags table created\n');

    // 3. Add foreign keys
    console.log('Adding foreign key constraints...');
    await client.unsafe(`
      DO $$ BEGIN
        ALTER TABLE food_compound_flags
        ADD CONSTRAINT food_compound_flags_food_id_foods_id_fk
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE cascade;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.unsafe(`
      DO $$ BEGIN
        ALTER TABLE food_compound_flags
        ADD CONSTRAINT food_compound_flags_compound_id_compounds_id_fk
        FOREIGN KEY (compound_id) REFERENCES compounds(id) ON DELETE restrict;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Foreign keys added\n');

    // 4. Create indexes
    console.log('Creating indexes...');
    await client.unsafe(`CREATE INDEX IF NOT EXISTS idx_food_compound_flags_food ON food_compound_flags (food_id);`);
    await client.unsafe(`CREATE INDEX IF NOT EXISTS idx_food_compound_flags_compound ON food_compound_flags (compound_id);`);
    await client.unsafe(`CREATE INDEX IF NOT EXISTS idx_food_compound_flags_risk ON food_compound_flags (risk_level);`);
    console.log('✅ Indexes created\n');

    // 5. Update compound_type_enum (most complex step)
    console.log('Updating compound_type_enum with new categories...');
    await client.unsafe(`ALTER TABLE compounds ALTER COLUMN compound_type TYPE text;`);
    console.log('  - Converted compound_type to text');

    // Migrate old PERFORMANCE_COMPOUND values
    const performanceResult = await client.unsafe(`
      UPDATE compounds
      SET compound_type = CASE
        WHEN name IN ('Caffeine', 'Theobromine', 'Theophylline') THEN 'ALKALOID'
        WHEN name IN ('Beta-Alanine', 'Creatine', 'Carnitine', 'Carnosine', 'Citrulline', 'Ornithine', 'Anserine', 'Hydroxyproline', 'Acetyl-L-Carnitine') THEN 'AMINO_ACID'
        ELSE 'PROCESSING_COMPOUND'
      END
      WHERE compound_type = 'PERFORMANCE_COMPOUND'
      RETURNING name, compound_type;
    `);
    if (performanceResult.count > 0) {
      console.log(`  - Migrated ${performanceResult.count} PERFORMANCE_COMPOUND values to new categories`);
    }

    // Migrate old NICHE_HEALTH values (likely alkaloids or anti-nutrients)
    const nicheResult = await client.unsafe(`
      UPDATE compounds
      SET compound_type = CASE
        WHEN name IN ('Solanine', 'Chaconine', 'Tomatine', 'Capsaicin', 'Piperine', 'Histamine', 'Tyramine', 'Putrescine', 'Cadaverine') THEN 'ALKALOID'
        WHEN name LIKE '%Inhibitor%' OR name IN ('Phytic Acid', 'Oxalic Acid', 'Tannic Acid', 'Saponins', 'Goitrin') THEN 'ANTI_NUTRIENT'
        ELSE 'PROCESSING_COMPOUND'
      END
      WHERE compound_type = 'NICHE_HEALTH'
      RETURNING name, compound_type;
    `);
    if (nicheResult.count > 0) {
      console.log(`  - Migrated ${nicheResult.count} NICHE_HEALTH values to new categories`);
    }

    await client.unsafe(`DROP TYPE IF EXISTS compound_type_enum;`);
    console.log('  - Dropped old enum');

    await client.unsafe(`
      CREATE TYPE compound_type_enum AS ENUM(
        'VITAMIN',
        'MINERAL',
        'AMINO_ACID',
        'NUCLEOTIDE',
        'FATTY_ACID',
        'CARBOHYDRATE',
        'POLYPHENOL',
        'CAROTENOID',
        'ALKALOID',
        'GLUCOSINOLATE',
        'TERPENOID',
        'MYCOTOXIN',
        'PESTICIDE_RESIDUE',
        'PLASTICIZER',
        'PROCESSING_COMPOUND',
        'SYNTHETIC_ADDITIVE',
        'ANTI_NUTRIENT'
      );
    `);
    console.log('  - Created new enum with 17 categories (added 5 new)');

    await client.unsafe(`ALTER TABLE compounds ALTER COLUMN compound_type TYPE compound_type_enum USING compound_type::compound_type_enum;`);
    console.log('✅ compound_type_enum updated\n');

    console.log('🎉 Migration complete!\n');
    console.log('New categories added:');
    console.log('  - NUCLEOTIDE (purines, uric acid)');
    console.log('  - ALKALOID (caffeine, histamine, glycoalkaloids)');
    console.log('  - MYCOTOXIN (aflatoxin, ochratoxin)');
    console.log('  - PESTICIDE_RESIDUE (glyphosate, organophosphates)');
    console.log('  - PLASTICIZER (BPA, phthalates)');
    console.log('\nNew table: food_compound_flags (risk-level tracking)\n');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
