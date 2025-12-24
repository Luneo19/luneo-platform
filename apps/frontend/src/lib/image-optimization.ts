import { ImageLoader } from 'next/image';

// Configuration pour Cloudinary
export const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality || 'auto'}`];
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${params.join(',')}/${src}`;
};

// Configuration pour les images locales
export const localImageLoader: ImageLoader = ({ src, width, quality }) => {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
};

// Génération de blurDataURL pour les images
export const generateBlurDataURL = (width: number, height: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  return canvas.toDataURL();
};

// Configuration des tailles d'images responsives
export const imageSizes = {
  // Images de profil
  avatar: {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  },
  
  // Images de produits
  product: {
    thumb: 150,
    small: 300,
    medium: 600,
    large: 1200,
  },
  
  // Images de bannière
  banner: {
    mobile: 375,
    tablet: 768,
    desktop: 1200,
    wide: 1920,
  },
  
  // Images de galerie
  gallery: {
    thumb: 200,
    preview: 400,
    full: 800,
  },
};

// Génération de srcSet pour les images responsives
export const generateSrcSet = (
  baseSrc: string,
  sizes: number[],
  loader: ImageLoader = localImageLoader
): string => {
  return sizes
    .map(size => `${loader({ src: baseSrc, width: size })} ${size}w`)
    .join(', ');
};

// Configuration optimisée pour les images Next.js
export const getOptimizedImageProps = (
  src: string,
  alt: string,
  options: {
    width?: number;
    height?: number;
    priority?: boolean;
    quality?: number;
    sizes?: string;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    className?: string;
  } = {}
) => {
  const {
    width,
    height,
    priority = false,
    quality = 75,
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    placeholder = 'blur',
    blurDataURL,
    className,
  } = options;

  return {
    src,
    alt,
    width,
    height,
    priority,
    quality,
    sizes,
    placeholder,
    blurDataURL: blurDataURL || (placeholder === 'blur' ? generateBlurDataURL(width || 400, height || 300) : undefined),
    className,
    loader: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? cloudinaryLoader : localImageLoader,
  };
};

// Hook pour optimiser les images en lot
export const useImageOptimization = () => {
  const preloadImage = (src: string, width: number, quality: number = 75) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = cloudinaryLoader({ src, width, quality });
    document.head.appendChild(link);
  };

  const preloadImages = (images: Array<{ src: string; width: number; quality?: number }>) => {
    images.forEach(({ src, width, quality = 75 }) => {
      preloadImage(src, width, quality);
    });
  };

  const generateLazyLoadingImages = (
    images: string[],
    options: {
      width?: number;
      height?: number;
      quality?: number;
      placeholder?: 'blur' | 'empty';
    } = {}
  ) => {
    return images.map(src => ({
      ...getOptimizedImageProps(src, '', options),
      loading: 'lazy' as const,
    }));
  };

  return {
    preloadImage,
    preloadImages,
    generateLazyLoadingImages,
  };
};

// Configuration des formats d'images supportés
export const supportedFormats = {
  webp: 'image/webp',
  avif: 'image/avif',
  jpeg: 'image/jpeg',
  png: 'image/png',
} as const;

// Vérification du support des formats modernes
export const getSupportedFormat = (): string => {
  if (typeof window === 'undefined') return supportedFormats.jpeg;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    return supportedFormats.avif;
  }
  
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return supportedFormats.webp;
  }
  
  return supportedFormats.jpeg;
};

// Optimisation des images pour le SEO
export const getSEOImageProps = (
  src: string,
  alt: string,
  width: number,
  height: number
) => {
  const optimizedProps = getOptimizedImageProps(src, alt, {
    width,
    height,
    priority: true,
    quality: 90,
  });

  return {
    ...optimizedProps,
    // Ajouter les métadonnées pour le SEO
    'data-seo': 'true',
    'aria-label': alt,
    role: 'img',
  };
};

export const ImageOptimizationService = {
  cloudinaryLoader,
  localImageLoader,
  generateBlurDataURL,
  imageSizes,
  generateSrcSet,
  getOptimizedImageProps,
  useImageOptimization,
  supportedFormats,
  getSupportedFormat,
  getSEOImageProps,
};


