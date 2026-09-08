/**
 * Dev Auth/Data Shim
 *
 * Purpose: Stand in for the Supabase client while the app runs against a local
 * PostgreSQL instance with no Supabase project attached.
 *
 * Why this exists: the hosted Supabase project was retired when the database
 * moved to local Postgres. ~70 files still call `createClient()` from
 * `@/lib/supabase/server`, so rather than rewrite all of them at once this shim
 * implements the small slice of the Supabase surface those files actually use:
 *
 *   - `auth.getUser()` / `auth.getSession()` and the sign-in/out calls, which
 *     resolve to a fixed local dev user
 *   - `.from(table)` queries covering select/insert/update/delete plus the
 *     eq/neq/in/ilike/order/limit/range/single filters used in this codebase
 *
 * Enabled by `DEV_AUTH_BYPASS=true`. Never enable outside local development —
 * every request is treated as the same authenticated user.
 */

import postgres from 'postgres';

import { devAuth } from './dev-user';

export {
  DEV_USER_ID,
  DEV_USER_EMAIL,
  isDevAuthBypass,
  devUser,
  devSession,
  devAuth,
  createDevBrowserClient,
} from './dev-user';

// Dedicated connection for the shim. Kept separate from `db/index.ts` so this
// file stays self-contained and can be deleted with the shim.
let sqlClient: postgres.Sql | null = null;

function getSql(): postgres.Sql {
  if (sqlClient) return sqlClient;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('[dev-shim] DATABASE_URL is not set');
  }

  sqlClient = postgres(connectionString, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 30,
    // Local Postgres has no TLS configured; the hosted Supabase instance did.
    ssl: false,
    fetch_types: false,
    prepare: false,
  });

  return sqlClient;
}

/** Shape returned by every shim query, matching Supabase's result envelope. */
interface ShimResult<T = any> {
  data: T;
  error: { message: string; code?: string } | null;
  count?: number | null;
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Translates a PostgREST-style `select()` argument into a SQL column list.
 * Embedded-resource syntax (`foods(name)`) is not supported, so those fall
 * back to `*` and let the caller pick fields off the row.
 */
function buildColumnList(select: string): string {
  const trimmed = select.trim();
  if (!trimmed || trimmed === '*' || trimmed.includes('(')) return '*';

  return trimmed
    .split(',')
    .map((col) => col.trim())
    .filter(Boolean)
    .map((col) => {
      // Support "alias:column" the same way PostgREST does.
      const [left, right] = col.split(':').map((p) => p.trim());
      return right
        ? `${quoteIdent(right)} AS ${quoteIdent(left)}`
        : quoteIdent(left);
    })
    .join(', ');
}

type Operation = 'select' | 'insert' | 'update' | 'delete';

interface Filter {
  column: string;
  op: 'eq' | 'neq' | 'in' | 'ilike' | 'gt' | 'gte' | 'lt' | 'lte' | 'is';
  value: any;
}

/**
 * Chainable query builder that mimics the PostgREST fluent API and resolves to
 * a `{ data, error }` envelope when awaited.
 */
class ShimQueryBuilder<T = any> implements PromiseLike<ShimResult<T>> {
  private operation: Operation = 'select';
  private columns = '*';
  private filters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean }[] = [];
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private payload: any = null;
  private wantsSingle = false;
  private singleIsOptional = false;
  private wantsCount = false;
  private returnsRows = true;

  constructor(private table: string) {}

  select(columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated' }) {
    // `select()` after insert/update/delete requests RETURNING rather than
    // starting a new read.
    if (this.operation === 'select') {
      this.operation = 'select';
    }
    this.columns = columns;
    this.returnsRows = true;
    if (options?.count) this.wantsCount = true;
    return this;
  }

  insert(values: any) {
    this.operation = 'insert';
    this.payload = values;
    this.returnsRows = false;
    return this;
  }

  update(values: any) {
    this.operation = 'update';
    this.payload = values;
    this.returnsRows = false;
    return this;
  }

  upsert(values: any) {
    // Only used for straightforward inserts in this codebase.
    return this.insert(values);
  }

  delete() {
    this.operation = 'delete';
    this.returnsRows = false;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ column, op: 'neq', value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, op: 'in', value: values });
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters.push({ column, op: 'ilike', value: pattern });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ column, op: 'gt', value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ column, op: 'gte', value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ column, op: 'lt', value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ column, op: 'lte', value });
    return this;
  }

  is(column: string, value: any) {
    this.filters.push({ column, op: 'is', value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single() {
    this.wantsSingle = true;
    this.singleIsOptional = false;
    return this;
  }

  maybeSingle() {
    this.wantsSingle = true;
    this.singleIsOptional = true;
    return this;
  }

  /** Renders the accumulated state into SQL text plus positional params. */
  private buildSql(): { text: string; params: any[] } {
    const params: any[] = [];
    const table = quoteIdent(this.table);

    const whereClause = () => {
      if (this.filters.length === 0) return '';
      const parts = this.filters.map((f) => {
        const col = quoteIdent(f.column);
        if (f.op === 'in') {
          const list = (f.value as any[]).map((v) => {
            params.push(v);
            return `$${params.length}`;
          });
          // An empty IN () is invalid SQL, so match nothing instead.
          return list.length ? `${col} IN (${list.join(', ')})` : 'FALSE';
        }
        if (f.op === 'is') {
          if (f.value === null) return `${col} IS NULL`;
          return `${col} IS ${f.value ? 'TRUE' : 'FALSE'}`;
        }
        const sqlOp = {
          eq: '=',
          neq: '!=',
          ilike: 'ILIKE',
          gt: '>',
          gte: '>=',
          lt: '<',
          lte: '<=',
        }[f.op];
        params.push(f.value);
        return `${col} ${sqlOp} $${params.length}`;
      });
      return ` WHERE ${parts.join(' AND ')}`;
    };

    if (this.operation === 'insert') {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
      const cols = Object.keys(rows[0] ?? {});
      if (cols.length === 0) throw new Error('[dev-shim] insert() needs at least one column');

      const valueGroups = rows.map((row) => {
        const placeholders = cols.map((c) => {
          params.push(row[c]);
          return `$${params.length}`;
        });
        return `(${placeholders.join(', ')})`;
      });

      const returning = this.returnsRows ? ` RETURNING ${buildColumnList(this.columns)}` : '';
      return {
        text: `INSERT INTO ${table} (${cols.map(quoteIdent).join(', ')}) VALUES ${valueGroups.join(', ')}${returning}`,
        params,
      };
    }

    if (this.operation === 'update') {
      const cols = Object.keys(this.payload ?? {});
      if (cols.length === 0) throw new Error('[dev-shim] update() needs at least one column');

      const assignments = cols.map((c) => {
        params.push(this.payload[c]);
        return `${quoteIdent(c)} = $${params.length}`;
      });

      const returning = this.returnsRows ? ` RETURNING ${buildColumnList(this.columns)}` : '';
      return {
        text: `UPDATE ${table} SET ${assignments.join(', ')}${whereClause()}${returning}`,
        params,
      };
    }

    if (this.operation === 'delete') {
      const returning = this.returnsRows ? ` RETURNING ${buildColumnList(this.columns)}` : '';
      return { text: `DELETE FROM ${table}${whereClause()}${returning}`, params };
    }

    let text = `SELECT ${buildColumnList(this.columns)} FROM ${table}${whereClause()}`;

    if (this.orderBy.length > 0) {
      const parts = this.orderBy.map(
        (o) => `${quoteIdent(o.column)} ${o.ascending ? 'ASC' : 'DESC'}`
      );
      text += ` ORDER BY ${parts.join(', ')}`;
    }
    if (this.limitValue !== null) {
      params.push(this.limitValue);
      text += ` LIMIT $${params.length}`;
    }
    if (this.offsetValue !== null) {
      params.push(this.offsetValue);
      text += ` OFFSET $${params.length}`;
    }

    return { text, params };
  }

  private async execute(): Promise<ShimResult<T>> {
    try {
      const sql = getSql();
      const { text, params } = this.buildSql();
      const rows = (await sql.unsafe(text, params)) as unknown as any[];

      let count: number | null = null;
      if (this.wantsCount) {
        const countParams: any[] = [];
        // Re-derive the WHERE clause on its own param list for the count query.
        const countFilters = this.filters.map((f) => {
          const col = quoteIdent(f.column);
          if (f.op === 'in') {
            const list = (f.value as any[]).map((v) => {
              countParams.push(v);
              return `$${countParams.length}`;
            });
            return list.length ? `${col} IN (${list.join(', ')})` : 'FALSE';
          }
          if (f.op === 'is') {
            if (f.value === null) return `${col} IS NULL`;
            return `${col} IS ${f.value ? 'TRUE' : 'FALSE'}`;
          }
          const sqlOp = { eq: '=', neq: '!=', ilike: 'ILIKE', gt: '>', gte: '>=', lt: '<', lte: '<=' }[f.op];
          countParams.push(f.value);
          return `${col} ${sqlOp} $${countParams.length}`;
        });
        const where = countFilters.length ? ` WHERE ${countFilters.join(' AND ')}` : '';
        const countRows = (await sql.unsafe(
          `SELECT COUNT(*)::int AS count FROM ${quoteIdent(this.table)}${where}`,
          countParams
        )) as unknown as any[];
        count = countRows[0]?.count ?? null;
      }

      if (this.wantsSingle) {
        if (rows.length === 0) {
          return this.singleIsOptional
            ? { data: null as T, error: null, count }
            : {
                data: null as T,
                // Mirrors PostgREST's "no rows returned" code so existing
                // error branches keep behaving the same way.
                error: { message: 'No rows found', code: 'PGRST116' },
                count,
              };
        }
        return { data: rows[0] as T, error: null, count };
      }

      return { data: rows as T, error: null, count };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[dev-shim] query failed on "${this.table}": ${message}`);
      return { data: null as T, error: { message }, count: null };
    }
  }

  then<TResult1 = ShimResult<T>, TResult2 = never>(
    onfulfilled?: ((value: ShimResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

/** Server-side shim client: real local-Postgres queries, fake auth. */
export function createDevClient() {
  return {
    auth: devAuth,
    from<T = any>(table: string) {
      return new ShimQueryBuilder<T>(table);
    },
    rpc() {
      return Promise.resolve({
        data: null,
        error: { message: '[dev-shim] rpc() is not supported' },
      });
    },
  };
}
