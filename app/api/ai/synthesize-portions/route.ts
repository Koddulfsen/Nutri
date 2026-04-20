/**
 * AI Synthesize Portions API Endpoint
 *
 * POST /api/ai/synthesize-portions
 *
 * Purpose: Generate practical portion suggestions for a food using AI general knowledge.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAnthropicConfigured, chatCompletion } from '@/lib/ai/anthropic-client';
import { getPortionSystemPrompt, buildPortionMessages } from '@/lib/ai/prompts';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/auth/api-guard';
import type { SynthesizedPortion } from '@/lib/services/portion-types';
import type { FoodMetadata } from '@/app/components/modals/smart-add-food/types';

const SynthesizePortionsSchema = z.object({
  canonicalName: z.string().min(1),
  metadata: z
    .object({
      foodFamily: z.string(),
      variety: z.string().nullable(),
      part: z.string().nullable(),
      preparation: z.string().nullable(),
      qualifiers: z.array(z.string()),
      originType: z.enum(['animal', 'plant', 'fungi', 'composite', 'supplement', 'other']),
      isComposite: z.boolean(),
      scientificName: z.string().nullable(),
    })
    .nullable()
    .optional(),
});

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const body = await request.json();
    const validation = SynthesizePortionsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { canonicalName, metadata } = validation.data;

    if (!isAnthropicConfigured()) {
      return NextResponse.json({
        portions: [],
        aiSynthesized: false,
      });
    }

    const messages = buildPortionMessages(canonicalName, metadata as FoodMetadata | null);
    const raw = await chatCompletion(getPortionSystemPrompt(), messages);

    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    try {
      const parsed: SynthesizedPortion[] = JSON.parse(cleaned);

      const validPortions = parsed
        .filter((p) => p.description && p.gramWeight > 0)
        .map((p) => ({
          description: p.description,
          gramWeight: Math.round(p.gramWeight),
          isDefault: !!p.isDefault,
        }));

      const hasDefault = validPortions.some((p) => p.isDefault);
      if (!hasDefault && validPortions.length > 0) {
        validPortions[0].isDefault = true;
      }

      return NextResponse.json({
        portions: validPortions,
        aiSynthesized: true,
      });
    } catch {
      logger.warn({ service: 'synthesize-portions', raw }, 'Failed to parse AI portion response');
      return NextResponse.json({
        portions: [],
        aiSynthesized: false,
      });
    }
  } catch (error) {
    logger.error(
      { service: 'synthesize-portions', error: error instanceof Error ? error.message : String(error) },
      'Synthesize portions error'
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
