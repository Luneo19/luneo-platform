/**
 * Header de la page AR Studio
 */

'use client';

import { Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ARStudioHeaderProps {
  onUpload: () => void;
}

export function ARStudioHeader({ onUpload }: ARStudioHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-cyan-400" />
          AR Studio
        </h1>
        <p className="text-gray-400 mt-1">
          Gérez vos modèles AR pour Virtual Try-On
        </p>
      </div>
      <Button onClick={onUpload} className="bg-cyan-600 hover:bg-cyan-700">
        <Upload className="w-4 h-4 mr-2" />
        Upload Modèle
      </Button>
    </div>
  );
}


