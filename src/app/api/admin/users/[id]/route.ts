import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { PermissionService } from '@/lib/services/permission-service';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/admin/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;
    
    // Get user with access levels
    const userQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.email_verified,
        u.profile_image,
        u.last_login,
        u.login_attempts,
        u.preferences,
        u.created_at,
        u.updated_at,
        ual.has_professional_access,
        ual.has_personal_access,
        ual.is_active,
        ual.granted_at,
        ual.granted_by
      FROM users u
      LEFT JOIN user_access_levels ual ON u.email = ual.email
      WHERE u.id = $1
    `;
    
    const result = await query(userQuery, [userId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];
    
    // Get user permissions
    const permissionsQuery = `
      SELECT permission_name, granted_at, is_active
      FROM user_permissions
      WHERE user_id = $1 AND is_active = true
    `;
    
    const permissionsResult = await query(permissionsQuery, [userId]);
    const permissions = permissionsResult.rows.map(row => row.permission_name);
    
    // Get user activity (last 10 activities)
    const activityQuery = `
      SELECT action, description, performed_by, created_at
      FROM user_activity_log
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const activityResult = await query(activityQuery, [userId]);
    
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
      emailVerified: user.email_verified,
      profileImage: user.profile_image,
      lastLogin: user.last_login,
      loginAttempts: user.login_attempts,
      preferences: user.preferences || {},
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      permissions,
      accessLevels: {
        hasProfessionalAccess: user.has_professional_access || false,
        hasPersonalAccess: user.has_personal_access || false,
        isActive: user.is_active || false,
        grantedAt: user.granted_at,
        grantedBy: user.granted_by
      },
      recentActivity: activityResult.rows
    };

    return NextResponse.json({ user: userData });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;
    const updateData = await request.json();
    const { name, email, role, status, password, permissions, hasProfessionalAccess, hasPersonalAccess } = updateData;

    // Check if user exists
    const existingUser = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUser = existingUser.rows[0];
    
    // Validate role if provided
    if (role) {
      const validRoles = ['subscriber', 'author', 'editor', 'admin'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      
      // Check if email is already taken by another user
      const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase(), userId]);
      if (emailCheck.rows.length > 0) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    // Build update query with explicit parameter tracking
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    console.log('=== DEBUG UPDATE DATA ===');
    console.log('Received updateData:', updateData);
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Role:', role);
    console.log('Status:', status, 'type:', typeof status);
    console.log('Password provided:', !!password);

    if (name) {
      updateFields.push('name = $' + paramIndex);
      updateValues.push(name.trim());
      paramIndex++;
    }

    if (email) {
      updateFields.push('email = $' + paramIndex);
      updateValues.push(email.toLowerCase());
      paramIndex++;
    }

    if (role && role !== currentUser.role) {
      updateFields.push('role = $' + paramIndex);
      updateValues.push(role);
      paramIndex++;
    }

    if (status !== undefined) {
      updateFields.push('status = $' + paramIndex);
      updateValues.push(status);
      paramIndex++;
      console.log('Status field added to update:', status);
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      }
      
      const passwordHash = await bcrypt.hash(password, 12);
      updateFields.push('password_hash = $' + paramIndex);
      updateValues.push(passwordHash);
      paramIndex++;
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = $' + paramIndex);
    updateValues.push(new Date().toISOString());
    paramIndex++;

    // Add userId for WHERE clause
    updateValues.push(userId);
    const whereParamIndex = paramIndex;

    // Build query with explicit string concatenation
    const updateQuery = 'UPDATE users SET ' + updateFields.join(', ') + ' WHERE id = $' + whereParamIndex + ' RETURNING id, name, email, role, status, created_at, updated_at';

    console.log('=== FULL UPDATE QUERY ===');
    console.log('Query:', updateQuery);
    console.log('Values:', updateValues);
    console.log('UserId:', userId);

    const updateResult = await query(updateQuery, updateValues);
    const updatedUser = updateResult.rows[0];

    console.log('=== DATABASE UPDATE RESULT ===');
    console.log('Updated user from database:', updatedUser);
    console.log('Status in returned user:', updatedUser.status);
    console.log('Expected status:', status);

    // Log role change if role was updated
    if (role && role !== currentUser.role) {
      try {
        // Get admin user ID for proper logging
        const adminUserQuery = await query('SELECT id FROM users WHERE email = $1', [session.user.email]);
        const adminUserId = adminUserQuery.rows[0]?.id || null;
        
        if (adminUserId) {
          await query(
            'INSERT INTO user_role_history (user_id, old_role, new_role, changed_by, reason) VALUES ($1, $2, $3, $4, $5)',
            [userId, currentUser.role || 'unknown', role, adminUserId, 'Admin role update']
          );
        }
      } catch (err) {
        console.warn('Could not log role change:', err.message);
      }
    }

    // TEMPORARILY SKIP access level update to avoid UUID conflicts
    // This will be re-added once the core functionality is working
    if (hasProfessionalAccess !== undefined || hasPersonalAccess !== undefined) {
      console.log('=== SKIPPING ACCESS LEVEL UPDATE ===');
      console.log('hasProfessionalAccess:', hasProfessionalAccess);
      console.log('hasPersonalAccess:', hasPersonalAccess);
      console.log('Access level updates temporarily disabled to isolate status update issue');
    }

    // Log user update activity with proper admin user ID
    try {
      // Get admin user ID for proper logging
      const adminUserQuery = await query('SELECT id FROM users WHERE email = $1', [session.user.email]);
      const adminUserId = adminUserQuery.rows[0]?.id || null;
      
      if (adminUserId) {
        await query(
          'INSERT INTO user_activity_log (user_id, action, description, performed_by, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
          [
            userId,
            'user_updated',
            'User profile updated by admin. Fields: ' + updateFields.join(', '),
            adminUserId
          ]
        );
      }
    } catch (err) {
      console.warn('Could not log user activity:', err.message);
    }

    // Verify the update by re-querying the user
    try {
      const verifyQuery = await query('SELECT id, name, email, role, status FROM users WHERE id = $1', [userId]);
      const verifiedUser = verifyQuery.rows[0];
      console.log('=== VERIFICATION QUERY ===');
      console.log('Re-queried user:', verifiedUser);
      console.log('Status in verification:', verifiedUser.status);
      console.log('Status matches expected:', verifiedUser.status === status);
    } catch (err) {
      console.warn('Could not verify user update:', err.message);
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;
    
    // Check if user exists
    const existingUser = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userToDelete = existingUser.rows[0];
    
    // Prevent self-deletion
    if (userToDelete.email === session.user.email) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Log deletion before actually deleting
    try {
      // Get admin user ID for proper logging
      const adminUserQuery = await query('SELECT id FROM users WHERE email = $1', [session.user.email]);
      const adminUserId = adminUserQuery.rows[0]?.id || null;
      
      if (adminUserId) {
        await query(
          'INSERT INTO user_activity_log (user_id, action, description, performed_by, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
          [
            userId,
            'user_deleted',
            `User account deleted by admin. User: ${userToDelete.name} (${userToDelete.email})`,
            adminUserId
          ]
        );
      }
    } catch (err) {
      console.warn('Could not log user activity:', err.message);
    }

    // Delete user (CASCADE will handle related records)
    await query('DELETE FROM users WHERE id = $1', [userId]);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
} 