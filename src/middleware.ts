import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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
  }
  
  // Add CSRF protection for API routes that handle state changes
  if (path.startsWith('/api/') && 
      !path.startsWith('/api/auth') && 
      (request.method === 'POST' || 
       request.method === 'PUT' || 
       request.method === 'DELETE')) {
    
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