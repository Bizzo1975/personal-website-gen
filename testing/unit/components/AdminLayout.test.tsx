import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import AdminLayout from '@/app/admin/components/AdminLayout';

// Mock the modules
jest.mock('next-auth/react');
jest.mock('next/navigation');
jest.mock('@/components/Header', () => {
  return function MockHeader({ profileName }: { profileName: string }) {
    return <div data-testid="header">Header - {profileName}</div>;
  };
});

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

// Mock fetch for profile API
global.fetch = jest.fn();

describe('AdminLayout', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
    
    mockUsePathname.mockReturnValue('/admin/dashboard');
    
    // Mock successful profile fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        name: 'Test Admin',
        imageUrl: '/test-image.jpg',
        skills: ['React', 'Node.js']
      })
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders admin layout with navigation items', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: 'Test Admin', email: 'admin@test.com', role: 'admin' },
        expires: '2023-01-01'
      },
      status: 'authenticated'
    });

    render(
      <AdminLayout title="Test Title">
        <div>Test Content</div>
      </AdminLayout>
    );

    // Check if navigation items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.getByText('About Me')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Newsletter')).toBeInTheDocument();
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('Site Settings')).toBeInTheDocument();
    expect(screen.getByText('Add New Page')).toBeInTheDocument();

    // Check if content is rendered
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/admin/projects');
    mockUseSession.mockReturnValue({
      data: {
        user: { name: 'Test Admin', email: 'admin@test.com', role: 'admin' },
        expires: '2023-01-01'
      },
      status: 'authenticated'
    });

    render(
      <AdminLayout title="Test Title">
        <div>Test Content</div>
      </AdminLayout>
    );

    const projectsLink = screen.getByRole('link', { name: /projects/i });
    expect(projectsLink).toHaveClass('bg-primary-600');
  });

  it('fetches and displays profile data', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: 'Test Admin', email: 'admin@test.com', role: 'admin' },
        expires: '2023-01-01'
      },
      status: 'authenticated'
    });

    render(
      <AdminLayout title="Test Title">
        <div>Test Content</div>
      </AdminLayout>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/profile');
    });

    await waitFor(() => {
      expect(screen.getByTestId('header')).toHaveTextContent('Header - Test Admin');
    });
  });

  it('handles profile fetch error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    mockUseSession.mockReturnValue({
      data: {
        user: { name: 'Test Admin', email: 'admin@test.com', role: 'admin' },
        expires: '2023-01-01'
      },
      status: 'authenticated'
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <AdminLayout title="Test Title">
        <div>Test Content</div>
      </AdminLayout>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch profile data:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('renders visual separators in navigation', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: 'Test Admin', email: 'admin@test.com', role: 'admin' },
        expires: '2023-01-01'
      },
      status: 'authenticated'
    });

    render(
      <AdminLayout title="Test Title">
        <div>Test Content</div>
      </AdminLayout>
    );

    // Check for separator elements (hr tags)
    const separators = screen.getAllByRole('separator');
    expect(separators.length).toBeGreaterThan(0);
  });

  it('includes proper link hrefs for navigation items', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: 'Test Admin', email: 'admin@test.com', role: 'admin' },
        expires: '2023-01-01'
      },
      status: 'authenticated'
    });

    render(
      <AdminLayout title="Test Title">
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/admin/dashboard');
    expect(screen.getByRole('link', { name: /home page/i })).toHaveAttribute('href', '/admin/pages/home');
    expect(screen.getByRole('link', { name: /about me/i })).toHaveAttribute('href', '/admin/pages/about');
    expect(screen.getByRole('link', { name: /projects/i })).toHaveAttribute('href', '/admin/projects');
    expect(screen.getByRole('link', { name: /posts/i })).toHaveAttribute('href', '/admin/posts');
    expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', '/admin/contact');
    expect(screen.getByRole('link', { name: /newsletter/i })).toHaveAttribute('href', '/admin/newsletter');
    expect(screen.getByRole('link', { name: /add new page/i })).toHaveAttribute('href', '/admin/pages/new');
  });
}); 