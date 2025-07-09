import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT COUNT(*) as count FROM projects');
    const count = parseInt(result.rows[0].count);
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching projects count:', error);
    return NextResponse.json({ count: 0 });
  }
} 