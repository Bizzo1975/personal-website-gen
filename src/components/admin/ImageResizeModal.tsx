import React, { useState, useEffect } from 'react';
import { BiX, BiImage, BiExpand, BiCheck } from 'react-icons/bi';
import Button from '@/components/Button';
import Card, { CardBody } from '@/components/Card';
import { resizeForProject, getImageDimensions, needsResizing, type ResizeResult } from '@/lib/utils/image-resize';

interface ImageResizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (resizedFile: File, result: ResizeResult) => void;
  originalFile: File;
  resizeType?: 'card' | 'detail' | 'thumbnail';
}

const ImageResizeModal: React.FC<ImageResizeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  originalFile,
  resizeType = 'card'
}) => {
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [resizeResult, setResizeResult] = useState<ResizeResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Project image configurations
  const configs = {
    card: { width: 600, height: 400, label: 'Project Card (3:2)' },
    detail: { width: 800, height: 400, label: 'Project Detail (2:1)' },
    thumbnail: { width: 300, height: 200, label: 'Thumbnail (3:2)' }
  };

  const currentConfig = configs[resizeType];

  useEffect(() => {
    if (isOpen && originalFile) {
      loadImageInfo();
    }
    
    // Cleanup function
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, originalFile]);

  const loadImageInfo = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      console.log('Loading image info for file:', originalFile);
      console.log('File size:', originalFile.size);
      console.log('File type:', originalFile.type);
      
      // Validate file
      if (!originalFile || originalFile.size === 0) {
        throw new Error('Invalid file - file is empty or corrupted');
      }
      
      // Get original dimensions
      const dimensions = await getImageDimensions(originalFile);
      console.log('Original dimensions:', dimensions);
      setOriginalDimensions(dimensions);
      
      // Create preview URL using FileReader for better compatibility
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        console.log('Created data URL for preview:', dataUrl.substring(0, 50) + '...');
        setPreviewUrl(dataUrl);
      };
      reader.onerror = () => {
        console.error('Failed to create data URL from file');
        setError('Failed to create image preview');
      };
      reader.readAsDataURL(originalFile);
      
      // Check if resizing is needed
      const needsResize = needsResizing(
        dimensions.width,
        dimensions.height,
        currentConfig.width,
        currentConfig.height
      );
      
      console.log('Needs resize:', needsResize);
      console.log('Target dimensions:', currentConfig.width, 'x', currentConfig.height);
      
      if (needsResize) {
        // Auto-resize the image
        console.log('Auto-resizing image...');
        const result = await resizeForProject(originalFile, resizeType);
        console.log('Resize result:', result);
        setResizeResult(result);
      }
    } catch (err) {
      console.error('Error in loadImageInfo:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResize = async () => {
    if (!originalFile) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      const result = await resizeForProject(originalFile, resizeType);
      setResizeResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resize image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setIsUploading(true);
      
      if (resizeResult) {
        // Create a new file from the resized data URL
        const byteString = atob(resizeResult.dataUrl.split(',')[1]);
        const mimeString = resizeResult.dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        const resizedFile = new File([ab], originalFile.name, { type: mimeString });
        await onConfirm(resizedFile);
      } else {
        // Use original file if no resizing was done
        await onConfirm(originalFile);
      }
    } catch (error) {
      console.error('Error in handleConfirm:', error);
      setError('Failed to process resized image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setResizeResult(null);
    setOriginalDimensions(null);
    setPreviewUrl(null);
    setError(null);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <BiExpand className="mr-2" />
            Resize Image for {currentConfig.label}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <BiX size={24} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {isProcessing ? (
            <div className="text-center py-8">
              <div className="animate-spin mx-auto w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
              <p>Processing image...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Original Image */}
              <div>
                <h3 className="text-md font-medium mb-4">Original Image</h3>
                {previewUrl ? (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 text-xs text-gray-600 dark:text-gray-400">
                      Original: {originalDimensions?.width} × {originalDimensions?.height}
                    </div>
                    <img
                      src={previewUrl}
                      alt="Original"
                      className="w-full h-64 object-contain bg-gray-50 dark:bg-gray-900"
                      onLoad={() => {
                        console.log('Original image loaded successfully');
                      }}
                      onError={(e) => {
                        console.error('Failed to load original image:', e);
                        console.error('Preview URL:', previewUrl);
                        console.error('Original file:', originalFile);
                        setError('Failed to load original image - please try a different image');
                      }}
                    />
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="text-center">
                      <BiImage size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">Loading original image...</p>
                    </div>
                  </div>
                )}
                {originalDimensions && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>Dimensions: {originalDimensions.width} × {originalDimensions.height}</p>
                    <p>File size: {(originalFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>

              {/* Resized Image */}
              <div>
                <h3 className="text-md font-medium mb-4">Resized for {currentConfig.label}</h3>
                {resizeResult ? (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-green-100 dark:bg-green-800 p-2 text-xs text-green-700 dark:text-green-300">
                      Resized: {resizeResult.newSize.width} × {resizeResult.newSize.height}
                    </div>
                    <img
                      src={resizeResult.dataUrl}
                      alt="Resized"
                      className="w-full h-48 object-contain bg-gray-50 dark:bg-gray-900"
                      style={{
                        maxWidth: `${Math.min(resizeResult.newSize.width, 400)}px`,
                        maxHeight: `${Math.min(resizeResult.newSize.height, 300)}px`
                      }}
                    />
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="text-center">
                      <BiImage size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">Click "Resize Image" to see preview</p>
                    </div>
                  </div>
                )}
                
                {resizeResult && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>New dimensions: {resizeResult.newSize.width} × {resizeResult.newSize.height}</p>
                    <p>File size: {(resizeResult.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    <p>Original size: {(originalFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p className="text-green-600 dark:text-green-400">
                      Size reduction: {(((originalFile.size - resizeResult.fileSize) / originalFile.size) * 100).toFixed(1)}%
                    </p>
                    <p className="text-blue-600 dark:text-blue-400">
                      Quality: {currentConfig.quality * 100}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {originalDimensions && (
                <p>
                  Target: {currentConfig.width} × {currentConfig.height} pixels
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleClose}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              
              {!isProcessing && (
                <Button
                  onClick={handleResize}
                  variant="primary"
                  size="sm"
                  icon={<BiExpand />}
                >
                  {resizeResult ? 'Resize Again' : 'Resize Image'}
                </Button>
              )}
              
              {resizeResult && (
                <Button
                  onClick={handleConfirm}
                  variant="primary"
                  size="sm"
                  icon={<BiCheck />}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Use Resized Image'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageResizeModal;
