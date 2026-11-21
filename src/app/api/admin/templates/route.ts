import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';
import {
  TEMPLATE_COLUMNS,
  TEMPLATE_TYPES,
  parseTemplateInput,
  templateVariables,
  toTemplateDto,
} from '@/lib/content-templates';

/**
 * W21: content templates list + create. One template: ./[id]/route.ts.
 *
 * Removed: creating the table and seeding six templates from inside GET (the table is part
 * of the schema; that seed used ON CONFLICT (name) on a column with no unique constraint,
 * so it could only fail), and the collection-level PUT/DELETE nothing called.
 */
async function admin() {
  const session = await getServerSession(authOptions);
  return session && session.user?.role === 'admin' ? session : null;
}

export async function GET(request: NextRequest) {
  if (!(await admin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const type = new URL(request.url).searchParams.get('type');
  if (type && type !== 'all' && !(TEMPLATE_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ error: `type must be one of all, ${TEMPLATE_TYPES.join(', ')}` }, { status: 400 });
  }
  try {
    const filtered = type && type !== 'all';
    const r = await query(
      `SELECT ${TEMPLATE_COLUMNS} FROM content_templates
        ${filtered ? 'WHERE type = $1' : "WHERE type IN ('post', 'project', 'page')"}
        ORDER BY type ASC, name ASC`,
      filtered ? [type] : []
    );
    return NextResponse.json({ templates: r.rows.map(toTemplateDto) });
  } catch (error) {
    console.error('Error fetching content templates:', error);
    return NextResponse.json({ error: 'Failed to fetch content templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await admin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 }); }
  const parsed = parseTemplateInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const t = parsed.value;
  try {
    const clash = await query('SELECT 1 FROM content_templates WHERE lower(name) = lower($1)', [t.name]);
    if (clash.rows.length) return NextResponse.json({ error: 'Another template already uses this name' }, { status: 409 });
    const r = await query(
      `INSERT INTO content_templates (name, type, description, content, variables, author)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${TEMPLATE_COLUMNS}`,
      [t.name, t.type, t.description, t.content, templateVariables(t.content), session.user?.name || session.user?.email || 'admin']
    );
    return NextResponse.json({ success: true, template: toTemplateDto(r.rows[0]) }, { status: 201 });
  } catch (error) {
    console.error('Error creating content template:', error);
    return NextResponse.json({ error: 'Failed to create content template' }, { status: 500 });
  }
}
