/**
 * Drizzle-to-HTTP Adapter
 *
 * Creates a Drizzle-compatible interface that uses Supabase HTTP client under the hood.
 * This allows existing Drizzle seed files to work without modification while bypassing
 * IPv6 PostgreSQL connectivity issues.
 *
 * MAGIC: Existing seed files use `db.insert(table).values(data).returning()`
 * This adapter intercepts those calls and routes them through Supabase HTTP API.
 */

import { supabase } from './supabase-client';
import * as schema from './schema';

/**
 * Convert camelCase to snake_case for PostgreSQL
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert object keys from camelCase to snake_case
 */
function convertKeysToSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnakeCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = toSnakeCase(key);
      acc[snakeKey] = convertKeysToSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

/**
 * Convert object keys from snake_case to camelCase
 */
function convertKeysToCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = convertKeysToCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

/**
 * Get table name from Drizzle table object
 */
function getTableName(table: any): string {
  // Drizzle table objects have Symbol(drizzle:Name) property
  const symbols = Object.getOwnPropertySymbols(table);
  for (const sym of symbols) {
    const symStr = sym.toString();
    if (symStr === 'Symbol(drizzle:Name)') {
      return table[sym];
    }
  }

  throw new Error('Could not determine table name from Drizzle table object');
}

/**
 * Create HTTP-based insert builder that mimics Drizzle API
 */
function createInsertBuilder(table: any) {
  let valuesData: any[] = [];

  return {
    values(data: any | any[]) {
      valuesData = Array.isArray(data) ? data : [data];
      return this;
    },

    async returning() {
      const tableName = getTableName(table);
      console.log(`  [HTTP] Inserting ${valuesData.length} records into ${tableName}...`);

      // Convert camelCase keys to snake_case for PostgreSQL
      const snakeCaseData = convertKeysToSnakeCase(valuesData);

      const { data, error } = await supabase
        .from(tableName)
        .insert(snakeCaseData)
        .select();

      if (error) {
        throw new Error(`HTTP insert failed for ${tableName}: ${error.message}`);
      }

      // Convert response back to camelCase for consistency with Drizzle
      return convertKeysToCamelCase(data);
    },
  };
}

/**
 * Create HTTP-based query builder that mimics Drizzle API
 */
function createQueryBuilder(table: any) {
  const tableName = getTableName(table);
  let selectColumns: string = '*';
  let whereConditions: Record<string, any> = {};

  return {
    findFirst(options?: any) {
      return {
        async execute() {
          // Convert column names from camelCase to snake_case
          let selectClause = '*';
          if (options?.columns) {
            const snakeCaseColumns = Object.keys(options.columns).map(toSnakeCase);
            selectClause = snakeCaseColumns.join(',');
          }

          let query: any = supabase.from(tableName).select(selectClause);

          if (options?.where) {
            // Convert camelCase keys to snake_case for PostgreSQL
            const snakeCaseWhere = convertKeysToSnakeCase(options.where);
            Object.entries(snakeCaseWhere).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }

          const { data, error } = await query.limit(1).single();
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
            throw new Error(`HTTP query failed for ${tableName}: ${error.message}`);
          }

          // Convert response back to camelCase
          return data ? convertKeysToCamelCase(data) : null;
        }
      };
    },

    findMany(options?: any) {
      return {
        async execute() {
          // Convert column names from camelCase to snake_case
          let selectClause = '*';
          if (options?.columns) {
            const snakeCaseColumns = Object.keys(options.columns).map(toSnakeCase);
            selectClause = snakeCaseColumns.join(',');
          }

          let query: any = supabase.from(tableName).select(selectClause);

          if (options?.where) {
            // Convert camelCase keys to snake_case for PostgreSQL
            const snakeCaseWhere = convertKeysToSnakeCase(options.where);
            Object.entries(snakeCaseWhere).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }

          const { data, error } = await query;
          if (error) {
            throw new Error(`HTTP query failed for ${tableName}: ${error.message}`);
          }

          // Convert response back to camelCase
          return data ? convertKeysToCamelCase(data) : [];
        }
      };
    },
  };
}

/**
 * HTTP-based database client with Drizzle-compatible API
 */
export const dbHttp = {
  insert(table: any) {
    return createInsertBuilder(table);
  },

  query: new Proxy({}, {
    get(target, prop) {
      // When seed file calls db.query.compounds.findFirst()
      // Return a query builder for that table
      const table = (schema as any)[prop as string];
      if (table) {
        return createQueryBuilder(table);
      }
      throw new Error(`Table ${String(prop)} not found in schema`);
    }
  }),
};
