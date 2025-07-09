import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT COUNT(*) as count FROM users');
    const count = parseInt(result.rows[0].count);
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching users count:', error);
    return NextResponse.json({ count: 0 });
  }
} 