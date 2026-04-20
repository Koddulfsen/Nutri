import { pgTable, uuid, text, date, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { userProfiles } from './users';

/**
 * Meal Logs Table
 * Meal tracking entries
 * ~1.8M → 36M meals (Phase 2-5 growth)
 */
export const mealLogs = pgTable('meal_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.userId, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  mealType: text('meal_type'),
  loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
}, (table) => ({
  userDateIdx: index('idx_meal_logs_user_date').on(table.userId, table.date),
  userLoggedIdx: index('idx_meal_logs_user_logged').on(table.userId, table.loggedAt),
  activeIdx: index('idx_meal_logs_active').on(table.userId, table.isActive).where(sql`${table.isActive} = TRUE`),
  typeIdx: index('idx_meal_logs_type').on(table.mealType).where(sql`${table.mealType} IS NOT NULL`),
}));
