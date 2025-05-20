import React from 'react';
import { Metadata } from 'next';
import { getProjects } from '@/lib/services/project-service';
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
  
  return <ProjectsClientPage projects={projects} />;
}