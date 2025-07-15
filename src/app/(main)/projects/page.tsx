import React from 'react';
import { Metadata } from 'next';
import { getProjects } from '@/lib/services/project-service';
import { getPageBySlug } from '@/lib/services/page-service';
import EnhancedProjectsPage from './enhanced-projects';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Projects | Personal Website',
    description: 'Explore my portfolio of web development and programming projects',
  };
}

export default async function ProjectsPage() {
  // Fetch projects from the database
  const projects = await getProjects({
    limit: 10
  });
  
  // Fetch page data for the projects page
  const pageData = await getPageBySlug('projects');
  
  return <EnhancedProjectsPage projects={projects} pageData={pageData} />;
}