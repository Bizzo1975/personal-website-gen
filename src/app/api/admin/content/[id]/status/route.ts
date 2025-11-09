import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const contentId = resolvedParams.id;
    const { status } = await request.json();

    if (!status || !['draft', 'review', 'approved', 'published'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // In a real app, you would:
    // 1. Validate user permissions for status change
    // 2. Update the content status in database
    // 3. Create audit log entry
    // 4. Send notifications to collaborators
    // 5. Update search indexes if published

    console.log(`Updating content ${contentId} status to: ${status}`);

    // Simulate status-specific logic
    let message = '';
    switch (status) {
      case 'review':
        message = 'Content submitted for review';
        break;
      case 'approved':
        message = 'Content approved for publication';
        break;
      case 'published':
        message = 'Content published successfully';
        break;
      case 'draft':
        message = 'Content moved back to draft';
        break;
      default:
        message = 'Content status updated';
    }

    return NextResponse.json({
      success: true,
      message,
      status,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating content status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
} 