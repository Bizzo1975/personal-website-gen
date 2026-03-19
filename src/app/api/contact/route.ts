import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { validateContactForm } from '@/lib/utils/form-validation';
import { verifyRecaptchaToken, isRecaptchaValid } from '@/lib/utils/recaptcha-verify';
import { query } from '@/lib/db';

/**
 * Get SendGrid settings from database
 */
async function getSendGridSettings() {
  try {
    // Fetch all site settings and filter for SendGrid-related ones
    // This avoids SQL IN clause issues and is consistent with other queries
    const result = await query('SELECT setting_key, setting_value FROM site_settings');
    
    const settings: any = {};
    const sendGridKeys = ['sendgridApiKey', 'sendgridFromEmail', 'sendgridFromName', 'sendgridReplyTo'];
    
    result.rows.forEach(row => {
      if (sendGridKeys.includes(row.setting_key)) {
        try {
          // Try to parse as JSON first (for complex values)
          const parsed = JSON.parse(row.setting_value);
          settings[row.setting_key] = parsed;
        } catch {
          // If not JSON, use as string (for simple values like API keys)
          settings[row.setting_key] = row.setting_value;
        }
        console.log(`📧 Found SendGrid setting: ${row.setting_key} = ${row.setting_key === 'sendgridApiKey' ? '***HIDDEN***' : settings[row.setting_key]}`);
      }
    });
    
    console.log('📧 All SendGrid settings found:', Object.keys(settings));
    
    const apiKey = settings.sendgridApiKey || process.env.SENDGRID_API_KEY || null;
    const fromEmail = settings.sendgridFromEmail || process.env.FROM_EMAIL || process.env.ADMIN_EMAIL || 'admin@willworkforlunch.com';
    
    // Safe logging - only log if apiKey exists and is long enough
    const apiKeyDisplay = apiKey && typeof apiKey === 'string' && apiKey.length > 9
      ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`
      : (apiKey ? 'SET' : 'NOT SET');
    
    console.log('📧 SendGrid settings loaded:', {
      apiKey: apiKeyDisplay,
      fromEmail,
      fromName: settings.sendgridFromName || 'willworkforlunch.com',
      source: settings.sendgridApiKey ? 'database' : (process.env.SENDGRID_API_KEY ? 'environment' : 'none')
    });
    
    return {
      apiKey,
      fromEmail,
      fromName: settings.sendgridFromName || 'willworkforlunch.com',
      replyTo: settings.sendgridReplyTo || settings.sendgridFromEmail || process.env.ADMIN_EMAIL || 'admin@willworkforlunch.com',
    };
  } catch (error) {
    console.error('❌ Error fetching SendGrid settings:', error);
    const fallbackKey = process.env.SENDGRID_API_KEY || null;
    console.log('⚠️ Using fallback SendGrid settings from environment:', {
      apiKey: fallbackKey ? 'SET' : 'NOT SET'
    });
    return {
      apiKey: fallbackKey,
      fromEmail: process.env.FROM_EMAIL || process.env.ADMIN_EMAIL || 'admin@willworkforlunch.com',
      fromName: 'willworkforlunch.com',
      replyTo: process.env.ADMIN_EMAIL || 'admin@willworkforlunch.com',
    };
  }
}


// Rate limiting for contact form submissions
const rateLimit = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 requests per hour (increased from 5 for testing)
  store: new Map<string, { count: number; resetTime: number }>()
};

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
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
        const minutesUntilReset = Math.ceil((clientData.resetTime - now) / (60 * 1000));
        console.warn('⚠️ Rate limit exceeded for IP:', ip, `(${clientData.count}/${rateLimit.maxRequests} requests)`);
        return NextResponse.json(
          { 
            success: false, 
            error: `Too many requests. Please wait ${minutesUntilReset} minute${minutesUntilReset !== 1 ? 's' : ''} before submitting again. Maximum ${rateLimit.maxRequests} requests per hour.` 
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
    
    // Extract form data with proper type handling
    const contactData = {
      name: (formData.get('name') as string)?.trim() || '',
      email: (formData.get('email') as string)?.trim() || '',
      subject: (formData.get('subject') as string)?.trim() || '',
      message: (formData.get('message') as string)?.trim() || '',
      category: (formData.get('category') as string)?.trim() || '',
      company: (formData.get('company') as string)?.trim() || '',
      phone: (formData.get('phone') as string)?.trim() || '',
      timeline: (formData.get('timeline') as string)?.trim() || '',
      budget: (formData.get('budget') as string)?.trim() || '',
      newsletter: formData.get('newsletter') === 'true',
      terms: formData.get('terms') === 'true',
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || '',
    };
    
    console.log('📧 Contact form submission:', {
      name: contactData.name ? 'provided' : 'missing',
      email: contactData.email ? 'provided' : 'missing',
      subject: contactData.subject ? 'provided' : 'missing',
      message: contactData.message ? 'provided' : 'missing',
      category: contactData.category || 'empty',
      hasAttachments: Array.from(formData.keys()).some(k => k.startsWith('attachment_'))
    });

    // Basic validation
    if (!contactData.name || !contactData.email || !contactData.subject || !contactData.message) {
      const missingFields = [];
      if (!contactData.name) missingFields.push('name');
      if (!contactData.email) missingFields.push('email');
      if (!contactData.subject) missingFields.push('subject');
      if (!contactData.message) missingFields.push('message');
      
      console.error('❌ Contact form validation failed - missing required fields:', {
        missingFields,
        receivedData: {
          name: contactData.name || 'EMPTY',
          email: contactData.email || 'EMPTY',
          subject: contactData.subject || 'EMPTY',
          message: contactData.message || 'EMPTY',
          category: contactData.category || 'EMPTY'
        },
        formDataKeys: Array.from(formData.keys())
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}. Please fill in all required fields.` 
        },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.email)) {
      console.error('Contact form validation failed - invalid email format:', contactData.email);
      return NextResponse.json(
        { success: false, error: 'Invalid email address format.' },
        { status: 400 }
      );
    }

    // Validate category - allow empty string but if provided must be valid
    const validCategories = ['general', 'project', 'collaboration'];
    if (contactData.category && !validCategories.includes(contactData.category)) {
      console.error('Contact form validation failed - invalid category:', contactData.category);
      return NextResponse.json(
        { success: false, error: `Invalid category: ${contactData.category}. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Default to 'general' if category is empty
    if (!contactData.category) {
      contactData.category = 'general';
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

    // Get SendGrid settings from database
    const sendGridSettings = await getSendGridSettings();
    
    if (!sendGridSettings.apiKey) {
      console.error('SendGrid API key not configured');
      return NextResponse.json(
        { success: false, error: 'Email service not configured. Please configure SendGrid API key in site settings.' },
        { status: 500 }
      );
    }

    // Initialize SendGrid service with API key from database (dynamic import to reduce build memory)
    const { SendGridEmailService } = await import('@/lib/services/sendgrid-email-service');
    const emailService = SendGridEmailService.getInstance(sendGridSettings.apiKey, sendGridSettings.fromEmail);

    // Send admin notification email
    try {
      await emailService.sendContactFormNotification({
        name: contactData.name,
        email: contactData.email,
        subject: contactData.subject,
        message: contactData.message,
        category: contactData.category,
        company: contactData.company,
        phone: contactData.phone,
        timeline: contactData.timeline,
        budget: contactData.budget,
        attachments: attachmentFiles,
      }, sendGridSettings.fromEmail);
    } catch (error) {
      console.error('Error sending admin notification:', error);
      // Don't fail the entire request if email fails, but log it
    }

    // Send auto-responder email
    try {
      await emailService.sendContactAutoResponse(
        contactData.name,
        contactData.email,
        contactData.category
      );
    } catch (error) {
      console.error('Error sending auto-responder:', error);
      // Don't fail the entire request if email fails, but log it
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
    console.error('❌ Contact form error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage || 'An error occurred while processing your request. Please try again later.' 
      },
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
