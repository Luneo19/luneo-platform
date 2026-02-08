/**
 * Modal d'upload de fichiers
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => Promise<{ success: boolean }>;
  isUploading?: boolean;
  uploadProgress?: Record<string, number>;
}

export function UploadModal({
  open,
  onOpenChange,
  onUpload,
  isUploading = false,
  uploadProgress = {},
}: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...fileArray]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    const result = await onUpload(selectedFiles);
    if (result.success) {
      setSelectedFiles([]);
      onOpenChange(false);
    }
  }, [selectedFiles, onUpload, onOpenChange]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload de fichiers</DialogTitle>
          <DialogDescription>
            Glissez-déposez vos fichiers ou cliquez pour sélectionner
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-gray-600 bg-gray-900/50'
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">
              Glissez-déposez vos fichiers ici ou{' '}
              <label className="text-cyan-400 cursor-pointer hover:underline">
                cliquez pour sélectionner
                <input
                  type="file"
                  multiple
                  accept="image/*,.svg,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </label>
            </p>
            <p className="text-xs text-gray-500">Formats supportés: JPG, PNG, SVG, WebP, PDF</p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Fichiers sélectionnés ({selectedFiles.length})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    {uploadProgress[file.name] !== undefined && (
                      <div className="w-32 mr-4">
                        <Progress value={uploadProgress[file.name]} className="h-2" />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload ({selectedFiles.length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



