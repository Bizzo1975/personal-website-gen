'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import Button from '@/components/Button';
import Card, { CardHeader, CardBody } from '@/components/Card';
import { BiUpload, BiTrash, BiMoveVertical, BiPlus } from 'react-icons/bi';
import Image from 'next/image';

interface SlideshowImage {
  name: string;
  path: string;
  size?: number;
  lastModified?: Date;
}

export default function SlideshowManagePage() {
  const router = useRouter();
  const [images, setImages] = useState<SlideshowImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Load existing slideshow images
  useEffect(() => {
    loadSlideshowImages();
  }, []);

  const loadSlideshowImages = async () => {
    try {
      setLoading(true);
      // In a real app, you'd have an API endpoint to list slideshow images
      // For now, we'll use the known slideshow images from the component
      const knownImages = [
        'coding-1.jpg',
        'coding-2.jpg', 
        'coding-3.jpg',
        'coding-4.jpg',
        'coding-5.jpg'
      ];

      const imageList: SlideshowImage[] = knownImages.map(name => ({
        name,
        path: `/images/slideshow/${name}`
      }));

      setImages(imageList);
    } catch (err) {
      setError('Failed to load slideshow images');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageName: string) => {
    if (!confirm(`Are you sure you want to delete ${imageName}?`)) {
      return;
    }

    setDeleting(imageName);
    try {
      // In a real app, you'd call an API to delete the image
      // For now, we'll just remove it from the state
      setImages(prev => prev.filter(img => img.name !== imageName));
      setSuccessMessage(`Successfully deleted ${imageName}`);
      
      // Auto-clear success message
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(`Failed to delete ${imageName}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleReorderImages = (fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const newImages = [...prev];
      const [movedItem] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedItem);
      return newImages;
    });
  };

  if (loading) {
    return (
      <AdminLayout title="Manage Slideshow">
        <AdminPageLayout title="Manage Slideshow">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </AdminPageLayout>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manage Slideshow">
      <AdminPageLayout
        title="Background Slideshow"
        description="Manage your website's background slideshow images"
        action={{
          label: 'Upload New Images',
          href: '/admin/slideshow/upload',
          icon: <BiPlus />
        }}
        status={
          successMessage 
            ? { type: 'success', message: successMessage }
            : error 
              ? { type: 'error', message: error }
              : undefined
        }
      >
        <div className="space-y-6">
          {/* Current Images */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Current Images ({images.length})
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Drag to reorder • Click delete to remove
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {images.length === 0 ? (
                <div className="text-center py-12">
                  <BiUpload className="mx-auto text-4xl text-slate-400 dark:text-slate-500 mb-4" />
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                    No slideshow images
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    Upload some images to get started with your background slideshow.
                  </p>
                  <Button
                    href="/admin/slideshow/upload"
                    variant="primary"
                    icon={<BiPlus />}
                  >
                    Upload First Image
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {images.map((image, index) => (
                    <div
                      key={image.name}
                      className="relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden group"
                    >
                      {/* Image */}
                      <div className="aspect-video relative">
                        <Image
                          src={image.path}
                          alt={`Slideshow image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        
                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                            <button
                              onClick={() => handleDeleteImage(image.name)}
                              disabled={deleting === image.name}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors disabled:opacity-50"
                              title="Delete image"
                            >
                              {deleting === image.name ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <BiTrash className="text-lg" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Image index indicator */}
                        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          #{index + 1}
                        </div>
                      </div>

                      {/* Image info */}
                      <div className="p-4">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {image.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Background slide {index + 1}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Slideshow Settings */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Slideshow Settings</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Current Configuration</h4>
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <li>• Transition interval: 7 seconds</li>
                    <li>• Opacity: 15%</li>
                    <li>• Overlay opacity: 30%</li>
                    <li>• Transition duration: 1.5 seconds</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Image Guidelines</h4>
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <li>• Recommended size: 1920×1080px</li>
                    <li>• Supported formats: JPG, PNG, WebP</li>
                    <li>• Maximum file size: 5MB</li>
                    <li>• Landscape orientation preferred</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </AdminPageLayout>
    </AdminLayout>
  );
} 