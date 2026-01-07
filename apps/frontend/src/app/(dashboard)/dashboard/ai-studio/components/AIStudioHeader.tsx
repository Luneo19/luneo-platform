/**
 * Header de la page AI Studio
 */

'use client';

import { Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIStudioHeaderProps {
  onGenerate: () => void;
  credits?: number;
}

export function AIStudioHeader({ onGenerate, credits }: AIStudioHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-400" />
          AI Studio
        </h1>
        <p className="text-gray-400 mt-1">
          Générez des designs avec l'intelligence artificielle
        </p>
      </div>
      <div className="flex items-center gap-4">
        {credits !== undefined && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-medium">{credits}</span>
            <span className="text-gray-400 text-sm">crédits</span>
          </div>
        )}
        <Button onClick={onGenerate} className="bg-purple-600 hover:bg-purple-700">
          <Sparkles className="w-4 h-4 mr-2" />
          Générer
        </Button>
      </div>
    </div>
  );
}


