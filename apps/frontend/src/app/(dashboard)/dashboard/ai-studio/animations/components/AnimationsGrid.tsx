/**
 * Grille d'animations
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Heart, Download, MoreVertical, Trash2, Eye, Video } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatNumber, formatDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { GeneratedAnimation } from '../types';

interface AnimationsGridProps {
  animations: GeneratedAnimation[];
  onView: (animation: GeneratedAnimation) => void;
  onPlay: (animation: GeneratedAnimation) => void;
  onToggleFavorite: (animationId: string) => void;
  onDelete: (animationId: string) => void;
}

export function AnimationsGrid({
  animations,
  onView,
  onPlay,
  onToggleFavorite,
  onDelete,
}: AnimationsGridProps) {
  if (animations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Aucune animation trouvée</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {animations.map((animation) => (
        <Card
          key={animation.id}
          className="bg-gray-50 border-gray-200 hover:border-purple-500/50 transition-colors group"
        >
          <div className="relative aspect-video overflow-hidden rounded-t-lg">
            {animation.thumbnail ? (
              <Image
                src={animation.thumbnail}
                alt={animation.prompt}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <Video className="w-12 h-12 text-gray-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPlay(animation)}
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                <Play className="w-6 h-6" />
              </Button>
            </div>
            <div className="absolute top-2 right-2 flex gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  'bg-gray-100/80 text-gray-900',
                  animation.status === 'completed' && 'bg-green-500/80'
                )}
              >
                {animation.status}
              </Badge>
            </div>
            <div className="absolute top-2 left-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 w-8 p-0 bg-gray-100/80 hover:bg-gray-200',
                  animation.isFavorite && 'text-pink-400'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(animation.id);
                }}
              >
                <Heart
                  className={cn('w-4 h-4', animation.isFavorite && 'fill-current')}
                />
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-sm font-medium line-clamp-2 mb-1">
                  {animation.prompt}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>{animation.duration}s</span>
                  <span>•</span>
                  <span>{animation.fps} FPS</span>
                  <span>•</span>
                  <span>{animation.resolution}</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-gray-200">
                  <DropdownMenuItem
                    onClick={() => onView(animation)}
                    className="text-gray-700 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir détails
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onPlay(animation)}
                    className="text-gray-700 cursor-pointer"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Lire
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(animation.id)}
                    className="text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
              <span>{formatDate(new Date(animation.createdAt))}</span>
              <span>{formatNumber(animation.credits)} crédits</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}



