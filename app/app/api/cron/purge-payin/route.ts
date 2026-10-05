import { neon } from '@neondatabase/serverless';
import { ensureUserIsolationSchema } from '@/lib/db/ensure-schema';

export const runtime = 'nodejs';

/**
 * Daily rolling purge: deletes payin request_history rows older than 7 days.
 * Saved requests (collection templates) and payout history are never touched.
 * Authenticated by CRON_SECRET only — Vercel cron hits this with
 * Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const auth = request.headers.get('authorization') || '';
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cheap (cached) guard: guarantees the kind column exists before the purge.
  await ensureUserIsolationSchema();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return Response.json({ error: 'DATABASE_URL not configured' }, { status: 500 });
  }

  try {
    const sql = neon(connectionString);
    const deleted =
      await sql`DELETE FROM request_history WHERE kind = 'payin' AND created_at < now() - interval '7 days' RETURNING 1`;
    return Response.json({
      deleted: deleted.length,
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[CRON] purge-payin failed:', err);
    return Response.json({ error: 'Purge failed' }, { status: 500 });
  }
}
