import { NextResponse } from 'next/server';

export async function GET() {
  // Security: Disable test routes in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      error: 'Test endpoints are disabled in production',
      message: 'This endpoint is only available in development mode'
    }, { status: 403 });
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    environment: {
      nodeEnv: process.env.NODE_ENV
    }
  });
}

export async function POST(request: Request) {
  // Security: Disable test routes in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      error: 'Test endpoints are disabled in production',
      message: 'This endpoint is only available in development mode'
    }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  
  return NextResponse.json({ 
    status: 'ok', 
    message: 'POST request received successfully',
    received: body 
  });
} 
