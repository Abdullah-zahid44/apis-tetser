import { getDb } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  let dbStatus = 'disconnected';

  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = err instanceof Error ? `degraded: ${err.message}` : 'unavailable';
  }

  return Response.json(
    {
      status: 'ok',
      service: 'AssanPay API Console & Testing Workspace',
      environment: process.env.NODE_ENV || 'production',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
