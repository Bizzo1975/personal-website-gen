import { NextRequest, NextResponse } from 'next/server';
import { validateContactForm } from '@/lib/utils/form-validation';
import { verifyRecaptchaToken, isRecaptchaValid } from '@/lib/utils/recaptcha-verify';

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
    
    // Parse form data
    const data = await request.json();
    const { name, email, subject, message, recaptchaToken } = data;
    
    // Validate form data
    const validationResult = validateContactForm({ name, email, subject, message });
    
    if (!validationResult.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          errors: validationResult.errors 
        },
        { status: 400 }
      );
    }
    
    // Verify reCAPTCHA
    if (!recaptchaToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'reCAPTCHA verification failed. Please try again.' 
        },
        { status: 400 }
      );
    }
    
    const recaptchaResponse = await verifyRecaptchaToken(recaptchaToken, ip);
    
    if (!isRecaptchaValid(recaptchaResponse)) {
      console.warn('reCAPTCHA validation failed:', recaptchaResponse['error-codes']);
      return NextResponse.json(
        { 
          success: false, 
          error: 'reCAPTCHA verification failed. Please try again.' 
        },
        { status: 400 }
      );
    }
    
    // Process the validated form data
    // Here you would normally send an email or store the message in a database
    
    // For demonstration purposes, we'll just log the data
    console.log('Contact form submission:', { name, email, subject, message });
    
    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'Your message has been sent successfully. Thank you for contacting us!' 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error processing contact form:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred. Please try again later.' 
      },
      { status: 500 }
    );
  }
}
