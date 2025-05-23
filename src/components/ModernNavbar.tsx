'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import ThemeSwitcher from './ThemeSwitcher';
import { usePathname } from 'next/navigation';
import { SiteSettings, NavbarLink } from '@/lib/services/site-settings-service';
import { getProfileData, ProfileData } from '@/lib/services/profile-service';

interface ModernNavbarProps {
  siteSettings: SiteSettings;
}

const ModernNavbar: React.FC<ModernNavbarProps> = ({ siteSettings }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === 'admin';
  const isAuthenticated = status === 'authenticated';
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'John Doe',
    imageUrl: '',
    skills: [],
  });

  // Fetch profile data for the name
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const data = await getProfileData();
        setProfileData(data);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      }
    };
    
    fetchProfileData();
  }, []);

  // Handle scroll events to add backdrop and shadow when scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get navbar styles based on settings and scroll state
  const getNavbarStyles = () => {
    if (siteSettings.navbarStyle === 'transparent') {
      return scrolled
        ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm'
        : 'bg-transparent';
    } else if (siteSettings.navbarStyle === 'sticky') {
      return 'bg-white dark:bg-slate-900 shadow-md';
    } else {
      // Default style
      return 'bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800';
    }
  };

  // Determine if a link is active
  const isLinkActive = (url: string) => {
    if (url === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(url);
  };

  return (
    <header 
      className={`${getNavbarStyles()} fixed top-0 left-0 right-0 z-40 transition-all duration-300`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 relative overflow-hidden transition-transform duration-300 group-hover:scale-110">
              <Image
                src={siteSettings.logoUrl}
                alt="Logo"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">
              {profileData.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex">
              <ul className="flex space-x-1">
                {siteSettings.navbarLinks.map((link, index) => (
                  <li key={index}>
                    {link.isExternal ? (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          isLinkActive(link.url)
                            ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.url}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          isLinkActive(link.url)
                            ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
                {isAdmin && (
                  <li>
                    <Link
                      href="/admin/dashboard"
                      className="px-4 py-2 rounded-full text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    >
                      Admin
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
            
            <div className="flex items-center space-x-4">
              <ThemeSwitcher />
              {isAuthenticated ? (
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 text-sm font-medium rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Logout
                </button>
              ) : (
                <div className="flex space-x-2">
                  <Link
                    href="/admin/login"
                    className="px-4 py-2 text-sm font-medium rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/contact"
                    className="px-4 py-2 text-sm font-medium rounded-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <ThemeSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-700 dark:text-slate-300"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4">
            <ul className="flex flex-col space-y-2">
              {siteSettings.navbarLinks.map((link, index) => (
                <li key={index}>
                  {link.isExternal ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isLinkActive(link.url)
                          ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.url}
                      className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isLinkActive(link.url)
                          ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
              {isAdmin && (
                <li>
                  <Link
                    href="/admin/dashboard"
                    className="block px-4 py-2 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                </li>
              )}
              {isAuthenticated ? (
                <li>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Logout
                  </button>
                </li>
              ) : (
                <>
                  <li>
                    <Link
                      href="/admin/login"
                      className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="block px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default ModernNavbar; 