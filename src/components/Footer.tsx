'use client';

import React from 'react';
import Link from 'next/link';
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

interface FooterProps {
  siteSettings?: SiteSettings;
}

const Footer: React.FC<FooterProps> = ({ siteSettings }) => {
  // Use site settings or fallback values
  const logoUrl = siteSettings?.logoUrl || '/uploads/general/branding-a0bbe598-5c50-4377-a2c5-a3a67d06959b.png';
  const logoText = siteSettings?.logoText || 'Jonathan L Keck';
  const footerText = siteSettings?.footerText || 'Built with Next.js and Tailwind CSS';
  const bioText = siteSettings?.bioText || 'Full-stack developer specializing in modern web technologies.';

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400 flex items-center space-x-2">
              <div className="w-10 h-10 relative">
                <Image 
                  src={logoUrl}
                  alt="Logo"
                  fill
                  sizes="40px"
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <span>{logoText}</span>
            </Link>
            <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-md">
              {bioText}
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link href="/about" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/projects" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Projects
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>
            <div className="text-slate-600 dark:text-slate-400 text-sm">
              <p>{footerText}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-600 dark:text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} {logoText}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 