'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DesignTemplate, Asset } from '../types';

export interface CustomizerModalsProps {
  showTemplates: boolean;
  onTemplatesChange: (open: boolean) => void;
  showAssets: boolean;
  onAssetsChange: (open: boolean) => void;
  templates: DesignTemplate[];
  assets: Asset[];
}

export function CustomizerModals({
  showTemplates,
  onTemplatesChange,
  showAssets,
  onAssetsChange,
  templates,
  assets,
}: CustomizerModalsProps) {
  return (
    <>
      <Dialog open={showTemplates} onOpenChange={onTemplatesChange}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Templates de design</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choisissez un template pour commencer rapidement
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="bg-gray-900/50 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer"
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      <Image
                        src={template.thumbnail}
                        alt={template.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-white text-sm mb-1">{template.name}</h3>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{template.category}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssets} onOpenChange={onAssetsChange}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Bibliothèque d&apos;assets</DialogTitle>
            <DialogDescription className="text-gray-400">
              Parcourez votre bibliothèque d&apos;images, icônes et textures
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 p-4">
              {assets.map((asset) => (
                <Card
                  key={asset.id}
                  className="bg-gray-900/50 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer"
                >
                  <CardContent className="p-2">
                    <div className="relative aspect-square overflow-hidden rounded-lg mb-2">
                      <Image
                        src={asset.thumbnail ?? asset.thumbnailUrl ?? asset.url}
                        alt={asset.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs text-white text-center truncate">{asset.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
