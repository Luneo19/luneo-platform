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
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du modèle 3D</DialogTitle>
          <DialogDescription className="text-slate-400">
            Informations complètes sur cette création
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-6">
          <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden">
            <Image
              src={model.thumbnail}
              alt={model.prompt}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 80vw"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <p className="text-sm text-slate-400 mb-1">Catégorie</p>
                <p className="text-lg font-bold capitalize">{model.category}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <p className="text-sm text-slate-400 mb-1">Complexité</p>
                <p className="text-lg font-bold capitalize">{model.complexity}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <p className="text-sm text-slate-400 mb-1">Résolution</p>
                <p className="text-lg font-bold capitalize">{model.resolution}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <p className="text-sm text-slate-400 mb-1">Crédits</p>
                <p className="text-lg font-bold">{model.credits}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">{model.prompt}</p>
            </CardContent>
          </Card>

          {model.metadata && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">Métadonnées 3D</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {model.metadata.format != null && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Format</span>
                      <span className="text-white">{model.metadata.format}</span>
                    </div>
                    <Separator className="bg-slate-700" />
                  </>
                )}
                {model.metadata.size != null && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Taille du fichier</span>
                      <span className="text-white">{formatFileSize(model.metadata.size)}</span>
                    </div>
                    <Separator className="bg-slate-700" />
                  </>
                )}
                {model.metadata.vertices != null && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Vertices</span>
                      <span className="text-white">{model.metadata.vertices.toLocaleString()}</span>
                    </div>
                    <Separator className="bg-slate-700" />
                  </>
                )}
                {model.metadata.faces != null && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Faces</span>
                      <span className="text-white">{model.metadata.faces.toLocaleString()}</span>
                    </div>
                    <Separator className="bg-slate-700" />
                  </>
                )}
                {model.metadata.textures != null && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Textures</span>
                      <span className="text-white">{model.metadata.textures}</span>
                    </div>
                    <Separator className="bg-slate-700" />
                  </>
                )}
                {model.metadata.materials != null && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Matériaux</span>
                      <span className="text-white">{model.metadata.materials}</span>
                    </div>
                    <Separator className="bg-slate-700" />
                  </>
                )}
                {model.metadata.model != null && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Modèle IA</span>
                      <span className="text-white">{model.metadata.model}</span>
                    </div>
                    <Separator className="bg-slate-700" />
                  </>
                )}
                {model.polyCount != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Polygones</span>
                    <span className="text-white">{model.polyCount.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700">
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
