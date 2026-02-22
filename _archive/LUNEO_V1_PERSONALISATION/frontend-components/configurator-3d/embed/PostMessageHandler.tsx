'use client';

import React, { useEffect, useCallback, useRef } from 'react';

export type PostMessageType =
  | 'INIT'
  | 'SELECT_OPTION'
  | 'GET_PRICE'
  | 'GET_STATE'
  | 'LOADED'
  | 'OPTION_CHANGED'
  | 'PRICE_UPDATED'
  | 'STATE_CHANGED'
  | 'ADD_TO_CART';

export interface PostMessagePayload {
  type: PostMessageType;
  payload?: Record<string, unknown>;
  configurationId?: string;
  sessionId?: string;
  price?: number;
  selections?: Record<string, string | string[]>;
}

const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://luneo.app',
  'https://www.luneo.app',
];

export interface PostMessageHandlerProps {
  allowedDomains?: string[];
  onMessage?: (message: PostMessagePayload) => void;
  sendToParent?: (message: PostMessagePayload) => void;
  children?: React.ReactNode;
}

const PostMessageContext = React.createContext<{
  send: (message: PostMessagePayload) => void;
  validateOrigin: (origin: string) => boolean;
} | null>(null);

export function usePostMessage() {
  return React.useContext(PostMessageContext);
}

export function PostMessageHandler({
  allowedDomains = [],
  onMessage,
  sendToParent,
  children,
}: PostMessageHandlerProps) {
  const originsRef = useRef<string[]>([]);
  const allOrigins = React.useMemo(
    () => [
      ...DEFAULT_ORIGINS,
      ...allowedDomains,
      ...(typeof window !== 'undefined' ? [window.location.origin] : []),
    ].filter(Boolean),
    [allowedDomains]
  );
  originsRef.current = allOrigins;

  const validateOrigin = useCallback((origin: string) => {
    if (!origin) return false;
    return originsRef.current.some(
      (allowed) =>
        allowed === origin ||
        origin.startsWith(allowed) ||
        (allowed.includes('localhost') && origin.includes('localhost'))
    );
  }, []);

  const send = useCallback(
    (message: PostMessagePayload) => {
      if (typeof window === 'undefined' || !window.parent) return;
      window.parent.postMessage(message, '*');
      sendToParent?.(message);
    },
    [sendToParent]
  );

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!validateOrigin(event.origin)) return;
      const data = event.data as PostMessagePayload | undefined;
      if (!data?.type) return;
      onMessage?.(data);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [validateOrigin, onMessage]);

  if (!children) return null;

  return (
    <PostMessageContext.Provider value={{ send, validateOrigin }}>
      {children}
    </PostMessageContext.Provider>
  );
}
