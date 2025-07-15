'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProfileData } from '@/lib/services/profile-service';
import { SiteSettings } from '@/lib/services/site-settings-service';

const AdminFooter: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [footerText, setFooterText] = useState('Built with Next.js and Tailwind CSS');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'Admin User',
    imageUrl: '',
    skills: [],
  });
  
  // Fetch site settings and profile data using client-side API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch site settings
        const settingsResponse = await fetch('/api/site-settings');
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          setSiteSettings(settings);
          setFooterText(settings.footerText || 'Built with Next.js and Tailwind CSS');
        }

        // Fetch profile data
        const profileResponse = await fetch('/api/profile');
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          setProfileData(profile);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    
    fetchData();
  }, []);
  
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFooterText(e.target.value);
  };
  
  const handleTextSave = async () => {
    try {
      const response = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          footerText
        })
      });
      
      if (response.ok) {
        const updatedSettings = await response.json();
        setSiteSettings(updatedSettings);
        setIsEditing(false);
        console.log('Footer text saved:', footerText);
      } else {
        throw new Error('Failed to save footer text');
      }
    } catch (error) {
      console.error('Failed to save footer text:', error);
    }
  };
  
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400 flex items-center space-x-2">
              <div className="w-10 h-10 relative">
                <Image 
                  src={siteSettings?.logoUrl || '/images/jlk-logo.png'}
                  alt="Logo"
                  fill
                  sizes="40px"
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <span>{siteSettings?.logoText || 'Jonathan L Keck'}</span>
            </Link>
            <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-md">
              {siteSettings?.bioText || 'Full-stack developer specializing in modern web technologies, creating elegant solutions to complex problems.'}
            </p>
          </div>

          <div className="flex items-center space-x-6">
            {/* Social Links */}
            <div className="flex space-x-4">
              {profileData?.socialLinks?.github && (
                <a href={profileData.socialLinks.github} className="text-slate-500 hover:text-primary-600 dark:hover:text-primary-400" aria-label="GitHub" target="_blank" rel="noopener noreferrer">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              )}
              {profileData?.socialLinks?.linkedin && (
                <a href={profileData.socialLinks.linkedin} className="text-slate-500 hover:text-primary-600 dark:hover:text-primary-400" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              {profileData?.socialLinks?.website && (
                <a href={profileData.socialLinks.website} className="text-slate-500 hover:text-primary-600 dark:hover:text-primary-400" aria-label="Website" target="_blank" rel="noopener noreferrer">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9 3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} {siteSettings?.logoText || 'Jonathan L Keck'}. All rights reserved.
          </p>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-2 sm:mt-0 flex items-center">
            {isEditing ? (
              <div className="flex items-center">
                <input
                  type="text"
                  value={footerText}
                  onChange={handleTextChange}
                  className="px-2 py-1 border rounded-md mr-2 text-sm dark:bg-slate-800 dark:border-slate-700"
                />
                <button 
                  onClick={handleTextSave}
                  className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 ml-2"
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                {footerText}
                <button 
                  onClick={handleEditToggle}
                  className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 ml-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter; 