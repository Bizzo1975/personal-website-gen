import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query the database for actual subscriber counts
    const [
      totalSubscribersResult,
      activeSubscribersResult,
      totalCampaignsResult,
      pendingCampaignsResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM newsletter_subscribers'),
      query('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE is_active = true'),
      query('SELECT COUNT(*) as count FROM newsletter_campaigns WHERE status = $1', ['sent']),
      query('SELECT COUNT(*) as count FROM newsletter_campaigns WHERE status = $1', ['scheduled'])
    ]);

    // Get subscriber growth data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      newSubscribersResult,
      unsubscribesResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE subscription_date >= $1', [thirtyDaysAgo]),
      query('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE unsubscribed_at >= $1', [thirtyDaysAgo])
    ]);

    const newSubscribers = parseInt(newSubscribersResult.rows[0].count);
    const unsubscribes = parseInt(unsubscribesResult.rows[0].count);

    const stats = {
      totalSubscribers: parseInt(totalSubscribersResult.rows[0].count),
      activeSubscribers: parseInt(activeSubscribersResult.rows[0].count),
      totalNewsletters: parseInt(totalCampaignsResult.rows[0].count),
      totalCampaigns: parseInt(totalCampaignsResult.rows[0].count),
      pendingCampaigns: parseInt(pendingCampaignsResult.rows[0].count),
      averageOpenRate: 0, // TODO: Calculate from analytics table when implemented
      averageClickRate: 0, // TODO: Calculate from analytics table when implemented
      subscriberGrowth: {
        newSubscribers,
        unsubscribes,
        netGrowth: newSubscribers - unsubscribes
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Newsletter stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 