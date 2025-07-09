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

function getDefaultSiteSettings(): SiteSettings {
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
    return getDefaultSiteSettings();
  }
}

/**
 * Update site settings via API
 */
export async function updateSiteSettingsClient(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  try {
    const response = await fetch('/api/site-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update site settings: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating site settings:', error);
    throw error;
  }
}

/**
 * Upload a logo image via API
 */
export async function uploadLogoClient(file: File): Promise<{ path: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'logo');
    
    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload logo');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
} 