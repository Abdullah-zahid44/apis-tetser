import { requireAuth } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { webhookEvents, countries } from '@/lib/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const countrySlug = url.searchParams.get('country')?.trim().toLowerCase();
  const environment = url.searchParams.get('environment');
  const verified = url.searchParams.get('verified');
  const search = url.searchParams.get('search')?.trim();
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

  try {
    const db = getDb();
    if (!countrySlug) {
      return Response.json({ error: 'Country is required for callback history.' }, { status: 400 });
    }

    const countryRows = await db
      .select({ id: countries.id })
      .from(countries)
      .where(eq(countries.slug, countrySlug))
      .limit(1);
    const countryId = countryRows[0]?.id;
    if (!countryId) {
      return Response.json({ callbacks: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }

    // Market scope is mandatory: callback feeds must never leak records from
    // another selected country, regardless of which authenticated user reads it.
    const conditions = [eq(webhookEvents.countryId, countryId)];

    if (environment && environment !== 'all') {
      conditions.push(eq(webhookEvents.environment, environment));
    }

    if (verified === 'true') {
      conditions.push(eq(webhookEvents.signatureVerified, true));
    } else if (verified === 'false') {
      conditions.push(eq(webhookEvents.signatureVerified, false));
    }

    if (search) {
      conditions.push(
        sql`(${webhookEvents.eventId} ILIKE ${'%' + search + '%'} OR ${webhookEvents.rawBody} ILIKE ${'%' + search + '%'})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: webhookEvents.id,
        eventId: webhookEvents.eventId,
        countryId: webhookEvents.countryId,
        environment: webhookEvents.environment,
        signature: webhookEvents.signature,
        signatureVerified: webhookEvents.signatureVerified,
        verificationMessage: webhookEvents.verificationMessage,
        eventTimestamp: webhookEvents.eventTimestamp,
        requestHeaders: webhookEvents.requestHeaders,
        payload: webhookEvents.payload,
        rawBody: webhookEvents.rawBody,
        sourceIp: webhookEvents.sourceIp,
        duplicate: webhookEvents.duplicate,
        receivedAt: webhookEvents.receivedAt,
      })
      .from(webhookEvents)
      .where(whereClause)
      .orderBy(desc(webhookEvents.receivedAt))
      .limit(limit);

    return Response.json({ callbacks: rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.warn('[CALLBACKS] DB query failed:', err);
    return Response.json({ callbacks: [] });
  }
}
