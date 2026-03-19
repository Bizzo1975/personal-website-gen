'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import ThemeSwitcher from './ThemeSwitcher';
import { AccessibilityToolbar } from './AccessibilityEnhancements';
import Image from 'next/image';

// Define interfaces for site settings
interface NavbarLink {
  label: string;
  url: string;
  isExternal: boolean;
}

interface SiteSettings {
  id?: string;
  logoUrl: string;
  logoText: string;
  footerText: string;
  bioText: string;
  navbarStyle: string;
  navbarLinks: NavbarLink[];
}

interface HeaderProps {
  profileName?: string;
  siteSettings?: SiteSettings;
}

const Header: React.FC<HeaderProps> = ({ profileName, siteSettings }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const isAuthenticated = status === 'authenticated';

  // Use site settings or fallback values
  const displayName = profileName || siteSettings?.logoText || 'Jonathan L Keck';
  const logoUrl = siteSettings?.logoUrl || '/uploads/general/branding-a0bbe598-5c50-4377-a2c5-a3a67d06959b.png';
  const navbarLinks = siteSettings?.navbarLinks || [
    { label: 'Home', url: '/', isExternal: false },
    { label: 'About', url: '/about', isExternal: false },
    { label: 'Projects', url: '/projects', isExternal: false },
    { label: 'Blog', url: '/blog', isExternal: false },
    { label: 'Contact', url: '/contact', isExternal: false },
  ];

  return (
    <header className="py-3 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm bg-white/70 dark:bg-slate-900/80 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400 flex items-center space-x-2">
            <div className="w-10 h-10 relative">
              <Image src={logoUrl} alt="Logo" fill sizes="40px" style={{ objectFit: 'contain' }} />
            </div>
            <span>{displayName}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <nav>
              <ul className="flex space-x-4">
                {navbarLinks.map((link, index) => (
                  <li key={index}>
                    <Link href={link.url} className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium">
                      {link.label}
                    </Link>
                  </li>
                ))}
                {isAdmin && (
                  <li>
                    <Link href="/admin/dashboard" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 transition-colors font-medium">
                      Admin
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
            <div className="flex items-center space-x-4 ml-4">
              <ThemeSwitcher />
              {isAuthenticated ? (
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium whitespace-nowrap"
                >
                  Logout
                </button>
              ) : (
                <Link 
                  href="/admin/login" 
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium whitespace-nowrap"
                >
                  Login
                </Link>
              )}
              <div className="ml-4 relative z-10">
                <AccessibilityToolbar inline={true} />
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <ThemeSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
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
            <ul className="flex flex-col space-y-4">
              {navbarLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.url} 
                    className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {isAdmin && (
                <li>
                  <Link 
                    href="/admin/dashboard" 
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 transition-colors font-medium block"
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
                    className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium block"
                  >
                    Logout
                  </button>
                </li>
              ) : (
                <>
                  <li>
                    <Link 
                      href="/admin/login" 
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium block"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
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

export default Header; 