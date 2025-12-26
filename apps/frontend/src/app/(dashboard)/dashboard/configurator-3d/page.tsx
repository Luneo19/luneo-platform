'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Box,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  Settings,
} from 'lucide-react';

/**
 * Configurateur 3D
 * Visualisation et configuration de produits 3D
 */
export default function Configurator3DPage() {
  const [selectedColor, setSelectedColor] = useState('blue');
  const [rotation, setRotation] = useState([0]);
  const [zoom, setZoom] = useState([100]);

  const colors = [
    { id: 'blue', name: 'Bleu', value: '#3B82F6' },
    { id: 'red', name: 'Rouge', value: '#EF4444' },
    { id: 'green', name: 'Vert', value: '#10B981' },
    { id: 'purple', name: 'Violet', value: '#8B5CF6' },
  ];

  return (
    <ErrorBoundary componentName="Configurator3D">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Box className="w-8 h-8 text-cyan-400" />
              Configurateur 3D
            </h1>
            <p className="text-slate-400 mt-2">
              Visualisez et configurez vos produits en 3D en temps réel
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-white">
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Couleur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedColor === color.id
                          ? 'border-cyan-500 bg-cyan-950/20'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div
                        className="w-full h-12 rounded"
                        style={{ backgroundColor: color.value }}
                      />
                      <p className="text-xs text-slate-400 mt-2 text-center">{color.name}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Contrôles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 mb-2">Rotation: {rotation[0]}°</p>
                  <Slider
                    value={rotation}
                    onValueChange={setRotation}
                    min={0}
                    max={360}
                    step={1}
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2">Zoom: {zoom[0]}%</p>
                  <Slider
                    value={zoom}
                    onValueChange={setZoom}
                    min={50}
                    max={200}
                    step={5}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-700 hover:bg-slate-800 text-white"
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    Réinitialiser
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 hover:bg-slate-800 text-white"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - 3D Viewer */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-8">
                <div className="relative aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden flex items-center justify-center border-2 border-slate-700">
                  <div className="text-center">
                    <Box className="w-24 h-24 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">Visualiseur 3D</p>
                    <Badge variant="outline" className="border-slate-600 text-slate-400">
                      Modèle 3D en chargement...
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Info */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Produit</p>
                  <p className="text-sm text-white">Montre Premium</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Couleur sélectionnée</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-slate-700"
                      style={{
                        backgroundColor: colors.find(c => c.id === selectedColor)?.value || colors[0].value,
                      }}
                    />
                    <p className="text-sm text-white">
                      {colors.find(c => c.id === selectedColor)?.name || colors[0].name}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Format</p>
                  <p className="text-sm text-white">USDZ / GLB</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Polygones</p>
                  <p className="text-sm text-white">12,450</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

