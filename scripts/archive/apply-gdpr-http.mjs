import { dbHttp as db } from '../db/drizzle-http-adapter.ts';
import { config } from 'dotenv';

config();

async function applyMigration() {
  console.log('📦 Creating GDPR tables via HTTP adapter...');

  try {
    // Create deletion_status_enum
    await db.execute(`
      DO $$ BEGIN
        CREATE TYPE deletion_status_enum AS ENUM('pending', 'cancelled', 'completed', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ deletion_status_enum created');

    // Create export_status_enum
    await db.execute(`
      DO $$ BEGIN
        CREATE TYPE export_status_enum AS ENUM('pending', 'processing', 'completed', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ export_status_enum created');

    // Create deletion_requests table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS deletion_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id uuid NOT NULL,
        user_email text NOT NULL,
        status deletion_status_enum DEFAULT 'pending' NOT NULL,
        requested_at timestamp with time zone DEFAULT now() NOT NULL,
        scheduled_deletion_at timestamp with time zone NOT NULL,
        cancelled_at timestamp with time zone,
        completed_at timestamp with time zone,
        metadata jsonb DEFAULT '{}' NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log('✅ deletion_requests table created');

    // Create export_requests table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS export_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id uuid NOT NULL,
        user_email text NOT NULL,
        status export_status_enum DEFAULT 'pending' NOT NULL,
        requested_at timestamp with time zone DEFAULT now() NOT NULL,
        completed_at timestamp with time zone,
        download_url text,
        expires_at timestamp with time zone,
        metadata jsonb DEFAULT '{}' NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log('✅ export_requests table created');

    // Create indexes
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests (status);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_deletion_requests_scheduled ON deletion_requests (scheduled_deletion_at);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON deletion_requests (user_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_export_requests_status ON export_requests (status);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_export_requests_user_id ON export_requests (user_id);`);
    console.log('✅ All 5 indexes created');

    console.log('\n🎉 GDPR tables migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
