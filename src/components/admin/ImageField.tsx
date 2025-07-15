import React, { useState } from 'react';
import { BiImage, BiX, BiEdit, BiLink, BiUpload } from 'react-icons/bi';
import Button from '@/components/Button';
import MediaPicker from './MediaPicker';

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
  required = false,
  className = '',
  allowExternalUrl = true,
  allowUpload = true
}) => {
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

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

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
        {value ? (
          <div className="relative">
            <img
              src={value}
              alt="Selected image"
              className="w-full h-48 object-cover rounded-lg mb-3"
            />
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
      
      {helpText && (
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
    </div>
  );
};

export default ImageField; 