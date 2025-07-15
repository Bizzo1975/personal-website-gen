import { NextRequest, NextResponse } from 'next/server';
import { FollowUpEmailService } from '@/lib/services/follow-up-email-service';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const followUpService = new FollowUpEmailService();
    
    // Send follow-up emails
    await followUpService.scheduleFollowUpEmails();

    return NextResponse.json({
      success: true,
      message: 'Follow-up emails processed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error processing follow-up emails:', error);
    return NextResponse.json(
      { error: 'Failed to process follow-up emails' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check endpoint
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'follow-up-emails',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
    
  } catch (error) {
    console.error('Error in follow-up emails health check:', error);
    return NextResponse.json(
      { error: 'Service unhealthy' },
      { status: 500 }
    );
  }
} 