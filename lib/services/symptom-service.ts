/**
 * Symptom Service
 *
 * Purpose: Business logic for symptom tracking
 * Pattern: Service layer with Drizzle queries
 * Features:
 *   - Log symptoms with intensity (1-10)
 *   - Update existing symptom logs
 *   - Delete symptom logs (soft delete)
 *   - Fetch symptoms for date
 *   - Get symptom definitions (system + custom)
 *   - Create custom symptom definitions
 *
 * Generated: 2026-01-09
 * Architecture: Symptom Tracking System
 */

import { db } from '@/db';
import { symptomDefinitions, symptomLogs } from '@/db/schema';
import { eq, and, isNull, or, desc, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// Type definitions
export type SymptomCategory = 'ENERGY_MENTAL' | 'DIGESTIVE' | 'PHYSICAL';

export interface SymptomDefinition {
  id: string;
  name: string;
  slug: string;
  category: SymptomCategory;
  description: string | null;
  icon: string | null;
  userId: string | null;
  isSystemDefined: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface SymptomLog {
  id: string;
  userId: string;
  symptomDefinitionId: string;
  date: string;
  intensity: number;
  notes: string | null;
  isActive: boolean;
  loggedAt: Date;
  updatedAt: Date;
  symptomDefinition?: SymptomDefinition;
}

export interface LogSymptomInput {
  symptomDefinitionId: string;
  date: string;
  intensity: number;
  notes?: string;
}

export interface UpdateSymptomLogInput {
  intensity?: number;
  notes?: string | null;
  date?: string;
}

export interface CreateSymptomDefinitionInput {
  name: string;
  category: SymptomCategory;
  description?: string;
  icon?: string;
}

/**
 * Get all symptom definitions available to a user
 * Returns system-defined symptoms + user's custom symptoms
 *
 * @param userId - User ID (for custom symptoms)
 * @returns Array of symptom definitions
 */
export async function getSymptomDefinitions(
  userId: string
): Promise<SymptomDefinition[]> {
  logger.debug(
    { service: 'symptom-service', userId },
    'Fetching symptom definitions'
  );

  try {
    const definitions = await db
      .select()
      .from(symptomDefinitions)
      .where(
        and(
          eq(symptomDefinitions.isActive, true),
          or(
            // System-defined symptoms (userId is NULL)
            isNull(symptomDefinitions.userId),
            // User's custom symptoms
            eq(symptomDefinitions.userId, userId)
          )
        )
      )
      .orderBy(
        symptomDefinitions.category,
        symptomDefinitions.sortOrder,
        symptomDefinitions.name
      );

    logger.debug(
      { service: 'symptom-service', userId, count: definitions.length },
      'Symptom definitions fetched'
    );

    return definitions as SymptomDefinition[];
  } catch (error) {
    logger.error(
      {
        service: 'symptom-service',
        userId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to fetch symptom definitions'
    );
    throw new Error('Failed to fetch symptom definitions');
  }
}

/**
 * Create a custom symptom definition for a user
 *
 * @param userId - User ID
 * @param input - Symptom definition data
 * @returns Created symptom definition
 */
export async function createCustomSymptomDefinition(
  userId: string,
  input: CreateSymptomDefinitionInput
): Promise<SymptomDefinition> {
  logger.info(
    { service: 'symptom-service', userId, name: input.name },
    'Creating custom symptom definition'
  );

  try {
    // Generate slug from name
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Get max sort order for user's custom symptoms
    const maxOrderResult = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(sort_order), 22)` })
      .from(symptomDefinitions)
      .where(eq(symptomDefinitions.userId, userId));

    const nextOrder = (maxOrderResult[0]?.maxOrder ?? 22) + 1;

    const [definition] = await db
      .insert(symptomDefinitions)
      .values({
        name: input.name,
        slug,
        category: input.category,
        description: input.description || null,
        icon: input.icon || null,
        userId,
        isSystemDefined: false,
        isActive: true,
        sortOrder: nextOrder,
      })
      .returning();

    logger.info(
      { service: 'symptom-service', userId, definitionId: definition.id },
      'Custom symptom definition created'
    );

    return definition as SymptomDefinition;
  } catch (error) {
    logger.error(
      {
        service: 'symptom-service',
        userId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to create custom symptom definition'
    );
    throw new Error('Failed to create custom symptom definition');
  }
}

/**
 * Delete a custom symptom definition (soft delete)
 * Only user-created definitions can be deleted
 *
 * @param definitionId - Symptom definition ID
 * @param userId - User ID (for ownership verification)
 */
export async function deleteCustomSymptomDefinition(
  definitionId: string,
  userId: string
): Promise<void> {
  logger.info(
    { service: 'symptom-service', definitionId, userId },
    'Deleting custom symptom definition'
  );

  try {
    // Verify ownership and that it's not a system definition
    const [definition] = await db
      .select()
      .from(symptomDefinitions)
      .where(
        and(
          eq(symptomDefinitions.id, definitionId),
          eq(symptomDefinitions.userId, userId),
          eq(symptomDefinitions.isSystemDefined, false)
        )
      )
      .limit(1);

    if (!definition) {
      throw new Error('Symptom definition not found or cannot be deleted');
    }

    // Soft delete
    await db
      .update(symptomDefinitions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(symptomDefinitions.id, definitionId));

    logger.info(
      { service: 'symptom-service', definitionId, userId },
      'Custom symptom definition deleted'
    );
  } catch (error) {
    logger.error(
      {
        service: 'symptom-service',
        definitionId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to delete custom symptom definition'
    );
    throw error;
  }
}

/**
 * Log a symptom for a user on a specific date
 *
 * @param userId - User ID
 * @param input - Symptom log data
 * @returns Created symptom log
 */
export async function logSymptom(
  userId: string,
  input: LogSymptomInput
): Promise<SymptomLog> {
  logger.info(
    {
      service: 'symptom-service',
      userId,
      symptomDefinitionId: input.symptomDefinitionId,
      date: input.date,
      intensity: input.intensity,
    },
    'Logging symptom'
  );

  try {
    // Validate intensity
    if (input.intensity < 1 || input.intensity > 10) {
      throw new Error('Intensity must be between 1 and 10');
    }

    const [log] = await db
      .insert(symptomLogs)
      .values({
        userId,
        symptomDefinitionId: input.symptomDefinitionId,
        date: input.date,
        intensity: input.intensity,
        notes: input.notes || null,
      })
      .returning();

    logger.info(
      { service: 'symptom-service', logId: log.id, userId, date: input.date },
      'Symptom logged successfully'
    );

    return log as SymptomLog;
  } catch (error) {
    logger.error(
      {
        service: 'symptom-service',
        userId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to log symptom'
    );
    throw error;
  }
}

/**
 * Update an existing symptom log
 *
 * @param logId - Symptom log ID
 * @param userId - User ID (for ownership verification)
 * @param updates - Fields to update
 * @returns Updated symptom log
 */
export async function updateSymptomLog(
  logId: string,
  userId: string,
  updates: UpdateSymptomLogInput
): Promise<SymptomLog> {
  logger.info(
    { service: 'symptom-service', logId, userId, updates },
    'Updating symptom log'
  );

  try {
    // Validate intensity if provided
    if (updates.intensity !== undefined && (updates.intensity < 1 || updates.intensity > 10)) {
      throw new Error('Intensity must be between 1 and 10');
    }

    const [updated] = await db
      .update(symptomLogs)
      .set({
        ...(updates.intensity !== undefined && { intensity: updates.intensity }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        ...(updates.date !== undefined && { date: updates.date }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(symptomLogs.id, logId),
          eq(symptomLogs.userId, userId),
          eq(symptomLogs.isActive, true)
        )
      )
      .returning();

    if (!updated) {
      throw new Error('Symptom log not found or unauthorized');
    }

    logger.info(
      { service: 'symptom-service', logId, userId },
      'Symptom log updated successfully'
    );

    return updated as SymptomLog;
  } catch (error) {
    logger.error(
      {
        service: 'symptom-service',
        logId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to update symptom log'
    );
    throw error;
  }
}

/**
 * Delete a symptom log (soft delete)
 *
 * @param logId - Symptom log ID
 * @param userId - User ID (for ownership verification)
 */
export async function deleteSymptomLog(
  logId: string,
  userId: string
): Promise<void> {
  logger.info(
    { service: 'symptom-service', logId, userId },
    'Deleting symptom log'
  );

  try {
    const result = await db
      .update(symptomLogs)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(symptomLogs.id, logId),
          eq(symptomLogs.userId, userId)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new Error('Symptom log not found or unauthorized');
    }

    logger.info(
      { service: 'symptom-service', logId, userId },
      'Symptom log deleted successfully'
    );
  } catch (error) {
    logger.error(
      {
        service: 'symptom-service',
        logId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to delete symptom log'
    );
    throw error;
  }
}

/**
 * Get symptom logs for a specific date
 *
 * @param userId - User ID
 * @param date - Date (YYYY-MM-DD)
 * @returns Array of symptom logs with definitions
 */
export async function getSymptomsForDate(
  userId: string,
  date: string
): Promise<SymptomLog[]> {
  logger.debug(
    { service: 'symptom-service', userId, date },
    'Fetching symptoms for date'
  );

  try {
    // Fetch logs
    const logs = await db
      .select({
        id: symptomLogs.id,
        userId: symptomLogs.userId,
        symptomDefinitionId: symptomLogs.symptomDefinitionId,
        date: symptomLogs.date,
        intensity: symptomLogs.intensity,
        notes: symptomLogs.notes,
        isActive: symptomLogs.isActive,
        loggedAt: symptomLogs.loggedAt,
        updatedAt: symptomLogs.updatedAt,
        symptomDefinition: {
          id: symptomDefinitions.id,
          name: symptomDefinitions.name,
          slug: symptomDefinitions.slug,
          category: symptomDefinitions.category,
          description: symptomDefinitions.description,
          icon: symptomDefinitions.icon,
          userId: symptomDefinitions.userId,
          isSystemDefined: symptomDefinitions.isSystemDefined,
          isActive: symptomDefinitions.isActive,
          sortOrder: symptomDefinitions.sortOrder,
        },
      })
      .from(symptomLogs)
      .leftJoin(
        symptomDefinitions,
        eq(symptomLogs.symptomDefinitionId, symptomDefinitions.id)
      )
      .where(
        and(
          eq(symptomLogs.userId, userId),
          eq(symptomLogs.date, date),
          eq(symptomLogs.isActive, true)
        )
      )
      .orderBy(desc(symptomLogs.loggedAt));

    logger.debug(
      { service: 'symptom-service', userId, date, count: logs.length },
      'Symptoms fetched for date'
    );

    return logs as SymptomLog[];
  } catch (error) {
    logger.error(
      {
        service: 'symptom-service',
        userId,
        date,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to fetch symptoms for date'
    );
    throw new Error('Failed to fetch symptoms');
  }
}
