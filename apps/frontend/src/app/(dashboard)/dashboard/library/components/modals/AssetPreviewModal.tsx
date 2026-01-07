/**
 * Modal de prévisualisation d'un asset
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Star, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { formatDate } from '@/lib/utils/formatters';
import type { Template } from '../../types';

interface AssetPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  onToggleFavorite: (templateId: string, isFavorite: boolean) => Promise<{ success: boolean }>;
  onDelete: (templateId: string) => Promise<{ success: boolean }>;
}

export function AssetPreviewModal({
  open,
  onOpenChange,
  template,
  onToggleFavorite,
  onDelete,
}: AssetPreviewModalProps) {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{template.name}</DialogTitle>
              <DialogDescription className="text-gray-400">
                {template.description || 'Aucune description'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {template.isPremium && (
                <Badge className="bg-yellow-500/90 text-yellow-900">Premium</Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFavorite(template.id, template.isFavorite)}
              >
                <Star
                  className={`w-5 h-5 ${template.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="relative aspect-video w-full bg-gray-900 rounded-lg overflow-hidden">
            <Image src={template.thumbnail} alt={template.name} fill className="object-contain" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Téléchargements</p>
              <p className="text-white font-medium">{template.downloads}</p>
            </div>
            <div>
              <p className="text-gray-400">Vues</p>
              <p className="text-white font-medium">{template.views}</p>
            </div>
            <div>
              <p className="text-gray-400">Créé le</p>
              <p className="text-white font-medium">{formatDate(new Date(template.createdAt))}</p>
            </div>
            <div>
              <p className="text-gray-400">Catégorie</p>
              <p className="text-white font-medium capitalize">{template.category}</p>
            </div>
          </div>
          {template.tags && template.tags.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-gray-600 text-gray-300">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => onDelete(template.id)}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700">
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


