/**
 * Modal d'upload de modèles AR
 */

'use client';

import React, { useState, useCallback } from 'react';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState('');
  const [modelType, setModelType] = useState('glasses');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > MAX_FILE_SIZE) {
      setError(`Le fichier dépasse la taille maximale de ${MAX_FILE_SIZE / 1024 / 1024} MB`);
      return;
    }

    setSelectedFile(file);
    setModelName(file.name.replace(/\.[^/.]+$/, ''));
    setError(null);
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
      setError(result.error || 'Erreur lors de l\'upload');
    }
  }, [selectedFile, modelName, modelType, onUpload, onOpenChange]);

  const currentProgress = uploadProgress.find((p) => p.file === selectedFile);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Modèle AR</DialogTitle>
          <DialogDescription>
            Téléchargez vos modèles 3D pour Virtual Try-On (GLB, GLTF, USDZ, OBJ, FBX, STL)
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
                      {currentProgress.progress}% - Upload en cours...
                    </p>
                  </div>
                )}
                {currentProgress && currentProgress.status === 'processing' && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Traitement en cours...</span>
                  </div>
                )}
                {currentProgress && currentProgress.status === 'complete' && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">Upload terminé !</span>
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
                  Supprimer
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">
                  Glissez-déposez votre fichier ici ou{' '}
                  <label className="text-cyan-400 cursor-pointer hover:underline">
                    cliquez pour sélectionner
                    <input
                      type="file"
                      accept=".glb,.gltf,.usdz,.obj,.fbx,.stl"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files)}
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500">
                  Maximum {MAX_FILE_SIZE / 1024 / 1024} MB
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
                <Label className="text-gray-300">Nom du modèle</Label>
                <Input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Ex: Lunettes de soleil premium"
                  className="bg-gray-900 border-gray-600 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-300">Type de produit</Label>
                <Select value={modelType} onValueChange={setModelType}>
                  <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-2">
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
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-600">
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !modelName || !!currentProgress}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {currentProgress?.status === 'uploading' ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Upload...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Uploader
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



