import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { ACCESS_LEVELS, listAccessRequests } from '@/lib/access-requests/service';

/**
 * Admin export of access requests (CSV or JSON).
 * W46: every CSV cell is now quoted and escaped (only the message was; a quote in a
 * name or note broke the file), and cells starting with = + - @ are prefixed with '
 * so a spreadsheet does not run them as formulas.
 */
function cell(v: unknown): string {
  let s = v === null || v === undefined ? '' : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sp = new URL(request.url).searchParams;
  const status = sp.get('status');
  const level = sp.get('accessLevel');
  const format = sp.get('format') || 'csv';
  if (status && !['pending', 'approved', 'rejected'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  if (level && !(ACCESS_LEVELS as readonly string[]).includes(level)) return NextResponse.json({ error: 'Invalid accessLevel' }, { status: 400 });
  if (format !== 'csv' && format !== 'json') return NextResponse.json({ error: 'format must be csv or json' }, { status: 400 });

  try {
    const rows = await listAccessRequests(status, level);
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `access-requests-${status || 'all'}-${stamp}.${format}`;
    if (format === 'json') {
      return new NextResponse(JSON.stringify(rows, null, 2), {
        headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${filename}"` },
      });
    }
    const header = ['ID', 'Name', 'Email', 'Access Level', 'Status', 'Submitted At', 'Processed At', 'Processed By', 'Admin Notes', 'Message'];
    const lines = rows.map(r => [r.id, r.name, r.email, r.requested_access_level, r.status, r.submitted_at, r.processed_at, r.processedBy, r.admin_notes, r.message].map(cell).join(','));
    return new NextResponse([header.map(cell).join(','), ...lines].join('\r\n'), {
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"` },
    });
  } catch (error) {
    console.error('Access request export failed:', error);
    return NextResponse.json({ error: 'Failed to export access requests' }, { status: 500 });
  }
}
