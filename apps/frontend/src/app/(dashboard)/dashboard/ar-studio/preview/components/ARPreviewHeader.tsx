/**
 * Header de la page AR Studio Preview
 */

'use client';

import { Eye, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ARPreviewHeaderProps {
  onStartPreview: () => void;
  isPreviewing: boolean;
}

export function ARPreviewHeader({ onStartPreview, isPreviewing }: ARPreviewHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Eye className="w-8 h-8 text-blue-400" />
          Prévisualisation AR
        </h1>
        <p className="text-gray-400 mt-1">
          Testez vos modèles 3D en réalité augmentée
        </p>
      </div>
      <Button
        onClick={onStartPreview}
        disabled={isPreviewing}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Smartphone className="w-4 h-4 mr-2" />
        {isPreviewing ? 'En cours...' : 'Démarrer AR'}
      </Button>
    </div>
  );
}


