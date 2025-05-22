import React from 'react';
import { getPosts } from '@/lib/services/post-service';
import BlogContent from './blog-content';

export const metadata = {
  title: 'Blog - Personal Website',
  description: 'Read my latest articles and thoughts on web development, design, and technology.',
};

export default async function BlogPage() {
  console.log('🔄 Fetching blog posts...');
  
  // Get blog posts from the database
  const posts = await getPosts({ limit: 20 });
  
  if (posts.length > 0) {
    console.log(`📝 Retrieved ${posts.length} blog posts`);
  } else {
    console.log('❓ No blog posts found, will use default content');
  }
  
  // Render the page
  return <BlogContent posts={posts} />;
}

 