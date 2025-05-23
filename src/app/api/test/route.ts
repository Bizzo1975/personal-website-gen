import { NextResponse } from 'next/server';
import { isMockMode } from '@/lib/db';

export async function GET() {
  // Check if we're in mock mode
  const mockMode = isMockMode();
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mockMode: mockMode,
    nodeEnv: process.env.NODE_ENV,
    environment: {
      isMockMode: mockMode,
      nodeEnv: process.env.NODE_ENV
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  
  return NextResponse.json({ 
    status: 'ok', 
    message: 'POST request received successfully',
    received: body 
  });
} 