// Lazy import SendGrid to avoid loading during build
let sgMail: any = null;

const getSendGridMail = async () => {
  if (!sgMail) {
    sgMail = (await import('@sendgrid/mail')).default;
  }
  return sgMail;
};

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
  private apiKey: string | null = null;

  constructor(apiKey?: string, fromEmail?: string) {
    // Use safe runtime check to avoid build-time evaluation
    const env = typeof process !== 'undefined' ? process.env : {};
    this.apiKey = apiKey || env.SENDGRID_API_KEY || null;
    this.fromEmail = fromEmail || env.FROM_EMAIL || env.ADMIN_EMAIL || 'admin@willworkforlunch.com';
    // API key will be set when first used (lazy initialization)
  }

  public static getInstance(apiKey?: string, fromEmail?: string): SendGridEmailService {
    if (!SendGridEmailService.instance) {
      SendGridEmailService.instance = new SendGridEmailService(apiKey, fromEmail);
    } else if (apiKey) {
      // Update API key if provided and instance exists (will be set when first used)
      SendGridEmailService.instance.apiKey = apiKey;
      if (fromEmail) {
        SendGridEmailService.instance.setFromEmail(fromEmail);
      }
    }
    return SendGridEmailService.instance;
  }

  /**
   * Set API key dynamically
   */
  public async setApiKey(apiKey: string): Promise<void> {
    this.apiKey = apiKey;
    const mail = await getSendGridMail();
    mail.setApiKey(apiKey);
  }

  /**
   * Set from email dynamically
   */
  public setFromEmail(fromEmail: string): void {
    this.fromEmail = fromEmail;
  }

  /**
   * Send a generic email using SendGrid
   */
  async sendEmail(emailData: EmailData): Promise<void> {
    try {
      const mail = await getSendGridMail();
      
      // Ensure API key is set
      if (this.apiKey) {
        mail.setApiKey(this.apiKey);
      }
      
      const msg = {
        to: emailData.to,
        from: emailData.from || this.fromEmail,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || this.stripHtml(emailData.html),
      };

      await mail.send(msg);
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
    // Safe access to process.env to avoid build-time evaluation
    const env = typeof process !== 'undefined' ? process.env : {};
    const websiteUrl = env.NEXTAUTH_URL || 'https://www.willworkforlunch.com';
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
            <a href="${websiteUrl}/admin/access-requests" 
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
      to: env.ADMIN_EMAIL || 'admin@willworkforlunch.com',
      subject: `New Access Request from ${requestData.name}`,
      html: htmlContent
    });
  }

  /**
   * Send approval notification to user
   */
  async sendApprovalNotification(userEmail: string, userName: string, accessLevel: string, customTemplate?: { subject?: string; message?: string }): Promise<void> {
    // Safe access to process.env to avoid build-time evaluation
    const env = typeof process !== 'undefined' ? process.env : {};
    const websiteUrl = env.NEXTAUTH_URL || 'https://www.willworkforlunch.com';
    
    // Default template
    let htmlContent = `
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
          <a href="${websiteUrl}" 
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

    // Use custom template if provided
    if (customTemplate?.message) {
      htmlContent = customTemplate.message
        .replace(/\{userName\}/g, userName)
        .replace(/\{accessLevel\}/g, accessLevel)
        .replace(/\{websiteUrl\}/g, websiteUrl);
    }

    let subject = `Access Approved - Welcome to ${accessLevel} content!`;
    if (customTemplate?.subject) {
      subject = customTemplate.subject
        .replace(/\{userName\}/g, userName)
        .replace(/\{accessLevel\}/g, accessLevel)
        .replace(/\{websiteUrl\}/g, websiteUrl);
    }

    await this.sendEmail({
      to: userEmail,
      subject: subject,
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
    company?: string;
    phone?: string;
    timeline?: string;
    budget?: string;
    attachments?: string[];
  }, adminEmail?: string): Promise<void> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <span style="background: #2563eb; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
              ${formData.category.replace('-', ' ')}
            </span>
          </div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 30%;">Name:</td>
              <td style="padding: 8px 0; color: #1f2937;">${formData.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
              <td style="padding: 8px 0; color: #1f2937;">${formData.email}</td>
            </tr>
            ${formData.company ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Company:</td>
              <td style="padding: 8px 0; color: #1f2937;">${formData.company}</td>
            </tr>
            ` : ''}
            ${formData.phone ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Phone:</td>
              <td style="padding: 8px 0; color: #1f2937;">${formData.phone}</td>
            </tr>
            ` : ''}
            ${formData.timeline ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Timeline:</td>
              <td style="padding: 8px 0; color: #1f2937;">${formData.timeline}</td>
            </tr>
            ` : ''}
            ${formData.budget ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Budget:</td>
              <td style="padding: 8px 0; color: #1f2937;">${formData.budget}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #1f2937; margin-bottom: 10px;">Subject:</h3>
          <p style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 0; color: #1f2937;">
            ${formData.subject}
          </p>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #1f2937; margin-bottom: 10px;">Message:</h3>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; color: #1f2937; white-space: pre-wrap;">
            ${formData.message}
          </div>
        </div>
        
        ${formData.attachments && formData.attachments.length > 0 ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #1f2937; margin-bottom: 10px;">Attachments:</h3>
          <ul style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 0;">
            ${formData.attachments.map(file => `<li style="color: #1f2937;">${file}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>Submitted at: ${new Date().toLocaleString()}</p>
          <p>Reply to: ${formData.email}</p>
        </div>
      </div>
    `;

    const env = typeof process !== 'undefined' ? process.env : {};
    await this.sendEmail({
      to: adminEmail || env.ADMIN_EMAIL || 'admin@willworkforlunch.com',
      subject: `New Contact Form Submission - ${formData.category.toUpperCase()}`,
      html: htmlContent
    });
  }

  /**
   * Send auto-responder to contact form submitter
   */
  async sendContactAutoResponse(name: string, email: string, category: string): Promise<void> {
    // Safe access to process.env to avoid build-time evaluation
    const env = typeof process !== 'undefined' ? process.env : {};
    const websiteUrl = env.NEXTAUTH_URL || 'https://www.willworkforlunch.com';
    
    const responseTemplates = {
      'general': `
        <p>I've received your general inquiry and will get back to you within 24 hours.</p>
        <p>In the meantime, feel free to explore my <a href="${websiteUrl}/blog">blog</a> or <a href="${websiteUrl}/projects">projects</a>.</p>
      `,
      'project': `
        <p>I'm excited about the possibility of working together on your project. I'll review your requirements and get back to you within 24 hours with next steps.</p>
        <p>You can also check out my <a href="${websiteUrl}/projects">portfolio</a> to see examples of my work.</p>
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
            <li><a href="${websiteUrl}/blog">Latest Blog Posts</a></li>
            <li><a href="${websiteUrl}/projects">Project Portfolio</a></li>
            <li><a href="${websiteUrl}/about">About Me</a></li>
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

      const mail = await getSendGridMail();
      
      // Ensure API key is set
      if (this.apiKey) {
        mail.setApiKey(this.apiKey);
      }
      
      await mail.sendMultiple(msg);
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
      const env = typeof process !== 'undefined' ? process.env : {};
      await this.sendEmail({
        to: env.ADMIN_EMAIL || 'admin@willworkforlunch.com',
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

// Export getter function instead of instance to avoid loading during build
export const getSendGridEmailService = () => SendGridEmailService.getInstance();

// For backward compatibility, but this should be avoided
// Use getSendGridEmailService() or SendGridEmailService.getInstance() directly
export const sendGridEmailService = {
  getInstance: () => SendGridEmailService.getInstance()
}; 