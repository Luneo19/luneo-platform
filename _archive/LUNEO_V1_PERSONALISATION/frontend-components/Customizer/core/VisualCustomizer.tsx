'use client';

import { useCustomizer } from '@/hooks/customizer';
import { CustomizerProvider } from './CustomizerProvider';
import { CustomizerUI } from './CustomizerUI';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VisualCustomizerProps {
  customizerId: string;
}

/**
 * VisualCustomizer - Root component for the Visual Customizer
 * Handles initialization, loading, and error states
 */
export function VisualCustomizer({ customizerId }: VisualCustomizerProps) {
  const { config, isLoading, error, isInitialized, initialize } = useCustomizer({
    customizerId,
    autoInitialize: true,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-full max-w-4xl space-y-4 p-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-[600px] w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-6">
        <Alert className="max-w-md" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load customizer</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <Button
              onClick={() => initialize()}
              variant="outline"
              size="sm"
              className="mt-4 w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Not initialized yet
  if (!isInitialized || !config) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  // Render customizer
  return (
    <CustomizerProvider config={config}>
      <div className="flex h-screen w-full flex-col overflow-hidden">
        <CustomizerUI />
      </div>
    </CustomizerProvider>
  );
}
