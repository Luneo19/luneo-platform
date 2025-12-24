/**
 * Intelligent Asset Preloading
 * P-007: Preloading intelligent des assets
 */

type PreloadPriority = 'high' | 'low' | 'auto';

interface PreloadOptions {
  priority?: PreloadPriority;
  crossOrigin?: 'anonymous' | 'use-credentials';
  as?: 'image' | 'script' | 'style' | 'font' | 'fetch';
}

/**
 * Preload a single resource
 */
export function preloadResource(url: string, options: PreloadOptions = {}): void {
  if (typeof window === 'undefined') return;

  const { priority = 'auto', crossOrigin, as = 'fetch' } = options;

  // Check if already preloaded
  const existing = document.querySelector(`link[rel="preload"][href="${url}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  
  if (crossOrigin) {
    link.crossOrigin = crossOrigin;
  }

  if (priority === 'high') {
    link.setAttribute('fetchpriority', 'high');
  } else if (priority === 'low') {
    link.setAttribute('fetchpriority', 'low');
  }

  document.head.appendChild(link);
}

/**
 * Preload an image
 */
export function preloadImage(src: string, priority: PreloadPriority = 'auto'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const img = new Image();
    
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    
    if (priority === 'high') {
      img.fetchPriority = 'high';
    }
    
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export async function preloadImages(
  urls: string[],
  options: { concurrency?: number; priority?: PreloadPriority } = {}
): Promise<void> {
  const { concurrency = 3, priority = 'auto' } = options;

  // Process in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    await Promise.allSettled(batch.map(url => preloadImage(url, priority)));
  }
}

/**
 * Preload route/page data
 */
export function preloadRoute(pathname: string): void {
  if (typeof window === 'undefined') return;

  // Use Next.js router prefetch if available
  const router = (window as any).__NEXT_ROUTER__;
  if (router?.prefetch) {
    router.prefetch(pathname);
    return;
  }

  // Fallback: preload the page's JS chunk
  preloadResource(pathname, { as: 'fetch' });
}

/**
 * Preload critical assets for a specific feature
 */
export function preloadFeatureAssets(feature: string): void {
  const assetMap: Record<string, string[]> = {
    '3d-viewer': [
      '/assets/3d/default-texture.webp',
      '/assets/3d/environment.hdr',
    ],
    'ar-viewer': [
      '/assets/ar/marker.png',
      '/assets/ar/loading-animation.json',
    ],
    'canvas-editor': [
      '/assets/editor/fonts.json',
      '/assets/editor/brushes.json',
    ],
    'templates': [
      '/api/templates?limit=12',
    ],
    'cliparts': [
      '/api/cliparts/categories',
    ],
  };

  const assets = assetMap[feature];
  if (!assets) return;

  assets.forEach(url => {
    if (url.endsWith('.webp') || url.endsWith('.png') || url.endsWith('.jpg')) {
      preloadImage(url);
    } else {
      preloadResource(url);
    }
  });
}

/**
 * Intersection Observer based preloading
 * Preload assets when element is about to enter viewport
 */
export function createPreloadObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined') return null;

  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '200px', // Start preloading 200px before visible
    threshold: 0,
    ...options,
  };

  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback();
      }
    });
  }, defaultOptions);
}

/**
 * Preload based on user interaction prediction
 */
export function setupHoverPreload(
  element: HTMLElement,
  preloadFn: () => void,
  delay: number = 100
): () => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let preloaded = false;

  const handleMouseEnter = () => {
    if (preloaded) return;
    
    timeoutId = setTimeout(() => {
      preloadFn();
      preloaded = true;
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);

  // Return cleanup function
  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
    if (timeoutId) clearTimeout(timeoutId);
  };
}

/**
 * Prefetch data using the browser's idle time
 */
export function prefetchOnIdle(callback: () => void): void {
  if (typeof window === 'undefined') return;

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout: 2000 });
  } else {
    // Fallback for Safari
    setTimeout(callback, 100);
  }
}

/**
 * Preload critical fonts
 */
export function preloadFonts(fonts: { url: string; format: string }[]): void {
  fonts.forEach(({ url, format }) => {
    preloadResource(url, {
      as: 'font',
      crossOrigin: 'anonymous',
    });
  });
}

/**
 * Network-aware preloading
 * Only preload on fast connections
 */
export function shouldPreload(): boolean {
  if (typeof navigator === 'undefined') return true;

  const connection = (navigator as any).connection;
  if (!connection) return true;

  // Don't preload on slow connections or save-data mode
  if (connection.saveData) return false;
  if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
    return false;
  }

  return true;
}

/**
 * Smart preload based on connection
 */
export function smartPreload(highPriorityFn: () => void, lowPriorityFn?: () => void): void {
  if (!shouldPreload()) return;

  highPriorityFn();

  if (lowPriorityFn) {
    prefetchOnIdle(lowPriorityFn);
  }
}

