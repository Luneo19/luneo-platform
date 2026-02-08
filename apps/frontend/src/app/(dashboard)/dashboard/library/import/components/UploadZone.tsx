/**
 * Zone de drag & drop pour l'upload
 */

'use client';

import { useState, useCallback } from 'react';
import { Upload, File, Image as ImageIcon, FileText, Video } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function UploadZone({ onFilesSelected, isUploading, fileInputRef }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        onFilesSelected(e.dataTransfer.files);
      }
    },
    [onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesSelected(e.target.files);
      }
    },
    [onFilesSelected]
  );

  return (
    <Card
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'border-2 border-dashed p-12 text-center transition-colors cursor-pointer',
        isDragging
          ? 'border-cyan-500 bg-cyan-500/10'
          : 'border-gray-200 bg-gray-50 hover:border-gray-300',
        isUploading && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !isUploading && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,video/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
      />
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-cyan-500/10 p-6">
            <Upload className="w-12 h-12 text-cyan-400" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isDragging ? 'Déposez vos fichiers ici' : 'Glissez-déposez vos fichiers'}
          </h3>
          <p className="text-gray-600 mb-4">
            ou{' '}
            <span className="text-cyan-400 hover:underline">cliquez pour sélectionner</span>
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <ImageIcon className="w-4 h-4" />
              Images
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Documents
            </div>
            <div className="flex items-center gap-1">
              <Video className="w-4 h-4" />
              Vidéos
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Maximum 100 MB par fichier</p>
        </div>
      </div>
    </Card>
  );
}



