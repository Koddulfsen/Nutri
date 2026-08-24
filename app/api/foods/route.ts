/**
 * Foods API Endpoint
 *
 * POST /api/foods
 *
 * Purpose: Add food to Nutri database with multi-source nutrient merging
 * Pattern: Transaction-based multi-table insert with nutrient averaging
 * Features:
 *   - Accepts food name + API source mappings
 *   - Fetches nutrients from CNF and USDA APIs
 *   - Standardizes and merges nutrient values
 *   - Stores food, sources, merged nutrients, and individual values
 *   - Handles approval workflow (auth = auto-approved, non-auth = pending)
 *   - Returns Server-Sent Events for real-time progress tracking
 *
 * Generated: 2025-11-18
 * Updated: 2026-01-22 - Added SSE streaming progress
 * Architecture: Multi-Source Food Database System
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { foods, foodSources, mergedNutrients, nutrientSourceValues, foodApprovals, foodPortions, foodCategories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { cnfClient } from '@/lib/services/cnf-client';
import { usdaClient } from '@/lib/services/usda-client';
import { foodbStagingClient } from '@/lib/services/foodb-client';
import { dukeStagingClient } from '@/lib/services/duke-client';
import { mergeDukeVariants, mergeFooDBVariants } from '@/lib/services/variant-composition';
import { afcdStagingClient } from '@/lib/services/afcd-client';
import { cofidStagingClient } from '@/lib/services/cofid-client';
import { fineliStagingClient } from '@/lib/services/fineli-client';
import { ciqualStagingClient } from '@/lib/services/ciqual-client';
import { blsStagingClient } from '@/lib/services/bls-client';
import { fridaStagingClient } from '@/lib/services/frida-client';
import { nevoStagingClient } from '@/lib/services/nevo-client';
import { matvaretabellenStagingClient } from '@/lib/services/matvaretabellen-client';
import { foodfilesStagingClient } from '@/lib/services/foodfiles-client';
import { mextStagingClient } from '@/lib/services/mext-client';
import { kfctStagingClient } from '@/lib/services/kfct-client';
import { indbStagingClient } from '@/lib/services/indb-client';
import { aseanfoodsStagingClient } from '@/lib/services/aseanfoods-client';
import { nutrientMapper } from '@/lib/services/nutrient-mapper';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/auth/api-guard';

/**
 * Request body schema
 */
const MetadataSchema = z.object({
  foodFamily: z.string(),
  variety: z.string().nullable(),
  part: z.string().nullable(),
  preparation: z.string().nullable(),
  qualifiers: z.array(z.string()),
  originType: z.enum(['animal', 'plant', 'fungi', 'composite', 'supplement', 'other']),
  isComposite: z.boolean(),
  scientificName: z.string().nullable(),
});

const PortionSchema = z.object({
  description: z.string().min(1),
  gramWeight: z.number().positive(),
  isDefault: z.boolean(),
});

const AddFoodSchema = z.object({
  name: z.string().min(1, 'Food name is required'),
  commonNames: z.array(z.string()).optional().default([]),
  sources: z
    .array(
      z.object({
        apiSource: z.enum(['CNF', 'FDC', 'FOODB', 'PHENOL', 'DUKE', 'AFCD', 'UK_COFID', 'FINELI', 'CIQUAL', 'BLS', 'FRIDA', 'NEVO', 'MATVARETABELLEN', 'FOODFILES', 'MEXT', 'KFCT', 'INDB', 'ASEANFOODS']),
        apiFoodId: z.string().min(1, 'API food ID is required'),
        apiFoodVariant: z.string().optional(), // Specific variant/preparation (e.g., FooDB orig_food_name, Duke plant_part)
        // Multi-variant blend (parent foods only — Duke plant_parts, FooDB orig_food_name).
        // When set, percents must sum to exactly 100 and apiFoodVariant is ignored.
        composition: z
          .array(z.object({
            variant: z.string().min(1),
            percent: z.number().positive().max(100),
          }))
          .min(1)
          .optional()
          .refine(
            (arr) => !arr || Math.round(arr.reduce((s, c) => s + c.percent, 0) * 100) === 10000,
            { message: 'composition percents must sum to 100' },
          ),
      })
        .refine(
          (s) => !s.composition || s.apiSource === 'DUKE' || s.apiSource === 'FOODB',
          { message: 'composition is only supported for DUKE and FOODB sources' },
        )
    )
    .min(1, 'At least one API source is required'),
  userId: z.string().uuid().optional(), // Authenticated user ID (null = anonymous)
  metadata: MetadataSchema.optional(),     // Structured food metadata from AI clarify
  categoryPath: z.string().optional(),     // "Animal > Eggs > Chicken Eggs"
  portions: z.array(PortionSchema).optional(), // AI-curated portions
});

/**
 * Standardized nutrient for merging
 */
interface StandardizedNutrientForMerge {
  compoundId: string | null;
  standardName: string;
  value: number;
  unit: string;
  sourceUnit: string; // Original unit from source before conversion
  apiSource: 'CNF' | 'FDC' | 'FOODB' | 'PHENOL' | 'DUKE' | 'AFCD' | 'UK_COFID' | 'FINELI' | 'CIQUAL' | 'BLS' | 'FRIDA' | 'NEVO' | 'MATVARETABELLEN' | 'FOODFILES' | 'MEXT' | 'KFCT' | 'INDB' | 'ASEANFOODS';
  originalName: string;
}

/**
 * Merged nutrient result
 */
interface MergedNutrientResult {
  compoundId: string | null;
  nutrientName: string;
  averageValue: number;
  unit: string;
  sourceCount: number;
  sources: {
    apiSource: 'CNF' | 'FDC' | 'FOODB' | 'PHENOL' | 'DUKE' | 'AFCD' | 'UK_COFID' | 'FINELI' | 'CIQUAL' | 'BLS' | 'FRIDA' | 'NEVO' | 'MATVARETABELLEN' | 'FOODFILES' | 'MEXT' | 'KFCT' | 'INDB' | 'ASEANFOODS';
    value: number;
    sourceUnit: string;
    originalName: string;
  }[];
}

/**
 * SSE Progress Event Types
 */
interface ProgressEvent {
  type: 'progress' | 'complete' | 'error';
  step?: string;
  percent?: number;
  detail?: string;
  sourceCode?: string;
  food?: any;
  nutrients?: any;
  sources?: any;
  approvalStatus?: string;
  portionCount?: number;
  error?: string;
  failedSources?: Array<{ source: string; error: string }>;
}

/**
 * Source display names for progress messages
 */
const SOURCE_NAMES: Record<string, string> = {
  CNF: '🇨🇦 Canadian Nutrient File',
  FDC: '🇺🇸 USDA FoodData Central',
  FOODB: '🧬 FooDB',
  PHENOL: '🍇 Phenol-Explorer',
  DUKE: '🌿 Duke Phytochemical',
  AFCD: '🇦🇺 Australian Food Composition',
  UK_COFID: '🇬🇧 UK Composition of Foods',
  FINELI: '🇫🇮 Finnish Fineli',
  CIQUAL: '🇫🇷 French CIQUAL',
  BLS: '🇩🇪 German BLS',
  FRIDA: '🇩🇰 Danish FRIDA',
  NEVO: '🇳🇱 Dutch NEVO',
  MATVARETABELLEN: '🇳🇴 Norwegian Matvaretabellen',
  FOODFILES: '🇳🇿 New Zealand FOODfiles',
  MEXT: '🇯🇵 Japanese MEXT',
  KFCT: '🇰🇷 Korean KFCT',
  INDB: '🇮🇳 Indian INDB',
  ASEANFOODS: '🌏 ASEAN Foods',
};

/**
 * POST /api/foods
 * Add food with multi-source nutrient merging
 * Returns Server-Sent Events for real-time progress tracking
 */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const startTime = Date.now();

  // Parse body first (before streaming)
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validationResult = AddFoodSchema.safeParse(body);

  if (!validationResult.success) {
    logger.warn(
      {
        service: 'add-food-api',
        errors: validationResult.error.errors,
      },
      'Invalid add food request'
    );

    return NextResponse.json(
      {
        error: 'Invalid request',
        details: validationResult.error.errors,
      },
      { status: 400 }
    );
  }

  const { name, commonNames, sources, userId, metadata, categoryPath, portions } = validationResult.data;

  // Create streaming response for progress updates
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE events
      const sendEvent = (event: ProgressEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        logger.info(
          {
            service: 'add-food-api',
            name,
            sources: sources.map((s) => `${s.apiSource}:${s.apiFoodId}`),
            userId,
          },
          'Adding food with multi-source nutrient merging'
        );

        // Calculate progress percentages dynamically based on source count
        // Fetching: 0-60%, Standardizing: 60-70%, Merging: 70-85%, Saving: 85-100%
        const sourceCount = sources.length;
        const fetchPercentPerSource = 60 / sourceCount;

        // Send initial progress
        sendEvent({
          type: 'progress',
          step: 'init',
          percent: 0,
          detail: `Starting with ${sourceCount} source${sourceCount > 1 ? 's' : ''}...`,
        });

        // Step 2: Fetch nutrients from each API source sequentially (for progress tracking)
        const nutrientResults: Array<{
          apiSource: 'CNF' | 'FDC' | 'FOODB' | 'PHENOL' | 'DUKE' | 'AFCD' | 'UK_COFID' | 'FINELI' | 'CIQUAL' | 'BLS' | 'FRIDA' | 'NEVO' | 'MATVARETABELLEN' | 'FOODFILES' | 'MEXT' | 'KFCT' | 'INDB' | 'ASEANFOODS';
          apiFoodId: string;
          apiFoodVariant?: string;
          composition?: Array<{ variant: string; percent: number }>;
          nutrients: any[];
        }> = [];

        const failedSources: Array<{ source: string; error: string }> = [];

        for (let i = 0; i < sources.length; i++) {
          const source = sources[i];
          const basePercent = i * fetchPercentPerSource;
          const sourceName = SOURCE_NAMES[source.apiSource] || source.apiSource;

          // Send fetching progress
          sendEvent({
            type: 'progress',
            step: 'fetching',
            percent: Math.round(basePercent),
            detail: `Fetching from ${sourceName}...`,
            sourceCode: source.apiSource,
          });

          try {

          if (source.apiSource === 'CNF') {
            const cnfNutrients = await cnfClient.getNutrients(parseInt(source.apiFoodId, 10));
            nutrientResults.push({
              apiSource: 'CNF' as const,
              apiFoodId: source.apiFoodId,
              nutrients: cnfNutrients,
            });
          } else if (source.apiSource === 'FDC') {
            const usdaNutrients = await usdaClient.getNutrients(parseInt(source.apiFoodId, 10));
            nutrientResults.push({
              apiSource: 'FDC' as const,
              apiFoodId: source.apiFoodId,
              nutrients: usdaNutrients,
            });
          } else if (source.apiSource === 'FOODB') {
            if (source.composition && source.composition.length > 0) {
              const perVariant = await Promise.all(
                source.composition.map(async (c) => ({
                  variant: c.variant,
                  percent: c.percent,
                  nutrients: await foodbStagingClient.getNutrients(
                    parseInt(source.apiFoodId, 10),
                    c.variant,
                  ),
                })),
              );
              nutrientResults.push({
                apiSource: 'FOODB' as const,
                apiFoodId: source.apiFoodId,
                composition: source.composition,
                nutrients: mergeFooDBVariants(perVariant),
              });
            } else {
              const foodbNutrients = await foodbStagingClient.getNutrients(
                parseInt(source.apiFoodId, 10),
                source.apiFoodVariant
              );
              nutrientResults.push({
                apiSource: 'FOODB' as const,
                apiFoodId: source.apiFoodId,
                apiFoodVariant: source.apiFoodVariant,
                nutrients: foodbNutrients,
              });
            }
          } else if (source.apiSource === 'PHENOL') {
            // Phenol-Explorer uses staging tables similar to FooDB
            // TODO: Implement phenolStagingClient.getNutrients when needed
            nutrientResults.push({
              apiSource: 'PHENOL' as const,
              apiFoodId: source.apiFoodId,
              nutrients: [],
            });
          } else if (source.apiSource === 'DUKE') {
            // Duke Phytochemical Database - staging table with plant phytochemicals
            if (source.composition && source.composition.length > 0) {
              const perVariant = await Promise.all(
                source.composition.map(async (c) => ({
                  variant: c.variant,
                  percent: c.percent,
                  nutrients: await dukeStagingClient.getNutrients(source.apiFoodId, c.variant),
                })),
              );
              nutrientResults.push({
                apiSource: 'DUKE' as const,
                apiFoodId: source.apiFoodId,
                composition: source.composition,
                nutrients: mergeDukeVariants(perVariant),
              });
            } else {
              const dukeNutrients = await dukeStagingClient.getNutrients(
                source.apiFoodId,
                source.apiFoodVariant // plant_part filter
              );
              nutrientResults.push({
                apiSource: 'DUKE' as const,
                apiFoodId: source.apiFoodId,
                apiFoodVariant: source.apiFoodVariant,
                nutrients: dukeNutrients,
              });
            }
          } else if (source.apiSource === 'AFCD') {
            // Australian Food Composition Database - staging table with nutrients
            const afcdNutrients = await afcdStagingClient.getNutrients(source.apiFoodId);
            nutrientResults.push({
              apiSource: 'AFCD' as const,
              apiFoodId: source.apiFoodId,
              nutrients: afcdNutrients,
            });
          } else if (source.apiSource === 'UK_COFID') {
            // UK Composition of Foods - staging table with nutrients
            const cofidNutrients = await cofidStagingClient.getNutrients(source.apiFoodId);
            nutrientResults.push({
              apiSource: 'UK_COFID' as const,
              apiFoodId: source.apiFoodId,
              nutrients: cofidNutrients,
            });
          } else if (source.apiSource === 'FINELI') {
            // Finnish Fineli - staging table with nutrients (integer food_id)
            const fineliNutrients = await fineliStagingClient.getNutrients(parseInt(source.apiFoodId, 10));
            nutrientResults.push({
              apiSource: 'FINELI' as const,
              apiFoodId: source.apiFoodId,
              nutrients: fineliNutrients,
            });
          } else if (source.apiSource === 'CIQUAL') {
            // French CIQUAL - staging table with nutrients (integer food_id)
            const ciqualNutrients = await ciqualStagingClient.getNutrients(parseInt(source.apiFoodId, 10));
            nutrientResults.push({
              apiSource: 'CIQUAL' as const,
              apiFoodId: source.apiFoodId,
              nutrients: ciqualNutrients,
            });
          } else if (source.apiSource === 'BLS') {
            // German BLS - staging table with nutrients (text food_code)
            const blsNutrients = await blsStagingClient.getNutrients(source.apiFoodId);
            nutrientResults.push({
              apiSource: 'BLS' as const,
              apiFoodId: source.apiFoodId,
              nutrients: blsNutrients,
            });
          } else if (source.apiSource === 'FRIDA') {
            // Danish FRIDA - staging table with nutrients (integer food_id)
            const fridaNutrients = await fridaStagingClient.getNutrients(parseInt(source.apiFoodId, 10));
            nutrientResults.push({
              apiSource: 'FRIDA' as const,
              apiFoodId: source.apiFoodId,
              nutrients: fridaNutrients,
            });
          } else if (source.apiSource === 'NEVO') {
            // Dutch NEVO - staging table with nutrients (integer food_id)
            const nevoNutrients = await nevoStagingClient.getNutrients(parseInt(source.apiFoodId, 10));
            nutrientResults.push({
              apiSource: 'NEVO' as const,
              apiFoodId: source.apiFoodId,
              nutrients: nevoNutrients,
            });
          } else if (source.apiSource === 'MATVARETABELLEN') {
            // Norwegian Matvaretabellen - staging table with nutrients (text food_id)
            const matvaretabellenNutrients = await matvaretabellenStagingClient.getNutrients(source.apiFoodId);
            nutrientResults.push({
              apiSource: 'MATVARETABELLEN' as const,
              apiFoodId: source.apiFoodId,
              nutrients: matvaretabellenNutrients,
            });
          } else if (source.apiSource === 'FOODFILES') {
            // New Zealand FOODfiles - staging table with nutrients (text food_id)
            const foodfilesNutrients = await foodfilesStagingClient.getNutrients(source.apiFoodId);
            nutrientResults.push({
              apiSource: 'FOODFILES' as const,
              apiFoodId: source.apiFoodId,
              nutrients: foodfilesNutrients,
            });
          } else if (source.apiSource === 'MEXT') {
            // Japanese MEXT - staging table with nutrients (text food_id)
            const mextNutrients = await mextStagingClient.getNutrients(source.apiFoodId);
            nutrientResults.push({
              apiSource: 'MEXT' as const,
              apiFoodId: source.apiFoodId,
              nutrients: mextNutrients,
            });
          } else if (source.apiSource === 'KFCT') {
            // Korean KFCT - staging table with nutrients (text food_id)
            const kfctNutrients = await kfctStagingClient.getNutrients(source.apiFoodId);
            nutrientResults.push({
              apiSource: 'KFCT' as const,
              apiFoodId: source.apiFoodId,
              nutrients: kfctNutrients,
            });
          } else if (source.apiSource === 'INDB') {
            // Indian INDB - staging table with nutrients (text food_id)
            const indbNutrients = await indbStagingClient.getNutrients(source.apiFoodId);
            nutrientResults.push({
              apiSource: 'INDB' as const,
              apiFoodId: source.apiFoodId,
              nutrients: indbNutrients,
            });
          } else if (source.apiSource === 'ASEANFOODS') {
            // ASEAN Foods - staging table with nutrients (text food_id)
            const aseanfoodsNutrients = await aseanfoodsStagingClient.getNutrients(source.apiFoodId);
            nutrientResults.push({
              apiSource: 'ASEANFOODS' as const,
              apiFoodId: source.apiFoodId,
              nutrients: aseanfoodsNutrients,
            });
          } else {
            throw new Error(`Unsupported API source: ${source.apiSource}`);
          }

          // Send completed progress for this source
          sendEvent({
            type: 'progress',
            step: 'fetched',
            percent: Math.round(basePercent + fetchPercentPerSource),
            detail: `Got ${nutrientResults[nutrientResults.length - 1].nutrients.length} nutrients from ${sourceName}`,
            sourceCode: source.apiSource,
          });

          } catch (sourceError) {
            const errorMsg = sourceError instanceof Error ? sourceError.message : String(sourceError);
            logger.warn(
              {
                service: 'add-food-api',
                source: source.apiSource,
                apiFoodId: source.apiFoodId,
                error: errorMsg,
              },
              `Failed to fetch nutrients from ${sourceName}, skipping`
            );
            failedSources.push({ source: source.apiSource, error: errorMsg });
            sendEvent({
              type: 'progress',
              step: 'fetch_error',
              percent: Math.round(basePercent + fetchPercentPerSource),
              detail: `Failed to fetch from ${sourceName}: ${errorMsg}`,
              sourceCode: source.apiSource,
              error: errorMsg,
            });
          }
        }

        logger.debug(
          {
            service: 'add-food-api',
            name,
            fetchedSources: nutrientResults.map((r) => ({
              api: r.apiSource,
              count: r.nutrients.length,
            })),
          },
          'Nutrients fetched from all API sources'
        );

        // Step 2b: Gate — refuse to write a partial food.
        //
        // Previously a source that failed to return nutrients was logged and skipped, but a
        // food_sources row was still written for it. The result was a record asserting
        // "USDA is a source for this food" with zero values behind it — a claim the data
        // did not support. Two of four foods imported that way.
        //
        // Nothing has been written to the database at this point, so failing here is clean:
        // the user keeps their selections and can retry. Each source has already been
        // retried 3x with backoff by this point (see lib/services/http-retry.ts).
        if (failedSources.length > 0) {
          const names = failedSources.map((f) => f.source).join(', ');
          const detail = failedSources
            .map((f) => `${f.source}: ${f.error}`)
            .join(' | ');

          logger.error(
            {
              service: 'add-food-api',
              name,
              failedSources,
              succeededSources: nutrientResults.map((r) => r.apiSource),
            },
            'Aborting import — one or more sources failed after retries; nothing written'
          );

          sendEvent({
            type: 'error',
            error:
              `Could not fetch from ${names} after 3 attempts. Nothing was saved — ` +
              `your selections are still here, so you can try again, or remove ` +
              `${names} and import the rest. (${detail})`,
            failedSources,
          });
          controller.close();
          return;
        }

        // Step 3: Standardize nutrients from each source
        // Count total nutrients for progress tracking
        const totalNutrients = nutrientResults.reduce((sum, r) => sum + r.nutrients.length, 0);
        let processedNutrients = 0;
        let lastReportedPercent = 60;

        sendEvent({
          type: 'progress',
          step: 'standardizing',
          percent: 60,
          detail: `Mapping 0/${totalNutrients} nutrients to compounds...`,
        });

        const allStandardizedNutrients: StandardizedNutrientForMerge[] = [];

        // Helper to report progress during standardization (60% -> 70%)
        const reportStandardizingProgress = () => {
          const progressInStep = processedNutrients / totalNutrients;
          const currentPercent = Math.round(60 + progressInStep * 10); // 60-70%

          // Only send event if percent changed (avoid flooding)
          if (currentPercent > lastReportedPercent) {
            lastReportedPercent = currentPercent;
            sendEvent({
              type: 'progress',
              step: 'standardizing',
              percent: currentPercent,
              detail: `Mapping ${processedNutrients}/${totalNutrients} nutrients to compounds...`,
            });
          }
        };

        for (const result of nutrientResults) {
          if (result.apiSource === 'CNF') {
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              if (!nutrient?.nutrient_web_name || nutrient.nutrient_value == null) {
                reportStandardizingProgress();
                continue;
              }

              const standardized = await nutrientMapper.standardizeCNF(
                nutrient.nutrient_web_name,
                nutrient.nutrient_value,
                nutrient.nutrient_name_id?.toString()
              );

              if (standardized) {
                allStandardizedNutrients.push({
                  compoundId: standardized.compoundId,
                  standardName: standardized.standardName,
                  value: standardized.value,
                  unit: standardized.unit,
                  sourceUnit: standardized.unit, // CNF: nutrient-mapper already converts
                  apiSource: 'CNF',
                  originalName: nutrient.nutrient_web_name,
                });
              }

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'FDC') {
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              if (!nutrient?.nutrient?.name || nutrient.amount == null) {
                reportStandardizingProgress();
                continue;
              }

              const standardized = await nutrientMapper.standardizeUSDA(
                nutrient.nutrient.name,
                nutrient.amount,
                nutrient.nutrient.unitName || 'g',
                nutrient.nutrient.id?.toString()
              );

              if (standardized) {
                allStandardizedNutrients.push({
                  compoundId: standardized.compoundId,
                  standardName: standardized.standardName,
                  value: standardized.value,
                  unit: standardized.unit,
                  sourceUnit: nutrient.nutrient.unitName || 'g',
                  apiSource: 'FDC',
                  originalName: nutrient.nutrient.name,
                });
              }

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'FOODB') {
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              if (!nutrient.compoundId) {
                reportStandardizingProgress();
                continue;
              }

              const unit = nutrient.unit?.replace('/100g', '') || 'mg';

              allStandardizedNutrients.push({
                compoundId: nutrient.compoundId,
                standardName: nutrient.nutriCompoundName || nutrient.compoundName,
                value: nutrient.value,
                unit,
                sourceUnit: nutrient.sourceUnit || unit,
                apiSource: 'FOODB',
                originalName: nutrient.compoundName,
              });

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'DUKE') {
            // Duke phytochemicals - similar pattern to FooDB
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              // Only include mapped compounds
              if (!nutrient.compoundId) {
                reportStandardizingProgress();
                continue;
              }

              // Duke uses ppm or various units, default to ppm
              const unit = nutrient.unit || 'ppm';

              allStandardizedNutrients.push({
                compoundId: nutrient.compoundId,
                standardName: nutrient.nutriCompoundName || nutrient.chemicalName,
                value: nutrient.value,
                unit,
                sourceUnit: nutrient.sourceUnit || unit,
                apiSource: 'DUKE',
                originalName: nutrient.chemicalName,
              });

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'AFCD') {
            // AFCD nutrients - includes all nutrients (not just mapped)
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              // AFCD includes all nutrients with values
              const unit = nutrient.unit || 'g';

              allStandardizedNutrients.push({
                compoundId: nutrient.compoundId,
                standardName: nutrient.nutriCompoundName || nutrient.name,
                value: nutrient.value,
                unit,
                sourceUnit: nutrient.sourceUnit || unit,
                apiSource: 'AFCD',
                originalName: nutrient.name,
              });

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'UK_COFID') {
            // UK CoFID nutrients - includes all nutrients with values
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              const unit = nutrient.unit || 'g';

              allStandardizedNutrients.push({
                compoundId: nutrient.compoundId,
                standardName: nutrient.nutriCompoundName || nutrient.name,
                value: nutrient.value,
                unit,
                sourceUnit: nutrient.sourceUnit || unit,
                apiSource: 'UK_COFID',
                originalName: nutrient.name,
              });

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'FINELI') {
            // Finnish Fineli nutrients - includes all nutrients with values
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              const unit = nutrient.unit || 'g';

              allStandardizedNutrients.push({
                compoundId: nutrient.compoundId,
                standardName: nutrient.nutriCompoundName || nutrient.name,
                value: nutrient.value,
                unit,
                sourceUnit: nutrient.sourceUnit || unit,
                apiSource: 'FINELI',
                originalName: nutrient.name,
              });

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'CIQUAL') {
            // French CIQUAL nutrients - includes all nutrients with values
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              const unit = nutrient.unit || 'g';

              allStandardizedNutrients.push({
                compoundId: nutrient.compoundId,
                standardName: nutrient.nutriCompoundName || nutrient.name,
                value: nutrient.value,
                unit,
                sourceUnit: nutrient.sourceUnit || unit,
                apiSource: 'CIQUAL',
                originalName: nutrient.name,
              });

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'BLS') {
            // German BLS nutrients - includes all nutrients with values
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              const unit = nutrient.unit || 'g';

              allStandardizedNutrients.push({
                compoundId: nutrient.compoundId,
                standardName: nutrient.nutriCompoundName || nutrient.name,
                value: nutrient.value,
                unit,
                sourceUnit: nutrient.sourceUnit || unit,
                apiSource: 'BLS',
                originalName: nutrient.name,
              });

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'FRIDA') {
            // Danish FRIDA nutrients - includes all nutrients with values
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              const unit = nutrient.unit || 'g';

              allStandardizedNutrients.push({
                compoundId: nutrient.compoundId,
                standardName: nutrient.nutriCompoundName || nutrient.name,
                value: nutrient.value,
                unit,
                sourceUnit: nutrient.sourceUnit || unit,
                apiSource: 'FRIDA',
                originalName: nutrient.name,
              });

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'NEVO') {
            // Dutch NEVO nutrients - includes all nutrients with values
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              const unit = nutrient.unit || 'g';

              allStandardizedNutrients.push({
                compoundId: nutrient.compoundId,
                standardName: nutrient.nutriCompoundName || nutrient.name,
                value: nutrient.value,
                unit,
                sourceUnit: nutrient.sourceUnit || unit,
                apiSource: 'NEVO',
                originalName: nutrient.name,
              });

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'MATVARETABELLEN') {
            // Norwegian Matvaretabellen nutrients - includes all nutrients with values
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              const unit = nutrient.unit || 'g';

              allStandardizedNutrients.push({
                compoundId: nutrient.compoundId,
                standardName: nutrient.nutriCompoundName || nutrient.name,
                value: nutrient.value,
                unit,
                sourceUnit: nutrient.sourceUnit || unit,
                apiSource: 'MATVARETABELLEN',
                originalName: nutrient.name,
              });

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'FOODFILES') {
            // New Zealand FOODfiles nutrients - includes all nutrients with values
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              const unit = nutrient.unit || 'g';

              allStandardizedNutrients.push({
                compoundId: nutrient.compoundId,
                standardName: nutrient.nutriCompoundName || nutrient.name,
                value: nutrient.value,
                unit,
                sourceUnit: nutrient.sourceUnit || unit,
                apiSource: 'FOODFILES',
                originalName: nutrient.name,
              });

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'MEXT') {
            // Japanese MEXT nutrients - includes all nutrients with values
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              const unit = nutrient.unit || 'g';

              allStandardizedNutrients.push({
                compoundId: nutrient.compoundId,
                standardName: nutrient.nutriCompoundName || nutrient.name,
                value: nutrient.value,
                unit,
                sourceUnit: nutrient.sourceUnit || unit,
                apiSource: 'MEXT',
                originalName: nutrient.name,
              });

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'KFCT') {
            // Korean KFCT nutrients - includes all nutrients with values
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              const unit = nutrient.unit || 'g';

              allStandardizedNutrients.push({
                compoundId: nutrient.compoundId,
                standardName: nutrient.nutriCompoundName || nutrient.name,
                value: nutrient.value,
                unit,
                sourceUnit: nutrient.sourceUnit || unit,
                apiSource: 'KFCT',
                originalName: nutrient.name,
              });

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'INDB') {
            // Indian INDB nutrients - includes all nutrients with values
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              const unit = nutrient.unit || 'g';

              allStandardizedNutrients.push({
                compoundId: nutrient.compoundId,
                standardName: nutrient.nutriCompoundName || nutrient.name,
                value: nutrient.value,
                unit,
                sourceUnit: nutrient.sourceUnit || unit,
                apiSource: 'INDB',
                originalName: nutrient.name,
              });

              reportStandardizingProgress();
            }
          } else if (result.apiSource === 'ASEANFOODS') {
            // ASEAN Foods nutrients - includes all nutrients with values
            for (const nutrient of result.nutrients) {
              processedNutrients++;

              const unit = nutrient.unit || 'g';

              allStandardizedNutrients.push({
                compoundId: nutrient.compoundId,
                standardName: nutrient.nutriCompoundName || nutrient.name,
                value: nutrient.value,
                unit,
                sourceUnit: nutrient.sourceUnit || unit,
                apiSource: 'ASEANFOODS',
                originalName: nutrient.name,
              });

              reportStandardizingProgress();
            }
          }
          // PHENOL nutrients would be handled similarly when implemented
        }

        logger.debug(
          {
            service: 'add-food-api',
            name,
            totalStandardized: allStandardizedNutrients.length,
          },
          'Nutrients standardized'
        );

        // Step 4: Merge nutrients by compoundId (calculate averages)
        sendEvent({
          type: 'progress',
          step: 'merging',
          percent: 70,
          detail: `Merging ${allStandardizedNutrients.length} nutrients...`,
        });

        const nutrientGroups = new Map<string, StandardizedNutrientForMerge[]>();

        for (const nutrient of allStandardizedNutrients) {
          const groupKey = nutrient.compoundId || nutrient.standardName;
          const existing = nutrientGroups.get(groupKey);
          if (existing) {
            existing.push(nutrient);
          } else {
            nutrientGroups.set(groupKey, [nutrient]);
          }
        }

        const mergedNutrientsData: MergedNutrientResult[] = [];

        for (const [, nutrients] of nutrientGroups.entries()) {
          const sum = nutrients.reduce((acc, n) => acc + n.value, 0);
          const average = sum / nutrients.length;

          mergedNutrientsData.push({
            compoundId: nutrients[0].compoundId,
            nutrientName: nutrients[0].standardName,
            averageValue: average,
            unit: nutrients[0].unit,
            sourceCount: nutrients.length,
            sources: nutrients.map((n) => ({
              apiSource: n.apiSource,
              value: n.value,
              sourceUnit: n.sourceUnit,
              originalName: n.originalName,
            })),
          });
        }

        logger.debug(
          {
            service: 'add-food-api',
            name,
            mergedCount: mergedNutrientsData.length,
          },
          'Nutrients merged'
        );

        sendEvent({
          type: 'progress',
          step: 'merged',
          percent: 85,
          detail: `Merged into ${mergedNutrientsData.length} unique compounds`,
        });

        // Step 5: Insert into database (transaction)
        sendEvent({
          type: 'progress',
          step: 'saving',
          percent: 90,
          detail: 'Saving to database...',
        });

        // Resolve categoryPath to food_category_id
        let foodCategoryId: string | null = null;
        if (categoryPath) {
          const parts = categoryPath.split('>').map((s) => s.trim());
          // Find the deepest matching category node
          const targetName = parts[parts.length - 1];
          const targetLevel = parts.length;

          if (targetLevel >= 1 && targetLevel <= 3) {
            const matches = await db
              .select({ id: foodCategories.id })
              .from(foodCategories)
              .where(
                and(
                  eq(foodCategories.name, targetName),
                  eq(foodCategories.level, targetLevel as 1 | 2 | 3)
                )
              )
              .limit(1);

            if (matches.length > 0) {
              foodCategoryId = matches[0].id;
            }
          }
        }

        const result = await db.transaction(async (tx) => {
          // 5.1: Insert food (with metadata if provided)
          const foodValues: any = {
            name,
            commonNames,
            dataSource: 'NUTRI',
            createdBy: userId || null,
            foodCategoryId,
          };

          // Spread metadata fields if provided
          if (metadata) {
            foodValues.foodFamily = metadata.foodFamily;
            foodValues.variety = metadata.variety;
            foodValues.part = metadata.part;
            foodValues.preparation = metadata.preparation;
            foodValues.qualifiers = metadata.qualifiers;
            foodValues.originType = metadata.originType;
            foodValues.isComposite = metadata.isComposite;
            foodValues.scientificName = metadata.scientificName;
          }

          const [insertedFood] = await tx
            .insert(foods)
            .values(foodValues)
            .returning();

          logger.debug(
            {
              service: 'add-food-api',
              foodId: insertedFood.id,
              name,
            },
            'Food inserted'
          );

          // 5.2: Insert food sources
          // Only record sources that actually returned nutrients. The gate above should
          // already guarantee this, but a food_sources row is a claim about provenance —
          // it must never outrun the data.
          const succeededSourceIds = new Set(nutrientResults.map((r) => r.apiSource));
          const foodSourcesData = sources
            .filter((source) => succeededSourceIds.has(source.apiSource))
            .map((source) => ({
            foodId: insertedFood.id,
            apiSource: source.apiSource,
            apiFoodId: source.apiFoodId,
            // composition takes precedence: when set, apiFoodVariant is null
            apiFoodVariant: source.composition && source.composition.length > 0
              ? null
              : (source.apiFoodVariant || null),
            composition: source.composition && source.composition.length > 0
              ? source.composition
              : null,
            verifiedBy: userId || null,
          }));

          await tx.insert(foodSources).values(foodSourcesData);

          logger.debug(
            {
              service: 'add-food-api',
              foodId: insertedFood.id,
              sourcesCount: foodSourcesData.length,
            },
            'Food sources inserted'
          );

          // 5.3: Insert merged nutrients
          if (mergedNutrientsData.length > 0) {
            const mergedNutrientsInsertData = mergedNutrientsData.map((nutrient) => ({
              foodId: insertedFood.id,
              compoundId: nutrient.compoundId,
              nutrientName: nutrient.nutrientName,
              averageValue: nutrient.averageValue.toString(),
              unit: nutrient.unit,
              sourceCount: nutrient.sourceCount,
            }));

            const insertedMergedNutrients = await tx
              .insert(mergedNutrients)
              .values(mergedNutrientsInsertData)
              .returning();

            logger.debug(
              {
                service: 'add-food-api',
                foodId: insertedFood.id,
                mergedNutrientsCount: insertedMergedNutrients.length,
              },
              'Merged nutrients inserted'
            );

            // 5.4: Insert nutrient source values
            const nutrientSourceValuesData: Array<{
              mergedNutrientId: string;
              apiSource: 'CNF' | 'FDC' | 'FOODB' | 'PHENOL' | 'DUKE' | 'AFCD' | 'UK_COFID' | 'FINELI' | 'CIQUAL' | 'BLS' | 'FRIDA' | 'NEVO' | 'MATVARETABELLEN' | 'FOODFILES' | 'MEXT' | 'KFCT' | 'INDB' | 'ASEANFOODS';
              value: string;
              sourceUnit: string;
              confidence: string;
            }> = [];

            for (let i = 0; i < mergedNutrientsData.length; i++) {
              const mergedNutrient = mergedNutrientsData[i];
              const insertedMergedNutrient = insertedMergedNutrients[i];

              if (!insertedMergedNutrient?.id) {
                continue;
              }

              for (const source of mergedNutrient.sources) {
                nutrientSourceValuesData.push({
                  mergedNutrientId: insertedMergedNutrient.id,
                  apiSource: source.apiSource,
                  value: (source.value ?? 0).toString(),
                  sourceUnit: source.sourceUnit,
                  confidence: '1.0',
                });
              }
            }

            if (nutrientSourceValuesData.length > 0) {
              await tx.insert(nutrientSourceValues).values(nutrientSourceValuesData);
            }

            logger.debug(
              {
                service: 'add-food-api',
                foodId: insertedFood.id,
                sourceValuesCount: nutrientSourceValuesData.length,
              },
              'Nutrient source values inserted'
            );
          }

          // 5.5: Insert food approval
          const approvalStatus = userId ? 'AUTO_APPROVED' : 'PENDING';

          await tx.insert(foodApprovals).values({
            foodId: insertedFood.id,
            status: approvalStatus,
            requestedBy: userId || null,
          });

          logger.debug(
            {
              service: 'add-food-api',
              foodId: insertedFood.id,
              approvalStatus,
            },
            'Food approval inserted'
          );

          // 5.6: Insert food portions (if provided)
          if (portions && portions.length > 0) {
            const portionValues = portions.map((p, i) => ({
              foodId: insertedFood.id,
              description: p.description,
              gramWeight: p.gramWeight.toString(),
              isDefault: p.isDefault,
              sortOrder: i,
              source: 'AI',
            }));

            await tx.insert(foodPortions).values(portionValues);

            logger.debug(
              {
                service: 'add-food-api',
                foodId: insertedFood.id,
                portionCount: portionValues.length,
              },
              'Food portions inserted'
            );
          }

          return {
            food: insertedFood,
            mergedNutrients: mergedNutrientsData,
            approvalStatus,
            portionCount: portions?.length || 0,
          };
        });

        const durationMs = Date.now() - startTime;

        logger.info(
          {
            service: 'add-food-api',
            foodId: result.food.id,
            name,
            sourcesCount: sources.length,
            nutrientsCount: result.mergedNutrients.length,
            durationMs,
          },
          'Food added successfully'
        );

        // Send completion event with full response data
        sendEvent({
          type: 'complete',
          step: 'complete',
          percent: 100,
          detail: 'Food added successfully!',
          food: {
            id: result.food.id,
            name: result.food.name,
            commonNames: result.food.commonNames,
            dataSource: result.food.dataSource,
            createdAt: result.food.createdAt,
            foodFamily: result.food.foodFamily,
            originType: result.food.originType,
            foodCategoryId: result.food.foodCategoryId,
          },
          sources: sources.map((s) => ({
            apiSource: s.apiSource,
            apiFoodId: s.apiFoodId,
          })),
          nutrients: result.mergedNutrients.map((n) => ({
            name: n.nutrientName,
            value: n.averageValue,
            unit: n.unit,
            sourceCount: n.sourceCount,
          })),
          approvalStatus: result.approvalStatus,
          portionCount: result.portionCount,
          failedSources: failedSources.length > 0 ? failedSources : undefined,
        });

        controller.close();
      } catch (error) {
        logger.error(
          {
            service: 'add-food-api',
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
          'Add food error'
        );

        // Send error event
        sendEvent({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        controller.close();
      }
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
