/**
 * Retry + error description for outbound HTTP calls.
 *
 * Why this exists: a USDA fetch failed twice during one import session and the only thing
 * that reached the log was `message: "Error"`. Every field that would have identified it —
 * `code`, `cause`, an AggregateError's inner errors, the stack — was discarded by the
 * caller's error handler. The cause was not unknowable; it was thrown away.
 *
 * See docs/IMPORT-INTEGRITY-AUDIT.md.
 */

import { logger } from '@/lib/logger';

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  label: string;
}

/**
 * Flatten everything an error knows about itself into one readable line.
 * Handles AggregateError (what Node's happy-eyeballs throws when every address fails)
 * and nested `cause` chains, both of which are invisible if you only read `.message`.
 */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);

  const parts: string[] = [];
  const e = error as any;

  parts.push(`${e.name || 'Error'}: ${e.message || '(no message)'}`);
  if (e.code) parts.push(`code=${e.code}`);
  if (e.errno !== undefined) parts.push(`errno=${e.errno}`);
  if (e.syscall) parts.push(`syscall=${e.syscall}`);
  if (e.address) parts.push(`address=${e.address}${e.port ? ':' + e.port : ''}`);

  // axios
  if (e.response?.status) parts.push(`http=${e.response.status} ${e.response.statusText ?? ''}`.trim());
  if (!e.response && e.request) parts.push('no-response');

  // AggregateError — the inner errors are the whole story
  if (Array.isArray(e.errors) && e.errors.length > 0) {
    parts.push(`aggregate[${e.errors.map((x: any) => `${x?.code ?? x?.name ?? 'err'}:${x?.message ?? ''}`).join(' | ')}]`);
  }

  // cause chain
  let cause = e.cause;
  let depth = 0;
  while (cause && depth < 3) {
    const c = cause as any;
    parts.push(`cause=${c.name ?? 'Error'}:${c.message ?? ''}${c.code ? `(${c.code})` : ''}`);
    if (Array.isArray(c.errors) && c.errors.length) {
      parts.push(`cause-aggregate[${c.errors.map((x: any) => `${x?.code ?? 'err'}:${x?.message ?? ''}`).join(' | ')}]`);
    }
    cause = c.cause;
    depth++;
  }

  return parts.join(' ');
}

/** Connection-level failures and transient server responses are worth retrying. */
export function isRetryable(error: unknown): boolean {
  const e = error as any;
  const status = e?.response?.status;

  if (status !== undefined) {
    return status === 408 || status === 429 || status >= 500;
  }
  // No HTTP response at all -> connection level. Retry unless the caller aborted.
  if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') return false;
  return true;
}

/**
 * Run `fn`, retrying transient failures with exponential backoff + jitter.
 * On final failure the thrown error carries the full description, so the caller
 * logs something actionable instead of "Error".
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const base = opts.baseDelayMs ?? 400;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable = isRetryable(error);
      const description = describeError(error);

      logger.warn(
        { service: 'http-retry', label: opts.label, attempt, attempts, retryable, description },
        `${opts.label} attempt ${attempt}/${attempts} failed: ${description}`
      );

      if (!retryable || attempt === attempts) break;

      const delay = Math.round(base * 2 ** (attempt - 1) * (0.5 + Math.random()));
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  const description = describeError(lastError);
  const wrapped = new Error(`${opts.label} failed after ${attempts} attempts — ${description}`);
  (wrapped as any).cause = lastError;
  (wrapped as any).description = description;
  throw wrapped;
}
