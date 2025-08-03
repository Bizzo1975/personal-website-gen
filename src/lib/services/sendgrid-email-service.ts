import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface EmailData {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface AccessRequestEmailData {
  email: string;
  name: string;
  requestType: string;
  message: string;
  requestDate: string;
}

export class SendGridEmailService {
  private static instance: SendGridEmailService;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || process.env.ADMIN_EMAIL || 'admin@willworkforlunch.com';
  }

  public static getInstance(): SendGridEmailService {
    if (!SendGridEmailService.instance) {
      SendGridEmailService.instance = new SendGridEmailService();
    }
    return SendGridEmailService.instance;
  }

  /**
   * Send a generic email using SendGrid
   */
  async sendEmail(emailData: EmailData): Promise<void> {
    try {
      const msg = {
        to: emailData.to,
        from: emailData.from || this.fromEmail,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || this.stripHtml(emailData.html),
      };

      await sgMail.send(msg);
      console.log(`✅ Email sent successfully to ${emailData.to}`);
    } catch (error) {
      console.error('❌ SendGrid email error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  /**
   * Send access request notification to admin
   */
  async sendAccessRequestNotification(requestData: AccessRequestEmailData): Promise<void> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          New Access Request
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Request Details:</h3>
          <p><strong>Name:</strong> ${requestData.name}</p>
          <p><strong>Email:</strong> ${requestData.email}</p>
          <p><strong>Request Type:</strong> ${requestData.requestType}</p>
          <p><strong>Date:</strong> ${requestData.requestDate}</p>
        </div>

        <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px;">
          <h4 style="color: #333; margin-top: 0;">Message:</h4>
          <p style="line-height: 1.6;">${requestData.message}</p>
        </div>

        <div style="margin-top: 30px; padding: 20px; background-color: #e9ecef; border-radius: 5px;">
          <p style="margin: 0;">
            <strong>Action Required:</strong> 
            <a href="${process.env.NEXTAUTH_URL}/admin/access-requests" 
               style="color: #007bff; text-decoration: none; font-weight: bold;">
              Review Access Request →
            </a>
          </p>
        </div>

        <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #666;">
          <p>This is an automated notification from willworkforlunch.com</p>
        </footer>
      </div>
    `;

    await this.sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: `New Access Request from ${requestData.name}`,
      html: htmlContent
    });
  }

  /**
   * Send approval notification to user
   */
  async sendApprovalNotification(userEmail: string, userName: string, accessLevel: string): Promise<void> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px;">
          Access Request Approved! 🎉
        </h2>
        
        <p>Hi ${userName},</p>
        
        <p style="line-height: 1.6;">
          Great news! Your access request has been approved. You now have <strong>${accessLevel}</strong> 
          access to additional content on willworkforlunch.com.
        </p>

        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="color: #155724; margin-top: 0;">What's Next?</h3>
          <ul style="color: #155724; line-height: 1.6;">
            <li>You can now access ${accessLevel === 'professional' ? 'professional portfolio content' : 'personal blog posts and projects'}</li>
            <li>No additional login required - access is based on your email address</li>
            <li>Explore the new content available to you</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Visit Website
          </a>
        </div>

        <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #666;">
          <p>Thank you for your interest in my work!</p>
          <p>Best regards,<br>willworkforlunch.com</p>
        </footer>
      </div>
    `;

    await this.sendEmail({
      to: userEmail,
      subject: `Access Approved - Welcome to ${accessLevel} content!`,
      html: htmlContent
    });
  }

  /**
   * Send contact form notification
   */
  async sendContactFormNotification(formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
    category: string;
  }): Promise<void> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Contact Details:</h3>
          <p><strong>Name:</strong> ${formData.name}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Category:</strong> ${formData.category}</p>
          <p><strong>Subject:</strong> ${formData.subject}</p>
        </div>

        <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px;">
          <h4 style="color: #333; margin-top: 0;">Message:</h4>
          <p style="line-height: 1.6;">${formData.message}</p>
        </div>

        <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
          <p style="margin: 0;"><strong>Reply to:</strong> ${formData.email}</p>
        </div>

        <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #666;">
          <p>This message was sent via the contact form on willworkforlunch.com</p>
        </footer>
      </div>
    `;

    await this.sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: `Contact Form: ${formData.subject}`,
      html: htmlContent
    });
  }

  /**
   * Send auto-responder to contact form submitter
   */
  async sendContactAutoResponse(name: string, email: string, category: string): Promise<void> {
    const responseTemplates = {
      'general': `
        <p>I've received your general inquiry and will get back to you within 24 hours.</p>
        <p>In the meantime, feel free to explore my <a href="${process.env.NEXTAUTH_URL}/blog">blog</a> or <a href="${process.env.NEXTAUTH_URL}/projects">projects</a>.</p>
      `,
      'project': `
        <p>I'm excited about the possibility of working together on your project. I'll review your requirements and get back to you within 24 hours with next steps.</p>
        <p>You can also check out my <a href="${process.env.NEXTAUTH_URL}/projects">portfolio</a> to see examples of my work.</p>
      `,
      'collaboration': `
        <p>I'm always interested in collaboration opportunities. I'll review your proposal and get back to you soon.</p>
        <p>Feel free to connect with me on <a href="https://linkedin.com/in/your-profile">LinkedIn</a> as well.</p>
      `
    };

    const template = responseTemplates[category as keyof typeof responseTemplates] || responseTemplates.general;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          Thank you for your message, ${name}!
        </h2>
        
        ${template}

        <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
          <p style="margin: 0; font-weight: bold;">Quick Links:</p>
          <ul style="margin: 10px 0;">
            <li><a href="${process.env.NEXTAUTH_URL}/blog">Latest Blog Posts</a></li>
            <li><a href="${process.env.NEXTAUTH_URL}/projects">Project Portfolio</a></li>
            <li><a href="${process.env.NEXTAUTH_URL}/about">About Me</a></li>
          </ul>
        </div>

        <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #666;">
          <p>Best regards,<br>willworkforlunch.com</p>
          <p>This is an automated response. I'll reply personally soon!</p>
        </footer>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: `Thank you for contacting willworkforlunch.com`,
      html: htmlContent
    });
  }

  /**
   * Send newsletter email
   */
  async sendNewsletterEmail(subscribers: string[], subject: string, content: string): Promise<void> {
    try {
      const msg = {
        to: subscribers,
        from: this.fromEmail,
        subject: subject,
        html: content,
        text: this.stripHtml(content),
      };

      await sgMail.sendMultiple(msg);
      console.log(`✅ Newsletter sent to ${subscribers.length} subscribers`);
    } catch (error) {
      console.error('❌ SendGrid newsletter error:', error);
      throw new Error(`Failed to send newsletter: ${error}`);
    }
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Test SendGrid configuration
   */
  async testConfiguration(): Promise<boolean> {
    try {
      await this.sendEmail({
        to: process.env.ADMIN_EMAIL!,
        subject: 'SendGrid Test - Configuration Working',
        html: '<p>This is a test email to verify SendGrid configuration is working correctly.</p>'
      });
      return true;
    } catch (error) {
      console.error('SendGrid test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const sendGridEmailService = SendGridEmailService.getInstance(); 