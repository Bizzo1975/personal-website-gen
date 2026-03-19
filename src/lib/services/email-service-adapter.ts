// Lazy import SendGrid to avoid loading during build
// Define types locally to prevent build-time analysis of sendgrid-email-service

// Local type definitions to avoid importing from sendgrid-email-service at build time
export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
}

export interface AccessRequestEmailData {
  name: string;
  email: string;
  message: string;
  requestType?: 'personal' | 'professional';
  requestDate?: string;
}

export type EmailProvider = 'sendgrid' | 'smtp';

/**
 * Email Service Adapter - Handles both SendGrid and SMTP
 * Allows gradual migration from SMTP to SendGrid
 */
export class EmailServiceAdapter {
  private static instance: EmailServiceAdapter;
  private provider: EmailProvider;
  private getSendGridService = async () => {
    const { SendGridEmailService } = await import('./sendgrid-email-service');
    return SendGridEmailService.getInstance();
  };
  // Lazy load SMTP service to avoid build-time evaluation
  private _smtpService: any = null;
  private async getSmtpService() {
    if (!this._smtpService) {
      const { EmailNotificationService } = await import('./email-notification-service');
      this._smtpService = new EmailNotificationService();
    }
    return this._smtpService;
  }

  constructor() {
    // Determine which email provider to use based on environment
    // Use safe runtime check to avoid build-time evaluation
    const env = typeof process !== 'undefined' ? process.env : {};
    this.provider = (env.EMAIL_PROVIDER as EmailProvider) || 
                   (env.SENDGRID_API_KEY ? 'sendgrid' : 'smtp');
    
    console.log(`📧 Email Service: Using ${this.provider.toUpperCase()} provider`);
  }

  public static getInstance(): EmailServiceAdapter {
    if (!EmailServiceAdapter.instance) {
      EmailServiceAdapter.instance = new EmailServiceAdapter();
    }
    return EmailServiceAdapter.instance;
  }

  /**
   * Send access request notification to admin
   */
  async sendAccessRequestNotification(requestData: AccessRequestEmailData): Promise<void> {
    try {
      if (this.provider === 'sendgrid') {
        const sendGridService = await this.getSendGridService();
        await sendGridService.sendAccessRequestNotification(requestData);
      } else {
        // Convert to SMTP format - AccessRequestEmailData from sendgrid has different structure
        const smtpRequestData = {
          requestId: requestData.requestDate || Date.now().toString(),
          userName: requestData.name,
          userEmail: requestData.email,
          accessLevel: (requestData.requestType === 'professional' ? 'professional' : 'personal') as 'personal' | 'professional',
          submittedAt: new Date(requestData.requestDate || Date.now()),
          adminNotes: requestData.message
        };
        const smtpService = await this.getSmtpService();
        await smtpService.sendAdminNotification(smtpRequestData);
      }
    } catch (error) {
      console.error(`❌ Failed to send access request notification via ${this.provider}:`, error);
      // Fallback to other provider if available
      await this.sendWithFallback('access-request', requestData, error);
    }
  }

  /**
   * Send approval notification to user
   */
  async sendApprovalNotification(userEmail: string, userName: string, accessLevel: string): Promise<void> {
    try {
      if (this.provider === 'sendgrid') {
        const sendGridService = await this.getSendGridService();
        await sendGridService.sendApprovalNotification(userEmail, userName, accessLevel);
      } else {
        // Convert to SMTP format - AccessRequestEmailData structure
        const requestData = {
          requestId: Date.now().toString(),
          userName: userName,
          userEmail: userEmail,
          accessLevel: (accessLevel === 'professional' ? 'professional' : 'personal') as 'personal' | 'professional',
          submittedAt: new Date(),
          adminNotes: `Access granted for ${accessLevel} level`
        };
        const smtpService = await this.getSmtpService();
        await smtpService.sendApprovalNotification(requestData);
      }
    } catch (error) {
      console.error(`❌ Failed to send approval notification via ${this.provider}:`, error);
      throw error;
    }
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
    try {
      if (this.provider === 'sendgrid') {
        const sendGridService = await this.getSendGridService();
        await sendGridService.sendContactFormNotification(formData);
      } else {
        // Use existing SMTP contact form logic
        // This would integrate with your existing contact API logic
        const env = typeof process !== 'undefined' ? process.env : {};
        await this.sendGenericEmail({
          to: env.ADMIN_EMAIL || 'admin@willworkforlunch.com',
          subject: `Contact Form: ${formData.subject}`,
          html: this.generateContactFormHtml(formData)
        });
      }
    } catch (error) {
      console.error(`❌ Failed to send contact form notification via ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Send auto-response to contact form submitter
   */
  async sendContactAutoResponse(name: string, email: string, category: string): Promise<void> {
    try {
      if (this.provider === 'sendgrid') {
        const sendGridService = await this.getSendGridService();
        await sendGridService.sendContactAutoResponse(name, email, category);
      } else {
        await this.sendGenericEmail({
          to: email,
          subject: `Thank you for contacting willworkforlunch.com`,
          html: this.generateAutoResponseHtml(name, category)
        });
      }
    } catch (error) {
      console.error(`❌ Failed to send auto-response via ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Send newsletter to multiple subscribers
   */
  async sendNewsletterEmail(subscribers: string[], subject: string, content: string): Promise<void> {
    try {
      if (this.provider === 'sendgrid') {
        const sendGridService = await this.getSendGridService();
        await sendGridService.sendNewsletterEmail(subscribers, subject, content);
      } else {
        // Send individual emails via SMTP (less efficient but works)
        for (const subscriber of subscribers) {
          await this.sendGenericEmail({
            to: subscriber,
            subject: subject,
            html: content
          });
        }
      }
    } catch (error) {
      console.error(`❌ Failed to send newsletter via ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Send generic email
   */
  async sendGenericEmail(emailData: EmailData): Promise<void> {
    try {
      if (this.provider === 'sendgrid') {
        const sendGridService = await this.getSendGridService();
        await sendGridService.sendEmail(emailData);
      } else {
        // Convert to SMTP service format
        const smtpService = await this.getSmtpService();
        await smtpService.sendEmail(
          emailData.to,
          emailData.subject,
          emailData.html
        );
      }
    } catch (error) {
      console.error(`❌ Failed to send generic email via ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<boolean> {
    try {
      if (this.provider === 'sendgrid') {
        const sendGridService = await this.getSendGridService();
        return await sendGridService.testConfiguration();
      } else {
        // Test SMTP configuration
        const env = typeof process !== 'undefined' ? process.env : {};
        await this.sendGenericEmail({
          to: env.ADMIN_EMAIL || 'admin@willworkforlunch.com',
          subject: 'SMTP Test - Configuration Working',
          html: '<p>This is a test email to verify SMTP configuration is working correctly.</p>'
        });
        return true;
      }
    } catch (error) {
      console.error(`Email configuration test failed for ${this.provider}:`, error);
      return false;
    }
  }

  /**
   * Get current email provider
   */
  getCurrentProvider(): EmailProvider {
    return this.provider;
  }

  /**
   * Switch email provider (useful for testing)
   */
  switchProvider(provider: EmailProvider): void {
    this.provider = provider;
    console.log(`📧 Switched email provider to: ${provider.toUpperCase()}`);
  }

  /**
   * Fallback mechanism when primary provider fails
   */
  private async sendWithFallback(type: string, data: any, primaryError: unknown): Promise<void> {
    const fallbackProvider = this.provider === 'sendgrid' ? 'smtp' : 'sendgrid';
    
    // Only attempt fallback if both providers are configured
    if (this.isProviderConfigured(fallbackProvider)) {
      console.log(`🔄 Attempting fallback to ${fallbackProvider.toUpperCase()} for ${type}`);
      
      try {
        this.switchProvider(fallbackProvider);
        
        // Retry the same operation with fallback provider
        if (type === 'access-request') {
          await this.sendAccessRequestNotification(data);
        }
        
        console.log(`✅ Fallback to ${fallbackProvider.toUpperCase()} successful`);
      } catch (fallbackError) {
        console.error(`❌ Fallback to ${fallbackProvider.toUpperCase()} also failed:`, fallbackError);
        const primaryMessage = primaryError instanceof Error ? primaryError.message : 'Unknown error';
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        throw new Error(`Both email providers failed. Primary: ${primaryMessage}, Fallback: ${fallbackMessage}`);
      }
    } else {
      throw primaryError instanceof Error ? primaryError : new Error(String(primaryError));
    }
  }

  /**
   * Check if a provider is properly configured
   */
  private isProviderConfigured(provider: EmailProvider): boolean {
    const env = typeof process !== 'undefined' ? process.env : {};
    if (provider === 'sendgrid') {
      return !!env.SENDGRID_API_KEY;
    } else {
      return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
    }
  }

  /**
   * Generate contact form HTML (for SMTP fallback)
   */
  private generateContactFormHtml(formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
    category: string;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Category:</strong> ${formData.category}</p>
        <p><strong>Subject:</strong> ${formData.subject}</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5;">
          <h3>Message:</h3>
          <p>${formData.message}</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate auto-response HTML (for SMTP fallback)
   */
  private generateAutoResponseHtml(name: string, category: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for your message, ${name}!</h2>
        <p>I've received your ${category} inquiry and will get back to you within 24 hours.</p>
        <p>Best regards,<br>willworkforlunch.com</p>
      </div>
    `;
  }
}

// Export getter function instead of instance to avoid loading during build
export const getEmailService = () => EmailServiceAdapter.getInstance();

// For backward compatibility (but should be avoided - use getEmailService() instead)
export const emailService = {
  getInstance: () => EmailServiceAdapter.getInstance()
}; 