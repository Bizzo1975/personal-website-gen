import React from 'react';
import HomePage from './home-page';
import { getPageBySlug } from '@/lib/services/page-service';
import { serializeMarkdown } from '@/lib/mdx';

export default async function Page() {
  // Fetch the home page content from database
  console.log('🔄 Fetching Home page content...');
  const page = await getPageBySlug('home');
  
  // Simple fallback if no content exists in database
  const fallbackContent = "I am a **Full Stack Developer** with expertise in modern web technologies. I specialize in creating high-performance, scalable applications using React, Next.js, Node.js, and cloud technologies.";
  
  // Get content from page or use simple fallback
  const content = page?.content || fallbackContent;
  
  // Serialize the markdown content
  const mdxSource = await serializeMarkdown(content);
  
  // Get hero heading from page data - use the database value if available
  const heroHeading = page?.heroHeading || page?.hero_heading || "Building the Modern Web";
  
  console.log('📄 Page data:', {
    heroHeading: heroHeading,
    headerTitle: page?.headerTitle || page?.header_title,
    headerSubtitle: page?.headerSubtitle || page?.header_subtitle,
    hasContent: !!content
  });
  
  return (
    <HomePage 
      content={mdxSource}
      heroHeading={heroHeading}
      headerTitle={page?.headerTitle || page?.header_title}
      headerSubtitle={page?.headerSubtitle || page?.header_subtitle}
      projects={[]}
      blogPosts={[]}
    />
  );
}


