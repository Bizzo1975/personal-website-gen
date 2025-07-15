import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { EnhancedAccessRequestService } from '@/lib/services/enhanced-access-request-service';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Starting access requests debug check...');
    
    // Step 1: Check authentication
    const session = await getServerSession(authOptions);
    console.log('🔍 Debug: Session:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userRole: session?.user?.role
    });
    
    if (!session?.user?.email) {
      return NextResponse.json({
        debug: true,
        error: 'No session found',
        step: 'authentication',
        details: 'User is not authenticated'
      }, { status: 401 });
    }

    // Step 2: Test database connection
    console.log('🔍 Debug: Testing database connection...');
    try {
      const testResult = await query('SELECT 1 as test');
      console.log('🔍 Debug: Database connection successful');
    } catch (dbError) {
      console.error('🔍 Debug: Database connection failed:', dbError);
      return NextResponse.json({
        debug: true,
        error: 'Database connection failed',
        step: 'database',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }

    // Step 3: Test Enhanced Service instantiation
    console.log('🔍 Debug: Testing enhanced service...');
    try {
      const enhancedService = new EnhancedAccessRequestService();
      console.log('🔍 Debug: Enhanced service created successfully');
      
      // Step 4: Test admin check
      console.log('🔍 Debug: Checking admin status...');
      const isAdmin = await enhancedService.isUserAdmin(session.user.email);
      console.log('🔍 Debug: Admin check result:', isAdmin);
      
      if (!isAdmin) {
        return NextResponse.json({
          debug: true,
          error: 'User is not admin',
          step: 'authorization',
          details: {
            userEmail: session.user.email,
            isAdmin: false,
            suggestion: 'Make sure your user has admin role in the database'
          }
        }, { status: 403 });
      }

      // Step 5: Test access requests query
      console.log('🔍 Debug: Testing access requests query...');
      const accessRequests = await enhancedService.getFilteredRequests();
      console.log('🔍 Debug: Access requests retrieved:', accessRequests.length);

      // Step 6: Test stats query
      console.log('🔍 Debug: Testing stats query...');
      const stats = await enhancedService.getRequestStats();
      console.log('🔍 Debug: Stats retrieved:', stats);

      return NextResponse.json({
        debug: true,
        success: true,
        checks: {
          authentication: '✅ Passed',
          database: '✅ Passed',
          service: '✅ Passed',
          authorization: '✅ Passed',
          accessRequests: '✅ Passed',
          stats: '✅ Passed'
        },
        data: {
          userEmail: session.user.email,
          isAdmin: true,
          requestsCount: accessRequests.length,
          stats: stats
        }
      });

    } catch (serviceError) {
      console.error('🔍 Debug: Service error:', serviceError);
      return NextResponse.json({
        debug: true,
        error: 'Service error',
        step: 'service',
        details: serviceError instanceof Error ? serviceError.message : 'Unknown service error',
        stack: serviceError instanceof Error ? serviceError.stack : undefined
      }, { status: 500 });
    }

  } catch (error) {
    console.error('🔍 Debug: Unexpected error:', error);
    return NextResponse.json({
      debug: true,
      error: 'Unexpected error',
      step: 'unknown',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 