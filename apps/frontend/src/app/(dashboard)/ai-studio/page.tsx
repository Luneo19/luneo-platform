'use client';

/**
 * AI Studio Page (Unifiée et Optimisée)
 * Dashboard complet pour toutes les fonctionnalités IA
 * Utilise les nouvelles routes API optimisées avec retry, fallback, et gestion des crédits
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
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
  Zap,
  RefreshCw,
  Copy,
  X,
  ChevronRight,
  Brain,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { endpoints, api } from '@/lib/api/client';
import OptimizedImage from '@/components/optimized/OptimizedImage';
import Image from 'next/image';
// ✅ Feature gating
import { UpgradePrompt } from '@/components/upgrade/UpgradePrompt';
import { PlanGate } from '@/lib/hooks/api/useFeatureGate';

// AI Tools configuration
const AI_TOOLS = [
  {
    id: 'background_removal',
    name: 'Supprimer l\'arrière-plan',
    description: 'Détourage automatique avec IA',
    icon: Scissors,
    color: 'from-purple-500 to-pink-500',
    badge: 'Populaire',
    credits: 1,
  },
  {
    id: 'upscale',
    name: 'Agrandir l\'image',
    description: 'Upscaling IA 2x ou 4x',
    icon: Maximize2,
    color: 'from-blue-500 to-cyan-500',
    badge: null,
    credits: 2, // 2 pour 2x, 4 pour 4x
  },
  {
    id: 'color_extraction',
    name: 'Extraire les couleurs',
    description: 'Palette automatique',
    icon: Palette,
    color: 'from-amber-500 to-orange-500',
    badge: null,
    credits: 0, // Gratuit
  },
  {
    id: 'text_to_design',
    name: 'Texte vers Design',
    description: 'Génération IA de designs',
    icon: Wand2,
    color: 'from-green-500 to-emerald-500',
    badge: 'Beta',
    credits: 5,
  },
  {
    id: 'smart_crop',
    name: 'Recadrage intelligent',
    description: 'Crop automatique',
    icon: ImageIcon,
    color: 'from-red-500 to-rose-500',
    badge: null,
    credits: 1,
  },
];

function AIStudioPageContent() {
  const { toast } = useToast();
  interface AIStudioResult {
    output?: { imageUrl?: string };
  }
  interface ExtractedColor {
    hex: string;
    name?: string;
    percentage?: number;
  }
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [result, setResult] = useState<AIStudioResult | null>(null);
  const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tool-specific settings
  const [bgRemovalMode, setBgRemovalMode] = useState<'auto' | 'person' | 'product' | 'animal'>('auto');
  const [upscaleScale, setUpscaleScale] = useState<'2' | '4'>('2');
  const [maxColors, setMaxColors] = useState(6);
  const [designPrompt, setDesignPrompt] = useState('');
  const [designStyle, setDesignStyle] = useState<'modern' | 'vintage' | 'minimal' | 'bold' | 'playful'>('modern');
  const [cropRatio, setCropRatio] = useState('1:1');

  // Fetch user credits from NestJS backend (auth via cookies)
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await endpoints.credits.balance();
        setCredits(res?.balance ?? 0);
      } catch {
        setCredits(null);
      }
    };
    fetchCredits();
  }, []);

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

    const selectedToolConfig = AI_TOOLS.find((t) => t.id === selectedTool);
    if (!selectedToolConfig) return;

    // Vérifier crédits
    if (selectedToolConfig.credits > 0 && credits !== null) {
      const requiredCredits = selectedTool === 'upscale' && upscaleScale === '4' ? 4 : selectedToolConfig.credits;
      if (credits < requiredCredits) {
        toast({
          title: 'Crédits insuffisants',
          description: `Vous avez ${credits} crédits, ${requiredCredits} requis.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsProcessing(true);

    try {
      type AIApiResponse = { imageUrl?: string; outputUrl?: string; url?: string; design?: { preview_url?: string }; colors?: ExtractedColor[] };
      let data: AIApiResponse;

      if (selectedTool === 'text_to_design') {
        if (!designPrompt.trim()) {
          toast({
            title: 'Prompt requis',
            description: 'Veuillez entrer une description',
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        data = await api.post('/api/v1/ai/text-to-design', {
          prompt: designPrompt,
          style: designStyle,
          aspectRatio: '1:1',
        });
      } else {
        if (!uploadedImage) {
          toast({
            title: 'Image requise',
            description: 'Veuillez télécharger une image',
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        switch (selectedTool) {
          case 'background_removal':
            data = await api.post('/api/v1/ai/background-removal', { imageUrl: uploadedImage, mode: bgRemovalMode });
            break;
          case 'upscale':
            data = await api.post('/api/v1/ai/upscale', { imageUrl: uploadedImage, scale: upscaleScale });
            break;
          case 'color_extraction':
            data = await api.post('/api/v1/ai/extract-colors', { imageUrl: uploadedImage, maxColors, includeNeutral: false });
            break;
          case 'smart_crop':
            data = await api.post('/api/v1/ai/smart-crop', { imageUrl: uploadedImage, targetAspectRatio: cropRatio, focusPoint: 'auto' });
            break;
          default:
            throw new Error('Outil non reconnu');
        }
      }

      if (selectedTool === 'color_extraction') {
        setExtractedColors(data.colors || []);
        setResult(data);
      } else {
        setResult({
          output: {
            imageUrl: data.imageUrl || data.outputUrl || data.url || data.design?.preview_url,
          },
        });
      }

      // Rafraîchir crédits depuis le backend
      try {
        const res = await endpoints.credits.balance();
        setCredits(res?.balance ?? 0);
      } catch {
        // keep current credits on refresh error
      }

      toast({
        title: 'Succès',
        description: 'Traitement terminé avec succès',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
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
    credits,
    toast,
  ]);

  // Copy color to clipboard
  const copyColor = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex);
    toast({
      title: 'Copié',
      description: `Couleur ${hex} copiée dans le presse-papier`,
    });
  }, [toast]);

  const selectedToolConfig = AI_TOOLS.find((t) => t.id === selectedTool);

  return (
    <PlanGate 
      minimumPlan="professional"
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] text-white p-6 flex items-center justify-center">
          <UpgradePrompt 
            requiredPlan="professional" 
            feature="AI Studio"
            description="L'AI Studio avec tous les outils de génération IA nécessite le plan Professional ou supérieur."
            variant="default"
          />
        </div>
      }
    >
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      {/* Header */}
      <motion
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Studio</h1>
              <p className="text-white/60">
                Outils IA pour transformer vos images et générer des designs
              </p>
            </div>
          </div>
          {credits !== null && (
            <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-xs text-white/40">Crédits disponibles</p>
                  <p className="text-lg font-bold text-white">{credits}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </motion>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tool Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white">Outils IA</CardTitle>
              <CardDescription className="text-white/40">Sélectionnez un outil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {AI_TOOLS.map((tool) => (
                <motion
                  key={tool.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedTool(tool.id);
                    setResult(null);
                    setExtractedColors([]);
                  }}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedTool === tool.id
                      ? 'dash-card-glow border-purple-500/40 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                      : 'dash-card border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.10]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tool.icon className={`w-5 h-5 ${selectedTool === tool.id ? 'text-white' : 'text-white/80'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">{tool.name}</span>
                        {tool.badge && (
                          <span className="dash-badge dash-badge-pro text-xs">{tool.badge}</span>
                        )}
                        {tool.credits > 0 && (
                          <span className="text-xs text-white/60">
                            {tool.credits} crédit{tool.credits > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/60">{tool.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </div>
                </motion>
              ))}
            </CardContent>
          </Card>

          {/* Tool Settings */}
          {selectedTool && selectedTool !== 'text_to_design' && (
            <motion
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Paramètres</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTool === 'background_removal' && (
                    <div className="space-y-2">
                      <Label className="text-white/80">Mode de détection</Label>
                      <Select value={bgRemovalMode} onValueChange={(v: 'auto' | 'person' | 'product' | 'animal') => setBgRemovalMode(v)}>
                        <SelectTrigger className="dash-input border-white/[0.08] bg-white/[0.04] text-white">
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
                      <Label className="text-white/80">Facteur d'agrandissement</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={upscaleScale === '2' ? 'default' : 'outline'}
                          onClick={() => setUpscaleScale('2')}
                          className={upscaleScale === '2' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'border-white/[0.08] text-white/80 hover:bg-white/[0.04]'}
                        >
                          2x (2 crédits)
                        </Button>
                        <Button
                          variant={upscaleScale === '4' ? 'default' : 'outline'}
                          onClick={() => setUpscaleScale('4')}
                          className={upscaleScale === '4' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'border-white/[0.08] text-white/80 hover:bg-white/[0.04]'}
                        >
                          4x (4 crédits)
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedTool === 'color_extraction' && (
                    <div className="space-y-2">
                      <Label className="text-white/80">Nombre de couleurs: {maxColors}</Label>
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
                      <Label className="text-white/80">Ratio cible</Label>
                      <Select value={cropRatio} onValueChange={setCropRatio}>
                        <SelectTrigger className="dash-input border-white/[0.08] bg-white/[0.04] text-white">
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
            </motion>
          )}
        </div>

        {/* Work Area */}
        <div className="lg:col-span-2">
          <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm min-h-[600px]">
            <CardContent className="p-6">
              {!selectedTool ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <Sparkles className="w-16 h-16 text-white/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-white">Sélectionnez un outil</h3>
                  <p className="text-white/60 max-w-md">
                    Choisissez un outil IA dans le panneau de gauche pour commencer
                  </p>
                </div>
              ) : selectedTool === 'text_to_design' ? (
                /* Text-to-Design Interface */
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-white/80">Décrivez votre design</Label>
                    <textarea
                      placeholder="Ex: Un logo moderne pour une startup tech avec des formes géométriques et des couleurs vives..."
                      value={designPrompt}
                      onChange={(e) => setDesignPrompt(e.target.value)}
                      className="dash-input w-full h-32 p-4 rounded-xl resize-none text-white placeholder:text-white/40"
                    />
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label className="mb-2 block text-white/80">Style</Label>
                        <Select value={designStyle} onValueChange={(v: 'modern' | 'vintage' | 'minimal' | 'bold' | 'playful') => setDesignStyle(v)}>
                          <SelectTrigger className="dash-input border-white/[0.08] bg-white/[0.04] text-white">
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
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 text-white"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5 mr-2" />
                          Générer le design ({selectedToolConfig?.credits} crédits)
                        </>
                      )}
                    </Button>
                  </div>

                  {result?.output?.imageUrl && (
                    <motion
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <Label className="mb-4 block text-white/80">Résultat</Label>
                      <div className="relative rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06]">
                        <OptimizedImage
                          src={result.output.imageUrl}
                          alt="Generated design"
                          className="w-full h-auto"
                        />
                        <Button
                          size="sm"
                          className="absolute top-4 right-4 bg-[#12121a]/90 border border-white/[0.08] text-white hover:bg-white/[0.06]"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = result.output.imageUrl;
                            link.download = `luneo-design-${Date.now()}.png`;
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Télécharger
                        </Button>
                      </div>
                    </motion>
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
                      ${uploadedImage ? 'border-[#4ade80]/50 bg-[#4ade80]/5' : 'border-white/[0.08] hover:border-white/[0.12] bg-white/[0.04]'}
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
                        <Upload className="w-12 h-12 mx-auto text-white/30 mb-4" />
                        <p className="text-white/60">
                          Cliquez ou glissez une image ici
                        </p>
                        <p className="text-sm text-white/40 mt-2">
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
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Traitement en cours...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Lancer le traitement ({selectedTool === 'upscale' && upscaleScale === '4' ? 4 : selectedToolConfig?.credits} crédit{selectedToolConfig?.credits !== 1 ? 's' : ''})
                        </>
                      )}
                    </Button>
                  )}

                  {/* Color Extraction Result */}
                  {selectedTool === 'color_extraction' && extractedColors.length > 0 && (
                    <motion
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <Label className="text-white/80">Palette extraite</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {extractedColors.map((color, index) => (
                          <motion
                            key={color.hex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => copyColor(color.hex)}
                            className="dash-card p-3 rounded-xl cursor-pointer hover:bg-white/[0.06] border-white/[0.06] transition-colors"
                          >
                            <div
                              className="w-full h-16 rounded-lg mb-2"
                              style={{ backgroundColor: color.hex }}
                            />
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-white">{color.hex}</p>
                                <p className="text-xs text-white/40">{color.name}</p>
                              </div>
                              <span className="text-xs text-white/60">{color.percentage}%</span>
                            </div>
                          </motion>
                        ))}
                      </div>
                    </motion>
                  )}

                  {/* Other Results */}
                  {result?.output?.imageUrl && selectedTool !== 'color_extraction' && (
                    <motion
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-white/80">Résultat</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/[0.08] text-white hover:bg-white/[0.04]"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = result.output.imageUrl;
                            link.download = `luneo-${selectedTool}-${Date.now()}.png`;
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Télécharger
                        </Button>
                      </div>
                      <div className="relative rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06]">
                        <Image
                          src={result.output.imageUrl}
                          alt="Résultat de la génération IA"
                          width={1024}
                          height={1024}
                          className="w-full h-auto"
                          loading="lazy"
                        />
                        <div className="absolute bottom-4 left-4 flex items-center gap-2">
                          <span className="dash-badge dash-badge-new flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Terminé
                          </span>
                        </div>
                      </div>
                    </motion>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </PlanGate>
  );
}

const MemoizedAIStudioPageContent = React.memo(AIStudioPageContent);

export default function AIStudioPage() {
  return (
    <ErrorBoundary level="page" componentName="AIStudioPage">
      <MemoizedAIStudioPageContent />
    </ErrorBoundary>
  );
}
