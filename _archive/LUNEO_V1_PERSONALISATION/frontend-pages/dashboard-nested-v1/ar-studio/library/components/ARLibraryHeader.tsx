/**
 * Header de la page AR Studio Library
 */

'use client';

import { useI18n } from '@/i18n/useI18n';
import { Library, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ARLibraryHeaderProps {
  onUpload: () => void;
}

export function ARLibraryHeader({ onUpload }: ARLibraryHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Library className="w-8 h-8 text-blue-400" />
          {t('arStudio.libraryTitle')}
        </h1>
        <p className="text-gray-400 mt-1">
          {t('arStudio.libraryDesc')}
        </p>
      </div>
      <Button onClick={onUpload} className="bg-blue-600 hover:bg-blue-700">
        <Upload className="w-4 h-4 mr-2" />
        {t('arStudio.uploadModelBtn')}
      </Button>
    </div>
  );
}



