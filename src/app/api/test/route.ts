import { NextResponse } from 'next/server';

export async function GET() {
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
  const body = await request.json().catch(() => ({}));
  
  return NextResponse.json({ 
    status: 'ok', 
    message: 'POST request received successfully',
    received: body 
  });
} 
