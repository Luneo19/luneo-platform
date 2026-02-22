'use client';

import { Button } from '@/components/ui/button';
import { Zap, Settings, Download } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';

interface CreditsHeaderProps {
  onOpenAutoRefill: () => void;
  onOpenExport: () => void;
}

export function CreditsHeader({ onOpenAutoRefill, onOpenExport }: CreditsHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Zap className="w-8 h-8 text-cyan-400" />
          {t('credits.title')}
        </h1>
        <p className="text-gray-600 mt-1">
          {t('credits.subtitleHeader')}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onOpenAutoRefill} className="border-gray-300">
          <Settings className="w-4 h-4 mr-2" />
          {t('credits.autoRefill')}
        </Button>
        <Button variant="outline" onClick={onOpenExport} className="border-gray-300">
          <Download className="w-4 h-4 mr-2" />
          {t('credits.export')}
        </Button>
      </div>
    </div>
  );
}
