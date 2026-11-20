import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

// W26: content a recurring rule can copy from. The modal used the "unscheduled content"
// list, which offers only DRAFT posts/projects and never newsletters, so published posts
// (the natural templates) and every newsletter could not be chosen.
const SQL: Record<string, string> = {
  post: `SELECT id, title, status FROM posts ORDER BY updated_at DESC NULLS LAST LIMIT 300`,
  project: `SELECT id, title, status FROM projects ORDER BY updated_at DESC NULLS LAST LIMIT 300`,
  newsletter: `SELECT id, title, status FROM newsletter_campaigns ORDER BY updated_at DESC NULLS LAST LIMIT 300`,
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const type = new URL(request.url).searchParams.get('type') || '';
  const sql = SQL[type];
  if (!sql) return NextResponse.json({ error: 'type must be post, project or newsletter' }, { status: 400 });
  try {
    const result = await query(sql);
    return NextResponse.json({ options: result.rows });
  } catch (error) {
    console.error('Recurring template options error:', error);
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 });
  }
}
