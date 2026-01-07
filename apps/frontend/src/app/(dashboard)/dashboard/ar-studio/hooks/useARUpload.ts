/**
 * Hook personnalisé pour gérer l'upload de modèles AR
 */

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
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

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress?.(progress);
            setUploadProgress((prev) =>
              prev.map((item) =>
                item.file === file ? { ...item, progress } : item
              )
            );
          }
        });

        const uploadPromise = new Promise<{ success: boolean; modelId?: string; error?: string }>(
          (resolve, reject) => {
            xhr.onload = async () => {
              if (xhr.status === 200 || xhr.status === 201) {
                try {
                  const data = JSON.parse(xhr.responseText);
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

                  resolve({ success: true, modelId: data.data?.model?.id });
                } catch {
                  resolve({ success: true });
                }
              } else {
                reject(new Error('Erreur lors de l\'upload'));
              }
            };

            xhr.onerror = () => {
              reject(new Error('Erreur réseau lors de l\'upload'));
            };

            xhr.open('POST', '/api/ar-studio/models');
            xhr.send(formData);
          }
        );

        const result = await uploadPromise;
        return result;
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


