'use client';

/**
 * OptimizedImage Component
 * Professional image optimization component using Next.js Image
 * Features:
 * - Automatic lazy loading
 * - Blur placeholder support
 * - WebP/AVIF format optimization
 * - Responsive sizing
 * - Error handling
 * - Priority loading for above-the-fold images
 */

import React, { useState, useMemo, memo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  blurDataURL?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
}

function OptimizedImageComponent({
  src,
  alt,
  width,
  height,
  className,
  blurDataURL,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
  fallback = '/images/fallback.svg',
}: OptimizedImageProps) {
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate blur placeholder if not provided
  const placeholderBlur = useMemo(() => {
    if (blurDataURL) return blurDataURL;
    
    // Generate a simple SVG blur placeholder
    // Note: Buffer is not available in browser, use btoa instead
    if (typeof window !== 'undefined') {
      const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="system-ui" font-size="14">Loading...</text></svg>`;
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    } else {
      // Server-side: use Buffer
      const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="system-ui" font-size="14">Loading...</text></svg>`;
      return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    }
  }, [blurDataURL]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    setIsLoading(false);
    onError?.();
  };

  // If error, show fallback
  if (isError && fallback) {
    return (
      <div className={cn('relative overflow-hidden bg-gray-100', className)} style={{ width, height }}>
        <Image
          src={fallback}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          className={cn('object-cover', className)}
          quality={quality}
          priority={priority}
        />
      </div>
    );
  }

  // Use Next.js Image for optimization
  return (
    <div className={cn('relative overflow-hidden', className)} style={!fill ? { width, height } : undefined}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          `object-${objectFit}`,
          className
        )}
        style={objectPosition !== 'center' ? { objectPosition } : undefined}
        sizes={sizes}
        quality={quality}
        priority={priority}
        placeholder={placeholderBlur ? 'blur' : 'empty'}
        blurDataURL={placeholderBlur}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
      />
      
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      )}
    </div>
  );
}

const OptimizedImageMemo = memo(OptimizedImageComponent);

export const OptimizedImage = OptimizedImageMemo;

export default function OptimizedImageWithErrorBoundary(props: OptimizedImageProps) {
  return (
    <ErrorBoundary componentName="OptimizedImage">
      <OptimizedImageMemo {...props} />
    </ErrorBoundary>
  );
}

