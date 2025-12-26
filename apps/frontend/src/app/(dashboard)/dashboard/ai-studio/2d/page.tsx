'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Palette,
  Sparkles,
  Download,
  Upload,
  Wand2,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

/**
 * Générateur 2D - AI Studio
 * Création de designs 2D avec IA
 */
export default function AIStudio2DPage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState([85]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer une description',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Simuler la génération (remplacer par l'appel API réel)
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      const mockImage = `https://picsum.photos/512/512?random=${Date.now()}`;
      setGeneratedImages((prev) => [mockImage, ...prev]);
      
      toast({
        title: 'Succès',
        description: 'Design généré avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la génération',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, toast]);

  return (
    <ErrorBoundary componentName="AIStudio2D">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard/ai-studio">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Palette className="w-8 h-8 text-cyan-400" />
              Générateur 2D
            </h1>
            <p className="text-slate-400 mt-2">
              Créez des designs 2D uniques avec l'intelligence artificielle
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-cyan-400" />
                  Paramètres de génération
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configurez votre design 2D
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-white">
                    Description du design
                  </Label>
                  <Input
                    id="prompt"
                    placeholder="Ex: Logo moderne avec dégradé bleu et violet..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                {/* Style */}
                <div className="space-y-2">
                  <Label className="text-white">Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realistic">Réaliste</SelectItem>
                      <SelectItem value="cartoon">Cartoon</SelectItem>
                      <SelectItem value="minimalist">Minimaliste</SelectItem>
                      <SelectItem value="abstract">Abstrait</SelectItem>
                      <SelectItem value="vintage">Vintage</SelectItem>
                      <SelectItem value="modern">Moderne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                  <Label className="text-white">Format</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
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

                {/* Quality */}
                <div className="space-y-2">
                  <Label className="text-white">
                    Qualité: {quality[0]}%
                  </Label>
                  <Slider
                    value={quality}
                    onValueChange={setQuality}
                    min={50}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer le design
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-cyan-950/20 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-300 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Conseils
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-slate-400 space-y-2">
                  <li>• Soyez précis dans votre description</li>
                  <li>• Mentionnez les couleurs souhaitées</li>
                  <li>• Indiquez le style artistique</li>
                  <li>• Spécifiez l'ambiance recherchée</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 space-y-6">
            {generatedImages.length === 0 && !isGenerating ? (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon className="w-12 h-12 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Aucun design généré
                  </h3>
                  <p className="text-slate-400 text-center max-w-md">
                    Configurez vos paramètres et cliquez sur "Générer le design" pour créer votre premier design 2D
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isGenerating && (
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                      <p className="text-slate-400">Génération en cours...</p>
                    </CardContent>
                  </Card>
                )}
                {generatedImages.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-700 overflow-hidden">
                      <div className="relative aspect-square">
                        <Image
                          src={image}
                          alt={`Generated design ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="border-cyan-500/50 text-cyan-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Généré
                          </Badge>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Upload className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

