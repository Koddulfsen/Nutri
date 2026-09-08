/**
 * AI Smart Search API Endpoint
 *
 * POST /api/ai/smart-search
 *
 * Purpose: Parallel search across all 18 food sources with AI ranking
 * Pattern: SSE streaming for real-time progress
 * Uses direct staging client imports (no HTTP round-trips for local DBs)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { isAnthropicConfigured, chatCompletion } from '@/lib/ai/anthropic-client';
import { getRankSystemPrompt, buildRankMessages } from '@/lib/ai/prompts';
import { cnfClient } from '@/lib/services/cnf-client';
import { usdaClient } from '@/lib/services/usda-client';
import { foodbStagingClient } from '@/lib/services/foodb-client';
import { dukeStagingClient } from '@/lib/services/duke-client';
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
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/auth/api-guard';

export const maxDuration = 120;

const SmartSearchSchema = z.object({
  canonicalName: z.string().min(1),
  searchQuery: z.string().min(1),
  searchSynonyms: z.array(z.string()).optional().default([]),
});

/**
 * Pre-filter: score results by WHOLE-WORD token overlap with canonical name + synonyms.
 * Uses word boundaries to avoid substring false positives (e.g., "tea" matching "steak").
 * Drops zero-score results if we have enough positives, otherwise keeps them as last resort.
 */
function preFilterResults(
  canonicalName: string,
  searchSynonyms: string[],
  results: NormalizedResult[],
  sourceCode: string,
  limit = 400
): NormalizedResult[] {
  const rawTokens = [canonicalName, ...searchSynonyms]
    .join(' ')
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((t) => t.length > 2);

  const tokens = [...new Set(rawTokens)];

  if (tokens.length === 0 || results.length === 0) return results;

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tokenRegexes = tokens.map((t) => new RegExp(`\\b${escapeRegex(t)}\\b`, 'i'));

  const scored = results.map((r) => {
    const hay = `${r.name} ${r.description ?? ''}`;
    let score = 0;
    for (const rx of tokenRegexes) {
      if (rx.test(hay)) score++;
    }
    return { r, score };
  });

  const positives = scored.filter((s) => s.score > 0);

  // Only keep results that match at least one token as a whole word.
  // If none match, return empty — source effectively has no real match for this food.
  positives.sort((a, b) => b.score - a.score);

  const final = positives.slice(0, limit).map((s) => s.r);

  logger.debug(
    {
      service: 'ai-smart-search',
      source: sourceCode,
      stage: 'pre-filter',
      tokens,
      rawResultCount: results.length,
      positiveCount: positives.length,
      keptCount: final.length,
      topScored: positives.slice(0, 3).map((s) => ({ name: s.r.name, score: s.score })),
    },
    'Pre-filter complete'
  );

  return final;
}

/**
 * Search a source with the primary query + synonyms, deduplicated by apiId.
 */
async function searchWithSynonyms(
  sourceDef: SourceSearchDef,
  searchQuery: string,
  synonyms: string[]
): Promise<NormalizedResult[]> {
  const queries = [searchQuery, ...synonyms];
  const seen = new Set<string>();
  const combined: NormalizedResult[] = [];

  const searches = await Promise.all(
    queries.map(async (q) => {
      try {
        const results = await sourceDef.search(q);
        logger.debug(
          {
            service: 'ai-smart-search',
            source: sourceDef.code,
            stage: 'source-query',
            query: q,
            resultCount: results.length,
            firstFew: results.slice(0, 3).map((r) => r.name),
          },
          'Source query complete'
        );
        return results;
      } catch (err) {
        logger.warn(
          {
            service: 'ai-smart-search',
            source: sourceDef.code,
            query: q,
            error: err instanceof Error ? err.message : String(err),
          },
          'Source query failed'
        );
        return [] as NormalizedResult[];
      }
    })
  );

  for (const results of searches) {
    for (const r of results) {
      if (!seen.has(r.apiId)) {
        seen.add(r.apiId);
        combined.push(r);
      }
    }
  }

  return combined;
}

/** Normalized search result */
interface NormalizedResult {
  apiSource: string;
  apiId: string;
  name: string;
  description?: string;
  nutrientCount?: number;
  variant?: string;
}

/** Source search config */
interface SourceSearchDef {
  code: string;
  name: string;
  icon: string;
  search: (query: string) => Promise<NormalizedResult[]>;
}

const SOURCE_DEFS: SourceSearchDef[] = [
  {
    code: 'CNF',
    name: 'Canadian Nutrient File',
    icon: '\u{1F1E8}\u{1F1E6}',
    search: async (q) => {
      const results = await cnfClient.searchFoods(q, 10000);
      return results.map((r) => ({
        apiSource: 'CNF',
        apiId: String(r.foodCode),
        name: r.name,
      }));
    },
  },
  {
    code: 'FDC',
    name: 'USDA FoodData Central',
    icon: '\u{1F1FA}\u{1F1F8}',
    search: async (q) => {
      const response = await usdaClient.searchFoods(q, 200, 1);
      return (response.foods || []).map((f) => ({
        apiSource: 'FDC',
        apiId: String(f.fdcId),
        name: f.description,
        description: f.dataType,
      }));
    },
  },
  {
    code: 'FOODB',
    name: 'FooDB',
    icon: '\u{1F9EC}',
    search: async (q) => {
      const results = await foodbStagingClient.searchFoods(q, 10000);
      return results.map((r: any) => ({
        apiSource: 'FOODB',
        apiId: String(r.foodbId),
        name: r.name,
        description: r.foodGroup || undefined,
      }));
    },
  },
  {
    code: 'PHENOL',
    name: 'Phenol-Explorer',
    icon: '\u{1F347}',
    search: async (q) => {
      const results = await db.execute<{
        phenol_id: number;
        name: string;
        food_group: string | null;
        scientific_name: string | null;
      }>(sql`
        SELECT phenol_id, name, food_group, scientific_name
        FROM source_phenol_foods
        WHERE name ILIKE ${`%${q}%`}
           OR scientific_name ILIKE ${`%${q}%`}
        ORDER BY name ASC
      `);
      const rows = (results as any).rows ?? results;
      return rows.map((r: any) => ({
        apiSource: 'PHENOL',
        apiId: String(r.phenol_id),
        name: r.name,
        description: r.food_group || r.scientific_name || undefined,
      }));
    },
  },
  {
    code: 'DUKE',
    name: "Dr. Duke's Phytochemical",
    icon: '\u{1F33F}',
    search: async (q) => {
      const results = await dukeStagingClient.searchPlants(q, 10000);
      return results.map((r: any) => ({
        apiSource: 'DUKE',
        apiId: String(r.fnfNum),
        name: r.commonName,
        description: r.latinName || undefined,
      }));
    },
  },
  {
    code: 'AFCD',
    name: 'Australian Food Composition',
    icon: '\u{1F1E6}\u{1F1FA}',
    search: async (q) => {
      const results = await afcdStagingClient.searchFoods(q, 10000);
      return results.map((r: any) => ({
        apiSource: 'AFCD',
        apiId: String(r.afcdFoodKey),
        name: r.name,
        description: r.classification || undefined,
      }));
    },
  },
  {
    code: 'UK_COFID',
    name: 'UK Composition of Foods',
    icon: '\u{1F1EC}\u{1F1E7}',
    search: async (q) => {
      const results = await cofidStagingClient.searchFoods(q, 10000);
      return results.map((r: any) => ({
        apiSource: 'UK_COFID',
        apiId: String(r.foodCode || r.cofidFoodCode),
        name: r.name || r.foodName,
        description: r.foodGroup || undefined,
      }));
    },
  },
  {
    code: 'CIQUAL',
    name: 'French CIQUAL',
    icon: '\u{1F1EB}\u{1F1F7}',
    search: async (q) => {
      const results = await ciqualStagingClient.searchFoods(q, 10000);
      return results.map((r: any) => ({
        apiSource: 'CIQUAL',
        apiId: String(r.foodId || r.ciqualFoodId),
        name: r.name || r.foodName,
        description: r.foodGroup || undefined,
      }));
    },
  },
  {
    code: 'BLS',
    name: 'German BLS',
    icon: '\u{1F1E9}\u{1F1EA}',
    search: async (q) => {
      const results = await blsStagingClient.searchFoods(q, 10000);
      return results.map((r: any) => ({
        apiSource: 'BLS',
        apiId: String(r.foodCode || r.blsFoodCode),
        name: r.name || r.foodName,
        description: r.foodGroup || undefined,
      }));
    },
  },
  {
    code: 'FRIDA',
    name: 'Danish Frida',
    icon: '\u{1F1E9}\u{1F1F0}',
    search: async (q) => {
      const results = await fridaStagingClient.searchFoods(q, 10000);
      return results.map((r: any) => ({
        apiSource: 'FRIDA',
        apiId: String(r.foodId || r.fridaFoodId),
        name: r.name || r.foodName,
        description: r.foodGroup || undefined,
      }));
    },
  },
  {
    code: 'FINELI',
    name: 'Finnish Fineli',
    icon: '\u{1F1EB}\u{1F1EE}',
    search: async (q) => {
      const results = await fineliStagingClient.searchFoods(q, 10000);
      return results.map((r: any) => ({
        apiSource: 'FINELI',
        apiId: String(r.foodId || r.fineliFoodId),
        name: r.name || r.foodName,
        description: r.foodGroup || undefined,
      }));
    },
  },
  {
    code: 'NEVO',
    name: 'Dutch NEVO',
    icon: '\u{1F1F3}\u{1F1F1}',
    search: async (q) => {
      const results = await nevoStagingClient.searchFoods(q, 10000);
      return results.map((r: any) => ({
        apiSource: 'NEVO',
        apiId: String(r.foodId || r.nevoFoodId),
        name: r.name || r.foodName,
        description: r.foodGroup || undefined,
      }));
    },
  },
  {
    code: 'MATVARETABELLEN',
    name: 'Norwegian Matvaretabellen',
    icon: '\u{1F1F3}\u{1F1F4}',
    search: async (q) => {
      const results = await matvaretabellenStagingClient.searchFoods(q, 10000);
      return results.map((r: any) => ({
        apiSource: 'MATVARETABELLEN',
        apiId: String(r.foodId || r.matvaretabellenFoodId),
        name: r.name || r.foodName,
        description: r.foodGroup || undefined,
      }));
    },
  },
  {
    code: 'FOODFILES',
    name: 'New Zealand FOODfiles',
    icon: '\u{1F1F3}\u{1F1FF}',
    search: async (q) => {
      const results = await foodfilesStagingClient.searchFoods(q, 10000);
      return results.map((r: any) => ({
        apiSource: 'FOODFILES',
        apiId: String(r.foodId || r.foodfilesFoodId),
        name: r.name || r.foodName,
        description: r.foodGroup || undefined,
      }));
    },
  },
  {
    code: 'MEXT',
    name: 'Japanese MEXT',
    icon: '\u{1F1EF}\u{1F1F5}',
    search: async (q) => {
      const results = await mextStagingClient.searchFoods(q, 10000);
      return results.map((r: any) => ({
        apiSource: 'MEXT',
        apiId: String(r.foodId || r.mextFoodId),
        name: r.name || r.foodName,
        description: r.foodGroup || undefined,
      }));
    },
  },
  {
    code: 'KFCT',
    name: 'Korean KFCT',
    icon: '\u{1F1F0}\u{1F1F7}',
    search: async (q) => {
      const results = await kfctStagingClient.searchFoods(q, 10000);
      return results.map((r: any) => ({
        apiSource: 'KFCT',
        apiId: String(r.foodId || r.kfctFoodId),
        name: r.name || r.foodName,
        description: r.foodGroup || undefined,
      }));
    },
  },
  {
    code: 'INDB',
    name: 'Indian INDB',
    icon: '\u{1F1EE}\u{1F1F3}',
    search: async (q) => {
      const results = await indbStagingClient.searchFoods(q, 10000);
      return results.map((r: any) => ({
        apiSource: 'INDB',
        apiId: String(r.foodId || r.indbFoodId),
        name: r.name || r.foodName,
        description: r.foodGroup || undefined,
      }));
    },
  },
  {
    code: 'ASEANFOODS',
    name: 'ASEAN Foods',
    icon: '\u{1F30F}',
    search: async (q) => {
      const results = await aseanfoodsStagingClient.searchFoods(q, 10000);
      return results.map((r: any) => ({
        apiSource: 'ASEANFOODS',
        apiId: String(r.foodId || r.aseanfoodsFoodId),
        name: r.name || r.foodName,
        description: r.foodGroup || undefined,
      }));
    },
  },
];

/** Batch size for a single AI ranking call. */
const RANK_BATCH_SIZE = 40;
/** How many ranking calls run at once for one source. */
const RANK_BATCH_CONCURRENCY = 4;

/** Rank one batch (<= RANK_BATCH_SIZE) and return the matched picks in rank order. */
async function rankOneBatch(
  canonicalFood: string,
  sourceDef: SourceSearchDef,
  batch: NormalizedResult[]
): Promise<NormalizedResult[]> {
  const messages = buildRankMessages(
    canonicalFood,
    sourceDef.code,
    sourceDef.name,
    batch.map((r) => ({
      id: r.apiId,
      name: r.name,
      description: r.description,
      nutrientCount: r.nutrientCount,
    }))
  );

  const raw = await chatCompletion(getRankSystemPrompt(), messages);
  const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const ranked: Array<{ id: string; rank: number; reason: string }> = JSON.parse(cleaned);

  const picks: NormalizedResult[] = [];
  for (const pick of ranked.sort((a, b) => a.rank - b.rank)) {
    const found = batch.find((r) => r.apiId === pick.id);
    if (found && !picks.some((p) => p.apiId === found.apiId)) picks.push(found);
  }
  return picks;
}

/**
 * AI rank results for a single source.
 * Small lists go straight to one call. Large lists are split into batches so
 * EVERY candidate is seen by the model, then the batch winners are re-ranked.
 */
async function rankSourceResults(
  canonicalFood: string,
  sourceDef: SourceSearchDef,
  results: NormalizedResult[]
): Promise<{ aiTopPicks: NormalizedResult[]; aiRanked: boolean }> {
  if (results.length === 0) {
    return { aiTopPicks: [], aiRanked: false };
  }

  if (!isAnthropicConfigured()) {
    return { aiTopPicks: results.slice(0, 5), aiRanked: false };
  }

  try {
    // Split into batches; a single batch when the list is already small.
    const batches: NormalizedResult[][] = [];
    for (let i = 0; i < results.length; i += RANK_BATCH_SIZE) {
      batches.push(results.slice(i, i + RANK_BATCH_SIZE));
    }

    // Rank every batch (bounded concurrency) so no candidate is skipped.
    const batchWinners: NormalizedResult[] = [];
    for (let i = 0; i < batches.length; i += RANK_BATCH_CONCURRENCY) {
      const slice = batches.slice(i, i + RANK_BATCH_CONCURRENCY);
      const settled = await Promise.allSettled(
        slice.map((b) => rankOneBatch(canonicalFood, sourceDef, b))
      );
      for (const s of settled) {
        if (s.status === 'fulfilled') {
          for (const p of s.value.slice(0, 5)) {
            if (!batchWinners.some((w) => w.apiId === p.apiId)) batchWinners.push(p);
          }
        }
      }
    }

    // Final re-rank across the pooled winners when there's more than one batch.
    let finalPicks: NormalizedResult[];
    if (batches.length === 1) {
      finalPicks = batchWinners.slice(0, 5);
    } else if (batchWinners.length <= 5) {
      finalPicks = batchWinners;
    } else {
      finalPicks = (await rankOneBatch(canonicalFood, sourceDef, batchWinners)).slice(0, 5);
    }

    const aiRanked = finalPicks.length > 0;

    logger.debug(
      {
        service: 'ai-smart-search',
        source: sourceDef.code,
        stage: 'rank',
        inputCount: results.length,
        batchCount: batches.length,
        pooledWinners: batchWinners.length,
        finalPicks: finalPicks.map((p) => p.name),
        usedFallback: !aiRanked,
      },
      aiRanked ? 'AI rank succeeded' : 'AI rank returned no matching IDs — using fallback'
    );

    return { aiTopPicks: aiRanked ? finalPicks : results.slice(0, 5), aiRanked };
  } catch (error) {
    logger.warn(
      {
        service: 'ai-smart-search',
        source: sourceDef.code,
        error: error instanceof Error ? error.message : String(error),
      },
      'AI ranking failed, falling back to top results'
    );
    return { aiTopPicks: results.slice(0, 5), aiRanked: false };
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireAdmin();
  if (guard) return guard;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const validation = SmartSearchSchema.safeParse(body);
  if (!validation.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request', details: validation.error.errors }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { canonicalName, searchQuery, searchSynonyms } = validation.data;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream may already be closed
        }
      };

      try {
        const allResults: Record<
          string,
          { allResults: NormalizedResult[]; aiTopPicks: NormalizedResult[]; aiRanked: boolean; error?: string }
        > = {};

        logger.info(
          {
            service: 'ai-smart-search',
            stage: 'start',
            canonicalName,
            searchQuery,
            searchSynonyms,
          },
          'Smart search started'
        );

        // Phase 1: Search all sources in parallel (query + synonyms, deduplicated)
        const searchPromises = SOURCE_DEFS.map(async (sourceDef) => {
          try {
            const rawResults = await searchWithSynonyms(sourceDef, searchQuery, searchSynonyms);
            const results = preFilterResults(canonicalName, searchSynonyms, rawResults, sourceDef.code);
            sendEvent({
              type: 'source_searched',
              source: sourceDef.code,
              resultCount: results.length,
            });
            return { sourceDef, results, error: null };
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Search failed';
            logger.warn(
              { service: 'ai-smart-search', source: sourceDef.code, error: msg },
              'Source search failed'
            );
            sendEvent({
              type: 'source_searched',
              source: sourceDef.code,
              resultCount: 0,
              error: msg,
            });
            return { sourceDef, results: [] as NormalizedResult[], error: msg };
          }
        });

        const searchResults = await Promise.all(searchPromises);

        // Phase 2: AI rank sources with results (concurrency limit of 6)
        const sourcesWithResults = searchResults.filter((r) => r.results.length > 0 && !r.error);
        const sourcesWithErrors = searchResults.filter((r) => r.error);

        // Store error sources
        for (const s of sourcesWithErrors) {
          allResults[s.sourceDef.code] = {
            allResults: [],
            aiTopPicks: [],
            aiRanked: false,
            error: s.error || 'Search failed',
          };
        }

        // Store empty-result sources
        for (const s of searchResults.filter((r) => r.results.length === 0 && !r.error)) {
          allResults[s.sourceDef.code] = {
            allResults: [],
            aiTopPicks: [],
            aiRanked: false,
          };
        }

        // Rank with concurrency limit
        // Kept modest: each source may now fan out into several batched rank calls.
        const CONCURRENCY = 3;
        for (let i = 0; i < sourcesWithResults.length; i += CONCURRENCY) {
          const batch = sourcesWithResults.slice(i, i + CONCURRENCY);
          const rankPromises = batch.map(async (s) => {
            const { aiTopPicks, aiRanked } = await rankSourceResults(
              canonicalName,
              s.sourceDef,
              s.results
            );
            sendEvent({ type: 'source_ranked', source: s.sourceDef.code });
            return { code: s.sourceDef.code, allResults: s.results, aiTopPicks, aiRanked };
          });

          const ranked = await Promise.all(rankPromises);
          for (const r of ranked) {
            allResults[r.code] = {
              allResults: r.allResults,
              aiTopPicks: r.aiTopPicks,
              aiRanked: r.aiRanked,
            };
          }
        }

        sendEvent({ type: 'complete', results: allResults });
        controller.close();
      } catch (error) {
        logger.error(
          {
            service: 'ai-smart-search',
            error: error instanceof Error ? error.message : String(error),
          },
          'Smart search error'
        );
        sendEvent({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
