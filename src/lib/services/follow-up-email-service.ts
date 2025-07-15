import { EmailNotificationService } from './email-notification-service';
import { query } from '@/lib/db';

interface PendingRequest {
  id: string;
  name: string;
  email: string;
  requested_access_level: string;
  submitted_at: Date;
  message: string;
}

export class FollowUpEmailService {
  private emailService: EmailNotificationService;

  constructor() {
    this.emailService = new EmailNotificationService();
  }

  /**
   * Send follow-up email to users with pending requests
   */
  async sendFollowUpEmails(): Promise<{ sent: number; failed: number }> {
    try {
      // Get requests that are pending for more than 24 hours
      const pendingRequests = await this.getPendingRequestsForFollowUp();
      
      let sent = 0;
      let failed = 0;

      for (const request of pendingRequests) {
        try {
          await this.sendFollowUpEmail(request);
          sent++;
        } catch (error) {
          console.error(`Failed to send follow-up email to ${request.email}:`, error);
          failed++;
        }
      }

      console.log(`📧 Follow-up emails sent: ${sent} successful, ${failed} failed`);
      return { sent, failed };
    } catch (error) {
      console.error('Error sending follow-up emails:', error);
      throw new Error('Failed to send follow-up emails');
    }
  }

  /**
   * Get pending requests that need follow-up emails
   */
  private async getPendingRequestsForFollowUp(): Promise<PendingRequest[]> {
    try {
      // Get requests that are pending for more than 24 hours
      const result = await query(
        `SELECT id, name, email, requested_access_level, submitted_at, message
         FROM access_requests 
         WHERE status = 'pending' 
         AND request_type = 'access_request'
         AND submitted_at < NOW() - INTERVAL '24 hours'
         AND submitted_at > NOW() - INTERVAL '72 hours'`, // Don't spam after 72 hours
        []
      );

      return result.rows;
    } catch (error) {
      console.error('Error fetching pending requests for follow-up:', error);
      return [];
    }
  }

  /**
   * Send individual follow-up email
   */
  private async sendFollowUpEmail(request: PendingRequest): Promise<void> {
    const transporter = this.emailService['transporter']; // Access private transporter
    
    const daysSinceSubmission = Math.floor(
      (Date.now() - new Date(request.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⏰ Access Request Update</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">We're still reviewing your ${request.requested_access_level} access request</p>
        </div>
        
        <div style="background: white; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px; padding: 30px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${request.name},
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for your patience! We wanted to give you a quick update on your 
            <strong>${request.requested_access_level} access</strong> request that you submitted 
            ${daysSinceSubmission} day${daysSinceSubmission > 1 ? 's' : ''} ago.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #495057;">📋 Request Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; width: 140px;">Access Level:</td>
                <td style="padding: 8px 0; color: #333;">${request.requested_access_level}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Submitted:</td>
                <td style="padding: 8px 0; color: #333;">${new Date(request.submitted_at).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Status:</td>
                <td style="padding: 8px 0;">
                  <span style="background: #fbbf24; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                    Under Review
                  </span>
                </td>
              </tr>
            </table>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
            Our team is actively reviewing your request and will get back to you as soon as possible. 
            We appreciate your interest in joining our platform!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/request-status?email=${encodeURIComponent(request.email)}" 
               style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: bold; display: inline-block;">
              📊 Check Request Status
            </a>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #1565c0; font-size: 14px;">
              💬 <strong>Need Help?</strong> If you have any questions about your request, 
              feel free to <a href="${process.env.NEXTAUTH_URL}/contact" style="color: #1565c0;">contact us</a>.
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: request.email,
      subject: `⏰ Access Request Update - Still Under Review`,
      html: htmlContent,
    });

    console.log(`📧 Follow-up email sent to ${request.email}`);
  }

  /**
   * Send welcome email reminder for approved requests without account creation
   */
  async sendApprovedButNoAccountFollowUp(): Promise<{ sent: number; failed: number }> {
    try {
      // Get approved requests where user hasn't signed up yet
      const approvedRequests = await this.getApprovedRequestsWithoutAccounts();
      
      let sent = 0;
      let failed = 0;

      for (const request of approvedRequests) {
        try {
          await this.sendWelcomeReminderEmail(request);
          sent++;
        } catch (error) {
          console.error(`Failed to send welcome reminder to ${request.email}:`, error);
          failed++;
        }
      }

      console.log(`📧 Welcome reminder emails sent: ${sent} successful, ${failed} failed`);
      return { sent, failed };
    } catch (error) {
      console.error('Error sending welcome reminder emails:', error);
      throw new Error('Failed to send welcome reminder emails');
    }
  }

  /**
   * Get approved requests where user hasn't created an account yet
   */
  private async getApprovedRequestsWithoutAccounts(): Promise<PendingRequest[]> {
    try {
      const result = await query(
        `SELECT ar.id, ar.name, ar.email, ar.requested_access_level, ar.submitted_at, ar.message
         FROM access_requests ar
         LEFT JOIN users u ON ar.email = u.email
         WHERE ar.status = 'approved' 
         AND ar.request_type = 'access_request'
         AND u.id IS NULL
         AND ar.processed_at > NOW() - INTERVAL '7 days'`, // Only recent approvals
        []
      );

      return result.rows;
    } catch (error) {
      console.error('Error fetching approved requests without accounts:', error);
      return [];
    }
  }

  /**
   * Send welcome reminder email for approved users who haven't signed up
   */
  private async sendWelcomeReminderEmail(request: PendingRequest): Promise<void> {
    const transporter = this.emailService['transporter'];
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🎉 Welcome Reminder!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your access was approved - ready to get started?</p>
        </div>
        
        <div style="background: white; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px; padding: 30px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${request.name},
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Great news! Your <strong>${request.requested_access_level} access</strong> request was approved, 
            but we noticed you haven't signed up for your account yet.
          </p>
          
          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #92400e;">🚀 Ready to Get Started?</h3>
            <p style="margin: 0; color: #92400e;">
              You can now access all the features and content available with your 
              ${request.requested_access_level} access level.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/auth/signup" 
               style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: bold; display: inline-block;">
              🎯 Create Your Account
            </a>
          </div>
          
          <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #0277bd; font-size: 14px;">
              💡 <strong>Already have an account?</strong> 
              <a href="${process.env.NEXTAUTH_URL}/auth/signin" style="color: #0277bd;">Sign in here</a>
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: request.email,
      subject: `🎉 Welcome Reminder - Your Access is Ready!`,
      html: htmlContent,
    });

    console.log(`📧 Welcome reminder email sent to ${request.email}`);
  }

  /**
   * Schedule follow-up emails (this would typically be run as a cron job)
   */
  async scheduleFollowUpEmails(): Promise<void> {
    console.log('📅 Scheduling follow-up emails for pending requests...');
    
    try {
      const pendingResults = await this.sendFollowUpEmails();
      const welcomeResults = await this.sendApprovedButNoAccountFollowUp();
      
      console.log('📊 Follow-up email summary:', {
        pendingFollowUps: pendingResults,
        welcomeReminders: welcomeResults,
        totalSent: pendingResults.sent + welcomeResults.sent,
        totalFailed: pendingResults.failed + welcomeResults.failed
      });
    } catch (error) {
      console.error('Error in scheduled follow-up emails:', error);
    }
  }
} 