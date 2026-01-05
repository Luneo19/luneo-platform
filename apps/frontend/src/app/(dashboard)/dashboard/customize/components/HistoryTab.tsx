'use client';

/**
 * HistoryTab - Onglet historique
 * Composant < 300 lignes
 */

import React from 'react';
import { Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function HistoryTab() {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Historique des personnalisations
          </CardTitle>
          <CardDescription className="text-slate-400">
            Consultez l'historique de toutes vos personnalisations et modifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucun historique</h3>
            <p className="text-slate-400">
              L'historique de vos personnalisations apparaîtra ici
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




