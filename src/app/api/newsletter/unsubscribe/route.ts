import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeByToken } from '@/lib/newsletter/delivery';

/** POST { token, reason? } — unsubscribe using the link in every newsletter. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token : '';
  const reason = typeof body?.reason === 'string' ? body.reason : null;
  if (!token) return NextResponse.json({ error: 'Unsubscribe token is required' }, { status: 400 });
  try {
    const r = await unsubscribeByToken(token, reason);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter unsubscribe failed:', error);
    return NextResponse.json({ error: 'Could not unsubscribe right now' }, { status: 500 });
  }
}
