'use client';

import React, { useState, useEffect } from 'react';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';

interface DynamicPageProps {
  title: string;
  content: MDXRemoteSerializeResult;
}

export default function DynamicPage({ title, content }: DynamicPageProps) {
  const [MDXRemote, setMDXRemote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMDXRemote = async () => {
      try {
        const { MDXRemote: MDXRemoteComponent } = await import('next-mdx-remote');
        setMDXRemote(() => MDXRemoteComponent);
      } catch (error) {
        console.warn('Failed to load MDXRemote:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMDXRemote();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {MDXRemote ? (
          <MDXRemote {...content} />
        ) : (
          <p>Content could not be loaded.</p>
        )}
      </div>
    </div>
  );
} 