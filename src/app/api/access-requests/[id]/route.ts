import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';
import {
  ACCESS_LEVELS,
  DecisionError,
  adminUserIdFor,
  decideAccessRequest,
  listAccessRequests,
  notifyDecision,
} from '@/lib/access-requests/service';

/** W46: one access request — read, decide (approve/reject), change its level while pending, delete. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Ctx = { params: Promise<{ id: string }> };

async function guard(ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin' || !session.user.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return { error: NextResponse.json({ error: 'Access request not found' }, { status: 404 }) };
  return { id, email: session.user.email };
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  const g = await guard(ctx);
  if ('error' in g) return g.error;
  const rows = (await listAccessRequests(null, null)).filter(r => r.id === g.id);
  if (!rows.length) return NextResponse.json({ error: 'Access request not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

/** Body: { status: 'approved' | 'rejected', adminNotes?, createUserAccount? (default true) } */
export async function PUT(request: NextRequest, ctx: Ctx) {
  const g = await guard(ctx);
  if ('error' in g) return g.error;
  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (status !== 'approved' && status !== 'rejected') return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 });
  const adminId = await adminUserIdFor(g.email);
  if (!adminId) return NextResponse.json({ error: 'Your admin user was not found' }, { status: 403 });
  const action = status === 'approved' ? 'approve' : 'reject';
  try {
    const d = await decideAccessRequest(
      g.id, action, adminId,
      typeof body.adminNotes === 'string' && body.adminNotes.trim() ? body.adminNotes.trim() : null,
      body.createUserAccount !== false
    );
    const email = await notifyDecision(d, action);
    return NextResponse.json({
      success: true,
      message: `Access request ${status}`,
      request: d.request,
      accountCreated: d.accountCreated,
      email,
    });
  } catch (e) {
    if (e instanceof DecisionError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('Access request decision failed:', e);
    return NextResponse.json({ error: 'The decision could not be saved; nothing was changed' }, { status: 500 });
  }
}

/** Body: { requestedAccessLevel } — only while the request is pending. */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const g = await guard(ctx);
  if ('error' in g) return g.error;
  const body = await request.json().catch(() => null);
  const level = body?.requestedAccessLevel;
  if (!(ACCESS_LEVELS as readonly string[]).includes(level)) {
    return NextResponse.json({ error: 'requestedAccessLevel must be personal or professional' }, { status: 400 });
  }
  // access_requests has no updated_at column; the old SET updated_at made this always fail.
  const r = await query(
    `UPDATE access_requests SET requested_access_level = $1, subject = $2
      WHERE id = $3 AND request_type = 'access_request' AND status = 'pending' RETURNING *`,
    [level, `Access Request - ${level}`, g.id]
  );
  if (!r.rows.length) {
    const exists = await query(`SELECT status FROM access_requests WHERE id = $1`, [g.id]);
    return exists.rows.length
      ? NextResponse.json({ error: `Only a pending request can change level (this one is ${exists.rows[0].status})` }, { status: 409 })
      : NextResponse.json({ error: 'Access request not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: 'Access level updated', request: r.rows[0] });
}

/** Deletes the request record only; access already granted is managed under Users. */
export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const g = await guard(ctx);
  if ('error' in g) return g.error;
  const r = await query(`DELETE FROM access_requests WHERE id = $1 AND request_type = 'access_request' RETURNING id`, [g.id]);
  if (!r.rows.length) return NextResponse.json({ error: 'Access request not found' }, { status: 404 });
  return NextResponse.json({ success: true, message: 'Access request deleted' });
}
