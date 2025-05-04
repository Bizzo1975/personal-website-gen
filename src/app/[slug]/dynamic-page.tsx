'use client';

import React from 'react';

interface DynamicPageProps {
  title: string;
  content: React.ReactNode; // MDX content is now a React node
}

export default function DynamicPage({ title, content }: DynamicPageProps) {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {content}
      </div>
    </div>
  );
} 