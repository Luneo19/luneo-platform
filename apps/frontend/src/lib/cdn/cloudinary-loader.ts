/**
 * Cloudinary Image Loader for Next.js Image Optimization
 * Automatically optimizes images via Cloudinary CDN
 */

import type { ImageLoaderProps } from 'next/image';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!CLOUDINARY_CLOUD_NAME) {
    // Fallback to Next.js Image Optimization if Cloudinary not configured
    return src;
  }

  // If src is already a Cloudinary URL, optimize it
  if (src.includes('cloudinary.com')) {
    const params = [
      'f_auto', // Auto format (WebP/AVIF)
      'c_limit', // Limit dimensions
      `w_${width}`,
      `q_${quality || 'auto'}`,
    ];
    
    // Extract the path after /upload/
    const parts = src.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/${params.join(',')}/${parts[1]}`;
    }
    return src;
  }

  // If src is a local path, construct Cloudinary URL
  const publicId = src.startsWith('/') ? src.slice(1) : src;
  const params = [
    'f_auto',
    'c_limit',
    `w_${width}`,
    `q_${quality || 'auto'}`,
  ];

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${params.join(',')}/${publicId}`;
}
