'use client';

/**
 * AI Studio Page
 * Dashboard pour toutes les fonctionnalités IA
 */

import React, { useState, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Sparkles,
  ImageIcon,
  Wand2,
  Palette,
  Maximize2,
  Scissors,
  Upload,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  History,
  Zap,
  RefreshCw,
  Copy,
  X,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useAI } from '@/lib/ai/useAI';
import OptimizedImage from '../../../../components/optimized/OptimizedImage';
import Image from 'next/image';

// AI Tools configuration
const AI_TOOLS = [
  {
    id: 'background_removal',
    name: 'Supprimer l\'arrière-plan',
    description: 'Détourage automatique avec IA',
    icon: Scissors,
    color: 'from-purple-500 to-pink-500',
    badge: 'Populaire',
  },
  {
    id: 'upscale',
    name: 'Agrandir l\'image',
    description: 'Upscaling IA 2x ou 4x',
    icon: Maximize2,
    color: 'from-blue-500 to-cyan-500',
    badge: null,
  },
  {
    id: 'color_extraction',
    name: 'Extraire les couleurs',
    description: 'Palette automatique',
    icon: Palette,
    color: 'from-amber-500 to-orange-500',
    badge: null,
  },
  {
    id: 'text_to_design',
    name: 'Texte vers Design',
    description: 'Génération IA de designs',
    icon: Wand2,
    color: 'from-green-500 to-emerald-500',
    badge: 'Beta',
  },
  {
    id: 'smart_crop',
    name: 'Recadrage intelligent',
    description: 'Crop automatique',
    icon: ImageIcon,
    color: 'from-red-500 to-rose-500',
    badge: null,
  },
];

function AIStudioPageContent() {
  const {
    isProcessing,
    currentOperation,
    error,
    removeBackground,
    upscaleImage,
    extractColors,
    generateDesign,
    smartCrop,
    getHistory,
    clearError,
  } = useAI();

  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [extractedColors, setExtractedColors] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tool-specific settings
  const [bgRemovalMode, setBgRemovalMode] = useState<'auto' | 'person' | 'product' | 'animal'>('auto');
  const [upscaleScale, setUpscaleScale] = useState<2 | 4>(2);
  const [maxColors, setMaxColors] = useState(6);
  const [designPrompt, setDesignPrompt] = useState('');
  const [designStyle, setDesignStyle] = useState<'modern' | 'vintage' | 'minimal' | 'bold' | 'playful'>('modern');
  const [cropRatio, setCropRatio] = useState('1:1');

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setResult(null);
        setExtractedColors([]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Process with selected tool
  const handleProcess = useCallback(async () => {
    if (!selectedTool) return;

    if (selectedTool === 'text_to_design') {
      if (!designPrompt.trim()) return;
      const res = await generateDesign(designPrompt, { style: designStyle });
      if (res) setResult(res);
      return;
    }

    if (!uploadedImage) return;

    switch (selectedTool) {
      case 'background_removal':
        const bgResult = await removeBackground(uploadedImage, bgRemovalMode);
        if (bgResult) setResult(bgResult);
        break;

      case 'upscale':
        const upResult = await upscaleImage(uploadedImage, upscaleScale);
        if (upResult) setResult(upResult);
        break;

      case 'color_extraction':
        const colorResult = await extractColors(uploadedImage, maxColors);
        if (colorResult?.output) {
          setExtractedColors(colorResult.output.colors);
          setResult(colorResult);
        }
        break;

      case 'smart_crop':
        const cropResult = await smartCrop(uploadedImage, cropRatio);
        if (cropResult) setResult(cropResult);
        break;
    }
  }, [
    selectedTool,
    uploadedImage,
    bgRemovalMode,
    upscaleScale,
    maxColors,
    designPrompt,
    designStyle,
    cropRatio,
    removeBackground,
    upscaleImage,
    extractColors,
    generateDesign,
    smartCrop,
  ]);

  // Copy color to clipboard
  const copyColor = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex);
  }, []);

  const selectedToolConfig = AI_TOOLS.find((t) => t.id === selectedTool);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Brain className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold">AI Studio</h1>
          <Badge className="bg-purple-500/20 text-purple-300 border-0">Beta</Badge>
        </div>
        <p className="text-slate-400">
          Outils IA pour transformer vos images et générer des designs
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tool Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">Outils IA</CardTitle>
              <CardDescription>Sélectionnez un outil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {AI_TOOLS.map((tool) => (
                <motion.button
                  key={tool.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedTool(tool.id);
                    setResult(null);
                    setExtractedColors([]);
                  }}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedTool === tool.id
                      ? 'bg-gradient-to-r ' + tool.color + ' border-transparent'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tool.icon className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tool.name}</span>
                        {tool.badge && (
                          <Badge className="text-xs bg-white/20 border-0">{tool.badge}</Badge>
                        )}
                      </div>
                      <p className="text-sm opacity-75">{tool.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </div>
                </motion.button>
              ))}
            </CardContent>
          </Card>

          {/* Tool Settings */}
          {selectedTool && selectedTool !== 'text_to_design' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">Paramètres</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTool === 'background_removal' && (
                    <div className="space-y-2">
                      <Label>Mode de détection</Label>
                      <Select value={bgRemovalMode} onValueChange={(v: any) => setBgRemovalMode(v)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Automatique</SelectItem>
                          <SelectItem value="person">Personne</SelectItem>
                          <SelectItem value="product">Produit</SelectItem>
                          <SelectItem value="animal">Animal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedTool === 'upscale' && (
                    <div className="space-y-2">
                      <Label>Facteur d'agrandissement</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={upscaleScale === 2 ? 'default' : 'outline'}
                          onClick={() => setUpscaleScale(2)}
                          className={upscaleScale === 2 ? 'bg-blue-600' : ''}
                        >
                          2x
                        </Button>
                        <Button
                          variant={upscaleScale === 4 ? 'default' : 'outline'}
                          onClick={() => setUpscaleScale(4)}
                          className={upscaleScale === 4 ? 'bg-blue-600' : ''}
                        >
                          4x
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedTool === 'color_extraction' && (
                    <div className="space-y-2">
                      <Label>Nombre de couleurs: {maxColors}</Label>
                      <Slider
                        value={[maxColors]}
                        onValueChange={([v]) => setMaxColors(v)}
                        min={2}
                        max={12}
                        step={1}
                        className="py-2"
                      />
                    </div>
                  )}

                  {selectedTool === 'smart_crop' && (
                    <div className="space-y-2">
                      <Label>Ratio cible</Label>
                      <Select value={cropRatio} onValueChange={setCropRatio}>
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1:1">Carré (1:1)</SelectItem>
                          <SelectItem value="16:9">Paysage (16:9)</SelectItem>
                          <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                          <SelectItem value="4:3">Standard (4:3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Work Area */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900 border-slate-800 min-h-[600px]">
            <CardContent className="p-6">
              {!selectedTool ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <Sparkles className="w-16 h-16 text-slate-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Sélectionnez un outil</h3>
                  <p className="text-slate-400 max-w-md">
                    Choisissez un outil IA dans le panneau de gauche pour commencer
                  </p>
                </div>
              ) : selectedTool === 'text_to_design' ? (
                /* Text-to-Design Interface */
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label>Décrivez votre design</Label>
                    <textarea
                      placeholder="Ex: Un logo moderne pour une startup tech avec des formes géométriques et des couleurs vives..."
                      value={designPrompt}
                      onChange={(e) => setDesignPrompt(e.target.value)}
                      className="w-full h-32 p-4 bg-slate-800 border border-slate-700 rounded-xl resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label className="mb-2 block">Style</Label>
                        <Select value={designStyle} onValueChange={(v: any) => setDesignStyle(v)}>
                          <SelectTrigger className="bg-slate-800 border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="modern">Moderne</SelectItem>
                            <SelectItem value="vintage">Vintage</SelectItem>
                            <SelectItem value="minimal">Minimaliste</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                            <SelectItem value="playful">Ludique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      onClick={handleProcess}
                      disabled={isProcessing || !designPrompt.trim()}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5 mr-2" />
                          Générer le design
                        </>
                      )}
                    </Button>
                  </div>

                  {result?.output?.imageUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <Label className="mb-4 block">Résultat</Label>
                      <div className="relative rounded-xl overflow-hidden bg-slate-800">
                        <OptimizedImage alt="Generated design" className="w-full h-auto" />
                        <Button
                          size="sm"
                          className="absolute top-4 right-4 bg-slate-900/80"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Télécharger
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                /* Image Processing Interface */
                <div className="space-y-6">
                  {/* Upload Zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                      ${uploadedImage ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'}
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {uploadedImage ? (
                      <div className="relative">
                        <Image
                          src={uploadedImage}
                          alt="Image uploadée"
                          width={512}
                          height={512}
                          className="max-h-64 mx-auto rounded-lg"
                          loading="lazy"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedImage(null);
                            setResult(null);
                          }}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                        <p className="text-slate-400">
                          Cliquez ou glissez une image ici
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                          PNG, JPG jusqu'à 10MB
                        </p>
                      </>
                    )}
                  </div>

                  {/* Process Button */}
                  {uploadedImage && (
                    <Button
                      onClick={handleProcess}
                      disabled={isProcessing}
                      className={`w-full h-12 bg-gradient-to-r ${selectedToolConfig?.color}`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Traitement en cours...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Lancer le traitement
                        </>
                      )}
                    </Button>
                  )}

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-300">{error}</span>
                      <button onClick={clearError} className="ml-auto">
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </motion.div>
                  )}

                  {/* Color Extraction Result */}
                  {selectedTool === 'color_extraction' && extractedColors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <Label>Palette extraite</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {extractedColors.map((color, index) => (
                          <motion.div
                            key={color.hex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => copyColor(color.hex)}
                            className="p-3 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors"
                          >
                            <div
                              className="w-full h-16 rounded-lg mb-2"
                              style={{ backgroundColor: color.hex }}
                            />
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{color.hex}</p>
                                <p className="text-xs text-slate-400">{color.name}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {color.percentage}%
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Other Results */}
                  {result?.output?.imageUrl && selectedTool !== 'color_extraction' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <Label>Résultat</Label>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-1" />
                          Télécharger
                        </Button>
                      </div>
                      <div className="relative rounded-xl overflow-hidden bg-slate-800">
                        <Image
                          src={result.output.imageUrl}
                          alt="Résultat de la génération IA"
                          width={1024}
                          height={1024}
                          className="w-full h-auto"
                          loading="lazy"
                        />
                        <div className="absolute bottom-4 left-4 flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-green-300 border-0">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Terminé
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const MemoizedAIStudioPageContent = memo(AIStudioPageContent);

export default function AIStudioPage() {
  return (
    <ErrorBoundary level="page" componentName="AIStudioPage">
      <MemoizedAIStudioPageContent />
    </ErrorBoundary>
  );
}


