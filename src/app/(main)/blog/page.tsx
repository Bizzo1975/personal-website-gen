import React from 'react';
import Link from 'next/link';
import { getPosts, PostData } from '@/lib/services/post-service';
import BlogClientPage from './blog-client-page';

export async function generateMetadata() {
  return {
    title: 'Blog | Personal Website',
    description: 'Read my latest thoughts, tutorials, and insights on web development and technology.',
  };
}

export default async function BlogPage() {
  // Fetch posts from the API with pagination and sorting
  const posts = await getPosts({
    published: true,
    limit: 10,
    sort: { date: -1 }
  });

  return <BlogClientPage initialPosts={posts} />;
}

 