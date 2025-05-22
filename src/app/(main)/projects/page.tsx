import React from 'react';
import { Metadata } from 'next';
import { getProjects } from '@/lib/services/project-service';
import { getPageBySlug } from '@/lib/services/page-service';
import ProjectsClientPage from './projects-client-page';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Projects | Personal Website',
    description: 'Explore my portfolio of web development and programming projects',
  };
}

export default async function ProjectsPage() {
  // Fetch projects from the API
  const projects = await getProjects({
    limit: 10,
    sort: { updatedAt: -1 }
  });
  
  // Fetch page data for the projects page
  const pageData = await getPageBySlug('projects');
  
  return <ProjectsClientPage projects={projects} pageData={pageData} />;
}