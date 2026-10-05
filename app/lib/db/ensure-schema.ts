import { neon } from '@neondatabase/serverless';
import { DEV_BYPASS_USER_ID } from '@/lib/auth/session';

/**
 * Runtime schema self-healing for per-user data isolation.
 *
 * `npm run db:migrate` (lib/db/migrate.ts) is manual and the drizzle
 * migrator needs the SQL files on disk, which serverless functions do not
 * bundle — so nothing applies migrations on Vercel deploys. This guard runs
 * fully IDEMPOTENT DDL directly through the neon client on the first touched
 * data route hit of a warm instance, then caches the promise so it runs once.
 *
 * The canonical migration history stays in drizzle/0001_user_data_isolation.sql
 * and drizzle/0002_payin_payout_kinds.sql for local/dev use via drizzle-kit —
 * keep both in sync.
 */
let schemaPromise: Promise<void> | null = null;

export function ensureUserIsolationSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = runSchemaGuard().catch((err) => {
      // Reset so a transient failure can be retried on the next request.
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
}

async function runSchemaGuard(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return;

  const sql = neon(connectionString);

  await sql`ALTER TABLE environment_variables ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE`;
  await sql`UPDATE environment_variables SET user_id = created_by WHERE user_id IS NULL AND created_by IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS env_vars_user_idx ON environment_variables(user_id)`;
  await sql`CREATE TABLE IF NOT EXISTS user_drafts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    state jsonb NOT NULL DEFAULT '{}',
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;

  // In local dev the auth bypass uses a synthetic uuid id, so upsert the
  // matching users row (ON CONFLICT DO NOTHING) to satisfy FK constraints.
  if (process.env.DEV_BYPASS_AUTH === 'true') {
    await sql`INSERT INTO users (id, name, email, role)
      VALUES (${DEV_BYPASS_USER_ID}, 'Local Dev Engineer', 'support@assanpay.com', 'admin')
      ON CONFLICT DO NOTHING`;
  }

  // request_history.kind: 'payin' | 'payout' | 'other' (0002 migration).
  // Wrapped fully: the backfill must never break the guard or throw.
  try {
    await sql`ALTER TABLE request_history ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'other'`;
    await sql`CREATE INDEX IF NOT EXISTS request_history_kind_idx ON request_history(kind)`;
    await sql`UPDATE request_history rh
      SET kind = CASE
        WHEN e.category = 'Payin' THEN 'payin'
        WHEN e.category = 'Payout' THEN 'payout'
        ELSE 'other'
      END
      FROM api_endpoints e
      WHERE rh.endpoint_id = e.id
        AND rh.kind = 'other'
        AND rh.endpoint_id IS NOT NULL`;
    // URL-heuristic backfill for rows whose endpointId was never recorded
    // (kind stuck at 'other'). Only upgrades 'other' rows — never downgrades.
    await sql`UPDATE request_history SET kind = 'payout' WHERE kind = 'other' AND url ILIKE '%payout%'`;
    await sql`UPDATE request_history SET kind = 'payin' WHERE kind = 'other' AND url ILIKE '%payin%'`;
  } catch (err) {
    console.warn('[SCHEMA] request_history.kind guard failed (non-fatal):', err);
  }
}
