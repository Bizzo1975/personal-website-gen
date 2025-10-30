import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { getPageBySlug, getAllPages } from '@/lib/services/page-service';
import { serializeMarkdown } from '@/lib/mdx';
import DynamicPage from './dynamic-page';

// Define the page props with params containing the slug
interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Define paths that have dedicated directories and should not be captured by [slug]
const DEDICATED_PATHS = ['about', 'blog', 'projects', 'contact', 'admin'];

// Generate static params for pages that exist in the database
export async function generateStaticParams() {
  const pages = await getAllPages();
  
  // Filter out the home page and other dedicated paths
  return pages
    .filter(page => page.slug !== 'home' && !DEDICATED_PATHS.includes(page.slug))
    .map(page => ({
      slug: page.slug,
    }));
}

// Generate metadata for the page
export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  // Redirect dedicated paths to their proper routes
  if (DEDICATED_PATHS.includes(resolvedParams.slug)) {
    notFound();
  }
  
  const page = await getPageBySlug(resolvedParams.slug);
  
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
  const resolvedParams = await params;
  // Redirect dedicated paths to their proper routes
  if (DEDICATED_PATHS.includes(resolvedParams.slug)) {
    notFound();
  }
  
  const page = await getPageBySlug(resolvedParams.slug);
  
  // If page doesn't exist, show 404
  if (!page) {
    notFound();
  }
  
  // Serialize the markdown content to MDX
  const mdxSource = await serializeMarkdown(page.content);
  
  // Pass the rendered content to the client component
  return <DynamicPage title={page.title} content={mdxSource} />;
} 