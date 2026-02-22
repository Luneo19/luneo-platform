/**
 * Header de la page AR Studio Integrations
 */

'use client';

import { Plug, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IntegrationsHeaderProps {
  onAddIntegration: () => void;
}

export function IntegrationsHeader({ onAddIntegration }: IntegrationsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Plug className="w-8 h-8 text-cyan-400" />
          Intégrations AR
        </h1>
        <p className="text-gray-400 mt-1">
          Connectez vos plateformes pour synchroniser vos modèles AR
        </p>
      </div>
      <Button onClick={onAddIntegration} className="bg-cyan-600 hover:bg-cyan-700">
        <Plus className="w-4 h-4 mr-2" />
        Ajouter une intégration
      </Button>
    </div>
  );
}



