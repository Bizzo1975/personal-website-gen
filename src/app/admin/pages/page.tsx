'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Card, { CardBody } from '@/components/Card';
import Button from '@/components/Button';

// Define the page data interface
interface PageData {
  _id: string;
  name: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  updatedAt: string;
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch pages from the API
  useEffect(() => {
    async function fetchPages() {
      try {
        const response = await fetch('/api/pages');
        
        if (!response.ok) {
          throw new Error('Failed to fetch pages');
        }
        
        const data = await response.json();
        setPages(data);
      } catch (err) {
        setError('Failed to load pages. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPages();
  }, []);
  
  // Function to handle page deletion
  const handleDeletePage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this page?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/pages/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete page');
      }
      
      // Remove the deleted page from the state
      setPages(pages.filter(page => page._id !== id));
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('An error occurred');
      }
    }
  };

  // Format date in a human-readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your static page content</p>
        </div>
        <Button href="/admin/pages/new">Create New Page</Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">Loading pages...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10 bg-red-50 dark:bg-red-900 rounded-lg">
          <p className="text-red-500 dark:text-red-300">{error}</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {pages.map((page) => (
              <Card key={page._id} variant="default" className="overflow-hidden">
                <CardBody>
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0 flex-grow">
                      <h2 className="text-xl font-semibold">{page.title}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <span className="font-medium">Internal Name:</span> {page.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Updated on {formatDate(page.updatedAt)}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 mb-2">
                        {page.metaDescription.length > 120 
                          ? `${page.metaDescription.substring(0, 120)}...` 
                          : page.metaDescription}
                      </p>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Path: /{page.slug === 'home' ? '' : page.slug}
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col justify-end gap-2">
                      <Link 
                        href={`/admin/pages/${page._id}`}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeletePage(page._id)}
                        className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 px-3 py-1 rounded text-sm font-medium"
                        // Disable delete for essential pages
                        disabled={page.slug === 'home' || page.slug === 'about'}
                      >
                        Delete
                      </button>
                      <Link
                        href={`/${page.slug === 'home' ? '' : page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 px-3 py-1 rounded text-sm font-medium"
                      >
                        View
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
                No pages found. Create a new page to get started.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
} 