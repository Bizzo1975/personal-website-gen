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