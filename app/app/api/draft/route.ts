import { z } from 'zod';
import { requireAuth } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { ensureUserIsolationSchema } from '@/lib/db/ensure-schema';
import { userDrafts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

const DraftSchema = z.object({
  state: z.record(z.string(), z.unknown()),
});

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  const user = await requireAuth();
  if (!user || !user.id) return unauthorized();

  try {
    const db = getDb();
    await ensureUserIsolationSchema();

    const rows = await db
      .select({ state: userDrafts.state, updatedAt: userDrafts.updatedAt })
      .from(userDrafts)
      .where(eq(userDrafts.userId, user.id))
      .limit(1);

    return Response.json({
      draft: rows.length > 0 ? { state: rows[0].state, updatedAt: rows[0].updatedAt } : null,
    });
  } catch (err) {
    console.warn('[DRAFT] Could not load draft:', err);
    return Response.json({ draft: null });
  }
}

export async function PUT(request: Request) {
  const user = await requireAuth();
  if (!user || !user.id) return unauthorized();

  let rawJson: unknown;
  try {
    rawJson = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = DraftSchema.safeParse(rawJson);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const db = getDb();
    await ensureUserIsolationSchema();

    await db
      .insert(userDrafts)
      .values({ userId: user.id, state: parsed.data.state })
      .onConflictDoUpdate({
        target: userDrafts.userId,
        set: { state: parsed.data.state, updatedAt: new Date() },
      });

    return Response.json({ saved: true });
  } catch (err) {
    console.error('[DRAFT] Error saving draft:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Could not save draft.' },
      { status: 500 }
    );
  }
}
