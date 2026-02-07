/**
 * Hook personnalisé pour gérer l'upload de modèles AR
 */

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from '../constants/ar';
import type { UploadProgress } from '../types';

export function useARUpload() {
  const router = useRouter();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Le fichier dépasse la taille maximale de ${MAX_FILE_SIZE / 1024 / 1024} MB`,
      };
    }

    const acceptedExtensions = Object.values(ACCEPTED_FILE_TYPES).flat();
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: 'Type de fichier non supporté. Formats acceptés: GLB, GLTF, USDZ, OBJ, FBX, STL',
      };
    }

    return { valid: true };
  }, []);

  const uploadFile = useCallback(
    async (
      file: File,
      name: string,
      type: string,
      onProgress?: (progress: number) => void
    ): Promise<{ success: boolean; error?: string; modelId?: string }> => {
      const validation = validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      setIsUploading(true);
      const progressItem: UploadProgress = {
        file,
        progress: 0,
        status: 'uploading',
      };
      setUploadProgress((prev) => [...prev, progressItem]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);
        formData.append('type', type);

        // Update progress manually since axios doesn't support upload progress easily
        // For now, we'll simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) =>
            prev.map((item) => {
              if (item.file === file && item.progress < 90) {
                const newProgress = item.progress + 10;
                onProgress?.(newProgress);
                return { ...item, progress: newProgress };
              }
              return item;
            })
          );
        }, 200);

        try {
          const data = await api.post<{ data?: { model?: { id?: string } } }>('/api/v1/ar-studio/models', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          clearInterval(progressInterval);
          setUploadProgress((prev) =>
            prev.map((item) =>
              item.file === file
                ? { ...item, progress: 100, status: 'processing' }
                : item
            )
          );

          // Wait for processing
          setTimeout(() => {
            setUploadProgress((prev) =>
              prev.map((item) =>
                item.file === file
                  ? { ...item, status: 'complete' }
                  : item
              )
            );
          }, 2000);

          return { success: true, modelId: data?.data?.model?.id };
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
      } catch (error: any) {
        logger.error('Error uploading AR model', { error });
        setUploadProgress((prev) =>
          prev.map((item) =>
            item.file === file
              ? { ...item, status: 'error', error: error.message }
              : item
          )
        );
        return { success: false, error: error.message || 'Erreur lors de l\'upload' };
      } finally {
        setIsUploading(false);
      }
    },
    [validateFile]
  );

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  return {
    uploadFile,
    uploadProgress,
    isUploading,
    fileInputRef,
    openFileDialog,
    clearProgress,
  };
}



