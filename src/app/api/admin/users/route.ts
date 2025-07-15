import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { AccessRequestService } from '@/lib/services/access-request-service';
import { PermissionService } from '@/lib/services/permission-service';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

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
        u.status,
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
      status: row.status || 'active',
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

    const requestData = await request.json();
    const { action, email, accessType, name, password, role, status, permissions } = requestData;

    // If this is a user creation request (has name and email but no action)
    if (!action && name && email) {
      return await createUser(requestData, session.user.email);
    }
    
    // If this is an access management request
    if (action && email) {
      return await handleAccessManagement(requestData, session.user.id || session.user.email);
    }

    return NextResponse.json({ error: 'Invalid request. Either provide user creation data or access management action.' }, { status: 400 });

  } catch (error) {
    console.error('Error in user management:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createUser(userData: any, adminEmail: string) {
  const { name, email, password, role = 'subscriber', status = 'active', permissions = [], hasProfessionalAccess = false, hasPersonalAccess = false } = userData;

  // Validate required fields
  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  // Validate role
  const validRoles = ['subscriber', 'author', 'editor', 'admin'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role. Must be one of: subscriber, author, editor, admin' }, { status: 400 });
  }

  // Check if user already exists
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existingUser.rows.length > 0) {
    return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
  }

  // Get admin user ID for granted_by field
  const adminUser = await query('SELECT id FROM users WHERE email = $1', [adminEmail]);
  const adminUserId = adminUser.rows.length > 0 ? adminUser.rows[0].id : null;

  // Generate password if not provided
  let finalPassword = password;
  if (!finalPassword) {
    finalPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
  }

  // Validate password strength
  if (finalPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
  }

  try {
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(finalPassword, saltRounds);

    // Create user
    const userResult = await query(
      `INSERT INTO users (name, email, password_hash, role, email_verified, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING id, name, email, role, created_at`,
      [name.trim(), email.toLowerCase(), passwordHash, role, true]
    );

    const newUser = userResult.rows[0];

    // Always create user access levels record (even if no special access)
    try {
      await query(
        `INSERT INTO user_access_levels (user_id, email, has_professional_access, has_personal_access, granted_at, is_active, notes, granted_by) 
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6, $7)`,
        [
          newUser.id,
          email.toLowerCase(),
          hasProfessionalAccess,
          hasPersonalAccess,
          status === 'active',
          `User created by admin with ${role} role`,
          adminUserId
        ]
      );
    } catch (accessError) {
      console.error('Error creating user access levels:', accessError);
      // Don't fail user creation if access levels fail
    }

    // Log user creation activity
    try {
      await query(
        `INSERT INTO user_activity_log (user_id, action, description, performed_by, ip_address, created_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [
          newUser.id,
          'user_created',
          `User account created by admin with role: ${role}`,
          adminEmail,
          '127.0.0.1' // In production, get actual IP
        ]
      );
    } catch (activityError) {
      console.warn('Could not log user activity:', activityError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.created_at
      },
      generatedPassword: !password ? finalPassword : undefined
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

async function handleAccessManagement(requestData: any, adminId: string) {
  const { action, email, accessType } = requestData;
  
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
} 

