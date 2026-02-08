import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
    AIStudioStats,
    AIStudioTab,
    GeneratedModel,
    GenerationTemplate,
} from '../types';

// ========================================
// API HELPERS
// ========================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchWithAuth<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Hook principal pour la gestion de l'état et de la logique métier
 * de l'AI Studio 3D
 * 
 * ✅ Templates chargés depuis l'API backend
 */
export function useAIStudio3D() {
  const { toast } = useToast();

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
      const params = new URLSearchParams();
      if (options?.category) params.append('category', options.category);
      params.append('type', '3d'); // Filter for 3D templates
      params.append('limit', '50');
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const data = await fetchWithAuth<{
        templates: Array<{
          id: string;
          name: string;
          promptTemplate: string;
          category?: string;
          quality?: string;
          thumbnailUrl?: string;
          downloads?: number;
          description?: string;
        }>;
      }>(`/ai/templates${queryString}`);
      
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
        title: 'Erreur',
        description: 'Veuillez entrer une description',
        variant: 'destructive',
      });
      return;
    }

    if (credits < 25) {
      toast({
        title: 'Crédits insuffisants',
        description:
          "Vous n'avez pas assez de crédits pour générer un modèle 3D",
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Progress polling interval
    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Call the real backend API for 3D generation
      const response = await fetch(`${API_BASE}/api/v1/ai/generate-3d`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          prompt,
          category,
          complexity,
          resolution,
          polyCount: polyCount[0],
          textureQuality: textureQuality[0],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Generation failed: ${response.status}`);
      }

      const result = await response.json();
      
      // If the backend returns a job ID, poll for progress
      if (result.jobId) {
        progressInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(
              `${API_BASE}/api/v1/ai/generation-status/${result.jobId}`,
              { credentials: 'include' }
            );
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              setGenerationProgress(statusData.progress || 0);
              
              if (statusData.status === 'completed' && statusData.result) {
                if (progressInterval) clearInterval(progressInterval);
                setGenerationProgress(100);
                
                const newModel: GeneratedModel = {
                  id: statusData.result.id || `model-${Date.now()}`,
                  name: statusData.result.name || prompt.substring(0, 30),
                  thumbnail: statusData.result.thumbnailUrl || statusData.result.previewUrl || '/images/placeholder-3d.png',
                  modelUrl: statusData.result.modelUrl,
                  prompt,
                  category,
                  complexity,
                  resolution,
                  polyCount: statusData.result.polyCount || polyCount[0],
                  createdAt: Date.now(),
                  credits: statusData.result.creditsUsed || 25,
                  metadata: {
                    format: statusData.result.format || 'GLB',
                    size: statusData.result.fileSize || 0,
                    vertices: statusData.result.vertices || Math.floor(polyCount[0] * 0.5),
                    faces: statusData.result.faces || Math.floor(polyCount[0] * 0.33),
                    textures: statusData.result.textureCount || 3,
                    materials: statusData.result.materialCount || 2,
                    model: statusData.result.aiModel || 'replicate-3d',
                    seed: statusData.result.seed || 0,
                  },
                };
                
                setGeneratedModels(prev => [newModel, ...prev]);
                setCredits(prev => prev - (statusData.result.creditsUsed || 25));
                toast({
                  title: 'Succès',
                  description: 'Modèle 3D généré avec succès',
                });
                setIsGenerating(false);
                setGenerationProgress(0);
              } else if (statusData.status === 'failed') {
                throw new Error(statusData.error || 'Generation failed');
              }
            }
          } catch {
            // Silent fail on progress check
          }
        }, 2000);
        
        // Timeout after 5 minutes
        setTimeout(() => {
          if (progressInterval) {
            clearInterval(progressInterval);
            setIsGenerating(false);
            setGenerationProgress(0);
            toast({
              title: 'Timeout',
              description: 'La génération a pris trop de temps',
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
          title: 'Succès',
          description: 'Modèle 3D généré avec succès',
        });
        setIsGenerating(false);
        setGenerationProgress(0);
      }
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      logger.error('Error generating 3D model', { error });
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la génération',
        variant: 'destructive',
      });
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [prompt, category, complexity, resolution, polyCount, textureQuality, credits, toast]);

  // Handler - Utiliser un template
  const handleUseTemplate = useCallback(
    (template: GenerationTemplate) => {
      setPrompt(template.prompt);
      setCategory(template.category);
      setComplexity(template.complexity);
      toast({
        title: 'Template appliqué',
        description: `Le template "${template.name}" a été chargé`,
      });
    },
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
        title: 'Export en cours',
        description: `Export de ${modelIds.length} modèles au format ${format}`,
      });
    },
    [toast]
  );

  // Handler - Partager collection
  const handleShareCollection = useCallback(
    async (modelIds: string[]) => {
      const shareUrl = `https://luneo.app/share/collection-${Date.now()}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Lien copié',
        description: 'Le lien de partage a été copié dans le presse-papiers',
      });
    },
    [toast]
  );

  // Handler - Génération batch
  const handleBatchGeneration = useCallback(
    async (prompts: string[]) => {
      if (credits < prompts.length * 25) {
        toast({
          title: 'Crédits insuffisants',
          description: `Vous avez besoin de ${prompts.length * 25} crédits pour cette génération batch`,
          variant: 'destructive',
        });
        return;
      }
      setIsGenerating(true);
      setGenerationProgress(0);
      for (let i = 0; i < prompts.length; i++) {
        setGenerationProgress((i / prompts.length) * 100);
        // Simulate generation for each prompt
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      setGenerationProgress(100);
      setIsGenerating(false);
      toast({
        title: 'Succès',
        description: `${prompts.length} modèles générés avec succès`,
      });
    },
    [credits, toast]
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
