import React from 'react';
import Link from 'next/link';
import { PostData } from '@/lib/services/post-service';

interface BlogPostItemProps {
  post: PostData;
}

/**
 * Server Component for rendering a single blog post item
 * No client-side interactivity is needed for this component
 */
export default function BlogPostItem({ post }: BlogPostItemProps) {
  return (
    <article className="border dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800">
      <h2 className="text-2xl font-semibold mb-2">
        <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
          {post.title}
        </Link>
      </h2>
      <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4">
        <span>{typeof post.date === 'string' ? post.date : post.date.toLocaleDateString()}</span>
        <span className="mx-2">&bull;</span>
        <span>{post.readTime} min read</span>
      </div>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        {post.excerpt}
      </p>
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag, tagIndex) => (
          <span 
            key={tagIndex} 
            className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4">
        <Link 
          href={`/blog/${post.slug}`} 
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          aria-label={`Read more about ${post.title}`}
        >
          Read more &rarr;
        </Link>
      </div>
    </article>
  );
}
