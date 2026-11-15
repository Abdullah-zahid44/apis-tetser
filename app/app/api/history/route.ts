import { requireAuth } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { ensureUserIsolationSchema } from '@/lib/db/ensure-schema';
import { apiEndpoints, countries, requestHistory, users } from '@/lib/db/schema';
import { desc, eq, and, or, sql } from 'drizzle-orm';
import { getTableColumns } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const user = await requireAuth();
  if (!user || !user.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const kind = url.searchParams.get('kind')?.trim();
  const environment = url.searchParams.get('environment');
  const country = url.searchParams.get('country')?.trim().toLowerCase();
  const search = url.searchParams.get('search')?.trim();
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 100);

  try {
    const db = getDb();
    await ensureUserIsolationSchema();

    // Team-wide payout feed: no userId filter, attributed to the executing
    // user's Gmail, ordered newest first. Payout rows are never purged.
    // The selected market is mandatory so one country's feed can never leak
    // into another market view.
    if (kind === 'payout') {
      if (!country) {
        return Response.json({ error: 'Country is required for payout history.' }, { status: 400 });
      }

      const countryRows = await db
        .select({ id: countries.id })
        .from(countries)
        .where(eq(countries.slug, country))
        .limit(1);
      const countryId = countryRows[0]?.id;
      if (!countryId) {
        return Response.json({ history: [] }, { headers: { 'Cache-Control': 'no-store' } });
      }

      const payoutConditions = [
        eq(requestHistory.kind, 'payout'),
        // New rows carry request_history.country_id. Older rows are matched
        // through their catalog endpoint so existing data remains usable.
        or(eq(requestHistory.countryId, countryId), eq(apiEndpoints.countryId, countryId))!,
      ];
      if (environment && environment !== 'all') {
        payoutConditions.push(eq(requestHistory.environment, environment));
      }
      if (search) {
        payoutConditions.push(
          sql`(${requestHistory.requestName} ILIKE ${'%' + search + '%'} OR ${requestHistory.url} ILIKE ${'%' + search + '%'} OR ${requestHistory.requestId} ILIKE ${'%' + search + '%'})`
        );
      }

      const rows = await db
        .select({
          ...getTableColumns(requestHistory),
          userName: users.name,
          userEmail: users.email,
        })
        .from(requestHistory)
        .leftJoin(users, eq(requestHistory.userId, users.id))
        .leftJoin(apiEndpoints, eq(requestHistory.endpointId, apiEndpoints.id))
        .where(and(...payoutConditions))
        .orderBy(desc(requestHistory.createdAt))
        .limit(limit);

      return Response.json({ history: rows }, { headers: { 'Cache-Control': 'no-store' } });
    }

    // Default: per-user payin/other history (existing behavior preserved).
    const conditions = [eq(requestHistory.userId, user.id)];

    if (country) {
      const countryRows = await db
        .select({ id: countries.id })
        .from(countries)
        .where(eq(countries.slug, country))
        .limit(1);
      const countryId = countryRows[0]?.id;
      if (!countryId) {
        return Response.json({ history: [] }, { headers: { 'Cache-Control': 'no-store' } });
      }
      // New rows use the direct country_id. The endpoint fallback keeps older
      // history rows correctly scoped without requiring a data migration.
      conditions.push(
        or(eq(requestHistory.countryId, countryId), eq(apiEndpoints.countryId, countryId))!
      );
    }

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
      .select({ ...getTableColumns(requestHistory) })
      .from(requestHistory)
      .leftJoin(apiEndpoints, eq(requestHistory.endpointId, apiEndpoints.id))
      .where(whereClause)
      .orderBy(desc(requestHistory.createdAt))
      .limit(limit);

    // Opportunistic rolling purge of payin rows older than 7 days.
    // Fully wrapped and un-awaited: it must never fail or slow the read.
    (async () => {
      try {
        await db.execute(
          sql`DELETE FROM request_history WHERE kind = 'payin' AND created_at < now() - interval '7 days'`
        );
      } catch (err) {
        console.warn('[HISTORY] Opportunistic payin purge failed (non-fatal):', err);
      }
    })();

    return Response.json({ history: rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.warn('[HISTORY] Could not load request history from DB:', err);
    return Response.json({ history: [] });
  }
}
