'use client'
import '@/styles/globals.css';
;

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';
import Card, { CardBody } from '@/components/Card';
import Badge from '@/components/Badge';
import AdminPageLayout from '../components/AdminPageLayout';
import { AdminFilterBar, AdminFilterButton } from '../components/AdminDataTable';
import Button from '@/components/Button';

interface BlogPage {
  _id?: string;
  headerTitle: string;
  headerSubtitle: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [filters, setFilters] = useState({
    published: 'all',
    author: 'all',
    tag: 'all'
  });
  const [pageData, setPageData] = useState<BlogPage>({
    headerTitle: 'My Blog',
    headerSubtitle: 'Thoughts, tutorials, and insights about technology and development'
  });
  const [headerLoading, setHeaderLoading] = useState(true);
  const [headerSaving, setHeaderSaving] = useState(false);
  const [headerSaveSuccess, setHeaderSaveSuccess] = useState(false);
  
  useEffect(() => {
    fetchBlogPage();
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        console.error('Failed to fetch posts');
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogPage = async () => {
    try {
      setHeaderLoading(true);
      const response = await fetch('/api/pages');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.status}`);
      }
      
      const pages = await response.json();
      const blogPage = pages.find((page: any) => page.slug === 'blog');
      
      if (blogPage) {
        setPageData({
          _id: blogPage._id,
          headerTitle: blogPage.headerTitle || 'My Blog',
          headerSubtitle: blogPage.headerSubtitle || 'Thoughts, tutorials, and insights about technology and development'
        });
      }
      setHeaderLoading(false);
    } catch (err) {
      console.error('Error fetching blog page:', err);
      setHeaderLoading(false);
    }
  };
  
  // Filter posts based on the current filter - ensure posts is always an array
  const filteredPosts = Array.isArray(posts) ? (
    filters.published === 'all' 
      ? posts 
      : filters.published === 'published' 
        ? posts.filter(post => post.published) 
        : posts.filter(post => !post.published)
  ) : [];

  const handleHeaderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPageData({
      ...pageData,
      [name]: value
    });
  };
  
  const handleHeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHeaderSaving(true);
    
    try {
      let response;
      
      if (pageData._id) {
        // Update existing page
        response = await fetch(`/api/pages/${pageData._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pageData),
          cache: 'no-store',
        });
      } else {
        // Create new page
        response = await fetch('/api/pages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...pageData,
            name: 'Blog Page',
            title: 'Blog',
            slug: 'blog',
            content: ''
          }),
          cache: 'no-store',
        });
      }
      
      if (!response.ok) {
        throw new Error(`Failed to save page: ${response.status}`);
      }
      
      const result = await response.json();
      
      // If it was a new page, store the ID
      if (!pageData._id && result._id) {
        setPageData({
          ...pageData,
          _id: result._id
        });
      }
      
      // Revalidate the blog page
      await fetch(`/api/revalidate?path=/blog`, { method: 'POST' });
      
      setHeaderSaveSuccess(true);
      setTimeout(() => setHeaderSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving blog page:', err);
    } finally {
      setHeaderSaving(false);
    }
  };

  // Function to handle post deletion
  const handleDeletePost = (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setPosts(posts.filter(post => post.id !== id));
    }
  };

  return (
    <AdminLayout title="Blog Posts">
      <AdminPageLayout
        title="Blog Posts"
        description="Manage your blog posts"
        action={{
          label: "Create New Post",
          href: "/admin/posts/new"
        }}
      >
        <Card variant="default" className="mb-6">
          <CardBody>
            <h2 className="text-lg font-semibold mb-4">Blog Page Header</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Customize the header that appears at the top of your blog page
            </p>
            
            <form onSubmit={handleHeaderSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="headerTitle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Header Title
                  </label>
                  <input
                    type="text"
                    id="headerTitle"
                    name="headerTitle"
                    value={pageData.headerTitle}
                    onChange={handleHeaderInputChange}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md dark:bg-slate-800"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="headerSubtitle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Header Subtitle
                  </label>
                  <textarea
                    id="headerSubtitle"
                    name="headerSubtitle"
                    value={pageData.headerSubtitle}
                    onChange={handleHeaderInputChange}
                    rows={2}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md dark:bg-slate-800"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={headerSaving}>
                    {headerSaving ? 'Saving...' : 'Save Header'}
                  </Button>
                </div>
                
                {headerSaveSuccess && (
                  <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-2 rounded">
                    Blog page header saved successfully
                  </div>
                )}
              </div>
            </form>
          </CardBody>
        </Card>
        
        <AdminFilterBar>
          <AdminFilterButton
            isActive={filters.published === 'all'}
            onClick={() => setFilters({ ...filters, published: 'all' })}
          >
            All Posts
          </AdminFilterButton>
          <AdminFilterButton
            isActive={filters.published === 'published'}
            onClick={() => setFilters({ ...filters, published: 'published' })}
          >
            Published
          </AdminFilterButton>
          <AdminFilterButton
            isActive={filters.published === 'drafts'}
            onClick={() => setFilters({ ...filters, published: 'drafts' })}
          >
            Drafts
          </AdminFilterButton>
        </AdminFilterBar>

        {filteredPosts.length === 0 ? (
          <Card variant="default">
            <CardBody className="text-center py-10">
              <p className="text-slate-500 dark:text-slate-400">
                No posts found. Create a new post to get started.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} variant="default" className="overflow-hidden">
                <CardBody>
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">{post.title}</h2>
                        {!post.published && (
                          <Badge variant="warning" size="sm">Draft</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {new Date(post.date).toLocaleDateString()} • {post.readTime} min read
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 mb-2">{post.excerpt}</p>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" size="sm">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col justify-end gap-2">
                      <Link 
                        href={`/admin/posts/${post.id}`}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 px-3 py-1 rounded text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </AdminPageLayout>
    </AdminLayout>
  );
} 