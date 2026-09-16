import { getDb } from '@/lib/db';
import { webhookEvents } from '@/lib/db/schema';
import { verifyCallbackSignature } from '@/lib/assanpay/callbacks';
import { getAssanPayCallbackSecret } from '@/lib/assanpay/credentials';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const rawBody = await request.text();
  try {
    const url = new URL(request.url);
    const market = url.searchParams.get('market') || 'bdt';
    const environment = url.searchParams.get('environment') || 'sandbox';
    if (environment !== 'sandbox') {
      return Response.json({ error: 'Only sandbox callbacks are supported.' }, { status: 404 });
    }

    const callbackSecret = getAssanPayCallbackSecret(market, environment);
    const verification = verifyCallbackSignature(rawBody, request.headers, callbackSecret || '');

    try {
      const db = getDb();
      await db.insert(webhookEvents).values({
        eventId: verification.eventId || `auto-${Date.now()}`,
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
