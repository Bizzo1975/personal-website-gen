import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import SiteSettings from '@/lib/models/SiteSettings';

// Default site settings
const defaultSettings = {
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

// Mock data storage key for Node.js global object
const MOCK_SETTINGS_KEY = 'mockSiteSettings';

// Helper function to determine if we should use mock data
const useMockData = () => {
  return !process.env.MONGODB_URI || process.env.NODE_ENV === 'development';
};

// Function to initialize mock data
const initMockSettings = () => {
  if (!(global as any)[MOCK_SETTINGS_KEY]) {
    console.log('📋 Initializing mock site settings');
    (global as any)[MOCK_SETTINGS_KEY] = { ...defaultSettings, id: 'mock-settings-id' };
  }
  return (global as any)[MOCK_SETTINGS_KEY];
};

// Function to get mock settings
const getMockSettings = () => {
  return initMockSettings();
};

// Function to save mock settings
const saveMockSettings = (settings: any) => {
  console.log('💾 Saving mock site settings');
  (global as any)[MOCK_SETTINGS_KEY] = settings;
  return settings;
};

export async function GET() {
  try {
    // For development without MongoDB
    if (useMockData()) {
      const mockSettings = getMockSettings();
      console.log('📖 Getting mock site settings');
      return NextResponse.json(mockSettings);
    }

    await dbConnect();
    let settings = await SiteSettings.findOne({});
    
    // Create default settings if none exists
    if (!settings) {
      settings = await SiteSettings.create(defaultSettings);
    }
    
    return NextResponse.json({
      id: settings._id.toString(),
      logoUrl: settings.logoUrl,
      logoText: settings.logoText,
      footerText: settings.footerText,
      bioText: settings.bioText,
      navbarStyle: settings.navbarStyle,
      navbarLinks: settings.navbarLinks
    });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const data = await req.json();
    
    // For development without MongoDB
    if (useMockData()) {
      const mockSettings = getMockSettings();
      const updatedSettings = { ...mockSettings, ...data };
      saveMockSettings(updatedSettings);
      console.log('✅ Mock site settings updated successfully');
      return NextResponse.json(updatedSettings);
    }

    await dbConnect();
    
    // Find existing settings or create new ones
    let settings = await SiteSettings.findOne({});
    
    if (settings) {
      // Update existing settings
      settings = await SiteSettings.findByIdAndUpdate(
        settings._id,
        { ...data, updatedAt: new Date() },
        { new: true }
      );
    } else {
      // Create new settings
      settings = await SiteSettings.create({
        ...defaultSettings,
        ...data,
        updatedAt: new Date()
      });
    }
    
    return NextResponse.json({
      id: settings._id.toString(),
      logoUrl: settings.logoUrl,
      logoText: settings.logoText,
      footerText: settings.footerText,
      bioText: settings.bioText,
      navbarStyle: settings.navbarStyle,
      navbarLinks: settings.navbarLinks
    });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json(
      { error: 'Failed to update site settings' },
      { status: 500 }
    );
  }
} 