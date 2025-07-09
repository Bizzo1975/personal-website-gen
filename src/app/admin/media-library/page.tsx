'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import Card, { CardBody } from '@/components/Card';
import Button from '@/components/Button';
import { BiUpload, BiTrash, BiCopy, BiCheck } from 'react-icons/bi';

interface MediaFile {
  id: string;
  filename: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export default function MediaLibraryPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  const fetchMediaFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/media');
      if (response.ok) {
        const data = await response.json();
        setMediaFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching media files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      // Refresh media files
      await fetchMediaFiles();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload some files. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/admin/media/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMediaFiles(mediaFiles.filter(file => file.id !== fileId));
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const copyToClipboard = (path: string) => {
    navigator.clipboard.writeText(path).then(() => {
      setCopySuccess(path);
      setTimeout(() => setCopySuccess(null), 2000);
    });
  };

  const setAsLogo = async (path: string) => {
    try {
      const response = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logoUrl: path }),
      });

      if (response.ok) {
        alert('Logo updated successfully!');
      } else {
        throw new Error('Failed to update logo');
      }
    } catch (error) {
      console.error('Error updating logo:', error);
      alert('Failed to update logo. Please try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <AdminLayout title="Media Library">
      <AdminPageLayout
        title="Media Library"
        description="Upload and manage your media files"
      >
        {/* Upload Section */}
        <Card variant="default" className="mb-6">
          <CardBody>
            <div className="text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*"
                className="hidden"
              />
              
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8">
                <BiUpload className="mx-auto text-4xl text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Upload Media Files
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  Drag and drop files here, or click to select files
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  variant="primary"
                >
                  {uploading ? 'Uploading...' : 'Choose Files'}
                </Button>
              </div>
              
              {uploading && (
                <div className="mt-4">
                  <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Media Files Grid */}
        {loading ? (
          <Card variant="default">
            <CardBody className="text-center py-8">
              <div className="animate-spin mx-auto w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
              <p>Loading media files...</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {mediaFiles.map((file) => (
              <Card key={file.id} variant="default" className="overflow-hidden">
                <div className="aspect-square relative">
                  {isImage(file.type) ? (
                    <img
                      src={file.path}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="text-2xl">📄</span>
                    </div>
                  )}
                </div>
                <CardBody className="p-3">
                  <h4 className="text-sm font-medium truncate mb-1" title={file.filename}>
                    {file.filename}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {formatFileSize(file.size)}
                  </p>
                  
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => copyToClipboard(file.path)}
                      className="flex items-center justify-center text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      {copySuccess === file.path ? (
                        <>
                          <BiCheck className="mr-1" /> Copied!
                        </>
                      ) : (
                        <>
                          <BiCopy className="mr-1" /> Copy URL
                        </>
                      )}
                    </button>
                    
                    {isImage(file.type) && (
                      <button
                        onClick={() => setAsLogo(file.path)}
                        className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700"
                      >
                        Set as Logo
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="flex items-center justify-center text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-800"
                    >
                      <BiTrash className="mr-1" /> Delete
                    </button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {!loading && mediaFiles.length === 0 && (
          <Card variant="default">
            <CardBody className="text-center py-12">
              <BiUpload className="mx-auto text-4xl text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No media files
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Upload your first media file to get started
              </p>
            </CardBody>
          </Card>
        )}
      </AdminPageLayout>
    </AdminLayout>
  );
} 