import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';
import {
  TEMPLATE_COLUMNS,
  UUID_RE,
  parseTemplateInput,
  templateVariables,
  toTemplateDto,
} from '@/lib/content-templates';

/**
 * W21: one content template, read from and written to content_templates.
 * (Was a hard-coded mock: GET always returned the same template, PUT/DELETE saved nothing.)
 */
type Ctx = { params: Promise<{ id: string }> };

async function guard(ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return { error: NextResponse.json({ error: 'Template not found' }, { status: 404 }) };
  return { id };
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  const g = await guard(ctx);
  if ('error' in g) return g.error;
  try {
    const r = await query(`SELECT ${TEMPLATE_COLUMNS} FROM content_templates WHERE id = $1`, [g.id]);
    if (r.rows.length === 0) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    return NextResponse.json({ template: toTemplateDto(r.rows[0]) });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const g = await guard(ctx);
  if ('error' in g) return g.error;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 }); }
  const parsed = parseTemplateInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const t = parsed.value;
  try {
    const clash = await query('SELECT 1 FROM content_templates WHERE lower(name) = lower($1) AND id <> $2', [t.name, g.id]);
    if (clash.rows.length) return NextResponse.json({ error: 'Another template already uses this name' }, { status: 409 });
    const r = await query(
      `UPDATE content_templates
          SET name = $1, type = $2, description = $3, content = $4, variables = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING ${TEMPLATE_COLUMNS}`,
      [t.name, t.type, t.description, t.content, templateVariables(t.content), g.id]
    );
    if (r.rows.length === 0) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    return NextResponse.json({ success: true, template: toTemplateDto(r.rows[0]) });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const g = await guard(ctx);
  if ('error' in g) return g.error;
  try {
    // A template is only copied into new posts/projects; deleting it changes no existing content.
    const r = await query('DELETE FROM content_templates WHERE id = $1 RETURNING id', [g.id]);
    if (r.rows.length === 0) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}

/** POST /api/admin/templates/:id with {"action":"used"}: count one use, after content was created from it. */
export async function POST(request: NextRequest, ctx: Ctx) {
  const g = await guard(ctx);
  if ('error' in g) return g.error;
  const body = await request.json().catch(() => null);
  if (body?.action !== 'used') return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  try {
    const r = await query(
      `UPDATE content_templates SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = $1 RETURNING ${TEMPLATE_COLUMNS}`,
      [g.id]
    );
    if (r.rows.length === 0) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    return NextResponse.json({ success: true, template: toTemplateDto(r.rows[0]) });
  } catch (error) {
    console.error('Error counting template use:', error);
    return NextResponse.json({ error: 'Failed to count template use' }, { status: 500 });
  }
}
