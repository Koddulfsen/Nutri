import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion, isAnthropicConfigured } from '@/lib/ai/anthropic-client';
import { getSelectionSystemPrompt, getReviewSystemPrompt } from '@/lib/ai/prompts';
import type { ChatMessage } from '@/lib/ai/anthropic-client';
import { requireAdmin } from '@/lib/auth/api-guard';

const SYSTEM_PROMPTS: Record<string, () => string> = {
  selection: getSelectionSystemPrompt,
  review: getReviewSystemPrompt,
};

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { message, history = [], agentType } = await req.json();

  if (!message) {
    return NextResponse.json({ error: 'message required' }, { status: 400 });
  }

  const getSystemPrompt = SYSTEM_PROMPTS[agentType];
  if (!getSystemPrompt) {
    return NextResponse.json({ error: 'unknown agentType' }, { status: 400 });
  }

  if (!isAnthropicConfigured()) {
    return NextResponse.json({
      response: "I'm not available right now, but feel free to carry on.",
    });
  }

  const messages: ChatMessage[] = [
    ...history,
    { role: 'user', content: message },
  ];

  const response = await chatCompletion(getSystemPrompt(), messages, { maxTokens: 256 });

  return NextResponse.json({ response });
}
