import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { validateContactForm } from '@/lib/utils/form-validation';
import { verifyRecaptchaToken, isRecaptchaValid } from '@/lib/utils/recaptcha-verify';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Auto-responder email template
const getAutoResponderTemplate = (name: string, category: string) => {
  const templates = {
    'general': `
      <h2>Thank you for your message, ${name}!</h2>
      <p>I've received your general inquiry and will get back to you within 24 hours.</p>
      <p>In the meantime, feel free to explore my <a href="${process.env.NEXT_PUBLIC_BASE_URL}/blog">blog</a> or <a href="${process.env.NEXT_PUBLIC_BASE_URL}/projects">projects</a>.</p>
    `,
    'project': `
      <h2>Thank you for your project inquiry, ${name}!</h2>
      <p>I'm excited about the possibility of working together on your project. I'll review your requirements and get back to you within 24 hours with next steps.</p>
      <p>You can also <a href="https://calendly.com/your-link">schedule a call</a> to discuss your project in detail.</p>
    `,
    'collaboration': `
      <h2>Thank you for reaching out, ${name}!</h2>
      <p>I'm always interested in collaboration opportunities. I'll review your proposal and get back to you soon.</p>
      <p>Feel free to connect with me on <a href="https://linkedin.com/in/your-profile">LinkedIn</a> as well.</p>
    `
  };

  return templates[category as keyof typeof templates] || templates.general;
};

// Admin notification email template
const getAdminNotificationTemplate = (formData: any, attachments: string[]) => {
  return `
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
      
      ${attachments.length > 0 ? `
      <div style="margin: 20px 0;">
        <h3 style="color: #1f2937; margin-bottom: 10px;">Attachments:</h3>
        <ul style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 0;">
          ${attachments.map(file => `<li style="color: #1f2937;">${file}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
        <p>Submitted at: ${new Date().toLocaleString()}</p>
        <p>Newsletter subscription: ${formData.newsletter ? 'Yes' : 'No'}</p>
        <p>IP Address: ${formData.ipAddress || 'Unknown'}</p>
      </div>
    </div>
  `;
};

// Rate limiting for contact form submissions
const rateLimit = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 requests per hour
  store: new Map<string, { count: number; resetTime: number }>()
};

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.ip || 'unknown';
    
    // Check rate limit
    const now = Date.now();
    const clientData = rateLimit.store.get(ip);
    
    if (clientData) {
      // Reset if window expired
      if (now > clientData.resetTime) {
        rateLimit.store.set(ip, {
          count: 1,
          resetTime: now + rateLimit.windowMs
        });
      } else if (clientData.count >= rateLimit.maxRequests) {
        // Rate limit exceeded
        return NextResponse.json(
          { 
            success: false, 
            error: 'Rate limit exceeded. Please try again later.' 
          },
          { status: 429 }
        );
      } else {
        // Increment counter
        clientData.count += 1;
      }
    } else {
      // First request from this IP
      rateLimit.store.set(ip, {
        count: 1,
        resetTime: now + rateLimit.windowMs
      });
    }
    
    const formData = await request.formData();
    
    // Extract form data
    const contactData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
      category: formData.get('category') as string,
      company: formData.get('company') as string,
      phone: formData.get('phone') as string,
      timeline: formData.get('timeline') as string,
      budget: formData.get('budget') as string,
      newsletter: formData.get('newsletter') === 'true',
      terms: formData.get('terms') === 'true',
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || '',
    };

    // Basic validation
    if (!contactData.name || !contactData.email || !contactData.subject || !contactData.message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['general', 'project', 'collaboration'];
    if (!validCategories.includes(contactData.category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Handle file attachments
    const attachmentFiles: string[] = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'contact');
    
    // Create upload directory if it doesn't exist
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }

    // Process uploaded files
    const attachmentKeys = Array.from(formData.keys()).filter(key => key.startsWith('attachment_'));
    
    for (const key of attachmentKeys) {
      const file = formData.get(key) as File;
      if (file && file.size > 0) {
        try {
          const fileName = `${uuidv4()}_${file.name}`;
          const filePath = path.join(uploadDir, fileName);
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          await writeFile(filePath, buffer);
          attachmentFiles.push(fileName);
        } catch (error) {
          console.error('Error saving attachment:', error);
        }
      }
    }

    // Send admin notification email
    try {
      const adminEmailHtml = getAdminNotificationTemplate(contactData, attachmentFiles);
      
      const adminMailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        subject: `New Contact Form Submission - ${contactData.category.toUpperCase()}`,
        html: adminEmailHtml,
      };

      await transporter.sendMail(adminMailOptions);
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }

    // Send auto-responder email
    try {
      const autoResponderHtml = getAutoResponderTemplate(contactData.name, contactData.category);
      
      const autoResponderOptions = {
        from: process.env.SMTP_USER,
        to: contactData.email,
        subject: 'Thank you for your message!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${autoResponderHtml}
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
              <p>This is an automated response. Please do not reply to this email.</p>
              <p>If you need immediate assistance, please contact me directly at ${process.env.CONTACT_EMAIL || process.env.SMTP_USER}.</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(autoResponderOptions);
    } catch (error) {
      console.error('Error sending auto-responder:', error);
    }

    // Handle newsletter subscription
    if (contactData.newsletter) {
      try {
        const newsletterResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/newsletter/subscribers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: contactData.email,
            name: contactData.name,
            phone: contactData.phone || null,
            company: contactData.company || null,
            source: 'contact_form',
            metadata: {
              contactCategory: contactData.category,
              contactSubject: contactData.subject,
              submittedAt: new Date().toISOString(),
              ipAddress: ip,
              userAgent: contactData.userAgent
            }
          })
        });

        const newsletterResult = await newsletterResponse.json();
        
        if (!newsletterResult.success) {
          console.error('Newsletter subscription failed:', newsletterResult.error);
          // Don't fail the entire contact form if newsletter subscription fails
        }
      } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        // Don't fail the entire contact form if newsletter subscription fails
      }
    }

    // Store in database (if you have a database setup)
    // await storeContactSubmission(contactData, attachmentFiles);

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully!' + (contactData.newsletter ? ' You have also been subscribed to our newsletter.' : '')
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
