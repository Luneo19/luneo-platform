/**
 * Header de la page AI Studio Animations
 */

'use client';

import { Video, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnimationsHeaderProps {
  onGenerate: () => void;
}

export function AnimationsHeader({ onGenerate }: AnimationsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Video className="w-8 h-8 text-purple-400" />
          Animations IA
        </h1>
        <p className="text-gray-400 mt-1">
          Générez des animations avec l'intelligence artificielle
        </p>
      </div>
      <Button onClick={onGenerate} className="bg-purple-600 hover:bg-purple-700">
        <Sparkles className="w-4 h-4 mr-2" />
        Générer
      </Button>
    </div>
  );
}



