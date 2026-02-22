'use client';

import { Plus, Eye, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RESPONSE_TEMPLATES } from './constants';
import type { ResponseTemplate } from './types';

interface TemplatesTabProps {
  onPreview: (template: ResponseTemplate) => void;
  onUseTemplate: (template: ResponseTemplate) => void;
}

export function TemplatesTab({ onPreview, onUseTemplate }: TemplatesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Templates de réponses</h3>
          <p className="text-sm text-gray-600">Réponses pré-écrites pour accélérer vos réponses</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {RESPONSE_TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className="bg-white border-gray-200 hover:border-cyan-500/50 transition-all"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <Badge variant="outline" className="text-xs border-gray-200">
                  {template.category}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">{template.content}</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-200"
                  onClick={() => onPreview(template)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Prévisualiser
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200" onClick={() => onUseTemplate(template)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
