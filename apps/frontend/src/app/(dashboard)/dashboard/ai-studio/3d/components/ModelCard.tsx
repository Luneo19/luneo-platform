'use client';

import Image from 'next/image';
import { Box, Download, Eye, Heart, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GeneratedModel } from './types';

interface ModelCardProps {
  model: GeneratedModel;
  variant: 'grid' | 'list';
  formatRelativeTimeFn: (ts: number) => string;
  onPreview: (model: GeneratedModel) => void;
  onToggleFavorite: (id: string) => void;
  onViewDetails: (model: GeneratedModel) => void;
  onExport: () => void;
}

export function ModelCard({
  model,
  variant,
  formatRelativeTimeFn,
  onPreview,
  onToggleFavorite,
  onViewDetails,
  onExport,
}: ModelCardProps) {
  const ts = typeof model.createdAt === 'number' ? model.createdAt : new Date(model.createdAt).getTime();

  if (variant === 'list') {
    return (
      <Card className="bg-gray-50 border-gray-200 overflow-hidden hover:border-cyan-500/50 transition-all group">
        <div className="flex">
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={model.thumbnail}
              alt={model.prompt}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
          <CardContent className="p-4 flex-1 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-900 line-clamp-1">{model.name || model.prompt}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                <Badge variant="outline" className="border-gray-200 text-xs">{model.category}</Badge>
                <span>{formatRelativeTimeFn(ts)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" onClick={() => onPreview(model)} className="text-gray-900 hover:bg-gray-100 h-8 w-8">
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onToggleFavorite(model.id)} className={cn('text-gray-900 hover:bg-gray-100 h-8 w-8', model.isFavorite && 'text-pink-400')}>
                {model.isFavorite ? <Heart className="w-4 h-4 fill-current" /> : <Heart className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onViewDetails(model)} className="text-gray-900 hover:bg-gray-100 h-8 w-8">
                <Info className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onExport} className="text-gray-900 hover:bg-gray-100 h-8 w-8">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-50 border-gray-200 overflow-hidden hover:border-cyan-500/50 transition-all group">
      <div className="relative aspect-square">
        <Image
          src={model.thumbnail}
          alt={model.prompt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onPreview(model)} className="text-white hover:bg-white/20">
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite(model.id)}
            className={cn('text-white hover:bg-white/20', model.isFavorite && 'text-pink-400')}
          >
            {model.isFavorite ? <Heart className="w-4 h-4 fill-current" /> : <Heart className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onViewDetails(model)} className="text-white hover:bg-white/20">
            <Info className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onExport} className="text-white hover:bg-white/20">
            <Download className="w-4 h-4" />
          </Button>
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge className="bg-cyan-500/80">
            <Box className="w-3 h-3 mr-1" />
            3D
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <p className="text-sm text-gray-900 line-clamp-2 mb-2">{model.prompt}</p>
        <div className="flex items-center justify-between text-xs text-gray-600">
          <Badge variant="outline" className="border-gray-200">{model.category}</Badge>
          <span>{formatRelativeTimeFn(ts)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
