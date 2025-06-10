import React from 'react';
import { Metadata } from 'next';
import { getPageBySlug } from '@/lib/services/page-service';
import { serializeMarkdown } from '@/lib/mdx';
import { getProjects, ProjectData } from '@/lib/services/project-service';
import { getPosts, PostData } from '@/lib/services/post-service';
import HomePage from './home-page';
import MarkdownContent from '@/components/MarkdownContent';

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

  // Serialize the markdown content to MDX with error handling
  let mdxSource;
  try {
    mdxSource = await serializeMarkdown(page.content);
  } catch (error) {
    console.error('Error serializing markdown:', error);
    // Create a fallback MDX source
    mdxSource = {
      compiledSource: `
        function _createMdxContent() {
          return React.createElement('div', null, 
            React.createElement('h1', null, 'Welcome to My Portfolio'),
            React.createElement('p', null, "I'm a full-stack developer specializing in modern web technologies."),
            React.createElement('p', null, 'Feel free to explore my projects and blog posts, or get in touch via the contact page.')
          );
        }
        function MDXContent(props = {}) {
          return _createMdxContent(props);
        }
        return { default: MDXContent };
      `,
      frontmatter: {},
    };
  }

  // Get featured projects with proper error handling
  let projects: ProjectData[] = [];
  try {
    console.log('🔍 Fetching featured projects for homepage...');
    projects = await getProjects({ featured: true, limit: 3 });
    console.log('✅ Featured projects fetched:', projects.length);
  } catch (error) {
    console.error('❌ Error fetching projects for homepage:', error);
    projects = [];
  }

  // Get recent blog posts with proper error handling
  let blogPosts: PostData[] = [];
  try {
    console.log('🔍 Fetching recent blog posts for homepage...');
    blogPosts = await getPosts({ limit: 2 });
    console.log('✅ Blog posts fetched:', blogPosts.length);
  } catch (error) {
    console.error('❌ Error fetching blog posts for homepage:', error);
    blogPosts = [];
  }

  // Pass all data to the client component
  return <HomePage 
    content={mdxSource}
    projects={projects}
    blogPosts={blogPosts}
    heroHeading={page.heroHeading || "Building the Modern Web"}
  />;
} 