import { NextRequest, NextResponse } from 'next/server';
import { AccessRequestService } from '@/lib/services/access-request-service';
import { validateContactForm } from '@/lib/utils/form-validation';
import { verifyRecaptchaToken, isRecaptchaValid } from '@/lib/utils/recaptcha-verify';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

// Rate limiting for access request submissions
const rateLimit = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 access requests per hour per IP
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
    const { name, email, message, requestedAccessLevel, recaptchaToken } = data;
    
    // Validate required fields
    if (!name || !email || !requestedAccessLevel) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: name, email, and requested access level are required' 
        },
        { status: 400 }
      );
    }
    
    // Validate access level is valid
    if (!['personal', 'professional'].includes(requestedAccessLevel)) {
      return NextResponse.json(
        { 
          success: false, 
          errors: [{
            field: 'requestedAccessLevel',
            message: 'Please select a valid access level (personal or professional)'
          }]
        },
        { status: 400 }
      );
    }
    
    // Validate form data using existing contact form validation
    const validationResult = validateContactForm({ 
      name, 
      email, 
      subject: `Access Request - ${requestedAccessLevel}`, 
      message: message || `Requesting ${requestedAccessLevel} access` 
    });
    
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
    
    // Check if user already has this specific access level (pending or active)
    const existingRequest = await AccessRequestService.getExistingRequest(email, requestedAccessLevel);
    
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          { 
            success: false, 
            error: `You already have a pending ${requestedAccessLevel} access request. Please wait for it to be processed.`
          },
          { status: 400 }
        );
      } else if (existingRequest.status === 'approved') {
        // Check if user already has this access level
        const hasAccess = await AccessRequestService.checkUserAccess(email, requestedAccessLevel);
        if (hasAccess) {
          return NextResponse.json(
            { 
              success: false, 
              error: `You already have ${requestedAccessLevel} access. Contact support if you need assistance.`
            },
            { status: 400 }
          );
        }
      }
    }
    
    // Create the access request
    const accessRequestData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      requestedAccessLevel,
      message: message?.trim() || `Requesting ${requestedAccessLevel} access`
    };
    
    const newRequest = await AccessRequestService.create(accessRequestData);
    
    // Log for admin awareness
    console.log('🔔 New access request submitted:', {
      id: newRequest.id,
      email: newRequest.email,
      accessLevel: newRequest.requested_access_level,
      submittedAt: newRequest.submitted_at
    });
    
    return NextResponse.json(
      { 
        success: true, 
        message: `${requestedAccessLevel.charAt(0).toUpperCase() + requestedAccessLevel.slice(1)} access request submitted successfully`,
        requestId: newRequest.id,
        accessLevel: newRequest.requested_access_level
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
  console.log('🔍 [Access Requests API] Starting GET request...');
  
  try {
    // Check authentication
    console.log('🔍 [Step 1] Checking authentication...');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('❌ [Step 1] No session found');
      return NextResponse.json(
        { error: 'Unauthorized - No session found', step: 'authentication', debug: true },
        { status: 401 }
      );
    }
    
    if (!session.user?.email) {
      console.log('❌ [Step 1] Session exists but no user email');
      return NextResponse.json(
        { error: 'Unauthorized - No user email in session', step: 'authentication', debug: true },
        { status: 401 }
      );
    }
    
    console.log('✅ [Step 1] Authentication successful:', { email: session.user.email, role: session.user?.role });

    // Check if user is admin
    console.log('🔍 [Step 2] Checking admin status...');
    const isAdmin = await AccessRequestService.isUserAdmin(session.user.email);
    console.log('🔍 [Step 2] Admin check result:', { email: session.user.email, isAdmin });
    
    if (!isAdmin) {
      console.log('❌ [Step 2] User is not admin');
      return NextResponse.json(
        { 
          error: 'Forbidden - Admin access required', 
          step: 'authorization', 
          debug: true,
          userEmail: session.user.email,
          suggestion: 'Make sure your user has admin role in the database'
        },
        { status: 403 }
      );
    }
    
    console.log('✅ [Step 2] Admin authorization successful');
    
    // Get query parameters
    console.log('🔍 [Step 3] Processing query parameters...');
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    const accessLevel = searchParams.get('accessLevel') as 'professional' | 'personal' | null;
    console.log('🔍 [Step 3] Query params:', { status, accessLevel });
    
    // Get access requests with filtering
    console.log('🔍 [Step 4] Fetching access requests...');
    const accessRequests = await AccessRequestService.getFilteredRequests(status, accessLevel);
    console.log('✅ [Step 4] Access requests retrieved:', accessRequests.length);
    
    // Get summary statistics
    console.log('🔍 [Step 5] Fetching statistics...');
    const stats = await AccessRequestService.getRequestStats();
    console.log('✅ [Step 5] Stats retrieved:', stats);
    
    console.log('🎉 [Complete] Access requests API successful');
    
    return NextResponse.json({
      success: true,
      accessRequests,
      stats,
      total: accessRequests.length,
      filters: {
        status,
        accessLevel
      },
      debug: {
        userEmail: session.user.email,
        isAdmin: true,
        requestsCount: accessRequests.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ [Error] Access requests API failed:', error);
    console.error('❌ [Error] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch access requests', 
        details: error instanceof Error ? error.message : 'Unknown error',
        step: 'execution',
        debug: true,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 
