import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

interface PreloadOptions {
  priority?: 'high' | 'low';
  timeout?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface PreloadResource {
  href: string;
  type: 'route' | 'image' | 'script' | 'style';
  options?: PreloadOptions;
}

export const usePreloader = () => {
  const router = useRouter();
  const preloadedResources = useRef<Set<string>>(new Set());
  const preloadPromises = useRef<Map<string, Promise<any>>>(new Map());

  // Précharger une route
  const preloadRoute = useCallback((href: string, options: PreloadOptions = {}) => {
    if (preloadedResources.current.has(href)) {
      return Promise.resolve();
    }

    const { priority = 'low', timeout = 5000 } = options;
    
    const preloadPromise = new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Preload timeout for ${href}`));
      }, timeout);

      // Utiliser le router de Next.js pour précharger
      const schedulePrefetch = () => router.prefetch(href);
      if (priority === 'high' || typeof window === 'undefined') {
        schedulePrefetch();
      } else if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => schedulePrefetch());
      } else {
        setTimeout(schedulePrefetch, 200);
      }
      
      // Marquer comme préchargé immédiatement (Next.js gère le cache)
      preloadedResources.current.add(href);
      
      clearTimeout(timeoutId);
      resolve();
    });

    preloadPromises.current.set(href, preloadPromise);
    return preloadPromise;
  }, [router]);

  // Précharger une image
  const preloadImage = useCallback((src: string, options: PreloadOptions = {}) => {
    if (preloadedResources.current.has(src)) {
      return Promise.resolve();
    }

    const { priority = 'low', timeout = 10000, onLoad, onError } = options;
    
    const preloadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Image preload timeout for ${src}`));
      }, timeout);

      const img = new Image();
      
      img.onload = () => {
        clearTimeout(timeoutId);
        preloadedResources.current.add(src);
        onLoad?.();
        resolve(img);
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        const errorObj = new Error(`Failed to preload image ${src}`);
        onError?.(errorObj);
        reject(errorObj);
      };

      // Définir la priorité de chargement
      if (priority === 'high') {
        img.fetchPriority = 'high';
      }

      img.src = src;
    });

    preloadPromises.current.set(src, preloadPromise);
    return preloadPromise;
  }, []);

  // Précharger un script
  const preloadScript = useCallback((src: string, options: PreloadOptions = {}) => {
    if (preloadedResources.current.has(src)) {
      return Promise.resolve();
    }

    const { timeout = 10000, onLoad, onError } = options;
    
    const preloadPromise = new Promise<HTMLScriptElement>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Script preload timeout for ${src}`));
      }, timeout);

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = src;
      link.crossOrigin = 'anonymous';

      link.onload = () => {
        clearTimeout(timeoutId);
        preloadedResources.current.add(src);
        onLoad?.();
        resolve(link as any);
      };

      link.onerror = () => {
        clearTimeout(timeoutId);
        const errorObj = new Error(`Failed to preload script ${src}`);
        onError?.(errorObj);
        reject(errorObj);
      };

      document.head.appendChild(link);
    });

    preloadPromises.current.set(src, preloadPromise);
    return preloadPromise;
  }, []);

  // Précharger un style
  const preloadStyle = useCallback((href: string, options: PreloadOptions = {}) => {
    if (preloadedResources.current.has(href)) {
      return Promise.resolve();
    }

    const { timeout = 10000, onLoad, onError } = options;
    
    const preloadPromise = new Promise<HTMLLinkElement>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Style preload timeout for ${href}`));
      }, timeout);

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;

      link.onload = () => {
        clearTimeout(timeoutId);
        preloadedResources.current.add(href);
        onLoad?.();
        resolve(link);
      };

      link.onerror = () => {
        clearTimeout(timeoutId);
        const errorObj = new Error(`Failed to preload style ${href}`);
        onError?.(errorObj);
        reject(errorObj);
      };

      document.head.appendChild(link);
    });

    preloadPromises.current.set(href, preloadPromise);
    return preloadPromise;
  }, []);

  // Précharger plusieurs ressources
  const preloadResources = useCallback(async (resources: PreloadResource[]) => {
    const promises = resources.map(resource => {
      switch (resource.type) {
        case 'route':
          return preloadRoute(resource.href, resource.options);
        case 'image':
          return preloadImage(resource.href, resource.options);
        case 'script':
          return preloadScript(resource.href, resource.options);
        case 'style':
          return preloadStyle(resource.href, resource.options);
        default:
          return Promise.resolve();
      }
    });

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      logger.warn('Some resources failed to preload', {
        error: error instanceof Error ? error.message : String(error),
        resourcesCount: resources.length,
      });
    }
  }, [preloadRoute, preloadImage, preloadScript, preloadStyle]);

  // Précharger sur hover
  const preloadOnHover = useCallback((
    element: HTMLElement,
    resources: PreloadResource[],
    delay: number = 100
  ) => {
    let timeoutId: NodeJS.Timeout;
    let hasPreloaded = false;

    const handleMouseEnter = () => {
      if (hasPreloaded) return;

      timeoutId = setTimeout(() => {
        preloadResources(resources);
        hasPreloaded = true;
      }, delay);
    };

    const handleMouseLeave = () => {
      clearTimeout(timeoutId);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timeoutId);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [preloadResources]);

  // Précharger les routes critiques
  const preloadCriticalRoutes = useCallback(() => {
    const criticalRoutes = [
      '/dashboard',
      '/ai-studio',
      '/analytics',
      '/products',
      '/billing',
      '/team',
      '/integrations',
    ];

    criticalRoutes.forEach(route => {
      preloadRoute(route, { priority: 'high' });
    });
  }, [preloadRoute]);

  // Précharger les images critiques
  const preloadCriticalImages = useCallback((images: string[]) => {
    images.forEach(src => {
      preloadImage(src, { priority: 'high' });
    });
  }, [preloadImage]);

  // Nettoyer les ressources préchargées
  const cleanup = useCallback(() => {
    preloadedResources.current.clear();
    preloadPromises.current.clear();
  }, []);

  // Vérifier si une ressource est préchargée
  const isPreloaded = useCallback((href: string) => {
    return preloadedResources.current.has(href);
  }, []);

  // Obtenir les statistiques de préchargement
  const getStats = useCallback(() => {
    return {
      preloadedCount: preloadedResources.current.size,
      pendingCount: preloadPromises.current.size,
      preloadedResources: Array.from(preloadedResources.current),
    };
  }, []);

  return {
    preloadRoute,
    preloadImage,
    preloadScript,
    preloadStyle,
    preloadResources,
    preloadOnHover,
    preloadCriticalRoutes,
    preloadCriticalImages,
    cleanup,
    isPreloaded,
    getStats,
  };
};

// Hook pour précharger automatiquement sur la page d'accueil
export const useHomepagePreloader = () => {
  const preloader = usePreloader();

  useEffect(() => {
    // Précharger les routes critiques après un délai
    const timer = setTimeout(() => {
      preloader.preloadCriticalRoutes();
    }, 2000);

    return () => clearTimeout(timer);
  }, [preloader]);

  return preloader;
};

// Hook pour précharger sur interaction utilisateur
export const useInteractionPreloader = () => {
  const preloader = usePreloader();

  useEffect(() => {
    // Précharger les routes critiques après la première interaction
    const handleFirstInteraction = () => {
      preloader.preloadCriticalRoutes();
      document.removeEventListener('mousedown', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('mousedown', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('mousedown', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [preloader]);

  return preloader;
};

export default usePreloader;


