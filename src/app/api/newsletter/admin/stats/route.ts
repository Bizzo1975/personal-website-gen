import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock data for now - replace with actual database queries
    const stats = {
      totalNewsletters: 24,
      totalSubscribers: 2683,
      activeSubscribers: 2683,
      totalCampaigns: 18,
      pendingCampaigns: 3,
      averageOpenRate: 0.582,
      averageClickRate: 0.167,
      subscriberGrowth: {
        newSubscribers: 47,
        unsubscribes: 12,
        netGrowth: 35
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Newsletter stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 