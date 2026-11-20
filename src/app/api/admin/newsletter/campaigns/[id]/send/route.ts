import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { sendCampaign } from '@/lib/newsletter/delivery';

/**
 * POST — send a draft, scheduled or previously failed campaign now to all confirmed
 * subscribers. Returns the real per-recipient outcome. Retrying a failed campaign
 * sends only to subscribers not already recorded as sent for it.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  try {
    const outcome = await sendCampaign(id, ['draft', 'scheduled', 'failed']);
    if (outcome.status === 'not_sent') {
      return NextResponse.json({ error: outcome.error, outcome }, { status: 409 });
    }
    return NextResponse.json({ success: outcome.ok, outcome }, { status: outcome.ok ? 200 : 502 });
  } catch (error) {
    console.error('Campaign send failed:', error);
    return NextResponse.json({ error: 'Campaign send failed' }, { status: 500 });
  }
}
