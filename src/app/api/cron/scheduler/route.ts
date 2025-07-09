import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Cron endpoint' });
}

export async function GET() {
  return NextResponse.json({ message: 'Scheduler active' });
} 
