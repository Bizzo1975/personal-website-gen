import React from 'react';
import { Metadata } from 'next';
import { getPageBySlug } from '@/lib/services/page-service';
import { getProfileData, ProfileData } from '@/lib/services/profile-service';
import { serializeMarkdown } from '@/lib/mdx';
import AboutPage from './about-page';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('about');
  
  return {
    title: page?.title || 'About Me',
    description: page?.metaDescription || 'Learn more about my background and experience',
  };
}

export default async function Page() {
  // Get the about page content
  const page = await getPageBySlug('about');
  
  if (!page) {
    return <div>Page not found</div>;
  }
  
  // Serialize the markdown content to MDX
  const mdxSource = await serializeMarkdown(page.content);
  
  // Get profile data
  let profileData: ProfileData = {} as ProfileData;
  try {
    profileData = await getProfileData();
  } catch (error) {
    console.error('Error fetching profile data:', error);
    // Use default profile data from the component
  }
  
  // Pass the content and profile data to the client component
  return <AboutPage content={mdxSource} profileData={profileData} />;
} 