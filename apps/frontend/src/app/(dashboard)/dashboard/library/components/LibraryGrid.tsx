/**
 * Grille d'affichage des templates
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Star, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { formatDate } from '@/lib/utils/formatters';
import type { Template } from '../types';

interface LibraryGridProps {
  templates: Template[];
  onPreview: (template: Template) => void;
  onToggleFavorite: (templateId: string, isFavorite: boolean) => Promise<{ success: boolean }>;
  onDelete: (templateId: string) => Promise<{ success: boolean }>;
}

export function LibraryGrid({ templates, onPreview, onToggleFavorite, onDelete }: LibraryGridProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Aucun template trouvé</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {templates.map((template) => (
        <Card
          key={template.id}
          className="bg-gray-800/50 border-gray-700 hover:border-cyan-500/50 transition-colors group"
        >
          <div className="relative aspect-square overflow-hidden rounded-t-lg">
            <Image
              src={template.thumbnail}
              alt={template.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
            {template.isPremium && (
              <Badge className="absolute top-2 right-2 bg-yellow-500/90 text-yellow-900">
                Premium
              </Badge>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onPreview(template)}
                className="bg-white/90 hover:bg-white"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onToggleFavorite(template.id, template.isFavorite)}
                className="bg-white/90 hover:bg-white"
              >
                <Star className={`w-4 h-4 ${template.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{template.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{formatDate(new Date(template.createdAt))}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                  <DropdownMenuItem
                    onClick={() => onPreview(template)}
                    className="text-gray-300 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Prévisualiser
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onToggleFavorite(template.id, template.isFavorite)}
                    className="text-gray-300 cursor-pointer"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    {template.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 cursor-pointer">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(template.id)}
                    className="text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{template.downloads} téléchargements</span>
              <span>•</span>
              <span>{template.views} vues</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}



