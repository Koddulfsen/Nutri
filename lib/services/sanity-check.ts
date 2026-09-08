/**
 * Sanity-check a (food, compound) nutrient value against external web sources.
 *
 * Uses Claude Haiku 4.5 + web_search (max 3 uses) to find 2-3 independent
 * sources, compare against our reported value, and return a structured verdict.
 *
 * Cost per call (no cache): ~$0.035 (web search ~$0.03, Haiku tokens ~$0.005).
 * System prompt is cached — repeat calls drop to ~$0.025 + web search.
 */
import Anthropic from '@anthropic-ai/sdk';

export interface SanityCheckInput {
  compoundName: string;
  compoundType: string;
  compoundUnit: string;
  foodName: string;
  ourValue: number;
}

export interface SanityCheckSource {
  name: string;
  url: string;
  value: number | null;
}

export interface SanityCheckResult {
  expected_range: { low: number; high: number; unit: string };
  typical_value: number;
  verdict: 'matches' | 'low_outlier' | 'high_outlier' | 'uncertain';
  confidence: 'high' | 'medium' | 'low';
  sources: SanityCheckSource[];
  note: string;
}

const OUR_SOURCES = [
  'FDC', 'USDA', 'CNF', 'Canadian Nutrient File', 'AFCD',
  'UK CoFID', 'CIQUAL', 'Fineli', 'BLS', 'FRIDA', 'NEVO',
  'Matvaretabellen', 'FOODfiles', 'MEXT', 'KFCT', 'INDB',
  'ASEANFOODS', 'FooDB', 'Phenol-Explorer', 'Duke',
].join(', ');

const SYSTEM_PROMPT = `You are a nutrition fact-checker. Your job is to sanity-check whether a nutrient value reported for a specific food looks right, by cross-referencing against independent web sources.

Process:
1. Use web_search to find 2-3 authoritative sources that report the nutrient content of the food (assume per 100g unless units specify otherwise).
2. Compare our reported value to the typical range from those sources.
3. Return a structured verdict.

Source selection:
- Prefer: consumer nutrition sites (Healthline, VeryWellHealth, Nutritionix), peer-reviewed research papers, regional food composition databases not in our list, university extension services, NIH Office of Dietary Supplements.
- AVOID citing these sources (we already have them): ${OUR_SOURCES}. If a search result is from these, skip it and search for others.

Verdict rules:
- "matches" — our value is within 0.5x to 2x of the typical value from sources.
- "low_outlier" — our value is less than 0.5x the typical.
- "high_outlier" — our value is more than 2x the typical.
- "uncertain" — sources vary wildly, no reliable comparison possible, or compound is not commonly reported for this food.

Confidence:
- "high" — 3+ independent sources agree within a narrow band.
- "medium" — 2 sources agree, or 3 with some spread.
- "low" — fewer than 2 usable sources, or sources conflict substantially.

Note: one sentence summarizing what you found (e.g. "Most sources report 25-35mg/100g, which matches our value of 27mg.").

Sources: 2-3 entries max. For each: name (site or authority), url (direct link), and value (the numeric value they reported for this compound+food, or null if not a direct numeric citation). All values must be in the same unit as our reported value — convert if needed.

Output: After your web searches, respond with ONLY a JSON object matching this exact schema (no prose, no markdown fences):
{
  "expected_range": { "low": number, "high": number, "unit": string },
  "typical_value": number,
  "verdict": "matches" | "low_outlier" | "high_outlier" | "uncertain",
  "confidence": "high" | "medium" | "low",
  "sources": [{ "name": string, "url": string, "value": number | null }],
  "note": string
}`;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export function isSanityCheckConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function runSanityCheck(input: SanityCheckInput): Promise<SanityCheckResult> {
  const anthropic = getClient();

  const userPrompt = `Food: ${input.foodName}
Compound: ${input.compoundName} (${input.compoundType})
Unit: ${input.compoundUnit}
Our reported value: ${input.ourValue} ${input.compoundUnit} per 100g of food

Find 2-3 external sources (not in our database) that report ${input.compoundName} content in ${input.foodName}. Return the structured verdict.`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1500,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      } as any,
    ],
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 3,
      } as any,
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });

  // Extract the JSON from the final text block. Haiku sometimes wraps in ```json fences.
  const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text');
  const finalText = textBlocks.map(b => b.text).join('\n').trim();

  const jsonMatch = finalText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Could not find JSON in response: ${finalText.slice(0, 200)}`);
  }

  const parsed = JSON.parse(jsonMatch[0]) as SanityCheckResult;

  // Minimal sanity-check of the response shape
  if (!parsed.verdict || !parsed.confidence || !Array.isArray(parsed.sources)) {
    throw new Error(`Invalid sanity check response shape: ${JSON.stringify(parsed).slice(0, 200)}`);
  }

  return parsed;
}
