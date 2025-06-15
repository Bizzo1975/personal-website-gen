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
    `,
    'support': `
      <h2>Thank you for contacting support, ${name}!</h2>
      <p>I've received your support request and will investigate the issue promptly. I'll get back to you within 24 hours with a solution or update.</p>
      <p>For urgent issues, you can also reach me directly at ${process.env.CONTACT_EMAIL}.</p>
    `,
    'access-request': `
      <h2>Thank you for your access request, ${name}!</h2>
      <p>I've received your request for platform access. I'll review your application and get back to you within 2-3 business days.</p>
      <p>Please ensure you've provided all necessary information to expedite the review process.</p>
    `
  };

  return templates[category as keyof typeof templates] || templates.general;
};

// Admin notification email template
const getAdminNotificationTemplate = (formData: any, attachments: string[]) => {
  const priorityColors = {
    urgent: '#dc2626',
    high: '#ea580c',
    medium: '#2563eb',
    low: '#16a34a'
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
        New Contact Form Submission
      </h2>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <span style="background: ${priorityColors[formData.priority as keyof typeof priorityColors]}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
            ${formData.priority} Priority
          </span>
          <span style="background: #e5e7eb; color: #374151; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-left: 10px;">
            ${formData.category.replace('-', ' ').toUpperCase()}
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
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Preferred Contact:</td>
            <td style="padding: 8px 0; color: #1f2937;">${formData.preferredContact}</td>
          </tr>
          ${formData.accessLevel ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Access Level:</td>
            <td style="padding: 8px 0; color: #1f2937;">${formData.accessLevel}</td>
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
    
    // Extract form fields
    const contactData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
      priority: formData.get('priority') as string,
      category: formData.get('category') as string,
      accessLevel: formData.get('accessLevel') as string,
      company: formData.get('company') as string,
      phone: formData.get('phone') as string,
      preferredContact: formData.get('preferredContact') as string,
      timeline: formData.get('timeline') as string,
      budget: formData.get('budget') as string,
      newsletter: formData.get('newsletter') === 'true',
      terms: formData.get('terms') === 'true',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      timestamp: new Date().toISOString()
    };

    // Validate required fields
    if (!contactData.name || !contactData.email || !contactData.subject || !contactData.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Handle file attachments
    const attachments: string[] = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'contact');
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.warn('Upload directory already exists or could not be created');
    }

    // Process attachments
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('attachment_') && value instanceof File) {
        const file = value as File;
        const fileExtension = path.extname(file.name);
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);
        
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        await writeFile(filePath, buffer);
        attachments.push(fileName);
      }
    }

    // Send admin notification email
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: adminEmail,
        subject: `[${contactData.priority.toUpperCase()}] New Contact: ${contactData.subject}`,
        html: getAdminNotificationTemplate(contactData, attachments),
        attachments: attachments.map(fileName => ({
          filename: fileName,
          path: path.join(uploadDir, fileName)
        }))
      });
    }

    // Send auto-responder email to user
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: contactData.email,
      subject: `Thank you for contacting me - ${contactData.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${getAutoResponderTemplate(contactData.name, contactData.category)}
          
          <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <h3 style="color: #1f2937; margin-bottom: 15px;">Your Message Summary:</h3>
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${contactData.subject}</p>
            <p style="margin: 5px 0;"><strong>Category:</strong> ${contactData.category.replace('-', ' ')}</p>
            <p style="margin: 5px 0;"><strong>Priority:</strong> ${contactData.priority}</p>
            ${attachments.length > 0 ? `<p style="margin: 5px 0;"><strong>Attachments:</strong> ${attachments.length} file(s)</p>` : ''}
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center;">
            <p>This is an automated response. Please do not reply to this email.</p>
            <p>If you need immediate assistance, please call ${process.env.CONTACT_PHONE || 'our office'} or visit our website.</p>
          </div>
        </div>
      `
    });

    // Log contact submission for analytics
    console.log('Contact form submission:', {
      timestamp: contactData.timestamp,
      category: contactData.category,
      priority: contactData.priority,
      hasAttachments: attachments.length > 0,
      ipAddress: contactData.ipAddress
    });

    // Add to newsletter if requested
    if (contactData.newsletter) {
      // Integrate with your newsletter service (e.g., Mailchimp, ConvertKit)
      console.log('Newsletter subscription requested for:', contactData.email);
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      autoResponderSent: true,
      attachmentsProcessed: attachments.length
    });

  } catch (error) {
    console.error('Contact form error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
