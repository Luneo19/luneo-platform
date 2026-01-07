/**
 * Bundle Optimization Utilities
 * 
 * Helpers for optimizing bundle size and performance
 */

/**
 * Import only what you need from large libraries
 * Example: Instead of `import _ from 'lodash'`, use `import debounce from 'lodash/debounce'`
 */

/**
 * Lazy load heavy libraries only when needed
 */
export async function loadHeavyLibrary(libraryName: string) {
  switch (libraryName) {
    case 'three':
      return await import('three');
    case 'react-three-fiber':
      return await import('@react-three/fiber');
    case 'react-three-drei':
      return await import('@react-three/drei');
    case 'chartjs':
      return await import('chart.js');
    case 'react-chartjs-2':
      return await import('react-chartjs-2');
    default:
      throw new Error(`Unknown library: ${libraryName}`);
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoize expensive function calls
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Check if code is running on client side
 */
export const isClient = typeof window !== 'undefined';

/**
 * Check if code is running on server side
 */
export const isServer = typeof window === 'undefined';

/**
 * Load script dynamically
 */
export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isServer) {
      reject(new Error('Cannot load script on server'));
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Load stylesheet dynamically
 */
export function loadStylesheet(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isServer) {
      reject(new Error('Cannot load stylesheet on server'));
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
    document.head.appendChild(link);
  });
}












