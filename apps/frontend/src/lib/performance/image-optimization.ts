/**
 * Image Optimization Utilities
 * P-008: Image optimization avec Cloudinary/Next.js
 */

type ImageFormat = 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
type ImageFit = 'cover' | 'contain' | 'fill' | 'scale-down';
type ImageGravity = 'auto' | 'center' | 'north' | 'south' | 'east' | 'west' | 'face';

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: ImageFormat;
  fit?: ImageFit;
  gravity?: ImageGravity;
  blur?: number;
  grayscale?: boolean;
  sharpen?: boolean;
  dpr?: number;
}

interface ResponsiveImageConfig {
  src: string;
  sizes: string;
  srcSet: { width: number; url: string }[];
}

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'luneo';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image`;

/**
 * Generate Cloudinary URL with transformations
 */
export function getCloudinaryUrl(
  publicId: string,
  options: ImageTransformOptions = {}
): string {
  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    fit = 'cover',
    gravity = 'auto',
    blur,
    grayscale,
    sharpen,
    dpr = 1,
  } = options;

  const transforms: string[] = [];

  // Size transformations
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (dpr > 1) transforms.push(`dpr_${dpr}`);

  // Fit/Crop
  const cropMode = fit === 'cover' ? 'fill' : fit === 'contain' ? 'fit' : 'scale';
  transforms.push(`c_${cropMode}`);
  transforms.push(`g_${gravity}`);

  // Quality
  transforms.push(`q_${quality}`);

  // Format
  transforms.push(`f_${format}`);

  // Effects
  if (blur) transforms.push(`e_blur:${blur}`);
  if (grayscale) transforms.push('e_grayscale');
  if (sharpen) transforms.push('e_sharpen');

  // Add fetch if it's an external URL
  const isExternal = publicId.startsWith('http');
  const fetchPrefix = isExternal ? 'fetch/' : 'upload/';

  return `${CLOUDINARY_BASE_URL}/${fetchPrefix}${transforms.join(',')}/${publicId}`;
}

/**
 * Generate responsive image configuration
 */
export function getResponsiveImage(
  publicId: string,
  options: Omit<ImageTransformOptions, 'width'> & {
    widths?: number[];
    maxWidth?: number;
  } = {}
): ResponsiveImageConfig {
  const { widths = [320, 640, 960, 1280, 1920], maxWidth = 1920, ...baseOptions } = options;

  const srcSet = widths
    .filter(w => w <= maxWidth)
    .map(width => ({
      width,
      url: getCloudinaryUrl(publicId, { ...baseOptions, width }),
    }));

  const srcSetString = srcSet
    .map(({ width, url }) => `${url} ${width}w`)
    .join(', ');

  // Generate sizes attribute
  const sizes = `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`;

  return {
    src: getCloudinaryUrl(publicId, { ...baseOptions, width: widths[Math.floor(widths.length / 2)] }),
    sizes,
    srcSet,
  };
}

/**
 * Generate blur placeholder data URL
 */
export function getBlurDataUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, {
    width: 10,
    height: 10,
    quality: 10,
    blur: 1000,
  });
}

/**
 * Optimize image URL (works with any source)
 */
export function optimizeImageUrl(
  src: string,
  options: ImageTransformOptions = {}
): string {
  // If it's already a Cloudinary URL, extract and rebuild
  if (src.includes('cloudinary.com')) {
    const match = src.match(/\/v\d+\/(.+)$/);
    if (match) {
      return getCloudinaryUrl(match[1], options);
    }
  }

  // For external URLs, use Cloudinary fetch
  if (src.startsWith('http')) {
    return getCloudinaryUrl(src, options);
  }

  // For local paths, return as-is (use Next.js Image)
  return src;
}

/**
 * Get optimal image format based on browser support
 */
export function getOptimalFormat(): ImageFormat {
  if (typeof window === 'undefined') return 'auto';

  // Check for AVIF support
  const canvas = document.createElement('canvas');
  if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    return 'avif';
  }

  // Check for WebP support
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'webp';
  }

  return 'auto';
}

/**
 * Calculate aspect ratio
 */
export function calculateAspectRatio(
  width: number,
  height: number
): { ratio: number; padding: string } {
  const ratio = height / width;
  const padding = `${ratio * 100}%`;
  return { ratio, padding };
}

/**
 * Generate thumbnail URL
 */
export function getThumbnailUrl(src: string, size: number = 150): string {
  return optimizeImageUrl(src, {
    width: size,
    height: size,
    fit: 'cover',
    quality: 60,
  });
}

/**
 * Generate avatar URL
 */
export function getAvatarUrl(src: string | null | undefined, size: number = 40): string {
  if (!src) {
    // Return default avatar
    return `https://ui-avatars.com/api/?size=${size}&background=0D8ABC&color=fff`;
  }

  return optimizeImageUrl(src, {
    width: size * 2, // 2x for retina
    height: size * 2,
    fit: 'cover',
    gravity: 'face',
    quality: 80,
  });
}

/**
 * Generate Open Graph image URL
 */
export function getOgImageUrl(src: string, text?: string): string {
  const baseTransforms: ImageTransformOptions = {
    width: 1200,
    height: 630,
    fit: 'fill',
    quality: 90,
  };

  let url = getCloudinaryUrl(src, baseTransforms);

  // Add text overlay if provided
  if (text) {
    const encodedText = encodeURIComponent(text);
    url = url.replace(
      '/upload/',
      `/upload/l_text:Arial_48_bold:${encodedText},co_white,g_south,y_50/`
    );
  }

  return url;
}

/**
 * Preload image with priority
 */
export function preloadCriticalImage(src: string): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.setAttribute('fetchpriority', 'high');
  document.head.appendChild(link);
}

/**
 * Image loading state tracker
 */
export function createImageLoadTracker(): {
  onLoad: () => void;
  onError: () => void;
  isLoaded: () => boolean;
  isError: () => boolean;
} {
  let loaded = false;
  let error = false;

  return {
    onLoad: () => { loaded = true; },
    onError: () => { error = true; },
    isLoaded: () => loaded,
    isError: () => error,
  };
}

export {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_BASE_URL,
};

