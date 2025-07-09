// PostgreSQL SiteSettings interface
export interface SiteSettings {
  id: string;
  logo_url: string;
  logo_text: string;
  footer_text: string;
  bio_text: string;
  navbar_style: string;
  navbar_links: NavbarLink[];
  created_at: Date;
  updated_at: Date;
}

export interface NavbarLink {
  label: string;
  url: string;
  is_external: boolean;
}

// Type for creating site settings
export interface CreateSiteSettingsData {
  logo_url?: string;
  logo_text?: string;
  footer_text?: string;
  bio_text?: string;
  navbar_style?: string;
  navbar_links?: NavbarLink[];
}

// Type for updating site settings
export interface UpdateSiteSettingsData {
  logo_url?: string;
  logo_text?: string;
  footer_text?: string;
  bio_text?: string;
  navbar_style?: string;
  navbar_links?: NavbarLink[];
} 
