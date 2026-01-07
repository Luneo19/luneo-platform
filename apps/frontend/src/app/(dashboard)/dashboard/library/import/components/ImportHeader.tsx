/**
 * Header de la page Library Import
 */

'use client';

import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ImportHeaderProps {
  onUpload: () => void;
  isUploading: boolean;
  canUpload: boolean;
}

export function ImportHeader({ onUpload, isUploading, canUpload }: ImportHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/library')}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Upload className="w-8 h-8 text-cyan-400" />
            Importer des fichiers
          </h1>
          <p className="text-gray-400 mt-1">
            Ajoutez vos templates, designs et assets à la bibliothèque
          </p>
        </div>
      </div>
      <Button
        onClick={onUpload}
        disabled={!canUpload || isUploading}
        className="bg-cyan-600 hover:bg-cyan-700"
      >
        <Upload className="w-4 h-4 mr-2" />
        {isUploading ? 'Upload en cours...' : `Uploader (${canUpload ? 'prêt' : '0 fichier'})`}
      </Button>
    </div>
  );
}


