/**
 * POST /api/ai/log-food — one turn of the food-logging chat.
 *
 * Checks that can refuse the request (auth, rate limit, consent) answer with a
 * plain JSON error and status code. Past those, the response is a stream of
 * newline-delimited JSON events:
 *
 *   {"type":"progress","label":"Looking up egg, bread"}
 *   {"type":"done","response":"…","proposal":{"items":[…]}}   (proposal optional)
 *   {"type":"error","message":"…"}
 *
 * The progress labels are the chat's real steps, reported as they start.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/with-auth';
import { isAnthropicConfigured } from '@/lib/ai/anthropic-client';
import { runFoodLogChat } from '@/lib/ai/food-log-chat';
import { ensureUserProfile } from '@/lib/services/user-service';
import { checkConsent } from '@/lib/dal/consent';
import { checkAiRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const maxDuration = 60;

const ProposalSchema = z.object({
  items: z
    .array(
      z.object({
        foodId: z.string().uuid(),
        name: z.string().max(300),
        grams: z.number().positive().max(5000),
        portion: z.string().max(120),
        guessed: z.boolean(),
        note: z.string().max(200).optional(),
      })
    )
    .max(25),
});

const RequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(8000),
        proposal: ProposalSchema.optional(),
        proposalStatus: z.enum(['open', 'added', 'replaced']).optional(),
      })
    )
    .max(60)
    .default([]),
});

export const POST = withAuth(
  async ({ user, input }) => {
    const userId = user.id;
    const { message, history = [] } = input;

    if (!isAnthropicConfigured()) {
      return NextResponse.json(
        { error: 'AI unavailable', message: "The chat isn't available right now — try the search bar instead." },
        { status: 503 }
      );
    }

    // Every message costs real money; cap it per user. Fails closed — if the
    // limiter can't be reached, the chat is refused rather than made free.
    const limit = await checkAiRateLimit(userId);
    if (!limit.allowed) {
      const minutes = Math.max(1, Math.ceil((limit.resetAt.getTime() - Date.now()) / 60000));
      return NextResponse.json(
        {
          error: 'Rate limited',
          message: `You've reached the chat limit for now — try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        },
        { status: 429 }
      );
    }

    await ensureUserProfile(userId, {
      fullName: user.user_metadata?.full_name || user.user_metadata?.name,
      avatarUrl: user.user_metadata?.avatar_url,
    });

    // This sends the user's verbatim message to the Anthropic API — requires its
    // own explicit consent, separate from general "third party" sharing.
    const hasAiConsent = await checkConsent(userId, 'aiProcessing');
    if (!hasAiConsent) {
      return NextResponse.json(
        {
          error: 'AI processing not enabled',
          message: 'Enable "AI-Assisted Logging" in Settings > Privacy to use the chat logger.',
        },
        { status: 403 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: Record<string, unknown>) => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
          } catch {
            // The client went away; nothing to tell.
          }
        };

        try {
          const { response, proposal } = await runFoodLogChat({
            userId,
            history,
            message,
            onProgress: (label) => send({ type: 'progress', label }),
          });
          send({ type: 'done', response, proposal });
        } catch (err) {
          logger.error(
            {
              service: 'log-food-chat',
              userId,
              error: err instanceof Error ? err.message : String(err),
              stack: err instanceof Error ? err.stack : undefined,
            },
            'log-food chat failed'
          );
          send({ type: 'error', message: 'Something went wrong — please try again.' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-store',
        // Stop proxies from holding the stream back until it ends.
        'X-Accel-Buffering': 'no',
      },
    });
  },
  { schema: RequestSchema, source: 'body' }
);
