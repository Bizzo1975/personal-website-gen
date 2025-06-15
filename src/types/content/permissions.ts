/**
 * Content Permission System Types
 * Defines permission levels and access control for blog posts and projects
 */

export type PermissionLevel = 'personal' | 'professional' | 'all';

export type UserRole = 'admin' | 'editor' | 'author' | 'subscriber' | 'guest';

/**
 * Content permissions configuration
 */
export interface ContentPermissions {
  level: PermissionLevel;
  allowedRoles: UserRole[];
  allowedUsers: string[]; // User IDs or emails
  restrictedUsers: string[]; // Explicitly denied users
  requiresAuth: boolean;
  customRules?: PermissionRule[];
}

/**
 * Custom permission rule for advanced access control
 */
export interface PermissionRule {
  id: string;
  name: string;
  description: string;
  condition: PermissionCondition;
  action: 'allow' | 'deny';
  priority: number; // Higher priority rules are evaluated first
}

/**
 * Permission condition types
 */
export interface PermissionCondition {
  type: 'role' | 'user' | 'date' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'before' | 'after' | 'between';
  value: any;
  field?: string; // For custom conditions
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredLevel?: PermissionLevel;
  requiredRoles?: UserRole[];
  appliedRule?: PermissionRule;
}

/**
 * User context for permission checking
 */
export interface UserContext {
  id?: string;
  email?: string;
  role: UserRole;
  permissions: string[];
  isAuthenticated: boolean;
  accessLevel?: PermissionLevel;
}

/**
 * Content with permissions
 */
export interface PermissionedContent {
  id: string;
  permissions: ContentPermissions;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Permission template for quick setup
 */
export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  level: PermissionLevel;
  defaultRoles: UserRole[];
  requiresAuth: boolean;
  isSystem: boolean;
}

/**
 * Default permission templates
 */
export const DEFAULT_PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'public',
    name: 'Public Access',
    description: 'Accessible to everyone, including anonymous users',
    level: 'all',
    defaultRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
    requiresAuth: false,
    isSystem: true
  },
  {
    id: 'authenticated',
    name: 'Authenticated Users',
    description: 'Accessible to all authenticated users',
    level: 'all',
    defaultRoles: ['admin', 'editor', 'author', 'subscriber'],
    requiresAuth: true,
    isSystem: true
  },
  {
    id: 'professional',
    name: 'Professional Content',
    description: 'Accessible to users with professional access level',
    level: 'professional',
    defaultRoles: ['admin', 'editor', 'author'],
    requiresAuth: true,
    isSystem: true
  },
  {
    id: 'personal',
    name: 'Personal Content',
    description: 'Accessible to users with personal access level',
    level: 'personal',
    defaultRoles: ['admin', 'editor'],
    requiresAuth: true,
    isSystem: true
  },
  {
    id: 'admin_only',
    name: 'Admin Only',
    description: 'Accessible only to administrators',
    level: 'all',
    defaultRoles: ['admin'],
    requiresAuth: true,
    isSystem: true
  }
];

/**
 * Permission level hierarchy (higher levels include lower levels)
 */
export const PERMISSION_LEVEL_HIERARCHY: Record<PermissionLevel, PermissionLevel[]> = {
  'all': ['all'],
  'professional': ['professional', 'all'],
  'personal': ['personal', 'professional', 'all']
};

/**
 * Role hierarchy (higher roles include permissions of lower roles)
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  'admin': ['admin', 'editor', 'author', 'subscriber', 'guest'],
  'editor': ['editor', 'author', 'subscriber', 'guest'],
  'author': ['author', 'subscriber', 'guest'],
  'subscriber': ['subscriber', 'guest'],
  'guest': ['guest']
};