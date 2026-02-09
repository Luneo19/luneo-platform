'use client';

import Link from 'next/link';
import { ArrowLeft, Box, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface HeaderSectionProps {
  credits: number;
}

export function HeaderSection({ credits }: HeaderSectionProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard/ai-studio">
            <Button variant="ghost" size="sm" className="border-white/[0.08] text-white/80 hover:bg-white/[0.04]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
            <Box className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">AI Studio 3D</h1>
            <p className="text-sm text-white/60">
              Génération de modèles 3D avec intelligence artificielle
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-xs text-white/40">Crédits disponibles</p>
                <p className="text-lg font-bold text-white">{credits.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button variant="outline" className="border-white/[0.08] text-white/80 hover:bg-white/[0.04]">
          <Settings className="w-4 h-4 mr-2" />
          Paramètres
        </Button>
      </div>
    </div>
  );
}
