'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AdminLayout from '../../components/AdminLayout';
import Button from '@/components/Button';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';
import { TagInput } from '@/components/TagInput';
import { Checkbox } from '@/components/Checkbox';
import PermissionsEditor from '@/components/admin/PermissionsEditor';
import Card, { CardHeader, CardBody, CardFooter } from '@/components/Card';
import ImageField from '@/components/admin/ImageField';
import { BiSave } from 'react-icons/bi';
import { ContentPermissions } from '@/types/content/permissions';

// Default permissions for public content
const getDefaultPermissions = (): ContentPermissions => ({
  level: 'all',
  allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
  allowedUsers: [],
  restrictedUsers: [],
  requiresAuth: false
});

interface ProjectData {
  id: string;
  title: string;
  slug: string;
  description: string;
  image?: string;
  technologies: string[];
  liveDemo?: string;
  sourceCode?: string;
  featured: boolean;
  permissions?: ContentPermissions;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectEditFormData {
  title: string;
  slug: string;
  description: string;
  image?: string;
  technologies: string[];
  liveDemo?: string;
  sourceCode?: string;
  featured: boolean;
  status: 'draft' | 'scheduled' | 'published';
  permissions: ContentPermissions;
}

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [permissions, setPermissions] = useState<ContentPermissions>(getDefaultPermissions());
  const router = useRouter();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProjectEditFormData>();

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetch(`/api/projects/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        
        const data = await response.json();
        setProject(data.data || data);
        
        // Set form values
        setValue('title', data.title || data.data?.title);
        setValue('slug', data.slug || data.data?.slug);
        setValue('description', data.description || data.data?.description);
        setValue('image', data.image || data.data?.image || '');
        setValue('technologies', data.technologies || data.data?.technologies || []);
        setValue('liveDemo', data.liveDemo || data.data?.liveDemo || '');
        setValue('sourceCode', data.sourceCode || data.data?.sourceCode || '');
        setValue('featured', data.featured || data.data?.featured || false);
        setValue('status', data.status || data.data?.status || 'draft');
        
        // Set permissions (use default if not present)
        const projectPermissions = data.permissions || data.data?.permissions || getDefaultPermissions();
        setPermissions(projectPermissions);
        setValue('permissions', projectPermissions);
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load project data. Please try again.');
        setIsLoading(false);
      }
    }
    
    fetchProject();
  }, [params.id, setValue]);

  const onSubmit = async (data: ProjectEditFormData) => {
    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          permissions
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      setSuccessMessage('Project updated successfully!');
      setTimeout(() => {
        router.push('/admin/content-management?tab=projects');
      }, 1500);
    } catch (err) {
      setError('Failed to update project. Please try again.');
    }
  };

  const handlePermissionsChange = (newPermissions: ContentPermissions) => {
    setPermissions(newPermissions);
    setValue('permissions', newPermissions);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Loading...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !project) {
    return (
      <AdminLayout title="Error">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/admin/projects')}>
            Back to Projects
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Edit Project: ${project?.title}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Project</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/content-management?tab=projects')}
          >
            Cancel
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-6">
            <p className="text-green-600 dark:text-green-400">{successMessage}</p>
          </div>
        )}
        
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <h2 className="text-lg font-medium">Project Information</h2>
            </CardHeader>
            
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Project Title"
                  {...register('title', { required: 'Title is required' })}
                  error={errors.title?.message}
                  wrapperClassName="mb-0"
                />
                
                <Input
                  label="Project Slug"
                  {...register('slug', { required: 'Slug is required' })}
                  error={errors.slug?.message}
                  wrapperClassName="mb-0"
                />
              </div>
              
              <TextArea
                label="Description"
                {...register('description', { required: 'Description is required' })}
                error={errors.description?.message}
                wrapperClassName="mb-0"
              />
              
              <TagInput
                label="Technologies"
                value={watch('technologies') || []}
                onChange={(technologies) => setValue('technologies', technologies)}
              />
              
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-medium mb-4">Project Image & Links</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <ImageField
                      label="Project Image"
                      value={watch('image') || ''}
                      onChange={(url) => setValue('image', url)}
                      contentType="project"
                      placeholder="No project image selected"
                      helpText="Select an image to display for this project"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Input
                      label="Live Demo URL"
                      {...register('liveDemo')}
                      placeholder="https://example.com"
                      wrapperClassName="mb-0"
                    />
                    
                    <Input
                      label="Source Code URL"
                      {...register('sourceCode')}
                      placeholder="https://github.com/username/repo"
                      wrapperClassName="mb-0"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <PermissionsEditor
                  permissions={permissions}
                  onChange={handlePermissionsChange}
                  contentType="project"
                />
              </div>
              
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <Checkbox
                  label="Featured Project"
                  checked={watch('featured')}
                  onChange={(checked) => setValue('featured', checked)}
                />
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Featured projects will be highlighted on your portfolio page
                </p>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  id="status"
                  {...register('status', { required: 'Status is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
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
                icon={<BiSave />}
              >
                Update Project
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
} 