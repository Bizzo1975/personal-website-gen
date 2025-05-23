import React from 'react';
import { render, screen } from '@testing-library/react';
import OptimizedImage from '@/components/OptimizedImage';

// Mock next/image
jest.mock('next/image', () => {
  return ({ src, alt, fill, style, sizes, priority, loading, quality, className, placeholder }: any) => {
    return (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        data-fill={fill ? 'true' : undefined}
        data-priority={priority ? 'true' : undefined}
        data-loading={loading}
        data-quality={quality}
        data-sizes={sizes}
        data-placeholder={placeholder}
        style={style}
      />
    );
  };
});

describe('OptimizedImage Integration Test', () => {
  test('renders basic image with required props', () => {
    render(
      <OptimizedImage 
        src="/test-image.jpg" 
        alt="Test image" 
        width={300} 
        height={200} 
      />
    );
    
    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
  });

  test('renders image with fill mode', () => {
    render(
      <OptimizedImage 
        src="/test-image.jpg" 
        alt="Test image" 
        fill
      />
    );
    
    const image = screen.getByAltText('Test image');
    expect(image).toHaveAttribute('data-fill', 'true');
  });

  test('passes through additional props', () => {
    render(
      <OptimizedImage 
        src="/test-image.jpg" 
        alt="Test image" 
        width={300} 
        height={200}
        priority
        quality={90}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="custom-class"
      />
    );
    
    const image = screen.getByAltText('Test image');
    expect(image).toHaveAttribute('data-priority', 'true');
    expect(image).toHaveAttribute('data-quality', '90');
    expect(image).toHaveAttribute('data-sizes', '(max-width: 768px) 100vw, 50vw');
    expect(image).toHaveClass('custom-class');
  });

  test('handles lazy loading', () => {
    render(
      <OptimizedImage 
        src="/test-image.jpg" 
        alt="Test image" 
        width={300} 
        height={200}
        loading="lazy"
      />
    );
    
    const image = screen.getByAltText('Test image');
    expect(image).toHaveAttribute('data-loading', 'lazy');
  });

  test('supports placeholder option', () => {
    render(
      <OptimizedImage 
        src="/test-image.jpg" 
        alt="Test image" 
        width={300} 
        height={200}
        placeholder="blur"
      />
    );
    
    const image = screen.getByAltText('Test image');
    expect(image).toHaveAttribute('data-placeholder', 'blur');
  });
}); 