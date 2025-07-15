import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { PermissionService } from '@/lib/services/permission-service';
import { query } from '@/lib/db';

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

    const { action, userIds, params } = await request.json();

    if (!action || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    if (userIds.length === 0) {
      return NextResponse.json({ error: 'No users selected' }, { status: 400 });
    }

    // Validate user IDs exist
    const usersExistQuery = `SELECT id, email, name FROM users WHERE id = ANY($1)`;
    const usersExistResult = await query(usersExistQuery, [userIds]);
    const existingUsers = usersExistResult.rows;

    if (existingUsers.length !== userIds.length) {
      return NextResponse.json({ error: 'Some users not found' }, { status: 404 });
    }

    let message = '';
    let affectedCount = 0;

    switch (action) {
      case 'activate':
        // Update user status to active
        const activateQuery = `
          UPDATE users 
          SET status = 'active', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ANY($1)
        `;
        const activateResult = await query(activateQuery, [userIds]);
        affectedCount = activateResult.rowCount || 0;
        message = `Successfully activated ${affectedCount} user(s)`;
        
        // Log bulk activation
        for (const user of existingUsers) {
          await query(
            `INSERT INTO user_activity_log (user_id, action, description, performed_by, created_at) 
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [user.id, 'user_activated', `User activated via bulk operation`, session.user.email]
          ).catch(err => console.warn('Could not log user activity:', err.message));
        }
        break;
        
      case 'deactivate':
        // Update user status to inactive
        const deactivateQuery = `
          UPDATE users 
          SET status = 'inactive', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ANY($1)
        `;
        const deactivateResult = await query(deactivateQuery, [userIds]);
        affectedCount = deactivateResult.rowCount || 0;
        message = `Successfully deactivated ${affectedCount} user(s)`;
        
        // Log bulk deactivation
        for (const user of existingUsers) {
          await query(
            `INSERT INTO user_activity_log (user_id, action, description, performed_by, created_at) 
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [user.id, 'user_deactivated', `User deactivated via bulk operation`, session.user.email]
          ).catch(err => console.warn('Could not log user activity:', err.message));
        }
        break;
        
      case 'delete':
        // Prevent deletion of current user
        const currentUserEmail = session.user.email;
        const selfDeleteCheck = existingUsers.find(u => u.email === currentUserEmail);
        if (selfDeleteCheck) {
          return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }
        
        // Log bulk deletion before deleting
        for (const user of existingUsers) {
          await query(
            `INSERT INTO user_activity_log (user_id, action, description, performed_by, created_at) 
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [user.id, 'user_deleted', `User deleted via bulk operation: ${user.name} (${user.email})`, session.user.email]
          ).catch(err => console.warn('Could not log user activity:', err.message));
        }
        
        // Delete users
        const deleteQuery = `DELETE FROM users WHERE id = ANY($1)`;
        const deleteResult = await query(deleteQuery, [userIds]);
        affectedCount = deleteResult.rowCount || 0;
        message = `Successfully deleted ${affectedCount} user(s)`;
        break;
        
      case 'change_role':
        const newRole = params?.role;
        if (!newRole) {
          return NextResponse.json({ error: 'Role is required for role change action' }, { status: 400 });
        }
        
        const validRoles = ['subscriber', 'author', 'editor', 'admin'];
        if (!validRoles.includes(newRole)) {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }
        
        // Update user roles
        const roleChangeQuery = `
          UPDATE users 
          SET role = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ANY($2)
        `;
        const roleChangeResult = await query(roleChangeQuery, [newRole, userIds]);
        affectedCount = roleChangeResult.rowCount || 0;
        message = `Successfully changed role to ${newRole} for ${affectedCount} user(s)`;
        
        // Log role changes
        for (const user of existingUsers) {
          await query(
            `INSERT INTO user_role_history (user_id, old_role, new_role, changed_by, reason) 
             VALUES ($1, $2, $3, $4, $5)`,
            [user.id, 'unknown', newRole, session.user.email, 'Bulk role change']
          ).catch(err => console.warn('Could not log role change:', err.message));
          
          await query(
            `INSERT INTO user_activity_log (user_id, action, description, performed_by, created_at) 
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [user.id, 'role_changed', `Role changed to ${newRole} via bulk operation`, session.user.email]
          ).catch(err => console.warn('Could not log user activity:', err.message));
        }
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Log bulk operation
    await query(
      `INSERT INTO bulk_operations_log (operation_type, target_type, target_ids, parameters, status, total_items, processed_items, performed_by, started_at, completed_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        action,
        'users',
        userIds,
        JSON.stringify(params || {}),
        'completed',
        userIds.length,
        affectedCount,
        session.user.email
      ]
    ).catch(err => console.warn('Could not log bulk operation:', err.message));

    return NextResponse.json({
      success: true,
      action,
      affectedCount,
      totalRequested: userIds.length,
      message
    });

  } catch (error) {
    console.error('Error performing bulk user operation:', error);
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 });
  }
} 

