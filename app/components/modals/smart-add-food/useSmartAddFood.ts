/**
 * Smart Add Food - State Management Hook
 *
 * Manages all state and API calls for the Smart Add Food modal.
 */

import { useState, useCallback, useRef } from 'react';
import { apiUrl } from '@/lib/utils/base-path';
import { FOOD_SOURCES } from '../add-food/source-config';
import type {
  SmartAddPhase,
  ChatMessage,
  ClarifyResult,
  SourceSearchResults,
  SourceStatus,
  NormalizedResult,
  SubmitProgress,
  FoodMetadata,
  PortionEntry,
} from './types';

const ENABLED_SOURCES = FOOD_SOURCES.filter((s) => s.enabled);

/**
 * Turn a non-2xx response into a thrown Error.
 *
 * `fetch()` only rejects on a network failure, so a 401, 403, 404 or 504 arrives
 * as a perfectly ordinary response — and `res.json()` on its body succeeds. Every
 * call here used to take the success path with an error object as its data, which
 * is how a missing admin grant, a stale basePath and a function timeout all ended
 * up rendering as the same spinner that never resolves.
 */
async function assertOk(res: Response, what: string): Promise<void> {
  if (res.ok) return;

  let detail = '';
  try {
    const text = await res.clone().text();
    try {
      const body = JSON.parse(text);
      detail = body.error || body.message || '';
    } catch {
      // An HTML error page (a 404 from a wrong basePath, a proxy 504) — the body
      // is not worth showing, the status is.
      detail = '';
    }
  } catch {
    // Body already consumed or unreadable; the status still tells us something.
  }

  const reason =
    res.status === 401
      ? 'you are not signed in'
      : res.status === 403
        ? 'your account is not allowed to use this'
        : res.status === 404
          ? 'the endpoint was not found'
          : res.status === 504 || res.status === 502
            ? 'the server took too long'
            : detail || 'unexpected error';

  throw new Error(`${what} failed (HTTP ${res.status}: ${reason})`);
}

export function useSmartAddFood(onSuccess?: (food: any) => void, onClose?: () => void) {
  const [phase, setPhase] = useState<SmartAddPhase>('clarify');
  const [agent, setAgent] = useState<'clarify' | 'selection' | 'review'>('clarify');
  const [agentHistoryStart, setAgentHistoryStart] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [clarifyResult, setClarifyResult] = useState<ClarifyResult | null>(null);
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, SourceStatus>>({});
  const [searchError, setSearchError] = useState<string | null>(null);
  const [sourceResults, setSourceResults] = useState<Record<string, SourceSearchResults>>({});
  const [selections, setSelections] = useState<Record<string, NormalizedResult | null>>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [foodName, setFoodName] = useState('');
  const [commonNames, setCommonNames] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<FoodMetadata | null>(null);
  const [categoryPath, setCategoryPath] = useState<string | null>(null);
  const [portions, setPortions] = useState<PortionEntry[]>([]);
  const [portionsLoading, setPortionsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitProgress, setSubmitProgress] = useState<SubmitProgress>({
    isActive: false,
    percent: 0,
    step: '',
    detail: '',
    completedSources: [],
    currentSource: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const loadingMoreRef = useRef<Set<string>>(new Set());
  const goToReviewRef = useRef<() => void>(() => {});
  const synthesizePortionsRef = useRef<(canonical?: string, metadata?: FoodMetadata | null) => void>(() => {});

  // Get sources that have results (for carousel)
  const sourcesWithResults = ENABLED_SOURCES.filter(
    (s) => sourceResults[s.code]?.allResults?.length > 0
  );

  const reset = useCallback(() => {
    setPhase('clarify');
    setAgent('clarify');
    setAgentHistoryStart(0);
    setChatMessages([]);
    setChatLoading(false);
    setClarifyResult(null);
    setSourceStatuses({});
    setSourceResults({});
    setSelections({});
    setSkipped(new Set());
    setCurrentSourceIndex(0);
    setFoodName('');
    setCommonNames([]);
    setMetadata(null);
    setCategoryPath(null);
    setPortions([]);
    setPortionsLoading(false);
    setSubmitting(false);
    setSubmitError(null);
    setSubmitProgress({
      isActive: false, percent: 0, step: '', detail: '',
      completedSources: [], currentSource: null,
    });
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = { role: 'user', content: text };
      setChatMessages((prev) => [...prev, userMsg]);
      setChatLoading(true);

      if (agent === 'selection' || agent === 'review') {
        try {
          const agentHistory = chatMessages.slice(agentHistoryStart);
          const res = await fetch(apiUrl('/api/ai/chat'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              history: agentHistory,
              agentType: agent,
            }),
          });
          await assertOk(res, 'Chat');
          const data = await res.json();
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: data.response || "I'm not sure, but skip any source where nothing looks right.",
          };
          setChatMessages((prev) => [...prev, assistantMsg]);
        } catch (error) {
          const why = error instanceof Error ? error.message : 'Chat failed';
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `${why} — skip any source where nothing fits.` },
          ]);
        } finally {
          setChatLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(apiUrl('/api/ai/clarify'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: text,
            history: chatMessages,
          }),
        });

        await assertOk(res, 'Interpreting the food name');

        const data = await res.json();
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: data.confirmationMessage || `Searching for **${text}**`,
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
        setClarifyResult(data);
        setFoodName(data.canonicalName || text);
        if (data.metadata) setMetadata(data.metadata);
        if (data.categoryPath) setCategoryPath(data.categoryPath);
      } catch (error) {
        // The AI step is genuinely optional — a plain text search still works — but
        // say so, rather than pretending the interpretation succeeded.
        const why = error instanceof Error ? error.message : 'AI unavailable';
        const fallbackMsg: ChatMessage = {
          role: 'assistant',
          content: `${why}. Searching for **${text}** across all databases without AI interpretation.`,
        };
        setChatMessages((prev) => [...prev, fallbackMsg]);
        setClarifyResult({
          canonicalName: text,
          searchQuery: text,
          searchSynonyms: [],
          confirmationMessage: fallbackMsg.content,
          needsClarification: false,
          metadata: null,
          categoryPath: null,
          fallback: true,
        });
        setFoodName(text);
      } finally {
        setChatLoading(false);
      }
    },
    [agent, agentHistoryStart, chatMessages]
  );

  const runExternalSearch = useCallback(async () => {
    if (!clarifyResult) return;

    setPhase('searching');
    setSearchError(null);

    // Switch to selection agent and inject opening message
    setAgentHistoryStart(chatMessages.length);
    setChatMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: "You're now browsing results from our nutrition databases. Pick the best match per source and skip any where nothing fits — ask me anything along the way.",
      },
    ]);
    setAgent('selection');

    // Kick off portion synthesis in background — ready by the time user reaches Review
    synthesizePortionsRef.current(clarifyResult.canonicalName, clarifyResult.metadata);

    // Initialize all source statuses
    const initialStatuses: Record<string, SourceStatus> = {};
    for (const source of ENABLED_SOURCES) {
      initialStatuses[source.code] = { searched: false, ranked: false, resultCount: 0 };
    }
    setSourceStatuses(initialStatuses);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(apiUrl('/api/ai/smart-search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canonicalName: clarifyResult.canonicalName,
          searchQuery: clarifyResult.searchQuery,
          searchSynonyms: clarifyResult.searchSynonyms ?? [],
        }),
        signal: controller.signal,
      });

      await assertOk(res, 'Database search');

      const reader = res.body?.getReader();
      if (!reader) {
        setSearchError('Database search returned no response body.');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // A stream that ends without a `complete` event is a failure, not a result.
      // Vercel returning a 504 mid-stream, or a proxy buffering the whole body and
      // then dropping it, both look exactly like a clean end-of-stream here.
      let sawComplete = false;
      let sawAnyEvent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            sawAnyEvent = true;

            if (event.type === 'source_searched') {
              setSourceStatuses((prev) => ({
                ...prev,
                [event.source]: {
                  ...prev[event.source],
                  searched: true,
                  resultCount: event.resultCount || 0,
                  error: event.error,
                },
              }));
            } else if (event.type === 'source_ranked') {
              setSourceStatuses((prev) => ({
                ...prev,
                [event.source]: { ...prev[event.source], ranked: true },
              }));
            } else if (event.type === 'complete') {
              sawComplete = true;
              setSourceResults(event.results || {});
              setPhase('carousel');
              setCurrentSourceIndex(0);
            } else if (event.type === 'error') {
              sawComplete = true;
              setSearchError(event.error || 'The search failed on the server.');
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      if (!sawComplete) {
        setSearchError(
          sawAnyEvent
            ? 'The search stopped partway through — the server ended the stream before finishing.'
            : 'The search never started. The server accepted the request but sent nothing back.'
        );
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setSearchError(error instanceof Error ? error.message : 'Database search failed.');
      }
    }
  }, [clarifyResult, chatMessages]);

  const startSearch = useCallback(() => {
    if (!clarifyResult) return;
    runExternalSearch();
  }, [clarifyResult, runExternalSearch]);

  const selectFood = useCallback(
    (sourceCode: string, food: NormalizedResult) => {
      setSelections((prev) => ({ ...prev, [sourceCode]: food }));
      setSkipped((prev) => {
        const next = new Set(prev);
        next.delete(sourceCode);
        return next;
      });
      // Auto-advance to next source, or to review if last
      const currentIdx = sourcesWithResults.findIndex((s) => s.code === sourceCode);
      if (currentIdx >= 0) {
        if (currentIdx < sourcesWithResults.length - 1) {
          setCurrentSourceIndex(currentIdx + 1);
        } else {
          goToReviewRef.current();
        }
      }
    },
    [sourcesWithResults]
  );

  const skipSource = useCallback(
    (sourceCode: string) => {
      setSkipped((prev) => new Set(prev).add(sourceCode));
      setSelections((prev) => ({ ...prev, [sourceCode]: null }));
      const currentIdx = sourcesWithResults.findIndex((s) => s.code === sourceCode);
      if (currentIdx >= 0) {
        if (currentIdx < sourcesWithResults.length - 1) {
          setCurrentSourceIndex(currentIdx + 1);
        } else {
          goToReviewRef.current();
        }
      }
    },
    [sourcesWithResults]
  );

  const goToSource = useCallback((index: number) => {
    setCurrentSourceIndex(index);
  }, []);

  const synthesizePortions = useCallback(async (canonicalOverride?: string, metadataOverride?: FoodMetadata | null) => {
    const canonical = canonicalOverride || foodName || clarifyResult?.canonicalName || '';
    if (!canonical) return;

    setPortionsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/ai/synthesize-portions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canonicalName: canonical,
          metadata: metadataOverride ?? metadata,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.portions?.length > 0) {
          setPortions(data.portions);
        }
      }
    } catch (error) {
      console.error('Failed to synthesize portions:', error);
    } finally {
      setPortionsLoading(false);
    }
  }, [foodName, clarifyResult, metadata]);

  synthesizePortionsRef.current = synthesizePortions;

  const goToReview = useCallback(() => {
    setPhase('review');
    setAgentHistoryStart(chatMessages.length);
    setChatMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: "Almost there — confirm the name, add any aliases or portions, and submit. Ask me anything about any of the fields.",
      },
    ]);
    setAgent('review');
  }, [chatMessages]);

  goToReviewRef.current = goToReview;

  const submitFood = useCallback(
    async (userId?: string) => {
      const selectedSources = Object.entries(selections)
        .filter(([, food]) => food !== null)
        .map(([sourceCode, food]) => ({
          apiSource: sourceCode,
          apiFoodId: food!.apiId,
          apiFoodVariant: food!.variant,
        }));

      if (selectedSources.length === 0) {
        setSubmitError('Please select at least one food source');
        return;
      }

      if (!foodName.trim()) {
        setSubmitError('Please enter a food name');
        return;
      }

      setSubmitting(true);
      setSubmitError(null);
      setSubmitProgress({
        isActive: true,
        percent: 0,
        step: 'init',
        detail: 'Starting...',
        completedSources: [],
        currentSource: null,
      });

      try {
        const res = await fetch(apiUrl('/api/foods'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: foodName.trim(),
            commonNames,
            sources: selectedSources,
            userId,
            ...(metadata ? { metadata } : {}),
            ...(categoryPath ? { categoryPath } : {}),
            ...(portions.length > 0 ? { portions } : {}),
          }),
        });

        // Check for non-streaming error
        const contentType = res.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const error = await res.json();
          throw new Error(error.message || error.error || 'Failed to add food');
        }

        // Read SSE stream
        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === 'progress') {
                setSubmitProgress((prev) => {
                  const next = {
                    ...prev,
                    percent: event.percent ?? prev.percent,
                    step: event.step ?? prev.step,
                    detail: event.detail ?? prev.detail,
                  };
                  if (event.step === 'fetched' && event.sourceCode) {
                    next.completedSources = [...prev.completedSources, event.sourceCode];
                    next.currentSource = null;
                  } else if (event.step === 'fetch_error' && event.sourceCode) {
                    next.failedSources = [...(prev.failedSources || []), { source: event.sourceCode, error: event.error || 'Unknown error' }];
                    next.currentSource = null;
                  } else if (event.step === 'fetching' && event.sourceCode) {
                    next.currentSource = event.sourceCode;
                  }
                  return next;
                });
              } else if (event.type === 'complete') {
                setSubmitProgress((prev) => ({
                  ...prev,
                  percent: 100,
                  step: 'complete',
                  detail: event.detail || 'Complete!',
                }));
                onSuccess?.(event.food);
                setTimeout(() => onClose?.(), 500);
                return;
              } else if (event.type === 'error') {
                throw new Error(event.error || 'Unknown error');
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Failed to add food');
        setSubmitProgress((prev) => ({ ...prev, isActive: false }));
      } finally {
        setSubmitting(false);
      }
    },
    [selections, foodName, commonNames, metadata, categoryPath, portions, onSuccess, onClose]
  );

  const manualSearch = useCallback(
    async (sourceCode: string, query: string) => {
      const source = ENABLED_SOURCES.find((s) => s.code === sourceCode);
      if (!source) return;

      // Mark loading
      setSourceResults((prev) => ({
        ...prev,
        [sourceCode]: {
          ...(prev[sourceCode] || { allResults: [], aiTopPicks: [], aiRanked: false }),
          manualLoading: true,
          manualNoResults: false,
          manualQuery: query,
        },
      }));

      try {
        const params = new URLSearchParams({ q: query, limit: '10', page: '1' });
        const res = await fetch(apiUrl(`${source.searchEndpoint}?${params}`));
        if (!res.ok) {
          setSourceResults((prev) => ({
            ...prev,
            [sourceCode]: { ...prev[sourceCode], manualLoading: false },
          }));
          return;
        }

        const data = await res.json();
        const results: NormalizedResult[] = (data.results || []).map((r: any) => ({
          apiSource: sourceCode,
          apiId: r.apiId,
          name: r.name,
          description: r.description,
          nutrientCount: r.nutrientCount,
          variant: r.variant,
        }));

        setSourceResults((prev) => {
          const existing = prev[sourceCode];
          return {
            ...prev,
            [sourceCode]: {
              ...existing,
              // Keep existing results if manual search returns nothing
              allResults: results.length > 0 ? results : (existing?.allResults || []),
              aiTopPicks: existing?.aiTopPicks || results.slice(0, 5),
              aiRanked: existing?.aiRanked ?? false,
              manualHasMore: results.length > 0 ? (data.metadata?.hasMore ?? false) : false,
              manualPage: results.length > 0 ? 1 : (existing?.manualPage ?? 0),
              manualQuery: query,
              manualNoResults: results.length === 0,
              manualLoading: false,
            },
          };
        });
      } catch (error) {
        console.error(`Manual search failed for ${sourceCode}:`, error);
        setSourceResults((prev) => ({
          ...prev,
          [sourceCode]: { ...prev[sourceCode], manualLoading: false },
        }));
      }
    },
    []
  );

  const manualSearchLoadMore = useCallback(
    async (sourceCode: string) => {
      const source = ENABLED_SOURCES.find((s) => s.code === sourceCode);
      const currentResults = sourceResults[sourceCode];
      if (!source || !currentResults?.manualHasMore || !currentResults.manualQuery) return;
      if (loadingMoreRef.current.has(sourceCode)) return;

      loadingMoreRef.current.add(sourceCode);
      const nextPage = (currentResults.manualPage || 1) + 1;
      try {
        const params = new URLSearchParams({
          q: currentResults.manualQuery,
          limit: '10',
          page: nextPage.toString(),
        });
        const res = await fetch(apiUrl(`${source.searchEndpoint}?${params}`));
        if (!res.ok) return;

        const data = await res.json();
        const newResults: NormalizedResult[] = (data.results || []).map((r: any) => ({
          apiSource: sourceCode,
          apiId: r.apiId,
          name: r.name,
          description: r.description,
          nutrientCount: r.nutrientCount,
          variant: r.variant,
        }));

        setSourceResults((prev) => ({
          ...prev,
          [sourceCode]: {
            ...prev[sourceCode],
            allResults: [...(prev[sourceCode]?.allResults || []), ...newResults],
            manualHasMore: data.metadata?.hasMore ?? false,
            manualPage: nextPage,
          },
        }));
      } catch (error) {
        console.error(`Load more failed for ${sourceCode}:`, error);
      } finally {
        loadingMoreRef.current.delete(sourceCode);
      }
    },
    [sourceResults]
  );

  return {
    // State
    phase,
    chatMessages,
    chatLoading,
    clarifyResult,
    sourceStatuses,
    searchError,
    sourceResults,
    selections,
    skipped,
    currentSourceIndex,
    foodName,
    commonNames,
    metadata,
    categoryPath,
    portions,
    portionsLoading,
    submitting,
    submitError,
    submitProgress,
    sourcesWithResults,
    enabledSources: ENABLED_SOURCES,

    // Actions
    sendMessage,
    startSearch,
    retrySearch: startSearch,
    selectFood,
    skipSource,
    goToSource,
    goToReview,
    submitFood,
    manualSearch,
    manualSearchLoadMore,
    setFoodName,
    setCommonNames,
    setMetadata,
    setCategoryPath,
    setPortions,
    setPhase,
    reset,
  };
}
