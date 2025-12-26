'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Eye,
  Smartphone,
  Download,
  Share2,
  ArrowLeft,
  Play,
  RotateCw,
  Maximize2,
  QrCode,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Prévisualisation AR - AR Studio
 * Visualisation et test des modèles AR
 */
export default function ARStudioPreviewPage() {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState<string>('model-1');
  const [isPreviewing, setIsPreviewing] = useState(false);

  const models = [
    { id: 'model-1', name: 'Lunettes de soleil', thumbnail: 'https://picsum.photos/400/400?random=1' },
    { id: 'model-2', name: 'Montre de luxe', thumbnail: 'https://picsum.photos/400/400?random=2' },
    { id: 'model-3', name: 'Bague en or', thumbnail: 'https://picsum.photos/400/400?random=3' },
  ];

  const handleStartPreview = useCallback(() => {
    setIsPreviewing(true);
    toast({
      title: 'Prévisualisation AR',
      description: 'Ouvrez votre appareil mobile pour voir le modèle en AR',
    });
  }, [toast]);

  return (
    <ErrorBoundary componentName="ARStudioPreview">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard/ar-studio">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Eye className="w-8 h-8 text-cyan-400" />
              Prévisualisation AR
            </h1>
            <p className="text-slate-400 mt-2">
              Testez vos modèles en réalité augmentée avant publication
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Model Selection */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Sélectionner un modèle</CardTitle>
                <CardDescription className="text-slate-400">
                  Choisissez le modèle à prévisualiser
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden">
                  <img
                    src={models.find(m => m.id === selectedModel)?.thumbnail || models[0].thumbnail}
                    alt="Model preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleStartPreview}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                    size="lg"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Démarrer la prévisualisation
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-slate-700 hover:bg-slate-800 text-white"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Générer QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-cyan-950/20 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-300 text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Comment utiliser
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-slate-400 space-y-2">
                  <li>1. Sélectionnez un modèle</li>
                  <li>2. Cliquez sur "Démarrer la prévisualisation"</li>
                  <li>3. Scannez le QR Code avec votre mobile</li>
                  <li>4. Visualisez le modèle en AR</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview Area */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Zone de prévisualisation</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                  {isPreviewing ? (
                    <div className="text-center">
                      <div className="w-24 h-24 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-400">Chargement de la prévisualisation AR...</p>
                      <p className="text-xs text-slate-500 mt-2">Ouvrez votre appareil mobile</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Eye className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 mb-4">Aucune prévisualisation active</p>
                      <Button
                        onClick={handleStartPreview}
                        variant="outline"
                        className="border-slate-700 hover:bg-slate-800 text-white"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Démarrer
                      </Button>
                    </div>
                  )}
                </div>

                {/* Model Info */}
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2">Informations du modèle</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Format</p>
                        <p className="text-sm text-white">USDZ / GLB</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Taille</p>
                        <p className="text-sm text-white">2.4 MB</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Polygones</p>
                        <p className="text-sm text-white">12,450</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Statut</p>
                        <Badge variant="outline" className="border-green-500/50 text-green-300">
                          Prêt
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

