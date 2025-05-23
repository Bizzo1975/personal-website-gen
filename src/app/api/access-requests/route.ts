import { NextRequest, NextResponse } from 'next/server';
import { AccessRequestService, AccessRequestFormData } from '@/lib/models/access-request';
import { validateContactForm } from '@/lib/utils/form-validation';
import { verifyRecaptchaToken, isRecaptchaValid } from '@/lib/utils/recaptcha-verify';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Rate limiting for access request submissions
const rateLimit = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 access requests per hour
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
            error: 'Too many access requests. Please try again later.' 
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
    const { name, email, subject, message, requestType, accessLevel, recaptchaToken } = data;
    
    // Validate that this is an access request
    if (requestType !== 'access_request') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request type' 
        },
        { status: 400 }
      );
    }
    
    // Validate access level is provided
    if (!accessLevel || !['personal', 'professional'].includes(accessLevel)) {
      return NextResponse.json(
        { 
          success: false, 
          errors: [{
            field: 'accessLevel',
            message: 'Please select a valid access level'
          }]
        },
        { status: 400 }
      );
    }
    
    // Validate form data using existing contact form validation
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
    
    // Verify reCAPTCHA if enabled
    if (process.env.RECAPTCHA_SECRET_KEY) {
      if (!recaptchaToken) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'reCAPTCHA verification required' 
          },
          { status: 400 }
        );
      }
      
      const recaptchaResponse = await verifyRecaptchaToken(recaptchaToken);
      if (!isRecaptchaValid(recaptchaResponse)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'reCAPTCHA verification failed' 
          },
          { status: 400 }
        );
      }
    }
    
    // Check if user already has a pending or approved request
    const existingRequests = await AccessRequestService.getAll();
    const existingRequest = existingRequests.find(req => 
      req.email.toLowerCase() === email.toLowerCase() && 
      (req.status === 'pending' || req.status === 'approved')
    );
    
    if (existingRequest) {
      const statusMessage = existingRequest.status === 'pending' 
        ? 'You already have a pending access request. Please wait for it to be processed.'
        : 'You already have approved access. Please contact support if you need to modify your access level.';
      
      return NextResponse.json(
        { 
          success: false, 
          error: statusMessage
        },
        { status: 400 }
      );
    }
    
    // Create the access request
    const accessRequestData: AccessRequestFormData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
      requestType: 'access_request',
      accessLevel
    };
    
    const newRequest = await AccessRequestService.create(accessRequestData);
    
    // Log for admin awareness
    console.log('🔔 New access request submitted:', {
      id: newRequest._id,
      email: newRequest.email,
      accessLevel: newRequest.accessLevel,
      submittedAt: newRequest.submittedAt
    });
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Access request submitted successfully',
        requestId: newRequest._id
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error processing access request:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred while processing your request. Please try again later.' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    
    // Get access requests
    let accessRequests;
    if (status) {
      accessRequests = await AccessRequestService.getByStatus(status);
    } else {
      accessRequests = await AccessRequestService.getAll();
    }
    
    return NextResponse.json({
      success: true,
      accessRequests,
      total: accessRequests.length
    });
    
  } catch (error) {
    console.error('Error fetching access requests:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch access requests' },
      { status: 500 }
    );
  }
} 