import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Fetch all site settings from database
    const result = await query('SELECT setting_key, setting_value FROM site_settings');
    
    // Convert to object format
    const settings: any = {};
    result.rows.forEach(row => {
      try {
        settings[row.setting_key] = JSON.parse(row.setting_value);
      } catch {
        settings[row.setting_key] = row.setting_value;
      }
    });
    
    // Apply defaults for missing settings
    const defaultSettings = {
      logoUrl: '/images/jlk-logo.png',
      logoText: 'Jonathan L Keck',
      footerText: 'Built with Next.js and Tailwind CSS',
      bioText: 'Full-stack developer specializing in modern web technologies, creating elegant solutions to complex problems.',
      navbarStyle: 'default',
      navbarLinks: [
        { label: 'Home', url: '/', isExternal: false },
        { label: 'About', url: '/about', isExternal: false },
        { label: 'Projects', url: '/projects', isExternal: false },
        { label: 'Blog', url: '/blog', isExternal: false },
        { label: 'Contact', url: '/contact', isExternal: false },
      ],
      ...settings
    };
    
    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Return default settings on error to prevent frontend crashes
    return NextResponse.json({
      logoUrl: '/images/jlk-logo.png',
      logoText: 'Jonathan L Keck',
      footerText: 'Built with Next.js and Tailwind CSS',
      bioText: 'Full-stack developer specializing in modern web technologies, creating elegant solutions to complex problems.',
      navbarStyle: 'default',
      navbarLinks: [
        { label: 'Home', url: '/', isExternal: false },
        { label: 'About', url: '/about', isExternal: false },
        { label: 'Projects', url: '/projects', isExternal: false },
        { label: 'Blog', url: '/blog', isExternal: false },
        { label: 'Contact', url: '/contact', isExternal: false },
      ],
      error: errorMessage
    }, { status: 200 }); // Return 200 with error in response to prevent frontend crashes
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
    
    const updatedSettings = await request.json();
    
    // Update each setting in the database
    for (const [key, value] of Object.entries(updatedSettings)) {
      const settingValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      await query(
        `INSERT INTO site_settings (setting_key, setting_value, updated_at) 
         VALUES ($1, $2, CURRENT_TIMESTAMP) 
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP`,
        [key, settingValue]
      );
    }
    
    // Revalidate pages that use site settings
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/revalidate?tag=site-settings`, { 
        method: 'POST' 
      });
    } catch (revalidateError) {
      console.log('Revalidation request failed, continuing...', revalidateError);
    }
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ error: 'Failed to update site settings' }, { status: 500 });
  }
} 
