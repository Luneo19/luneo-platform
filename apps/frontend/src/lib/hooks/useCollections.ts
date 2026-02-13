import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_public: boolean;
  is_featured: boolean;
  designs_count: number;
  views_count: number;
  likes_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CollectionDesign {
  id: string;
  [key: string]: unknown;
}

export interface CollectionWithDesigns extends Collection {
  designs: CollectionDesign[];
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    try {
      const result = await api.get<{ data?: { collections?: Collection[] }; collections?: Collection[] }>('/api/v1/collections');
      const collectionsData = result?.data?.collections ?? result?.collections ?? [];
      setCollections(Array.isArray(collectionsData) ? collectionsData : []);
    } catch (err: unknown) {
      logger.error('Error fetching collections', err, { userId: 'current' });
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const createCollection = useCallback(async (data: {
    name: string;
    description?: string;
    color?: string;
    is_public?: boolean;
    tags?: string[];
  }) => {
    try {
      const result = await api.post<{ data?: { collection?: Collection }; collection?: Collection }>('/api/v1/collections', data);
      await fetchCollections();
      return result?.data?.collection ?? result?.collection;
    } catch (err: unknown) {
      logger.error('Error creating collection', err, { collectionName: data.name });
      throw err;
    }
  }, [fetchCollections]);

  const updateCollection = useCallback(async (
    id: string,
    data: Partial<Collection>
  ) => {
    try {
      const result = await api.put<{ data?: { collection?: Collection }; collection?: Collection }>(`/api/v1/collections/${id}`, data);
      await fetchCollections();
      return result?.data?.collection ?? result?.collection;
    } catch (err: unknown) {
      logger.error('Error updating collection', err, { collectionId: id });
      throw err;
    }
  }, [fetchCollections]);

  const deleteCollection = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/v1/collections/${id}`);
      await fetchCollections();
    } catch (err: unknown) {
      logger.error('Error deleting collection', err, { collectionId: id });
      throw err;
    }
  }, [fetchCollections]);

  const addDesignToCollection = useCallback(async (
    collectionId: string,
    designId: string,
    notes?: string
  ) => {
    try {
      const result = await api.post<{ data?: { item?: unknown }; item?: unknown }>(`/api/v1/collections/${collectionId}/items`, { design_id: designId, notes });
      await fetchCollections();
      return result?.data?.item ?? result?.item;
    } catch (err: unknown) {
      logger.error('Error adding design to collection', err, { collectionId, designId });
      throw err;
    }
  }, [fetchCollections]);

  const removeDesignFromCollection = useCallback(async (
    collectionId: string,
    designId: string
  ) => {
    try {
      await api.delete(`/api/v1/collections/${collectionId}/items`, { params: { design_id: designId } });
      await fetchCollections();
    } catch (err: unknown) {
      logger.error('Error removing design from collection', err, { collectionId, designId });
      throw err;
    }
  }, [fetchCollections]);

  return {
    collections,
    loading,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    addDesignToCollection,
    removeDesignFromCollection,
    refresh: fetchCollections,
  };
}

/**
 * Hook pour récupérer une collection spécifique avec ses designs
 */
export function useCollection(collectionId: string | null) {
  const [collection, setCollection] = useState<CollectionWithDesigns | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!collectionId) {
      setLoading(false);
      return;
    }

    const fetchCollection = async () => {
      try {
        type CollectionApiResponse = { data?: { collection?: CollectionWithDesigns; designs?: unknown[] }; collection?: CollectionWithDesigns; designs?: unknown[] };
        const result = await api.get<CollectionApiResponse>(`/api/v1/collections/${collectionId}`);
        const collectionData = result?.data?.collection ?? result?.collection;
        const designsData = result?.data?.designs ?? result?.designs ?? [];
        const designs = Array.isArray(designsData) ? designsData : [];
        if (collectionData) {
          setCollection({ ...collectionData, designs } as CollectionWithDesigns);
        } else {
          setCollection(null);
        }
      } catch (err: unknown) {
        logger.error('Error fetching collection', err, { collectionId });
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [collectionId]);

  return { collection, loading, error };
}

