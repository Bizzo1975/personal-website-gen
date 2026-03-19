import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { EnhancedAccessRequestService } from '@/lib/services/enhanced-access-request-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const enhancedService = new EnhancedAccessRequestService();
    const accessRequest = await enhancedService.getById(resolvedParams.id);
    
    if (!accessRequest) {
      return NextResponse.json({ error: 'Access request not found' }, { status: 404 });
    }

    return NextResponse.json(accessRequest);
  } catch (error) {
    console.error('Error fetching access request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch access request' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { status, adminNotes, createUserAccount = true } = await request.json();
    
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
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
    
    if (status === 'approved') {
      // Use enhanced service for approval with automatic user creation and email notifications
      result = await enhancedService.approveWithUserCreation(
        resolvedParams.id,
        adminUserId,
        adminNotes,
        createUserAccount
      );
      
      return NextResponse.json({
        success: true,
        message: 'Access request approved successfully',
        request: result.request,
        userCreated: !!result.user,
        generatedPassword: result.generatedPassword ? '****' : null // Don't expose password in response
      });
    } else {
      // Use enhanced service for rejection with email notifications
      result = await enhancedService.rejectWithNotification(
        resolvedParams.id,
        adminUserId,
        adminNotes
      );
      
      return NextResponse.json({
        success: true,
        message: 'Access request rejected successfully',
        request: result
      });
    }
    
  } catch (error) {
    console.error('Error updating access request:', error);
    return NextResponse.json(
      { error: 'Failed to update access request' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { requestedAccessLevel } = await request.json();
    
    if (!requestedAccessLevel || !['personal', 'professional'].includes(requestedAccessLevel)) {
      return NextResponse.json({ error: 'Invalid access level. Must be "personal" or "professional"' }, { status: 400 });
    }

    const enhancedService = new EnhancedAccessRequestService();
    
    // Update the access level in the database
    const { query } = await import('@/lib/db');
    const result = await query(
      `UPDATE access_requests 
       SET requested_access_level = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [requestedAccessLevel, resolvedParams.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Access request not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Access level updated successfully',
      request: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating access level:', error);
    return NextResponse.json(
      { error: 'Failed to update access level' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const enhancedService = new EnhancedAccessRequestService();
    const result = await enhancedService.deleteById(resolvedParams.id);
    
    if (!result) {
      return NextResponse.json({ error: 'Access request not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Access request deleted successfully' });
  } catch (error) {
    console.error('Error deleting access request:', error);
    return NextResponse.json(
      { error: 'Failed to delete access request' },
      { status: 500 }
    );
  }
} 