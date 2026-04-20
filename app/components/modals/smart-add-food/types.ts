/**
 * Smart Add Food Modal - Shared Types
 */

export type SmartAddPhase = 'clarify' | 'searching' | 'carousel' | 'review';

export type OriginType = 'animal' | 'plant' | 'fungi' | 'composite' | 'supplement' | 'other';

export interface FoodMetadata {
  foodFamily: string;
  variety: string | null;
  part: string | null;
  preparation: string | null;
  qualifiers: string[];
  originType: OriginType;
  isComposite: boolean;
  scientificName: string | null;
}

export interface PortionEntry {
  description: string;
  gramWeight: number;
  isDefault: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface NormalizedResult {
  apiSource: string;
  apiId: string;
  name: string;
  description?: string;
  nutrientCount?: number;
  variant?: string;
}

export interface SourceSearchResults {
  allResults: NormalizedResult[];
  aiTopPicks: NormalizedResult[];
  aiRanked: boolean;
  error?: string;
  manualHasMore?: boolean;
  manualPage?: number;
  manualQuery?: string;
  manualNoResults?: boolean;
  manualLoading?: boolean;
}

export interface ClarifyResult {
  canonicalName: string;
  searchQuery: string;
  searchSynonyms: string[];
  confirmationMessage: string;
  needsClarification: boolean;
  metadata: FoodMetadata | null;
  categoryPath: string | null;
  fallback: boolean;
}

export interface SourceStatus {
  searched: boolean;
  ranked: boolean;
  resultCount: number;
  error?: string;
}

export interface SubmitProgress {
  isActive: boolean;
  percent: number;
  step: string;
  detail: string;
  completedSources: string[];
  currentSource: string | null;
  failedSources?: Array<{ source: string; error: string }>;
}

export interface SmartAddState {
  phase: SmartAddPhase;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  clarifyResult: ClarifyResult | null;
  sourceStatuses: Record<string, SourceStatus>;
  sourceResults: Record<string, SourceSearchResults>;
  selections: Record<string, NormalizedResult | null>;
  skipped: Set<string>;
  currentSourceIndex: number;
  foodName: string;
  commonNames: string[];
  submitting: boolean;
  submitError: string | null;
}
