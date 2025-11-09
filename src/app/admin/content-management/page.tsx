'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import AdminPageLayout from '@/app/admin/components/AdminPageLayout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import { 
  BiFile, BiEdit, BiTime, BiSearch, BiCheck, BiX, BiPlus, BiCopy, 
  BiGroup, BiExport, BiImport, BiDownload, BiUpload, BiUser, 
  BiCalendar, BiMessage, BiCog, BiHistory, BiBookOpen, BiRefresh, BiEnvelope, BiDuplicate 
} from 'react-icons/bi';

interface DraftItem {
  id: string;
  title: string;
  slug?: string;
  type: 'post' | 'project' | 'page';
  author: string;
  lastModified: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  collaborators: string[];
  template?: string;
  comments: number;
}

interface ContentTemplate {
  id: string;
  name: string;
  type: 'post' | 'project' | 'page';
  description: string;
  content: string;
  createdAt: string;
  usageCount: number;
  author: string;
}

interface NewsletterCampaign {
  id: string;
  title: string;
  slug: string;
  subject: string;
  preview_text: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed';
  type: 'manual' | 'automated' | 'welcome' | 'announcement';
  scheduled_send_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  author: string;
  created_at: string;
  updated_at: string;
  template_name: string | null;
}

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  image: string;
  technologies: string[];
  live_demo?: string;
  source_code?: string;
  featured: boolean;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  created_at: string;
  updated_at: string;
  created_by_name: string;
  last_edited_by_name: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  featured_image?: string;
  meta_description: string;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  read_time: number;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  last_edited_by_name: string;
  featured: boolean;
}

function ContentManagementPageContent() {
  const [activeTab, setActiveTab] = useState<'projects' | 'posts' | 'drafts' | 'templates' | 'newsletter-templates' | 'newsletter-campaigns' | 'collaboration' | 'import-export'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [newsletterTemplates, setNewsletterTemplates] = useState<any[]>([]);
  const [newsletterCampaigns, setNewsletterCampaigns] = useState<NewsletterCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);

  // Filter states
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('all');
  const [projectFeaturedFilter, setProjectFeaturedFilter] = useState<string>('all');
  const [postStatusFilter, setPostStatusFilter] = useState<string>('all');
  const [postFeaturedFilter, setPostFeaturedFilter] = useState<string>('all');

  useEffect(() => {
    // Check URL parameters for active tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['projects', 'posts', 'drafts', 'templates', 'newsletter-templates', 'newsletter-campaigns', 'collaboration', 'import-export'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    
    // Fetch all data on mount for dashboard stats
    fetchProjects();
    fetchPosts();
    fetchDrafts();
    fetchTemplates();
    fetchNewsletterTemplates();
    fetchNewsletterCampaigns();
  }, []); // Remove activeTab dependency to fetch all data on mount

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const response = await fetch('/api/admin/content-management/projects');
      if (response.ok) {
        const data = await response.json();
        console.log('Projects data:', data); // Debug log
        setProjects(data.projects || []);
      } else {
        console.error('Failed to fetch projects:', response.status);
        // Try fallback API if content management specific endpoint fails
        const fallbackResponse = await fetch('/api/projects');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setProjects(fallbackData.projects || []);
        } else {
          console.error('Failed to fetch projects from fallback API');
          setProjects([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await fetch('/api/admin/content-management/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        console.error('Failed to fetch posts');
        setPosts([]);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
      setLoading(false);
    }
  };

  const fetchDrafts = async () => {
    try {
      // Fetch real drafts from API
      const response = await fetch('/api/admin/content-items?status=draft');
      if (response.ok) {
        const data = await response.json();
        setDrafts(data);
      } else {
        console.error('Failed to fetch drafts');
        setDrafts([]);
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      // Fetch real templates from API
      const response = await fetch('/api/admin/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        console.error('Failed to fetch templates');
        setTemplates([]);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setTemplates([]);
    }
  };

  const fetchNewsletterTemplates = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/templates');
      if (response.ok) {
        const data = await response.json();
        setNewsletterTemplates(data.templates || []);
      } else {
        console.error('Failed to fetch newsletter templates');
        setNewsletterTemplates([]);
      }
    } catch (error) {
      console.error('Failed to fetch newsletter templates:', error);
    }
  };

  const fetchNewsletterCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/campaigns?limit=50');
      if (response.ok) {
        const data = await response.json();
        setNewsletterCampaigns(data.campaigns || []);
      } else {
        console.error('Failed to fetch newsletter campaigns');
        setNewsletterCampaigns([]);
      }
    } catch (error) {
      console.error('Failed to fetch newsletter campaigns:', error);
    }
  };

  const handleDraftAction = async (draftId: string, action: 'approve' | 'reject' | 'publish') => {
    try {
      // API call would go here
      console.log(`${action} draft ${draftId}`);
      await fetchDrafts();
    } catch (error) {
      console.error('Failed to perform draft action:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const response = await fetch(`/api/admin/content-management/projects?id=${projectId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await fetchProjects();
        } else {
          alert('Failed to delete project');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await fetch(`/api/admin/content-management/posts?id=${postId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await fetchPosts();
        } else {
          alert('Failed to delete post');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
      }
    }
  };

  const handleExportContent = async (format: string = 'json') => {
    try {
      // Simulate export functionality
      const exportData = {
        projects: projects,
        posts: posts,
        drafts: drafts,
        templates: templates,
        exportDate: new Date().toISOString(),
        format: format
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export content:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'published':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'sending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'sent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <BiFile className="h-4 w-4" />;
      case 'project':
        return <BiCopy className="h-4 w-4" />;
      case 'page':
        return <BiBookOpen className="h-4 w-4" />;
      default:
        return <BiFile className="h-4 w-4" />;
    }
  };

  // Filter functions
  const filteredProjects = projects.filter(project => {
    const statusMatch = projectStatusFilter === 'all' || project.status === projectStatusFilter;
    const featuredMatch = projectFeaturedFilter === 'all' || 
                         (projectFeaturedFilter === 'featured' && project.featured) ||
                         (projectFeaturedFilter === 'not-featured' && !project.featured);
    return statusMatch && featuredMatch;
  });

  const filteredPosts = posts.filter(post => {
    const statusMatch = postStatusFilter === 'all' || post.status === postStatusFilter;
    const featuredMatch = postFeaturedFilter === 'all' || 
                         (postFeaturedFilter === 'featured' && post.featured) ||
                         (postFeaturedFilter === 'not-featured' && !post.featured);
    return statusMatch && featuredMatch;
  });

  if (loading) {
    return (
      <AdminPageLayout>
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-lg"></div>
          ))}
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Content Management System  
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Complete content workflow with creation, drafts, templates, collaboration, and migration tools
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4">
                <BiCopy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{projects.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-4">
                <BiFile className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{posts.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg mr-4">
                <BiBookOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Templates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{templates.length + newsletterTemplates.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {templates.length} Content + {newsletterTemplates.length} Newsletter
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mr-4">
                <BiTime className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Drafts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{drafts.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {[
            { key: 'projects', label: 'Projects', icon: <BiCopy className="h-4 w-4" /> },
            { key: 'posts', label: 'Posts', icon: <BiFile className="h-4 w-4" /> },
            { key: 'drafts', label: 'Draft System', icon: <BiTime className="h-4 w-4" /> },
            { key: 'templates', label: 'Content Templates', icon: <BiBookOpen className="h-4 w-4" /> },
            { key: 'newsletter-templates', label: 'Newsletter Templates', icon: <BiEnvelope className="h-4 w-4" /> },
            { key: 'newsletter-campaigns', label: 'Newsletter Campaigns', icon: <BiCalendar className="h-4 w-4" /> },
            { key: 'collaboration', label: 'Collaboration', icon: <BiGroup className="h-4 w-4" /> },
            { key: 'import-export', label: 'Import/Export', icon: <BiExport className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                // Update URL to reflect the active tab
                const url = new URL(window.location.href);
                url.searchParams.set('tab', tab.key);
                window.history.replaceState({}, '', url.toString());
              }}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Project Management
                </h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={fetchProjects}>
                    <BiRefresh className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => window.location.href = '/admin/projects/new'}
                  >
                    <BiPlus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardBody>
              {/* Project Filters - Inline without headers */}
              <div className="mb-6 flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All Status' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                    { value: 'archived', label: 'Archived' }
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setProjectStatusFilter(status.value)}
                      className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                        projectStatusFilter === status.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
                
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All Projects' },
                    { value: 'featured', label: 'Featured' },
                    { value: 'not-featured', label: 'Not Featured' }
                  ].map((featured) => (
                    <button
                      key={featured.value}
                      onClick={() => setProjectFeaturedFilter(featured.value)}
                      className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                        projectFeaturedFilter === featured.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {featured.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {projectsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <BiCopy className="mx-auto h-12 w-12" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {projects.length === 0 ? 'No projects found' : 'No projects match the selected filters'}
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {projects.length === 0 ? 'Create your first project to get started' : 'Try adjusting your filters'}
                  </p>
                  {projects.length === 0 && (
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => window.location.href = '/admin/projects/new'}
                    >
                      <BiPlus className="h-4 w-4 mr-2" />
                      Create First Project
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <Card key={project.id} className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                      <CardBody className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="text-blue-600 dark:text-blue-400">
                              <BiCopy className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {project.title}
                              </h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {project.slug}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                                  {project.status}
                                </span>
                                {project.featured && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                    Featured
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {project.description}
                        </p>
                        
                        {project.image && (
                          <div className="mb-4">
                            <img 
                              src={project.image} 
                              alt={project.title}
                              className="w-full h-24 object-cover rounded-md"
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                          <span className="flex items-center">
                            <BiUser className="h-4 w-4 mr-1" />
                            {project.created_by_name}
                          </span>
                          <span className="flex items-center">
                            <BiCalendar className="h-4 w-4 mr-1" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.location.href = `/admin/projects/${project.id}`}
                          >
                            <BiEdit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const previewUrl = project.status === 'draft' || project.status === 'scheduled' 
                                ? `/projects/${project.slug}?preview=true`
                                : `/projects/${project.slug}`;
                              window.location.href = previewUrl;
                            }}
                          >
                            <BiSearch className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <BiX className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Post Management
                </h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={fetchPosts}>
                    <BiRefresh className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => window.location.href = '/admin/posts/new'}
                  >
                    <BiPlus className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardBody>
              {/* Post Filters - Inline without headers */}
              <div className="mb-6 flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All Status' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                    { value: 'archived', label: 'Archived' }
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setPostStatusFilter(status.value)}
                      className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                        postStatusFilter === status.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
                
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All Posts' },
                    { value: 'featured', label: 'Featured' },
                    { value: 'not-featured', label: 'Not Featured' }
                  ].map((featured) => (
                    <button
                      key={featured.value}
                      onClick={() => setPostFeaturedFilter(featured.value)}
                      className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                        postFeaturedFilter === featured.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {featured.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {postsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <BiFile className="mx-auto h-12 w-12" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {posts.length === 0 ? 'No posts found' : 'No posts match the selected filters'}
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {posts.length === 0 ? 'Create your first post to get started' : 'Try adjusting your filters'}
                  </p>
                  {posts.length === 0 && (
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => window.location.href = '/admin/posts/new'}
                    >
                      <BiPlus className="h-4 w-4 mr-2" />
                      Create First Post
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <Card key={post.id} className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                      <CardBody className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="text-blue-600 dark:text-blue-400">
                              <BiFile className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                  {post.title}
                                </h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
                                  {post.status}
                                </span>
                                {post.featured && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                    Featured
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {post.excerpt}
                              </p>
                              
                              {post.featured_image && (
                                <div className="mb-3">
                                  <img 
                                    src={post.featured_image} 
                                    alt={post.title}
                                    className="w-full h-24 object-cover rounded-md"
                                  />
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center">
                                  <BiUser className="h-4 w-4 mr-1" />
                                  {post.created_by_name}
                                </span>
                                <span className="flex items-center">
                                  <BiCalendar className="h-4 w-4 mr-1" />
                                  {new Date(post.created_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <BiTime className="h-4 w-4 mr-1" />
                                  {post.read_time} min read
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => window.location.href = `/admin/posts/${post.id}`}
                            >
                              <BiEdit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const previewUrl = post.status === 'draft' || post.status === 'scheduled' 
                                  ? `/blog/${post.slug}?preview=true`
                                  : `/blog/${post.slug}`;
                                window.location.href = previewUrl;
                              }}
                            >
                              <BiSearch className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePost(post.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <BiX className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Draft System Tab */}
      {activeTab === 'drafts' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Draft/Publish Workflow
                </h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => fetchDrafts()}>
                    <BiRefresh className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => window.location.href = '/admin/editor/new'}
                  >
                    <BiPlus className="h-4 w-4 mr-2" />
                    New Draft
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardBody>
              <div className="space-y-4">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-gray-400 dark:text-gray-500">
                        {getTypeIcon(draft.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {draft.title}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(draft.status)}`}>
                            {draft.status}
                          </span>
                          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded capitalize">
                            {draft.type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <BiUser className="h-4 w-4 mr-1" />
                            {draft.author}
                          </span>
                          <span className="flex items-center">
                            <BiCalendar className="h-4 w-4 mr-1" />
                            {new Date(draft.lastModified).toLocaleDateString()}
                          </span>
                          {draft.comments > 0 && (
                            <span className="flex items-center">
                              <BiMessage className="h-4 w-4 mr-1" />
                              {draft.comments} comments
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/admin/editor/${draft.id}`}
                      >
                        <BiEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Create proper preview URL based on draft type using slug
                          if (draft.type === 'post') {
                            // For posts, use slug if available, otherwise use ID
                            const identifier = draft.slug || draft.id;
                            window.location.href = `/blog/${identifier}?preview=true`;
                          } else if (draft.type === 'project') {
                            // For projects, use slug if available, otherwise use ID
                            const identifier = draft.slug || draft.id;
                            window.location.href = `/projects/${identifier}?preview=true`;
                          } else {
                            window.location.href = `/admin/editor/${draft.id}`;
                          }
                        }}
                      >
                        <BiSearch className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete "${draft.title}"?`)) {
                            try {
                              const response = await fetch('/api/admin/content-items', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: draft.id, type: draft.type })
                              });
                              if (response.ok) {
                                await fetchDrafts();
                              } else {
                                alert('Failed to delete item');
                              }
                            } catch (error) {
                              console.error('Error deleting item:', error);
                              alert('Failed to delete item');
                            }
                          }
                        }}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <BiX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Content Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Reusable Content Templates
                </h3>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => window.location.href = '/admin/templates/new'}
                >
                  <BiPlus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => (
                  <Card key={template.id} className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-blue-600 dark:text-blue-400">
                            {getTypeIcon(template.type)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {template.name}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {template.type} template
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.href = `/admin/templates/${template.id}/edit`}
                          >
                            <BiEdit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {template.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <span className="flex items-center">
                          <BiCopy className="h-4 w-4 mr-1" />
                          Used {template.usageCount} times
                        </span>
                        <span className="flex items-center">
                          <BiUser className="h-4 w-4 mr-1" />
                          {template.author}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                        Created {new Date(template.createdAt).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.location.href = `/admin/editor/new?template=${template.id}`}
                        >
                          Use Template
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/admin/templates/${template.id}/preview`}
                        >
                          <BiSearch className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(template.content)}
                        >
                          <BiCopy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Newsletter Templates Tab */}
      {activeTab === 'newsletter-templates' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Newsletter Templates
                </h3>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fetchNewsletterTemplates()}
                  >
                    <BiRefresh className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => window.location.href = '/admin/newsletter/templates/create'}
                  >
                    <BiPlus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {newsletterTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <BiEnvelope className="mx-auto h-12 w-12" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No newsletter templates found
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Create your first newsletter template to get started
                  </p>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => window.location.href = '/admin/newsletter/templates/create'}
                  >
                    <BiPlus className="h-4 w-4 mr-2" />
                    Create First Template
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {newsletterTemplates.map((template) => (
                    <Card key={template.id} className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                      <CardBody className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="text-blue-600 dark:text-blue-400">
                              <BiEnvelope className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {template.name}
                              </h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                  {template.type.replace('_', ' ')}
                                </span>
                                {template.is_system && (
                                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                    System
                                  </span>
                                )}
                                {!template.is_active && (
                                  <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded">
                                    Inactive
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {!template.is_system && (
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.location.href = `/admin/newsletter/templates/${template.id}/edit`}
                              >
                                <BiEdit className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                          {template.description || 'No description provided'}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <span className="flex items-center">
                            <BiCopy className="h-4 w-4 mr-1" />
                            Used {template.usage_count || 0} times
                          </span>
                          <span className="flex items-center">
                            <BiCalendar className="h-4 w-4 mr-1" />
                            {new Date(template.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                          Subject: {template.subject_template}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.location.href = `/admin/newsletter/campaigns/create?template=${template.id}`}
                          >
                            Use Template
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/admin/newsletter/templates/${template.id}/preview`}
                          >
                            <BiSearch className="h-4 w-4" />
                          </Button>
                          {!template.is_system && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const duplicateName = `${template.name} (Copy)`;
                                // Here you would implement the duplicate functionality
                                console.log('Duplicate template:', duplicateName);
                              }}
                            >
                              <BiDuplicate className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Newsletter Campaigns Tab */}
      {activeTab === 'newsletter-campaigns' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Newsletter Campaigns
                </h3>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fetchNewsletterCampaigns()}
                  >
                    <BiRefresh className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                                     <Button 
                     variant="primary" 
                     size="sm"
                     onClick={() => window.location.href = '/admin/newsletter/campaigns'}
                   >
                     <BiPlus className="h-4 w-4 mr-2" />
                     Manage Campaigns
                   </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {newsletterCampaigns.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <BiCalendar className="mx-auto h-12 w-12" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No newsletter campaigns found
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Create your first newsletter campaign to get started
                  </p>
                                     <Button 
                     variant="primary" 
                     size="sm"
                     onClick={() => window.location.href = '/admin/newsletter/campaigns'}
                   >
                     <BiPlus className="h-4 w-4 mr-2" />
                     Manage Campaigns
                   </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {newsletterCampaigns.map((campaign) => (
                    <Card key={campaign.id} className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                      <CardBody className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="text-blue-600 dark:text-blue-400">
                              <BiCalendar className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {campaign.title}
                              </h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                  {campaign.type} campaign
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                                  {campaign.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {campaign.preview_text}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <span className="flex items-center">
                            <BiUser className="h-4 w-4 mr-1" />
                            {campaign.author}
                          </span>
                          <span className="flex items-center">
                            <BiCalendar className="h-4 w-4 mr-1" />
                            {new Date(campaign.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                          Recipients: {campaign.recipient_count}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                                                     <Button
                             variant="primary"
                             size="sm"
                             className="flex-1"
                             onClick={() => window.location.href = `/admin/newsletter/campaigns`}
                           >
                             View Campaign
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => window.location.href = `/admin/newsletter/campaigns`}
                           >
                             <BiSearch className="h-4 w-4" />
                           </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Collaboration Tab */}
      {activeTab === 'collaboration' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Active Collaborations
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {drafts.filter(d => d.collaborators.length > 0).map((draft) => (
                    <div key={draft.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {draft.title}
                        </h5>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(draft.status)}`}>
                          {draft.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mb-3 flex-wrap">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Collaborators:
                        </span>
                        {draft.collaborators.map((collaborator, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                          >
                            {collaborator}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.location.href = `/admin/comments/${draft.id}`}
                        >
                          <BiMessage className="h-4 w-4 mr-1" />
                          Comments ({draft.comments})
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.location.href = `/admin/editor/${draft.id}`}
                        >
                          <BiEdit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Collaboration Settings
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          Real-time Editing
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Enable simultaneous editing by multiple users
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          Comment Notifications
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Notify collaborators of new comments
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          Auto-save Drafts
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Automatically save changes every 30 seconds
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Invite Collaborator
                    </h5>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Enter email address"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        <option>Editor - Can edit content</option>
                        <option>Reviewer - Can review and comment</option>
                        <option>Viewer - Can view only</option>
                      </select>
                      <Button variant="primary" size="sm" className="w-full">
                        <BiGroup className="h-4 w-4 mr-2" />
                        Send Invitation
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Import/Export Tab */}
      {activeTab === 'import-export' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Content Export
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Export your content for backup or migration purposes
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Export Format
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        <option value="json">JSON</option>
                        <option value="markdown">Markdown</option>
                        <option value="csv">CSV</option>
                        <option value="xml">XML</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Content Types
                      </label>
                      <div className="space-y-2">
                        {['Posts', 'Projects', 'Pages', 'Templates', 'User Data', 'Comments'].map((type) => (
                          <div key={type} className="flex items-center">
                            <input
                              type="checkbox"
                              id={type}
                              defaultChecked
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor={type} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              {type}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => handleExportContent('json')}
                    >
                      <BiDownload className="h-4 w-4 mr-2" />
                      Export Content
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Content Import
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Import content from external sources or backups
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Import Source
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        <option>WordPress Export</option>
                        <option>Ghost Export</option>
                        <option>Medium Export</option>
                        <option>JSON Backup</option>
                        <option>CSV File</option>
                        <option>Markdown Files</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Upload File
                      </label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                        <BiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Drag and drop your file here, or click to browse
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                          Supported formats: JSON, XML, CSV, ZIP (max 50MB)
                        </p>
                        <Button variant="outline" size="sm">
                          Choose File
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="preserve-ids"
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="preserve-ids" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Preserve original IDs
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="skip-duplicates"
                          defaultChecked
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="skip-duplicates" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Skip duplicate content
                        </label>
                      </div>
                    </div>

                    <Button variant="primary" className="w-full" disabled>
                      <BiUpload className="h-4 w-4 mr-2" />
                      Import Content
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Migration History
              </h3>
            </CardHeader>
            <CardBody>
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <BiHistory className="mx-auto h-12 w-12" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No imports yet
                </h4>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Your content import history will appear here once you start importing content
                </p>
                <Button variant="outline" size="sm">
                  <BiRefresh className="h-4 w-4 mr-2" />
                  Refresh History
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </AdminPageLayout>
  );
}

export default function ContentManagementPage() {
  return (
    <AdminLayout title="Content Management">
      <ContentManagementPageContent />
    </AdminLayout>
  );
} 