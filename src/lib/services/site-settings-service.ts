import { query } from '@/lib/db';

export interface NavbarLink {
  label: string;
  url: string;
  isExternal: boolean;
}

export interface SiteSettings {
  id?: string;
  logoUrl: string;
  logoText: string;
  footerText: string;
  bioText: string;
  navbarStyle: string;
  navbarLinks: NavbarLink[];
}

/**
 * Fetch the site settings from database (server-side)
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    console.log('🔄 Fetching site settings from database...');
    
    // Fetch all site settings from database (same logic as API endpoint)
    const result = await query('SELECT setting_key, setting_value FROM site_settings');
    
    console.log('📋 Site settings query result:', result.rows.length, 'rows');
    
    // Convert to object format
    const settings: any = {};
    result.rows.forEach(row => {
      try {
        settings[row.setting_key] = JSON.parse(row.setting_value);
      } catch {
        settings[row.setting_key] = row.setting_value;
      }
    });
    
    console.log('⚙️ Parsed settings:', Object.keys(settings));
    
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
    
    console.log('🏠 Final site settings - Logo URL:', defaultSettings.logoUrl);
    
    return defaultSettings;
  } catch (error) {
    console.error('❌ Error fetching site settings (using fallback):', error);
    // Return safe defaults as fallback
    return {
      logoUrl: '/images/jlk-logo.png',
      logoText: 'Jonathan L Keck',
      footerText: 'Built with Next.js and Tailwind CSS',
      bioText: 'Full-stack developer specializing in modern web technologies.',
      navbarStyle: 'default',
      navbarLinks: [
        { label: 'Home', url: '/', isExternal: false },
        { label: 'About', url: '/about', isExternal: false },
        { label: 'Projects', url: '/projects', isExternal: false },
        { label: 'Blog', url: '/blog', isExternal: false },
        { label: 'Contact', url: '/contact', isExternal: false },
      ]
    };
  }
}

function getDefaultSiteSettings(): SiteSettings {
  return {
    logoUrl: '/images/jlk-logo.png',
    logoText: 'Jonathan L Keck',
    footerText: 'Built with Next.js and Tailwind CSS',
    bioText: 'Full-stack developer specializing in modern web technologies, creating elegant solutions to complex problems.',
    navbarStyle: 'default',
    navbarLinks: getDefaultNavbarLinks()
  };
}

function getDefaultNavbarLinks() {
  return [
    { label: 'Home', url: '/', isExternal: false },
    { label: 'About', url: '/about', isExternal: false },
    { label: 'Projects', url: '/projects', isExternal: false },
    { label: 'Blog', url: '/blog', isExternal: false },
    { label: 'Contact', url: '/contact', isExternal: false },
  ];
}

/**
 * Fetch site settings for client-side use
 */
export async function getSiteSettingsClient(): Promise<SiteSettings> {
  try {
    const response = await fetch('/api/site-settings', { 
      cache: 'no-store',
      next: { tags: ['site-settings'] } 
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch site settings: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching site settings:', error);
    // Return safe defaults only as fallback
    return {
      logoUrl: '/images/jlk-logo.png',
      logoText: 'Jonathan L Keck',
      footerText: 'Built with Next.js and Tailwind CSS',
      bioText: 'Full-stack developer specializing in modern web technologies.',
      navbarStyle: 'default',
      navbarLinks: [
        { label: 'Home', url: '/', isExternal: false },
        { label: 'About', url: '/about', isExternal: false },
        { label: 'Projects', url: '/projects', isExternal: false },
        { label: 'Blog', url: '/blog', isExternal: false },
        { label: 'Contact', url: '/contact', isExternal: false },
      ]
    };
  }
}

/**
 * Update the site settings in database
 */
export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  try {
    const updatePromise = query(
      `UPDATE site_settings SET 
       logo_url = COALESCE($1, logo_url),
       logo_text = COALESCE($2, logo_text),
       footer_text = COALESCE($3, footer_text),
       bio_text = COALESCE($4, bio_text),
       navbar_style = COALESCE($5, navbar_style),
       navbar_links = COALESCE($6, navbar_links),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM site_settings ORDER BY id DESC LIMIT 1)
       RETURNING *`,
      [
        settings.logoUrl,
        settings.logoText,
        settings.footerText,
        settings.bioText,
        settings.navbarStyle,
        settings.navbarLinks ? JSON.stringify(settings.navbarLinks) : null
      ]
    );
    
    const result = await withTimeout(updatePromise, 5000);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to update site settings');
    }
    
    return await getSiteSettings();
  } catch (error) {
    console.error('Error updating site settings:', error);
    throw error;
  }
}

/**
 * Upload a logo image
 */
export async function uploadLogo(file: File): Promise<{ path: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'logo');
    
    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload logo: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Automatically update site settings with new logo URL
    await updateSiteSettings({ logoUrl: result.path });
    
    return result;
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
} 