import { NextRequest, NextResponse } from 'next/server';
import { setPasswordWithToken } from '@/lib/access-requests/service';

/**
 * W46: an approved access requester sets their own password with the one-time link from
 * the approval e-mail. Body: { email, token, password }. The token is single use.
 */
const attempts = new Map<string, { n: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const a = attempts.get(ip);
  if (a && now < a.resetAt && a.n >= 10) return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  attempts.set(ip, a && now < a.resetAt ? { ...a, n: a.n + 1 } : { n: 1, resetAt: now + 15 * 60 * 1000 });

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email : '';
  const token = typeof body?.token === 'string' ? body.token : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !token) return NextResponse.json({ error: 'This link is incomplete' }, { status: 400 });
  try {
    const r = await setPasswordWithToken(email, token, password);
    return r.ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: r.error }, { status: r.status });
  } catch (e) {
    console.error('Set password failed:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Your password could not be saved. Please try again.' }, { status: 500 });
  }
}
