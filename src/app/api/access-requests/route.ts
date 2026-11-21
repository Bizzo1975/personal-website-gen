import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { validateContactForm } from '@/lib/utils/form-validation';
import { verifyRecaptchaToken, isRecaptchaValid } from '@/lib/utils/recaptcha-verify';
import {
  ACCESS_LEVELS,
  type AccessLevel,
  accessRequestStats,
  hasAccess,
  latestRequestFor,
  listAccessRequests,
  submitAccessRequest,
} from '@/lib/access-requests/service';

/**
 * Access requests: public submit (POST) and the admin list (GET).
 * W46: the submit path notifies the admin through Graph (it notified nobody); request
 * bodies with names and e-mail addresses are no longer written to the log; the admin
 * list no longer returns "debug" blocks.
 */
const rateLimit = { windowMs: 60 * 60 * 1000, max: 10, store: new Map<string, { count: number; resetAt: number }>() };

function clientIp(request: NextRequest): string {
  // The first hop is the client as seen by Traefik.
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const now = Date.now();
  const seen = rateLimit.store.get(ip);
  if (seen && now < seen.resetAt && seen.count >= rateLimit.max) {
    const minutes = Math.ceil((seen.resetAt - now) / 60000);
    return NextResponse.json({ success: false, error: `Too many requests. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` }, { status: 429 });
  }
  rateLimit.store.set(ip, seen && now < seen.resetAt ? { ...seen, count: seen.count + 1 } : { count: 1, resetAt: now + rateLimit.windowMs });

  let data: Record<string, unknown>;
  try {
    const type = request.headers.get('content-type') || '';
    if (type.includes('application/json')) {
      data = await request.json();
    } else {
      const f = await request.formData();
      data = {
        name: f.get('name'), email: f.get('email'), message: f.get('message'),
        requestedAccessLevel: f.get('requestedAccessLevel') || f.get('requested_access_level'),
        recaptchaToken: f.get('recaptchaToken'),
      };
    }
  } catch {
    return NextResponse.json({ success: false, error: 'The request could not be read' }, { status: 400 });
  }
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  const level = String(data.requestedAccessLevel || '');

  const missing = [!name && 'name', !email && 'email', !level && 'requestedAccessLevel'].filter(Boolean);
  if (missing.length) {
    return NextResponse.json({ success: false, error: `Missing required fields: ${missing.join(', ')}.` }, { status: 400 });
  }
  if (!(ACCESS_LEVELS as readonly string[]).includes(level)) {
    return NextResponse.json({ success: false, errors: [{ field: 'requestedAccessLevel', message: 'Please select personal or professional access' }] }, { status: 400 });
  }
  const validation = validateContactForm({ name, email, subject: `Access Request - ${level}`, message: message || `Requesting ${level} access` });
  if (!validation.isValid) return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });

  if (process.env.RECAPTCHA_SECRET_KEY) {
    const token = typeof data.recaptchaToken === 'string' ? data.recaptchaToken : '';
    if (!token) return NextResponse.json({ success: false, error: 'Please complete the reCAPTCHA challenge.' }, { status: 400 });
    if (!isRecaptchaValid(await verifyRecaptchaToken(token))) {
      return NextResponse.json({ success: false, error: 'reCAPTCHA verification failed. Please try again.' }, { status: 400 });
    }
  }

  try {
    const previous = await latestRequestFor(email, level as AccessLevel);
    if (previous?.status === 'pending') {
      return NextResponse.json({ success: false, error: `You already have a pending ${level} access request.` }, { status: 409 });
    }
    if (await hasAccess(email, level as AccessLevel)) {
      return NextResponse.json({ success: false, error: `You already have ${level} access.` }, { status: 409 });
    }
    const { request: created } = await submitAccessRequest({ name, email, level: level as AccessLevel, message });
    return NextResponse.json(
      { success: true, message: `${level[0].toUpperCase()}${level.slice(1)} access request submitted`, requestId: created.id, accessLevel: created.requested_access_level },
      { status: 201 }
    );
  } catch (error) {
    console.error('Access request could not be saved:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: 'Your request could not be saved. Please try again later.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const sp = new URL(request.url).searchParams;
  const status = sp.get('status');
  const level = sp.get('accessLevel');
  if (status && !['pending', 'approved', 'rejected'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  if (level && !(ACCESS_LEVELS as readonly string[]).includes(level)) return NextResponse.json({ error: 'Invalid accessLevel' }, { status: 400 });
  try {
    const [accessRequests, stats] = await Promise.all([listAccessRequests(status, level), accessRequestStats()]);
    return NextResponse.json({ success: true, accessRequests, stats, total: accessRequests.length, filters: { status, accessLevel: level } });
  } catch (error) {
    console.error('Access request list failed:', error);
    return NextResponse.json({ error: 'Failed to fetch access requests' }, { status: 500 });
  }
}
