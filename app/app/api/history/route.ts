import { requireAuth } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { requestHistory } from '@/lib/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const user = await requireAuth();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const environment = url.searchParams.get('environment');
  const search = url.searchParams.get('search')?.trim();
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 100);

  try {
    const db = getDb();
    const conditions = [];

    if (environment && environment !== 'all') {
      conditions.push(eq(requestHistory.environment, environment));
    }

    if (search) {
      conditions.push(
        sql`(${requestHistory.requestName} ILIKE ${'%' + search + '%'} OR ${requestHistory.url} ILIKE ${'%' + search + '%'} OR ${requestHistory.requestId} ILIKE ${'%' + search + '%'})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(requestHistory)
      .where(whereClause)
      .orderBy(desc(requestHistory.createdAt))
      .limit(limit);

    return Response.json({ history: rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.warn('[HISTORY] Could not load request history from DB:', err);
    return Response.json({ history: [] });
  }
}
