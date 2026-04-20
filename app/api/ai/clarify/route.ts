/**
 * AI Clarify API Endpoint
 *
 * POST /api/ai/clarify
 *
 * Purpose: AI-powered food query interpretation
 * Uses Haiku to interpret ambiguous food queries into canonical names
 * Falls back gracefully when AI is unavailable
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAnthropicConfigured, chatCompletion } from '@/lib/ai/anthropic-client';
import { getClarifySystemPrompt, buildClarifyMessages } from '@/lib/ai/prompts';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/auth/api-guard';

const ClarifySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const body = await request.json();
    const validation = ClarifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { query, history } = validation.data;

    // Fallback if AI not configured
    if (!isAnthropicConfigured()) {
      return NextResponse.json({
        canonicalName: query,
        searchQuery: query,
        searchSynonyms: [],
        confirmationMessage: 'AI unavailable — using your query directly.',
        needsClarification: false,
        metadata: null,
        categoryPath: null,
        fallback: true,
      });
    }

    const messages = buildClarifyMessages(query, history);

    const raw = await chatCompletion(getClarifySystemPrompt(), messages);

    // Parse AI response - strip markdown fences if present
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({
        canonicalName: parsed.canonicalName || query,
        searchQuery: parsed.searchQuery || query,
        searchSynonyms: Array.isArray(parsed.searchSynonyms) ? parsed.searchSynonyms : [],
        confirmationMessage: parsed.confirmationMessage || `Searching for **${query}**`,
        needsClarification: parsed.needsClarification || false,
        metadata: parsed.metadata || null,
        categoryPath: parsed.categoryPath || null,
        fallback: false,
      });
    } catch {
      logger.warn(
        { service: 'ai-clarify', raw },
        'Failed to parse AI clarify response, using fallback'
      );
      return NextResponse.json({
        canonicalName: query,
        searchQuery: query,
        searchSynonyms: [],
        confirmationMessage: `Searching for **${query}**`,
        needsClarification: false,
        metadata: null,
        categoryPath: null,
        fallback: true,
      });
    }
  } catch (error) {
    logger.error(
      {
        service: 'ai-clarify',
        error: error instanceof Error ? error.message : String(error),
      },
      'Clarify endpoint error'
    );

    // Graceful fallback on any error
    const body = await request.json().catch(() => ({ query: '' }));
    const query = body.query || '';
    return NextResponse.json({
      canonicalName: query,
      searchQuery: query,
      confirmationMessage: 'AI unavailable — using your query directly.',
      needsClarification: false,
      metadata: null,
      categoryPath: null,
      fallback: true,
    });
  }
}
