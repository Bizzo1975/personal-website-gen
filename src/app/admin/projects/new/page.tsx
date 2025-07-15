'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import Button from '@/components/Button';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';
import { TagInput } from '@/components/TagInput';
import { Checkbox } from '@/components/Checkbox';
import Card, { CardHeader, CardBody, CardFooter } from '@/components/Card';
import PermissionsEditor from '@/components/admin/PermissionsEditor';
import { BiUpload, BiSave } from 'react-icons/bi';
import { ContentPermissions } from '@/types/content/permissions';
import ImageField from '@/components/admin/ImageField';

// Client-side default permissions function
const getDefaultPermissions = (): ContentPermissions => ({
  level: 'all',
  allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
  allowedUsers: [],
  restrictedUsers: [],
  requiresAuth: false
});

interface NewProjectFormData {
  title: string;
  slug: string;
  description: string;
  technologies: string[];
  featured: boolean;
  status: 'draft' | 'published' | 'scheduled';
  image?: string;
  liveDemo?: string;
  sourceCode?: string;
  permissions: ContentPermissions;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<NewProjectFormData>({
    title: '',
    slug: '',
    description: '',
    technologies: [],
    featured: false,
    status: 'draft', // Default to draft
    image: '',
    liveDemo: '',
    sourceCode: '',
    permissions: getDefaultPermissions() // Default to public access
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from title if slug is empty
    if (name === 'title' && !formData.slug) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleTechnologiesChange = (technologies: string[]) => {
    setFormData(prev => ({ ...prev, technologies }));
  };

  const handlePermissionsChange = (permissions: ContentPermissions) => {
    setFormData(prev => ({ ...prev, permissions }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Ensure slug is URL-friendly
      const projectData = {
        ...formData,
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-')
      };

      // Real API call to create the project
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create project: ${response.status}`);
      }

      const result = await response.json();
      console.log('Project created successfully:', result);
      setSuccessMessage('Project created successfully!');
      
      // Show additional guidance for scheduled projects
      if (projectData.status === 'scheduled') {
        setTimeout(() => {
          setSuccessMessage('Project created! Visit the Content Scheduler to set the publish date.');
        }, 800);
      }
      
      // Wait 1.5 seconds before redirecting
      setTimeout(() => {
        router.push('/admin/content-management?tab=projects');
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Create New Project">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Create New Project</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/content-management?tab=projects')}
          >
            Cancel
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-700 dark:text-green-300">{successMessage}</p>
          </div>
        )}
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <h2 className="text-lg font-medium">Project Information</h2>
            </CardHeader>
            
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Project Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  wrapperClassName="mb-0"
                />
                
                <Input
                  label="Project Slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  helpText="Used in the URL, auto-generated from title"
                  wrapperClassName="mb-0"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">📝 Draft - Hidden from public</option>
                    <option value="published">✅ Published - Live immediately</option>
                    <option value="scheduled">⏰ Scheduled - Publish later</option>
                  </select>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {formData.status === 'draft' && 'Draft projects are hidden from public view'}
                    {formData.status === 'published' && 'Published projects are visible to everyone immediately'}
                    {formData.status === 'scheduled' && 'Scheduled projects will be published at a future date (set in Content Scheduler)'}
                  </p>
                </div>
                
                <div className="flex items-end">
                  <div className="w-full">
                    <Checkbox
                      label="Featured Project"
                      checked={formData.featured}
                      onChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                    />
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Featured projects will be highlighted on your portfolio page
                    </p>
                  </div>
                </div>
              </div>
              
              <TextArea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                wrapperClassName="mb-0"
              />
              
              <TagInput
                label="Technologies"
                value={formData.technologies}
                onChange={handleTechnologiesChange}
              />
              
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-medium mb-4">Project Image</h3>
                <ImageField
                  label="Project Image"
                  value={formData.image || ''}
                  onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                  contentType="project"
                  placeholder="No project image selected"
                  helpText="Click 'Choose from Library' to select from uploaded images, or 'Use External URL' to add an image from the web. You can upload new images directly from the media picker."
                />
              </div>
              
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-medium mb-4">Project Links</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Live Demo URL"
                    name="liveDemo"
                    value={formData.liveDemo || ''}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    wrapperClassName="mb-0"
                  />
                  
                  <Input
                    label="Source Code URL"
                    name="sourceCode"
                    value={formData.sourceCode || ''}
                    onChange={handleChange}
                    placeholder="https://github.com/username/repo"
                    wrapperClassName="mb-0"
                  />
                </div>
              </div>

              {/* Permissions Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <PermissionsEditor
                  permissions={formData.permissions}
                  onChange={handlePermissionsChange}
                  contentType="project"
                />
              </div>
            </CardBody>
            
            <CardFooter className="flex justify-between border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/admin/content-management?tab=projects')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                isLoading={isSubmitting}
                icon={<BiSave />}
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
} 