'use client';

import { Button } from '@/components/ui/button';
import { Zap, Settings, Download } from 'lucide-react';

interface CreditsHeaderProps {
  onOpenAutoRefill: () => void;
  onOpenExport: () => void;
}

export function CreditsHeader({ onOpenAutoRefill, onOpenExport }: CreditsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Zap className="w-8 h-8 text-cyan-400" />
          Crédits
        </h1>
        <p className="text-gray-400 mt-1">
          Gérez vos crédits pour utiliser les fonctionnalités IA
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onOpenAutoRefill} className="border-gray-600">
          <Settings className="w-4 h-4 mr-2" />
          Auto-refill
        </Button>
        <Button variant="outline" onClick={onOpenExport} className="border-gray-600">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>
    </div>
  );
}
