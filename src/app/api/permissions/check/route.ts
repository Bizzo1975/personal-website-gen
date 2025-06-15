import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { PermissionService } from '@/lib/services/permission-service';
import { ContentPermissions } from '@/types/content/permissions';

export async function POST(request: NextRequest) {
  try {
    const { permissions, contentId, contentType } = await request.json();

    if (!permissions) {
      return NextResponse.json(
        { error: 'Permissions configuration is required' },
        { status: 400 }
      );
    }

    // Get user session
    const session = await getServerSession(authOptions);
    
    // Create user context
    const userContext = PermissionService.createUserContext(session?.user);

    // Check permissions
    const result = PermissionService.checkPermission(permissions as ContentPermissions, userContext);

    return NextResponse.json({
      allowed: result.allowed,
      reason: result.reason,
      requiredLevel: result.requiredLevel,
      requiredRoles: result.requiredRoles,
      appliedRule: result.appliedRule,
      userContext: {
        isAuthenticated: userContext.isAuthenticated,
        role: userContext.role,
        accessLevel: userContext.accessLevel
      }
    });

  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json(
      { error: 'Failed to check permissions' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('contentType');
    const level = searchParams.get('level') as 'personal' | 'professional' | 'all';

    // Get default permissions for content type
    const defaultPermissions = PermissionService.getDefaultPermissions(level || 'all');

    return NextResponse.json({
      defaultPermissions,
      templates: PermissionService.getDefaultPermissions
    });

  } catch (error) {
    console.error('Error getting default permissions:', error);
    return NextResponse.json(
      { error: 'Failed to get default permissions' },
      { status: 500 }
    );
  }
} 