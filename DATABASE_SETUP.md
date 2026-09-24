# Database Setup

**Status:** the database already exists and is in daily use. This doc is for
setting up a **local development environment** against it, or understanding
how migrations work — not for creating the database from scratch. The
project's actual state lives in `CLAUDE.md` §1 (current status) and §7
(patterns/commands); this file is deliberately narrower and defers to that
doc rather than duplicating it, so it can't drift out of sync again the way
the old version of this file did.

## Where the database lives

Supabase Postgres 17.6, project `knwfnixfanmydbeatamu`, **eu-west-1** (EU
region — this matters, the app stores Article 9 GDPR data). See `CLAUDE.md`
§7 "Local environment" for the full connection details.

Two connection strings are configured in `.env`, on purpose:
- `DATABASE_URL` — transaction pooler, port **6543**. What the running app uses.
- `MIGRATION_DATABASE_URL` — session mode, port **5432**. What `drizzle-kit`,
  `psql`, and bulk data loaders use. Route anything long-running or
  schema-changing through this one, not the pooler.

## First-time local setup

1. Get `.env` from Jens (or 1Password/wherever secrets are kept) — it is
   gitignored and not reconstructable from this repo alone.
2. `npm install`
3. `npx next dev -p 3003` — the dev server always runs on port 3003.
4. Confirm you're actually talking to the real database:
   ```bash
   npm run db:studio
   ```
   If this doesn't show real data (tables with rows, not just empty schema),
   stop and check `.env` before doing anything else.

## Making a schema change

1. Edit the relevant file under `db/schema/`.
2. `npm run db:generate` — this diffs your schema against the last migration
   and writes a new SQL file to `drizzle/`.
3. **Read the generated SQL before applying it.** `drizzle-kit` sometimes
   asks whether a column change is a create/drop or a rename — get this
   wrong and you silently lose data. If the change involves transforming
   existing data (not just adding/dropping a column), the generated
   migration usually needs hand-editing — see `drizzle/0055_supreme_archangel.sql`
   for an example of splitting a migration into "add column" now, an
   application-level backfill script, then "drop old column" once the
   backfill is verified.
4. `npm run db:migrate` — applies it.
5. Verify: query the live table structure directly and confirm it matches
   what the schema file says, in both directions (no column the schema
   doesn't know about, no column the schema expects that isn't there).
   `psql "$MIGRATION_DATABASE_URL" -c '\d table_name'` is the fastest way.

Don't use `npm run db:push` against this database — it's for quick local
iteration on a throwaway database, not for a database with real user data
in it. It skips the migration history and any hand-editing step above.

## What NOT to trust from an old comment or doc

This codebase has a documented history of comments and docs asserting
things that were never actually implemented — see `CLAUDE.md` §0 ("What a
parasite is"). Specifically for the database: nothing in `db/schema/` should
be assumed to be encrypted, retained on a schedule, or covered by
row-level-security just because a comment says so. Check `CLAUDE.md`'s trust
ledger (§4) for what's actually been verified, or verify it yourself against
the live database before repeating a claim.

## Troubleshooting

**"DATABASE_URL environment variable is not set"** — usually means a script
was run with `npx tsx` directly rather than through an npm script, and it's
missing `import 'dotenv/config'` at the top, or `.env` genuinely isn't
present. Next.js itself loads `.env` automatically; standalone scripts do
not.

**A migration you expected to be applied doesn't show up** — check
`drizzle.__drizzle_migrations` (the table Drizzle uses to track what's been
applied) against `drizzle/meta/_journal.json` (what's recorded locally).
These have been out of sync before. Don't assume they match; query both.

**Seed script fails with a network/connection error against a "local"
database** — some seed scripts route through the session connection
(`MIGRATION_DATABASE_URL`) rather than the pooler; using the wrong one, or
using it against the wrong port, is the most common cause. See `CLAUDE.md`
§6d for the exact invocation pattern used by the food-data loaders.
