/**
 * Grille d'affichage des générations AI
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Download,
  Share2,
  MoreVertical,
  Copy,
  Trash2,
  CheckCircle2,
  Loader2,
  XCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { formatDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import type { Generation } from '../types';

interface AIGenerationsGridProps {
  generations: Generation[];
  onPreview: (generation: Generation) => void;
  onDownload: (generation: Generation) => void;
  onDelete: (generationId: string) => void;
  onShare: (generation: Generation) => void;
}

export function AIGenerationsGrid({
  generations,
  onPreview,
  onDownload,
  onDelete,
  onShare,
}: AIGenerationsGridProps) {
  if (generations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Aucune génération trouvée</p>
      </div>
    );
  }

  const getStatusBadge = (status: Generation['status']) => {
    const statusConfig = {
      completed: { label: 'Terminée', icon: CheckCircle2, className: 'bg-green-500' },
      processing: { label: 'En cours', icon: Loader2, className: 'bg-yellow-500 animate-pulse' },
      pending: { label: 'En attente', icon: Loader2, className: 'bg-blue-500' },
      failed: { label: 'Échouée', icon: XCircle, className: 'bg-red-500' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={cn(config.className, 'flex items-center gap-1')}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {generations.map((generation) => (
        <Card
          key={generation.id}
          className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors group"
        >
          <div className="relative aspect-square overflow-hidden rounded-t-lg">
            {generation.thumbnail ? (
              <Image
                src={generation.thumbnail}
                alt={generation.prompt}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              {getStatusBadge(generation.status)}
            </div>
            {generation.status === 'completed' && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onPreview(generation)}
                  className="bg-white/90 hover:bg-white"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onDownload(generation)}
                  className="bg-white/90 hover:bg-white"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 line-clamp-2 mb-1">
                  {generation.prompt}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(generation.createdAt)}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                  <DropdownMenuItem
                    onClick={() => onPreview(generation)}
                    className="text-gray-300 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Prévisualiser
                  </DropdownMenuItem>
                  {generation.status === 'completed' && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onDownload(generation)}
                        className="text-gray-300 cursor-pointer"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onShare(generation)}
                        className="text-gray-300 cursor-pointer"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Partager
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(generation.result || '');
                        }}
                        className="text-gray-300 cursor-pointer"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copier l'URL
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={() => onDelete(generation.id)}
                    className="text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{generation.model}</span>
              <span>{generation.credits} crédits</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


