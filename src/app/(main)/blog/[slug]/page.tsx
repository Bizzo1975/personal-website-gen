'use client';

import React from 'react';
import Link from 'next/link';

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  // In a real application, you would fetch the blog post data based on the slug
  const post = {
    title: 'Getting Started with Next.js and TypeScript',
    date: 'November 15, 2023',
    author: 'John Doe',
    content: `
      <p>
        Next.js has emerged as one of the most popular React frameworks for building modern web applications. Combined with TypeScript, it provides a powerful and type-safe development experience.
      </p>
      
      <h2>Setting Up a New Project</h2>
      
      <p>
        Creating a new Next.js project with TypeScript is straightforward. You can use the following command:
      </p>
      
      <pre><code>npx create-next-app@latest my-app --typescript</code></pre>
      
      <p>
        This will set up a new project with all the necessary configurations for TypeScript.
      </p>
      
      <h2>Key Features of Next.js</h2>
      
      <ul>
        <li><strong>Server-Side Rendering (SSR)</strong>: Render pages on the server for improved SEO and performance.</li>
        <li><strong>Static Site Generation (SSG)</strong>: Pre-render pages at build time for even better performance.</li>
        <li><strong>API Routes</strong>: Create API endpoints as part of your Next.js application.</li>
        <li><strong>File-based Routing</strong>: Create routes based on the file structure in your pages directory.</li>
        <li><strong>Image Optimization</strong>: Automatically optimize images for better performance.</li>
      </ul>
      
      <h2>TypeScript Benefits</h2>
      
      <p>
        Adding TypeScript to your Next.js project provides several advantages:
      </p>
      
      <ul>
        <li><strong>Type Safety</strong>: Catch errors during development rather than at runtime.</li>
        <li><strong>Better IDE Support</strong>: Enjoy improved autocompletion and documentation.</li>
        <li><strong>Easier Refactoring</strong>: Make changes with confidence, knowing the type system will catch potential issues.</li>
        <li><strong>Self-documenting Code</strong>: Types serve as documentation for how components and functions should be used.</li>
      </ul>
      
      <h2>Conclusion</h2>
      
      <p>
        Next.js with TypeScript provides a solid foundation for building modern web applications. With its robust feature set and type safety, you can develop with confidence and deliver high-quality applications to your users.
      </p>
    `,
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Link href="/blog" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-6 inline-block">
        &larr; Back to all posts
      </Link>
      
      <article>
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-8">
          <span>{post.date}</span>
          <span className="mx-2">&bull;</span>
          <span>By {post.author}</span>
        </div>
        
        <div 
          className="prose dark:prose-invert max-w-none prose-headings:text-black dark:prose-headings:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-p:text-gray-700 dark:prose-p:text-gray-300"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
} 