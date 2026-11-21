import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

/**
 * W45: real content export (JSON). The Import/Export tab used to download whatever the
 * page happened to have in memory (list rows, not full content) and called it an export.
 *
 * GET /api/admin/content-export?types=posts,projects,pages,templates
 * Every column of every row of the chosen tables. No user, subscriber or comment data.
 */
const TABLES = {
  posts: 'SELECT * FROM posts ORDER BY created_at',
  projects: 'SELECT * FROM projects ORDER BY created_at',
  pages: 'SELECT * FROM pages ORDER BY created_at',
  templates: 'SELECT * FROM content_templates ORDER BY created_at',
} as const;
type Kind = keyof typeof TABLES;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const raw = new URL(request.url).searchParams.get('types');
  const kinds = (raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : Object.keys(TABLES)) as Kind[];
  const unknown = kinds.filter(k => !(k in TABLES));
  if (unknown.length || kinds.length === 0) {
    return NextResponse.json({ error: `types must be a list of: ${Object.keys(TABLES).join(', ')}` }, { status: 400 });
  }
  try {
    const out: Record<string, unknown> = { exportedAt: new Date().toISOString(), source: 'willworkforlunch', format: 'json' };
    const counts: Record<string, number> = {};
    for (const k of kinds) {
      const r = await query(TABLES[k]);
      out[k] = r.rows;
      counts[k] = r.rows.length;
    }
    out.counts = counts;
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(out, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="wwfl-content-${date}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Content export failed:', error);
    return NextResponse.json({ error: 'Content export failed; nothing was exported' }, { status: 500 });
  }
}
