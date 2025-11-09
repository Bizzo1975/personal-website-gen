import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { PermissionService } from '@/lib/services/permission-service';
import { query } from '@/lib/db';

// GET /api/admin/roles/[id] - Get single role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - Authentication required' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await PermissionService.isUserAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const roleId = resolvedParams.id;
    
    const roleQuery = `
      SELECT 
        id,
        name,
        display_name,
        description,
        permissions,
        is_system,
        created_at,
        updated_at
      FROM roles
      WHERE id = $1
    `;
    
    const result = await query(roleQuery, [roleId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const role = result.rows[0];
    
    // Get users count for this role
    const usersCountQuery = `
      SELECT COUNT(*) as user_count
      FROM users
      WHERE role = $1
    `;
    
    const usersCountResult = await query(usersCountQuery, [role.name]);
    const userCount = parseInt(usersCountResult.rows[0]?.user_count || '0');
    
    const roleData = {
      id: role.id,
      name: role.name,
      displayName: role.display_name,
      description: role.description,
      permissions: role.permissions || [],
      isSystem: role.is_system,
      userCount,
      createdAt: role.created_at,
      updatedAt: role.updated_at
    };

    return NextResponse.json({ role: roleData });

  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/roles/[id] - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - Authentication required' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await PermissionService.isUserAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const roleId = resolvedParams.id;
    const { name, displayName, description, permissions = [] } = await request.json();

    // Check if role exists
    const existingRole = await query('SELECT * FROM roles WHERE id = $1', [roleId]);
    if (existingRole.rows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const currentRole = existingRole.rows[0];

    // Prevent modification of system roles
    if (currentRole.is_system) {
      return NextResponse.json({ error: 'Cannot modify system roles' }, { status: 400 });
    }

    // Validate name format if provided
    if (name) {
      const nameRegex = /^[a-z_]+$/;
      if (!nameRegex.test(name)) {
        return NextResponse.json({ 
          error: 'Role name must be lowercase with underscores only' 
        }, { status: 400 });
      }
      
      // Check if new name is already taken
      if (name !== currentRole.name) {
        const nameCheck = await query('SELECT id FROM roles WHERE name = $1', [name]);
        if (nameCheck.rows.length > 0) {
          return NextResponse.json({ error: 'Role name already exists' }, { status: 409 });
        }
      }
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (name && name !== currentRole.name) {
      updateFields.push(`name = $${paramIndex}`);
      updateValues.push(name);
      paramIndex++;
    }

    if (displayName) {
      updateFields.push(`display_name = $${paramIndex}`);
      updateValues.push(displayName);
      paramIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.push(description);
      paramIndex++;
    }

    if (permissions) {
      updateFields.push(`permissions = $${paramIndex}`);
      updateValues.push(permissions);
      paramIndex++;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(roleId);

    // Update role
    const updateQuery = `
      UPDATE roles 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING id, name, display_name, description, permissions, is_system, created_at, updated_at
    `;

    const updateResult = await query(updateQuery, updateValues);
    const updatedRole = updateResult.rows[0];

    // If role name changed, update all users with this role
    if (name && name !== currentRole.name) {
      await query('UPDATE users SET role = $1 WHERE role = $2', [name, currentRole.name]);
    }

    // Log role update
    await query(
      `INSERT INTO user_activity_log (user_id, action, description, performed_by, created_at) 
       VALUES ((SELECT id FROM users WHERE email = $1), $2, $3, $4, CURRENT_TIMESTAMP)`,
      [
        session.user.email,
        'role_updated',
        `Role '${updatedRole.display_name}' updated. Fields: ${updateFields.join(', ')}`,
        session.user.email
      ]
    ).catch(err => console.warn('Could not log role update:', err.message));

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        displayName: updatedRole.display_name,
        description: updatedRole.description,
        permissions: updatedRole.permissions,
        isSystem: updatedRole.is_system,
        createdAt: updatedRole.created_at,
        updatedAt: updatedRole.updated_at
      }
    });

  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE /api/admin/roles/[id] - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - Authentication required' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await PermissionService.isUserAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const roleId = resolvedParams.id;
    
    // Check if role exists
    const existingRole = await query('SELECT * FROM roles WHERE id = $1', [roleId]);
    if (existingRole.rows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const roleToDelete = existingRole.rows[0];

    // Prevent deletion of system roles
    if (roleToDelete.is_system) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 400 });
    }

    // Check if any users have this role
    const usersWithRole = await query('SELECT COUNT(*) as count FROM users WHERE role = $1', [roleToDelete.name]);
    const userCount = parseInt(usersWithRole.rows[0]?.count || '0');

    if (userCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete role. ${userCount} user(s) currently have this role. Please reassign users to another role first.` 
      }, { status: 400 });
    }

    // Log deletion before actually deleting
    await query(
      `INSERT INTO user_activity_log (user_id, action, description, performed_by, created_at) 
       VALUES ((SELECT id FROM users WHERE email = $1), $2, $3, $4, CURRENT_TIMESTAMP)`,
      [
        session.user.email,
        'role_deleted',
        `Role '${roleToDelete.display_name}' deleted`,
        session.user.email
      ]
    ).catch(err => console.warn('Could not log role deletion:', err.message));

    // Delete role
    await query('DELETE FROM roles WHERE id = $1', [roleId]);

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
} 