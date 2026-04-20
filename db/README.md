# Database Connection Guide

## IPv6 Connection Issue

**Problem:** Direct PostgreSQL connections via `postgres-js` fail with `ENETUNREACH` IPv6 error on some networks.

**Solution:** Use Supabase REST API instead of direct PostgreSQL when needed.

## When to Use Each Client

### 1. Standard Drizzle Client (`db` from `@/db`)
**Use for:** Migrations, seed scripts, backend Server Actions

```typescript
import { db } from '@/db';
const users = await db.select().from(userProfiles);
```

**Note:** May fail with IPv6 network errors in some environments.

### 2. HTTP Adapter (`dbHttp` from `@/db/drizzle-http-adapter`)
**Use for:** Simple queries, seeding, when IPv6 fails

```typescript
import { dbHttp } from '@/db/drizzle-http-adapter';
await dbHttp.execute('INSERT INTO table_name (col1) VALUES ($1)', ['value']);
```

**Limitations:** Only supports execute() method, not full Drizzle query builder.

### 3. Supabase Client (Recommended for API Routes)
**Use for:** API routes, frontend, production

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const { data, error } = await supabase
  .from('compounds')
  .select('*')
  .eq('id', compoundId);
```

**Benefits:**
- ✅ Works via HTTP (no IPv6 issues)
- ✅ Built-in RLS (Row-Level Security)
- ✅ Automatic connection pooling
- ✅ Works in Vercel Edge runtime
- ✅ Real-time subscriptions available

## Current API Implementation

All compound API routes (`/api/compounds`, `/api/compounds/[id]`, `/api/food-categories`) currently use standard Drizzle client (`db`). If you encounter IPv6 errors:

**Option 1:** Use Supabase client (recommended)
**Option 2:** Use HTTP adapter for simple queries
**Option 3:** Configure IPv4-only DNS resolution at OS level

## Testing Connection

Run this command to verify database connectivity:

```bash
node scripts/test-db-connection.mjs
```

This tests Supabase REST API (always works, bypasses IPv6 issues).
