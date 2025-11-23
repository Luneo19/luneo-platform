/**
 * Utilitaires Cloudinary CDN pour optimisation d'images
 * Support WebP, AVIF, responsive images, lazy loading
 */

export interface CloudinaryOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
  dpr?: number; // Device Pixel Ratio (1, 2, 3 pour retina)
  fetchFormat?: 'auto';
}

/**
 * Génère une URL Cloudinary optimisée
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: CloudinaryOptions = {}
): string {
  const {
    width,
    height,
    quality = 'auto:good',
    format = 'auto',
    crop = 'fill',
    gravity = 'auto',
    dpr = 1,
    fetchFormat = 'auto',
  } = options;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'deh4aokbx';
  
  // Construire les transformations
  const transformations: string[] = [];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (gravity) transformations.push(`g_${gravity}`);
  if (dpr) transformations.push(`dpr_${dpr}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  if (fetchFormat) transformations.push(`fetch_format_${fetchFormat}`);

  const transformString = transformations.join(',');
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`;
}

/**
 * Génère un srcset pour images responsive
 */
export function getResponsiveSrcSet(
  publicId: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1536],
  options: Omit<CloudinaryOptions, 'width'> = {}
): string {
  return widths
    .map(width => {
      const url = getOptimizedImageUrl(publicId, { ...options, width });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Génère les URLs pour différentes résolutions (retina)
 */
export function getRetinaUrls(
  publicId: string,
  baseWidth: number,
  options: CloudinaryOptions = {}
): { '1x': string; '2x': string; '3x': string } {
  return {
    '1x': getOptimizedImageUrl(publicId, { ...options, width: baseWidth, dpr: 1 }),
    '2x': getOptimizedImageUrl(publicId, { ...options, width: baseWidth, dpr: 2 }),
    '3x': getOptimizedImageUrl(publicId, { ...options, width: baseWidth, dpr: 3 }),
  };
}

/**
 * Convertit une URL Cloudinary en URL optimisée
 */
export function optimizeCloudinaryUrl(
  url: string,
  options: CloudinaryOptions = {}
): string {
  // Extraire le public_id de l'URL
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  if (!match) return url;
  
  const publicId = match[1];
  return getOptimizedImageUrl(publicId, options);
}

/**
 * Génère un thumbnail optimisé
 */
export function getThumbnail(
  publicId: string,
  size: number = 200,
  options: CloudinaryOptions = {}
): string {
  return getOptimizedImageUrl(publicId, {
    width: size,
    height: size,
    crop: 'thumb',
    gravity: 'auto',
    quality: 'auto:good',
    format: 'auto',
    ...options,
  });
}

/**
 * Génère une image de placeholder (blur)
 */
export function getPlaceholderUrl(
  publicId: string,
  width: number = 20
): string {
  return getOptimizedImageUrl(publicId, {
    width,
    quality: 10,
    format: 'auto',
  });
}

/**
 * Configurations prédéfinies
 */
export const imagePresets = {
  thumbnail: (publicId: string) => getThumbnail(publicId, 200),
  small: (publicId: string) => getOptimizedImageUrl(publicId, { width: 400, quality: 'auto:good' }),
  medium: (publicId: string) => getOptimizedImageUrl(publicId, { width: 800, quality: 'auto:good' }),
  large: (publicId: string) => getOptimizedImageUrl(publicId, { width: 1200, quality: 'auto:best' }),
  hero: (publicId: string) => getOptimizedImageUrl(publicId, { width: 1920, quality: 'auto:best', format: 'avif' }),
  avatar: (publicId: string) => getOptimizedImageUrl(publicId, { 
    width: 200, 
    height: 200, 
    crop: 'thumb', 
    gravity: 'face',
    quality: 'auto:best',
  }),
};

/**
 * Helper pour composants React Image
 */
export function getImageProps(
  publicId: string,
  alt: string,
  options: CloudinaryOptions = {}
) {
  const baseWidth = options.width || 800;
  
  return {
    src: getOptimizedImageUrl(publicId, options),
    srcSet: getResponsiveSrcSet(publicId, undefined, options),
    sizes: `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${baseWidth}px`,
    alt,
    loading: 'lazy' as const,
    decoding: 'async' as const,
  };
}

