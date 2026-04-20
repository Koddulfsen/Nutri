import postgres from 'postgres';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import dns from 'dns';

// Force IPv4 resolution for all DNS lookups (fixes Supabase IPv6-only issue)
dns.setDefaultResultOrder('ipv4first');

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error(
    '❌ DATABASE_URL environment variable is not set.\n' +
    'Please add your Supabase PostgreSQL connection string to .env file:\n' +
    'DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres'
  );
}

const connectionString = process.env.DATABASE_URL;

// Validate connection string format
if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
  throw new Error(
    '❌ Invalid DATABASE_URL format.\n' +
    'Expected PostgreSQL connection string starting with "postgresql://" or "postgres://"'
  );
}

// Configure connection with SSL and timeouts
const queryClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  ssl: 'require',
  fetch_types: false,
  prepare: false, // Disable prepared statements for connection pool
});

// Create Drizzle instance with schema for type inference
export const db = drizzlePostgres(queryClient, { schema });

// Export schema for use in other files
export { schema };
