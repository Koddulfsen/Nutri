/**
 * Portion System Types
 *
 * Shared types for the portion extraction and AI synthesis pipeline.
 */

/**
 * Raw portion data extracted from an external source (FDC, CNF, etc.)
 */
export interface RawSourcePortion {
  source: string;         // 'FDC', 'CNF', etc.
  description: string;    // "1 cup", "large", "1 tbsp"
  gramWeight: number;
  amount?: number;        // multiplier (e.g., 1 for "1 cup")
  modifier?: string;      // additional context
}

/**
 * AI-synthesized portion ready for storage
 */
export interface SynthesizedPortion {
  description: string;
  gramWeight: number;
  isDefault: boolean;
}

/**
 * Response from the synthesize-portions endpoint
 */
export interface SynthesizePortionsResponse {
  portions: SynthesizedPortion[];
  rawSourcePortions: RawSourcePortion[];
  aiSynthesized: boolean;
}
