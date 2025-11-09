import React, { useState } from 'react';
import { BiImage, BiX, BiEdit, BiLink, BiUpload, BiExpand } from 'react-icons/bi';
import Button from '@/components/Button';
import MediaPicker from './MediaPicker';
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

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  contentType?: 'post' | 'project' | 'newsletter' | 'general';
  placeholder?: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  className?: string;
  allowExternalUrl?: boolean;
  allowUpload?: boolean;
}

const ImageField: React.FC<ImageFieldProps> = ({
  label,
  value,
  onChange,
  contentType = 'general',
  placeholder = 'No image selected',
  helpText,
  error,
  required = false,
  className = '',
  allowExternalUrl = true,
  allowUpload = true
}) => {
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showResizeModal, setShowResizeModal] = useState(false);
  const [fileToResize, setFileToResize] = useState<File | null>(null);

  const handleMediaSelect = (file: MediaFile) => {
    onChange(file.file_path);
    setShowMediaPicker(false);
  };

  const handleRemoveImage = () => {
    onChange('');
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleUrlCancel = () => {
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleResizeImage = async () => {
    if (!value) return;
    
    try {
      console.log('Attempting to resize image:', value);
      
      // Create a simple approach - fetch the image and create a proper file
      let imageUrl = value;
      
      // Handle relative paths
      if (!value.startsWith('data:') && !value.startsWith('http')) {
        imageUrl = value.startsWith('/') ? `${window.location.origin}${value}` : `${window.location.origin}/${value}`;
      }
      
      console.log('Using image URL:', imageUrl);
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('Blob created:', {
        size: blob.size,
        type: blob.type
      });
      
      if (blob.size === 0) {
        throw new Error('Image blob is empty');
      }
      
      // Create file with proper MIME type
      const mimeType = blob.type || 'image/jpeg';
      const file = new File([blob], 'image.jpg', { type: mimeType });
      
      console.log('Created file for resizing:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      setFileToResize(file);
      setShowResizeModal(true);
    } catch (error) {
      console.error('Failed to load image for resizing:', error);
      console.error('Image URL:', value);
      alert(`Failed to load image for resizing: ${error instanceof Error ? error.message : 'Unknown error'}. Please try selecting a different image.`);
    }
  };

  const handleResizeConfirm = async (resizedFile: File) => {
    try {
      console.log('Uploading resized image:', resizedFile);
      
      // Upload the resized file to the server
      const formData = new FormData();
      formData.append('file', resizedFile);
      formData.append('contentType', contentType || 'project');
      formData.append('altText', 'Resized image');
      
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload resized image: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Resized image uploaded:', result);
      
      // Update the value with the server file path
      onChange(result.file_path);
      setShowResizeModal(false);
      setFileToResize(null);
    } catch (error) {
      console.error('Failed to upload resized image:', error);
      alert(`Failed to save resized image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
        {value ? (
          <div className="relative">
            <div className="relative">
              <img
                src={value}
                alt="Selected image"
                className={`w-full h-48 object-contain rounded-lg mb-3 bg-gray-50 dark:bg-gray-900 ${
                  value.startsWith('data:') ? 'ring-2 ring-green-500' : ''
                }`}
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  const dimensionsSpan = document.getElementById('image-dimensions');
                  if (dimensionsSpan) {
                    dimensionsSpan.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
                  }
                  console.log('Image loaded in ImageField:', {
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    displayWidth: img.offsetWidth,
                    displayHeight: img.offsetHeight
                  });
                }}
              />
              {/* Show dimensions if it's a data URL (resized image) */}
              {value.startsWith('data:') && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Resized
                </div>
              )}
              {/* Show image info */}
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                <span id="image-dimensions">Loading...</span>
              </div>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                {allowUpload && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMediaPicker(true)}
                  >
                    <BiUpload className="mr-2" />
                    Choose Different
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResizeImage}
                >
                  <BiExpand className="mr-2" />
                  Resize Image
                </Button>
                {allowExternalUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUrlInput(true)}
                  >
                    <BiLink className="mr-2" />
                    Use URL
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="text-red-600 hover:text-red-700"
                >
                  <BiX className="mr-2" />
                  Remove
                </Button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {value.startsWith('http') ? 'External URL' : 'Media Library'}
              </div>
            </div>
          </div>
        ) : showUrlInput ? (
          <div className="space-y-3">
            <div className="text-center py-4">
              <BiLink className="mx-auto text-4xl text-gray-400 mb-2" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Enter an external image URL
              </p>
            </div>
            <div className="space-y-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUrlSubmit();
                  } else if (e.key === 'Escape') {
                    handleUrlCancel();
                  }
                }}
              />
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                >
                  Add URL
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUrlCancel}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <BiImage className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {placeholder}
            </p>
            <div className="flex items-center justify-center space-x-2 flex-wrap gap-2">
              {allowUpload && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setShowMediaPicker(true)}
                >
                  <BiUpload className="mr-2" />
                  Choose from Library
                </Button>
              )}
              {allowExternalUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUrlInput(true)}
                >
                  <BiLink className="mr-2" />
                  Use External URL
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
      
      {showMediaPicker && (
        <MediaPicker
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={handleMediaSelect}
          contentType={contentType}
          allowedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']}
          title="Select Image"
        />
      )}
      
      {showResizeModal && fileToResize && (
        <ImageResizeModal
          isOpen={showResizeModal}
          onClose={() => {
            setShowResizeModal(false);
            setFileToResize(null);
          }}
          onConfirm={handleResizeConfirm}
          originalFile={fileToResize!}
          resizeType={contentType === 'project' ? 'card' : 'card'}
        />
      )}
    </div>
  );
};

export default ImageField; 