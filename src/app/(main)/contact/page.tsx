import React from 'react';
import { getPageBySlug } from '@/lib/services/page-service';
import { getProfileData } from '@/lib/services/profile-service';
import { serializeMarkdown } from '@/lib/mdx';
import ContactContent from './contact-content';

export const metadata = {
  title: 'Contact Me - Personal Website',
  description: 'Get in touch with me for work inquiries, collaborations, or just to say hello.',
};

export default async function ContactPage() {
  // Fetch the contact page content from database
  console.log('🔄 Fetching Contact page content...');
  const page = await getPageBySlug('contact');
  
  // Fetch profile data for contact information
  console.log('👤 Fetching profile data for contact page...');
  const profileData = await getProfileData();
  console.log('✅ Profile data for contact page retrieved successfully');
  
  // Default content if page doesn't exist in database
  const defaultContent = `
# Contact Me

Have a question or want to work together? Feel free to get in touch with me using the contact form or through any of the channels below.
  `;
  
  // Get content from page or use default
  const content = page?.content || defaultContent;
  
  // Serialize the markdown content
  const mdxSource = await serializeMarkdown(content);
  
  return (
    <ContactContent 
      content={mdxSource}
      profile={profileData}
    />
  );
} 