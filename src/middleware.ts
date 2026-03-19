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
  const { pathname } = request.nextUrl;

  // Skip middleware for certain paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/uploads/') ||
    pathname.includes('.') ||
    pathname === '/api/test' ||
    pathname === '/api/health' ||
    pathname === '/api/rss'
  ) {
    return NextResponse.next();
  }

  // Enhanced security headers
  const response = NextResponse.next();
  
  // CSP - Next.js requires 'unsafe-eval' for runtime features (both dev and prod)
  // Always set the same CSP to avoid issues with NODE_ENV detection
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self' http: https: data: blob:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:; " +
    "style-src 'self' 'unsafe-inline' http: https:; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data: https:; " +
    "connect-src 'self' http: https: ws: wss:; " +
    "frame-ancestors 'none';"
  );

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Check for admin routes (EXCLUDE login page from auth check)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    console.log(`Checking auth for protected route: ${pathname}`);
    
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      console.log('Auth check result: Not authenticated');
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (token.role !== 'admin') {
      console.log('Auth check result: Insufficient permissions');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    console.log('Auth check result: Authenticated');
  }

  // API route protection for write operations
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE'].includes(request.method)) {
    // Skip auth check for certain public APIs
    if (
      pathname === '/api/contact' ||
      pathname === '/api/newsletter' ||
      pathname === '/api/comments' ||
      pathname === '/api/access-requests' ||
      pathname.startsWith('/api/auth/')
    ) {
      return response;
    }

    // Check authentication for write operations
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Admin-only operations
    if (['admin', 'users', 'pages', 'posts', 'projects', 'settings', 'media'].some(path => 
      pathname.includes(`/api/${path}`) || pathname.includes(`/api/admin/`)
    )) {
      if (token.role !== 'admin') {
        return new NextResponse(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verify the referer header to prevent CSRF attacks
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');

    // Enhanced referer check - allow same-origin requests and localhost
    const isLocalhost = host?.includes('localhost') || host?.includes('127.0.0.1');
    const isValidReferer = referer && host && (
      referer.includes(host) || 
      (isLocalhost && referer.includes('localhost')) ||
      (isLocalhost && referer.includes('127.0.0.1'))
    );

    if (!referer || !host || !isValidReferer) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid cross-site request' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return response;
}

// Specify which routes this middleware should run for
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 
