import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { PermissionService } from '@/lib/services/permission-service';
import { query } from '@/lib/db';

// GET /api/admin/roles - Get all roles
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

    const rolesQuery = `
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
      ORDER BY is_system DESC, name ASC
    `;
    
    const result = await query(rolesQuery);
    
    const roles = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description,
      permissions: row.permissions || [],
      isSystem: row.is_system,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return NextResponse.json({ roles });

  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/roles - Create new role
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

    const { name, displayName, description, permissions = [] } = await request.json();

    // Validate required fields
    if (!name || !displayName) {
      return NextResponse.json({ error: 'Name and display name are required' }, { status: 400 });
    }

    // Validate name format (lowercase, underscores only)
    const nameRegex = /^[a-z_]+$/;
    if (!nameRegex.test(name)) {
      return NextResponse.json({ 
        error: 'Role name must be lowercase with underscores only' 
      }, { status: 400 });
    }

    // Check if role already exists
    const existingRole = await query('SELECT id FROM roles WHERE name = $1', [name]);
    if (existingRole.rows.length > 0) {
      return NextResponse.json({ error: 'Role with this name already exists' }, { status: 409 });
    }

    // Create role
    const insertQuery = `
      INSERT INTO roles (name, display_name, description, permissions, is_system, created_at, updated_at)
      VALUES ($1, $2, $3, $4, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, display_name, description, permissions, is_system, created_at, updated_at
    `;

    const result = await query(insertQuery, [name, displayName, description, permissions]);
    const newRole = result.rows[0];

    // Log role creation
    await query(
      `INSERT INTO user_activity_log (user_id, action, description, performed_by, created_at) 
       VALUES ((SELECT id FROM users WHERE email = $1), $2, $3, $4, CURRENT_TIMESTAMP)`,
      [
        session.user.email,
        'role_created',
        `Role '${displayName}' created with permissions: ${permissions.join(', ')}`,
        session.user.email
      ]
    ).catch(err => console.warn('Could not log role creation:', err.message));

    return NextResponse.json({
      success: true,
      message: 'Role created successfully',
      role: {
        id: newRole.id,
        name: newRole.name,
        displayName: newRole.display_name,
        description: newRole.description,
        permissions: newRole.permissions,
        isSystem: newRole.is_system,
        createdAt: newRole.created_at,
        updatedAt: newRole.updated_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
} 

