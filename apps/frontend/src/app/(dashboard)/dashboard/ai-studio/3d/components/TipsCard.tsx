'use client';

import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TipsCard() {
  return (
    <Card className="bg-cyan-950/20 border-cyan-500/20">
      <CardHeader>
        <CardTitle className="text-cyan-300 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Conseils
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="text-xs text-slate-400 space-y-2">
          <li>• Décrivez précisément la forme et les détails</li>
          <li>• Mentionnez les matériaux souhaités</li>
          <li>• Indiquez le style (réaliste, stylisé, etc.)</li>
          <li>• Spécifiez les dimensions si importantes</li>
          <li>• Utilisez des termes techniques 3D</li>
        </ul>
      </CardContent>
    </Card>
  );
}
