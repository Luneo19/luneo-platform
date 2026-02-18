'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface Configurator3DProviderProps {
  configurationId: string;
  projectId?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Configurator3DProvider - Context provider for the 3D Configurator
 * Initializes the Zustand store, provides loading/error states,
 * and renders children only when initialized.
 */
export function Configurator3DProvider({
  configurationId,
  projectId,
  children,
  className,
}: Configurator3DProviderProps) {
  const initialize = useConfigurator3DStore((s) => s.initialize);
  const isLoading = useConfigurator3DStore((s) => s.isLoading);
  const isInitialized = useConfigurator3DStore((s) => s.isInitialized);
  const error = useConfigurator3DStore((s) => s.error);
  const reset = useConfigurator3DStore((s) => s.reset);

  useEffect(() => {
    if (!configurationId) return;
    initialize(configurationId, projectId);
  }, [configurationId, projectId, initialize]);

  const handleRetry = useCallback(() => {
    reset();
    if (configurationId) {
      initialize(configurationId, projectId);
    }
  }, [configurationId, projectId, initialize, reset]);

  return (
    <div
      className={cn(
        'relative flex min-h-[400px] w-full flex-col overflow-hidden rounded-xl',
        className
      )}
    >
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm p-8"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                Failed to load configurator
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" onClick={handleRetry} size="lg">
              Try again
            </Button>
          </motion.div>
        )}

        {isLoading && !isInitialized && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm p-8"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="space-y-3 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                Loading configurator
              </h3>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-2 w-48 rounded-full" />
                <Skeleton className="h-2 w-32 rounded-full" />
                <Skeleton className="h-2 w-40 rounded-full" />
              </div>
            </div>
          </motion.div>
        )}

        {isInitialized && !error && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full flex-1"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
