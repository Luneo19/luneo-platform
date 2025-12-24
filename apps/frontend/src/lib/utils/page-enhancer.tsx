/**
 * Page Enhancer Utility
 * 
 * HOC et composants pour améliorer automatiquement toutes les pages
 * - ErrorBoundary automatique
 * - Lazy loading
 * - Performance optimizations
 */

import React, { ComponentType, Suspense, lazy, memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// ============================================
// LOADING COMPONENT
// ============================================

export function PageLoader({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
        <p className="text-white font-medium">{message}</p>
      </div>
    </div>
  );
}

// ============================================
// PAGE WRAPPER HOC
// ============================================

/**
 * Wrapper HOC pour améliorer automatiquement une page
 * - Ajoute ErrorBoundary
 * - Ajoute Suspense pour lazy loading
 * - Optimise performance
 */
export function withPageEnhancements<P extends object>(
  Component: ComponentType<P>,
  options: {
    errorBoundary?: boolean;
    lazy?: boolean;
    componentName?: string;
    errorLevel?: 'page' | 'component' | 'global';
  } = {}
) {
  const {
    errorBoundary = true,
    lazy = false,
    componentName,
    errorLevel = 'page',
  } = options;

  const displayName = componentName || Component.displayName || Component.name || 'Page';

  function EnhancedPage(props: P) {
    const WrappedComponent = lazy ? lazy(() => Promise.resolve({ default: Component })) : Component;

    if (lazy) {
      return (
        <ErrorBoundary level={errorLevel} componentName={displayName}>
          <Suspense fallback={<PageLoader />}>
            <WrappedComponent {...props} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (errorBoundary) {
      return (
        <ErrorBoundary level={errorLevel} componentName={displayName}>
          <Component {...props} />
        </ErrorBoundary>
      );
    }

    return <Component {...props} />;
  }

  EnhancedPage.displayName = `withPageEnhancements(${displayName})`;
  return memo(EnhancedPage);
}

// ============================================
// PAGE WRAPPER COMPONENT
// ============================================

/**
 * Composant wrapper simple pour pages
 */
export function PageWrapper({
  children,
  componentName,
  errorLevel = 'page',
  showLoader = false,
}: {
  children: React.ReactNode;
  componentName?: string;
  errorLevel?: 'page' | 'component' | 'global';
  showLoader?: boolean;
}) {
  if (showLoader) {
    return (
      <ErrorBoundary level={errorLevel} componentName={componentName}>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level={errorLevel} componentName={componentName}>
      {children}
    </ErrorBoundary>
  );
}

// ============================================
// LAZY COMPONENT HELPER
// ============================================

/**
 * Helper pour créer des composants lazy avec ErrorBoundary
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  componentName?: string
) {
  const LazyComponent = lazy(importFn);

  return memo((props: P) => (
    <ErrorBoundary level="component" componentName={componentName}>
      <Suspense fallback={<PageLoader />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  ));
}

