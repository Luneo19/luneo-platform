'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Palette,
  Upload,
  Download,
  Save,
  Undo,
  Redo,
  Layers,
  Type,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Customizer - Éditeur de personnalisation
 * Outil de personnalisation de produits
 */
export default function CustomizerPage() {
  const [selectedProduct, setSelectedProduct] = useState<string>('product-1');
  const [color, setColor] = useState('#3B82F6');
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState([24]);

  const products = [
    { id: 'product-1', name: 'T-shirt Blanc', image: 'https://picsum.photos/400/500?random=1' },
    { id: 'product-2', name: 'Sweat à capuche', image: 'https://picsum.photos/400/500?random=2' },
    { id: 'product-3', name: 'Casquette', image: 'https://picsum.photos/400/500?random=3' },
  ];

  return (
    <ErrorBoundary componentName="Customizer">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Palette className="w-8 h-8 text-cyan-400" />
              Customizer
            </h1>
            <p className="text-slate-400 mt-2">
              Personnalisez vos produits avec notre éditeur intuitif
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-white">
              <Undo className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-white">
              <Redo className="w-4 h-4 mr-2" />
              Refaire
            </Button>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Tools */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Produit</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  Couleur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white text-sm mb-2 block">Couleur principale</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-16 h-10 p-1 bg-slate-800 border-slate-700"
                      />
                      <Input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="flex-1 bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Type className="w-4 h-4 text-cyan-400" />
                  Texte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white text-sm mb-2 block">Texte personnalisé</Label>
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Entrez votre texte..."
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white text-sm mb-2 block">Taille: {fontSize[0]}px</Label>
                  <Slider
                    value={fontSize}
                    onValueChange={setFontSize}
                    min={12}
                    max={72}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full border-slate-700 hover:bg-slate-800 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer une image
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Canvas */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-8">
                <div className="relative aspect-[3/4] bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={products.find(p => p.id === selectedProduct)?.image || products[0].image}
                    alt="Product preview"
                    className="w-full h-full object-contain"
                  />
                  {text && (
                    <div
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        color,
                        fontSize: `${fontSize[0]}px`,
                        fontWeight: 'bold',
                      }}
                    >
                      {text}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Layers */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Calques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-cyan-500/50">
                    <p className="text-sm font-medium text-white">Texte personnalisé</p>
                    <p className="text-xs text-slate-400">{text || 'Aucun texte'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-sm font-medium text-white">Couleur de base</p>
                    <p className="text-xs text-slate-400">{color}</p>
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

