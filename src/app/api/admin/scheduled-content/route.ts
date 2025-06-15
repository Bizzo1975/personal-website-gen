import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect, { isMockMode } from '@/lib/db';
import Post from '@/lib/models/Post';
import Project from '@/lib/models/Project';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // For now, return mock data since the models don't have scheduledDate fields
    // This feature would need to be properly implemented by adding scheduledDate to the models
    const mockScheduledContent = [
      {
        id: '1',
        title: 'Getting Started with Next.js 14',
        slug: 'getting-started-nextjs-14',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        type: 'post',
        author: 'Admin User',
        excerpt: 'A comprehensive guide to the latest features in Next.js 14 and how to get started.'
      },
      {
        id: '2',
        title: 'Advanced TypeScript Patterns',
        slug: 'advanced-typescript-patterns',
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        type: 'post',
        author: 'Admin User',
        excerpt: 'Exploring advanced TypeScript patterns for better code organization and type safety.'
      },
      {
        id: '3',
        title: 'E-commerce Platform Project',
        slug: 'ecommerce-platform-project',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        type: 'project',
        author: 'Admin User',
        excerpt: 'A full-stack e-commerce platform built with modern technologies.'
      }
    ];

    return NextResponse.json(mockScheduledContent);

  } catch (error) {
    console.error('Scheduled content API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled content' },
      { status: 500 }
    );
  }
} 

