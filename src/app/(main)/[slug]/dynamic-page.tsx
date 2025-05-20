'use client';

import React from 'react';
import { MDXRemote } from 'next-mdx-remote';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';

interface DynamicPageProps {
  title: string;
  content: MDXRemoteSerializeResult;
}

export default function DynamicPage({ title, content }: DynamicPageProps) {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <MDXRemote {...content} />
      </div>
    </div>
  );
} 