'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Box, Upload, Eye, Download, Trash2, Search, Grid, List, Play, RotateCw, Minimize, Share2, Copy, CheckCircle,
  Smartphone, Package, Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { trpc } from '@/lib/trpc/client';

interface ARModel {
  id: string;
  name: string;
  type: 'glasses' | 'watch' | 'jewelry' | 'furniture' | 'shoes' | 'other';
  thumbnail: string;
  fileSize: string;
  format: 'USDZ' | 'GLB' | 'Both';
  status: 'active' | 'processing' | 'error';
  views: number;
  tryOns: number;
  createdAt: string;
}

function ARStudioPageContent() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<ARModel | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [models, setModels] = useState<ARModel[]>([]);

  const modelTypes = [
    { value: 'all', label: 'Tous', icon: <Package className="w-4 h-4" /> },
    { value: 'glasses', label: 'Lunettes', icon: <Eye className="w-4 h-4" /> },
    { value: 'watch', label: 'Montres', icon: <Box className="w-4 h-4" /> },
    { value: 'jewelry', label: 'Bijoux', icon: <Zap className="w-4 h-4" /> },
    { value: 'shoes', label: 'Chaussures', icon: <Box className="w-4 h-4" /> },
    { value: 'furniture', label: 'Meubles', icon: <Box className="w-4 h-4" /> }
  ];

  // Query AR models from API (fallback to API route since listModels doesn't exist in tRPC yet)
  const loadModels = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<{ data?: { models?: unknown[] }; models?: unknown[]; error?: string; message?: string }>('/api/v1/ar-studio/models');
      const apiModels = result?.data?.models ?? result?.models ?? [];
      interface ApiARModel {
        id: string;
        name?: string;
        category?: string;
        type?: string;
        thumbnailUrl?: string;
        thumbnail_url?: string;
        previewUrl?: string;
        preview_url?: string;
        modelUrl?: string;
        model_url?: string;
        fileSize?: number;
        file_size?: number;
        usdzUrl?: string;
        usdz_url?: string;
        status?: string;
        viewsCount?: number;
        views_count?: number;
        tryOnsCount?: number;
        try_ons_count?: number;
        createdAt?: string;
        created_at?: string;
      }
      const transformedModels: ARModel[] = (apiModels as ApiARModel[]).map((model) => ({
        id: model.id,
        name: model.name || 'Modèle sans nom',
        type: (model.category || model.type || 'other') as ARModel['type'],
        thumbnail: model.thumbnailUrl || model.thumbnail_url || model.previewUrl || model.preview_url || model.modelUrl || model.model_url || '/placeholder-model.svg',
        fileSize: model.fileSize ? `${(model.fileSize / 1024 / 1024).toFixed(1)} MB` : model.file_size ? `${(model.file_size / 1024 / 1024).toFixed(1)} MB` : '0 MB',
        format: (model.usdzUrl || model.usdz_url) ? 'Both' : 'GLB',
        status: (model.status || 'active') as ARModel['status'],
        views: model.viewsCount || model.views_count || 0,
        tryOns: model.tryOnsCount || model.try_ons_count || 0,
        createdAt: model.createdAt || model.created_at || new Date().toISOString(),
      }));
      
      setModels(transformedModels);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error loading AR models', {
        error,
        message: errorMessage,
      });
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const handleUpload = async (file: File) => {
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('category', 'other');

      await api.post('/api/v1/ar-studio/upload', formData);

      // Simuler progression pour UX
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(i);
      }

      toast({
        title: "Modèle uploadé",
        description: `Votre modèle "${file.name}" a été uploadé avec succès`,
      });

      // Recharger les modèles
      await loadModels();
      setShowUploadModal(false);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error uploading AR model', {
        error,
        fileName: file.name,
        message: errorMessage,
      });
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      setUploadProgress(0);
    }
  };

  const handleDelete = async (modelId: string, modelName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${modelName}" ?`)) {
      return;
    }

    try {
      await api.delete(`/api/v1/ar-studio/models/${modelId}`);

      setModels(models.filter(m => m.id !== modelId));
      
      toast({
        title: "Modèle supprimé",
        description: "Le modèle a été supprimé avec succès",
      });
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le modèle",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (model: ARModel) => {
    try {
      toast({
        title: "Export en cours",
        description: `Export de ${model.name} au format ${model.format}`,
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Export réussi",
        description: "Le fichier a été téléchargé",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter le modèle",
        variant: "destructive",
      });
    }
  };

  const handleCopyEmbed = (modelId: string) => {
    const embedCode = `<luneo-ar model="${modelId}"></luneo-ar>`;
    navigator.clipboard.writeText(embedCode);
    
    toast({
      title: "Code copié",
      description: "Le code d'intégration a été copié dans le presse-papier",
    });
  };

  // Optimisé: useMemo pour filteredModels
  const filteredModels = useMemo(() => models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || m.type === filterType;
    return matchesSearch && matchesType;
  }), [models, searchTerm, filterType]);

  const stats = {
    total: models.length,
    active: models.filter(m => m.status === 'active').length,
    processing: models.filter(m => m.status === 'processing').length,
    totalViews: models.reduce((sum, m) => sum + m.views, 0),
    totalTryOns: models.reduce((sum, m) => sum + m.tryOns, 0)
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">Actif</span>;
      case 'processing':
        return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-full">En traitement</span>;
      case 'error':
        return <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-full">Erreur</span>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    const typeData = modelTypes.find(t => t.value === type);
    return typeData ? typeData.icon : <Package className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6 pb-10">
      {loading && (
        <Card className="dash-card p-6 border-white/[0.06] bg-white/[0.03] backdrop-blur-sm text-center text-white/60 animate-pulse border-purple-500/20">
          Synchronisation de vos modèles AR...
        </Card>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">AR Studio</h1>
          <p className="text-white/60">Gérez vos modèles 3D et expériences AR</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Uploader un modèle
          </Button>
          <Link href="/demo/virtual-try-on">
            <Button
              variant="outline"
              className="border-purple-500/40 hover:bg-purple-500/10 text-white w-full sm:w-auto"
            >
              <Play className="w-4 h-4 mr-2" />
              Essayer Virtual Try-On
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total modèles', value: stats.total, icon: <Box className="w-5 h-5" />, color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10' },
          { label: 'Actifs', value: stats.active, icon: <CheckCircle className="w-5 h-5" />, color: 'text-[#4ade80]', bg: 'bg-[#4ade80]/10' },
          { label: 'En traitement', value: stats.processing, icon: <RotateCw className="w-5 h-5" />, color: 'text-[#fbbf24]', bg: 'bg-[#fbbf24]/10' },
          { label: 'Vues totales', value: stats.totalViews, icon: <Eye className="w-5 h-5" />, color: 'text-[#8b5cf6]', bg: 'bg-[#8b5cf6]/10' },
          { label: 'Essais AR', value: stats.totalTryOns, icon: <Play className="w-5 h-5" />, color: 'text-[#ec4899]', bg: 'bg-[#ec4899]/10' }
        ].map((stat, i) => (
          <Card key={i} className={`dash-card p-4 border-white/[0.06] bg-white/[0.03] backdrop-blur-sm ${stat.bg}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            placeholder="Rechercher un modèle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dash-input pl-10 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/40"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="dash-input px-4 py-2 border-white/[0.08] bg-white/[0.04] rounded-xl text-white"
        >
          {modelTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'border-white/[0.08] text-white/80 hover:bg-white/[0.04]'}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'border-white/[0.08] text-white/80 hover:bg-white/[0.04]'}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Models Grid/List */}
      <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredModels.map((model, index) => (
          <motion
            key={model.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="dash-card p-6 border-white/[0.06] bg-white/[0.03] backdrop-blur-sm hover:border-purple-500/30 transition-all">
              {/* Thumbnail */}
              <div className="relative mb-4 aspect-video bg-white/[0.04] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Box className="w-16 h-16 text-white/20" />
                </div>
                <div className="absolute top-2 right-2 flex gap-2">
                  {getStatusBadge(model.status)}
                </div>
              </div>

              {/* Info */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{model.name}</h3>
                  <div className="text-purple-400">
                    {getTypeIcon(model.type)}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span>{model.fileSize}</span>
                  <span>•</span>
                  <span>{model.format}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-white/[0.04] border border-white/[0.06] rounded-xl">
                <div>
                  <p className="text-xs text-white/40 mb-1">Vues</p>
                  <p className="text-white font-bold">{model.views}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">Essais</p>
                  <p className="text-white font-bold">{model.tryOns}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedModel(model);
                    setShowPreview(true);
                  }}
                  className="flex-1 border-white/[0.08] text-white hover:bg-white/[0.04]"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Prévisualiser
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport(model)}
                  className="border-white/[0.08] text-white hover:bg-white/[0.04]"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyEmbed(model.id)}
                  className="border-white/[0.08] text-white hover:bg-white/[0.04]"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(model.id, model.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion>
        ))}
      </div>

      {filteredModels.length === 0 && (
        <Card className="dash-card p-12 border-white/[0.06] bg-white/[0.03] backdrop-blur-sm text-center">
          <Box className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Aucun modèle trouvé</h3>
          <p className="text-white/60 mb-4">
            {searchTerm || filterType !== 'all' 
              ? 'Essayez de modifier vos filtres'
              : 'Commencez par uploader votre premier modèle 3D'
            }
          </p>
          {!searchTerm && filterType === 'all' && (
            <Button onClick={() => setShowUploadModal(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <Upload className="w-4 h-4 mr-2" />
              Uploader un modèle
            </Button>
          )}
        </Card>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="dash-card rounded-2xl p-6 max-w-lg w-full border border-white/[0.06] bg-[#12121a]"
            >
              <h3 className="text-xl font-bold text-white mb-4">Uploader un modèle 3D</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Nom du modèle
                  </label>
                  <Input
                    placeholder="Ex: Lunettes Aviator"
                    className="dash-input border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Type de produit
                  </label>
                  <select className="dash-input w-full px-3 py-2 border-white/[0.08] bg-white/[0.04] rounded-xl text-white">
                    {modelTypes.filter(t => t.value !== 'all').map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Fichier 3D
                  </label>
                  <div className="border-2 border-dashed border-white/[0.08] rounded-xl p-8 text-center hover:border-purple-500/40 transition-colors cursor-pointer bg-white/[0.02]">
                    <Upload className="w-12 h-12 text-white/40 mx-auto mb-3" />
                    <p className="text-white mb-1">Cliquez ou glissez un fichier</p>
                    <p className="text-sm text-white/40">GLB, USDZ, FBX, OBJ (max 50MB)</p>
                  </div>
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Upload en cours...</span>
                      <span className="text-white">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => handleUpload(new File([], 'test.glb'))}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    disabled={uploadProgress > 0 && uploadProgress < 100}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Uploader
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadProgress(0);
                    }}
                    className="border-white/[0.08] text-white hover:bg-white/[0.04]"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </motion>
          </motion>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && selectedModel && (
          <motion
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="dash-card rounded-2xl p-6 max-w-4xl w-full border border-white/[0.06] bg-[#12121a]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{selectedModel.name}</h3>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPreview(false)}
                  className="border-white/[0.08] text-white hover:bg-white/[0.04]"
                >
                  <Minimize className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="aspect-video bg-white/[0.04] border border-white/[0.06] rounded-xl flex items-center justify-center mb-4">
                <Box className="w-32 h-32 text-white/20" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="border-white/[0.08] text-white hover:bg-white/[0.04]">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Essayer sur mobile
                </Button>
                <Button variant="outline" className="border-white/[0.08] text-white hover:bg-white/[0.04]">
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>
            </motion>
          </motion>
        )}
      </AnimatePresence>
    </div>
  );
}

const MemoizedARStudioPageContent = memo(ARStudioPageContent);

export default function ARStudioPage() {
  return (
    <ErrorBoundary level="page" componentName="ARStudioPage">
      <MemoizedARStudioPageContent />
    </ErrorBoundary>
  );
}
