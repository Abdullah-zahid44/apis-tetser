import { requireAuth } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { countries, apiEndpoints } from '@/lib/db/schema';
import { INITIAL_ENDPOINTS } from '@/lib/assanpay/endpoint-registry';
import { eq, asc } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const user = await requireAuth();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const countrySlug = (url.searchParams.get('country') || 'pkr').toLowerCase();

  try {
    const db = getDb();
    // Lookup country id
    const countryRows = await db
      .select()
      .from(countries)
      .where(eq(countries.slug, countrySlug))
      .limit(1);

    if (countryRows.length > 0) {
      const endpointsRows = await db
        .select()
        .from(apiEndpoints)
        .where(eq(apiEndpoints.countryId, countryRows[0].id))
        .orderBy(asc(apiEndpoints.displayOrder));

      if (endpointsRows.length > 0) {
        return Response.json({ endpoints: endpointsRows });
      }
    }
  } catch (err) {
    console.warn('[ENDPOINTS] DB query failed, using static fallback:', err);
  }

  // Fallback to static endpoints registry
  const filtered = INITIAL_ENDPOINTS.filter((ep) => ep.countrySlug === countrySlug);
  return Response.json({
    endpoints: filtered.map((ep, idx) => ({
      id: `static-${ep.slug}`,
      slug: ep.slug,
      name: ep.name,
      category: ep.category,
      description: ep.description,
      method: ep.method,
      path: ep.path,
      defaultQuery: ep.defaultQuery || {},
      defaultHeaders: ep.defaultHeaders || {},
      defaultBody: ep.defaultBody || '',
      requiresSignature: ep.requiresSignature,
      signatureStrategy: ep.signatureStrategy || 'assanpay-v1',
      isMoneyMovement: ep.isMoneyMovement || false,
      isActive: true,
      displayOrder: idx + 1,
    })),
  });
}
