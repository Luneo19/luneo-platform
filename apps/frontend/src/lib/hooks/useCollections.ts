import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface Collection {
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

interface CollectionWithDesigns extends Collection {
  designs: any[];
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch('/api/collections');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to fetch collections');
      }

      // Gérer les deux formats de réponse possibles
      const collectionsData = result.data?.collections || result.collections || [];
      setCollections(collectionsData);
    } catch (err: any) {
      logger.error('Error fetching collections', err, { userId: 'current' });
      setError(err.message);
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
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to create collection');
      }

      // Rafraîchir les collections
      await fetchCollections();

      return result.data?.collection || result.collection;
    } catch (err: any) {
      logger.error('Error creating collection', err, { collectionName: data.name });
      throw err;
    }
  }, [fetchCollections]);

  const updateCollection = useCallback(async (
    id: string,
    data: Partial<Collection>
  ) => {
    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to update collection');
      }

      // Rafraîchir les collections
      await fetchCollections();

      return result.data?.collection || result.collection;
    } catch (err: any) {
      logger.error('Error updating collection', err, { collectionId: id });
      throw err;
    }
  }, [fetchCollections]);

  const deleteCollection = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to delete collection');
      }

      // Rafraîchir les collections
      await fetchCollections();
    } catch (err: any) {
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
      const response = await fetch(`/api/collections/${collectionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ design_id: designId, notes }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to add design');
      }

      // Rafraîchir les collections
      await fetchCollections();

      return result.data?.item || result.item;
    } catch (err: any) {
      logger.error('Error adding design to collection', err, { collectionId, designId });
      throw err;
    }
  }, [fetchCollections]);

  const removeDesignFromCollection = useCallback(async (
    collectionId: string,
    designId: string
  ) => {
    try {
      const response = await fetch(
        `/api/collections/${collectionId}/items?design_id=${designId}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to remove design');
      }

      // Rafraîchir les collections
      await fetchCollections();
    } catch (err: any) {
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
        const response = await fetch(`/api/collections/${collectionId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.message || 'Failed to fetch collection');
        }

        const collectionData = result.data?.collection || result.collection;
        const designsData = result.data?.designs || result.designs || [];

        setCollection({
          ...collectionData,
          designs: designsData,
        });
      } catch (err: any) {
        logger.error('Error fetching collection', err, { collectionId });
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [collectionId]);

  return { collection, loading, error };
}

