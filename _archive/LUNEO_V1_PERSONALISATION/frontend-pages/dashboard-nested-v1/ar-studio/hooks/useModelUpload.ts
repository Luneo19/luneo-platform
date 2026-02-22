/**
 * Hook for model upload with progress
 */

'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

export interface UploadProgress {
  progress: number;
  status: UploadStatus;
  file?: File;
  modelId?: string;
  error?: string;
}

export interface UseModelUploadOptions {
  projectId: string | null;
  onComplete?: (modelId: string, name: string) => void;
  onError?: (error: Error) => void;
}

export function useModelUpload(options: UseModelUploadOptions) {
  const { projectId, onComplete, onError } = options;
  const [state, setState] = useState<UploadProgress>({
    progress: 0,
    status: 'idle',
  });

  const upload = useCallback(
    async (file: File) => {
      if (!projectId) {
        const err = new Error('Project ID required');
        setState({ progress: 0, status: 'error', file, error: err.message });
        onError?.(err);
        return;
      }

      setState({ progress: 0, status: 'uploading', file });

      try {
        const formData = new FormData();
        formData.append('file', file);

        const data = await api.post<{ id: string; name: string; status?: string }>(
          `/api/v1/ar/projects/${projectId}/models`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              if (e.lengthComputable && e.total) {
                const pct = Math.round((e.loaded / e.total) * 90);
                setState((prev) => ({ ...prev, progress: pct }));
              }
            },
          }
        );

        setState((prev) => ({ ...prev, progress: 100, status: 'complete', modelId: data?.id }));
        if (data?.id) {
          onComplete?.(data.id, data.name ?? file.name);
        }
      } catch (err) {
        logger.error('Model upload failed', { error: err });
        const message = err instanceof Error ? err.message : String(err);
        setState({
          progress: 0,
          status: 'error',
          file,
          error: message,
        });
        onError?.(err instanceof Error ? err : new Error(message));
      }
    },
    [projectId, onComplete, onError]
  );

  const reset = useCallback(() => {
    setState({ progress: 0, status: 'idle' });
  }, []);

  return {
    ...state,
    upload,
    reset,
    isUploading: state.status === 'uploading' || state.status === 'processing',
  };
}
