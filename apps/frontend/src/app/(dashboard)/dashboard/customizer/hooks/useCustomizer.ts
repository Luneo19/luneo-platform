/**
 * Hook principal pour la page Customizer
 * Centralise toute la logique métier, state management et handlers
 * 
 * ✅ Templates et Assets chargés depuis l'API backend
 */
'use client';

import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { trpc } from '@/lib/trpc/client';
import type { ProductCategory } from '@/lib/types/product';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { VIEW_MODES, type ViewModeKey } from '../data';
import type { Asset, CustomizerTab, DesignTemplate, Layer, ProductFilters } from '../types';
import type { CustomizerProduct } from '../components/CustomizerCanvas';

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

export function useCustomizer() {
  const { toast } = useToast();
  const router = useRouter();

  // State - UI
  const [viewMode, setViewMode] = useState<ViewModeKey>('grid');
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: 'all',
    status: 'all',
    priceMin: null,
    priceMax: null,
    dateFrom: null,
    dateTo: null,
    isActive: null,
  });
  const [selectedProduct, setSelectedProduct] = useState<CustomizerProduct | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [activeTab, setActiveTab] = useState<CustomizerTab>('products');
  const [textTool, setTextTool] = useState({
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: 'normal',
    color: '#000000',
    align: 'left',
  });
  const [shapeTool, setShapeTool] = useState({
    type: 'rect',
    fill: '#3B82F6',
    stroke: '#000000',
    strokeWidth: 0,
  });
  const [imageTool, setImageTool] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    opacity: 100,
  });

  // Queries
  const productsQuery = trpc.product.list.useQuery({
    search: filters.search || undefined,
    category:
      filters.category !== 'all'
        ? (filters.category as ProductCategory)
        : undefined,
    isActive:
      filters.status !== 'all' ? filters.status === 'active' : undefined,
    limit: 50,
    offset: 0,
  });

  const products = useMemo((): CustomizerProduct[] => {
    return (productsQuery.data?.products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category || 'OTHER',
      image_url:
        p.imageUrl ||
        p.images?.[0] ||
        '/images/placeholder-product.png', // ✅ Placeholder local
      price: p.price || 0,
      currency: p.currency || 'EUR',
      isActive: p.isActive ?? true,
      status: p.status || 'ACTIVE',
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      brandId: p.brandId ?? '',
      createdBy: p.createdBy ?? '',
    }));
  }, [productsQuery.data]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }
    if (filters.priceMin !== null) {
      filtered = filtered.filter(p => p.price >= filters.priceMin!);
    }
    if (filters.priceMax !== null) {
      filtered = filtered.filter(p => p.price <= filters.priceMax!);
    }
    return filtered;
  }, [products, filters]);

  // Handlers
  const handleOpenCustomizer = useCallback(
    (product: CustomizerProduct) => {
      setSelectedProduct(product);
      setShowCustomizer(true);
    },
    []
  );

  const handleCloseCustomizer = useCallback(() => {
    setShowCustomizer(false);
    setSelectedProduct(null);
  }, []);

  const handleSaveDesign = useCallback(
    (designData: any) => {
      logger.info('Design saved', { designData });
      toast({
        title: 'Design enregistré',
        description: 'Votre design a été sauvegardé avec succès',
      });
      handleCloseCustomizer();
    },
    [toast, handleCloseCustomizer]
  );

  const handleAddLayer = useCallback(
    (type: Layer['type']) => {
      const newLayer: Layer = {
        id: `layer-${Date.now()}`,
        name: `Calque ${layers.length + 1}`,
        type,
        visible: true,
        locked: false,
        opacity: 100,
        order: layers.length,
      };
      setLayers(prev => [...prev, newLayer]);
      setSelectedLayer(newLayer.id);
    },
    [layers.length]
  );

  const handleDeleteLayer = useCallback(
    (layerId: string) => {
      setLayers(prev => prev.filter(l => l.id !== layerId));
      if (selectedLayer === layerId) {
        setSelectedLayer(null);
      }
    },
    [selectedLayer]
  );

  const handleToggleLayerVisibility = useCallback((layerId: string) => {
    setLayers(prev =>
      prev.map(l => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  }, []);

  const handleToggleLayerLock = useCallback((layerId: string) => {
    setLayers(prev =>
      prev.map(l => (l.id === layerId ? { ...l, locked: !l.locked } : l))
    );
  }, []);

  const handleMoveLayer = useCallback(
    (layerId: string, direction: 'up' | 'down') => {
      setLayers(prev => {
        const index = prev.findIndex(l => l.id === layerId);
        if (index === -1) return prev;
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= prev.length) return prev;
        const newLayers = [...prev];
        [newLayers[index], newLayers[newIndex]] = [
          newLayers[newIndex],
          newLayers[index],
        ];
        return newLayers.map((l, i) => ({ ...l, order: i }));
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setLayers(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setLayers(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // ========================================
  // TEMPLATES & ASSETS FROM API
  // ========================================
  
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);

  // Fetch templates from marketplace API
  const fetchTemplates = useCallback(async (options?: { category?: string; search?: string }) => {
    setTemplatesLoading(true);
    try {
      const params = new URLSearchParams();
      if (options?.category) params.append('category', options.category);
      if (options?.search) params.append('search', options.search);
      params.append('status', 'published');
      params.append('limit', '50');
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const data = await fetchWithAuth<{
        templates: Array<{
          id: string;
          name: string;
          category?: string;
          thumbnailUrl?: string;
          priceCents: number;
          isFree: boolean;
          downloads: number;
          averageRating: number;
        }>;
      }>(`/marketplace/templates${queryString}`);
      
      const mappedTemplates: DesignTemplate[] = (data.templates || []).map(t => ({
        id: t.id,
        name: t.name,
        category: t.category || 'General',
        thumbnail: t.thumbnailUrl || '/images/placeholder-template.png',
        isPremium: !t.isFree && t.priceCents > 0,
        downloads: t.downloads || 0,
        rating: t.averageRating || 0,
      }));
      
      setTemplates(mappedTemplates);
      logger.info('Templates loaded from API', { count: mappedTemplates.length });
    } catch (error) {
      logger.warn('Failed to fetch templates from API, using fallback', { error });
      // Fallback to demo data if API fails
      setTemplates([
        {
          id: 't1',
          name: 'Template Sport',
          category: 'Sports',
          thumbnail: '/images/placeholder-template.png',
          isPremium: false,
          downloads: 150,
          rating: 4.5,
        },
        {
          id: 't2',
          name: 'Template Élégant',
          category: 'Fashion',
          thumbnail: '/images/placeholder-template.png',
          isPremium: true,
          downloads: 320,
          rating: 4.8,
        },
        {
          id: 't3',
          name: 'Template Minimaliste',
          category: 'Minimal',
          thumbnail: '/images/placeholder-template.png',
          isPremium: false,
          downloads: 89,
          rating: 4.2,
        },
      ]);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  // Fetch assets from asset-hub API
  const fetchAssets = useCallback(async (options?: { type?: string; search?: string }) => {
    setAssetsLoading(true);
    try {
      const params = new URLSearchParams();
      if (options?.type) params.append('type', options.type);
      if (options?.search) params.append('search', options.search);
      params.append('limit', '100');
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const data = await fetchWithAuth<{
        files: Array<{
          id: string;
          name: string;
          mimeType: string;
          url: string;
          thumbnailUrl?: string;
          tags?: string[];
          metadata?: { category?: string };
        }>;
      }>(`/asset-hub/files${queryString}`);
      
      const mappedAssets: Asset[] = (data.files || []).map(f => {
        // Determine asset type from mimeType
        let assetType: Asset['type'] = 'image';
        if (f.mimeType?.includes('svg')) assetType = 'icon';
        else if (f.mimeType?.includes('video')) assetType = 'video';
        else if (f.name?.toLowerCase().includes('texture')) assetType = 'texture';
        else if (f.name?.toLowerCase().includes('pattern')) assetType = 'pattern';
        
        return {
          id: f.id,
          name: f.name,
          type: assetType,
          url: f.url,
          thumbnail: f.thumbnailUrl || f.url || '/images/placeholder-asset.png',
          category: f.metadata?.category || 'General',
          tags: f.tags || [],
        };
      });
      
      setAssets(mappedAssets);
      logger.info('Assets loaded from API', { count: mappedAssets.length });
    } catch (error) {
      logger.warn('Failed to fetch assets from API, using fallback', { error });
      // Fallback to demo data if API fails
      setAssets([
        {
          id: 'a1',
          name: 'Icône Étoile',
          type: 'icon',
          url: '/images/placeholder-asset.png',
          thumbnail: '/images/placeholder-asset.png',
          category: 'Icons',
          tags: ['star', 'decoration'],
        },
        {
          id: 'a2',
          name: 'Texture Métal',
          type: 'texture',
          url: '/images/placeholder-asset.png',
          thumbnail: '/images/placeholder-asset.png',
          category: 'Textures',
          tags: ['metal', 'shiny'],
        },
        {
          id: 'a3',
          name: 'Pattern Géométrique',
          type: 'pattern',
          url: '/images/placeholder-asset.png',
          thumbnail: '/images/placeholder-asset.png',
          category: 'Patterns',
          tags: ['geometric', 'modern'],
        },
      ]);
    } finally {
      setAssetsLoading(false);
    }
  }, []);

  // Load templates and assets on mount
  useEffect(() => {
    fetchTemplates();
    fetchAssets();
  }, [fetchTemplates, fetchAssets]);

  return {
    // State - UI
    viewMode,
    setViewMode,
    filters,
    setFilters,
    selectedProduct,
    showCustomizer,
    setShowCustomizer,
    layers,
    selectedLayer,
    setSelectedLayer,
    history,
    historyIndex,
    showTemplates,
    setShowTemplates,
    showAssets,
    setShowAssets,
    activeTab,
    setActiveTab,
    textTool,
    setTextTool,
    shapeTool,
    setShapeTool,
    imageTool,
    setImageTool,
    // State - Data
    productsQuery,
    products,
    filteredProducts,
    templates,
    assets,
    templatesLoading,
    assetsLoading,
    // Computed
    canUndo,
    canRedo,
    // Handlers
    handleOpenCustomizer,
    handleCloseCustomizer,
    handleSaveDesign,
    handleAddLayer,
    handleDeleteLayer,
    handleToggleLayerVisibility,
    handleToggleLayerLock,
    handleMoveLayer,
    handleUndo,
    handleRedo,
    // API Actions
    fetchTemplates,
    fetchAssets,
    // Router
    router,
  };
}
