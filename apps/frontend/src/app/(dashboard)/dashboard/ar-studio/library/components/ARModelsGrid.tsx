/**
 * Grille de modèles AR
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Eye, Download, MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatNumber, formatBytes, formatDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { ARModel } from '../types';

interface ARModelsGridProps {
  models: ARModel[];
  onView: (model: ARModel) => void;
  onToggleFavorite: (modelId: string) => void;
  onDelete: (modelId: string) => void;
}

export function ARModelsGrid({
  models,
  onView,
  onToggleFavorite,
  onDelete,
}: ARModelsGridProps) {
  if (models.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Aucun modèle trouvé</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {models.map((model) => (
        <Card
          key={model.id}
          className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer group"
          onClick={() => onView(model)}
        >
          <div className="relative aspect-square overflow-hidden rounded-t-lg">
            <Image
              src={model.thumbnail}
              alt={model.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  'bg-gray-900/80 text-white',
                  model.status === 'active' && 'bg-green-500/80'
                )}
              >
                {model.status}
              </Badge>
            </div>
            <div className="absolute top-2 left-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 w-8 p-0 bg-gray-900/80 hover:bg-gray-800',
                  model.isFavorite && 'text-pink-400'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(model.id);
                }}
              >
                <Heart
                  className={cn('w-4 h-4', model.isFavorite && 'fill-current')}
                />
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-white font-medium mb-1 line-clamp-1">{model.name}</h3>
                <p className="text-gray-400 text-xs line-clamp-2">{model.description}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(model);
                    }}
                    className="text-gray-300 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir détails
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(model.id);
                    }}
                    className="text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatNumber(model.views)}
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {formatNumber(model.downloads)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{formatBytes(model.size)}</span>
              <span className="text-gray-500">{formatDate(new Date(model.createdAt))}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {model.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs border-gray-600 text-gray-400"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


