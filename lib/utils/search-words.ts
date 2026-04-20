/**
 * Builds a SQL fragment that matches all words in a query against a column.
 * "peanut oil" → column ILIKE '%peanut%' AND column ILIKE '%oil%'
 * Falls back to single ILIKE if query is one word.
 */
import { sql, type SQL } from 'drizzle-orm';

export function wordMatchSQL(column: string, query: string): SQL {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return sql`TRUE`;
  if (words.length === 1) return sql.raw(`${column} ILIKE `) .append(sql`${`%${words[0]}%`}`);

  const conditions = words.map(word =>
    sql.raw(`${column} ILIKE `).append(sql`${`%${word}%`}`)
  );

  return sql.join(conditions, sql` AND `);
}
