import React from 'react';
import HomePage from './home-page';
import { getPageBySlug } from '@/lib/services/page-service';
import { ProjectService } from '@/lib/services/project-service';
import { PostService } from '@/lib/services/post-service';
import { serializeMarkdown } from '@/lib/mdx';

// Force dynamic rendering to fetch fresh data from database at runtime
// This prevents Next.js from using stale static HTML generated at build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  const fallbackContent = "I am a **passionate Full Stack Developer** with extensive experience in building modern, scalable web applications that deliver exceptional user experiences. My expertise spans the complete development lifecycle, from conceptualization and design to deployment and optimization, using cutting-edge technologies including React, Next.js, TypeScript, Node.js, and cloud platforms. I am committed to writing clean, maintainable code while staying current with industry best practices and emerging technologies. Whether working on complex enterprise solutions or innovative startup projects, I bring a detail-oriented approach and genuine enthusiasm for creating digital solutions that make a meaningful impact. I welcome opportunities to collaborate on challenging projects and am always excited to discuss how technology can solve real-world problems.";
  
  // Get content from page or use simple fallback
  const content = page?.content || fallbackContent;
  
  // Serialize the markdown content
  const mdxSource = await serializeMarkdown(content);
  
  // Get hero heading from page data - use the database value if available
  const heroHeading = page?.heroHeading || "Building the Modern Web";
  
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


