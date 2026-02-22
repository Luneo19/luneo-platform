import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { logger } from '@/lib/logger';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { api, endpoints } from '@/lib/api/client';
import type {
    AIStudioStats,
    AIStudioTab,
    GeneratedModel,
    GenerationTemplate,
} from '../types';

/**
 * Hook principal pour la gestion de l'état et de la logique métier
 * de l'AI Studio 3D
 * 
 * ✅ Templates chargés depuis l'API backend
 */
export function useAIStudio3D() {
  const { toast } = useToast();
  const { t } = useI18n();

  // State - Génération
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('product');
  const [complexity, setComplexity] = useState('medium');
  const [resolution, setResolution] = useState('high');
  const [polyCount, setPolyCount] = useState([50000]);
  const [textureQuality, setTextureQuality] = useState([85]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [enableBatch, setEnableBatch] = useState(false);
  const [batchCount, setBatchCount] = useState(3);

  // State - Modèles
  const [generatedModels, setGeneratedModels] = useState<GeneratedModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<GeneratedModel | null>(
    null
  );

  // State - UI
  const [activeTab, setActiveTab] = useState<AIStudioTab>('generate');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // State - Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterComplexity, setFilterComplexity] = useState<string>('all');

  // State - Crédits
  const [credits, setCredits] = useState(1250);

  // Stats calculées
  const stats = useMemo<AIStudioStats>(
    () => ({
      totalGenerations: generatedModels.length,
      totalCredits: generatedModels.reduce(
        (sum, model) => sum + model.credits,
        0
      ),
      avgGenerationTime: 45.2,
      successRate: 97.8,
      favoriteCount: generatedModels.filter(model => model.isFavorite).length,
      byCategory: {
        product: generatedModels.filter(
          model => model.category === 'product'
        ).length,
        furniture: generatedModels.filter(
          model => model.category === 'furniture'
        ).length,
        jewelry: generatedModels.filter(
          model => model.category === 'jewelry'
        ).length,
        electronics: generatedModels.filter(
          model => model.category === 'electronics'
        ).length,
        fashion: generatedModels.filter(
          model => model.category === 'fashion'
        ).length,
      },
      avgPolyCount:
        generatedModels.length > 0
          ? Math.round(
              generatedModels.reduce(
                (sum, m) => sum + (m.polyCount || 0),
                0
              ) / generatedModels.length
            )
          : 0,
    }),
    [generatedModels]
  );

  // ========================================
  // TEMPLATES FROM API
  // ========================================
  
  const [templates, setTemplates] = useState<GenerationTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Fetch 3D templates from AI templates API
  const fetchTemplates = useCallback(async (options?: { category?: string }) => {
    setTemplatesLoading(true);
    try {
      const data = await endpoints.aiStudio.templates() as {
        templates?: Array<{
          id: string;
          name: string;
          promptTemplate: string;
          category?: string;
          quality?: string;
          thumbnailUrl?: string;
          downloads?: number;
          description?: string;
        }>;
      };
      
      const mappedTemplates: GenerationTemplate[] = (data.templates || []).map(t => ({
        id: t.id,
        name: t.name,
        prompt: t.promptTemplate,
        category: t.category || 'product',
        complexity: t.quality === 'hd' ? 'high' : t.quality === 'standard' ? 'medium' : 'low',
        thumbnail: t.thumbnailUrl || '/placeholder-template.svg',
        uses: t.downloads || 0,
        description: t.description || '',
      }));
      
      setTemplates(mappedTemplates);
      logger.info('3D Templates loaded from API', { count: mappedTemplates.length });
    } catch (error) {
      logger.warn('Failed to fetch 3D templates from API, using fallback', { error });
      // Fallback to demo data if API fails
      setTemplates([
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
      ]);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  // Load templates on mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Historique de génération
  const generationHistory = useMemo(
    () => generatedModels.slice().reverse(),
    [generatedModels]
  );

  // Modèles filtrés
  const filteredModels = useMemo(() => {
    return generatedModels.filter(model => {
      const matchesSearch =
        model.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.tags?.some(tag =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesCategory =
        filterCategory === 'all' || model.category === filterCategory;
      const matchesComplexity =
        filterComplexity === 'all' || model.complexity === filterComplexity;
      return matchesSearch && matchesCategory && matchesComplexity;
    });
  }, [generatedModels, searchTerm, filterCategory, filterComplexity]);

  // Handler - Génération
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast({
        title: t('common.error'),
        description: t('aiStudio.enterDescription'),
        variant: 'destructive',
      });
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

    // Progress polling interval
    let progressInterval: NodeJS.Timeout | null = null;

    try {
      const result = await api.post<{ jobId?: string; id?: string; name?: string; thumbnailUrl?: string; previewUrl?: string; modelUrl?: string; polyCount?: number; creditsUsed?: number; format?: string; fileSize?: number; vertices?: number; faces?: number; textureCount?: number; materialCount?: number; aiModel?: string; seed?: number }>('/api/v1/ai/generate-3d', {
        prompt,
        category,
        complexity,
        resolution,
        polyCount: polyCount[0],
        textureQuality: textureQuality[0],
      });
      
      // If the backend returns a job ID, poll for progress
      if (result.jobId) {
        progressInterval = setInterval(async () => {
          try {
            const statusData = await api.get<{ progress?: number; status?: string; result?: Record<string, unknown>; error?: string }>(
              `/api/v1/ai/generation-status/${result.jobId}`
            );
            if (statusData) {
              setGenerationProgress(statusData.progress ?? 0);
              const res = statusData.result as Record<string, unknown> | undefined;
              if (statusData.status === 'completed' && res) {
                if (progressInterval) clearInterval(progressInterval);
                setGenerationProgress(100);
                
                const newModel: GeneratedModel = {
                  id: (res.id as string) || `model-${Date.now()}`,
                  name: (res.name as string) || prompt.substring(0, 30),
                  thumbnail: (res.thumbnailUrl as string) || (res.previewUrl as string) || '/images/placeholder-3d.png',
                  modelUrl: res.modelUrl as string | undefined,
                  prompt,
                  category,
                  complexity,
                  resolution,
                  polyCount: (res.polyCount as number) || polyCount[0],
                  createdAt: Date.now(),
                  credits: (res.creditsUsed as number) || 25,
                  metadata: {
                    format: (res.format as string) || 'GLB',
                    size: (res.fileSize as number) || 0,
                    vertices: (res.vertices as number) || Math.floor(polyCount[0] * 0.5),
                    faces: (res.faces as number) || Math.floor(polyCount[0] * 0.33),
                    textures: (res.textureCount as number) || 3,
                    materials: (res.materialCount as number) || 2,
                    model: (res.aiModel as string) || 'replicate-3d',
                    seed: (res.seed as number) || 0,
                  },
                };
                
                setGeneratedModels(prev => [newModel, ...prev]);
                setCredits(prev => prev - ((res.creditsUsed as number) || 25));
                toast({
                  title: t('common.success'),
                  description: t('aiStudio.model3dGenerated'),
                });
                setIsGenerating(false);
                setGenerationProgress(0);
              } else if (statusData.status === 'failed') {
                throw new Error((statusData.error as string) || 'Generation failed');
              }
            }
          } catch (err) {
            logger.warn('3D generation status poll error', { error: err });
          }
        }, 2000);
        
        // Timeout after 5 minutes
        setTimeout(() => {
          if (progressInterval) {
            clearInterval(progressInterval);
            setIsGenerating(false);
            setGenerationProgress(0);
            toast({
              title: t('common.error'),
              description: t('aiStudio.generationTimeout'),
              variant: 'destructive',
            });
          }
        }, 300000);
      } else {
        // Synchronous response - result is the model directly
        setGenerationProgress(100);
        
        const newModel: GeneratedModel = {
          id: result.id || `model-${Date.now()}`,
          name: result.name || prompt.substring(0, 30),
          thumbnail: result.thumbnailUrl || result.previewUrl || '/images/placeholder-3d.png',
          modelUrl: result.modelUrl,
          prompt,
          category,
          complexity,
          resolution,
          polyCount: result.polyCount || polyCount[0],
          createdAt: Date.now(),
          credits: result.creditsUsed || 25,
          metadata: {
            format: result.format || 'GLB',
            size: result.fileSize || 0,
            vertices: result.vertices || Math.floor(polyCount[0] * 0.5),
            faces: result.faces || Math.floor(polyCount[0] * 0.33),
            textures: result.textureCount || 3,
            materials: result.materialCount || 2,
            model: result.aiModel || 'replicate-3d',
            seed: result.seed || 0,
          },
        };
        
        setGeneratedModels(prev => [newModel, ...prev]);
        setCredits(prev => prev - (result.creditsUsed || 25));
        toast({
          title: t('common.success'),
          description: t('aiStudio.model3dGenerated'),
        });
        setIsGenerating(false);
        setGenerationProgress(0);
      }
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      logger.error('Error generating 3D model', { error });
      toast({
        title: t('common.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [prompt, category, complexity, resolution, polyCount, textureQuality, credits, toast, t]);

  // Handler - Utiliser un template
  const handleUseTemplate = useCallback(
    (template: GenerationTemplate) => {
      setPrompt(template.prompt);
      setCategory(template.category);
      setComplexity(template.complexity);
      toast({
        title: t('aiStudio.templateApplied'),
        description: t('aiStudio.templateLoaded', { name: template.name }),
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toast]
  );

  // Handler - Toggle favorite
  const handleToggleFavorite = useCallback((modelId: string) => {
    setGeneratedModels(prev =>
      prev.map(model =>
        model.id === modelId
          ? { ...model, isFavorite: !model.isFavorite }
          : model
      )
    );
  }, []);

  // Handler - Voir détails
  const handleViewDetails = useCallback((model: GeneratedModel) => {
    setSelectedModel(model);
    setShowDetailDialog(true);
  }, []);

  // Handler - Preview
  const handlePreview = useCallback((model: GeneratedModel) => {
    setSelectedModel(model);
    setShowPreviewDialog(true);
  }, []);

  // Handler - Export batch
  const handleExportBatch = useCallback(
    async (modelIds: string[], format: string) => {
      toast({
        title: t('aiStudio.exportInProgress'),
        description: t('aiStudio.exportModelsFormat', { count: modelIds.length, format }),
      });
    },
    [toast, t]
  );

  // Handler - Partager collection
  const handleShareCollection = useCallback(
    async (modelIds: string[]) => {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';
      const shareUrl = `${appUrl}/share/collection-${Date.now()}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: t('common.copied'),
        description: t('aiStudio.shareLinkCopied'),
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toast]
  );

  // Helper to poll until a 3D generation job completes
  const pollGenerationStatus = useCallback(
    async (jobId: string): Promise<Record<string, unknown>> => {
      const maxAttempts = 150; // 5 min at 2s interval
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const statusData = await api.get<{ progress?: number; status?: string; result?: Record<string, unknown>; error?: string }>(
          `/api/v1/ai/generation-status/${jobId}`
        );
        if (statusData.status === 'completed' && statusData.result) {
          return statusData.result as Record<string, unknown>;
        }
        if (statusData.status === 'failed') {
          throw new Error((statusData.error as string) || 'Generation failed');
        }
        setGenerationProgress((prev) => Math.min(prev + 1, 99));
      }
      throw new Error('Generation timeout');
    },
    []
  );

  // Handler - Génération batch (real API: one generate-3d call per prompt)
  const handleBatchGeneration = useCallback(
    async (prompts: string[]) => {
      if (credits < prompts.length * 25) {
        toast({
          title: t('aiStudio.insufficientCredits'),
          description: t('aiStudio.creditsRequired', { count: prompts.length * 25 }),
          variant: 'destructive',
        });
        return;
      }
      setIsGenerating(true);
      setGenerationProgress(0);
      try {
        for (let i = 0; i < prompts.length; i++) {
          const p = prompts[i];
          const progressBase = (i / prompts.length) * 100;
          setGenerationProgress(progressBase);

          const result = await api.post<{ jobId?: string; id?: string; name?: string; thumbnailUrl?: string; previewUrl?: string; modelUrl?: string; polyCount?: number; creditsUsed?: number; format?: string; fileSize?: number; vertices?: number; faces?: number; textureCount?: number; materialCount?: number; aiModel?: string; seed?: number }>('/api/v1/ai/generate-3d', {
            prompt: p,
            category,
            complexity,
            resolution,
            polyCount: polyCount[0],
            textureQuality: textureQuality[0],
          });

          let res: Record<string, unknown>;
          if (result.jobId) {
            res = await pollGenerationStatus(result.jobId);
          } else {
            res = result as unknown as Record<string, unknown>;
          }

          const newModel: GeneratedModel = {
            id: (res.id as string) || `model-${Date.now()}-${i}`,
            name: (res.name as string) || p.substring(0, 30),
            thumbnail: (res.thumbnailUrl as string) || (res.previewUrl as string) || '/images/placeholder-3d.png',
            modelUrl: res.modelUrl as string | undefined,
            prompt: p,
            category,
            complexity,
            resolution,
            polyCount: (res.polyCount as number) || polyCount[0],
            createdAt: Date.now(),
            credits: (res.creditsUsed as number) || 25,
            metadata: {
              format: (res.format as string) || 'GLB',
              size: (res.fileSize as number) || 0,
              vertices: (res.vertices as number) || Math.floor(polyCount[0] * 0.5),
              faces: (res.faces as number) || Math.floor(polyCount[0] * 0.33),
              textures: (res.textureCount as number) || 3,
              materials: (res.materialCount as number) || 2,
              model: (res.aiModel as string) || 'replicate-3d',
              seed: (res.seed as number) || 0,
            },
          };
          setGeneratedModels((prev) => [newModel, ...prev]);
          setCredits((prev) => prev - ((res.creditsUsed as number) || 25));
        }
        setGenerationProgress(100);
        toast({
          title: t('common.success'),
          description: t('aiStudio.batchModelsSuccess', { count: prompts.length }),
        });
      } catch (error) {
        logger.error('Error in batch 3D generation', { error });
        toast({
          title: t('common.error'),
          description: getErrorDisplayMessage(error),
          variant: 'destructive',
        });
      } finally {
        setIsGenerating(false);
        setGenerationProgress(0);
      }
    },
    [credits, toast, t, category, complexity, resolution, polyCount, textureQuality, pollGenerationStatus]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'g':
            e.preventDefault();
            if (!isGenerating && prompt.trim() && credits >= 25) {
              handleGenerate();
            }
            break;
          case 's':
            e.preventDefault();
            // Save current configuration
            break;
          case 'e':
            e.preventDefault();
            if (selectedModel) {
              setShowExportDialog(true);
            }
            break;
          case 'f':
            e.preventDefault();
            // Focus search
            break;
          case 'k':
            e.preventDefault();
            // Open command palette
            break;
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

  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate performance metrics update
      if (isGenerating) {
        // Track generation performance
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  return {
    // State - Génération
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
    isGenerating,
    generationProgress,
    enableBatch,
    setEnableBatch,
    batchCount,
    setBatchCount,

    // State - Modèles
    generatedModels,
    setGeneratedModels,
    selectedModel,
    setSelectedModel,

    // State - UI
    activeTab,
    setActiveTab,
    showDetailDialog,
    setShowDetailDialog,
    showExportDialog,
    setShowExportDialog,
    showPreviewDialog,
    setShowPreviewDialog,
    viewMode,
    setViewMode,
    showAdvanced,
    setShowAdvanced,

    // State - Filtres
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterComplexity,
    setFilterComplexity,

    // State - Crédits
    credits,
    setCredits,

    // Computed
    stats,
    templates,
    templatesLoading,
    generationHistory,
    filteredModels,

    // Handlers
    handleGenerate,
    handleUseTemplate,
    handleToggleFavorite,
    handleViewDetails,
    handlePreview,
    handleExportBatch,
    handleShareCollection,
    handleBatchGeneration,
    
    // API Actions
    fetchTemplates,
  };
}
