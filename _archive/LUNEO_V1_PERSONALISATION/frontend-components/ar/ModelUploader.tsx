'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileWarning, CheckCircle2 } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useModelUpload } from '@/app/(dashboard)/dashboard/ar-studio/hooks/useModelUpload';

const ACCEPTED_EXTENSIONS = '.glb,.gltf,.fbx,.obj,.stl,.usdz';
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

export interface ModelUploaderProps {
  projectId: string | null;
  onComplete?: (modelId: string, name: string) => void;
  onError?: (error: Error) => void;
  onPreview?: (modelId: string, name: string) => void;
  className?: string;
}

export function ModelUploader({ projectId, onComplete, onError, onPreview, className }: ModelUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const { upload, progress, status, file, modelId, error: uploadError, reset, isUploading } = useModelUpload({ projectId, onComplete, onError });

  const validateFile = useCallback((file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['glb', 'gltf', 'fbx', 'obj', 'stl', 'usdz'];
    if (!ext || !allowed.includes(ext)) {
      return 'Invalid file type. Use GLB, FBX, OBJ, STL, or USDZ.';
    }
    if (file.size > MAX_SIZE) {
      return `File too large. Max ${MAX_SIZE / 1024 / 1024} MB.`;
    }
    return null;
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length || !projectId) return;
      const file = files[0];
      const err = validateFile(file);
      if (err) {
        onError?.(new Error(err));
        return;
      }
      upload(file);
    },
    [projectId, upload, validateFile, onError]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const sizeLabel = file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '';

  return (
    <div className={className}>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !isUploading && projectId && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
        } ${!projectId ? 'opacity-50 pointer-events-none' : ''}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !isUploading && projectId && inputRef.current?.click()}
        aria-label="Drop 3D model file or click to upload"
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
          aria-hidden
        />
        {status === 'idle' && (
          <>
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" aria-hidden />
            <p className="font-medium text-sm">Drag & drop or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">GLB, FBX, OBJ, STL, USDZ (max 100 MB)</p>
          </>
        )}
        {(status === 'uploading' || status === 'processing') && (
          <>
            <div className="h-12 w-12 mx-auto mb-3 flex items-center justify-center">
              <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden />
            </div>
            <p className="font-medium text-sm">Uploading… {sizeLabel}</p>
            <Progress value={progress} className="mt-2 max-w-xs mx-auto h-2" />
          </>
        )}
        {status === 'complete' && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-3" aria-hidden />
            <p className="font-medium text-sm">Upload complete</p>
            {modelId && (
              <Button type="button" variant="link" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); onPreview?.(modelId, file?.name ?? ''); }}>
                Preview
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); reset(); }}>
              Upload another
            </Button>
          </>
        )}
        {status === 'error' && (
          <>
            <FileWarning className="h-12 w-12 mx-auto text-destructive mb-3" aria-hidden />
            <p className="font-medium text-sm text-destructive">{uploadError ?? 'Upload failed'}</p>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); reset(); }}>
              Try again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
