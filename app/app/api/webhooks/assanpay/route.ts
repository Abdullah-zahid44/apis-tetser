import { getDb } from '@/lib/db';
import { countries, webhookEvents } from '@/lib/db/schema';
import { verifyCallbackSignature } from '@/lib/assanpay/callbacks';
import { getAssanPayCallbackSecret } from '@/lib/assanpay/credentials';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const rawBody = await request.text();
  try {
    const url = new URL(request.url);
    const market = (url.searchParams.get('market') || 'bdt').trim().toLowerCase();
    const environment = url.searchParams.get('environment') || 'sandbox';
    if (environment !== 'sandbox') {
      return Response.json({ error: 'Invalid callback environment.' }, { status: 404 });
    }

    const callbackSecret = getAssanPayCallbackSecret(market, environment);
    const verification = verifyCallbackSignature(rawBody, request.headers, callbackSecret || '');

    try {
      const db = getDb();
      const countryRows = await db
        .select({ id: countries.id })
        .from(countries)
        .where(eq(countries.slug, market))
        .limit(1);
      const countryId = countryRows[0]?.id;
      if (!countryId) {
        return Response.json({ received: false, error: 'Unknown callback market.' }, { status: 404 });
      }

      await db.insert(webhookEvents).values({
        eventId: verification.eventId || `auto-${Date.now()}`,
        countryId,
        environment,
        signature: verification.receivedSignature,
        signatureVerified: verification.valid,
        verificationMessage: verification.message,
        eventTimestamp: verification.timestamp,
        payload: (verification.payload as Record<string, unknown>) || {},
        rawBody,
        receivedAt: new Date(),
      });
    } catch {
      // Ignore duplicate constraints
    }

    return Response.json({ received: true, verified: verification.valid });
  } catch (error) {
    return Response.json(
      { received: false, error: error instanceof Error ? error.message : 'Callback rejected.' },
      { status: 401 }
    );
  }
}
