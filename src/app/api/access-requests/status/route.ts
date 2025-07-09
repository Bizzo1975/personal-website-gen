import { NextRequest, NextResponse } from 'next/server';
import { AccessRequestService } from '@/lib/services/access-request-service';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get all access requests for this email
    const result = await query(
      `SELECT 
        id,
        name,
        email,
        subject,
        message,
        requested_access_level,
        status,
        submitted_at,
        processed_at,
        admin_notes
      FROM access_requests 
      WHERE email = $1 AND request_type = 'access_request'
      ORDER BY submitted_at DESC`,
      [email.toLowerCase().trim()]
    );

    const requests = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      subject: row.subject,
      message: row.message,
      accessLevel: row.requested_access_level,
      status: row.status,
      submittedAt: row.submitted_at,
      processedAt: row.processed_at,
      adminNotes: row.admin_notes
    }));

    // Get current access levels for this user
    const accessResult = await query(
      `SELECT 
        has_professional_access,
        has_personal_access,
        is_active,
        granted_at
      FROM user_access_levels 
      WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    const currentAccess = accessResult.rows.length > 0 ? {
      hasProfessionalAccess: accessResult.rows[0].has_professional_access,
      hasPersonalAccess: accessResult.rows[0].has_personal_access,
      isActive: accessResult.rows[0].is_active,
      grantedAt: accessResult.rows[0].granted_at
    } : null;

    return NextResponse.json({
      email,
      requests,
      currentAccess,
      summary: {
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        approvedRequests: requests.filter(r => r.status === 'approved').length,
        rejectedRequests: requests.filter(r => r.status === 'rejected').length,
        hasAnyAccess: currentAccess ? (currentAccess.hasProfessionalAccess || currentAccess.hasPersonalAccess) : false
      }
    });

  } catch (error) {
    console.error('Error checking access request status:', error);
    return NextResponse.json(
      { error: 'Failed to check access request status' },
      { status: 500 }
    );
  }
} 