'use client';

/**
 * TemplatesTab - Onglet des templates
 * Composant < 300 lignes
 */

import React from 'react';
import { Layers, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function TemplatesTab() {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Templates de personnalisation
          </CardTitle>
          <CardDescription className="text-slate-400">
            Gérez vos templates pré-configurés pour accélérer la création de produits personnalisables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Layers className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucun template</h3>
            <p className="text-slate-400 mb-6">
              Créez votre premier template pour réutiliser vos configurations
            </p>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" />
              Créer un template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}







