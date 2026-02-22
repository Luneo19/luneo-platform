'use client';

import { useEffect, useState } from 'react';
import { useCustomizer } from '@/hooks/customizer';
import { PostMessageHandler } from './PostMessageHandler';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface EmbeddedCustomizerProps {
  customizerId: string;
  productId?: string;
  config?: {
    theme?: 'light' | 'dark' | 'auto';
    hideHeader?: boolean;
    hideFooter?: boolean;
  };
}

export function EmbeddedCustomizer({
  customizerId,
  productId,
  config = {},
}: EmbeddedCustomizerProps) {
  const { config: customizerConfig, isLoading, error, isInitialized } = useCustomizer({
    customizerId,
    autoInitialize: true,
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isInitialized && customizerConfig) {
      setIsReady(true);
      // Notify parent that customizer is ready
      if (typeof window !== 'undefined' && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'customizer-ready',
            customizerId,
            productId,
          },
          '*'
        );
      }
    }
  }, [isInitialized, customizerConfig, customizerId, productId]);

  // Listen for config from parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'customizer-config') {
        // Apply config from parent
        logger.info('Received config from parent', { config: event.data.config });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="w-full max-w-4xl space-y-4 p-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-[600px] w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-6">
        <Alert className="max-w-md" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="mt-2">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isReady || !customizerConfig) {
    return null;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <PostMessageHandler customizerId={customizerId} productId={productId} />
      {/* Customizer UI would be rendered here */}
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Customizer content goes here
      </div>
    </div>
  );
}
