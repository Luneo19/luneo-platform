/**
 * Grille d'affichage des modèles AR
 */

'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Play,
  Download,
  Share2,
  MoreVertical,
  QrCode,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { formatDate, formatBytes } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import type { ARModel } from '../types';

interface ARModelsGridProps {
  models: ARModel[];
  onPreview: (model: ARModel) => void;
  onViewAR: (model: ARModel) => void;
  onDelete: (modelId: string) => void;
  onGenerateQR: (model: ARModel) => void;
  onCopyEmbedCode: (model: ARModel) => void;
}

export function ARModelsGrid({
  models,
  onPreview,
  onViewAR,
  onDelete,
  onGenerateQR,
  onCopyEmbedCode,
}: ARModelsGridProps) {
  const { t } = useI18n();
  if (models.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{t('arStudio.noModelsFound')}</p>
      </div>
    );
  }

  const getStatusBadge = (status: ARModel['status']) => {
    const statusConfig = {
      active: { label: t('arStudio.status.active'), className: 'bg-green-500' },
      processing: { label: t('arStudio.status.processing'), className: 'bg-blue-500' },
      error: { label: t('arStudio.status.error'), className: 'bg-red-500' },
      draft: { label: t('arStudio.status.draft'), className: 'bg-gray-600' },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {models.map((model) => (
        <Card
          key={model.id}
          className="bg-white border-gray-200 hover:border-cyan-500/50 transition-colors group"
        >
          <div className="relative aspect-square overflow-hidden rounded-t-lg">
            <Image
              src={model.thumbnail}
              alt={model.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              {getStatusBadge(model.status)}
              {model.format === 'Both' && (
                <Badge className="bg-cyan-500">USDZ + GLB</Badge>
              )}
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onPreview(model)}
                className="bg-white/90 hover:bg-white"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onViewAR(model)}
                className="bg-white/90 hover:bg-white"
              >
                <Play className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{model.name}</h3>
                <p className="text-xs text-gray-600 mt-1">
                  {formatDate(model.createdAt)}
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
                    onClick={() => onPreview(model)}
                    className="text-gray-700 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {t('arStudio.preview')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onViewAR(model)}
                    className="text-gray-300 cursor-pointer"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {t('arStudio.viewAR')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onGenerateQR(model)}
                    className="text-gray-300 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    {t('arStudio.generateQR')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onCopyEmbedCode(model)}
                    className="text-gray-300 cursor-pointer"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {t('arStudio.copyEmbed')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 cursor-pointer">
                    <Download className="w-4 h-4 mr-2" />
                    {t('aiStudio.download')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(model.id)}
                    className="text-red-400 cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4 mr-2" />
                    {t('aiStudio.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
              <span>{formatBytes(model.fileSize)}</span>
              <span>•</span>
              <span>{model.views} {t('arStudio.views')}</span>
              <span>•</span>
              <span>{model.tryOns} {t('arStudio.tryOns').toLowerCase()}</span>
            </div>
            {model.tags && model.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {model.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs border-gray-200 text-gray-700">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}



