/**
 * Route Authorization Lint
 *
 * Fails if an API route handler can run without an authorization decision, or if
 * it uses a pattern that has already caused a real vulnerability in this codebase.
 *
 * WHY: authorization used to be per-handler discipline, and 18 of 23 admin routes
 * shipped with no check at all. Discipline does not scale across 91 files; a
 * build-time check does. See docs/AUDIT-2026-08-11.md (A3, B1, B2).
 *
 * Run: npx tsx scripts/check-route-auth.ts
 * CI:  npm run check:auth
 *
 * Rules
 *  1. Every route file must show an authorization decision — `withAuth`,
 *     `withPublic`, `requireAdmin`, `requireUser`, or an explicit `getUser()` check.
 *  2. `getSession()` must not be used for an authorization decision. It only
 *     decodes a cookie the client controls; `getUser()` verifies it.
 *  3. `user_metadata` must never gate access. The user's own client can write it
 *     (`supabase.auth.updateUser({ data: { admin: true } })`).
 *  4. Everything under `app/api/admin/` must call `requireAdmin` or
 *     `withAuth(..., { role: 'admin' })`.
 *
 * ALLOWLIST: routes that are deliberately public live in PUBLIC_ROUTES below.
 * Adding one is an explicit, reviewable decision — which is the point.
 */

import { readFileSync, readdirSync } from 'fs';
import path from 'path';

/**
 * Recursively collect route handlers. Uses fs directly rather than a glob
 * dependency — a security check should not add supply-chain surface.
 */
function findRouteFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findRouteFiles(full, acc);
    else if (entry.name === 'route.ts') acc.push(path.relative(process.cwd(), full));
  }
  return acc;
}

/**
 * Deliberately unauthenticated routes. Each entry needs a reason.
 * Keep this list short and justify every addition in review.
 */
const PUBLIC_ROUTES: Record<string, string> = {
  'app/api/waitlist/route.ts': 'Pre-launch signup form — open by design.',
  'app/api/auth/callback/route.ts': 'OAuth callback; runs before a session exists.',
  'app/api/auth/confirm/route.ts': 'Email confirmation link; runs before a session exists.',
  'app/api/user/delete-account/route.ts':
    'DISABLED — returns 501 unconditionally until the erasure job exists (audit P1).',
  'app/api/user/export/route.ts':
    'DISABLED — returns 501 unconditionally until the export pipeline exists (audit P3).',

  // ── Public reference data ──────────────────────────────────────────────────
  // Reviewed 2026-08-11. These read the compound/food reference database only.
  // They expose NO user data, take no user-scoped parameters, and query local
  // Postgres (no external calls, no per-request cost), so anonymous access is
  // not an abuse or privacy vector. Routes that DO reach external APIs
  // (fdc, cnf, external-search, nutrient-count) and the moderation queue
  // (foods/pending) are deliberately NOT here — they are authenticated.
  //
  // If food search should require login, delete the relevant lines and add
  // `requireUser()` to each handler.
  'app/api/compounds/route.ts': 'Public reference data — compound catalogue.',
  'app/api/compounds/[id]/route.ts': 'Public reference data — single compound.',
  'app/api/compounds/search/route.ts': 'Public reference data — compound search.',
  'app/api/compounds/categories/route.ts': 'Public reference data — compound categories.',
  'app/api/compound-groups/route.ts': 'Public reference data — compound groups.',
  'app/api/food-categories/route.ts': 'Public reference data — food categories.',
  'app/api/foods/[foodId]/route.ts': 'Public reference data — food detail.',
  'app/api/foods/[foodId]/portions/route.ts': 'Public reference data — food portions.',
  'app/api/foods/afcd/search/route.ts': 'Public reference data — local AFCD staging search.',
  'app/api/foods/aseanfoods/search/route.ts': 'Public reference data — local ASEANFOODS staging search.',
  'app/api/foods/bls/search/route.ts': 'Public reference data — local BLS staging search.',
  'app/api/foods/ciqual/search/route.ts': 'Public reference data — local CIQUAL staging search.',
  'app/api/foods/duke/search/route.ts': 'Public reference data — local Duke staging search.',
  'app/api/foods/duke/parts/route.ts': 'Public reference data — Duke plant parts.',
  'app/api/foods/fineli/search/route.ts': 'Public reference data — local Fineli staging search.',
  'app/api/foods/foodb/search/route.ts': 'Public reference data — local FooDB staging search.',
  'app/api/foods/foodfiles/search/route.ts': 'Public reference data — local FOODfiles staging search.',
  'app/api/foods/frida/search/route.ts': 'Public reference data — local Frida staging search.',
  'app/api/foods/indb/search/route.ts': 'Public reference data — local INDB staging search.',
  'app/api/foods/kfct/search/route.ts': 'Public reference data — local KFCT staging search.',
  'app/api/foods/matvaretabellen/search/route.ts': 'Public reference data — local Matvaretabellen staging search.',
  'app/api/foods/mext/search/route.ts': 'Public reference data — local MEXT staging search.',
  'app/api/foods/nevo/search/route.ts': 'Public reference data — local NEVO staging search.',
  'app/api/foods/phenol/search/route.ts': 'Public reference data — local Phenol-Explorer staging search.',
  'app/api/foods/uk-cofid/search/route.ts': 'Public reference data — local UK CoFID staging search.',
};

interface Finding {
  file: string;
  rule: string;
  detail: string;
}

/**
 * Blank out comments and string contents so only real code is matched.
 *
 * This is a character scanner rather than a chain of regexes on purpose. The
 * regex version produced a FALSE POSITIVE — an apostrophe inside a trailing
 * comment (`// don't`) paired with a later quote and swallowed a real
 * `requireAdmin()` call, reporting a protected route as unprotected. A security
 * check that cries wolf gets ignored, so correctness here matters more than
 * brevity.
 */
function stripCommentsAndStrings(src: string): string {
  let out = '';
  let i = 0;
  const n = src.length;

  while (i < n) {
    const c = src[i];
    const next = src[i + 1];

    // line comment
    if (c === '/' && next === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    // block comment
    if (c === '/' && next === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    // string / template literal — keep the delimiters, drop the contents
    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      out += quote;
      i++;
      while (i < n) {
        if (src[i] === '\\') { i += 2; continue; }   // escape
        if (src[i] === quote) break;
        i++;
      }
      out += quote;
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

function main(): void {
  const files = findRouteFiles(path.join(process.cwd(), 'app', 'api')).sort();
  const findings: Finding[] = [];

  for (const file of files) {
    const raw = readFileSync(path.join(process.cwd(), file), 'utf8');
    const code = stripCommentsAndStrings(raw);
    const rel = file.split(path.sep).join('/');

    const isPublic = rel in PUBLIC_ROUTES;
    const isAdminRoute = rel.startsWith('app/api/admin/');

    const usesWithAuth = /\bwithAuth\s*\(/.test(code);
    const usesWithPublic = /\bwithPublic\s*\(/.test(code);
    const usesRequireAdmin = /\brequireAdmin\s*\(/.test(code);
    const usesRequireUser = /\brequireUser\s*\(/.test(code);
    const usesGetUser = /auth\.getUser\s*\(/.test(code);
    const usesGetSession = /auth\.getSession\s*\(/.test(code);
    // Only flag user_metadata when it looks like an ACCESS DECISION, not when a
    // route merely reads display fields (full_name, avatar_url) from it — those
    // are harmless and flagging them would train people to ignore this check.
    const usesUserMetadataGate =
      /user_metadata\s*(\?\.|\.)\s*(admin|is_?admin|role|roles|permission|permissions|staff|superuser|tier|plan)\b/i.test(
        code
      ) || /\bif\s*\([^)]*user_metadata/.test(code);

    // Rule 2 — getSession() is never an authorization decision.
    if (usesGetSession) {
      findings.push({
        file: rel,
        rule: 'getSession',
        detail: 'Uses auth.getSession(); use auth.getUser() (getSession only decodes a client-controlled cookie).',
      });
    }

    // Rule 3 — user_metadata is user-writable.
    if (usesUserMetadataGate) {
      findings.push({
        file: rel,
        rule: 'user_metadata',
        detail: 'Reads user_metadata; the user can write it themselves. Use requireAdmin() / app_metadata / a roles table.',
      });
    }

    // Rule 4 — admin routes must be admin-gated.
    if (isAdminRoute) {
      const adminGated =
        usesRequireAdmin || /withAuth\s*\([\s\S]*?role:\s*['"]admin['"]/.test(code);
      if (!adminGated) {
        findings.push({
          file: rel,
          rule: 'admin-ungated',
          detail: "Under app/api/admin/ but never calls requireAdmin() or withAuth(..., { role: 'admin' }).",
        });
      }
    }

    // Rule 1 — some authorization decision must be visible.
    const hasDecision =
      usesWithAuth || usesWithPublic || usesRequireAdmin || usesRequireUser || usesGetUser;
    if (!hasDecision && !isPublic) {
      findings.push({
        file: rel,
        rule: 'no-auth',
        detail: 'No authorization decision found. Wrap in withAuth(), or add to PUBLIC_ROUTES with a reason.',
      });
    }

    // A route on the allowlist that now authenticates is a stale entry.
    if (isPublic && hasDecision && !usesWithPublic) {
      findings.push({
        file: rel,
        rule: 'stale-allowlist',
        detail: `Listed in PUBLIC_ROUTES ("${PUBLIC_ROUTES[rel]}") but authenticates. Remove the allowlist entry.`,
      });
    }
  }

  const byRule = findings.reduce<Record<string, Finding[]>>((acc, f) => {
    (acc[f.rule] ||= []).push(f);
    return acc;
  }, {});

  console.log(`Scanned ${files.length} route files.\n`);

  if (findings.length === 0) {
    console.log('✓ All route handlers make an authorization decision.');
    process.exit(0);
  }

  for (const [rule, items] of Object.entries(byRule)) {
    console.log(`${rule} (${items.length}):`);
    for (const f of items) console.log(`   ${f.file}\n      ${f.detail}`);
    console.log('');
  }

  console.log(`${findings.length} finding(s) across ${new Set(findings.map(f => f.file)).size} file(s).`);

  // STRICT=1 fails the build. Default is report-only so the check can be adopted
  // before every route has been migrated — flip this on in CI once it reaches zero.
  if (process.env.STRICT === '1') {
    process.exit(1);
  }
  console.log('\n(report-only; run with STRICT=1 to fail on findings)');
}

main();
