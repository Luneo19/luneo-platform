'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface IframeWrapperProps {
  customizerId: string;
  productId?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  onDesignSaved?: (data: unknown) => void;
  onDesignExported?: (data: unknown) => void;
  onAddedToCart?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

export function IframeWrapper({
  customizerId,
  productId,
  width = '100%',
  height = 600,
  className,
  theme = 'light',
  onDesignSaved,
  onDesignExported,
  onAddedToCart,
  onError,
}: IframeWrapperProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const embedUrl = productId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/customize/${productId}?embed=true&theme=${theme}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/customizer/${customizerId}?embed=true&theme=${theme}`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleMessage = (event: MessageEvent) => {
      // Validate origin in production
      // if (event.origin !== expectedOrigin) return;

      try {
        const { type, data } = event.data;

        switch (type) {
          case 'customizer-ready':
            setIsLoading(false);
            logger.info('Customizer iframe ready', { customizerId, productId });
            break;

          case 'design-saved':
            logger.info('Design saved from iframe', { data });
            onDesignSaved?.(data);
            break;

          case 'design-exported':
            logger.info('Design exported from iframe', { data });
            onDesignExported?.(data);
            break;

          case 'added-to-cart':
            logger.info('Added to cart from iframe', { data });
            onAddedToCart?.(data);
            break;

          case 'error':
            logger.error('Error from customizer iframe', { error: data });
            onError?.(new Error(data.message || 'Unknown error'));
            break;

          default:
            logger.warn('Unknown message type from iframe', { type, data });
        }
      } catch (err) {
        logger.error('Failed to handle message from iframe', { error: err });
        onError?.(err instanceof Error ? err : new Error('Failed to handle message'));
      }
    };

    window.addEventListener('message', handleMessage);

    // Send initial config to iframe when it loads
    const handleLoad = () => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: 'customizer-config',
            config: {
              theme,
            },
          },
          '*'
        );
      }
    };

    iframe.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('message', handleMessage);
      iframe.removeEventListener('load', handleLoad);
    };
  }, [customizerId, productId, theme, onDesignSaved, onDesignExported, onAddedToCart, onError]);

  // Handle resize
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleResize = () => {
      // Iframe will handle its own responsive sizing
      // This is just for external resize events
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={cn('relative w-full', className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <div className="text-sm text-muted-foreground">Loading customizer...</div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        width={width}
        height={height}
        className="w-full border-0"
        style={{
          minHeight: typeof height === 'number' ? `${height}px` : height,
        }}
        allowFullScreen
        title="Customizer"
      />
    </div>
  );
}
