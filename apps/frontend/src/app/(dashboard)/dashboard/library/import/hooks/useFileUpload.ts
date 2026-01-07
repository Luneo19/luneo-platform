/**
 * Hook personnalisé pour gérer l'upload de fichiers
 */

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { MAX_FILE_SIZE, MAX_FILES, ACCEPTED_FILE_TYPES } from '../constants/import';
import type { UploadedFile } from '../types';

export function useFileUpload() {
  const router = useRouter();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Le fichier ${file.name} dépasse la taille maximale de ${MAX_FILE_SIZE / 1024 / 1024} MB`,
      };
    }

    // Vérifier le type
    const allAcceptedTypes = [
      ...ACCEPTED_FILE_TYPES.image,
      ...ACCEPTED_FILE_TYPES.document,
      ...ACCEPTED_FILE_TYPES.video,
    ];
    if (!allAcceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Le type de fichier ${file.type} n'est pas supporté`,
      };
    }

    return { valid: true };
  }, []);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validFiles: UploadedFile[] = [];

      // Vérifier le nombre maximum
      if (files.length + fileArray.length > MAX_FILES) {
        toast({
          title: 'Erreur',
          description: `Maximum ${MAX_FILES} fichiers autorisés`,
          variant: 'destructive',
        });
        return;
      }

      fileArray.forEach((file) => {
        const validation = validateFile(file);
        if (validation.valid) {
          const id = `${Date.now()}-${Math.random()}`;
          const preview =
            file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;

          fileMapRef.current.set(id, file);

          validFiles.push({
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            preview,
            progress: 0,
            status: 'pending',
          });
        } else {
          toast({
            title: 'Erreur',
            description: validation.error,
            variant: 'destructive',
          });
        }
      });

      setFiles((prev) => [...prev, ...validFiles]);
    },
    [files.length, validateFile, toast]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      fileMapRef.current.delete(id);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const uploadFiles = useCallback(async (): Promise<{ success: boolean }> => {
    if (files.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Aucun fichier à uploader',
        variant: 'destructive',
      });
      return { success: false };
    }

    setIsUploading(true);

    try {
      const pendingFiles = files.filter((f) => f.status === 'pending');

      for (const file of pendingFiles) {
        const fileData = files.find((f) => f.id === file.id);
        if (!fileData) continue;

        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'uploading' } : f))
        );

        const originalFile = fileMapRef.current.get(file.id);
        if (!originalFile) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, status: 'error', error: 'Fichier introuvable' }
                : f
            )
          );
          continue;
        }

        const formData = new FormData();
        formData.append('file', originalFile);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setFiles((prev) =>
              prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
            );
          }
        });

        const uploadPromise = new Promise<{ success: boolean }>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 201) {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === file.id
                    ? { ...f, status: 'success', progress: 100, uploadedAt: new Date() }
                    : f
                )
              );
              fileMapRef.current.delete(file.id);
              resolve({ success: true });
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

        try {
          await uploadPromise;
        } catch (error: any) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, status: 'error', error: error.message }
                : f
            )
          );
        }
      }

      toast({ title: 'Succès', description: 'Fichiers uploadés avec succès' });
      router.refresh();
      return { success: true };
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
  }, [files, toast, router]);

  const clearFiles = useCallback(() => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    fileMapRef.current.clear();
    setFiles([]);
  }, [files]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    files,
    isUploading,
    fileInputRef,
    addFiles,
    removeFile,
    uploadFiles,
    clearFiles,
    openFileDialog,
  };
}

