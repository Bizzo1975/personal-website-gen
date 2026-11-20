import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { draftContentParameters, parseDraftContent, readDraftContentSql, replaceDraftContentSql } from '@/lib/me-manager-draft-content';
export const dynamic = 'force-dynamic';
function authorized(request: Request): boolean {
  const key = process.env.ME_MANAGER_API_KEY;
  return Boolean(key && request.headers.get('authorization') === `Bearer ${key}`);
}
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized(request)) return reply({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
  const { id } = await params;
  try {
    const result = await query(readDraftContentSql, [id]);
    if (!result.rows.length) return reply({ error: 'Post not found', code: 'NOT_FOUND' }, 404);
    return reply({ ok: true, protocol: 'draft-content-v1', post: result.rows[0] });
  } catch { return reply({ error: 'Website draft storage unavailable', code: 'STORAGE_UNAVAILABLE' }, 503); }
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized(request)) return reply({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
  const body = parseDraftContent(await request.json().catch(() => null));
  if (!body) return reply({ error: 'Provide exact reviewed content and the current draft revision', code: 'INVALID_INPUT' }, 400);
  const { id } = await params;
  try {
    const result = await query(replaceDraftContentSql, draftContentParameters(id, body));
    if (!result.rows.length) return reply({ error: 'The post changed or is no longer an unscheduled draft; reload before editing', code: 'DRAFT_CONFLICT' }, 409);
    return reply({ ok: true, protocol: 'draft-content-v1', post: result.rows[0] });
  } catch { return reply({ error: 'Draft save could not be confirmed; inspect the website before retrying', code: 'SAVE_UNCONFIRMED' }, 503); }
}
