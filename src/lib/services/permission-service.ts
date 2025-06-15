/**
 * Permission Service
 * Handles all permission checking and access control logic
 */

import {
  ContentPermissions,
  PermissionCheckResult,
  UserContext,
  PermissionLevel,
  UserRole,
  PermissionRule,
  PERMISSION_LEVEL_HIERARCHY,
  ROLE_HIERARCHY,
  DEFAULT_PERMISSION_TEMPLATES
} from '@/types/content/permissions';

export class PermissionService {
  /**
   * Check if a user has permission to access content
   */
  static checkPermission(
    permissions: ContentPermissions,
    userContext: UserContext
  ): PermissionCheckResult {
    // Check custom rules first (sorted by priority)
    if (permissions.customRules && permissions.customRules.length > 0) {
      const sortedRules = permissions.customRules.sort((a, b) => b.priority - a.priority);
      
      for (const rule of sortedRules) {
        const ruleResult = this.evaluateRule(rule, userContext);
        if (ruleResult !== null) {
          return {
            allowed: ruleResult,
            reason: ruleResult ? `Allowed by rule: ${rule.name}` : `Denied by rule: ${rule.name}`,
            appliedRule: rule
          };
        }
      }
    }

    // Check if user is explicitly restricted
    if (permissions.restrictedUsers.length > 0) {
      const isRestricted = permissions.restrictedUsers.includes(userContext.id || '') ||
                          permissions.restrictedUsers.includes(userContext.email || '');
      
      if (isRestricted) {
        return {
          allowed: false,
          reason: 'User is explicitly restricted from accessing this content'
        };
      }
    }

    // Check if user is explicitly allowed
    if (permissions.allowedUsers.length > 0) {
      const isExplicitlyAllowed = permissions.allowedUsers.includes(userContext.id || '') ||
                                 permissions.allowedUsers.includes(userContext.email || '');
      
      if (isExplicitlyAllowed) {
        return {
          allowed: true,
          reason: 'User is explicitly allowed to access this content'
        };
      }
    }

    // Check authentication requirement
    if (permissions.requiresAuth && !userContext.isAuthenticated) {
      return {
        allowed: false,
        reason: 'Authentication required',
        requiredLevel: permissions.level
      };
    }

    // Check role permissions
    const hasRolePermission = this.checkRolePermission(permissions.allowedRoles, userContext.role);
    if (!hasRolePermission) {
      return {
        allowed: false,
        reason: 'Insufficient role permissions',
        requiredRoles: permissions.allowedRoles
      };
    }

    // Check access level permissions
    const hasLevelPermission = this.checkLevelPermission(permissions.level, userContext.accessLevel);
    if (!hasLevelPermission) {
      return {
        allowed: false,
        reason: 'Insufficient access level',
        requiredLevel: permissions.level
      };
    }

    return {
      allowed: true,
      reason: 'All permission checks passed'
    };
  }

  /**
   * Check if user role has permission
   */
  private static checkRolePermission(allowedRoles: UserRole[], userRole: UserRole): boolean {
    if (allowedRoles.length === 0) return true;

    // Check if user's role or any of its included roles are allowed
    const userRoleHierarchy = ROLE_HIERARCHY[userRole] || [userRole];
    return allowedRoles.some(role => userRoleHierarchy.includes(role));
  }

  /**
   * Check if user access level has permission
   */
  private static checkLevelPermission(
    requiredLevel: PermissionLevel,
    userAccessLevel?: PermissionLevel
  ): boolean {
    if (!userAccessLevel) {
      // If no access level specified, default to 'all' for authenticated users
      userAccessLevel = 'all';
    }

    // Check if user's access level includes the required level
    const userLevelHierarchy = PERMISSION_LEVEL_HIERARCHY[userAccessLevel] || ['all'];
    return userLevelHierarchy.includes(requiredLevel);
  }

  /**
   * Evaluate a custom permission rule
   */
  private static evaluateRule(rule: PermissionRule, userContext: UserContext): boolean | null {
    const { condition } = rule;
    let conditionMet = false;

    switch (condition.type) {
      case 'role':
        conditionMet = this.evaluateCondition(userContext.role, condition.operator, condition.value);
        break;
      
      case 'user':
        const userId = userContext.id || userContext.email || '';
        conditionMet = this.evaluateCondition(userId, condition.operator, condition.value);
        break;
      
      case 'date':
        const now = new Date();
        conditionMet = this.evaluateCondition(now, condition.operator, condition.value);
        break;
      
      case 'custom':
        // For custom conditions, you can extend this based on your needs
        conditionMet = this.evaluateCustomCondition(condition, userContext);
        break;
      
      default:
        return null; // Unknown condition type
    }

    return conditionMet ? (rule.action === 'allow') : null;
  }

  /**
   * Evaluate a condition based on operator
   */
  private static evaluateCondition(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      
      case 'not_equals':
        return actual !== expected;
      
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      
      case 'not_in':
        return Array.isArray(expected) && !expected.includes(actual);
      
      case 'before':
        return new Date(actual) < new Date(expected);
      
      case 'after':
        return new Date(actual) > new Date(expected);
      
      case 'between':
        if (Array.isArray(expected) && expected.length === 2) {
          const date = new Date(actual);
          return date >= new Date(expected[0]) && date <= new Date(expected[1]);
        }
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Evaluate custom conditions (extend as needed)
   */
  private static evaluateCustomCondition(condition: any, userContext: UserContext): boolean {
    // Implement custom condition logic here
    // For example, checking specific permissions, IP ranges, etc.
    return false;
  }

  /**
   * Get default permissions for a content type
   */
  static getDefaultPermissions(level: PermissionLevel = 'all'): ContentPermissions {
    const template = DEFAULT_PERMISSION_TEMPLATES.find(t => t.level === level) ||
                    DEFAULT_PERMISSION_TEMPLATES.find(t => t.id === 'public')!;

    return {
      level: template.level,
      allowedRoles: [...template.defaultRoles],
      allowedUsers: [],
      restrictedUsers: [],
      requiresAuth: template.requiresAuth,
      customRules: []
    };
  }

  /**
   * Create permissions from template
   */
  static createPermissionsFromTemplate(templateId: string): ContentPermissions {
    const template = DEFAULT_PERMISSION_TEMPLATES.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error(`Permission template '${templateId}' not found`);
    }

    return {
      level: template.level,
      allowedRoles: [...template.defaultRoles],
      allowedUsers: [],
      restrictedUsers: [],
      requiresAuth: template.requiresAuth,
      customRules: []
    };
  }

  /**
   * Filter content based on user permissions
   */
  static filterContentByPermissions<T extends { permissions: ContentPermissions }>(
    content: T[],
    userContext: UserContext
  ): T[] {
    return content.filter(item => {
      const result = this.checkPermission(item.permissions, userContext);
      return result.allowed;
    });
  }

  /**
   * Get user context from session or request
   */
  static createUserContext(
    user?: {
      id?: string;
      email?: string;
      role?: string;
      permissions?: string[];
      accessLevel?: PermissionLevel;
    }
  ): UserContext {
    if (!user) {
      return {
        role: 'guest',
        permissions: [],
        isAuthenticated: false
      };
    }

    return {
      id: user.id,
      email: user.email,
      role: (user.role as UserRole) || 'subscriber',
      permissions: user.permissions || [],
      isAuthenticated: true,
      accessLevel: user.accessLevel || 'all'
    };
  }

  /**
   * Validate permission configuration
   */
  static validatePermissions(permissions: ContentPermissions): string[] {
    const errors: string[] = [];

    // Check if level is valid
    if (!['personal', 'professional', 'all'].includes(permissions.level)) {
      errors.push('Invalid permission level');
    }

    // Check if roles are valid
    const validRoles: UserRole[] = ['admin', 'editor', 'author', 'subscriber', 'guest'];
    const invalidRoles = permissions.allowedRoles.filter(role => !validRoles.includes(role));
    if (invalidRoles.length > 0) {
      errors.push(`Invalid roles: ${invalidRoles.join(', ')}`);
    }

    // Check custom rules
    if (permissions.customRules) {
      permissions.customRules.forEach((rule, index) => {
        if (!rule.id || !rule.name) {
          errors.push(`Rule ${index + 1}: Missing id or name`);
        }
        if (!['allow', 'deny'].includes(rule.action)) {
          errors.push(`Rule ${index + 1}: Invalid action`);
        }
        if (typeof rule.priority !== 'number') {
          errors.push(`Rule ${index + 1}: Priority must be a number`);
        }
      });
    }

    return errors;
  }

  /**
   * Get permission summary for display
   */
  static getPermissionSummary(permissions: ContentPermissions): string {
    const parts: string[] = [];

    // Add level
    parts.push(`Level: ${permissions.level}`);

    // Add authentication requirement
    if (permissions.requiresAuth) {
      parts.push('Authentication required');
    }

    // Add roles
    if (permissions.allowedRoles.length > 0) {
      parts.push(`Roles: ${permissions.allowedRoles.join(', ')}`);
    }

    // Add specific users
    if (permissions.allowedUsers.length > 0) {
      parts.push(`${permissions.allowedUsers.length} specific user(s)`);
    }

    // Add restrictions
    if (permissions.restrictedUsers.length > 0) {
      parts.push(`${permissions.restrictedUsers.length} restricted user(s)`);
    }

    // Add custom rules
    if (permissions.customRules && permissions.customRules.length > 0) {
      parts.push(`${permissions.customRules.length} custom rule(s)`);
    }

    return parts.join(' • ');
  }
}