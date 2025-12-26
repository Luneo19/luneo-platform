'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Upload,
  File,
  Image as ImageIcon,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

/**
 * Import Library - Import de fichiers
 * Import de designs, images et assets
 */
export default function LibraryImportPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    setUploading(true);

    // Upload files
    for (const fileData of newFiles) {
      const file = Array.from(selectedFiles).find((f) => f.name === fileData.name);
      if (!file) continue;

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', fileData.type);

        const response = await fetch('/api/library/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: 'success' as const,
                  progress: 100,
                  url: result.data?.url || result.url,
                }
              : f
          )
        );

        toast({
          title: 'Succès',
          description: `${fileData.name} importé avec succès`,
        });
      } catch (error) {
        logger.error('Error uploading file', { error, fileName: fileData.name });
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: 'error' as const,
                  error: error instanceof Error ? error.message : 'Erreur inconnue',
                }
              : f
          )
        );

        toast({
          title: 'Erreur',
          description: `Erreur lors de l'import de ${fileData.name}`,
          variant: 'destructive',
        });
      }
    }

    setUploading(false);
  }, [toast]);

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
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <ErrorBoundary componentName="LibraryImport">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard/library">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Upload className="w-8 h-8 text-cyan-400" />
              Importer des fichiers
            </h1>
            <p className="text-slate-400 mt-2">
              Importez vos designs, images et assets dans votre bibliothèque
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Area */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Zone d'import</CardTitle>
                <CardDescription className="text-slate-400">
                  Glissez-déposez vos fichiers ou cliquez pour sélectionner
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                    isDragging
                      ? 'border-cyan-500 bg-cyan-950/20'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-cyan-400' : 'text-slate-600'}`} />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {isDragging ? 'Déposez vos fichiers ici' : 'Glissez-déposez vos fichiers'}
                  </h3>
                  <p className="text-slate-400 mb-4">
                    Formats supportés: PNG, JPG, SVG, PDF, PSD, AI
                  </p>
                  <Input
                    type="file"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload">
                    <Button
                      asChild
                      className="bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer"
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Sélectionner des fichiers
                      </span>
                    </Button>
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Files List */}
            {files.length > 0 && (
              <Card className="bg-slate-900/50 border-slate-700 mt-6">
                <CardHeader>
                  <CardTitle className="text-white">Fichiers ({files.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50"
                      >
                        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                          {file.type.startsWith('image/') ? (
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          ) : (
                            <FileText className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{file.name}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                          {file.status === 'uploading' && (
                            <div className="mt-2">
                              <div className="w-full bg-slate-700 rounded-full h-1.5">
                                <div
                                  className="bg-cyan-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${file.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {file.status === 'error' && file.error && (
                            <p className="text-xs text-red-400 mt-1">{file.error}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {file.status === 'uploading' && (
                            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                          )}
                          {file.status === 'success' && (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                          {file.status === 'error' && (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Informations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Formats supportés</p>
                    <div className="flex flex-wrap gap-2">
                      {['PNG', 'JPG', 'SVG', 'PDF', 'PSD', 'AI'].map((format) => (
                        <Badge key={format} variant="outline" className="border-slate-600 text-slate-400">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Taille maximale</p>
                    <p className="text-sm text-white">50 MB par fichier</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Limite</p>
                    <p className="text-sm text-white">100 fichiers par import</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

