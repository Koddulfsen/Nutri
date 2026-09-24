/**
 * What does an authenticated NON-ADMIN actually reach?
 *
 * `npm run check:auth` answers a narrower question — does every route handler
 * make some authorization decision — and currently reports all 91 clean. That
 * says nothing about which decision. A route wrapped in withPublic() passes
 * that check and is open to the world.
 *
 * This classifies every page and route by the guard it actually applies, so
 * the alpha surface is a list rather than an assumption. It matters because
 * Supabase has disable_signup: false — anyone can create an account — and the
 * alpha gate lives in only two page components.
 *
 * Static analysis: it reads the source for guard calls. It cannot see a guard
 * applied dynamically, and it does not follow imports, so a page delegating its
 * check to a child component reads as ungated here. Treat NONE as "look at
 * this", not as proven-open.
 *
 * Run: npx tsx scripts/audit-access.ts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const APP = join(ROOT, 'app');

type Guard =
  | 'ADMIN'         // requireAdmin() / isAdminUser() -> admin only
  | 'ALPHA_GATE'    // renders <AlphaGate /> for non-admins
  | 'USER'          // requireUser() / getUser() + redirect -> any logged-in user
  | 'PUBLIC'        // withPublic() -> deliberately open, with a reason
  | 'NONE';         // no guard found in this file

type Entry = { file: string; kind: 'page' | 'route'; guard: Guard; note: string };

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/^(page|route|layout)\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

function classify(src: string): { guard: Guard; note: string } {
  if (/requireAdmin\s*\(/.test(src)) return { guard: 'ADMIN', note: 'requireAdmin()' };
  if (/<AlphaGate\s*\/>/.test(src)) return { guard: 'ALPHA_GATE', note: 'AlphaGate for non-admins' };
  if (/isAdminUser\s*\(/.test(src)) return { guard: 'ADMIN', note: 'isAdminUser()' };
  if (/withPublic\s*\(/.test(src)) return { guard: 'PUBLIC', note: 'withPublic() — deliberately open' };
  if (/requireUser\s*\(/.test(src)) return { guard: 'USER', note: 'requireUser()' };
  if (/withAuth\s*\(/.test(src)) return { guard: 'USER', note: 'withAuth()' };
  if (/getUser\s*\(/.test(src) && /redirect\s*\(/.test(src)) {
    return { guard: 'USER', note: 'getUser() + redirect' };
  }
  // The common API shape: read the user, then bail with 401 when there is none.
  if (/getUser\s*\(/.test(src) && /(401|Unauthorized)/.test(src)) {
    return { guard: 'USER', note: 'getUser() + 401' };
  }
  if (/getUser\s*\(/.test(src)) {
    return { guard: 'NONE', note: 'reads getUser() but never acts on it' };
  }
  return { guard: 'NONE', note: 'no guard found' };
}

const entries: Entry[] = [];
for (const full of walk(APP)) {
  const rel = relative(ROOT, full);
  const src = readFileSync(full, 'utf8');
  const kind = /route\.tsx?$/.test(rel) ? 'route' : 'page';
  const { guard, note } = classify(src);
  entries.push({ file: rel, kind, guard, note });
}

// A page under a layout that gates counts as gated. app/admin/layout.tsx checks
// admin for every page beneath it.
const gatingLayouts = entries
  .filter((e) => /layout\.tsx?$/.test(e.file) && (e.guard === 'ADMIN' || e.guard === 'USER'))
  .map((e) => ({ dir: e.file.replace(/\/layout\.tsx?$/, ''), guard: e.guard }));

for (const e of entries) {
  if (e.guard !== 'NONE' || /layout\.tsx?$/.test(e.file)) continue;
  const covering = gatingLayouts.find((l) => e.file.startsWith(l.dir + '/'));
  if (covering) {
    e.guard = covering.guard;
    e.note = `inherited from ${covering.dir}/layout.tsx`;
  }
}

const order: Guard[] = ['NONE', 'PUBLIC', 'USER', 'ALPHA_GATE', 'ADMIN'];
const label: Record<Guard, string> = {
  NONE: 'NO GUARD FOUND — look at these',
  PUBLIC: 'PUBLIC (withPublic, deliberate)',
  USER: 'ANY LOGGED-IN USER — reachable by a non-admin who signed up',
  ALPHA_GATE: 'ALPHA GATE (non-admin sees the waitlist)',
  ADMIN: 'ADMIN ONLY',
};

console.log('\nACCESS AUDIT — %d pages/routes under app/\n', entries.length);
for (const g of order) {
  const rows = entries.filter((e) => e.guard === g && !/layout\.tsx?$/.test(e.file));
  console.log('%s  (%d)', label[g], rows.length);
  for (const r of rows.sort((a, b) => a.file.localeCompare(b.file))) {
    console.log('    %s %s  %s', r.kind === 'route' ? 'API ' : 'PAGE', r.file.padEnd(58), r.note);
  }
  console.log();
}

const counts = order.map((g) => `${g}=${entries.filter((e) => e.guard === g).length}`);
console.log('%s\n', counts.join('  '));
