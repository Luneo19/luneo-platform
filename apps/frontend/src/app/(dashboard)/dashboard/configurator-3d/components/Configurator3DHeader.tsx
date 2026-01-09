/**
 * Header de la page Configurator 3D
 */

'use client';

import { ArrowLeft, Save, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Configurateur 3D</h1>
          <p className="text-gray-400 mt-1">Personnalisez votre produit en 3D</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onExport} className="border-gray-600">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
        <Button onClick={onSave} disabled={!canSave} className="bg-cyan-600 hover:bg-cyan-700">
          <Save className="w-4 h-4 mr-2" />
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}



