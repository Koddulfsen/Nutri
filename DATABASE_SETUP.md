# Database Setup Guide - Nutri Phase 1

## Current Status

✅ **COMPLETED:**
- Database schema files created (9 files in `db/schema/`)
- Migrations generated (`drizzle/0000_windy_meltdown.sql`)
- 11 tables defined (280 compounds, citations, users, audit, etc.)
- 26 indexes optimized for performance
- All foreign key relationships configured

❌ **REQUIRED BEFORE PROCEEDING:**
- Supabase project must be created
- DATABASE_URL must be configured in `.env`

---

## Setup Instructions

### Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in/sign up
2. Click "New Project"
3. Fill in project details:
   - **Name:** Nutri (or your preferred name)
   - **Database Password:** (generate a strong password - SAVE THIS!)
   - **Region:** Choose closest to your location
   - **Pricing Plan:** Free tier is sufficient for Phase 1 development

### Step 2: Get Database Connection String

1. In Supabase dashboard, go to **Project Settings** (gear icon)
2. Click **Database** in left sidebar
3. Scroll to **Connection string** section
4. Select **URI** tab
5. Copy the connection string (format: `postgresql://postgres:[password]@[host]:5432/postgres`)
6. Replace `[password]` with your actual database password from Step 1

### Step 3: Configure Environment Variables

1. Open `/home/kodd/VibeWiz/Projects/Nutri/.env`
2. Add your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
```

**Where to find each value:**
- **NEXT_PUBLIC_SUPABASE_URL:** Project Settings > API > Project URL
- **NEXT_PUBLIC_SUPABASE_ANON_KEY:** Project Settings > API > Project API keys > anon public
- **SUPABASE_SERVICE_ROLE_KEY:** Project Settings > API > Project API keys > service_role (⚠️ secret!)
- **DATABASE_URL:** Project Settings > Database > Connection string > URI

### Step 4: Apply Database Migrations

Once environment variables are configured, run:

```bash
cd /home/kodd/VibeWiz/Projects/Nutri
npm run db:migrate
```

This will:
- Create 4 PostgreSQL ENUM types
- Create 11 database tables
- Create 26 indexes for query optimization
- Set up all foreign key relationships

### Step 5: Verify Database Setup

Run Drizzle Studio to visually inspect your database:

```bash
npm run db:studio
```

Or verify tables were created:

```sql
-- In Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables (11 total):
1. `api_keys`
2. `audit_log`
3. `compound_citations`
4. `compound_sources`
5. `compound_validation_ranges`
6. `compounds`
7. `food_categories`
8. `medication_interactions`
9. `research_citations`
10. `user_consent`
11. `user_profiles`

---

## What Was Built (Wave 1 - Database Foundation)

### Schema Files Created

```
/home/kodd/VibeWiz/Projects/Nutri/db/
├── schema/
│   ├── enums.ts          # 4 PostgreSQL ENUM types
│   ├── compounds.ts      # Compounds + compound sources tables
│   ├── research.ts       # Research citations + junction table
│   ├── categories.ts     # Food categories (5-level hierarchy)
│   ├── interactions.ts   # Medication interactions
│   ├── validation.ts     # Compound validation ranges
│   ├── users.ts          # User profiles, API keys, consent
│   ├── audit.ts          # Audit log (HIPAA compliance)
│   ├── relations.ts      # CRITICAL: All FK relationships
│   └── index.ts          # Schema exports
└── index.ts              # Database client with connection pooling
```

### Database Architecture

**Performance Targets:**
- Compound lookups: <50ms p95
- Search queries: <100ms p95
- API responses: <200ms p95

**Security Features:**
- Row-Level Security (RLS) for user data isolation
- Data Encryption Key (DEK) storage for E2EE (Phase 3)
- Audit logging (6-year HIPAA retention)
- bcrypt hashed API keys

**Caching Strategy:**
- 4-layer caching (Browser → CDN → Redis → PostgreSQL)
- Redis cache keys defined in architecture
- IndexedDB for offline access

### Migration File

Generated migration: `drizzle/0000_windy_meltdown.sql`
- 11 tables
- 26 indexes (B-tree, GIN, partial)
- 7 foreign keys with proper CASCADE behaviors
- 4 CHECK constraints for data validation
- 6 UNIQUE constraints

---

## Next Steps After Database Setup

### Wave 2: Data Population (Tasks 14-21)

Once migrations are applied, you'll need to:

1. **Seed 280 compounds** (manual curation: $8,100 investment)
   - Source: USDA FoodData Central + research
   - File: `db/seed/compounds.ts`

2. **Seed ~2,500 research citations** (PubMed E-utilities)
   - File: `db/seed/research.ts`

3. **Seed 18 medication interactions**
   - File: `db/seed/interactions.ts`

4. **Seed 280 validation ranges**
   - File: `db/seed/validation.ts`

5. **Create 20-25 test users**
   - File: `db/seed/users.ts`

6. **Seed ~100 food categories**
   - File: `db/seed/categories.ts`

### Wave 3: Caching & Optimization (Tasks 22-24)

- Configure Upstash Redis
- Implement cache-aside patterns
- Test cache performance (target >85% hit rate)

### Wave 4: Testing & Validation (Tasks 25-29)

- Unit tests for queries
- Integration tests for APIs
- RLS policy verification
- Performance benchmarks
- Security audit

---

## Troubleshooting

### Error: "DATABASE_URL is not set"

**Solution:** Follow Step 2 and Step 3 above to configure environment variables.

### Error: "Connection refused" or "timeout"

**Possible causes:**
1. Database password is incorrect in DATABASE_URL
2. Supabase project is paused (Free tier pauses after inactivity)
3. IP address is not allowed (check Supabase Network restrictions)

**Solution:**
- Verify password matches Supabase project
- Wake up project by visiting Supabase dashboard
- Check Project Settings > Database > Connection Pooling

### Error: "relation already exists"

**Solution:**
- You've already run migrations. To reset:
  ```sql
  -- In Supabase SQL Editor, CAREFUL - this deletes ALL data
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  GRANT ALL ON SCHEMA public TO postgres;
  GRANT ALL ON SCHEMA public TO public;
  ```
- Then re-run: `npm run db:migrate`

### Migration fails with foreign key error

**Solution:**
- Ensure migrations are applied in order (Drizzle handles this automatically)
- Check that all referenced tables exist before creating foreign keys

---

## Reference Documentation

- **Architecture:** `.wiz/phases/phase-1-browse-compounds/architecture.md`
- **DRD:** `.wiz/phases/phase-1-browse-compounds/phase-1-drd.md`
- **TODO:** `.wiz/phases/phase-1-browse-compounds/TODO.md`

---

**Generated:** 2025-11-10
**Phase:** 1 - Browse Compounds (Data Architecture Core)
**Status:** Wave 1 Complete - Database Foundation Ready for Migration
