/**
 * CDN Image Optimizer
 * Inspired by Vercel Image Optimization and Shopify CDN
 */

const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL || '';
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
}

/**
 * Optimize image URL with CDN parameters
 */
export function optimizeImageUrl(
  src: string,
  options: ImageOptimizationOptions = {},
): string {
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    fit = 'cover',
    gravity = 'auto',
  } = options;

  // If using Cloudinary
  if (CLOUDINARY_CLOUD_NAME && src.includes('cloudinary.com')) {
    const transformations = [];
    
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    transformations.push(`q_${quality}`);
    transformations.push(`f_${format}`);
    transformations.push(`c_${fit}`);
    if (gravity !== 'auto') transformations.push(`g_${gravity}`);

    const baseUrl = src.split('/upload/')[0];
    const path = src.split('/upload/')[1];
    
    return `${baseUrl}/upload/${transformations.join(',')}/${path}`;
  }

  // If using custom CDN
  if (CDN_BASE_URL && src.startsWith('/')) {
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('q', quality.toString());
    params.append('f', format);
    params.append('fit', fit);
    if (gravity !== 'auto') params.append('g', gravity);

    return `${CDN_BASE_URL}${src}?${params.toString()}`;
  }

  // Use Next.js Image Optimization if available
  if (src.startsWith('/') || src.startsWith('http')) {
    return src; // Next.js will handle optimization
  }

  return src;
}

/**
 * Get responsive image srcset
 */
export function getResponsiveSrcSet(
  src: string,
  sizes: number[] = [640, 768, 1024, 1280, 1920],
): string {
  return sizes
    .map((size) => `${optimizeImageUrl(src, { width: size })} ${size}w`)
    .join(', ');
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, as: 'image' = 'image'): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = optimizeImageUrl(src, { quality: 90 });
  document.head.appendChild(link);
}
