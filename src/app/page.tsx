import React from 'react';
import { Metadata } from 'next';
import { getPageBySlug } from '@/lib/services/page-service';
import { serializeMarkdown } from '@/lib/mdx';
import HomePage from './home-page';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('home');
  
  return {
    title: page?.title || 'Home',
    description: page?.metaDescription || 'Personal website and portfolio',
  };
}

export default async function Page() {
  const page = await getPageBySlug('home');
  
  if (!page) {
    return <div>Page not found</div>;
  }
  
  // Serialize the markdown content to MDX
  const mdxSource = await serializeMarkdown(page.content);
  
  // Pass the rendered content to the client component
  return <HomePage content={mdxSource} />;
} 