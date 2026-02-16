'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void | Promise<void>;
  threshold?: number; // Distance from bottom in pixels
  rootMargin?: string;
}

/**
 * Hook pour implémenter l'infinite scroll
 * Utilise IntersectionObserver pour détecter quand l'utilisateur approche du bas de la page
 */
export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  threshold = 200,
  rootMargin = '0px',
}: UseInfiniteScrollOptions) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      setIsIntersecting(entry.isIntersecting);

      if (entry.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Options pour l'observer
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin,
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver(handleIntersection, options);
    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, rootMargin]);

  // Composant sentinelle à placer à la fin de la liste
  const Sentinel: React.FC = () => {
    // threshold est une prop du hook, pas du composant, donc pas besoin dans les deps
    const sentinelStyle = useMemo<React.CSSProperties>(() => {
      const pxValue = 'px';
      const marginValue = String(threshold) + pxValue;
      return { marginTop: marginValue };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    return React.createElement(
      'div',
      {
        ref: elementRef,
        className: 'h-1 w-full',
        style: sentinelStyle,
        'aria-hidden': 'true',
      }
    );
  };

  return {
    Sentinel,
    isIntersecting,
  };
}

