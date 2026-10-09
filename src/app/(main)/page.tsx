import React from 'react';
import { Metadata } from 'next';
import HomePage from './home-page';
import { getPageBySlug } from '@/lib/services/page-service';
import { ProjectService } from '@/lib/services/project-service';
import { PostService } from '@/lib/services/post-service';
import { serializeMarkdown } from '@/lib/mdx';

// Force dynamic rendering to fetch fresh data from database at runtime
// This prevents Next.js from using stale static HTML generated at build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const HOME_TITLE = 'Will Work For Lunch | Jon Keck';
const HOME_DESCRIPTION =
  'Jon Keck builds things, runs Kecktech IT in Park City, Kansas, and writes about what he builds.';
const HOME_FALLBACK_CONTENT =
  "I'm Jon Keck. I build things, I run Kecktech IT in Park City, Kansas, and I write here about what I build and what I learn along the way.";

export async function generateMetadata(): Promise<Metadata> {
  let page = null;
  try {
    page = await getPageBySlug('home');
  } catch {
    page = null;
  }
  // Ignore leftover template values ("Home - Personal Website" etc.) in the CMS row.
  const isTemplate = (value?: string) =>
    !value || /personal website|full.stack developer/i.test(value);
  const dbTitle = page?.title?.trim();
  const dbDescription = page?.metaDescription?.trim();
  return {
    title: isTemplate(dbTitle) ? HOME_TITLE : dbTitle,
    description: isTemplate(dbDescription) ? HOME_DESCRIPTION : dbDescription,
    alternates: {
      types: { 'application/rss+xml': '/rss.xml' },
    },
  };
}

export default async function Page() {
  // Fetch the home page content from database
  console.log('🔄 Fetching Home page content...');
  let page = null;
  try {
    page = await getPageBySlug('home');
  } catch (error) {
    console.warn('Failed to fetch home page from database:', error);
  }
  
  // Fetch featured projects and recent posts with error handling
  console.log('🔄 Fetching featured projects and recent posts...');
  let featuredProjects: Awaited<ReturnType<typeof ProjectService.getFeaturedProjects>> = [];
  let publishedPosts: Awaited<ReturnType<typeof PostService.getAllPosts>> = [];
  
  try {
    [featuredProjects, publishedPosts] = await Promise.all([
      ProjectService.getFeaturedProjects().catch(err => {
        console.warn('Failed to fetch featured projects:', err);
        return [];
      }),
      PostService.getAllPosts().catch(err => {
        console.warn('Failed to fetch posts:', err);
        return [];
      })
    ]);
  } catch (error) {
    console.warn('Failed to fetch data during build:', error);
    // Continue with empty arrays if database is not available
  }
  
  // Transform projects to match HomePage interface
  const projects = featuredProjects.map(project => ({
    id: project.id,
    title: project.title,
    description: project.description,
    technologies: project.technologies,
    image: project.image,
    link: project.live_demo,
    slug: project.slug
  }));
  
  // Transform posts to match HomePage interface, take only first 6 for homepage
  const blogPosts = publishedPosts.slice(0, 6).map(post => ({
    id: post.id,
    title: post.title,
    date: post.date.toISOString(),
    excerpt: post.excerpt || '',
    tags: post.tags,
    slug: post.slug,
    featuredImage: post.featuredImage
  }));
  
  // Simple fallback if no content exists in database
  const fallbackContent = HOME_FALLBACK_CONTENT;
  
  // Get content from page or use simple fallback
  const content = page?.content || fallbackContent;
  
  // Serialize the markdown content
  const mdxSource = await serializeMarkdown(content);
  
  // Get hero heading from page data - use the database value if available
  const heroHeading = page?.heroHeading || "I build things that work.";
  
  console.log('📄 Page data:', {
    heroHeading: heroHeading,
    headerTitle: page?.headerTitle,
    headerSubtitle: page?.headerSubtitle,
    hasContent: !!content,
    projectsCount: projects.length,
    postsCount: blogPosts.length
  });
  
  return (
    <HomePage 
      content={mdxSource}
      heroHeading={heroHeading}
      headerTitle={page?.headerTitle}
      headerSubtitle={page?.headerSubtitle}
      projects={projects}
      blogPosts={blogPosts}
    />
  );
}


