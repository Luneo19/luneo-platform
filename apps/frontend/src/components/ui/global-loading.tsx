'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface GlobalLoadingContextValue {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  startLoading: () => void;
  stopLoading: () => void;
}

const GlobalLoadingContext = React.createContext<GlobalLoadingContextValue | null>(null);

/**
 * Provider pour le chargement global de l'application
 * PHASE 3: Amélioration UX Frontend
 */
export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const loadingCountRef = React.useRef(0);

  const startLoading = React.useCallback(() => {
    loadingCountRef.current += 1;
    setIsLoading(true);
  }, []);

  const stopLoading = React.useCallback(() => {
    loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);
    if (loadingCountRef.current === 0) {
      setIsLoading(false);
    }
  }, []);

  const setLoading = React.useCallback((loading: boolean) => {
    if (loading) {
      startLoading();
    } else {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return (
    <GlobalLoadingContext.Provider value={{ isLoading, setLoading, startLoading, stopLoading }}>
      {children}
      <GlobalLoadingIndicator isLoading={isLoading} />
    </GlobalLoadingContext.Provider>
  );
}

/**
 * Hook pour contrôler le chargement global
 */
export function useGlobalLoading() {
  const context = React.useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within GlobalLoadingProvider');
  }
  return context;
}

/**
 * Indicateur de chargement global (barre de progression en haut de page)
 */
function GlobalLoadingIndicator({ isLoading }: { isLoading: boolean }) {
  const [progress, setProgress] = React.useState(0);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (isLoading) {
      setProgress(0);
      // Animate progress bar
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          // Slow down as we approach 90%
          const increment = Math.max(1, (90 - prev) / 10);
          return Math.min(90, prev + increment);
        });
      }, 100);
    } else {
      // Complete the progress bar
      setProgress(100);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Reset after animation
      const timeout = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timeout);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoading]);

  if (progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent">
      <div
        className={cn(
          'h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out',
          !isLoading && 'opacity-0'
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/**
 * Composant overlay de chargement pour sections
 */
export function LoadingOverlay({
  isLoading,
  children,
  className,
  message = 'Chargement...',
}: {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  message?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Spinner de chargement inline
 */
export function LoadingSpinner({
  size = 'default',
  className,
}: {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
  );
}

export { GlobalLoadingContext };
