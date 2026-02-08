/**
 * Grille d'affichage des templates AI
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Heart, Star, MoreVertical, Share2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { formatDate, formatPrice } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import type { AITemplate } from '../types';

interface TemplatesGridProps {
  templates: AITemplate[];
  onPreview: (template: AITemplate) => void;
  onDownload: (template: AITemplate) => void;
  onToggleFavorite: (templateId: string) => void;
  onShare: (template: AITemplate) => void;
}

export function TemplatesGrid({
  templates,
  onPreview,
  onDownload,
  onToggleFavorite,
  onShare,
}: TemplatesGridProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Aucun template trouvé</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {templates.map((template) => (
        <Card
          key={template.id}
          className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors group"
        >
          <div className="relative aspect-square overflow-hidden rounded-t-lg">
            <Image
              src={template.thumbnail}
              alt={template.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              {template.type === 'premium' && (
                <Badge className="bg-yellow-500">Premium</Badge>
              )}
              {template.isFavorite && (
                <Badge className="bg-pink-500">
                  <Heart className="w-3 h-3" />
                </Badge>
              )}
            </div>
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
                onClick={() => onDownload(template)}
                className="bg-white/90 hover:bg-white"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {template.description}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-gray-200">
                  <DropdownMenuItem
                    onClick={() => onPreview(template)}
                    className="text-gray-700 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Prévisualiser
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDownload(template)}
                    className="text-gray-700 cursor-pointer"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onToggleFavorite(template.id)}
                    className="text-gray-700 cursor-pointer"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    {template.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onShare(template)}
                    className="text-gray-700 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span>{template.rating.toFixed(1)}</span>
                <span className="text-gray-500">({template.reviewsCount})</span>
              </div>
              <span>{template.downloads} téléchargements</span>
            </div>
            {template.type === 'premium' && template.price && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-900">
                  {formatPrice(template.price, 'EUR')}
                </span>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  Acheter
                </Button>
              </div>
            )}
            {template.type === 'free' && (
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2 border-gray-200"
                onClick={() => onDownload(template)}
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger gratuitement
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}



