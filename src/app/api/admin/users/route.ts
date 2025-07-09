import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { AccessRequestService } from '@/lib/services/access-request-service';
import { PermissionService } from '@/lib/services/permission-service';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - Authentication required' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await PermissionService.isUserAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const accessLevel = searchParams.get('accessLevel');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query for users with access levels
    let userQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        ual.has_professional_access,
        ual.has_personal_access,
        ual.is_active,
        ual.granted_at,
        ual.granted_by
      FROM users u
      LEFT JOIN user_access_levels ual ON u.email = ual.email
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add filters
    if (status === 'active') {
      userQuery += ` AND ual.is_active = $${paramIndex}`;
      queryParams.push(true);
      paramIndex++;
    } else if (status === 'inactive') {
      userQuery += ` AND (ual.is_active = $${paramIndex} OR ual.is_active IS NULL)`;
      queryParams.push(false);
      paramIndex++;
    }

    if (accessLevel === 'professional') {
      userQuery += ` AND ual.has_professional_access = $${paramIndex}`;
      queryParams.push(true);
      paramIndex++;
    } else if (accessLevel === 'personal') {
      userQuery += ` AND ual.has_personal_access = $${paramIndex}`;
      queryParams.push(true);
      paramIndex++;
    }

    // Add pagination
    userQuery += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(userQuery, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN user_access_levels ual ON u.email = ual.email
      WHERE 1=1
    `;
    
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (status === 'active') {
      countQuery += ` AND ual.is_active = $${countParamIndex}`;
      countParams.push(true);
      countParamIndex++;
    } else if (status === 'inactive') {
      countQuery += ` AND (ual.is_active = $${countParamIndex} OR ual.is_active IS NULL)`;
      countParams.push(false);
      countParamIndex++;
    }

    if (accessLevel === 'professional') {
      countQuery += ` AND ual.has_professional_access = $${countParamIndex}`;
      countParams.push(true);
      countParamIndex++;
    } else if (accessLevel === 'personal') {
      countQuery += ` AND ual.has_personal_access = $${countParamIndex}`;
      countParams.push(true);
      countParamIndex++;
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Format users data
    const users = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
      accessLevels: {
        hasProfessionalAccess: row.has_professional_access || false,
        hasPersonalAccess: row.has_personal_access || false,
        isActive: row.is_active || false,
        grantedAt: row.granted_at,
        grantedBy: row.granted_by
      }
    }));

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        status,
        accessLevel
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - Authentication required' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await PermissionService.isUserAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { action, email, accessType } = await request.json();
    
    // Validate required fields
    if (!action || !email) {
      return NextResponse.json({ error: 'Action and email are required' }, { status: 400 });
    }

    // Validate access type for grant/revoke actions
    if (['grant', 'revoke'].includes(action) && !accessType) {
      return NextResponse.json({ error: 'Access type is required for grant/revoke actions' }, { status: 400 });
    }

    if (accessType && !['professional', 'personal'].includes(accessType)) {
      return NextResponse.json({ error: 'Invalid access type. Must be professional or personal' }, { status: 400 });
    }

    const adminId = session.user.id || session.user.email;

    switch (action) {
      case 'grant':
        await AccessRequestService.grantAccess(email, accessType, adminId);
        return NextResponse.json({ 
          success: true, 
          message: `${accessType.charAt(0).toUpperCase() + accessType.slice(1)} access granted to ${email}` 
        });

      case 'revoke':
        await AccessRequestService.revokeAccess(email, accessType);
        return NextResponse.json({ 
          success: true, 
          message: `${accessType.charAt(0).toUpperCase() + accessType.slice(1)} access revoked from ${email}` 
        });

      case 'activate':
        await AccessRequestService.activateUser(email);
        return NextResponse.json({ 
          success: true, 
          message: `User ${email} activated` 
        });

      case 'deactivate':
        await AccessRequestService.deactivateUser(email);
        return NextResponse.json({ 
          success: true, 
          message: `User ${email} deactivated` 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error managing user access:', error);
    return NextResponse.json({ error: 'Failed to manage user access' }, { status: 500 });
  }
} 

