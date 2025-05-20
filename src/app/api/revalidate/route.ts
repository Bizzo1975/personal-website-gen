import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    // Get the path to revalidate from the query parameters
    const path = request.nextUrl.searchParams.get('path');

    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' }, 
        { status: 400 }
      );
    }

    // Revalidate the path
    console.log(`Revalidating path: ${path}`);
    revalidatePath(path);

    return NextResponse.json({
      revalidated: true,
      message: `Path ${path} revalidated successfully`,
      now: Date.now()
    });
  } catch (error) {
    console.error('Error in revalidate route:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate path' }, 
      { status: 500 }
    );
  }
} 