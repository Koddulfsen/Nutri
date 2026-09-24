import postgres from 'postgres';
import 'dotenv/config';

console.log('Running symptoms migration...\n');

// Use postgres package for direct SQL execution
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  connection: {
    application_name: 'symptoms-migration'
  }
});

// Split migration into individual statements with IF NOT EXISTS where possible
const statements = [
  // Create enum type (wrap in DO block for IF NOT EXISTS)
  {
    name: 'Create symptom_category_enum',
    sql: `DO $$ BEGIN
      CREATE TYPE "public"."symptom_category_enum" AS ENUM('ENERGY_MENTAL', 'DIGESTIVE', 'PHYSICAL');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`
  },

  // Create symptom_definitions table
  {
    name: 'Create symptom_definitions table',
    sql: `CREATE TABLE IF NOT EXISTS "symptom_definitions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "slug" text NOT NULL,
      "category" "symptom_category_enum" NOT NULL,
      "description" text,
      "icon" text,
      "user_id" uuid,
      "is_system_defined" boolean DEFAULT false NOT NULL,
      "is_active" boolean DEFAULT true NOT NULL,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`
  },

  // Create symptom_logs table
  {
    name: 'Create symptom_logs table',
    sql: `CREATE TABLE IF NOT EXISTS "symptom_logs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL,
      "symptom_definition_id" uuid NOT NULL,
      "date" date NOT NULL,
      "intensity" integer NOT NULL,
      "notes" text,
      "is_active" boolean DEFAULT true NOT NULL,
      "logged_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`
  },

  // Foreign keys (wrapped in DO blocks for error handling)
  {
    name: 'Add FK: symptom_definitions -> user_profiles',
    sql: `DO $$ BEGIN
      ALTER TABLE "symptom_definitions" ADD CONSTRAINT "symptom_definitions_user_id_user_profiles_user_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`
  },
  {
    name: 'Add FK: symptom_logs -> user_profiles',
    sql: `DO $$ BEGIN
      ALTER TABLE "symptom_logs" ADD CONSTRAINT "symptom_logs_user_id_user_profiles_user_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`
  },
  {
    name: 'Add FK: symptom_logs -> symptom_definitions',
    sql: `DO $$ BEGIN
      ALTER TABLE "symptom_logs" ADD CONSTRAINT "symptom_logs_symptom_definition_id_symptom_definitions_id_fk"
        FOREIGN KEY ("symptom_definition_id") REFERENCES "public"."symptom_definitions"("id") ON DELETE restrict ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`
  },

  // Indexes (CREATE INDEX IF NOT EXISTS)
  {
    name: 'Create idx_symptom_definitions_slug_user',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS "idx_symptom_definitions_slug_user" ON "symptom_definitions" USING btree ("slug","user_id")`
  },
  {
    name: 'Create idx_symptom_definitions_category',
    sql: `CREATE INDEX IF NOT EXISTS "idx_symptom_definitions_category" ON "symptom_definitions" USING btree ("category")`
  },
  {
    name: 'Create idx_symptom_definitions_user',
    sql: `CREATE INDEX IF NOT EXISTS "idx_symptom_definitions_user" ON "symptom_definitions" USING btree ("user_id") WHERE "symptom_definitions"."user_id" IS NOT NULL`
  },
  {
    name: 'Create idx_symptom_definitions_active',
    sql: `CREATE INDEX IF NOT EXISTS "idx_symptom_definitions_active" ON "symptom_definitions" USING btree ("is_active") WHERE "symptom_definitions"."is_active" = TRUE`
  },
  {
    name: 'Create idx_symptom_definitions_system',
    sql: `CREATE INDEX IF NOT EXISTS "idx_symptom_definitions_system" ON "symptom_definitions" USING btree ("is_system_defined") WHERE "symptom_definitions"."is_system_defined" = TRUE`
  },
  {
    name: 'Create idx_symptom_logs_user_date',
    sql: `CREATE INDEX IF NOT EXISTS "idx_symptom_logs_user_date" ON "symptom_logs" USING btree ("user_id","date")`
  },
  {
    name: 'Create idx_symptom_logs_symptom',
    sql: `CREATE INDEX IF NOT EXISTS "idx_symptom_logs_symptom" ON "symptom_logs" USING btree ("symptom_definition_id")`
  },
  {
    name: 'Create idx_symptom_logs_user_logged',
    sql: `CREATE INDEX IF NOT EXISTS "idx_symptom_logs_user_logged" ON "symptom_logs" USING btree ("user_id","logged_at")`
  },
  {
    name: 'Create idx_symptom_logs_active',
    sql: `CREATE INDEX IF NOT EXISTS "idx_symptom_logs_active" ON "symptom_logs" USING btree ("user_id","is_active") WHERE "symptom_logs"."is_active" = TRUE`
  },
];

let successCount = 0;
let errorCount = 0;

for (const stmt of statements) {
  try {
    await sql.unsafe(stmt.sql);
    console.log(`✅ ${stmt.name}`);
    successCount++;
  } catch (err) {
    console.error(`❌ ${stmt.name}`);
    console.error(`   Error: ${err.message}`);
    errorCount++;
  }
}

await sql.end();

console.log(`\n📊 Migration complete: ${successCount} succeeded, ${errorCount} failed`);
process.exit(errorCount > 0 ? 1 : 0);
