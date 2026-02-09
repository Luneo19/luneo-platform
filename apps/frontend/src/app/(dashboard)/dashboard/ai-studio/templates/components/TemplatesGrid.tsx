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
        <p className="text-white/60">Aucun template trouvé</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {templates.map((template) => (
        <Card
          key={template.id}
          className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm hover:border-purple-500/30 transition-colors group"
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
                <span className="dash-badge dash-badge-enterprise">Premium</span>
              )}
              {template.isFavorite && (
                <span className="dash-badge bg-pink-500/15 text-pink-400 border-pink-500/25">
                  <Heart className="w-3 h-3" />
                </span>
              )}
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onPreview(template)}
                className="bg-white/90 hover:bg-white text-[#0a0a0f] border-0"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onDownload(template)}
                className="bg-white/90 hover:bg-white text-[#0a0a0f] border-0"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{template.name}</h3>
                <p className="text-xs text-white/60 mt-1 line-clamp-2">
                  {template.description}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/80 hover:bg-white/[0.04]">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="dash-card border-white/[0.06] bg-[#12121a]">
                  <DropdownMenuItem
                    onClick={() => onPreview(template)}
                    className="text-white/80 cursor-pointer hover:bg-white/[0.04] focus:bg-white/[0.04]"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Prévisualiser
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDownload(template)}
                    className="text-white/80 cursor-pointer hover:bg-white/[0.04] focus:bg-white/[0.04]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onToggleFavorite(template.id)}
                    className="text-white/80 cursor-pointer hover:bg-white/[0.04] focus:bg-white/[0.04]"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    {template.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onShare(template)}
                    className="text-white/80 cursor-pointer hover:bg-white/[0.04] focus:bg-white/[0.04]"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center justify-between text-xs text-white/40 mb-2">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-[#fbbf24] fill-[#fbbf24]" />
                <span>{template.rating.toFixed(1)}</span>
                <span className="text-white/30">({template.reviewsCount})</span>
              </div>
              <span>{template.downloads} téléchargements</span>
            </div>
            {template.type === 'premium' && template.price && (
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <span className="text-sm font-medium text-white">
                  {formatPrice(template.price, 'EUR')}
                </span>
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  Acheter
                </Button>
              </div>
            )}
            {template.type === 'free' && (
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2 border-white/[0.08] text-white hover:bg-white/[0.04]"
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



