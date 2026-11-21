import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { normalizeEmail } from '@/lib/access-requests/service';

/**
 * Public "check my request" lookup used by /request-status.
 *
 * W46: this is unauthenticated, yet it returned the name, message, subject and the
 * admin's private notes of every request for any e-mail address typed in, plus that
 * address's access flags. It now returns only what the page needs to answer "where is
 * my request": level, status and dates.
 */
export async function GET(request: NextRequest) {
  const raw = new URL(request.url).searchParams.get('email') || '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) || raw.length > 254) {
    return NextResponse.json({ error: 'A valid email parameter is required' }, { status: 400 });
  }
  try {
    const r = await query(
      `SELECT id, requested_access_level, status, submitted_at, processed_at
         FROM access_requests WHERE email = $1 AND request_type = 'access_request'
        ORDER BY submitted_at DESC`,
      [normalizeEmail(raw)]
    );
    const requests = r.rows.map(row => ({
      id: row.id,
      accessLevel: row.requested_access_level,
      status: row.status,
      submittedAt: row.submitted_at,
      processedAt: row.processed_at,
    }));
    return NextResponse.json({
      requests,
      summary: {
        totalRequests: requests.length,
        pendingRequests: requests.filter(q => q.status === 'pending').length,
        approvedRequests: requests.filter(q => q.status === 'approved').length,
        rejectedRequests: requests.filter(q => q.status === 'rejected').length,
      },
    });
  } catch (error) {
    console.error('Access request status lookup failed:', error);
    return NextResponse.json({ error: 'Failed to check access request status' }, { status: 500 });
  }
}
