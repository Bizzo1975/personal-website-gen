import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { getPageBySlug, getAllPages } from '@/lib/services/page-service';
import { serializeMarkdown } from '@/lib/mdx';
import DynamicPage from './dynamic-page';

// Define the page props with params containing the slug
interface PageProps {
  params: {
    slug: string;
  };
}

// Generate static params for pages that exist in the database
export async function generateStaticParams() {
  const pages = await getAllPages();
  
  // Filter out the home page as it's handled by the root route
  return pages
    .filter(page => page.slug !== 'home')
    .map(page => ({
      slug: page.slug,
    }));
}

// Generate metadata for the page
export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const page = await getPageBySlug(params.slug);
  
  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }
  
  return {
    title: page.title,
    description: page.metaDescription,
  };
}

// The page component that fetches and renders the content
export default async function Page({ params }: PageProps) {
  const page = await getPageBySlug(params.slug);
  
  // If page doesn't exist, show 404
  if (!page) {
    notFound();
  }
  
  // Serialize the markdown content to MDX
  const mdxSource = await serializeMarkdown(page.content);
  
  // Pass the rendered content to the client component
  return <DynamicPage title={page.title} content={mdxSource} />;
} 