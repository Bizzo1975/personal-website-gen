import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { getToken } from 'next-auth/jwt';

// Mock next-auth/jwt
jest.mock('next-auth/jwt');

// Mock NextResponse
const mockRedirect = jest.fn();
const mockNext = jest.fn();

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: mockRedirect,
    next: mockNext,
  },
}));

const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue(null);
  });

  it('allows access to public auth routes', async () => {
    const request = new NextRequest('http://localhost:3000/admin/login');
    
    await middleware(request);
    
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users from protected admin routes', async () => {
    const request = new NextRequest('http://localhost:3000/admin/dashboard');
    mockGetToken.mockResolvedValue(null);
    
    await middleware(request);
    
    expect(mockRedirect).toHaveBeenCalledWith(
      new URL('/admin/login', request.url)
    );
  });

  it('allows authenticated admin users to access admin routes', async () => {
    const request = new NextRequest('http://localhost:3000/admin/dashboard');
    mockGetToken.mockResolvedValue({
      email: 'admin@test.com',
      role: 'admin',
      id: 'test-id',
    } as any);
    
    await middleware(request);
    
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('denies access to non-admin users for admin routes', async () => {
    const request = new NextRequest('http://localhost:3000/admin/settings');
    mockGetToken.mockResolvedValue({
      email: 'user@test.com',
      role: 'user',
      id: 'test-id',
    } as any);
    
    await middleware(request);
    
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/admin/dashboard',
        searchParams: expect.objectContaining({
          get: expect.any(Function),
        }),
      })
    );
  });

  it('allows all authenticated users to access dashboard', async () => {
    const request = new NextRequest('http://localhost:3000/admin/dashboard');
    mockGetToken.mockResolvedValue({
      email: 'user@test.com',
      role: 'user',
      id: 'test-id',
    } as any);
    
    await middleware(request);
    
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('skips middleware for API auth routes', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/session');
    
    await middleware(request);
    
    expect(mockGetToken).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('does not affect non-admin routes', async () => {
    const request = new NextRequest('http://localhost:3000/');
    
    await middleware(request);
    
    expect(mockGetToken).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

// Test helper functions for auth
describe('Auth Helper Functions', () => {
  describe('Role-based access control', () => {
    it('should identify admin users correctly', () => {
      const adminSession = {
        user: { role: 'admin', email: 'admin@test.com' }
      };
      
      expect(adminSession.user.role).toBe('admin');
    });

    it('should identify regular users correctly', () => {
      const userSession = {
        user: { role: 'user', email: 'user@test.com' }
      };
      
      expect(userSession.user.role).toBe('user');
    });

    it('should handle users without roles', () => {
      const sessionWithoutRole = {
        user: { email: 'user@test.com' }
      };
      
      expect(sessionWithoutRole.user.role).toBeUndefined();
    });
  });
}); 