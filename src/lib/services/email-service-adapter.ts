import { sendGridEmailService, EmailData, AccessRequestEmailData } from './sendgrid-email-service';
import { EmailNotificationService } from './email-notification-service';

export type EmailProvider = 'sendgrid' | 'smtp';

/**
 * Email Service Adapter - Handles both SendGrid and SMTP
 * Allows gradual migration from SMTP to SendGrid
 */
export class EmailServiceAdapter {
  private static instance: EmailServiceAdapter;
  private provider: EmailProvider;
  private sendGridService = sendGridEmailService;
  private smtpService = new EmailNotificationService();

  constructor() {
    // Determine which email provider to use based on environment
    this.provider = process.env.EMAIL_PROVIDER as EmailProvider || 
                   (process.env.SENDGRID_API_KEY ? 'sendgrid' : 'smtp');
    
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
        await this.sendGridService.sendAccessRequestNotification(requestData);
      } else {
        // Convert to SMTP format
        await this.smtpService.sendApprovalNotification(requestData);
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
        await this.sendGridService.sendApprovalNotification(userEmail, userName, accessLevel);
      } else {
        // Convert to SMTP format - may need adjustment based on your existing SMTP service
        const requestData = {
          email: userEmail,
          name: userName,
          requestType: accessLevel,
          message: `Access granted for ${accessLevel} level`,
          requestDate: new Date().toISOString()
        };
        await this.smtpService.sendApprovalNotification(requestData);
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
        await this.sendGridService.sendContactFormNotification(formData);
      } else {
        // Use existing SMTP contact form logic
        // This would integrate with your existing contact API logic
        await this.sendGenericEmail({
          to: process.env.ADMIN_EMAIL!,
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
        await this.sendGridService.sendContactAutoResponse(name, email, category);
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
        await this.sendGridService.sendNewsletterEmail(subscribers, subject, content);
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
        await this.sendGridService.sendEmail(emailData);
      } else {
        // Convert to SMTP service format
        await this.smtpService.sendEmail(
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
        return await this.sendGridService.testConfiguration();
      } else {
        // Test SMTP configuration
        await this.sendGenericEmail({
          to: process.env.ADMIN_EMAIL!,
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
  private async sendWithFallback(type: string, data: any, primaryError: any): Promise<void> {
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
        throw new Error(`Both email providers failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
      }
    } else {
      throw primaryError;
    }
  }

  /**
   * Check if a provider is properly configured
   */
  private isProviderConfigured(provider: EmailProvider): boolean {
    if (provider === 'sendgrid') {
      return !!process.env.SENDGRID_API_KEY;
    } else {
      return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
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

// Export singleton instance
export const emailService = EmailServiceAdapter.getInstance(); 