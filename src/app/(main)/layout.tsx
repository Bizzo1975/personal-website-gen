'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useEffect, useState } from 'react';
import { ProfileData } from '@/lib/services/profile-service';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'John Doe',
    imageUrl: '',
    skills: [],
  });
  
  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      }
    };
    
    fetchProfile();
  }, []);

  return (
    <>
      <Header profileName={profileData.name} />
      <main id="main-content" className="container mx-auto px-4 py-8 flex-grow" tabIndex={-1}>
        {children}
      </main>
      <Footer profileName={profileData.name} />
    </>
  );
} 