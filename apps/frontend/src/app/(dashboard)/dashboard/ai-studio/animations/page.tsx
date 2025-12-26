'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Video,
  Sparkles,
  Download,
  Play,
  Wand2,
  Loader2,
  CheckCircle,
  ArrowLeft,
  Film,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Animations - AI Studio
 * Génération d'animations avec IA
 */
export default function AIStudioAnimationsPage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('5');
  const [style, setStyle] = useState('smooth');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAnimations, setGeneratedAnimations] = useState<Array<{ id: string; name: string; thumbnail: string }>>([]);

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
      await new Promise((resolve) => setTimeout(resolve, 5000));
      
      const newAnimation = {
        id: Date.now().toString(),
        name: prompt.substring(0, 30),
        thumbnail: `https://picsum.photos/400/300?random=${Date.now()}`,
      };
      setGeneratedAnimations((prev) => [newAnimation, ...prev]);
      
      toast({
        title: 'Succès',
        description: 'Animation générée avec succès',
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
    <ErrorBoundary componentName="AIStudioAnimations">
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
              <Film className="w-8 h-8 text-cyan-400" />
              Animations
            </h1>
            <p className="text-slate-400 mt-2">
              Créez des animations fluides et professionnelles avec l'IA
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
                  Paramètres d'animation
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configurez votre animation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-white">
                    Description de l'animation
                  </Label>
                  <Input
                    id="prompt"
                    placeholder="Ex: Logo qui apparaît avec un effet de zoom..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label className="text-white">Durée (secondes)</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 secondes</SelectItem>
                      <SelectItem value="5">5 secondes</SelectItem>
                      <SelectItem value="10">10 secondes</SelectItem>
                      <SelectItem value="15">15 secondes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Style */}
                <div className="space-y-2">
                  <Label className="text-white">Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smooth">Fluide</SelectItem>
                      <SelectItem value="bounce">Rebond</SelectItem>
                      <SelectItem value="fade">Fondu</SelectItem>
                      <SelectItem value="slide">Glissement</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                    </SelectContent>
                  </Select>
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
                      Générer l'animation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 space-y-6">
            {generatedAnimations.length === 0 && !isGenerating ? (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-4">
                    <Video className="w-12 h-12 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Aucune animation générée
                  </h3>
                  <p className="text-slate-400 text-center max-w-md">
                    Configurez vos paramètres et cliquez sur "Générer l'animation" pour créer votre première animation
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
                {generatedAnimations.map((animation, index) => (
                  <motion.div
                    key={animation.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-700 overflow-hidden">
                      <div className="relative aspect-video bg-slate-800">
                        <img
                          src={animation.thumbnail}
                          alt={animation.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Button variant="ghost" size="lg" className="rounded-full">
                            <Play className="w-8 h-8 text-white" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-white mb-2 truncate">{animation.name}</h3>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="border-cyan-500/50 text-cyan-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Prêt
                          </Badge>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
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

