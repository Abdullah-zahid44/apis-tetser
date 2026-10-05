import { z } from 'zod';
import { requireAuth } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { ensureUserIsolationSchema } from '@/lib/db/ensure-schema';
import { environmentVariables, countries } from '@/lib/db/schema';
import { encryptSecret, decryptSecret } from '@/lib/security/secret-vault';
import { eq, and, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

const VariableSchema = z.object({
  id: z.string().uuid().optional(),
  country: z.string().optional().nullable(),
  environment: z.enum(['all', 'sandbox']).default('all'),
  key: z.string().min(1).max(100),
  value: z.string().default(''),
  isSecret: z.boolean().default(false),
  description: z.string().max(300).optional(),
});

export async function GET(request: Request) {
  const user = await requireAuth();
  if (!user || !user.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const resolve = url.searchParams.get('resolve') === 'true'; // internal resolution mode

  try {
    const db = getDb();
    await ensureUserIsolationSchema();
    const rows = await db
      .select()
      .from(environmentVariables)
      .where(eq(environmentVariables.userId, user.id))
      .orderBy(desc(environmentVariables.updatedAt));

    // If resolve mode (used for execution), decrypt secrets
    // If UI inspection mode, mask secret values
    const sanitized = rows.map((row) => {
      let finalVal = row.encryptedValue;
      if (row.isSecret) {
        if (resolve) {
          finalVal = decryptSecret(row.encryptedValue);
        } else {
          finalVal = '••••••••';
        }
      }
      return {
        id: row.id,
        countryId: row.countryId,
        environment: row.environment,
        key: row.key,
        value: finalVal,
        isSecret: row.isSecret,
        description: row.description,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    });

    return Response.json({ variables: sanitized });
  } catch (err) {
    console.warn('[VARIABLES] DB query failed:', err);
    return Response.json({ variables: [] });
  }
}

export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user || !user.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let rawJson: unknown;
  try {
    rawJson = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = VariableSchema.safeParse(rawJson);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const db = getDb();
    await ensureUserIsolationSchema();

    let countryId: string | null = null;
    if (data.country) {
      const cRows = await db
        .select({ id: countries.id })
        .from(countries)
        .where(eq(countries.slug, data.country.toLowerCase()))
        .limit(1);
      if (cRows.length > 0) countryId = cRows[0].id;
    }

    const storedValue = data.isSecret ? encryptSecret(data.value) : data.value;

    if (data.id) {
      // Ownership check before updating an existing row
      const existing = await db
        .select({ id: environmentVariables.id, userId: environmentVariables.userId })
        .from(environmentVariables)
        .where(eq(environmentVariables.id, data.id))
        .limit(1);

      if (existing.length === 0) {
        return Response.json({ error: 'Variable not found.' }, { status: 404 });
      }
      if (existing[0].userId !== user.id) {
        return Response.json({ error: 'Forbidden.' }, { status: 403 });
      }

      await db
        .update(environmentVariables)
        .set({
          countryId,
          environment: data.environment,
          key: data.key,
          encryptedValue: storedValue,
          isSecret: data.isSecret,
          description: data.description || '',
          updatedAt: new Date(),
        })
        .where(eq(environmentVariables.id, data.id));

      return Response.json({ id: data.id, saved: true, updated: true });
    }

    const inserted = await db
      .insert(environmentVariables)
      .values({
        userId: user.id,
        countryId,
        environment: data.environment,
        key: data.key,
        encryptedValue: storedValue,
        isSecret: data.isSecret,
        description: data.description || '',
        createdBy: user.id,
      })
      .returning({ id: environmentVariables.id });

    return Response.json({ id: inserted[0].id, saved: true, created: true });
  } catch (err) {
    console.error('[VARIABLES] Error saving variable:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Could not save variable.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const user = await requireAuth();
  if (!user || !user.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ error: 'ID parameter required' }, { status: 400 });

  try {
    const db = getDb();
    await ensureUserIsolationSchema();
    const deleted = await db
      .delete(environmentVariables)
      .where(and(eq(environmentVariables.id, id), eq(environmentVariables.userId, user.id)))
      .returning({ id: environmentVariables.id });
    if (deleted.length === 0) {
      return Response.json({ error: 'Variable not found.' }, { status: 404 });
    }
    return Response.json({ success: true, id });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Could not delete variable.' },
      { status: 500 }
    );
  }
}
