/**
 * useImage
 * Image operations hook for upload, manipulation, and deletion
 */

'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface ImageFilter {
  type: 'brightness' | 'contrast' | 'saturate' | 'blur' | 'grayscale' | 'sepia';
  value: number;
}

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseImageReturn {
  addImage: (url: string, zoneId?: string) => Promise<string>;
  uploadImage: (file: File) => Promise<string>;
  removeBackground: (id: string) => Promise<void>;
  applyFilter: (id: string, filter: ImageFilter['type'], value: number) => Promise<void>;
  cropImage: (id: string, cropRect: CropRect) => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

/**
 * Image operations hook
 */
export function useImage(
  onAddImage?: (url: string, zoneId?: string) => Promise<string>
): UseImageReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const addImage = useCallback(
    async (url: string, zoneId?: string): Promise<string> => {
      if (onAddImage) {
        return onAddImage(url, zoneId);
      }

      // Fallback: generate ID
      const id = crypto.randomUUID();
      logger.warn('useImage: onAddImage callback not provided', { id, url });
      return id;
    },
    [onAddImage]
  );

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'image');

        // Upload via REST API (multipart form)
        // Note: The api client should handle FormData automatically
        const response = await api.post<{ url: string; id: string }>('/api/v1/visual-customizer/assets/upload', formData);

        setIsUploading(false);
        setUploadProgress(0);

        // Add image to canvas
        return addImage(response.url);
      } catch (error) {
        setIsUploading(false);
        setUploadProgress(0);
        logger.error('useImage: upload failed', { error });
        throw error;
      }
    },
    [addImage]
  );

  const removeBackground = useCallback(async (id: string): Promise<void> => {
    try {
      await api.post(`/api/v1/visual-customizer/images/${id}/remove-background`);
      logger.info('useImage: background removed', { id });
    } catch (error) {
      logger.error('useImage: removeBackground failed', { error, id });
      throw error;
    }
  }, []);

  const applyFilter = useCallback(
    async (id: string, filter: ImageFilter['type'], value: number): Promise<void> => {
      try {
        await api.post(`/api/v1/visual-customizer/images/${id}/filter`, {
          filter,
          value,
        });
        logger.info('useImage: filter applied', { id, filter, value });
      } catch (error) {
        logger.error('useImage: applyFilter failed', { error, id });
        throw error;
      }
    },
    []
  );

  const cropImage = useCallback(
    async (id: string, cropRect: CropRect): Promise<void> => {
      try {
        await api.post(`/api/v1/visual-customizer/images/${id}/crop`, cropRect);
        logger.info('useImage: image cropped', { id, cropRect });
      } catch (error) {
        logger.error('useImage: cropImage failed', { error, id });
        throw error;
      }
    },
    []
  );

  const deleteImage = useCallback(
    async (id: string): Promise<void> => {
      try {
        await api.delete(`/api/v1/visual-customizer/images/${id}`);
        logger.info('useImage: image deleted', { id });
      } catch (error) {
        logger.error('useImage: deleteImage failed', { error, id });
        throw error;
      }
    },
    []
  );

  return {
    addImage,
    uploadImage,
    removeBackground,
    applyFilter,
    cropImage,
    deleteImage,
    isUploading,
    uploadProgress,
  };
}
