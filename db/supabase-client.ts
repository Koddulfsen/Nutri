/**
 * Supabase HTTP Client for Seed Scripts
 *
 * Uses Supabase REST API instead of direct PostgreSQL connection.
 * This bypasses IPv6 network connectivity issues while maintaining
 * full database access via service role key.
 *
 * WHEN TO USE:
 * - Seed scripts (this file)
 * - Data migrations
 * - Batch operations
 *
 * WHEN NOT TO USE:
 * - App queries (use Drizzle in db/index.ts instead)
 * - Type-safe queries (Drizzle is better)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

/**
 * Supabase client with service role access
 *
 * WARNING: This bypasses Row Level Security (RLS)
 * Only use in trusted environments (seed scripts, admin operations)
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Helper to insert data with better error handling
 */
export async function insertData<T>(
  table: string,
  data: T | T[],
  options?: { returning?: boolean }
): Promise<T[]> {
  const records = Array.isArray(data) ? data : [data];

  const { data: inserted, error } = await supabase
    .from(table)
    .insert(records)
    .select();

  if (error) {
    throw new Error(`Failed to insert into ${table}: ${error.message}`);
  }

  return inserted as T[];
}

/**
 * Helper to query data
 */
export async function queryData<T>(
  table: string,
  filters?: Record<string, any>
): Promise<T[]> {
  let query = supabase.from(table).select('*');

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to query ${table}: ${error.message}`);
  }

  return data as T[];
}
