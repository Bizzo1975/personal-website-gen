'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  PhotoIcon,
  DocumentIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  PlusIcon,
  XMarkIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/Button';

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
  folder?: string;
  alt?: string;
  description?: string;
  tags?: string[];
}

interface MediaFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  fileCount: number;
}

const MediaLibrary: React.FC = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'documents' | 'videos'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMediaFiles();
    fetchFolders();
  }, [currentFolder]);

  const fetchMediaFiles = async () => {
    try {
      const response = await fetch(`/api/admin/media?folder=${currentFolder || ''}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('Failed to fetch media files:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/admin/media/folders');
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const handleFileUpload = async (uploadedFiles: FileList) => {
    const formData = new FormData();
    Array.from(uploadedFiles).forEach(file => {
      formData.append('files', file);
    });
    
    if (currentFolder) {
      formData.append('folder', currentFolder);
    }

    try {
      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await fetchMediaFiles();
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
    }
  };

  const handleDeleteFiles = async () => {
    if (selectedFiles.size === 0) return;

    try {
      const response = await fetch('/api/admin/media/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: Array.from(selectedFiles) })
      });

      if (response.ok) {
        await fetchMediaFiles();
        setSelectedFiles(new Set());
      }
    } catch (error) {
      console.error('Failed to delete files:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch('/api/admin/media/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newFolderName,
          parentId: currentFolder 
        })
      });

      if (response.ok) {
        await fetchFolders();
        setNewFolderName('');
        setShowCreateFolder(false);
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const getFilteredFiles = () => {
    return files.filter(file => {
      const matchesSearch = file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           file.alt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           file.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = filterType === 'all' || 
                         (filterType === 'images' && file.mimeType.startsWith('image/')) ||
                         (filterType === 'documents' && (file.mimeType.includes('pdf') || file.mimeType.includes('document'))) ||
                         (filterType === 'videos' && file.mimeType.startsWith('video/'));

      return matchesSearch && matchesType;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return PhotoIcon;
    return DocumentIcon;
  };

  const filteredFiles = getFilteredFiles();
  const currentFolderData = folders.find(f => f.id === currentFolder);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Media Library</h2>
          {currentFolderData && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {currentFolderData.name} • {currentFolderData.fileCount} files
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowCreateFolder(true)}
          >
            <FolderIcon className="h-5 w-5 mr-2" />
            New Folder
          </Button>
          <Button onClick={() => setShowUploadModal(true)}>
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Files</option>
            <option value="images">Images</option>
            <option value="documents">Documents</option>
            <option value="videos">Videos</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          {selectedFiles.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedFiles.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteFiles}
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm ${
                viewMode === 'grid' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      {currentFolder && (
        <nav className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => setCurrentFolder(null)}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Media Library
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 dark:text-white">
            {currentFolderData?.name}
          </span>
        </nav>
      )}

      {/* Folders */}
      {!currentFolder && folders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {folders.map(folder => (
            <div
              key={folder.id}
              onClick={() => setCurrentFolder(folder.id)}
              className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              <FolderIcon className="h-12 w-12 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                {folder.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {folder.fileCount} files
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Files */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredFiles.map(file => {
            const FileIcon = getFileIcon(file.mimeType);
            return (
              <div
                key={file.id}
                className={`relative border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer ${
                  selectedFiles.has(file.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => {
                  const newSelected = new Set(selectedFiles);
                  if (selectedFiles.has(file.id)) {
                    newSelected.delete(file.id);
                  } else {
                    newSelected.add(file.id);
                  }
                  setSelectedFiles(newSelected);
                }}
              >
                <div className="aspect-square mb-2 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center overflow-hidden">
                  {file.mimeType.startsWith('image/') ? (
                    <img
                      src={file.thumbnailUrl || file.url}
                      alt={file.alt || file.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewFile(file);
                    setShowPreview(true);
                  }}
                  className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <EyeIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredFiles.map(file => {
              const FileIcon = getFileIcon(file.mimeType);
              return (
                <div
                  key={file.id}
                  className={`flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedFiles.has(file.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedFiles);
                      if (e.target.checked) {
                        newSelected.add(file.id);
                      } else {
                        newSelected.delete(file.id);
                      }
                      setSelectedFiles(newSelected);
                    }}
                    className="mr-4"
                  />

                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center mr-4">
                    {file.mimeType.startsWith('image/') ? (
                      <img
                        src={file.thumbnailUrl || file.url}
                        alt={file.alt || file.originalName}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <FileIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.originalName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewFile(file);
                        setShowPreview(true);
                      }}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No files match your search' : 'No files in this folder'}
          </p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleFileUpload}
        />
      )}

      {/* Preview Modal */}
      {showPreview && previewFile && (
        <PreviewModal
          file={previewFile}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Folder
            </h3>
            
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              autoFocus
            />

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateFolder(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Upload Modal Component
const UploadModal: React.FC<{
  onClose: () => void;
  onUpload: (files: FileList) => void;
}> = ({ onClose, onUpload }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upload Files
          </h3>
          <Button variant="outline" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragOver 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Drag and drop files here, or click to select
          </p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Select Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onUpload(e.target.files);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Preview Modal Component
const PreviewModal: React.FC<{
  file: MediaFile;
  onClose: () => void;
}> = ({ file, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {file.originalName}
          </h3>
          <Button variant="outline" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          {file.mimeType.startsWith('image/') ? (
            <img
              src={file.url}
              alt={file.alt || file.originalName}
              className="max-w-full max-h-[60vh] object-contain mx-auto"
            />
          ) : (
            <div className="text-center py-8">
              <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                Preview not available for this file type
              </p>
              <Button
                className="mt-4"
                onClick={() => window.open(file.url, '_blank')}
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Download
              </Button>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Size:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {file.mimeType}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Uploaded:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {new Date(file.uploadedAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">By:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {file.uploadedBy}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaLibrary; 