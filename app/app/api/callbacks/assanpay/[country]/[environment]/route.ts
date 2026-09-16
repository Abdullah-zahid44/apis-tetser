import { getDb } from '@/lib/db';
import { webhookEvents, countries } from '@/lib/db/schema';
import { verifyCallbackSignature } from '@/lib/assanpay/callbacks';
import { getAssanPayCredentials } from '@/lib/assanpay/credentials';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

// Public endpoint for AssanPay webhook callbacks (NO GOOGLE AUTH REQUIRED)
export async function POST(
  request: Request,
  props: { params: Promise<{ country: string; environment: string }> }
) {
  const params = await props.params;
  const countrySlug = (params.country || 'pkr').toLowerCase();
  const environment = (params.environment || 'production').toLowerCase();

  // 1. Read raw request body FIRST before JSON parsing
  const rawBody = await request.text();

  // Extract source IP
  const sourceIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    '';

  // Header snapshot
  const headerSnapshot: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headerSnapshot[key] = value;
  });

  // 2. Resolve credentials & verify signature
  const creds = getAssanPayCredentials(countrySlug, environment);
  const verification = verifyCallbackSignature(rawBody, request.headers, creds.apiSecret || '');

  // 3. Resolve country id
  let countryId: string | null = null;
  try {
    const db = getDb();
    const cRows = await db
      .select({ id: countries.id })
      .from(countries)
      .where(eq(countries.slug, countrySlug))
      .limit(1);
    if (cRows.length > 0) countryId = cRows[0].id;

    // Check for duplicate Event ID
    const existing = await db
      .select({ id: webhookEvents.id })
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, verification.eventId || `unidentified-${Date.now()}`))
      .limit(1);

    const isDuplicate = existing.length > 0;

    await db.insert(webhookEvents).values({
      eventId: isDuplicate
        ? `${verification.eventId}-dup-${Date.now()}`
        : verification.eventId || `auto-${Date.now()}`,
      countryId,
      environment,
      signature: verification.receivedSignature,
      signatureVerified: verification.valid,
      verificationMessage: verification.message,
      eventTimestamp: verification.timestamp,
      requestHeaders: headerSnapshot,
      payload: (verification.payload as Record<string, unknown>) || {},
      rawBody,
      sourceIp,
      duplicate: isDuplicate,
      receivedAt: new Date(),
    });
  } catch (err) {
    console.error('[CALLBACK_RECEIVER] Failed to record webhook event in DB:', err);
  }

  // AssanPay specification: return 2xx response to acknowledge receipt
  return Response.json(
    {
      received: true,
      verified: verification.valid,
      eventId: verification.eventId,
      message: verification.message,
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
