'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { api, endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { AIStudioStats, AIStudioTab, GeneratedModel, GenerationTemplate } from '../types';
import { formatDate, formatRelativeTime } from '../components/utils';

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
  const { t } = useI18n();
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
  const [credits, setCredits] = useState(0);
  const [enableBatch, setEnableBatch] = useState(false);
  const [batchCount, setBatchCount] = useState(3);
  const [templates, setTemplates] = useState<GenerationTemplate[]>([]);

  const loadTemplates = useCallback(async () => {
    try {
      const response = await endpoints.aiStudio.templates();
      const raw = response as Record<string, unknown>;
      const list = (Array.isArray(raw) ? raw : (raw?.templates ?? raw?.data ?? [])) as unknown[];
      setTemplates(list.map((t) => normalizeApiTemplate(t as Record<string, unknown>)));
    } catch {
      setTemplates([]);
    }
  }, []);

  const loadCredits = useCallback(async () => {
    try {
      const response = await endpoints.credits.balance();
      const raw = response as Record<string, unknown>;
      setCredits((raw?.balance as number) ?? 0);
    } catch {
      setCredits(0);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadTemplates();
      if (!cancelled) await loadCredits();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadTemplates, loadCredits]);

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
      toast({ title: t('common.error'), description: t('aiStudio.enterDescription'), variant: 'destructive' });
      return;
    }
    if (credits < 25) {
      toast({
        title: t('aiStudio.insufficientCredits'),
        description: t('aiStudio.insufficientCredits3d'),
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
      const response = await api.post('/api/v1/generation', {
        prompt,
        type: '3d',
        templateId: undefined,
      });
      const raw = response as Record<string, unknown>;
      const publicId = String(raw.id ?? raw.publicId ?? '');

      let status = 'processing';
      let result: Record<string, unknown> = raw;
      while (status === 'processing' || status === 'pending') {
        await new Promise((r) => setTimeout(r, 3000));
        const statusResponse = await api.get(`/api/v1/generation/${publicId}/status`);
        result = statusResponse as Record<string, unknown>;
        status = String(result.status ?? 'failed');
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (status === 'completed') {
        const thumbnail = String(result.previewUrl ?? result.resultUrl ?? '/placeholder-design.svg');
        const newModel: GeneratedModel = {
          id: publicId,
          name: prompt.slice(0, 50),
          thumbnail,
          prompt,
          category,
          complexity,
          resolution,
          polyCount: polyCount[0],
          createdAt: Date.now(),
          credits: 25,
          metadata: (result.metadata as GeneratedModel['metadata']) ?? {},
        };
        setGeneratedModels((prev) => [newModel, ...prev]);
        await loadCredits();
        toast({ title: t('common.success'), description: t('aiStudio.model3dGenerated') });
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      clearInterval(progressInterval);
      logger.error('Error generating 3D model', { error });
      toast({ title: t('common.error'), description: t('aiStudio.generationError'), variant: 'destructive' });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [prompt, category, complexity, resolution, polyCount, credits, toast, t, loadCredits]);

  const handleUseTemplate = useCallback(
    (template: GenerationTemplate) => {
      setPrompt(template.prompt);
      setCategory(template.category);
      setComplexity(template.complexity);
      toast({ title: t('aiStudio.templateApplied'), description: t('aiStudio.templateLoaded', { name: template.name }) });
    },
    [toast, t]
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
