/**
 * Hook personnalisé pour gérer l'upload de fichiers
 */

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { logger } from '@/lib/logger';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';

export function useLibraryUpload() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
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
              reject(new Error(t('library.uploadError')));
            }
          };

          xhr.onerror = () => {
            reject(new Error(t('library.uploadNetworkError')));
          };

          xhr.open('POST', '/api/library/upload');
          xhr.send(formData);
        });

        const result = await uploadPromise;

        toast({ title: t('common.success'), description: t('library.filesUploadedSuccess') });
        router.refresh();
        setUploadProgress({});
        return result;
      } catch (error: unknown) {
        logger.error('Error uploading files', { error });
        toast({
          title: t('common.error'),
          description: getErrorDisplayMessage(error),
          variant: 'destructive',
        });
        return { success: false };
      } finally {
        setIsUploading(false);
      }
    },
    [toast, router, t]
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



