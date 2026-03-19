import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

interface AccessRequestData {
  name: string;
  email: string;
  requestedAccessLevel: 'personal' | 'professional';
  message: string;
}

interface AccessRequestResult {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  request_type: string;
  requested_access_level: string;
  status: string;
  submitted_at: Date;
  processed_at?: Date;
  processed_by?: string;
  admin_notes?: string;
}

export class EnhancedAccessRequestService {
  // Lazy load email service to avoid build-time evaluation
  private _emailService: any = null;
  private async getEmailService() {
    if (!this._emailService) {
      const { EmailNotificationService } = await import('./email-notification-service');
      this._emailService = new EmailNotificationService();
    }
    return this._emailService;
  }

  constructor() {
    // No initialization at build time
  }

  /**
   * Check if user already has an existing request for this access level
   */
  async checkExistingRequest(email: string, accessLevel: string): Promise<AccessRequestResult | null> {
    try {
      const result = await query(
        `SELECT * FROM access_requests 
         WHERE email = $1 AND requested_access_level = $2 AND request_type = 'access_request'
         ORDER BY submitted_at DESC LIMIT 1`,
        [email.toLowerCase().trim(), accessLevel]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error checking existing request:', error);
      return null;
    }
  }

  /**
   * Check if user already has access to this level
   */
  async checkUserAccess(email: string, accessLevel: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT * FROM user_access_levels 
         WHERE email = $1 AND is_active = true`,
        [email.toLowerCase().trim()]
      );

      if (result.rows.length === 0) return false;

      const userAccess = result.rows[0];
      return accessLevel === 'professional' 
        ? userAccess.has_professional_access 
        : userAccess.has_personal_access;
    } catch (error) {
      console.error('Error checking user access:', error);
      return false;
    }
  }

  /**
   * Get filtered access requests
   */
  async getFilteredRequests(
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
   * Get admin user ID by email
   */
  async getAdminUserId(email: string): Promise<string | null> {
    try {
      const result = await query(
        'SELECT id FROM users WHERE email = $1 AND role = $2',
        [email.toLowerCase().trim(), 'admin']
      );
      return result.rows.length > 0 ? result.rows[0].id : null;
    } catch (error) {
      console.error('Error getting admin user ID:', error);
      return null;
    }
  }

  /**
   * Get access request by ID
   */
  async getById(id: string): Promise<AccessRequestResult | null> {
    try {
      const result = await query(
        `SELECT ar.*, u.name as processed_by_name
         FROM access_requests ar
         LEFT JOIN users u ON ar.processed_by = u.id
         WHERE ar.id = $1`,
        [id]
      );

      if (result.rows.length === 0) return null;

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
      return null;
    }
  }

  /**
   * Delete access request by ID
   */
  async deleteById(id: string): Promise<boolean> {
    try {
      const result = await query(
        'DELETE FROM access_requests WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting access request:', error);
      return false;
    }
  }

  /**
   * Check if user is admin
   */
  async isUserAdmin(email: string): Promise<boolean> {
    try {
      const result = await query(
        'SELECT role FROM users WHERE email = $1',
        [email.toLowerCase().trim()]
      );
      return result.rows.length > 0 && result.rows[0].role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Create a new access request with email notifications
   */
  async createWithNotifications(data: AccessRequestData): Promise<AccessRequestResult> {
    try {
      // Create the access request
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

      const newRequest = result.rows[0];

      // Send admin notification email
      try {
        const emailService = await this.getEmailService();
        await emailService.sendAdminNotification({
          requestId: newRequest.id,
          userName: newRequest.name,
          userEmail: newRequest.email,
          accessLevel: newRequest.requested_access_level,
          submittedAt: newRequest.submitted_at,
        });
      } catch (emailError) {
        console.warn('Failed to send admin notification email:', emailError);
        // Don't fail the request creation if email fails
      }

      // Schedule follow-up email (in a real app, you'd use a job queue)
      this.scheduleFollowUpEmail(newRequest);

      return newRequest;
    } catch (error) {
      console.error('Error creating access request:', error);
      throw new Error('Failed to create access request');
    }
  }

  /**
   * Approve access request and create user account automatically
   */
  async approveWithUserCreation(
    requestId: string, 
    adminUserId: string, 
    adminNotes?: string,
    createUserAccount: boolean = true
  ): Promise<{ request: AccessRequestResult; user?: any; generatedPassword?: string }> {
    try {
      // Get the access request details
      const requestResult = await query(
        'SELECT * FROM access_requests WHERE id = $1',
        [requestId]
      );

      if (requestResult.rows.length === 0) {
        throw new Error('Access request not found');
      }

      const request = requestResult.rows[0];

      // Update request status
      const updatedRequest = await query(
        `UPDATE access_requests 
         SET status = $1, processed_at = CURRENT_TIMESTAMP, processed_by = $2, admin_notes = $3
         WHERE id = $4
         RETURNING *`,
        ['approved', adminUserId, adminNotes, requestId]
      );

      const approvedRequest = updatedRequest.rows[0];
      let createdUser: any = null;
      let generatedPassword: string | undefined = undefined;

      // Create user account if requested and doesn't exist
      if (createUserAccount) {
        try {
          const { user, password } = await this.createUserFromRequest(approvedRequest);
          createdUser = user;
          generatedPassword = password;
        } catch (userCreationError) {
          console.warn('Failed to create user account:', userCreationError);
          // Continue with approval even if user creation fails
        }
      }

      // Grant access levels
      await this.grantAccessLevel(
        approvedRequest.email,
        approvedRequest.requested_access_level,
        adminUserId
      );

      // Send approval notification email
      try {
        // Get custom welcome email template and SendGrid settings from site settings
        // Use existing query import (already at top of file)
        const settingsResult = await query(
          `SELECT setting_key, setting_value FROM site_settings 
           WHERE setting_key IN ('accessRequestWelcomeEmailEnabled', 'accessRequestWelcomeEmailSubject', 'accessRequestWelcomeEmailMessage', 'sendgridApiKey', 'sendgridFromEmail')`
        );
        
        const settings: any = {};
        settingsResult.rows.forEach((row: any) => {
          if (row.setting_key === 'accessRequestWelcomeEmailEnabled') {
            settings.enabled = row.setting_value === 'true' || row.setting_value === true;
          } else if (row.setting_key === 'accessRequestWelcomeEmailSubject') {
            settings.subject = row.setting_value;
          } else if (row.setting_key === 'accessRequestWelcomeEmailMessage') {
            settings.message = row.setting_value;
          } else if (row.setting_key === 'sendgridApiKey') {
            settings.apiKey = row.setting_value;
          } else if (row.setting_key === 'sendgridFromEmail') {
            settings.fromEmail = row.setting_value;
          }
        });

        // Only send if enabled (defaults to true if not set)
        if (settings.enabled !== false) {
          // Get SendGrid API key (from settings or environment) - use dynamic env access
          const env = typeof process !== 'undefined' ? process.env : {};
          const apiKey = settings.apiKey || env.SENDGRID_API_KEY;
          const fromEmail = settings.fromEmail || env.FROM_EMAIL || env.ADMIN_EMAIL || 'admin@willworkforlunch.com';
          
          if (apiKey) {
            // Use SendGrid service directly for custom template support (fully lazy import)
            const sendGridModule = await import('./sendgrid-email-service');
            const SendGridEmailService = sendGridModule.SendGridEmailService;
            const sendGridService = SendGridEmailService.getInstance(apiKey, fromEmail);
            
            const customTemplate = settings.subject || settings.message 
              ? { 
                  subject: settings.subject || undefined,
                  message: settings.message || undefined
                }
              : undefined;

            await sendGridService.sendApprovalNotification(
              approvedRequest.email,
              approvedRequest.name,
              approvedRequest.requested_access_level,
              customTemplate
            );
          } else {
            // Fallback to email notification service if SendGrid not configured
            const emailService = await this.getEmailService();
            await emailService.sendApprovalNotification({
              requestId: approvedRequest.id,
              userName: approvedRequest.name,
              userEmail: approvedRequest.email,
              accessLevel: approvedRequest.requested_access_level,
              submittedAt: approvedRequest.submitted_at,
              adminNotes,
              generatedPassword: generatedPassword || undefined,
            });
          }
        }
      } catch (emailError) {
        console.warn('Failed to send approval notification email:', emailError);
      }

      return { 
        request: approvedRequest, 
        user: createdUser, 
        generatedPassword: generatedPassword || undefined
      };
    } catch (error) {
      console.error('Error approving access request:', error);
      throw new Error('Failed to approve access request');
    }
  }

  /**
   * Reject access request with email notification
   */
  async rejectWithNotification(
    requestId: string, 
    adminUserId: string, 
    adminNotes?: string
  ): Promise<AccessRequestResult> {
    try {
      // Get the access request details
      const requestResult = await query(
        'SELECT * FROM access_requests WHERE id = $1',
        [requestId]
      );

      if (requestResult.rows.length === 0) {
        throw new Error('Access request not found');
      }

      const request = requestResult.rows[0];

      // Update request status
      const updatedRequest = await query(
        `UPDATE access_requests 
         SET status = $1, processed_at = CURRENT_TIMESTAMP, processed_by = $2, admin_notes = $3
         WHERE id = $4
         RETURNING *`,
        ['rejected', adminUserId, adminNotes, requestId]
      );

      const rejectedRequest = updatedRequest.rows[0];

      // Send rejection notification email
      try {
        const emailService = await this.getEmailService();
        await emailService.sendRejectionNotification({
          requestId: rejectedRequest.id,
          userName: rejectedRequest.name,
          userEmail: rejectedRequest.email,
          accessLevel: rejectedRequest.requested_access_level,
          submittedAt: rejectedRequest.submitted_at,
          adminNotes,
        });
      } catch (emailError) {
        console.warn('Failed to send rejection notification email:', emailError);
      }

      return rejectedRequest;
    } catch (error) {
      console.error('Error rejecting access request:', error);
      throw new Error('Failed to reject access request');
    }
  }

  /**
   * Create user account from approved access request
   */
  private async createUserFromRequest(request: AccessRequestResult): Promise<{ user: any; password: string }> {
    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [request.email.toLowerCase()]);
    
    if (existingUser.rows.length > 0) {
      throw new Error('User account already exists');
    }

    // Generate secure password
    const generatedPassword = this.generateSecurePassword();

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(generatedPassword, saltRounds);

    // Determine user role based on access level
    const userRole = request.requested_access_level === 'professional' ? 'author' : 'subscriber';

    // Create user account
    const userResult = await query(
      `INSERT INTO users (name, email, password_hash, role, email_verified, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING id, name, email, role, created_at`,
      [request.name.trim(), request.email.toLowerCase(), passwordHash, userRole, true]
    );

    const newUser = userResult.rows[0];

    // Log user creation activity
    try {
      await query(
        `INSERT INTO user_activity_log (user_id, action, description, performed_by, ip_address, created_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [
          newUser.id,
          'user_created',
          `User account auto-created from approved ${request.requested_access_level} access request`,
          'system',
          '127.0.0.1'
        ]
      );
    } catch (activityError) {
      const errorMessage = activityError instanceof Error ? activityError.message : 'Unknown error';
      console.warn('Could not log user activity:', errorMessage);
    }

    return { user: newUser, password: generatedPassword };
  }

  /**
   * Grant access level to user
   */
  private async grantAccessLevel(
    email: string, 
    accessLevel: string, 
    grantedBy: string
  ): Promise<void> {
    // Check if access level record exists
    const existingAccess = await query(
      'SELECT id FROM user_access_levels WHERE email = $1',
      [email.toLowerCase()]
    );

    const hasProfessionalAccess = accessLevel === 'professional';
    const hasPersonalAccess = accessLevel === 'personal';

    if (existingAccess.rows.length > 0) {
      // Update existing record
      await query(
        `UPDATE user_access_levels 
         SET has_professional_access = $1, has_personal_access = $2, 
             granted_at = CURRENT_TIMESTAMP, granted_by = $3, is_active = true,
             notes = $4
         WHERE email = $5`,
        [
          hasProfessionalAccess,
          hasPersonalAccess,
          grantedBy,
          `Access granted through approved access request`,
          email.toLowerCase()
        ]
      );
    } else {
      // Create new record
      await query(
        `INSERT INTO user_access_levels (email, has_professional_access, has_personal_access, granted_at, is_active, notes, granted_by) 
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5, $6)`,
        [
          email.toLowerCase(),
          hasProfessionalAccess,
          hasPersonalAccess,
          true,
          `Access granted through approved access request`,
          grantedBy
        ]
      );
    }
  }

  /**
   * Generate secure password
   */
  private generateSecurePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each category
    const categories = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 
      '0123456789',
      '!@#$%^&*'
    ];
    
    // Add one character from each category
    categories.forEach(category => {
      password += category.charAt(Math.floor(Math.random() * category.length));
    });
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Schedule follow-up email for pending requests
   */
  private scheduleFollowUpEmail(request: AccessRequestResult): void {
    // In a production app, this would use a job queue like Bull or Agenda
    // For now, we'll just log that a follow-up should be scheduled
    console.log(`📅 Follow-up email scheduled for request ${request.id} in 24 hours`);
    
    // TODO: Implement actual job scheduling
    // Example: Queue a job to send follow-up email after 24 hours
  }

  /**
   * Get request statistics
   */
  async getRequestStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    recentRequests: AccessRequestResult[];
  }> {
    try {
      // Get basic counts
      const countResult = await query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
         FROM access_requests 
         WHERE request_type = 'access_request'`
      );

      const counts = countResult.rows[0];

      // Get recent requests
      const recentResult = await query(
        `SELECT ar.*, u.name as processed_by_name
         FROM access_requests ar
         LEFT JOIN users u ON ar.processed_by = u.id
         WHERE ar.request_type = 'access_request'
         ORDER BY ar.submitted_at DESC
         LIMIT 10`
      );

      const recentRequests = recentResult.rows.map(row => ({
        ...row,
        _id: row.id,
        accessLevel: row.requested_access_level,
        submittedAt: row.submitted_at,
        processedAt: row.processed_at,
        processedBy: row.processed_by_name || row.processed_by,
        adminNotes: row.admin_notes
      }));

      return {
        total: parseInt(counts.total),
        pending: parseInt(counts.pending),
        approved: parseInt(counts.approved),
        rejected: parseInt(counts.rejected),
        recentRequests
      };
    } catch (error) {
      console.error('Error getting request statistics:', error);
      throw new Error('Failed to get request statistics');
    }
  }

  /**
   * Bulk approve access requests
   */
  async bulkApprove(
    requestIds: string[], 
    adminUserId: string, 
    adminNotes?: string,
    createUserAccounts: boolean = true
  ): Promise<{ successful: string[]; failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    for (const requestId of requestIds) {
      try {
        await this.approveWithUserCreation(requestId, adminUserId, adminNotes, createUserAccounts);
        successful.push(requestId);
      } catch (error) {
        console.error(`Failed to approve request ${requestId}:`, error);
        failed.push(requestId);
      }
    }

    return { successful, failed };
  }

  /**
   * Bulk reject access requests
   */
  async bulkReject(
    requestIds: string[], 
    adminUserId: string, 
    adminNotes?: string
  ): Promise<{ successful: string[]; failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    for (const requestId of requestIds) {
      try {
        await this.rejectWithNotification(requestId, adminUserId, adminNotes);
        successful.push(requestId);
      } catch (error) {
        console.error(`Failed to reject request ${requestId}:`, error);
        failed.push(requestId);
      }
    }

    return { successful, failed };
  }
} 