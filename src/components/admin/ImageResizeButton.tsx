import React, { useState } from 'react';
import { BiExpand } from 'react-icons/bi';
import Button from '@/components/Button';
import ImageResizeModal from './ImageResizeModal';

interface ImageResizeButtonProps {
  imageUrl: string;
  imageName: string;
  mimeType: string;
  onResizeComplete: (resizedFile: File) => void;
  resizeType?: 'card' | 'detail' | 'thumbnail';
  className?: string;
}

const ImageResizeButton: React.FC<ImageResizeButtonProps> = ({
  imageUrl,
  imageName,
  mimeType,
  onResizeComplete,
  resizeType = 'card',
  className = ''
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!mimeType.startsWith('image/')) {
      alert('Only images can be resized');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch the image and create a File object
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], imageName, { type: mimeType });
      
      // Open the resize modal
      setShowModal(true);
    } catch (error) {
      console.error('Failed to load image for resizing:', error);
      alert('Failed to load image for resizing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResizeConfirm = (resizedFile: File) => {
    onResizeComplete(resizedFile);
    setShowModal(false);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant="outline"
        size="sm"
        icon={<BiExpand />}
        className={className}
        title="Resize image to fit project dimensions"
      >
        {isLoading ? 'Loading...' : 'Resize'}
      </Button>

      {showModal && (
        <ImageResizeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleResizeConfirm}
          originalFile={new File([], imageName, { type: mimeType })} // Placeholder file
          resizeType={resizeType}
        />
      )}
    </>
  );
};

export default ImageResizeButton;
