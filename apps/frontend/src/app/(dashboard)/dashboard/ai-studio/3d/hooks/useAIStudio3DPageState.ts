'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { AIStudioStats, AIStudioTab, GeneratedModel, GenerationTemplate } from '../types';
import { formatDate, formatRelativeTime } from '../components/utils';

// Fallback when API fails or /api/v1/ai-studio/templates is not implemented
const FALLBACK_TEMPLATES: GenerationTemplate[] = [
  {
    id: 't1',
    name: 'Montre de Luxe',
    prompt: 'Montre de luxe en or avec cadran bleu, style classique, détails précis',
    category: 'jewelry',
    complexity: 'high',
    thumbnail: '/placeholder-template.svg',
    uses: 892,
    description: 'Modèle 3D de montre haut de gamme',
  },
  {
    id: 't2',
    name: 'Chaise Design',
    prompt: 'Chaise moderne design scandinave, bois et métal, minimaliste',
    category: 'furniture',
    complexity: 'medium',
    thumbnail: '/placeholder-template.svg',
    uses: 654,
    description: 'Mobilier contemporain',
  },
  {
    id: 't3',
    name: 'Smartphone Premium',
    prompt: 'Smartphone premium avec écran courbé, finition métallique, design pur',
    category: 'electronics',
    complexity: 'high',
    thumbnail: '/placeholder-template.svg',
    uses: 432,
    description: 'Électronique moderne',
  },
  {
    id: 't4',
    name: 'Bague Solitaire',
    prompt: 'Bague solitaire diamant, or blanc, design classique élégant',
    category: 'jewelry',
    complexity: 'medium',
    thumbnail: '/placeholder-template.svg',
    uses: 321,
    description: 'Bijou précieux',
  },
];

function normalizeApiTemplate(raw: Record<string, unknown>): GenerationTemplate {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    thumbnail: String(raw.thumbnail ?? raw.thumbnailUrl ?? '/placeholder-template.svg'),
    category: String(raw.category ?? 'product'),
    prompt: String(raw.prompt ?? ''),
    complexity: String(raw.complexity ?? 'medium'),
    uses: Number(raw.uses ?? raw.useCount ?? 0),
    settings:
      raw.settings && typeof raw.settings === 'object'
        ? (raw.settings as GenerationTemplate['settings'])
        : undefined,
  };
}

export function useAIStudio3DPageState() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('product');
  const [complexity, setComplexity] = useState('medium');
  const [resolution, setResolution] = useState('high');
  const [polyCount, setPolyCount] = useState([50000]);
  const [textureQuality, setTextureQuality] = useState([85]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedModels, setGeneratedModels] = useState<GeneratedModel[]>([]);
  const [activeTab, setActiveTab] = useState<AIStudioTab>('generate');
  const [selectedModel, setSelectedModel] = useState<GeneratedModel | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterComplexity, setFilterComplexity] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [credits, setCredits] = useState(1250);
  const [enableBatch, setEnableBatch] = useState(false);
  const [batchCount, setBatchCount] = useState(3);
  const [templates, setTemplates] = useState<GenerationTemplate[]>(FALLBACK_TEMPLATES);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await endpoints.aiStudio.templates();
        const data = res as { templates?: unknown[]; data?: unknown[] };
        const list = data?.templates ?? data?.data ?? [];
        const normalized = (Array.isArray(list) ? list : []).map((t) =>
          normalizeApiTemplate(t as Record<string, unknown>)
        );
        if (normalized.length > 0 && !cancelled) setTemplates(normalized);
      } catch (error) {
        logger.error('Failed to fetch AI Studio templates', { error });
        if (!cancelled) setTemplates(FALLBACK_TEMPLATES);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo<AIStudioStats>(
    () => ({
      totalGenerations: generatedModels.length,
      totalCredits: generatedModels.reduce((sum, model) => sum + model.credits, 0),
      avgGenerationTime: 45.2,
      successRate: 97.8,
      favoriteCount: generatedModels.filter((m) => m.isFavorite).length,
      byCategory: {
        product: generatedModels.filter((m) => m.category === 'product').length,
        furniture: generatedModels.filter((m) => m.category === 'furniture').length,
        jewelry: generatedModels.filter((m) => m.category === 'jewelry').length,
        electronics: generatedModels.filter((m) => m.category === 'electronics').length,
        fashion: generatedModels.filter((m) => m.category === 'fashion').length,
      },
      avgPolyCount:
        generatedModels.length > 0
          ? Math.round(
              generatedModels.reduce((sum, m) => sum + (m.polyCount ?? 0), 0) / generatedModels.length
            )
          : 0,
    }),
    [generatedModels]
  );

  const history = useMemo(() => generatedModels.slice().reverse(), [generatedModels]);

  const filteredModels = useMemo(() => {
    return generatedModels.filter((model) => {
      const matchesSearch =
        model.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || model.category === filterCategory;
      const matchesComplexity = filterComplexity === 'all' || model.complexity === filterComplexity;
      return matchesSearch && matchesCategory && matchesComplexity;
    });
  }, [generatedModels, searchTerm, filterCategory, filterComplexity]);

  const formatRelativeTimeFn = useCallback((timestamp: number) => formatRelativeTime(timestamp, formatDate), []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez entrer une description', variant: 'destructive' });
      return;
    }
    if (credits < 25) {
      toast({
        title: 'Crédits insuffisants',
        description: "Vous n'avez pas assez de crédits pour générer un modèle 3D",
        variant: 'destructive',
      });
      return;
    }
    setIsGenerating(true);
    setGenerationProgress(0);
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 500);
    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      clearInterval(progressInterval);
      setGenerationProgress(100);
      const newModel: GeneratedModel = {
        id: `model-${Date.now()}`,
        name: prompt.substring(0, 30),
        thumbnail: `https://picsum.photos/512/512?random=${Date.now()}`,
        prompt,
        category,
        complexity,
        resolution,
        polyCount: polyCount[0],
        createdAt: Date.now(),
        credits: 25,
        metadata: {
          format: 'GLB',
          size: Math.floor(Math.random() * 5000000) + 1000000,
          vertices: Math.floor(polyCount[0] * 0.5),
          faces: Math.floor(polyCount[0] * 0.33),
          textures: 3,
          materials: 2,
          model: 'stable-diffusion-3d',
          seed: Math.floor(Math.random() * 1000000),
        },
      };
      setGeneratedModels((prev) => [newModel, ...prev]);
      setCredits((prev) => prev - 25);
      toast({ title: 'Succès', description: 'Modèle 3D généré avec succès' });
    } catch (error) {
      clearInterval(progressInterval);
      logger.error('Error generating 3D model', { error });
      toast({ title: 'Erreur', description: 'Erreur lors de la génération', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [prompt, category, complexity, resolution, polyCount, credits, toast]);

  const handleUseTemplate = useCallback(
    (template: GenerationTemplate) => {
      setPrompt(template.prompt);
      setCategory(template.category);
      setComplexity(template.complexity);
      toast({ title: 'Template appliqué', description: `Le template "${template.name}" a été chargé` });
    },
    [toast]
  );

  const handleToggleFavorite = useCallback((modelId: string) => {
    setGeneratedModels((prev) =>
      prev.map((model) => (model.id === modelId ? { ...model, isFavorite: !model.isFavorite } : model))
    );
  }, []);

  const handleViewDetails = useCallback((model: GeneratedModel) => {
    setSelectedModel(model);
    setShowDetailDialog(true);
  }, []);

  const handlePreview = useCallback((model: GeneratedModel) => {
    setSelectedModel(model);
    setShowPreviewDialog(true);
  }, []);

  const openExportDialog = useCallback(() => setShowExportDialog(true), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'g') {
          e.preventDefault();
          if (!isGenerating && prompt.trim() && credits >= 25) handleGenerate();
        }
        if (e.key === 'e') {
          e.preventDefault();
          if (selectedModel) setShowExportDialog(true);
        }
      }
      if (e.key === 'Escape') {
        setShowDetailDialog(false);
        setShowPreviewDialog(false);
        setShowExportDialog(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, prompt, credits, selectedModel, handleGenerate]);

  const generateTabProps = {
    prompt,
    setPrompt,
    category,
    setCategory,
    complexity,
    setComplexity,
    resolution,
    setResolution,
    polyCount,
    setPolyCount,
    textureQuality,
    setTextureQuality,
    showAdvanced,
    setShowAdvanced,
    isGenerating,
    generationProgress,
    credits,
    enableBatch,
    setEnableBatch,
    batchCount,
    setBatchCount,
    filteredModels,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterComplexity,
    setFilterComplexity,
    viewMode,
    setViewMode,
    setActiveTab,
    handleGenerate,
    handlePreview,
    handleToggleFavorite,
    handleViewDetails,
    openExportDialog,
    toast,
    onPreview: handlePreview,
    onToggleFavorite: handleToggleFavorite,
    onViewDetails: handleViewDetails,
    onExport: openExportDialog,
  };

  const historyTabProps = {
    history,
    filterCategory,
    setFilterCategory,
    filterComplexity,
    setFilterComplexity,
    setActiveTab,
    onPreview: handlePreview,
    onToggleFavorite: handleToggleFavorite,
    onExport: openExportDialog,
    formatRelativeTimeFn,
  };

  const templatesTabProps = { templates, onUseTemplate: handleUseTemplate };

  return {
    activeTab,
    setActiveTab,
    stats,
    credits,
    selectedModel,
    showDetailDialog,
    setShowDetailDialog,
    showExportDialog,
    setShowExportDialog,
    showPreviewDialog,
    setShowPreviewDialog,
    openExportDialog,
    toast,
    generateTabProps,
    historyTabProps,
    templatesTabProps,
  };
}
