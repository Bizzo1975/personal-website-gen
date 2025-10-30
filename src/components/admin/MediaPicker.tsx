import React, { useState, useEffect, useRef } from 'react';
import { BiUpload, BiTrash, BiCopy, BiCheck, BiX, BiImage, BiSearch, BiFilter, BiExpand } from 'react-icons/bi';
import Button from '@/components/Button';
import Card, { CardBody } from '@/components/Card';
import ImageResizeModal from './ImageResizeModal';

interface MediaFile {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  content_type: 'post' | 'project' | 'newsletter' | 'general';
  alt_text?: string;
  created_at: Date;
  uploaded_by: string;
}

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: MediaFile) => void;
  multiple?: boolean;
  contentType?: 'post' | 'project' | 'newsletter' | 'general';
  allowedTypes?: string[];
  title?: string;
}

const MediaPicker: React.FC<MediaPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  contentType = 'general',
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  title = 'Select Media'
}) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('image');
  const [showResizeModal, setShowResizeModal] = useState(false);
  const [fileToResize, setFileToResize] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMediaFiles();
    }
  }, [isOpen]);

  const fetchMediaFiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      // Don't filter by content type for media picker - show all images
      // This allows users to select any image from the media library
      
      const response = await fetch(`/api/admin/media?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMediaFiles(data.media || []);
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

    // For single file uploads, show resize modal for images
    if (files.length === 1 && files[0].type.startsWith('image/')) {
      setFileToResize(files[0]);
      setShowResizeModal(true);
      return;
    }

    // For multiple files or non-images, upload directly
    await uploadFiles(files);
  };

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          alert(`File type ${file.type} is not allowed`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('contentType', contentType);

        const response = await fetch('/api/admin/media', {
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

  const handleResizeConfirm = async (resizedFile: File) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', resizedFile);
      formData.append('contentType', contentType);

      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload resized image');
      }

      // Refresh media files
      await fetchMediaFiles();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading resized file:', error);
      alert('Failed to upload resized image. Please try again.');
    } finally {
      setUploading(false);
      setShowResizeModal(false);
      setFileToResize(null);
    }
  };

  const handleFileSelect = (file: MediaFile) => {
    if (multiple) {
      if (selectedFiles.find(f => f.id === file.id)) {
        setSelectedFiles(selectedFiles.filter(f => f.id !== file.id));
      } else {
        setSelectedFiles([...selectedFiles, file]);
      }
    } else {
      onSelect(file);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    if (multiple && selectedFiles.length > 0) {
      selectedFiles.forEach(file => onSelect(file));
      onClose();
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

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.alt_text?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || file.mime_type.startsWith(filterType);
    // For image selection, only show image files
    const isImageFile = file.mime_type.startsWith('image/');
    return matchesSearch && matchesFilter && isImageFile;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <BiX size={24} />
          </button>
        </div>

        {/* Upload Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept={allowedTypes.join(',')}
            className="hidden"
          />
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant="primary"
              size="sm"
            >
              <BiUpload className="mr-2" />
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
            
            {uploading && (
              <div className="flex-1">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="image">Images</option>
              <option value="all">All Types</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="application">Documents</option>
            </select>
          </div>
        </div>

        {/* Media Grid */}
        <div className="p-4 overflow-y-auto max-h-96">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin mx-auto w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
              <p>Loading media files...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                    selectedFiles.find(f => f.id === file.id)
                      ? 'border-primary-500 ring-2 ring-primary-500'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleFileSelect(file)}
                >
                  <div className="aspect-square">
                    {isImage(file.mime_type) ? (
                      <img
                        src={file.file_path}
                        alt={file.alt_text || file.original_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <BiImage size={32} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2">
                    <p className="text-xs font-medium truncate" title={file.original_name}>
                      {file.original_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.file_size)}
                    </p>
                    {isImage(file.mime_type) && (
                      <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                        Click resize icon to optimize
                      </p>
                    )}
                  </div>
                  
                  {selectedFiles.find(f => f.id === file.id) && (
                    <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1">
                      <BiCheck size={16} />
                    </div>
                  )}
                  
                  {/* Resize button for images */}
                  {isImage(file.mime_type) && (
                    <button
                      className="absolute top-2 left-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-gray-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Create a file object from the image URL for resizing
                        fetch(file.file_path)
                          .then(response => response.blob())
                          .then(blob => {
                            const resizeFile = new File([blob], file.original_name, { type: file.mime_type });
                            setFileToResize(resizeFile);
                            setShowResizeModal(true);
                          })
                          .catch(error => {
                            console.error('Failed to load image for resizing:', error);
                            alert('Failed to load image for resizing');
                          });
                      }}
                      title="Resize image"
                    >
                      <BiExpand size={14} className="text-gray-600 dark:text-gray-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {!loading && filteredFiles.length === 0 && (
            <div className="text-center py-8">
              <BiImage size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No media files found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {multiple && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedFiles.length} file(s) selected
            </p>
            <div className="flex items-center space-x-2">
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={selectedFiles.length === 0}
                variant="primary"
                size="sm"
              >
                Select Files
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Image Resize Modal */}
      {showResizeModal && fileToResize && (
        <ImageResizeModal
          isOpen={showResizeModal}
          onClose={() => {
            setShowResizeModal(false);
            setFileToResize(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          onConfirm={handleResizeConfirm}
          originalFile={fileToResize}
          resizeType={contentType === 'project' ? 'card' : 'general'}
        />
      )}
    </div>
  );
};

export default MediaPicker; 