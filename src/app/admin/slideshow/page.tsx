'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import Card, { CardHeader, CardBody } from '@/components/Card';
import Button from '@/components/Button';
import Image from 'next/image';
import { 
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  CogIcon,
  EyeIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface SlideshowImage {
  id: string;
  filename: string;
  url: string;
  altText: string;
  order?: number;
}

interface SlideshowSettings {
  interval: number;
  opacity: number;
  overlayOpacity: number;
  autoPlay: boolean;
}

export default function SlideshowManagePage() {
  const router = useRouter();
  const [images, setImages] = useState<SlideshowImage[]>([]);
  const [allMediaImages, setAllMediaImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddImages, setShowAddImages] = useState(false);
  const [settings, setSettings] = useState<SlideshowSettings>({
    interval: 7000,
    opacity: 0.15,
    overlayOpacity: 0.3,
    autoPlay: true
  });

  // Load slideshow images and settings
  useEffect(() => {
    loadSlideshowData();
    loadMediaLibraryImages();
  }, []);

  const loadSlideshowData = async () => {
    try {
      setLoading(true);
      // Use API endpoints instead of importing service directly
      const [slideshowResponse, settingsResponse] = await Promise.all([
        fetch('/api/slideshow'),
        fetch('/api/admin/slideshow/settings')
      ]);
      
      if (slideshowResponse.ok) {
        const slideshowImages = await slideshowResponse.json();
        setImages(slideshowImages);
      }
      
      if (settingsResponse.ok) {
        const slideshowSettings = await settingsResponse.json();
        setSettings(slideshowSettings);
      } else {
        // Use default settings if API not available
        setSettings({
          interval: 7000,
          opacity: 0.15,
          overlayOpacity: 0.3,
          autoPlay: true
        });
      }
    } catch (err) {
      setError('Failed to load slideshow data');
    } finally {
      setLoading(false);
    }
  };

  const loadMediaLibraryImages = async () => {
    try {
      const response = await fetch('/api/admin/media?type=general&limit=100');
      if (response.ok) {
        const data = await response.json();
        // Filter for images only
        const imageFiles = data.media.filter((file: any) => 
          file.mime_type.startsWith('image/')
        );
        setAllMediaImages(imageFiles);
      }
    } catch (err) {
      console.error('Failed to load media library images:', err);
    }
  };

  const handleRemoveFromSlideshow = async (imageId: string) => {
    if (!confirm('Are you sure you want to remove this image from the slideshow?')) {
      return;
    }

    setDeleting(imageId);
    try {
      const response = await fetch(`/api/admin/slideshow/${imageId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadSlideshowData(); // Reload data
        setSuccessMessage('Image removed from slideshow successfully');
        
        // Auto-clear success message
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        throw new Error('Failed to remove image');
      }
    } catch (err) {
      setError('Failed to remove image from slideshow');
    } finally {
      setDeleting(null);
    }
  };

  const handleAddToSlideshow = async (mediaFileId: string) => {
    try {
      const response = await fetch('/api/admin/slideshow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaFileId })
      });
      
      if (response.ok) {
        await loadSlideshowData(); // Reload data
        setSuccessMessage('Image added to slideshow successfully');
        
        // Auto-clear success message
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        throw new Error('Failed to add image');
      }
    } catch (err) {
      setError('Failed to add image to slideshow');
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const response = await fetch('/api/admin/slideshow/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        setSuccessMessage('Slideshow settings updated successfully');
        setShowSettings(false);
        
        // Auto-clear success message
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (err) {
      setError('Failed to update slideshow settings');
    }
  };

  // Filter media images that are not already in slideshow
  const availableImages = allMediaImages.filter(mediaFile => 
    !images.some(slideImage => slideImage.id === mediaFile.id)
  );

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
        description="Manage your website's background slideshow images from the media library"
        action={{
          label: 'Slideshow Settings',
          onClick: () => setShowSettings(true),
          icon: <CogIcon className="h-5 w-5" />
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
          {/* Current Slideshow Images */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Current Slideshow Images ({images.length})
                </h3>
                <Button
                  onClick={() => setShowAddImages(true)}
                  variant="primary"
                  icon={<PlusIcon className="h-5 w-5" />}
                  size="sm"
                >
                  Add Images
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {images.length === 0 ? (
                <div className="text-center py-12">
                  <PhotoIcon className="mx-auto text-4xl text-slate-400 dark:text-slate-500 mb-4 h-16 w-16" />
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                    No slideshow images
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    Add images from your media library to create a background slideshow.
                  </p>
                  <Button
                    onClick={() => setShowAddImages(true)}
                    variant="primary"
                    icon={<PlusIcon className="h-5 w-5" />}
                  >
                    Add First Image
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden group"
                    >
                      {/* Image */}
                      <div className="aspect-video relative">
                        <Image
                          src={image.url}
                          alt={image.altText}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        
                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleRemoveFromSlideshow(image.id)}
                            disabled={deleting === image.id}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors disabled:opacity-50"
                            title="Remove from slideshow"
                          >
                            {deleting === image.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <TrashIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {/* Image index indicator */}
                        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          #{index + 1}
                        </div>
                      </div>

                      {/* Image info */}
                      <div className="p-4">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {image.filename}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {image.altText}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Add Images Modal */}
          {showAddImages && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Add Images to Slideshow</h2>
                    <button
                      onClick={() => setShowAddImages(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <span className="sr-only">Close</span>
                      ✕
                    </button>
                  </div>
                  
                  {availableImages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-600 dark:text-slate-400">
                        No additional images available in the media library.
                      </p>
                      <Button
                        href="/admin/media-library"
                        variant="primary"
                        className="mt-4"
                      >
                        Go to Media Library
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {availableImages.map((mediaFile) => (
                        <div
                          key={mediaFile.id}
                          className="relative bg-slate-50 dark:bg-slate-700 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                          onClick={() => handleAddToSlideshow(mediaFile.id)}
                        >
                          <div className="aspect-video relative">
                            <Image
                              src={mediaFile.file_path}
                              alt={mediaFile.alt_text || mediaFile.original_name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center">
                              <PlusIcon className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <div className="p-2">
                            <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                              {mediaFile.original_name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Settings Modal */}
          {showSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Slideshow Settings</h2>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <span className="sr-only">Close</span>
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Slide Interval (ms)
                      </label>
                      <input
                        type="number"
                        value={settings.interval}
                        onChange={(e) => setSettings(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        min="1000"
                        max="30000"
                        step="500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Image Opacity ({Math.round(settings.opacity * 100)}%)
                      </label>
                      <input
                        type="range"
                        value={settings.opacity}
                        onChange={(e) => setSettings(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                        className="w-full"
                        min="0.05"
                        max="0.8"
                        step="0.05"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Overlay Opacity ({Math.round(settings.overlayOpacity * 100)}%)
                      </label>
                      <input
                        type="range"
                        value={settings.overlayOpacity}
                        onChange={(e) => setSettings(prev => ({ ...prev, overlayOpacity: parseFloat(e.target.value) }))}
                        className="w-full"
                        min="0.1"
                        max="0.8"
                        step="0.05"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="autoPlay"
                        checked={settings.autoPlay}
                        onChange={(e) => setSettings(prev => ({ ...prev, autoPlay: e.target.checked }))}
                        className="mr-2"
                      />
                      <label htmlFor="autoPlay" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Auto-play slideshow
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => setShowSettings(false)}
                      variant="secondary"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateSettings}
                      variant="primary"
                      className="flex-1"
                    >
                      Save Settings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminPageLayout>
    </AdminLayout>
  );
} 