import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';
import { AccessRequestService } from '@/lib/services/access-request-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessRequest = await AccessRequestService.getById(params.id);
    
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, adminNotes } = await request.json();
    
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const result = await AccessRequestService.updateStatus(
      params.id,
      status,
      session.user.id,
      adminNotes
    );

    if (!result) {
      return NextResponse.json({ error: 'Access request not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating access request:', error);
    return NextResponse.json(
      { error: 'Failed to update access request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await AccessRequestService.deleteById(params.id);
    
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