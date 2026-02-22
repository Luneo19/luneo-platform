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
        <p className="text-white/60">Aucune animation trouvée</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {animations.map((animation) => (
        <Card
          key={animation.id}
          className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm hover:border-purple-500/30 transition-colors group"
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
              <div className="w-full h-full bg-white/[0.04] flex items-center justify-center">
                <Video className="w-12 h-12 text-white/30" />
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
              <span
                className={cn(
                  'dash-badge text-xs',
                  animation.status === 'completed' ? 'dash-badge-new' : 'bg-white/10 text-white/80 border-white/20'
                )}
              >
                {animation.status}
              </span>
            </div>
            <div className="absolute top-2 left-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 w-8 p-0 bg-white/[0.08] hover:bg-white/[0.12] text-white/80',
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
                <p className="text-white text-sm font-medium line-clamp-2 mb-1">
                  {animation.prompt}
                </p>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span>{animation.duration}s</span>
                  <span>•</span>
                  <span>{animation.fps} FPS</span>
                  <span>•</span>
                  <span>{animation.resolution}</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/80 hover:bg-white/[0.04]">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="dash-card border-white/[0.06] bg-[#12121a]">
                  <DropdownMenuItem
                    onClick={() => onView(animation)}
                    className="text-white/80 cursor-pointer hover:bg-white/[0.04] focus:bg-white/[0.04]"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir détails
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onPlay(animation)}
                    className="text-white/80 cursor-pointer hover:bg-white/[0.04] focus:bg-white/[0.04]"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Lire
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(animation.id)}
                    className="text-[#f87171] cursor-pointer hover:bg-[#f87171]/10 focus:bg-[#f87171]/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center justify-between text-xs text-white/40 pt-2 border-t border-white/[0.06]">
              <span>{formatDate(new Date(animation.createdAt))}</span>
              <span>{formatNumber(animation.credits)} crédits</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}



