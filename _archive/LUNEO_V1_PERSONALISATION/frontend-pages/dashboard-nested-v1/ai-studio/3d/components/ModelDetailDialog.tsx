'use client';

import Image from 'next/image';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatFileSize } from './utils';
import type { GeneratedModel } from './types';

interface ModelDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: GeneratedModel | null;
  onExportClick: () => void;
}

export function ModelDetailDialog({ open, onOpenChange, model, onExportClick }: ModelDetailDialogProps) {
  if (!model) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du modèle 3D</DialogTitle>
          <DialogDescription className="text-gray-600">
            Informations complètes sur cette création
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-6">
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={model.thumbnail}
              alt={model.prompt}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 80vw"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Catégorie</p>
                <p className="text-lg font-bold capitalize text-gray-900">{model.category}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Complexité</p>
                <p className="text-lg font-bold capitalize text-gray-900">{model.complexity}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Résolution</p>
                <p className="text-lg font-bold capitalize text-gray-900">{model.resolution}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Crédits</p>
                <p className="text-lg font-bold text-gray-900">{model.credits}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{model.prompt}</p>
            </CardContent>
          </Card>

          {model.metadata && (
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Métadonnées 3D</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {model.metadata.format != null && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Format</span>
                      <span className="text-gray-900">{model.metadata.format}</span>
                    </div>
                    <Separator className="bg-gray-200" />
                  </>
                )}
                {model.metadata.size != null && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Taille du fichier</span>
                      <span className="text-gray-900">{formatFileSize(model.metadata.size)}</span>
                    </div>
                    <Separator className="bg-gray-200" />
                  </>
                )}
                {model.metadata.vertices != null && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Vertices</span>
                      <span className="text-gray-900">{model.metadata.vertices.toLocaleString()}</span>
                    </div>
                    <Separator className="bg-gray-200" />
                  </>
                )}
                {model.metadata.faces != null && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Faces</span>
                      <span className="text-gray-900">{model.metadata.faces.toLocaleString()}</span>
                    </div>
                    <Separator className="bg-gray-200" />
                  </>
                )}
                {model.metadata.textures != null && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Textures</span>
                      <span className="text-gray-900">{model.metadata.textures}</span>
                    </div>
                    <Separator className="bg-gray-200" />
                  </>
                )}
                {model.metadata.materials != null && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Matériaux</span>
                      <span className="text-gray-900">{model.metadata.materials}</span>
                    </div>
                    <Separator className="bg-gray-200" />
                  </>
                )}
                {model.metadata.model != null && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Modèle IA</span>
                      <span className="text-gray-900">{model.metadata.model}</span>
                    </div>
                    <Separator className="bg-gray-200" />
                  </>
                )}
                {model.polyCount != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Polygones</span>
                    <span className="text-gray-900">{model.polyCount.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">
            Fermer
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onExportClick();
            }}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
