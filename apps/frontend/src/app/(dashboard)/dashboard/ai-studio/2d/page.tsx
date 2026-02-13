'use client';

import React, { useState, useCallback } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
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
  const { t } = useI18n();
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
        title: t('common.error'),
        description: t('aiStudio.enterDescription'),
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Calculate dimensions from aspect ratio
      const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
      const baseSize = 512;
      const width = Math.round((baseSize * widthRatio) / Math.max(widthRatio, heightRatio));
      const height = Math.round((baseSize * heightRatio) / Math.max(widthRatio, heightRatio));

      type Generate2DResponse = { data?: { imageUrl?: string; url?: string; image?: string }; imageUrl?: string; url?: string; image?: string };
      const data = await api.post<Generate2DResponse>(
        '/api/v1/ai/generate-2d',
        { prompt, style, width, height, quality: quality[0] }
      );
      const result = (data as { data?: { imageUrl?: string; url?: string; image?: string } })?.data ?? (data as { imageUrl?: string; url?: string; image?: string });
      const imageUrl = result?.imageUrl ?? result?.url ?? result?.image;

      if (!imageUrl) {
        throw new Error('No image URL returned from API');
      }

      setGeneratedImages((prev) => [imageUrl, ...prev]);
      
      toast({
        title: t('common.success'),
        description: t('aiStudio.generationSuccess'),
      });
    } catch (error) {
      logger.error('AI 2D generation failed', { error });
      const errorMessage = getErrorDisplayMessage(error);
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, toast, t]);

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
                  {t('aiStudio.back')}
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Palette className="w-8 h-8 text-purple-400" />
              {t('aiStudio.generator2d')}
            </h1>
            <p className="text-white/60 mt-2">
              {t('aiStudio.create2dDesc')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                  {t('aiStudio.generationParams')}
                </CardTitle>
                <CardDescription className="text-white/60">
                  {t('aiStudio.configure2d')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-white/80">
                    {t('aiStudio.designDescription')}
                  </Label>
                  <Input
                    id="prompt"
                    placeholder={t('aiStudio.placeholderDesc')}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="dash-input border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/40"
                  />
                </div>

                {/* Style */}
                <div className="space-y-2">
                  <Label className="text-white/80">{t('aiStudio.style')}</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="dash-input border-white/[0.08] bg-white/[0.04] text-white">
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
                  <Label className="text-white/80">{t('aiStudio.format')}</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
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

                {/* Quality */}
                <div className="space-y-2">
                  <Label className="text-white/80">
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
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('aiStudio.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('aiStudio.generateDesign')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="dash-card border-purple-500/20 bg-purple-500/5">
              <CardHeader>
                <CardTitle className="text-purple-400 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {t('aiStudio.tips')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-white/60 space-y-2">
                  <li>• {t('aiStudio.tip1')}</li>
                  <li>• {t('aiStudio.tip2')}</li>
                  <li>• {t('aiStudio.tip3')}</li>
                  <li>• {t('aiStudio.tip4')}</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 space-y-6">
            {generatedImages.length === 0 && !isGenerating ? (
              <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon className="w-12 h-12 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {t('aiStudio.noDesignGenerated')}
                  </h3>
                  <p className="text-white/60 text-center max-w-md">
                    {t('aiStudio.configureAndClick')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isGenerating && (
                  <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                      <p className="text-white/60">{t('aiStudio.generating')}</p>
                    </CardContent>
                  </Card>
                )}
                {generatedImages.map((image, index) => (
                  <motion
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="dash-card border-white/[0.06] bg-white/[0.03] overflow-hidden">
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
                          <span className="dash-badge dash-badge-new flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {t('aiStudio.generated')}
                          </span>
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
                  </motion>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

