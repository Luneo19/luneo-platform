/**
 * Header de la page AR Studio Library
 */

'use client';

import { Library, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ARLibraryHeaderProps {
  onUpload: () => void;
}

export function ARLibraryHeader({ onUpload }: ARLibraryHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Library className="w-8 h-8 text-blue-400" />
          Bibliothèque AR
        </h1>
        <p className="text-gray-400 mt-1">
          Gérez vos modèles 3D pour la réalité augmentée
        </p>
      </div>
      <Button onClick={onUpload} className="bg-blue-600 hover:bg-blue-700">
        <Upload className="w-4 h-4 mr-2" />
        Uploader un modèle
      </Button>
    </div>
  );
}


