import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { SiteSettings } from '@/lib/services/site-settings-service';

// Mock data store for site settings (will be replaced with actual database in production)
let mockSiteSettings: SiteSettings = {
  id: 'site-settings-1',
  logoUrl: '/images/wizard-icon.svg',
  logoText: 'John Doe',
  footerText: 'Built with Next.js and Tailwind CSS',
  bioText: 'Full-stack developer specializing in modern web technologies, creating elegant solutions to complex problems.',
  navbarStyle: 'default',
  navbarLinks: [
    { label: 'Home', url: '/', isExternal: false },
    { label: 'About', url: '/about', isExternal: false },
    { label: 'Projects', url: '/projects', isExternal: false },
    { label: 'Blog', url: '/blog', isExternal: false },
    { label: 'Contact', url: '/contact', isExternal: false },
  ]
};

export async function GET() {
  try {
    // In a real implementation, this would fetch from the database
    // For now, we'll use the mock data
    return NextResponse.json(mockSiteSettings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const updatedSettings = await request.json();
    
    // Validate required fields
    if (!updatedSettings.logoText) {
      return NextResponse.json(
        { error: 'Logo text is required' },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would update the database
    // For now, we'll update the mock data
    mockSiteSettings = {
      ...mockSiteSettings,
      ...updatedSettings
    };
    
    return NextResponse.json(mockSiteSettings);
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json(
      { error: 'Failed to update site settings' },
      { status: 500 }
    );
  }
} 