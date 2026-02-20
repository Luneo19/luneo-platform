'use client';

import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

interface PostMessageHandlerProps {
  customizerId: string;
  productId?: string;
  allowedOrigins?: string[];
}

export type CustomizerMessage =
  | { type: 'customizer-ready'; customizerId: string; productId?: string }
  | { type: 'design-saved'; data: { designId: string; [key: string]: unknown } }
  | { type: 'design-exported'; data: { format: string; url: string; [key: string]: unknown } }
  | { type: 'added-to-cart'; data: { designId: string; [key: string]: unknown } }
  | { type: 'error'; error: { message: string; code?: string } }
  | { type: 'customizer-config'; config: Record<string, unknown> };

export function PostMessageHandler({
  customizerId,
  productId,
  allowedOrigins = [],
}: PostMessageHandlerProps) {
  const handlerRef = useRef<{
    sendMessage: (message: CustomizerMessage) => void;
  }>(null);

  // Validate origin
  const isValidOrigin = (origin: string): boolean => {
    if (allowedOrigins.length === 0) {
      // In development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      // In production, only allow same origin
      return origin === window.location.origin;
    }
    return allowedOrigins.includes(origin);
  };

  // Listen for messages from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!isValidOrigin(event.origin)) {
        logger.warn('Message from invalid origin', { origin: event.origin });
        return;
      }

      try {
        const message = event.data as CustomizerMessage;

        switch (message.type) {
          case 'customizer-config':
            logger.info('Received config from parent', { config: message.config });
            // Apply config to customizer
            break;

          default:
            logger.warn('Unknown message type from parent', { type: message.type });
        }
      } catch (err) {
        logger.error('Failed to handle message from parent', { error: err });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedOrigins]);

  // Send message to parent
  const sendMessage = (message: CustomizerMessage) => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage(message, '*'); // In production, use specific origin
      logger.info('Sent message to parent', { type: message.type });
    }
  };

  // Expose sendMessage for use in customizer
  useEffect(() => {
    if (handlerRef.current) {
      handlerRef.current.sendMessage = sendMessage;
    }
  }, []);

  // Example: Send design saved event
  const handleDesignSaved = (designId: string, data?: Record<string, unknown>) => {
    sendMessage({
      type: 'design-saved',
      data: {
        designId,
        customizerId,
        productId,
        ...data,
      },
    });
  };

  // Example: Send design exported event
  const handleDesignExported = (
    format: string,
    url: string,
    data?: Record<string, unknown>
  ) => {
    sendMessage({
      type: 'design-exported',
      data: {
        format,
        url,
        customizerId,
        productId,
        ...data,
      },
    });
  };

  // Example: Send added to cart event
  const handleAddedToCart = (designId: string, data?: Record<string, unknown>) => {
    sendMessage({
      type: 'added-to-cart',
      data: {
        designId,
        customizerId,
        productId,
        ...data,
      },
    });
  };

  // Example: Send error event
  const handleError = (error: Error | string, code?: string) => {
    sendMessage({
      type: 'error',
      error: {
        message: error instanceof Error ? error.message : error,
        code,
      },
    });
  };

  // Expose handlers via ref (can be used by parent components)
  useEffect(() => {
    if (handlerRef.current) {
      Object.assign(handlerRef.current, {
        handleDesignSaved,
        handleDesignExported,
        handleAddedToCart,
        handleError,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customizerId, productId]);

  // This component doesn't render anything
  return null;
}

// Export types and helper functions
export const PostMessageTypes = {
  CUSTOMIZER_READY: 'customizer-ready',
  DESIGN_SAVED: 'design-saved',
  DESIGN_EXPORTED: 'design-exported',
  ADDED_TO_CART: 'added-to-cart',
  ERROR: 'error',
  CUSTOMIZER_CONFIG: 'customizer-config',
} as const;

export function createMessage<T extends CustomizerMessage['type']>(
  type: T,
  data: Extract<CustomizerMessage, { type: T }> extends { data?: infer D }
    ? D
    : Extract<CustomizerMessage, { type: T }> extends { error?: infer E }
      ? E
      : never
): CustomizerMessage {
  if (type === 'error') {
    return { type, error: data as any } as CustomizerMessage;
  }
  if (type === 'customizer-config') {
    return { type, config: data as any } as CustomizerMessage;
  }
  return { type, data: data as any } as CustomizerMessage;
}
