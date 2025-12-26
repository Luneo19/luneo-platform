'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Edit,
  Image as ImageIcon,
  Type,
  Shapes,
  Layers,
  Download,
  Save,
  Eye,
} from 'lucide-react';

/**
 * Editor - Éditeur avancé
 * Éditeur de design complet
 */
export default function EditorPage() {
  const [activeTab, setActiveTab] = useState('design');

  return (
    <ErrorBoundary componentName="Editor">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Edit className="w-8 h-8 text-cyan-400" />
              Éditeur
            </h1>
            <p className="text-slate-400 mt-2">
              Éditeur de design professionnel avec toutes les fonctionnalités
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-white">
              <Eye className="w-4 h-4 mr-2" />
              Prévisualiser
            </Button>
            <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-white">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Tools */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Outils</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="design" className="text-xs">Design</TabsTrigger>
                    <TabsTrigger value="assets" className="text-xs">Assets</TabsTrigger>
                  </TabsList>
                  <TabsContent value="design" className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start border-slate-700 hover:bg-slate-800 text-white"
                    >
                      <Type className="w-4 h-4 mr-2" />
                      Texte
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-slate-700 hover:bg-slate-800 text-white"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Image
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-slate-700 hover:bg-slate-800 text-white"
                    >
                      <Shapes className="w-4 h-4 mr-2" />
                      Formes
                    </Button>
                  </TabsContent>
                  <TabsContent value="assets" className="space-y-2">
                    <div className="text-sm text-slate-400">
                      Bibliothèque d'assets
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Canvas */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-8">
                <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-700">
                  <div className="text-center">
                    <Edit className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">Zone de travail</p>
                    <p className="text-sm text-slate-500">Glissez vos éléments ici</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Properties */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Propriétés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Position</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">X</p>
                        <input
                          type="number"
                          defaultValue={0}
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Y</p>
                        <input
                          type="number"
                          defaultValue={0}
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Taille</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Largeur</p>
                        <input
                          type="number"
                          defaultValue={100}
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Hauteur</p>
                        <input
                          type="number"
                          defaultValue={100}
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                        />
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

