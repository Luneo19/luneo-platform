/**
 * Liste des modèles AR
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Heart, Eye, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatNumber, formatBytes, formatDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { ARModel } from '../types';

interface ARModelsListProps {
  models: ARModel[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onStartPreview: (modelId: string) => void;
}

export function ARModelsList({
  models,
  selectedModel,
  onSelectModel,
  onStartPreview,
}: ARModelsListProps) {
  if (models.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Aucun modèle trouvé</p>
      </div>
    );
  }

  const getStatusIcon = (status: ARModel['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {models.map((model) => (
        <Card
          key={model.id}
          className={cn(
            'bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer',
            selectedModel === model.id && 'border-blue-500'
          )}
          onClick={() => onSelectModel(model.id)}
        >
          <div className="relative aspect-video overflow-hidden rounded-t-lg">
            <Image
              src={model.thumbnail}
              alt={model.name}
              fill
              className="object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              {getStatusIcon(model.status)}
              {model.isFavorite && (
                <Heart className="w-4 h-4 text-pink-400 fill-current" />
              )}
            </div>
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="bg-gray-900/80 text-white">
                {model.category}
              </Badge>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium mb-1 line-clamp-1">{model.name}</h3>
                {model.description && (
                  <p className="text-gray-400 text-xs line-clamp-2">{model.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatNumber(model.views)}
              </span>
              <span>{formatBytes(model.size)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {model.platformSupport?.map((platform) => (
                  <Badge
                    key={platform}
                    variant="outline"
                    className="text-xs border-gray-600 text-gray-400"
                  >
                    {platform}
                  </Badge>
                ))}
              </div>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartPreview(model.id);
                }}
                disabled={model.status !== 'ready'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-3 h-3 mr-1" />
                Prévisualiser
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}



