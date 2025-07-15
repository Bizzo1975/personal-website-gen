import { query } from '@/lib/db';

export interface AccessRequestData {
  name: string;
  email: string;
  requestedAccessLevel: 'professional' | 'personal';
  message: string;
}

export interface AccessRequestResult {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  request_type: string;
  requested_access_level: 'professional' | 'personal';
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: Date;
  processed_at?: Date;
  processed_by?: string;
  admin_notes?: string;
}

export interface AccessRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  professional: number;
  personal: number;
}

export class AccessRequestService {
  /**
   * Create a new access request
   */
  static async create(data: AccessRequestData): Promise<AccessRequestResult> {
    try {
      const result = await query(
        `INSERT INTO access_requests 
         (name, email, subject, message, request_type, requested_access_level, status, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          data.name,
          data.email,
          `Access Request - ${data.requestedAccessLevel}`,
          data.message,
          'access_request',
          data.requestedAccessLevel,
          'pending'
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error creating access request:', error);
      throw new Error('Failed to create access request');
    }
  }

  /**
   * Get filtered access requests
   */
  static async getFilteredRequests(
    status?: 'pending' | 'approved' | 'rejected' | null,
    accessLevel?: 'professional' | 'personal' | null
  ): Promise<AccessRequestResult[]> {
    try {
      let sqlQuery = `
        SELECT 
          ar.*,
          u.name as processed_by_name
        FROM access_requests ar
        LEFT JOIN users u ON ar.processed_by = u.id
        WHERE request_type = 'access_request'
      `;
      
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        sqlQuery += ` AND ar.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (accessLevel) {
        sqlQuery += ` AND ar.requested_access_level = $${paramIndex}`;
        params.push(accessLevel);
        paramIndex++;
      }

      sqlQuery += ` ORDER BY ar.submitted_at DESC`;

      const result = await query(sqlQuery, params);
      
      return result.rows.map(row => ({
        ...row,
        _id: row.id, // For compatibility with frontend
        accessLevel: row.requested_access_level,
        submittedAt: row.submitted_at,
        processedAt: row.processed_at,
        processedBy: row.processed_by_name || row.processed_by,
        adminNotes: row.admin_notes
      }));
    } catch (error) {
      console.error('Error fetching access requests:', error);
      throw new Error('Failed to fetch access requests');
    }
  }

  /**
   * Get access request by ID
   */
  static async getById(id: string): Promise<AccessRequestResult | null> {
    try {
      const result = await query(
        `SELECT 
          ar.*,
          u.name as processed_by_name
         FROM access_requests ar
         LEFT JOIN users u ON ar.processed_by = u.id
         WHERE ar.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        ...row,
        _id: row.id,
        accessLevel: row.requested_access_level,
        submittedAt: row.submitted_at,
        processedAt: row.processed_at,
        processedBy: row.processed_by_name || row.processed_by,
        adminNotes: row.admin_notes
      };
    } catch (error) {
      console.error('Error fetching access request by ID:', error);
      throw new Error('Failed to fetch access request');
    }
  }

  /**
   * Update access request status (approve/reject)
   */
  static async updateStatus(
    id: string,
    status: 'approved' | 'rejected',
    adminId: string,
    adminNotes?: string
  ): Promise<AccessRequestResult | null> {
    try {
      // Start transaction
      await query('BEGIN');

      // Update the access request
      const updateResult = await query(
        `UPDATE access_requests 
         SET status = $1, processed_at = CURRENT_TIMESTAMP, processed_by = $2, admin_notes = $3
         WHERE id = $4 AND request_type = 'access_request'
         RETURNING *`,
        [status, adminId, adminNotes, id]
      );

      if (updateResult.rows.length === 0) {
        await query('ROLLBACK');
        return null;
      }

      const accessRequest = updateResult.rows[0];

      // If approved, grant access to user
      if (status === 'approved') {
        await this.grantAccess(
          accessRequest.email,
          accessRequest.requested_access_level,
          adminId
        );
      }

      await query('COMMIT');

      return {
        ...accessRequest,
        _id: accessRequest.id,
        accessLevel: accessRequest.requested_access_level,
        submittedAt: accessRequest.submitted_at,
        processedAt: accessRequest.processed_at,
        processedBy: accessRequest.processed_by,
        adminNotes: accessRequest.admin_notes
      };
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error updating access request status:', error);
      throw new Error('Failed to update access request status');
    }
  }

  /**
   * Check if user already has an existing request
   */
  static async getExistingRequest(
    email: string,
    accessLevel: 'professional' | 'personal'
  ): Promise<AccessRequestResult | null> {
    try {
      const result = await query(
        `SELECT * FROM access_requests 
         WHERE email = $1 AND requested_access_level = $2 AND request_type = 'access_request'
         ORDER BY submitted_at DESC LIMIT 1`,
        [email, accessLevel]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        ...row,
        _id: row.id,
        accessLevel: row.requested_access_level,
        submittedAt: row.submitted_at,
        processedAt: row.processed_at,
        processedBy: row.processed_by,
        adminNotes: row.admin_notes
      };
    } catch (error) {
      console.error('Error checking existing request:', error);
      throw new Error('Failed to check existing request');
    }
  }

  /**
   * Check if user has access to a specific level
   */
  static async checkUserAccess(
    email: string,
    accessLevel: 'professional' | 'personal'
  ): Promise<boolean> {
    try {
      const column = accessLevel === 'professional' ? 'has_professional_access' : 'has_personal_access';
      
      const result = await query(
        `SELECT ${column} FROM user_access_levels 
         WHERE email = $1 AND is_active = true`,
        [email]
      );

      return result.rows.length > 0 && result.rows[0][column] === true;
    } catch (error) {
      console.error('Error checking user access:', error);
      return false;
    }
  }

  /**
   * Grant access to user
   */
  static async grantAccess(
    email: string,
    accessType: 'professional' | 'personal',
    adminId: string
  ): Promise<void> {
    try {
      const column = accessType === 'professional' ? 'has_professional_access' : 'has_personal_access';
      
      // Check if user already has access record
      const existingResult = await query(
        'SELECT * FROM user_access_levels WHERE email = $1',
        [email]
      );

      if (existingResult.rows.length > 0) {
        // Update existing record
        await query(
          `UPDATE user_access_levels 
           SET ${column} = true, granted_at = CURRENT_TIMESTAMP, granted_by = $1, is_active = true
           WHERE email = $2`,
          [adminId, email]
        );
      } else {
        // Create new record
        const professionalAccess = accessType === 'professional';
        const personalAccess = accessType === 'personal';
        
        await query(
          `INSERT INTO user_access_levels 
           (email, has_professional_access, has_personal_access, granted_at, granted_by, is_active)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, true)`,
          [email, professionalAccess, personalAccess, adminId]
        );
      }
    } catch (error) {
      console.error('Error granting access:', error);
      throw new Error('Failed to grant access');
    }
  }

  /**
   * Revoke access from user
   */
  static async revokeAccess(
    email: string,
    accessType: 'professional' | 'personal'
  ): Promise<void> {
    try {
      const column = accessType === 'professional' ? 'has_professional_access' : 'has_personal_access';
      
      await query(
        `UPDATE user_access_levels 
         SET ${column} = false
         WHERE email = $1`,
        [email]
      );
    } catch (error) {
      console.error('Error revoking access:', error);
      throw new Error('Failed to revoke access');
    }
  }

  /**
   * Activate user
   */
  static async activateUser(email: string): Promise<void> {
    try {
      await query(
        'UPDATE user_access_levels SET is_active = true WHERE email = $1',
        [email]
      );
    } catch (error) {
      console.error('Error activating user:', error);
      throw new Error('Failed to activate user');
    }
  }

  /**
   * Deactivate user
   */
  static async deactivateUser(email: string): Promise<void> {
    try {
      await query(
        'UPDATE user_access_levels SET is_active = false WHERE email = $1',
        [email]
      );
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw new Error('Failed to deactivate user');
    }
  }

  /**
   * Check if user is admin
   */
  static async isUserAdmin(email: string): Promise<boolean> {
    try {
      const result = await query(
        'SELECT role FROM users WHERE email = $1',
        [email]
      );

      return result.rows.length > 0 && result.rows[0].role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get access request statistics
   */
  static async getRequestStats(): Promise<AccessRequestStats> {
    try {
      const result = await query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
          COUNT(CASE WHEN requested_access_level = 'professional' THEN 1 END) as professional,
          COUNT(CASE WHEN requested_access_level = 'personal' THEN 1 END) as personal
         FROM access_requests 
         WHERE request_type = 'access_request'`
      );

      const stats = result.rows[0];
      return {
        total: parseInt(stats.total),
        pending: parseInt(stats.pending),
        approved: parseInt(stats.approved),
        rejected: parseInt(stats.rejected),
        professional: parseInt(stats.professional),
        personal: parseInt(stats.personal)
      };
    } catch (error) {
      console.error('Error fetching request stats:', error);
      throw new Error('Failed to fetch request stats');
    }
  }

  /**
   * Delete access request by ID
   */
  static async deleteById(id: string): Promise<boolean> {
    try {
      const result = await query(
        'DELETE FROM access_requests WHERE id = $1 AND request_type = $2',
        [id, 'access_request']
      );

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting access request:', error);
      throw new Error('Failed to delete access request');
    }
  }
} 