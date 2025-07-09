/**
 * Simplified Permission Service for PostgreSQL-based Content Access Control
 * Supports content classification: all (public), professional, personal
 * Users can have professional AND/OR personal access simultaneously
 */

import { query } from '@/lib/db';

export interface UserAccessLevels {
  hasProfessionalAccess: boolean;
  hasPersonalAccess: boolean;
  isActive: boolean;
}

export interface ContentPermissionCheck {
  hasAccess: boolean;
  reason: string;
  contentLevel: string;
  userAccess: UserAccessLevels | null;
}

export class PermissionService {
  /**
   * Check if user has access to content based on permission level
   */
  static async checkContentAccess(
    contentPermissionLevel: 'all' | 'professional' | 'personal',
    userEmail?: string
  ): Promise<ContentPermissionCheck> {
    try {
      // Public content - everyone can access
      if (contentPermissionLevel === 'all') {
        return {
          hasAccess: true,
          reason: 'Public content accessible to everyone',
          contentLevel: contentPermissionLevel,
          userAccess: null
        };
      }

      // Must be logged in for restricted content
      if (!userEmail) {
        return {
          hasAccess: false,
          reason: 'Authentication required for restricted content',
          contentLevel: contentPermissionLevel,
          userAccess: null
        };
      }

      // Check user's access levels
      const userAccess = await this.getUserAccessLevels(userEmail);
      
      if (!userAccess || !userAccess.isActive) {
        return {
          hasAccess: false,
          reason: 'User has no access permissions or account is inactive',
          contentLevel: contentPermissionLevel,
          userAccess
        };
      }

      // Check specific access level requirements
      let hasRequiredAccess = false;
      let accessReason = '';

      if (contentPermissionLevel === 'professional' && userAccess.hasProfessionalAccess) {
        hasRequiredAccess = true;
        accessReason = 'User has professional access';
      } else if (contentPermissionLevel === 'personal' && userAccess.hasPersonalAccess) {
        hasRequiredAccess = true;
        accessReason = 'User has personal access';
      } else {
        accessReason = `User lacks ${contentPermissionLevel} access`;
      }

      return {
        hasAccess: hasRequiredAccess,
        reason: accessReason,
        contentLevel: contentPermissionLevel,
        userAccess
      };
    } catch (error) {
      console.error('Error checking content access:', error);
      return {
        hasAccess: false,
        reason: 'Error checking permissions',
        contentLevel: contentPermissionLevel,
        userAccess: null
      };
    }
  }

  /**
   * Get user's access levels from database
   */
  static async getUserAccessLevels(email: string): Promise<UserAccessLevels | null> {
    try {
      const result = await query(
        'SELECT has_professional_access, has_personal_access, is_active FROM user_access_levels WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        hasProfessionalAccess: row.has_professional_access,
        hasPersonalAccess: row.has_personal_access,
        isActive: row.is_active
      };
    } catch (error) {
      console.error('Error getting user access levels:', error);
      return null;
    }
  }

  /**
   * Filter content array based on user's access permissions
   * Returns only content the user can access
   */
  static async filterContentByUserAccess<T extends { permissionLevel: string }>(
    content: T[],
    userEmail?: string
  ): Promise<T[]> {
    if (!content || content.length === 0) {
      return [];
    }

    // If no user email, return only public content
    if (!userEmail) {
      return content.filter(item => item.permissionLevel === 'all');
    }

    try {
      // Get user's access levels once
      const userAccess = await this.getUserAccessLevels(userEmail);
      
      if (!userAccess || !userAccess.isActive) {
        // User has no access or is inactive, return only public content
        return content.filter(item => item.permissionLevel === 'all');
      }

      // Filter content based on user's accumulated access levels
      return content.filter(item => {
        switch (item.permissionLevel) {
          case 'all':
            return true; // Everyone can see public content
          case 'professional':
            return userAccess.hasProfessionalAccess;
          case 'personal':
            return userAccess.hasPersonalAccess;
          default:
            return false; // Unknown permission level - deny access
        }
      });
    } catch (error) {
      console.error('Error filtering content by user access:', error);
      // On error, return only public content for safety
      return content.filter(item => item.permissionLevel === 'all');
    }
  }

  /**
   * Check if user is admin (has admin role in users table)
   */
  static async isUserAdmin(email: string): Promise<boolean> {
    try {
      const result = await query(
        'SELECT role FROM users WHERE email = $1 AND role = $2',
        [email, 'admin']
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get content accessibility summary for user
   */
  static async getContentAccessSummary(userEmail?: string): Promise<{
    canAccessPublic: boolean;
    canAccessProfessional: boolean;
    canAccessPersonal: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    accessLevels: UserAccessLevels | null;
  }> {
    if (!userEmail) {
      return {
        canAccessPublic: true,
        canAccessProfessional: false,
        canAccessPersonal: false,
        isAuthenticated: false,
        isAdmin: false,
        accessLevels: null
      };
    }

    try {
      const [userAccess, isAdmin] = await Promise.all([
        this.getUserAccessLevels(userEmail),
        this.isUserAdmin(userEmail)
      ]);

      if (isAdmin) {
        // Admins can access everything
        return {
          canAccessPublic: true,
          canAccessProfessional: true,
          canAccessPersonal: true,
          isAuthenticated: true,
          isAdmin: true,
          accessLevels: userAccess
        };
      }

      if (!userAccess || !userAccess.isActive) {
        return {
          canAccessPublic: true,
          canAccessProfessional: false,
          canAccessPersonal: false,
          isAuthenticated: true,
          isAdmin: false,
          accessLevels: userAccess
        };
      }

      return {
        canAccessPublic: true,
        canAccessProfessional: userAccess.hasProfessionalAccess,
        canAccessPersonal: userAccess.hasPersonalAccess,
        isAuthenticated: true,
        isAdmin: false,
        accessLevels: userAccess
      };
    } catch (error) {
      console.error('Error getting content access summary:', error);
      return {
        canAccessPublic: true,
        canAccessProfessional: false,
        canAccessPersonal: false,
        isAuthenticated: true,
        isAdmin: false,
        accessLevels: null
      };
    }
  }

  /**
   * Validate permission level string
   */
  static isValidPermissionLevel(level: string): level is 'all' | 'professional' | 'personal' {
    return ['all', 'professional', 'personal'].includes(level);
  }

  /**
   * Get permission level hierarchy for display
   */
  static getPermissionLevelInfo(level: 'all' | 'professional' | 'personal') {
    const levelInfo = {
      all: {
        name: 'Public',
        description: 'Accessible to everyone',
        color: 'green',
        icon: '🌐'
      },
      professional: {
        name: 'Professional',
        description: 'Accessible to users with professional access',
        color: 'blue',
        icon: '💼'
      },
      personal: {
        name: 'Personal',
        description: 'Accessible to users with personal access',
        color: 'purple',
        icon: '👤'
      }
    };

    return levelInfo[level];
  }

  /**
   * Get user's effective content counts by permission level
   */
  static async getUserContentCounts(userEmail?: string): Promise<{
    totalPublic: number;
    totalProfessional: number;
    totalPersonal: number;
    accessibleProfessional: number;
    accessiblePersonal: number;
  }> {
    try {
      // Get total counts by permission level
      const countsResult = await query(`
        SELECT 
          permission_level,
          COUNT(*) as count
        FROM (
          SELECT permission_level FROM posts WHERE published = true
          UNION ALL
          SELECT permission_level FROM projects WHERE status = 'published'
        ) combined
        GROUP BY permission_level
      `);

      const counts = {
        totalPublic: 0,
        totalProfessional: 0,
        totalPersonal: 0,
        accessibleProfessional: 0,
        accessiblePersonal: 0
      };

      // Parse total counts
      countsResult.rows.forEach(row => {
        switch (row.permission_level) {
          case 'all':
            counts.totalPublic = parseInt(row.count);
            break;
          case 'professional':
            counts.totalProfessional = parseInt(row.count);
            break;
          case 'personal':
            counts.totalPersonal = parseInt(row.count);
            break;
        }
      });

      // Calculate accessible counts based on user access
      if (userEmail) {
        const userAccess = await this.getUserAccessLevels(userEmail);
        const isAdmin = await this.isUserAdmin(userEmail);

        if (isAdmin || (userAccess && userAccess.isActive)) {
          if (isAdmin || (userAccess && userAccess.hasProfessionalAccess)) {
            counts.accessibleProfessional = counts.totalProfessional;
          }
          if (isAdmin || (userAccess && userAccess.hasPersonalAccess)) {
            counts.accessiblePersonal = counts.totalPersonal;
          }
        }
      }

      return counts;
    } catch (error) {
      console.error('Error getting user content counts:', error);
      return {
        totalPublic: 0,
        totalProfessional: 0,
        totalPersonal: 0,
        accessibleProfessional: 0,
        accessiblePersonal: 0
      };
    }
  }
}