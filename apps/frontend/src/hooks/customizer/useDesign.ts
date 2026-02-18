/**
 * useDesign
 * Saved designs management hook via tRPC
 */

'use client';

import { useCallback } from 'react';
import { trpc } from '@/lib/trpc/client';
import { logger } from '@/lib/logger';

interface Design {
  id: string;
  name: string;
  canvasData: Record<string, unknown>;
  thumbnailDataUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UseDesignReturn {
  savedDesigns: Design[];
  isLoading: boolean;
  error: Error | null;
  saveDesign: (name: string, canvasData: Record<string, unknown>, thumbnailDataUrl?: string, sessionId?: string) => Promise<Design>;
  loadDesign: (id: string) => Promise<Design>;
  deleteDesign: (id: string) => Promise<void>;
  shareDesign: (id: string, expiresInDays?: number) => Promise<{ token: string; shareUrl: string; expiresAt?: string }>;
  getSharedDesign: (token: string) => Promise<Design>;
  refetch: () => void;
}

/**
 * Saved designs management hook
 */
export function useDesign(): UseDesignReturn {
  const utils = trpc.useUtils();

  // List designs
  const {
    data: designsData,
    isLoading,
    error,
    refetch,
  } = trpc.visualCustomizer.sessions.listDesigns.useQuery(
    { page: 1, limit: 100 },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  const savedDesigns = ((designsData?.designs as Design[]) || []).map((design) => ({
    ...design,
    canvasData: design.canvasData || {},
  }));

  // Mutations
  const saveDesignMutation = trpc.visualCustomizer.sessions.saveDesign.useMutation({
    onSuccess: () => {
      utils.visualCustomizer.sessions.listDesigns.invalidate();
    },
    onError: (err) => {
      logger.error('useDesign: saveDesign failed', { error: err });
    },
  });

  const getDesignMutation = trpc.visualCustomizer.sessions.getDesign.useQuery;

  const deleteDesignMutation = trpc.visualCustomizer.sessions.deleteDesign.useMutation({
    onSuccess: () => {
      utils.visualCustomizer.sessions.listDesigns.invalidate();
    },
    onError: (err) => {
      logger.error('useDesign: deleteDesign failed', { error: err });
    },
  });

  const shareDesignMutation = trpc.visualCustomizer.sessions.shareDesign.useMutation({
    onError: (err) => {
      logger.error('useDesign: shareDesign failed', { error: err });
    },
  });

  const getSharedDesignQuery = trpc.visualCustomizer.sessions.getSharedDesign.useQuery;

  const saveDesign = useCallback(
    async (
      name: string,
      canvasData: Record<string, unknown>,
      thumbnailDataUrl?: string,
      sessionId?: string
    ): Promise<Design> => {
      if (!sessionId) {
        throw new Error('Session ID is required to save design');
      }

      const result = await saveDesignMutation.mutateAsync({
        sessionId,
        name,
        canvasData,
        thumbnailDataUrl,
      });

      return result as unknown as Design;
    },
    [saveDesignMutation]
  );

  const loadDesign = useCallback(
    async (id: string): Promise<Design> => {
      const result = await utils.visualCustomizer.sessions.getDesign.fetch({ id });

      return result as unknown as Design;
    },
    [utils]
  );

  const deleteDesign = useCallback(
    async (id: string): Promise<void> => {
      await deleteDesignMutation.mutateAsync({ id });
    },
    [deleteDesignMutation]
  );

  const shareDesign = useCallback(
    async (id: string, expiresInDays?: number): Promise<{ token: string; shareUrl: string; expiresAt?: string }> => {
      return shareDesignMutation.mutateAsync({
        id,
        expiresInDays,
      });
    },
    [shareDesignMutation]
  );

  const getSharedDesign = useCallback(
    async (token: string): Promise<Design> => {
      const result = await utils.visualCustomizer.sessions.getSharedDesign.fetch({ token });

      return result as unknown as Design;
    },
    [utils]
  );

  return {
    savedDesigns,
    isLoading,
    error: error as Error | null,
    saveDesign,
    loadDesign,
    deleteDesign,
    shareDesign,
    getSharedDesign,
    refetch: () => {
      refetch();
    },
  };
}
