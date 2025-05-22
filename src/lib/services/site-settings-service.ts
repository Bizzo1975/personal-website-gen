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
  bioText?: string;
  navbarStyle: string;
  navbarLinks: NavbarLink[];
}

/**
 * Fetch the site settings
 */
export async function getSiteSettings(): Promise<SiteSettings> {
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
    return {
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
  }
}

/**
 * Update the site settings
 */
export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
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
    
    return response.json();
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
} 