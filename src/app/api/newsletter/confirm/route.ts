import { NextRequest, NextResponse } from 'next/server';
import { confirmByToken } from '@/lib/newsletter/delivery';

/** POST { token } — confirm a newsletter subscription (double opt-in link). */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token : '';
  if (!token) return NextResponse.json({ error: 'Confirmation token is required' }, { status: 400 });
  try {
    const r = await confirmByToken(token);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter confirm failed:', error);
    return NextResponse.json({ error: 'Could not confirm the subscription right now' }, { status: 500 });
  }
}
