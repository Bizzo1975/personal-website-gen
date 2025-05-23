'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import AdminPageLayout from '../../components/AdminPageLayout';
import Button from '@/components/Button';
import Card, { CardHeader, CardBody } from '@/components/Card';
import { BiUpload, BiX, BiCheck, BiImage } from 'react-icons/bi';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  uploaded: boolean;
  uploading: boolean;
  error?: string;
  url?: string;
}

export default function SlideshowUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages: UploadedImage[] = files.map(file => ({
      id: Date.now() + Math.random().toString(),
      file,
      preview: URL.createObjectURL(file),
      uploaded: false,
      uploading: false
    }));

    setImages(prev => [...prev, ...newImages]);
    
    // Reset file input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const uploadSingleImage = async (image: UploadedImage): Promise<void> => {
    setImages(prev => prev.map(img => 
      img.id === image.id ? { ...img, uploading: true } : img
    ));

    try {
      const formData = new FormData();
      formData.append('file', image.file);
      formData.append('type', 'slideshow');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();

      setImages(prev => prev.map(img => 
        img.id === image.id 
          ? { 
              ...img, 
              uploading: false, 
              uploaded: true, 
              url: result.path 
            } 
          : img
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setImages(prev => prev.map(img => 
        img.id === image.id 
          ? { 
              ...img, 
              uploading: false, 
              error: errorMessage 
            } 
          : img
      ));
    }
  };

  const uploadAllImages = async () => {
    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    const pendingImages = images.filter(img => !img.uploaded && !img.error);
    
    if (pendingImages.length === 0) {
      setError('No images to upload');
      setUploading(false);
      return;
    }

    try {
      await Promise.all(pendingImages.map(uploadSingleImage));
      setSuccessMessage(`Successfully uploaded ${pendingImages.length} image(s) to the slideshow!`);
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError('Some uploads failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const hasUploadedImages = images.some(img => img.uploaded);
  const hasErrorImages = images.some(img => img.error);
  const pendingImages = images.filter(img => !img.uploaded && !img.error);

  return (
    <AdminLayout title="Upload Slideshow Images">
      <AdminPageLayout
        title="Upload Slideshow Images"
        description="Add new background images to your website slideshow"
        status={
          successMessage 
            ? { type: 'success', message: successMessage }
            : error 
              ? { type: 'error', message: error }
              : undefined
        }
      >
        <div className="space-y-6">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Select Images</h3>
            </CardHeader>
            <CardBody>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                multiple
                className="hidden"
              />
              
              <div
                onClick={handleUploadClick}
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
              >
                <BiImage className="mx-auto text-4xl text-slate-400 dark:text-slate-500 mb-4" />
                <p className="text-slate-600 dark:text-slate-300 mb-2">
                  Click to select images or drag and drop
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Supports JPG, PNG, WebP. Recommended size: 1920x1080px
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    Selected Images ({images.length})
                  </h3>
                  {pendingImages.length > 0 && (
                    <Button
                      onClick={uploadAllImages}
                      disabled={uploading}
                      variant="primary"
                      icon={<BiUpload />}
                      isLoading={uploading}
                    >
                      Upload All ({pendingImages.length})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="relative bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden"
                    >
                      {/* Image Preview */}
                      <div className="aspect-video relative">
                        <img
                          src={image.preview}
                          alt="Upload preview"
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Status Overlay */}
                        {image.uploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                              <p className="text-sm">Uploading...</p>
                            </div>
                          </div>
                        )}
                        
                        {image.uploaded && (
                          <div className="absolute inset-0 bg-green-500 bg-opacity-80 flex items-center justify-center">
                            <div className="text-white text-center">
                              <BiCheck className="text-3xl mx-auto mb-1" />
                              <p className="text-sm">Uploaded</p>
                            </div>
                          </div>
                        )}
                        
                        {image.error && (
                          <div className="absolute inset-0 bg-red-500 bg-opacity-80 flex items-center justify-center">
                            <div className="text-white text-center">
                              <BiX className="text-3xl mx-auto mb-1" />
                              <p className="text-xs">{image.error}</p>
                            </div>
                          </div>
                        )}

                        {/* Remove Button */}
                        <button
                          onClick={() => removeImage(image.id)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                        >
                          <BiX className="text-lg" />
                        </button>
                      </div>

                      {/* Image Info */}
                      <div className="p-3">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                          {image.file.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {(image.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Actions */}
          {hasUploadedImages && (
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/slideshow')}
              >
                Manage Slideshow
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push('/admin/dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </AdminPageLayout>
    </AdminLayout>
  );
} 