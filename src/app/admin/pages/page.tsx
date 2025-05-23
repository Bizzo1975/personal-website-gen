'use client'
import '@/styles/globals.css';
;

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Card, { CardBody } from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import { useRouter } from 'next/navigation';

interface PageData {
  _id: string;
  name: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  updatedAt: Date;
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPages = async () => {
      try {
        console.log('Fetching pages from API...');
        const response = await fetch('/api/pages', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          console.error('API response not OK:', response.status, response.statusText);
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const fetchedPages = await response.json();
        console.log('Fetched pages:', fetchedPages);
        
        if (Array.isArray(fetchedPages)) {
          setPages(fetchedPages);
        } else {
          console.error('Expected an array of pages but got:', fetchedPages);
          setError('Invalid data format received from server');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pages:', err);
        setError('Failed to load pages. Please check console for details.');
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const handleDeletePage = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      try {
        const response = await fetch(`/api/pages/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete page');
        }

        setPages(pages.filter(page => page._id !== id));
      } catch (err: any) {
        alert(err.message || 'Failed to delete page');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading pages...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Pages Management</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4 sm:mt-0">
          <Button onClick={() => router.push('/admin/pages/new')}>
            <span className="mr-2">+</span>
            Create New Page
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1">
        {pages.map((page) => (
          <Card key={page._id} variant="default">
            <CardBody>
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">{page.title}</h2>
                  <div className="mb-2">
                    <Badge variant="secondary" size="sm">{page.name}</Badge>
                    <span className="ml-2 text-sm text-gray-500">/{page.slug}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Last updated: {new Date(page.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center mt-4 md:mt-0">
                  <Link 
                    href={page.slug === 'home' ? `/admin/pages/home` : 
                          page.slug === 'about' ? `/admin/pages/about` : 
                          page.slug === 'projects' ? `/admin/projects` : 
                          page.slug === 'blog' ? `/admin/posts` :
                          page.slug === 'contact' ? `/admin/pages/contact` :
                          `/admin/pages/${page._id}`}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm font-medium mr-2"
                  >
                    Edit
                  </Link>
                  {['home', 'about', 'contact', 'blog', 'projects'].includes(page.slug) ? (
                    <button
                      disabled
                      className="bg-gray-100 text-gray-400 cursor-not-allowed px-3 py-1 rounded text-sm font-medium"
                      title="Essential pages cannot be deleted"
                    >
                      Delete
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeletePage(page._id)}
                      className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 px-3 py-1 rounded text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                  <Link 
                    href={`/${page.slug === 'home' ? '' : page.slug}`}
                    target="_blank"
                    className="ml-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                  >
                    View Page
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {pages.length === 0 && (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">
            No pages found. Add a new page to get started.
          </p>
        </div>
      )}
    </div>
  );
}
