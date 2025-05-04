// fix-all-issues.js
// Comprehensive script to fix theme switching, layout problems, and other formatting issues

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Utility functions
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function updateFileIfNeeded(filePath, updater) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return false;
    }
    
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const updatedContent = updater(originalContent);
    
    if (originalContent !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Updated ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

// Fix ThemeProvider and theme switching
function fixThemeProvider() {
  console.log('Fixing theme provider and switching...');
  
  // Fix layout.tsx file - ensure ThemeProvider is properly placed
  const layoutFile = path.resolve(process.cwd(), 'src/app/layout.tsx');
  updateFileIfNeeded(layoutFile, (content) => {
    // Ensure we're not wrapping ThemeProvider inside ThemeProvider
    if (content.includes('<ThemeProvider>') && content.includes('<Providers>')) {
      // Move ThemeProvider outside of Providers if it's inside
      return content.replace(
        /<Providers>([\s\S]*?)<ThemeProvider>([\s\S]*?)<\/ThemeProvider>([\s\S]*?)<\/Providers>/,
        `<ThemeProvider>
          <Providers>$1$2$3</Providers>
        </ThemeProvider>`
      );
    }
    return content;
  });
  
  // Fix providers.tsx - ensure it imports ThemeProvider from next-themes
  const providersFile = path.resolve(process.cwd(), 'src/app/providers.tsx');
  updateFileIfNeeded(providersFile, (content) => {
    if (!content.includes('next-themes')) {
      const updatedContent = `'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </NextThemesProvider>
    </SessionProvider>
  );
}`;
      
      return updatedContent;
    }
    
    return content;
  });
  
  // Ensure ThemeProvider.tsx is not wrapping another provider if providers.tsx has theme included
  const themeProviderFile = path.resolve(process.cwd(), 'src/components/ThemeProvider.tsx');
  if (fs.existsSync(themeProviderFile)) {
    const providersContent = fs.readFileSync(providersFile, 'utf8');
    
    if (providersContent.includes('next-themes')) {
      // If providers.tsx already has ThemeProvider, modify ThemeProvider.tsx to just pass children
      updateFileIfNeeded(themeProviderFile, (content) => {
        return `'use client';

import { ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}`;
      });
    }
  }
}

// Fix CSS imports and styling issues
function fixCssStyling() {
  console.log('Fixing CSS styling issues...');
  
  // Ensure globals.css has the required styles
  const globalsCssFile = path.resolve(process.cwd(), 'src/styles/globals.css');
  updateFileIfNeeded(globalsCssFile, (content) => {
    if (!content.includes('.hover-card')) {
      // Add missing hover effect for cards
      return content + `

/* Add hover effects for cards */
.hover-card {
  @apply transition-all duration-300 ease-in-out;
}

.hover-card:hover {
  @apply transform -translate-y-1 shadow-tech-lg;
}

/* Fix dark mode styles */
.dark .bg-white {
  @apply bg-slate-900;
}

.dark .text-gray-800 {
  @apply text-gray-200;
}

.dark .border-gray-200 {
  @apply border-gray-700;
}

/* Fix any missing Tailwind classes */
@layer utilities {
  .bg-tech-light {
    @apply bg-slate-50;
  }
  
  .bg-tech-dark {
    @apply bg-slate-900;
  }
  
  .shadow-tech {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  }
  
  .shadow-tech-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
  }
}
`;
    }
    return content;
  });
  
  // Update Card.tsx to ensure card styling is consistent
  const cardFile = path.resolve(process.cwd(), 'src/components/Card.tsx');
  updateFileIfNeeded(cardFile, (content) => {
    if (!content.includes('shadow-tech-lg')) {
      return content.replace(
        /const variantClasses = {([^}]+)}/s,
        `const variantClasses = {
    default: 'shadow-tech',
    elevated: 'shadow-tech-lg',
    bordered: 'border border-slate-200 dark:border-slate-800',
  }`
      );
    }
    return content;
  });
  
  // Make sure Badge component has proper styling
  const badgeFile = path.resolve(process.cwd(), 'src/components/Badge.tsx');
  if (fs.existsSync(badgeFile)) {
    updateFileIfNeeded(badgeFile, (content) => {
      if (!content.includes('bg-primary-100')) {
        return content.replace(
          /const variantClasses = {([^}]+)}/s,
          `const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
    secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  }`
        );
      }
      return content;
    });
  }
  
  // Update home page styling
  const homePageFile = path.resolve(process.cwd(), 'src/app/home-page.tsx');
  updateFileIfNeeded(homePageFile, (content) => {
    if (!content.includes('hover-card')) {
      return content.replace(
        /<Card key={project.id} variant="elevated">/g,
        '<Card key={project.id} variant="elevated" className="hover-card">'
      ).replace(
        /<Card key={post.id} variant="bordered">/g,
        '<Card key={post.id} variant="bordered" className="hover-card">'
      );
    }
    return content;
  });
}

// Fix about page not loading
function fixAboutPage() {
  console.log('Checking and fixing about page...');
  
  const aboutDirPath = path.resolve(process.cwd(), 'src/app/about');
  const aboutPagePath = path.join(aboutDirPath, 'page.tsx');
  const aboutClientPath = path.join(aboutDirPath, 'about-page.tsx');
  
  // Create about directory if it doesn't exist
  ensureDirectoryExists(aboutDirPath);
  
  // Create server-side about page component if it doesn't exist
  if (!fs.existsSync(aboutPagePath)) {
    console.log('Creating missing about page...');
    
    const aboutPageContent = `import React from 'react';
import { Metadata } from 'next';
import { getPageBySlug } from '@/lib/services/page-service';
import { serializeMarkdown } from '@/lib/mdx';
import AboutPage from './about-page';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('about');
  
  return {
    title: page?.title || 'About',
    description: page?.metaDescription || 'About me and my background',
  };
}

export default async function Page() {
  // Get the about page content
  const page = await getPageBySlug('about');
  
  if (!page) {
    return <div>Page not found</div>;
  }
  
  // Serialize the markdown content to MDX
  const mdxSource = await serializeMarkdown(page.content);
  
  // Pass data to the client component
  return <AboutPage content={mdxSource} />;
}`;
    
    fs.writeFileSync(aboutPagePath, aboutPageContent);
    console.log('✅ Created about page');
  }
  
  // Create client-side about page component if it doesn't exist
  if (!fs.existsSync(aboutClientPath)) {
    console.log('Creating missing about client component...');
    
    const aboutClientContent = `'use client';

import React from 'react';
import MarkdownContent from '@/components/MarkdownContent';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';

interface AboutPageProps {
  content: MDXRemoteSerializeResult | any;
}

export default function AboutPage({ content }: AboutPageProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="prose prose-slate dark:prose-invert">
        <MarkdownContent content={content} />
      </div>
    </div>
  );
}`;
    
    fs.writeFileSync(aboutClientPath, aboutClientContent);
    console.log('✅ Created about client component');
  }
}

// Fix blog and project pages
function fixContentPages() {
  console.log('Checking and fixing blog and project pages...');
  
  // Fix blog pages
  const blogDirPath = path.resolve(process.cwd(), 'src/app/blog');
  ensureDirectoryExists(blogDirPath);
  
  const blogPagePath = path.join(blogDirPath, 'page.tsx');
  if (!fs.existsSync(blogPagePath)) {
    const blogPageContent = `import React from 'react';
import { Metadata } from 'next';
import { getPosts } from '@/lib/services/post-service';
import BlogPage from './blog-page';

export const metadata: Metadata = {
  title: 'Blog | John Doe',
  description: 'Articles and thoughts on web development, tech, and more',
};

export default async function Page() {
  // Get all blog posts
  let posts = [];
  try {
    posts = await getPosts({ sort: { date: -1 } });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
  }
  
  return <BlogPage posts={posts} />;
}`;
    
    fs.writeFileSync(blogPagePath, blogPageContent);
    console.log('✅ Created blog page');
  }
  
  // Fix blog client component
  const blogClientPath = path.join(blogDirPath, 'blog-page.tsx');
  if (!fs.existsSync(blogClientPath)) {
    const blogClientContent = `'use client';

import '@/styles/globals.css';
import React from 'react';
import Link from 'next/link';
import Card, { CardBody } from '@/components/Card';
import Badge from '@/components/Badge';

interface BlogPageProps {
  posts: {
    id: string;
    title: string;
    date: string;
    excerpt: string;
    tags: string[];
    slug: string;
  }[];
}

export default function BlogPage({ posts = [] }: BlogPageProps) {
  // Default blog posts if none provided from database
  const defaultPosts = [
    {
      id: '1',
      title: 'Getting Started with Next.js',
      date: 'January 15, 2023',
      excerpt: 'Learn how to build modern websites with Next.js, from setup to deployment.',
      tags: ['Next.js', 'Tutorial'],
      slug: '/blog/getting-started-with-nextjs'
    },
    {
      id: '2',
      title: '10 Tailwind CSS Tips for Better Designs',
      date: 'February 3, 2023',
      excerpt: 'Improve your UI design skills with these practical Tailwind CSS techniques.',
      tags: ['CSS', 'Design'],
      slug: '/blog/tailwind-css-tips'
    }
  ];

  // Use provided posts or default to samples
  const displayedPosts = posts.length > 0 ? posts : defaultPosts;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Blog</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Thoughts, tutorials, and insights on web development
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        {displayedPosts.map((post) => (
          <Card key={post.id} variant="bordered" className="hover-card">
            <CardBody>
              <Link href={post.slug} className="block space-y-4">
                <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-400">{post.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{post.date}</p>
                <p className="text-slate-600 dark:text-slate-300">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant={index % 2 === 0 ? 'primary' : 'info'} size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Link>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}`;
    
    fs.writeFileSync(blogClientPath, blogClientContent);
    console.log('✅ Created blog client component');
  }
  
  // Fix project pages
  const projectsDirPath = path.resolve(process.cwd(), 'src/app/projects');
  ensureDirectoryExists(projectsDirPath);
  
  const projectsPagePath = path.join(projectsDirPath, 'page.tsx');
  if (!fs.existsSync(projectsPagePath)) {
    const projectsPageContent = `import React from 'react';
import { Metadata } from 'next';
import { getProjects } from '@/lib/services/project-service';
import ProjectsPage from './projects-page';

export const metadata: Metadata = {
  title: 'Projects | John Doe',
  description: 'Portfolio of my development projects and work',
};

export default async function Page() {
  // Get all projects
  let projects = [];
  try {
    projects = await getProjects();
  } catch (error) {
    console.error('Error fetching projects:', error);
  }
  
  return <ProjectsPage projects={projects} />;
}`;
    
    fs.writeFileSync(projectsPagePath, projectsPageContent);
    console.log('✅ Created projects page');
  }
  
  // Fix projects client component
  const projectsClientPath = path.join(projectsDirPath, 'projects-page.tsx');
  if (!fs.existsSync(projectsClientPath)) {
    const projectsClientContent = `'use client';

import '@/styles/globals.css';
import React from 'react';
import Link from 'next/link';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Badge from '@/components/Badge';

interface ProjectsPageProps {
  projects: {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    link?: string;
    slug?: string;
  }[];
}

export default function ProjectsPage({ projects = [] }: ProjectsPageProps) {
  // Default projects if none provided from database
  const defaultProjects = [
    {
      id: '1',
      title: 'E-Commerce Platform',
      description: 'A full-featured online store with payment integration, user authentication, and admin dashboard.',
      technologies: ['React', 'Node.js', 'MongoDB'],
      slug: '/projects/ecommerce-platform'
    },
    {
      id: '2',
      title: 'Task Management App',
      description: 'A productivity tool for managing tasks, projects, and team collaboration with real-time updates.',
      technologies: ['Next.js', 'tRPC', 'Prisma'],
      slug: '/projects/task-management-app'
    },
    {
      id: '3',
      title: 'AI Image Generator',
      description: 'An application that generates images from text descriptions using AI models and APIs.',
      technologies: ['Python', 'TensorFlow', 'FastAPI'],
      slug: '/projects/ai-image-generator'
    }
  ];

  // Use provided projects or default to samples
  const displayedProjects = projects.length > 0 ? projects : defaultProjects;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Projects</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          A collection of my development work and side projects
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedProjects.map((project) => (
          <Card key={project.id} variant="elevated" className="hover-card">
            <CardHeader>
              <h3 className="text-xl font-semibold">{project.title}</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech, index) => (
                    <Badge key={index} variant={index % 3 === 0 ? 'primary' : index % 3 === 1 ? 'secondary' : 'info'}>
                      {tech}
                    </Badge>
                  ))}
                </div>
                <div className="pt-2">
                  <Link 
                    href={project.slug || '#'} 
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                  >
                    View Project →
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}`;
    
    fs.writeFileSync(projectsClientPath, projectsClientContent);
    console.log('✅ Created projects client component');
  }
}

// Fix all issues
async function main() {
  console.log('🔧 Starting comprehensive fixes for the website...');
  
  // Step 1: Fix Theme Provider and switching
  fixThemeProvider();
  
  // Step 2: Fix CSS and styling issues
  fixCssStyling();
  
  // Step 3: Fix About page
  fixAboutPage();
  
  // Step 4: Fix Blog and Projects pages
  fixContentPages();
  
  // Final step: Rebuild the CSS
  console.log('\n🔄 Rebuilding CSS...');
  try {
    execSync('npx tailwindcss --input ./src/styles/globals.css --output ./src/styles/output.css', { stdio: 'inherit' });
    console.log('✅ CSS rebuilt successfully');
  } catch (error) {
    console.error('❌ Error rebuilding CSS:', error.message);
  }
  
  console.log('\n✨ All fixes have been applied. Restart your Next.js development server to see the changes.');
  console.log('You can restart by running: npm run dev');
}

main().catch(console.error); 