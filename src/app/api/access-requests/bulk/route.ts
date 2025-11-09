import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { EnhancedAccessRequestService } from '@/lib/services/enhanced-access-request-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestIds, action, adminNotes, createUserAccounts = true } = await request.json();
    
    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json({ error: 'No request IDs provided' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 });
    }

    // Ensure email exists
    if (!session.user?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const enhancedService = new EnhancedAccessRequestService();
    
    // Get admin user ID
    const adminUserId = await enhancedService.getAdminUserId(session.user.email);
    if (!adminUserId) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    let result;
    
    if (action === 'approve') {
      result = await enhancedService.bulkApprove(
        requestIds,
        adminUserId,
        adminNotes,
        createUserAccounts
      );
    } else {
      result = await enhancedService.bulkReject(
        requestIds,
        adminUserId,
        adminNotes
      );
    }

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} operation completed`,
      successful: result.successful,
      failed: result.failed,
      totalProcessed: result.successful.length + result.failed.length,
      successCount: result.successful.length,
      failureCount: result.failed.length
    });
    
  } catch (error) {
    console.error('Error processing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk operation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const enhancedService = new EnhancedAccessRequestService();
    
    // Get enhanced statistics for bulk operations
    const stats = await enhancedService.getRequestStats();
    
    return NextResponse.json({
      success: true,
      stats,
      bulkOperations: {
        available: ['approve', 'reject'],
        maxBatchSize: 50,
        supportedFilters: ['status', 'accessLevel']
      }
    });
    
  } catch (error) {
    console.error('Error fetching bulk operation stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bulk operation statistics' },
      { status: 500 }
    );
  }
} 