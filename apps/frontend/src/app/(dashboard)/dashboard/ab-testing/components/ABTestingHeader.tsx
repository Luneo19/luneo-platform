/**
 * Header de la page AB Testing
 */

'use client';

import { FlaskConical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ABTestingHeaderProps {
  onCreateExperiment: () => void;
}

export function ABTestingHeader({ onCreateExperiment }: ABTestingHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-purple-400" />
          A/B Testing
        </h1>
        <p className="text-gray-400 mt-1">
          Testez et optimisez vos conversions
        </p>
      </div>
      <Button onClick={onCreateExperiment} className="bg-purple-600 hover:bg-purple-700">
        <Plus className="w-4 h-4 mr-2" />
        Nouveau test
      </Button>
    </div>
  );
}


