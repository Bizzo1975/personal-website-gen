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

const ABOUT_TITLE = 'About Jon Keck | Will Work For Lunch';
const ABOUT_DESCRIPTION =
  'About Jon Keck: 20+ years in IT, from copier repair to Active Directory at scale. He runs Kecktech IT in Park City, Kansas, builds things, and writes about them here.';

export async function generateMetadata(): Promise<Metadata> {
  let page = null;
  try {
    page = await getPageBySlug('about');
  } catch {
    page = null;
  }
  // Ignore leftover template values ("About - Personal Website" etc.) in the CMS row.
  const isTemplate = (value?: string) =>
    !value ||
    /personal website|full.stack developer|technologies I work with|experience as a developer/i.test(value);
  const dbTitle = page?.title?.trim();
  const dbDescription = page?.metaDescription?.trim();

  return {
    title: isTemplate(dbTitle) ? ABOUT_TITLE : dbTitle,
    description: isTemplate(dbDescription) ? ABOUT_DESCRIPTION : dbDescription,
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
  } else {
    console.error('❌ No profile data found in database');
  }
  
  // Serialize the markdown content
  const serializedContent = aboutPage 
    ? await serializeMarkdown(aboutPage.content)
    : await serializeMarkdown(
        "I'm Jon Keck. I build things, I run Kecktech IT in Park City, Kansas, and I write on this site about what I build."
      );
  
  // If no profile data exists, something is wrong with the database
  if (!profileData) {
    throw new Error('Profile data not found. Please check the database setup.');
  }
  
  // Render the page
  return (
    <AboutContent 
      content={serializedContent}
      profile={profileData}
      pageData={aboutPage || undefined}
    />
  );
} 