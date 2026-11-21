import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';
import CacheService from '@/lib/cache';
import { promises as fs, constants } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * Health metrics in Prometheus text format (admin only).
 *
 * W25: every check used to return true without checking anything ("application",
 * "database", "cache", "cpu"); "filesystem" tested /tmp. Now:
 *   database   SELECT 1 (2.5 s timeout)
 *   cache      Redis PING; reported as 0 with state="disabled" when Redis is not in use
 *   uploads    the uploads directory exists and is writable (where media is stored)
 * Process gauges (uptime, heap, RSS) are reported as measured, not rated.
 */
type Check = { up: boolean; seconds: number; state: string };

async function timed(fn: () => Promise<string>): Promise<Check> {
  const t0 = Date.now();
  try {
    const state = await fn();
    return { up: state === 'ok', seconds: (Date.now() - t0) / 1000, state };
  } catch (e) {
    return { up: false, seconds: (Date.now() - t0) / 1000, state: e instanceof Error && e.message === 'timeout' ? 'timeout' : 'error' };
  }
}

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [database, cache, uploads] = await Promise.all([
    timed(async () => { await withTimeout(query('SELECT 1'), 2500); return 'ok'; }),
    timed(() => CacheService.getInstance().ping()),
    timed(async () => { await fs.access(path.join(process.cwd(), 'public', 'uploads'), constants.W_OK); return 'ok'; }),
  ]);
  const checks: Record<string, Check> = { database, cache, uploads };
  const mem = process.memoryUsage();

  const lines = [
    '# HELP health_check_up 1 when the check succeeded, else 0',
    '# TYPE health_check_up gauge',
    ...Object.entries(checks).map(([name, c]) => `health_check_up{check="${name}",state="${c.state}"} ${c.up ? 1 : 0}`),
    '# HELP health_check_duration_seconds Time each check took',
    '# TYPE health_check_duration_seconds gauge',
    ...Object.entries(checks).map(([name, c]) => `health_check_duration_seconds{check="${name}"} ${c.seconds}`),
    '# HELP nodejs_process_uptime_seconds Process uptime',
    '# TYPE nodejs_process_uptime_seconds gauge',
    `nodejs_process_uptime_seconds ${process.uptime()}`,
    '# HELP nodejs_heap_used_bytes Heap used',
    '# TYPE nodejs_heap_used_bytes gauge',
    `nodejs_heap_used_bytes ${mem.heapUsed}`,
    '# HELP nodejs_heap_total_bytes Heap allocated',
    '# TYPE nodejs_heap_total_bytes gauge',
    `nodejs_heap_total_bytes ${mem.heapTotal}`,
    '# HELP nodejs_rss_bytes Resident set size',
    '# TYPE nodejs_rss_bytes gauge',
    `nodejs_rss_bytes ${mem.rss}`,
  ];

  // The database is required; Redis is optional (the site works without its cache).
  const healthy = database.up && uploads.up;
  return new NextResponse(lines.join('\n') + '\n', {
    status: healthy ? 200 : 503,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
