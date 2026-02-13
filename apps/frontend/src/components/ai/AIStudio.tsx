'use client';

/**
 * AI Studio - Professional AI Design Generation Interface
 * Complete implementation with history, filters, and export capabilities
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import NextImage from 'next/image';
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Palette,
  Zap,
  Download,
  RefreshCw,
  Settings,
  Search,
  Filter,
  Grid3x3,
  List,
  Trash2,
  Share2,
  Eye,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { endpoints } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface GeneratedDesign {
  id: string;
  url: string;
  prompt: string;
  style?: string;
  createdAt: string;
  status?: 'completed' | 'pending' | 'failed';
  revised_prompt?: string;
}

interface AIStudioProps {
  className?: string;
  onDesignGenerated?: (design: GeneratedDesign) => void;
}

function AIStudio({ className, onDesignGenerated }: AIStudioProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024');
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedDesign[]>([]);
  const [history, setHistory] = useState<GeneratedDesign[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load design history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const data = await endpoints.designs.list({ limit: 50 }) as { designs?: Array<Record<string, unknown>> } | unknown[];
      const designsList = Array.isArray(data) ? data : (data as { designs?: unknown[] })?.designs ?? [];
      const designs: GeneratedDesign[] = (designsList as Record<string, unknown>[]).map((d) => ({
        id: String(d.id ?? ''),
        url: String(d.preview_url ?? d.original_url ?? ''),
        prompt: String(d.prompt ?? ''),
        style: (d.metadata as { style?: string } | undefined)?.style,
        createdAt: String(d.created_at ?? d.createdAt ?? ''),
        status: (d.status ?? 'completed') as 'completed' | 'pending' | 'failed',
        revised_prompt: d.revised_prompt != null ? String(d.revised_prompt) : undefined,
      }));
      setHistory(designs);
      setGeneratedImages(designs.slice(0, 12)); // Show recent 12
    } catch (error) {
      logger.error('Failed to load design history', { error });
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt requis',
        description: 'Veuillez entrer une description pour générer un design',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await endpoints.ai.generate({
        prompt: prompt.trim(),
        productId: '',
        options: { size, quality, style },
      });

      const generatedDesign = (result as { data?: { design?: Record<string, unknown> }; design?: Record<string, unknown> }).data?.design
        || (result as { design?: Record<string, unknown> }).design;
      const res = result as { data?: { imageUrl?: string; revisedPrompt?: string }; imageUrl?: string };
      const imageUrl = res.data?.imageUrl || res.imageUrl
        || (generatedDesign as { preview_url?: string })?.preview_url;

      if (imageUrl) {
        const gen = generatedDesign as Record<string, unknown> | undefined;
        const newDesign: GeneratedDesign = {
          id: (gen?.id as string) || Date.now().toString(),
          url: imageUrl,
          prompt: prompt.trim(),
          style,
          createdAt: new Date().toISOString(),
          status: 'completed',
          revised_prompt: (gen?.revised_prompt as string) || res.data?.revisedPrompt,
        };

        setGeneratedImages([newDesign, ...generatedImages]);
        setHistory([newDesign, ...history]);
        setPrompt(''); // Clear prompt after generation

        toast({
          title: 'Design généré',
          description: 'Votre design a été généré avec succès',
        });

        onDesignGenerated?.(newDesign);
      }
    } catch (error: unknown) {
      const errorMessage = getErrorDisplayMessage(error);
      logger.error('AI generation error', {
        error,
        prompt,
        style,
        message: errorMessage,
      });
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (design: GeneratedDesign) => {
    try {
      const response = await fetch(design.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `luneo-design-${design.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t('common.download'),
        description: t('aiStudio.downloadSuccess'),
      });
    } catch (error) {
      logger.error('Download error', { error, designId: design.id });
      toast({
        title: t('common.error'),
        description: t('aiStudio.downloadError'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (designId: string) => {
    try {
      await endpoints.designs.delete(designId);
      setGeneratedImages(generatedImages.filter((d) => d.id !== designId));
      setHistory(history.filter((d) => d.id !== designId));
      toast({
        title: t('common.deleted'),
        description: t('aiStudio.deleteSuccess'),
      });
    } catch (error) {
      logger.error('Delete error', { error, designId });
      toast({
        title: t('common.error'),
        description: t('aiStudio.deleteError'),
        variant: 'destructive',
      });
    }
  };

  // Optimisé: useMemo pour filteredImages
  const filteredImages = useMemo(() => {
    return generatedImages.filter((img) => {
      const matchesSearch = !searchQuery || img.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || img.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [generatedImages, searchQuery, filterStatus]);

  const styles = [
    { id: 'vivid', name: 'Vif', icon: <Zap className="w-4 h-4" />, description: 'Couleurs saturées et contrastées' },
    { id: 'natural', name: 'Naturel', icon: <ImageIcon className="w-4 h-4" />, description: 'Rendu photoréaliste' },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-400" />
            AI Studio
          </h1>
          <p className="text-gray-400">Générez des designs uniques avec l'IA (DALL-E 3)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="border-gray-600"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="bg-gray-800/50 border-gray-700">
          <TabsTrigger value="generate" className="data-[state=active]:bg-gray-700">
            <Wand2 className="w-4 h-4 mr-2" />
            Générer
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-gray-700">
            <Clock className="w-4 h-4 mr-2" />
            Historique ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Generator Card */}
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <div className="space-y-6">
              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Décrivez votre design
                </label>
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: T-shirt avec logo lion moderne, couleurs vives, style minimaliste..."
                  className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {prompt.length}/1200 caractères
                </p>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Taille
                  </label>
                  <Select value={size} onValueChange={(v) => setSize(v as typeof size)}>
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024x1024">Carré (1024×1024)</SelectItem>
                      <SelectItem value="1792x1024">Paysage (1792×1024)</SelectItem>
                      <SelectItem value="1024x1792">Portrait (1024×1792)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Qualité
                  </label>
                  <Select value={quality} onValueChange={(v) => setQuality(v as typeof quality)}>
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="hd">HD (Premium)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {styles.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id as typeof style)}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1',
                          style === s.id
                            ? 'border-blue-500 bg-blue-900/20'
                            : 'border-gray-600 bg-gray-900 hover:border-gray-500'
                        )}
                      >
                        {s.icon}
                        <span className="text-xs text-white">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Générer avec IA
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Recent Results */}
          {filteredImages.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Vos créations récentes
                </h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher..."
                      className="pl-9 w-48 bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32 bg-gray-900 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="completed">Complétés</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredImages.map((img, i) => (
                      <motion
                        key={img.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="overflow-hidden bg-gray-800/50 border-gray-700 group hover:border-blue-500/50 transition-colors">
                          <div className="aspect-square bg-gray-900 relative">
                            {img.url && (
                              <NextImage
                                src={img.url}
                                alt={img.prompt}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                loading="lazy"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleDownload(img)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleDelete(img.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="text-sm text-gray-300 mb-3 line-clamp-2">{img.prompt}</p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="border-gray-600">
                                {img.style || 'vivid'}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(img.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </motion>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredImages.map((img) => (
                    <Card
                      key={img.id}
                      className="p-4 bg-gray-800/50 border-gray-700 flex items-center gap-4"
                    >
                      <div className="w-24 h-24 bg-gray-900 rounded-lg relative flex-shrink-0">
                        {img.url && (
                          <NextImage
                            src={img.url}
                            alt={img.prompt}
                            fill
                            className="object-cover rounded-lg"
                            sizes="96px"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white mb-1 line-clamp-1">{img.prompt}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Badge variant="outline" className="border-gray-600">
                            {img.style || 'vivid'}
                          </Badge>
                          <span>{new Date(img.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleDownload(img)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(img.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {filteredImages.length === 0 && !isLoadingHistory && (
            <Card className="p-12 bg-gray-800/30 border-gray-700 border-dashed text-center">
              <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">
                {searchQuery || filterStatus !== 'all' ? 'Aucun résultat' : 'Aucun design généré'}
              </h3>
              <p className="text-sm text-gray-500">
                {searchQuery || filterStatus !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Entrez un prompt ci-dessus pour commencer'}
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {isLoadingHistory ? (
            <Card className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Chargement de l'historique...</p>
            </Card>
          ) : history.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {history.map((img) => (
                <Card
                  key={img.id}
                  className="overflow-hidden bg-gray-800/50 border-gray-700 group hover:border-blue-500/50 transition-colors"
                >
                  <div className="aspect-square bg-gray-900 relative">
                    {img.url && (
                      <NextImage
                        src={img.url}
                        alt={img.prompt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-300 mb-2 line-clamp-2">{img.prompt}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-gray-600 text-xs">
                        {img.style || 'vivid'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handleDownload(img)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 bg-gray-800/30 border-gray-700 border-dashed text-center">
              <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">Aucun historique</h3>
              <p className="text-sm text-gray-500">Vos designs générés apparaîtront ici</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const AIStudioMemo = memo(AIStudio);

export default function AIStudioWrapper(props: AIStudioProps) {
  return (
    <ErrorBoundary componentName="AIStudio">
      <AIStudioMemo {...props} />
    </ErrorBoundary>
  );
}
