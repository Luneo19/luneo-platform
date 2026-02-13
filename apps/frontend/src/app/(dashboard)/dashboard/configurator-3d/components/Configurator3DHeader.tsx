/**
 * Header de la page Configurator 3D
 */

'use client';

import { ArrowLeft, Save, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/useI18n';

interface Configurator3DHeaderProps {
  onBack: () => void;
  onSave: () => void;
  onExport: () => void;
  canSave: boolean;
}

export function Configurator3DHeader({
  onBack,
  onSave,
  onExport,
  canSave,
}: Configurator3DHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('configurator3d.back')}
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('configurator3d.title')}</h1>
          <p className="text-gray-400 mt-1">{t('configurator3d.subtitle')}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onExport} className="border-gray-600">
          <Download className="w-4 h-4 mr-2" />
          {t('configurator3d.export')}
        </Button>
        <Button onClick={onSave} disabled={!canSave} className="bg-cyan-600 hover:bg-cyan-700">
          <Save className="w-4 h-4 mr-2" />
          {t('configurator3d.saveButton')}
        </Button>
      </div>
    </div>
  );
}



