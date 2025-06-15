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
import { PermissionService } from '@/lib/services/permission-service';

interface NewProjectFormData {
  title: string;
  slug: string;
  description: string;
  technologies: string[];
  featured: boolean;
  image?: string;
  liveDemo?: string;
  sourceCode?: string;
  permissions: ContentPermissions;
}

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<NewProjectFormData>({
    title: '',
    slug: '',
    description: '',
    technologies: [],
    featured: false,
    image: '',
    liveDemo: '',
    sourceCode: '',
    permissions: PermissionService.getDefaultPermissions('all') // Default to public access
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleImageUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // In a real app, you would upload the image to a storage service first
      // and then save the URL along with the other project data
      
      // For now, we'll simulate the image upload by keeping the image preview URL
      const projectData = {
        ...formData,
        image: imagePreview || formData.image, // Use preview if available, otherwise use URL
        // Ensure slug is URL-friendly
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
      
      // Wait 1.5 seconds before redirecting
      setTimeout(() => {
        router.push('/admin/projects');
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
            onClick={() => router.push('/admin/projects')}
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleImageUploadClick}
                      icon={<BiUpload />}
                      className="mb-2"
                    >
                      Upload Image
                    </Button>
                    
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Or enter a URL:
                    </div>
                    
                    <Input
                      name="image"
                      value={formData.image}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      wrapperClassName="mt-2 mb-0"
                    />
                  </div>
                  
                  <div>
                    {imagePreview ? (
                      <div className="relative w-full h-40 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${imagePreview})` }}></div>
                      </div>
                    ) : formData.image ? (
                      <div className="relative w-full h-40 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${formData.image})` }}></div>
                      </div>
                    ) : (
                      <div className="w-full h-40 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500">
                        No image selected
                      </div>
                    )}
                  </div>
                </div>
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
              
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <Checkbox
                  label="Featured Project"
                  checked={formData.featured}
                  onChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                />
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Featured projects will be highlighted on your portfolio page
                </p>
              </div>
            </CardBody>
            
            <CardFooter className="flex justify-between border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/admin/projects')}
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