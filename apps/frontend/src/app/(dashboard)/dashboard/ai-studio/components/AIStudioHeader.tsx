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
        <p className="text-white/60 mt-1">
          Générez des designs avec l'intelligence artificielle
        </p>
      </div>
      <div className="flex items-center gap-4">
        {credits !== undefined && (
          <div className="dash-card flex items-center gap-2 px-4 py-2 border-white/[0.06] bg-white/[0.03] rounded-xl">
            <Zap className="w-4 h-4 text-[#fbbf24]" />
            <span className="text-white font-medium">{credits}</span>
            <span className="text-white/60 text-sm">crédits</span>
          </div>
        )}
        <Button onClick={onGenerate} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
          <Sparkles className="w-4 h-4 mr-2" />
          Générer
        </Button>
      </div>
    </div>
  );
}
