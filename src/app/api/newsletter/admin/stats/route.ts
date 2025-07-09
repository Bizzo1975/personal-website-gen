import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return 0 values for clean development environment
    const stats = {
      totalNewsletters: 0,
      totalSubscribers: 0,
      activeSubscribers: 0,
      totalCampaigns: 0,
      pendingCampaigns: 0,
      averageOpenRate: 0,
      averageClickRate: 0,
      subscriberGrowth: {
        newSubscribers: 0,
        unsubscribes: 0,
        netGrowth: 0
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Newsletter stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 