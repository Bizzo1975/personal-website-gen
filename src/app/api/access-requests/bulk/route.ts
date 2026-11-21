import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { DecisionError, accessRequestStats, adminUserIdFor, decideAccessRequest, notifyDecision, type MailOutcome } from '@/lib/access-requests/service';

/**
 * W46: approve/reject several requests. Each one is decided in its own transaction and
 * reported separately (a failure never hides behind an overall "completed").
 * Body: { requestIds: string[], action: 'approve' | 'reject', adminNotes?, createUserAccounts? }
 */
const MAX = 50;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin' || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const ids: unknown = body?.requestIds;
  const action = body?.action;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX || ids.some(i => typeof i !== 'string')) {
    return NextResponse.json({ error: `requestIds must be 1 to ${MAX} ids` }, { status: 400 });
  }
  if (action !== 'approve' && action !== 'reject') return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
  const adminId = await adminUserIdFor(session.user.email);
  if (!adminId) return NextResponse.json({ error: 'Your admin user was not found' }, { status: 403 });
  const notes = typeof body.adminNotes === 'string' && body.adminNotes.trim() ? body.adminNotes.trim() : null;

  const successful: { id: string; accountCreated: boolean; email: MailOutcome }[] = [];
  const failed: { id: string; error: string }[] = [];
  for (const id of ids as string[]) {
    try {
      const d = await decideAccessRequest(id, action, adminId, notes, body.createUserAccounts !== false);
      successful.push({ id, accountCreated: d.accountCreated, email: await notifyDecision(d, action) });
    } catch (e) {
      failed.push({ id, error: e instanceof DecisionError ? e.message : 'Could not be saved' });
      if (!(e instanceof DecisionError)) console.error('Bulk access decision failed:', id, e);
    }
  }
  return NextResponse.json({
    success: failed.length === 0,
    successful,
    failed,
    successCount: successful.length,
    failureCount: failed.length,
    emailFailures: successful.filter(s => !s.email.sent).length,
  }, { status: failed.length && !successful.length ? 422 : 200 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ success: true, stats: await accessRequestStats(), bulkOperations: { available: ['approve', 'reject'], maxBatchSize: MAX } });
}
