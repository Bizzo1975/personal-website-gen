import React from 'react';
import { getPosts } from '@/lib/services/post-service';
import { getPageBySlug } from '@/lib/services/page-service';
import BlogContent from './blog-content';

export const metadata = {
  title: 'Blog - Personal Website',
  description: 'Read my latest articles and thoughts on web development, design, and technology.',
};

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BlogPage() {
  console.log('🔄 Fetching blog posts...');
  
  // Get blog posts from the database with increased limit to ensure all posts are retrieved
  const posts = await getPosts({ limit: 50 });
  
  // Get blog page data from the database
  const pageData = await getPageBySlug('blog');
  
  if (posts.length > 0) {
    console.log(`📝 Retrieved ${posts.length} blog posts`);
    console.log('📝 Posts:', posts.map(p => ({ id: p.id, title: p.title, published: p.published })));
  } else {
    console.log('❓ No blog posts found, will use default content');
  }
  
  // Render the page
  return <BlogContent posts={posts} pageData={pageData} />;
}

 