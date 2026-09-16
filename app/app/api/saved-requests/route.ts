import { z } from 'zod';
import { requireAuth } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { savedRequests, countries } from '@/lib/db/schema';
import { desc, eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

const SaveRequestSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(150),
  country: z.string().min(2).max(20).default('pkr'),
  environment: z.enum(['sandbox']).default('sandbox'),
  endpointId: z.string().uuid().optional().nullable(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  relativeUrl: z.string().min(1).max(1000),
  queryParams: z.record(z.string(), z.string()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  requestBody: z.string().optional(),
});

export async function GET(request: Request) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const environment = url.searchParams.get('environment');

  try {
    const db = getDb();
    const conditions = [];

    if (environment && environment !== 'all') {
      conditions.push(eq(savedRequests.environment, environment));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: savedRequests.id,
        name: savedRequests.name,
        environment: savedRequests.environment,
        endpointId: savedRequests.endpointId,
        method: savedRequests.method,
        relativeUrl: savedRequests.relativeUrl,
        queryParams: savedRequests.queryParams,
        headers: savedRequests.headers,
        requestBody: savedRequests.requestBody,
        createdAt: savedRequests.createdAt,
        updatedAt: savedRequests.updatedAt,
      })
      .from(savedRequests)
      .where(whereClause)
      .orderBy(desc(savedRequests.updatedAt))
      .limit(100);

    return Response.json({ requests: rows });
  } catch (err) {
    console.warn('[SAVED_REQUESTS] Could not read saved requests:', err);
    return Response.json({ requests: [] });
  }
}

export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let rawJson: unknown;
  try {
    rawJson = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = SaveRequestSchema.safeParse(rawJson);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const db = getDb();

    // Resolve countryId if available
    let countryId: string | null = null;
    const countryRows = await db
      .select({ id: countries.id })
      .from(countries)
      .where(eq(countries.slug, data.country.toLowerCase()))
      .limit(1);

    if (countryRows.length > 0) countryId = countryRows[0].id;

    if (data.id) {
      // Update existing
      await db
        .update(savedRequests)
        .set({
          name: data.name,
          environment: data.environment,
          endpointId: data.endpointId || null,
          method: data.method,
          relativeUrl: data.relativeUrl,
          queryParams: data.queryParams || {},
          headers: data.headers || {},
          requestBody: data.requestBody || '',
          updatedAt: new Date(),
        })
        .where(eq(savedRequests.id, data.id));

      return Response.json({ id: data.id, saved: true, updated: true });
    }

    // Insert new
    const inserted = await db
      .insert(savedRequests)
      .values({
        userId: user.id || null,
        countryId,
        environment: data.environment,
        endpointId: data.endpointId || null,
        name: data.name,
        method: data.method,
        relativeUrl: data.relativeUrl,
        queryParams: data.queryParams || {},
        headers: data.headers || {},
        requestBody: data.requestBody || '',
      })
      .returning({ id: savedRequests.id });

    return Response.json({ id: inserted[0].id, saved: true, created: true });
  } catch (err) {
    console.error('[SAVED_REQUESTS] Error saving request:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Could not save request.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ error: 'ID parameter is required' }, { status: 400 });

  try {
    const db = getDb();
    await db.delete(savedRequests).where(eq(savedRequests.id, id));
    return Response.json({ success: true, id });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Could not delete request.' },
      { status: 500 }
    );
  }
}
