import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'API routes are working correctly' });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  
  return NextResponse.json({ 
    status: 'ok', 
    message: 'POST request received successfully',
    received: body 
  });
} 