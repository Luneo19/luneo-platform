/**
 * Performance Module
 * Export centralisé des utilitaires de performance
 */

// Lazy loading - importing from LazyComponents.tsx (capital L)
export {
  LazyThreeViewer,
  LazyARViewer,
  LazyCanvasEditor,
  LazyProductCustomizer,
  LazyTemplateGallery,
  LazyClipartBrowser,
  LazyAnalyticsDashboard,
  LazyAIStudio,
  LazyWrapper,
  preloadComponent,
  LoadingSpinner,
  Loading3D,
  LoadingAR,
  LoadingCanvas,
} from './LazyComponents';

// Preloading
export {
  preloadResource,
  preloadImage,
  preloadImages,
  preloadRoute,
  preloadFeatureAssets,
  createPreloadObserver,
  setupHoverPreload,
  prefetchOnIdle,
  preloadFonts,
  shouldPreload,
  smartPreload,
} from './preload';

// Image optimization
export {
  getCloudinaryUrl,
  getResponsiveImage,
  getBlurDataUrl,
  optimizeImageUrl,
  getOptimalFormat,
  calculateAspectRatio,
  getThumbnailUrl,
  getAvatarUrl,
  getOgImageUrl,
  preloadCriticalImage,
  createImageLoadTracker,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_BASE_URL,
} from './image-optimization';

