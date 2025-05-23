import React from 'react';
import { Metadata } from 'next';
import { getPageBySlug } from '@/lib/services/page-service';
import { serializeMarkdown } from '@/lib/mdx';
import { getProjects, ProjectData } from '@/lib/services/project-service';
import { getPosts, PostData } from '@/lib/services/post-service';
import HomePage from './home-page';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('home');
  
  return {
    title: page?.title || 'Home',
    description: page?.metaDescription || 'Personal website and portfolio',
  };
}

export default async function Page() {
  // Get the home page content
  const page = await getPageBySlug('home');
  
  if (!page) {
    return <div>Page not found</div>;
  }
  
  // Serialize the markdown content to MDX
  const mdxSource = await serializeMarkdown(page.content);
  
  // Get featured projects
  let projects: ProjectData[] = [];
  try {
    projects = await getProjects({ featured: true, limit: 3 });
  } catch (error) {
    console.error('Error fetching projects:', error);
  }
  
  // Get recent blog posts
  let blogPosts: PostData[] = [];
  try {
    blogPosts = await getPosts({ limit: 2, sort: { date: -1 } });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
  }
  
  // Pass all data to the client component
  return <HomePage 
    content={mdxSource}
    projects={projects}
    blogPosts={blogPosts}
    heroHeading={page.heroHeading || "Building the Modern Web"}
  />;
} 