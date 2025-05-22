import React from 'react';
import { Metadata } from 'next';
import { getPageBySlug } from '@/lib/services/page-service';
import { getProfileData } from '@/lib/services/profile-service';
import { serializeMarkdown } from '@/lib/mdx';
import AboutContent from './about-content';

// Make sure this page doesn't use any caching and fetches fresh data every time
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('about');
  
  return {
    title: page?.title || 'About Me - Personal Website',
    description: page?.metaDescription || 'Learn more about my background, skills, and experience as a developer.',
  };
}

export default async function AboutPage() {
  console.log('🔄 Fetching About page content...');
  
  // Get the about page content from the database
  const aboutPage = await getPageBySlug('about');
  
  if (aboutPage) {
    console.log('📝 About page content retrieved: ', aboutPage.content.substring(0, 100) + '...');
  }
  
  // Get profile data
  console.log('👤 Fetching profile data...');
  const profileData = await getProfileData();
  
  if (profileData) {
    console.log('✅ Profile data retrieved successfully');
  }
  
  // Serialize the markdown content
  const serializedContent = aboutPage 
    ? await serializeMarkdown(aboutPage.content)
    : await serializeMarkdown('# About Me\nContent coming soon.');
  
  // Render the page
  return (
    <AboutContent 
      content={serializedContent}
      profile={profileData}
      pageData={aboutPage}
    />
  );
} 