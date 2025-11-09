import nodemailer from 'nodemailer';

interface AccessRequestEmailData {
  requestId: string;
  userName: string;
  userEmail: string;
  accessLevel: 'personal' | 'professional';
  submittedAt: Date;
  adminNotes?: string;
  generatedPassword?: string;
}

export class EmailNotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });
  }

  /**
   * Send notification to admin when new access request is submitted
   */
  async sendAdminNotification(requestData: AccessRequestEmailData): Promise<void> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🔔 New Access Request</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">A new access request requires your attention</p>
          </div>
          
          <div style="background: white; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px; padding: 30px;">
            <div style="margin-bottom: 25px;">
              <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Request Details</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555; width: 140px;">Requester:</td>
                  <td style="padding: 8px 0; color: #333;">${requestData.userName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                  <td style="padding: 8px 0; color: #333;">${requestData.userEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Access Level:</td>
                  <td style="padding: 8px 0;">
                    <span style="background: ${requestData.accessLevel === 'professional' ? '#8b5cf6' : '#3b82f6'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; text-transform: capitalize;">
                      ${requestData.accessLevel}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Submitted:</td>
                  <td style="padding: 8px 0; color: #333;">${requestData.submittedAt.toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/admin/access-requests" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: bold; display: inline-block;">
                📋 Review Request
              </a>
            </div>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: adminEmail,
        subject: `🔔 New ${requestData.accessLevel} Access Request - ${requestData.userName}`,
        html: htmlContent,
      });

      console.log(`✅ Admin notification sent for request ${requestData.requestId}`);
    } catch (error) {
      console.error('❌ Failed to send admin notification:', error);
      throw new Error('Failed to send admin notification email');
    }
  }

  /**
   * Send approval notification to user
   */
  async sendApprovalNotification(requestData: AccessRequestEmailData): Promise<void> {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🎉 Access Request Approved!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your ${requestData.accessLevel} access has been granted</p>
          </div>
          
          <div style="background: white; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px; padding: 30px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Hi ${requestData.userName},
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Great news! Your <strong>${requestData.accessLevel} access</strong> request has been approved. 
              You now have access to the platform with enhanced features and content.
            </p>
            
            ${requestData.generatedPassword ? `
              <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #92400e;">🔑 Your Account Credentials</h3>
                <p style="margin: 0 0 10px 0; color: #92400e;"><strong>Email:</strong> ${requestData.userEmail}</p>
                <p style="margin: 0 0 15px 0; color: #92400e;"><strong>Temporary Password:</strong> 
                  <span style="background: white; padding: 4px 8px; border-radius: 4px; font-family: monospace; border: 1px solid #fbbf24;">
                    ${requestData.generatedPassword}
                  </span>
                </p>
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  ⚠️ Please change your password after your first login for security.
                </p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/auth/signin" 
                 style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: bold; display: inline-block;">
                🚀 Access Your Account
              </a>
            </div>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: requestData.userEmail,
        subject: `🎉 Access Approved - Welcome to ${requestData.accessLevel.charAt(0).toUpperCase() + requestData.accessLevel.slice(1)} Access!`,
        html: htmlContent,
      });

      console.log(`✅ Approval notification sent to ${requestData.userEmail}`);
    } catch (error) {
      console.error('❌ Failed to send approval notification:', error);
      throw new Error('Failed to send approval notification email');
    }
  }

  /**
   * Send rejection notification to user
   */
  async sendRejectionNotification(requestData: AccessRequestEmailData): Promise<void> {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">📋 Access Request Update</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Regarding your ${requestData.accessLevel} access request</p>
          </div>
          
          <div style="background: white; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px; padding: 30px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Hi ${requestData.userName},
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for your interest in ${requestData.accessLevel} access to our platform. 
              After careful review, we're unable to approve your request at this time.
            </p>
            
            ${requestData.adminNotes ? `
              <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #991b1b;">📝 Feedback from our team:</h3>
                <p style="margin: 0; color: #7f1d1d; font-style: italic;">"${requestData.adminNotes}"</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/contact" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: bold; display: inline-block;">
                💬 Contact Us
              </a>
            </div>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: requestData.userEmail,
        subject: `📋 Access Request Update - ${requestData.accessLevel.charAt(0).toUpperCase() + requestData.accessLevel.slice(1)} Access`,
        html: htmlContent,
      });

      console.log(`✅ Rejection notification sent to ${requestData.userEmail}`);
    } catch (error) {
      console.error('❌ Failed to send rejection notification:', error);
      throw new Error('Failed to send rejection notification email');
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: to,
        subject: subject,
        html: html,
      });

      console.log(`✅ Email sent successfully to ${to}`);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }
} 