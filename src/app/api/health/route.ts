import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Readiness probe for Docker and the Kecktech dashboard (HLT-01).
 * Checks the database; returns no secrets. 200 = healthy, 503 = DB down.
 */
export async function GET() {
  const t0 = Date.now();
  let db: { ok: boolean; ms: number; error?: string };
  try {
    await Promise.race([
      query('SELECT 1'),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 2500)),
    ]);
    db = { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    db = { ok: false, ms: Date.now() - t0, error: e instanceof Error ? e.message.slice(0, 80) : 'error' };
  }
  return NextResponse.json(
    { status: db.ok ? 'healthy' : 'unhealthy', checks: { db }, timestamp: new Date().toISOString() },
    {
      status: db.ok ? 200 : 503,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache', Expires: '0' },
    }
  );
}
