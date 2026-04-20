/**
 * Quarantine Service
 * Routes low-confidence foods to quarantine table for manual review
 *
 * Reference: architecture.md lines 1348-1545 (Quarantine Workflow)
 * Schema Reference: db/schema/meal_tracking.ts (quarantineImports table)
 */

import { db } from '@/db';
import { quarantineImports } from '@/db/schema/meal_tracking';
import { foods } from '@/db/schema/foods';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logging/pino-config';
import { redis } from '@/lib/services/redis';
import type { ValidationResult, ValidationError, ValidationWarning } from './data-validator';

export interface QuarantineItem {
  id: string;
  foodId?: string;
  foodData: any;
  validationErrors: ValidationError[];
  validationWarnings: ValidationWarning[];
  status: 'pending' | 'approved' | 'rejected';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  reviewerId?: string;
  reviewerNotes?: string;
  createdAt: Date;
  reviewedAt?: Date;
}

export interface QuarantineMetrics {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  criticalCount: number;
  warningCount: number;
}

/**
 * Add food to quarantine for manual review
 *
 * @param foodData Raw food data that failed validation
 * @param validationResult Validation result containing errors and warnings
 * @returns Quarantine item ID
 */
export async function addToQuarantine(
  foodData: any,
  validationResult: ValidationResult
): Promise<string> {
  logger.info({
    fdcId: foodData.fdcId,
    reason: validationResult.quarantineReason,
    errorCount: validationResult.errors.length,
    warningCount: validationResult.warnings.length,
  }, 'Adding food to quarantine');

  // Determine severity based on validation result
  const severity = validationResult.errors.length > 0
    ? 'CRITICAL'
    : validationResult.warnings.some(w => w.severity === 'HIGH')
      ? 'WARNING'
      : 'INFO';

  // Insert into quarantine_imports table
  const [quarantineItem] = await db
    .insert(quarantineImports)
    .values({
      foodData,
      validationErrors: {
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        reason: validationResult.quarantineReason,
      },
      status: 'pending',
      severity,
    })
    .returning();

  // Update metrics in Redis
  await updateQuarantineMetrics('pending', 1);
  if (severity === 'CRITICAL') {
    await updateQuarantineMetrics('criticalCount', 1);
  }

  logger.info({
    quarantineId: quarantineItem.id,
    fdcId: foodData.fdcId,
    severity,
  }, 'Food added to quarantine successfully');

  return quarantineItem.id;
}

/**
 * Approve quarantined food and insert into database
 *
 * @param quarantineId Quarantine item ID
 * @param reviewerId Admin user ID approving the food
 * @param notes Optional reviewer notes
 * @returns Food ID of inserted food
 */
export async function approveQuarantine(
  quarantineId: string,
  reviewerId: string,
  notes?: string
): Promise<string> {
  logger.info({ quarantineId, reviewerId }, 'Approving quarantined food');

  // Fetch quarantine item
  const quarantineItem = await db.query.quarantineImports.findFirst({
    where: eq(quarantineImports.id, quarantineId),
  });

  if (!quarantineItem) {
    throw new Error(`Quarantine item ${quarantineId} not found`);
  }

  if (quarantineItem.status !== 'pending') {
    throw new Error(`Quarantine item ${quarantineId} already ${quarantineItem.status}`);
  }

  // Insert food into foods table
  // Note: This is a simplified version - in production, you'd call the full ETL pipeline
  const foodData = quarantineItem.foodData as any;

  const [insertedFood] = await db
    .insert(foods)
    .values({
      fdcId: foodData.fdcId ?? null,
      name: foodData.name,
      description: foodData.description ?? foodData.name,
      foodCategoryId: foodData.categoryId ?? null,
      defaultPortionType: foodData.defaultPortionType ?? null,
      defaultPortionSize: foodData.defaultPortionSize ? foodData.defaultPortionSize.toString() : null,
      dataSource: 'USDA',
      isEstimated: false,
    })
    .returning();

  // Update quarantine status
  await db
    .update(quarantineImports)
    .set({
      status: 'approved',
      foodId: insertedFood.id,
      reviewerId,
      reviewerNotes: notes,
      reviewedAt: new Date(),
    })
    .where(eq(quarantineImports.id, quarantineId));

  // Update metrics
  await updateQuarantineMetrics('pending', -1);
  await updateQuarantineMetrics('approved', 1);

  logger.info({
    quarantineId,
    foodId: insertedFood.id,
    reviewerId,
  }, 'Quarantined food approved and inserted');

  return insertedFood.id;
}

/**
 * Reject quarantined food (permanently remove from consideration)
 *
 * @param quarantineId Quarantine item ID
 * @param reviewerId Admin user ID rejecting the food
 * @param reason Reason for rejection
 */
export async function rejectQuarantine(
  quarantineId: string,
  reviewerId: string,
  reason: string
): Promise<void> {
  logger.info({ quarantineId, reviewerId, reason }, 'Rejecting quarantined food');

  // Fetch quarantine item
  const quarantineItem = await db.query.quarantineImports.findFirst({
    where: eq(quarantineImports.id, quarantineId),
  });

  if (!quarantineItem) {
    throw new Error(`Quarantine item ${quarantineId} not found`);
  }

  if (quarantineItem.status !== 'pending') {
    throw new Error(`Quarantine item ${quarantineId} already ${quarantineItem.status}`);
  }

  // Update quarantine status
  await db
    .update(quarantineImports)
    .set({
      status: 'rejected',
      reviewerId,
      reviewerNotes: reason,
      reviewedAt: new Date(),
    })
    .where(eq(quarantineImports.id, quarantineId));

  // Update metrics
  await updateQuarantineMetrics('pending', -1);
  await updateQuarantineMetrics('rejected', 1);

  logger.info({
    quarantineId,
    reviewerId,
  }, 'Quarantined food rejected');
}

/**
 * Get quarantine metrics from Redis
 *
 * @returns Current quarantine metrics (counts by status)
 */
export async function getQuarantineMetrics(): Promise<QuarantineMetrics> {
  if (!redis) {
    // Fallback when Redis unavailable
    return {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0,
      criticalCount: 0,
      warningCount: 0,
    };
  }

  // Get metrics from Redis (fallback to 0 if not set)
  const pending = parseInt((await redis.get('quarantine:metrics:pending')) ?? '0', 10);
  const approved = parseInt((await redis.get('quarantine:metrics:approved')) ?? '0', 10);
  const rejected = parseInt((await redis.get('quarantine:metrics:rejected')) ?? '0', 10);
  const total = parseInt((await redis.get('quarantine:metrics:total')) ?? '0', 10);
  const criticalCount = parseInt((await redis.get('quarantine:metrics:criticalCount')) ?? '0', 10);
  const warningCount = parseInt((await redis.get('quarantine:metrics:warningCount')) ?? '0', 10);

  return {
    pending,
    approved,
    rejected,
    total,
    criticalCount,
    warningCount,
  };
}

/**
 * Update quarantine metrics in Redis
 *
 * @param metric Metric name (pending, approved, rejected, etc.)
 * @param delta Change in metric value (positive or negative)
 */
async function updateQuarantineMetrics(
  metric: keyof QuarantineMetrics,
  delta: number
): Promise<void> {
  if (!redis) {
    logger.warn({ metric, delta }, 'Redis unavailable - cannot update quarantine metrics');
    return;
  }

  const key = `quarantine:metrics:${metric}`;

  // Increment/decrement metric (create if doesn't exist)
  if (delta !== 0) {
    await redis.incrby(key, delta);
  }

  // Also update total count if adding new item
  if (metric === 'pending' && delta > 0) {
    await redis.incrby('quarantine:metrics:total', delta);
  }
}

/**
 * Get all pending quarantine items (for admin review queue)
 *
 * @param limit Maximum number of items to return
 * @param offset Pagination offset
 * @returns Array of quarantine items ordered by severity and creation date
 */
export async function getPendingQuarantineItems(
  limit = 50,
  offset = 0
): Promise<QuarantineItem[]> {
  logger.info({ limit, offset }, 'Fetching pending quarantine items');

  const items = await db.query.quarantineImports.findMany({
    where: eq(quarantineImports.status, 'pending'),
    limit,
    offset,
    orderBy: (quarantine, { desc, asc }) => [
      // Critical items first
      desc(quarantine.severity),
      // Oldest first within each severity
      asc(quarantine.createdAt),
    ],
  });

  return items.map(item => ({
    id: item.id,
    foodId: item.foodId ?? undefined,
    foodData: item.foodData,
    validationErrors: (item.validationErrors as any)?.errors ?? [],
    validationWarnings: (item.validationErrors as any)?.warnings ?? [],
    status: item.status as 'pending' | 'approved' | 'rejected',
    severity: item.severity as 'CRITICAL' | 'WARNING' | 'INFO',
    reviewerId: item.reviewerId ?? undefined,
    reviewerNotes: item.reviewerNotes ?? undefined,
    createdAt: item.createdAt,
    reviewedAt: item.reviewedAt ?? undefined,
  }));
}

/**
 * Get quarantine item by ID
 *
 * @param quarantineId Quarantine item ID
 * @returns Quarantine item or null if not found
 */
export async function getQuarantineItem(
  quarantineId: string
): Promise<QuarantineItem | null> {
  const item = await db.query.quarantineImports.findFirst({
    where: eq(quarantineImports.id, quarantineId),
  });

  if (!item) {
    return null;
  }

  return {
    id: item.id,
    foodId: item.foodId ?? undefined,
    foodData: item.foodData,
    validationErrors: (item.validationErrors as any)?.errors ?? [],
    validationWarnings: (item.validationErrors as any)?.warnings ?? [],
    status: item.status as 'pending' | 'approved' | 'rejected',
    severity: item.severity as 'CRITICAL' | 'WARNING' | 'INFO',
    reviewerId: item.reviewerId ?? undefined,
    reviewerNotes: item.reviewerNotes ?? undefined,
    createdAt: item.createdAt,
    reviewedAt: item.reviewedAt ?? undefined,
  };
}

/**
 * Initialize quarantine metrics from database
 * Run this once on application startup to sync Redis with database state
 */
export async function initializeQuarantineMetrics(): Promise<void> {
  logger.info('Initializing quarantine metrics from database');

  if (!redis) {
    logger.warn('Redis unavailable - cannot initialize quarantine metrics');
    return;
  }

  // Count items by status
  const allItems = await db.query.quarantineImports.findMany();

  const pending = allItems.filter(i => i.status === 'pending').length;
  const approved = allItems.filter(i => i.status === 'approved').length;
  const rejected = allItems.filter(i => i.status === 'rejected').length;
  const total = allItems.length;
  const criticalCount = allItems.filter(i => i.status === 'pending' && i.severity === 'CRITICAL').length;
  const warningCount = allItems.filter(i => i.status === 'pending' && i.severity === 'WARNING').length;

  // Set metrics in Redis
  await Promise.all([
    redis.set('quarantine:metrics:pending', pending.toString()),
    redis.set('quarantine:metrics:approved', approved.toString()),
    redis.set('quarantine:metrics:rejected', rejected.toString()),
    redis.set('quarantine:metrics:total', total.toString()),
    redis.set('quarantine:metrics:criticalCount', criticalCount.toString()),
    redis.set('quarantine:metrics:warningCount', warningCount.toString()),
  ]);

  logger.info({
    pending,
    approved,
    rejected,
    total,
    criticalCount,
    warningCount,
  }, 'Quarantine metrics initialized');
}
