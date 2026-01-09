/**
 * Hook personnalisé pour gérer l'upload de fichiers
 */

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export function useLibraryUpload() {
  const router = useRouter();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: File[]): Promise<{ success: boolean }> => {
      try {
        setIsUploading(true);
        setUploadProgress({});

        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            files.forEach((file) => {
              setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
            });
          }
        });

        const uploadPromise = new Promise<{ success: boolean }>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 201) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve({ success: true });
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

          xhr.open('POST', '/api/library/upload');
          xhr.send(formData);
        });

        const result = await uploadPromise;

        toast({ title: 'Succès', description: 'Fichiers uploadés avec succès' });
        router.refresh();
        setUploadProgress({});
        return result;
      } catch (error: any) {
        logger.error('Error uploading files', { error });
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors de l\'upload',
          variant: 'destructive',
        });
        return { success: false };
      } finally {
        setIsUploading(false);
      }
    },
    [toast, router]
  );

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    uploadFiles,
    isUploading,
    uploadProgress,
    fileInputRef,
    openFileDialog,
  };
}



