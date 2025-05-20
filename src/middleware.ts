import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Simple in-memory rate limiting store
// In a production environment, use Redis or a similar service
const rateLimit = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  store: new Map<string, { count: number; resetTime: number }>(),
};

/**
 * Implements basic rate limiting
 * @param ip The IP address to rate limit
 * @returns Whether the request should be allowed
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  
  // Clean up expired entries
  // Using Array.from to avoid TypeScript Map iterator issues
  Array.from(rateLimit.store.keys()).forEach(key => {
    const value = rateLimit.store.get(key);
    if (value && now > value.resetTime) {
      rateLimit.store.delete(key);
    }
  });
  
  if (!rateLimit.store.has(ip)) {
    rateLimit.store.set(ip, {
      count: 1,
      resetTime: now + rateLimit.windowMs,
    });
    return true;
  }
  
  const current = rateLimit.store.get(ip)!;
  
  // Reset counter if window expired
  if (now > current.resetTime) {
    rateLimit.store.set(ip, {
      count: 1,
      resetTime: now + rateLimit.windowMs,
    });
    return true;
  }
  
  // Increment counter and check limit
  current.count += 1;
  return current.count <= rateLimit.maxRequests;
}

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Auth routes that should be publicly accessible
  const isAuthRoute = path === '/admin/login' || path === '/admin/signup';
  const isApiAuthRoute = path.startsWith('/api/auth/');
  
  // Check if the request is for the admin section but not a public auth route
  if (path.startsWith('/admin') && !isAuthRoute && !isApiAuthRoute) {
    console.log(`Checking auth for protected route: ${path}`);
    
    // Check if the user is authenticated
    const session = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    console.log(`Auth check result: ${session ? 'Authenticated' : 'Not authenticated'}`);
    
    if (!session) {
      // Redirect to login page if not authenticated
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // Role-based access control for admin routes
    // If we're accessing admin routes, verify user has admin role
    // Skip this check for the dashboard which all authenticated users can access
    if (path.startsWith('/admin') && 
        !path.startsWith('/admin/dashboard') && 
        path !== '/admin' && 
        session.role !== 'admin') {
      console.log(`Access denied to: ${path} - User role: ${session.role || 'undefined'}`);
      
      // Redirect to dashboard with access denied message
      const redirectUrl = new URL('/admin/dashboard', request.url);
      redirectUrl.searchParams.set('error', 'access_denied');
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  // Add CSRF protection for API routes that handle state changes
  if (path.startsWith('/api/') && 
      !path.startsWith('/api/auth') && 
      (request.method === 'POST' || 
       request.method === 'PUT' || 
       request.method === 'DELETE')) {
    
    // Apply rate limiting for API endpoints
    const ip = request.ip || 'unknown';
    if (!checkRateLimit(ip)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests, please try again later' }),
        { 
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      );
    }
    
    // Verify the referer header to prevent CSRF attacks
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');
    
    // If referer is missing or doesn't match our host, reject the request
    if (!referer || !host || !referer.includes(host)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid cross-site request' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For admin API routes, verify user has admin role
    if (path.startsWith('/api/admin')) {
      const session = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      });
      
      if (!session || session.role !== 'admin') {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized access to admin API' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
  }
  
  // Add security headers for sensitive endpoints
  if (path.startsWith('/api/auth') || 
      path.includes('/admin') || 
      path.includes('/login') ||
      path.includes('/signup')) {
    const response = NextResponse.next();
    
    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Content-Security-Policy', 
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    );
    
    return response;
  }
  
  return NextResponse.next();
}

// Specify which routes this middleware should run for
export const config = {
  matcher: [
    // Apply to all routes except static files and api auth routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 