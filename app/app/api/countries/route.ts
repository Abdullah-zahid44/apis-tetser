import { requireAuth } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { countries } from '@/lib/db/schema';
import { INITIAL_COUNTRIES } from '@/lib/assanpay/endpoint-registry';
import { eq, asc } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(countries)
      .where(eq(countries.isActive, true))
      .orderBy(asc(countries.displayOrder));

    if (rows.length > 0) {
      return Response.json({ countries: rows });
    }
  } catch (err) {
    console.warn('[COUNTRIES] Database query failed, returning fallback static list:', err);
  }

  // Fallback to initial registry
  return Response.json({
    countries: INITIAL_COUNTRIES.map((c, i) => ({
      id: `fallback-${c.slug}`,
      code: c.code,
      slug: c.slug,
      name: c.name,
      currency: c.currency,
      flagEmoji: c.flagEmoji,
      displayOrder: c.displayOrder || i + 1,
      isActive: true,
    })),
  });
}
