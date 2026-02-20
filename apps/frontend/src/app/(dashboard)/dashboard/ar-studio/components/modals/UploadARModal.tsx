/**
 * Modal d'upload de modèles AR
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useI18n } from '@/i18n/useI18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODEL_TYPES, MAX_FILE_SIZE } from '../../constants/ar';
import type { UploadProgress as UploadProgressType } from '../../types';

interface UploadARModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (
    file: File,
    name: string,
    type: string,
    onProgress?: (progress: number) => void
  ) => Promise<{ success: boolean; error?: string }>;
  uploadProgress: UploadProgressType[];
}

export function UploadARModal({
  open,
  onOpenChange,
  onUpload,
  uploadProgress,
}: UploadARModalProps) {
  const { t } = useI18n();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState('');
  const [modelType, setModelType] = useState('glasses');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > MAX_FILE_SIZE) {
      setError(t('arStudio.fileTooBig', { max: String(MAX_FILE_SIZE / 1024 / 1024) }));
      return;
    }

    setSelectedFile(file);
    setModelName(file.name.replace(/\.[^/.]+$/, ''));
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !modelName) return;

    const result = await onUpload(selectedFile, modelName, modelType, (progress) => {
      // Progress handled by parent
    });

    if (result.success) {
      setSelectedFile(null);
      setModelName('');
      setModelType('glasses');
      setTimeout(() => onOpenChange(false), 2000);
    } else {
      setError(result.error || t('arStudio.uploadError'));
    }
  }, [selectedFile, modelName, modelType, onUpload, onOpenChange, t]);

  const currentProgress = uploadProgress.find((p) => p.file === selectedFile);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('arStudio.uploadModel')}</DialogTitle>
          <DialogDescription>
            {t('arStudio.uploadModelDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              isDragging
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-gray-600 bg-gray-900/50',
              error && 'border-red-500'
            )}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {currentProgress && currentProgress.status === 'uploading' && (
                  <div className="mt-4">
                    <Progress value={currentProgress.progress} className="h-2" />
                    <p className="text-xs text-gray-400 mt-2">
                      {currentProgress.progress}% - {t('arStudio.uploading')}
                    </p>
                  </div>
                )}
                {currentProgress && currentProgress.status === 'processing' && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{t('arStudio.processing')}</span>
                  </div>
                )}
                {currentProgress && currentProgress.status === 'complete' && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">{t('arStudio.uploadComplete')}</span>
                  </div>
                )}
                {currentProgress && currentProgress.status === 'error' && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{currentProgress.error}</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="mt-2 text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('aiStudio.delete')}
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">
                  {t('arStudio.dragDrop')}{' '}
                  <label className="text-cyan-400 cursor-pointer hover:underline">
                    {t('arStudio.clickToSelect')}
                    <input
                      type="file"
                      accept=".glb,.gltf,.usdz,.obj,.fbx,.stl"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files)}
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500">
                  {t('arStudio.maxSize', { max: String(MAX_FILE_SIZE / 1024 / 1024) })}
                </p>
              </>
            )}
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">{t('arStudio.modelName')}</Label>
                <Input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Ex: Lunettes de soleil premium"
                  className="bg-gray-900 border-gray-600 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-700">{t('arStudio.productType')}</Label>
                <Select value={modelType} onValueChange={setModelType}>
                  <SelectTrigger className="bg-white border-gray-200 text-gray-900 mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_TYPES.filter((t) => t.value !== 'all').map((type) => {
                      const Icon = type.icon as React.ElementType;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {Icon && React.createElement(Icon, { className: 'w-4 h-4' })}
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">
            {t('aiStudio.cancel')}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !modelName || !!currentProgress}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {currentProgress?.status === 'uploading' ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {t('arStudio.uploading')}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {t('arStudio.uploadBtn')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



