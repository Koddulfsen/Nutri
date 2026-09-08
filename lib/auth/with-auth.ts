/**
 * Route Handler Wrappers — the single enforcement point for API authorization.
 *
 * WHY THIS EXISTS
 *
 * Authorization used to be per-handler discipline: every route author had to
 * remember to authenticate, to authorize, to validate input, and to avoid leaking
 * internals in errors. That failed exactly the way per-handler discipline always
 * fails — 18 of 23 admin routes shipped with no authorization check at all, two
 * authorized on a flag the user could set on themselves, 29 files used
 * `getSession()` (which only decodes a cookie) where they needed `getUser()`
 * (which verifies it), and 65 returned raw database errors to clients.
 *
 * A wrapper cannot be forgotten in the same way a convention can. A handler
 * written against this API has no way to run unauthenticated: it receives an
 * already-resolved user, and never sees the raw request unless it asks.
 *
 * Middleware is NOT a substitute for this. It can be bypassed — see
 * CVE-2025-29927, where a spoofed `x-middleware-subrequest` header skipped Next.js
 * middleware entirely, including every auth check inside it. Middleware is a
 * second line of defence; this is the boundary.
 *
 * USAGE
 *
 *   export const GET = withAuth(async ({ user }) => {
 *     return NextResponse.json({ id: user.id });
 *   });
 *
 *   export const POST = withAuth(
 *     async ({ user, input }) => { ... },
 *     { schema: CreateMealSchema }          // input is typed from the schema
 *   );
 *
 *   export const PATCH = withAuth(
 *     async ({ user, params }) => { ... },
 *     { role: 'admin' }
 *   );
 *
 *   export const GET = withPublic(async () => { ... });  // deliberately open
 *
 * Every route handler should be produced by `withAuth` or `withPublic`. Use
 * `withPublic` only for endpoints that are genuinely open, and say why in a
 * comment — it is an explicit, greppable decision rather than an omission.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import type { ZodSchema } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from './permissions';
import { logger } from '@/lib/logger';

/** Where to read request input from before validating it. */
export type InputSource = 'body' | 'query';

export interface WithAuthOptions<TInput> {
  /** 'user' (default) requires any authenticated user; 'admin' also requires admin. */
  role?: 'user' | 'admin';
  /** Validates request input. When set, `input` is typed from this schema. */
  schema?: ZodSchema<TInput>;
  /** Defaults to 'body' for mutating methods, 'query' for GET/HEAD/DELETE. */
  source?: InputSource;
}

/** What an authenticated handler receives. It never has to resolve identity itself. */
export interface AuthedContext<TInput, TParams> {
  req: NextRequest;
  user: User;
  /** Validated input when a schema was supplied; otherwise `undefined`. */
  input: TInput;
  /** Awaited route params for dynamic segments, e.g. `{ mealId }`. */
  params: TParams;
}

export interface PublicContext<TInput, TParams> {
  req: NextRequest;
  input: TInput;
  params: TParams;
}

/** Next.js passes dynamic route params as a promise in the second argument. */
type RouteContext<TParams> = { params: Promise<TParams> } | undefined;

/**
 * Generates a short correlation id so a client-facing error can be tied to a
 * server log line without exposing the underlying failure.
 */
function correlationId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function defaultSource(method: string): InputSource {
  return method === 'GET' || method === 'HEAD' || method === 'DELETE' ? 'query' : 'body';
}

async function readInput(req: NextRequest, source: InputSource): Promise<unknown> {
  if (source === 'query') {
    return Object.fromEntries(req.nextUrl.searchParams.entries());
  }
  try {
    return await req.json();
  } catch {
    // Malformed or absent JSON body — let the schema decide whether that is valid.
    return undefined;
  }
}

async function resolveParams<TParams>(context: RouteContext<TParams>): Promise<TParams> {
  if (!context?.params) return {} as TParams;
  return await context.params;
}

/**
 * Wraps a route handler with authentication, authorization, input validation and
 * sanitized error handling.
 */
export function withAuth<TInput = undefined, TParams = Record<string, string>>(
  handler: (ctx: AuthedContext<TInput, TParams>) => Promise<Response>,
  options: WithAuthOptions<TInput> = {}
) {
  return async function route(
    req: NextRequest,
    context?: RouteContext<TParams>
  ): Promise<Response> {
    const path = req.nextUrl.pathname;

    try {
      const supabase = await createClient();

      // getUser(), never getSession(): getSession only decodes the cookie, which
      // the client controls. getUser verifies it against the auth server.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (options.role === 'admin' && !(await isAdminUser(user))) {
        logger.warn({ userId: user.id, path }, 'Non-admin attempted admin route');
        // 403, not 404 — the caller is authenticated, so hiding existence buys
        // nothing, and a clear denial is easier to debug.
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      let input = undefined as TInput;
      if (options.schema) {
        const source = options.source ?? defaultSource(req.method);
        const parsed = options.schema.safeParse(await readInput(req, source));

        if (!parsed.success) {
          // Validation detail is safe to return: it describes the caller's own
          // input, not our internals.
          return NextResponse.json(
            { error: 'Invalid request', details: parsed.error.issues },
            { status: 400 }
          );
        }
        input = parsed.data;
      }

      return await handler({
        req,
        user,
        input,
        params: await resolveParams(context),
      });
    } catch (error) {
      // Never return `error.message`: raw Postgres and Drizzle errors disclose
      // table and column names. Log the detail, return an opaque reference.
      const ref = correlationId();
      logger.error(
        {
          ref,
          path,
          method: req.method,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Unhandled error in route handler'
      );
      return NextResponse.json(
        { error: 'Internal server error', ref },
        { status: 500 }
      );
    }
  };
}

/**
 * Wraps a deliberately public route handler.
 *
 * Gets input validation and sanitized errors, but no authentication. Using this
 * is an explicit, greppable decision — always accompany it with a comment
 * explaining why the endpoint is open.
 */
export function withPublic<TInput = undefined, TParams = Record<string, string>>(
  handler: (ctx: PublicContext<TInput, TParams>) => Promise<Response>,
  options: Omit<WithAuthOptions<TInput>, 'role'> = {}
) {
  return async function route(
    req: NextRequest,
    context?: RouteContext<TParams>
  ): Promise<Response> {
    const path = req.nextUrl.pathname;

    try {
      let input = undefined as TInput;
      if (options.schema) {
        const source = options.source ?? defaultSource(req.method);
        const parsed = options.schema.safeParse(await readInput(req, source));

        if (!parsed.success) {
          return NextResponse.json(
            { error: 'Invalid request', details: parsed.error.issues },
            { status: 400 }
          );
        }
        input = parsed.data;
      }

      return await handler({ req, input, params: await resolveParams(context) });
    } catch (error) {
      const ref = correlationId();
      logger.error(
        {
          ref,
          path,
          method: req.method,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Unhandled error in public route handler'
      );
      return NextResponse.json(
        { error: 'Internal server error', ref },
        { status: 500 }
      );
    }
  };
}
