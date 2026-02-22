'use client';

import Image from 'next/image';
import { Box, Plus, Tag, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GenerationTemplate } from './types';

interface TemplatesTabProps {
  templates: GenerationTemplate[];
  onUseTemplate: (template: GenerationTemplate) => void;
}

export function TemplatesTab({ templates, onUseTemplate }: TemplatesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Templates de génération 3D</h3>
          <p className="text-sm text-gray-600">Démarrez rapidement avec des templates pré-configurés</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="bg-gray-50 border-gray-200 hover:border-cyan-500/50 transition-all cursor-pointer"
            onClick={() => onUseTemplate(template)}
          >
            <div className="relative aspect-square bg-gray-100">
              <Image
                src={template.thumbnail}
                alt={template.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              <div className="absolute bottom-2 left-2">
                <Badge className="bg-cyan-500/80">
                  <Box className="w-3 h-3 mr-1" />
                  3D
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{template.name}</h3>
                <Badge variant="outline" className="text-xs border-gray-200">
                  {template.category}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 mb-3">{template.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{template.uses} utilisations</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  Utiliser
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Catégories de Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['Tous', 'Produit', 'Mobilier', 'Bijoux', 'Électronique', 'Mode', 'Architecture', 'Automobile'].map(
              (cat, idx) => (
                <Button
                  key={idx}
                  variant={idx === 0 ? 'default' : 'outline'}
                  size="sm"
                  className={idx === 0 ? 'bg-cyan-600' : 'border-gray-200'}
                >
                  {cat}
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Templates Populaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templates
              .slice()
              .sort((a, b) => b.uses - a.uses)
              .slice(0, 5)
              .map((template, idx) => (
                <div key={template.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-cyan-600">#{idx + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{template.name}</p>
                      <p className="text-xs text-gray-600">
                        {template.category} · {template.uses} utilisations
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-gray-200" onClick={() => onUseTemplate(template)}>
                    Utiliser
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-cyan-500/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Créer votre Template</h3>
              <p className="text-sm text-gray-700">
                Enregistrez vos configurations favorites comme templates réutilisables
              </p>
            </div>
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
