/**
 * Anthropic AI Client
 *
 * Singleton wrapper around the Anthropic SDK for AI-assisted features.
 * Uses claude-haiku-4-5 for cost-efficient food search clarification and ranking.
 */

import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function chatCompletion(
  systemPrompt: string,
  messages: ChatMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: options?.maxTokens ?? 1024,
    temperature: options?.temperature ?? 0,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock?.text ?? '';
}

export interface ChatTool {
  name: string;
  description: string;
  input_schema: Anthropic.Messages.Tool.InputSchema;
  handler: (input: Record<string, unknown>) => Promise<string>;
}

export interface ToolCallRecord {
  name: string;
  input: Record<string, unknown>;
  output: string;
}

export interface ChatWithToolsResult {
  response: string;
  toolCalls: ToolCallRecord[];
}

export async function chatWithTools(
  systemPrompt: string,
  messages: ChatMessage[],
  tools: ChatTool[],
  options?: { maxTokens?: number; maxIterations?: number; model?: string }
): Promise<ChatWithToolsResult> {
  const anthropic = getClient();
  const maxIterations = options?.maxIterations ?? 6;
  const model = options?.model ?? 'claude-haiku-4-5-20251001';

  const sdkTools: Anthropic.Messages.Tool[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));

  const conversation: Anthropic.Messages.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const toolCalls: ToolCallRecord[] = [];

  for (let i = 0; i < maxIterations; i++) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: options?.maxTokens ?? 1024,
      system: systemPrompt,
      tools: sdkTools,
      messages: conversation,
    });

    if (response.stop_reason !== 'tool_use') {
      const textBlock = response.content.find((b) => b.type === 'text');
      return {
        response: textBlock && textBlock.type === 'text' ? textBlock.text : '',
        toolCalls,
      };
    }

    conversation.push({ role: 'assistant', content: response.content });

    const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

    for (const block of toolUseBlocks) {
      if (block.type !== 'tool_use') continue;
      const tool = tools.find((t) => t.name === block.name);
      const input = (block.input ?? {}) as Record<string, unknown>;
      let output: string;
      let isError = false;
      if (!tool) {
        output = `Tool "${block.name}" is not available.`;
        isError = true;
      } else {
        try {
          output = await tool.handler(input);
        } catch (err) {
          output = err instanceof Error ? err.message : String(err);
          isError = true;
        }
      }
      toolCalls.push({ name: block.name, input, output });
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: output,
        is_error: isError,
      });
    }

    conversation.push({ role: 'user', content: toolResults });
  }

  return {
    response: 'I ran out of steps before finishing — could you try rephrasing?',
    toolCalls,
  };
}
