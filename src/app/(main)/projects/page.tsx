import React from 'react';
import { Metadata } from 'next';
import { getProjects, ProjectData } from '@/lib/services/project-service';
import { getPageBySlug, PageData } from '@/lib/services/page-service';
import EnhancedProjectsPage from './enhanced-projects';

// Force dynamic rendering to fetch fresh data from database at runtime
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Projects | Personal Website',
    description: 'Explore my portfolio of web development and programming projects',
  };
}

export default async function ProjectsPage() {
  // Fetch projects from the database with error handling
  let projects: ProjectData[] = [];
  try {
    projects = await getProjects({
      limit: 10
    });
  } catch (error) {
    console.warn('Failed to fetch projects during build:', error);
    // Continue with empty array if database is not available
  }
  
  // Fetch page data for the projects page with error handling
  let pageData: PageData | null = null;
  try {
    pageData = await getPageBySlug('projects');
  } catch (error) {
    console.warn('Failed to fetch projects page data during build:', error);
    // Continue with null if database is not available
  }
  
  return <EnhancedProjectsPage projects={projects} pageData={pageData} />;
}