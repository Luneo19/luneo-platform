/**
 * Types pour la page Library Import
 */

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  uploadedAt?: Date;
}

export type FileType = 'image' | 'document' | 'video' | 'other';

export interface ImportStats {
  totalFiles: number;
  totalSize: number;
  uploadedFiles: number;
  failedFiles: number;
  pendingFiles: number;
}



