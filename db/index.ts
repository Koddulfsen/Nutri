import postgres from 'postgres';
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import dns from 'dns';

// Force IPv4 resolution for all DNS lookups (fixes Supabase IPv6-only issue)
dns.setDefaultResultOrder('ipv4first');

/**
 * The connection is created on FIRST USE, not on import.
 *
 * This module used to validate DATABASE_URL and open a pool at module scope.
 * Next imports every route module while collecting page data, so a build with
 * no database credentials died with "Failed to collect page data for
 * /api/ai/log-food" — a message that names a route and says nothing about the
 * real cause. Building is a compile step; it has no business needing a live
 * database URL, and a deployment should not be able to fail this way.
 *
 * Deferring also means one pool per serverless instance created on demand,
 * rather than one opened by any import that happens to pull this file in.
 *
 * The validation is kept, just moved to the moment it can actually matter: a
 * missing or malformed URL still throws, on the first query, with the same
 * message.
 */
let cached: PostgresJsDatabase<typeof schema> | null = null;

function connect(): PostgresJsDatabase<typeof schema> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      '❌ DATABASE_URL environment variable is not set.\n' +
        'Please add your Supabase PostgreSQL connection string to .env file:\n' +
        'DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres'
    );
  }

  if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
    throw new Error(
      '❌ Invalid DATABASE_URL format.\n' +
        'Expected PostgreSQL connection string starting with "postgresql://" or "postgres://"'
    );
  }

  const queryClient = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 30,
    ssl: 'require',
    fetch_types: false,
    prepare: false, // Disable prepared statements for connection pool
  });

  return drizzlePostgres(queryClient, { schema });
}

function getDb(): PostgresJsDatabase<typeof schema> {
  if (!cached) cached = connect();
  return cached;
}

/**
 * Drizzle instance. A Proxy so the 19 files importing `db` are unchanged and
 * keep full type inference, while the pool is still built lazily.
 */
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === 'function' ? value.bind(real) : value;
  },
  has(_target, prop) {
    return Reflect.has(getDb(), prop);
  },
});

// Export schema for use in other files
export { schema };
