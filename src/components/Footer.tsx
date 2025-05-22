'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { updateSiteSettings } from '@/lib/services/site-settings-service';

interface FooterProps {
  profileName?: string;
  footerText?: string;
  logoUrl?: string;
  bioText?: string;
}

const Footer: React.FC<FooterProps> = ({ 
  profileName = 'John Doe',
  footerText = 'Built with Next.js and Tailwind CSS',
  logoUrl = '/images/wizard-icon.svg',
  bioText = 'Full-stack developer specializing in modern web technologies, creating elegant solutions to complex problems.'
}) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const [isEditingFooter, setIsEditingFooter] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedFooterText, setEditedFooterText] = useState(footerText);
  const [editedBioText, setEditedBioText] = useState(bioText);

  const handleFooterTextSave = async () => {
    try {
      await updateSiteSettings({ footerText: editedFooterText });
      setIsEditingFooter(false);
    } catch (error) {
      console.error('Failed to save footer text:', error);
    }
  };

  const handleBioTextSave = async () => {
    try {
      await updateSiteSettings({ bioText: editedBioText });
      setIsEditingBio(false);
    } catch (error) {
      console.error('Failed to save bio text:', error);
    }
  };

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400 flex items-center space-x-2">
              <div className="w-6 h-6 relative">
                <Image 
                  src={logoUrl} 
                  alt="Logo" 
                  fill 
                  style={{ objectFit: 'contain' }} 
                />
              </div>
              <span>{profileName}</span>
            </Link>
            {isAdmin && isEditingBio ? (
              <div className="mt-3 flex items-start">
                <textarea
                  value={editedBioText}
                  onChange={(e) => setEditedBioText(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm text-slate-600 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700"
                  rows={3}
                />
                <button 
                  onClick={handleBioTextSave}
                  className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-md relative group">
                {bioText}
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </p>
            )}
            <div className="mt-4 flex space-x-4">
              <a href="https://github.com" className="text-slate-500 hover:text-primary-600 dark:hover:text-primary-400" aria-label="GitHub">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://twitter.com" className="text-slate-500 hover:text-primary-600 dark:hover:text-primary-400" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="https://linkedin.com" className="text-slate-500 hover:text-primary-600 dark:hover:text-primary-400" aria-label="LinkedIn">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Legal</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} {profileName}. All rights reserved.
          </p>
          {isAdmin && isEditingFooter ? (
            <div className="text-sm mt-2 sm:mt-0 flex items-center">
              <input
                type="text"
                value={editedFooterText}
                onChange={(e) => setEditedFooterText(e.target.value)}
                className="px-2 py-1 border rounded-md text-sm dark:bg-slate-800 dark:border-slate-700"
              />
              <button 
                onClick={handleFooterTextSave}
                className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 ml-2"
              >
                Save
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 sm:mt-0 flex items-center">
              {footerText}
              {isAdmin && (
                <button 
                  onClick={() => setIsEditingFooter(true)}
                  className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 ml-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer; 