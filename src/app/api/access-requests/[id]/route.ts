import { NextRequest, NextResponse } from 'next/server';
import { AccessRequestService, UserRoleService } from '@/lib/models/access-request';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    const { status, adminNotes } = await request.json();
    
    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }
    
    // Get the access request
    const accessRequest = await AccessRequestService.getById(id);
    if (!accessRequest) {
      return NextResponse.json(
        { error: 'Access request not found' },
        { status: 404 }
      );
    }
    
    // Check if already processed
    if (accessRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Access request has already been processed' },
        { status: 400 }
      );
    }
    
    // Update the access request status
    const updatedRequest = await AccessRequestService.updateStatus(
      id,
      status,
      session.user.email!,
      adminNotes
    );
    
    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Failed to update access request' },
        { status: 500 }
      );
    }
    
    // If approved, create user role
    if (status === 'approved' && updatedRequest.accessLevel) {
      try {
        const userRole = await UserRoleService.createFromAccessRequest(
          updatedRequest,
          session.user.email!
        );
        
        console.log('✅ User role created:', {
          email: userRole.email,
          accessLevel: userRole.accessLevel,
          grantedBy: userRole.grantedBy
        });
      } catch (error) {
        console.error('Error creating user role:', error);
        // Don't fail the request if role creation fails
      }
    }
    
    console.log(`🔄 Access request ${status}:`, {
      id: updatedRequest._id,
      email: updatedRequest.email,
      accessLevel: updatedRequest.accessLevel,
      processedBy: session.user.email
    });
    
    return NextResponse.json({
      success: true,
      accessRequest: updatedRequest
    });
    
  } catch (error) {
    console.error('Error updating access request:', error);
    
    return NextResponse.json(
      { error: 'Failed to update access request' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Get the access request
    const accessRequest = await AccessRequestService.getById(id);
    if (!accessRequest) {
      return NextResponse.json(
        { error: 'Access request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      accessRequest
    });
    
  } catch (error) {
    console.error('Error fetching access request:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch access request' },
      { status: 500 }
    );
  }
} 