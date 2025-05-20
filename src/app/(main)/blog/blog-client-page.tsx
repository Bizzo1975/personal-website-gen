'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BlogSearchBar from '@/components/BlogSearchBar';
import { PostData } from '@/lib/services/post-service';
import BlogPostItem from './blog-post-item';

interface BlogClientPageProps {
  initialPosts: PostData[];
}

/**
 * Client component for handling blog search interactions
 * This approach allows most of the component to be server-rendered
 * while keeping only the interactive parts on the client
 */
export default function BlogClientPage({ initialPosts }: BlogClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Get the initial query from URL
  const initialQuery = searchParams.get('q') || '';
  
  // Filter blog posts based on search query
  const filteredPosts = initialQuery
    ? initialPosts.filter(post => 
        post.title.toLowerCase().includes(initialQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(initialQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(initialQuery.toLowerCase()))
      )
    : initialPosts;

  // Update URL with search query
  const handleSearch = (query: string) => {
    startTransition(() => {
      // Create a new URL with the search params
      // Convert ReadonlyURLSearchParams to URLSearchParams correctly
      const params = new URLSearchParams();
      // Copy all existing parameters
      searchParams.forEach((value, key) => {
        params.set(key, value);
      });
      
      // Update the query parameter
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }
      
      // Replace the URL without reloading the page
      router.replace(`/blog${params.toString() ? `?${params.toString()}` : ''}`);
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>
      
      {/* Search bar is a client component */}
      <BlogSearchBar onSearch={handleSearch} initialQuery={initialQuery} />
      
      {/* Conditional rendering based on search results */}
      {initialQuery && (
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          {filteredPosts.length === 0 
            ? `No results found for "${initialQuery}"`
            : `Found ${filteredPosts.length} result${filteredPosts.length === 1 ? '' : 's'} for "${initialQuery}"`}
        </p>
      )}
      
      {/* Show empty state or posts */}
      {filteredPosts.length === 0 && !initialQuery ? (
        <div className="py-12 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">No blog posts found.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {/* Use the optimized server component for each post */}
          {filteredPosts.map((post) => (
            <BlogPostItem key={post.id} post={post} />
          ))}
        </div>
      )}
      
      {/* Loading indicator */}
      {isPending && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg">
          Updating results...
        </div>
      )}
    </div>
  );
}
