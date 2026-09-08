/**
 * Rate Limit Counters
 *
 * Backs the application rate limiter. Previously this lived in a hosted Redis
 * (Upstash) which no longer exists, and the limiter silently failed open — login
 * brute-force and password-reset flooding were completely unthrottled.
 *
 * Postgres rather than a new vendor: the counters are low-volume, the database is
 * already a hard dependency, and one less external service is one less thing that
 * can vanish and take a security control with it.
 *
 * A row is a counter for one key over one window. The window is advanced in the
 * same statement that increments the count, so the whole check is a single atomic
 * UPSERT — no read-then-write race lets two concurrent requests both "pass".
 *
 * Rows are self-expiring by value (`expires_at`), not by deletion; a stale row is
 * simply treated as a fresh window. `deleteExpiredRateLimits()` reclaims space.
 */

import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const rateLimits = pgTable(
  'rate_limits',
  {
    /** e.g. `login:203.0.113.0` or `pwreset:user@example.com`. */
    key: text('key').primaryKey(),

    /** Requests counted in the current window. */
    count: integer('count').notNull().default(0),

    /** When the current window ends. Past this, the next hit starts a new window. */
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    /** Start of the current window — diagnostics only. */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Supports the cleanup sweep.
    expiresIdx: index('idx_rate_limits_expires').on(table.expiresAt),
  })
);

export type RateLimitRow = typeof rateLimits.$inferSelect;
