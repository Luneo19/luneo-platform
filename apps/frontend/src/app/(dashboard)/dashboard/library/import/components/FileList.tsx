/**
 * Liste des fichiers à uploader
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle2, AlertCircle, Image as ImageIcon, FileText, Video, File } from 'lucide-react';
import Image from 'next/image';
import { formatBytes } from '@/lib/utils/formatters';
import type { UploadedFile } from '../types';

interface FileListProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
}

export function FileList({ files, onRemove }: FileListProps) {
  if (files.length === 0) {
    return null;
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type.startsWith('video/')) return Video;
    if (type.includes('pdf') || type.includes('document')) return FileText;
    return File;
  };

  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Terminé</Badge>;
      case 'error':
        return <Badge className="bg-red-500">Erreur</Badge>;
      case 'uploading':
        return <Badge className="bg-blue-500">En cours...</Badge>;
      default:
        return <Badge className="bg-gray-600">En attente</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">
        Fichiers sélectionnés ({files.length})
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {files.map((file) => {
          const Icon = getFileIcon(file.type);
          return (
            <Card key={file.id} className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {file.preview ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={file.preview}
                        alt={file.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatBytes(file.size)}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getStatusBadge(file.status)}
                        {file.status !== 'uploading' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemove(file.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {file.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={file.progress} className="h-2" />
                        <p className="text-xs text-gray-400 mt-1">{file.progress}%</p>
                      </div>
                    )}
                    {file.status === 'error' && file.error && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        {file.error}
                      </div>
                    )}
                    {file.status === 'success' && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Upload réussi
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


