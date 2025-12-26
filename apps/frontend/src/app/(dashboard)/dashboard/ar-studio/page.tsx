'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  Box,
  Upload,
  Eye,
  Download,
  Trash2,
  Search,
  Grid,
  List,
  Play,
  RotateCw,
  Share2,
  Copy,
  CheckCircle,
  Smartphone,
  Package,
  Zap,
  Users,
  Database,
  Plug,
  ArrowRight,
} from 'lucide-react';
import { logger } from '@/lib/logger';

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

/**
 * AR Studio - Page Principale
 * Hub central pour toutes les fonctionnalités AR
 */
export default function ARStudioPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [models, setModels] = useState<ARModel[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    views: 0,
    tryOns: 0,
  });

  const modelTypes = [
    { value: 'all', label: 'Tous', icon: Package },
    { value: 'glasses', label: 'Lunettes', icon: Eye },
    { value: 'watch', label: 'Montres', icon: Box },
    { value: 'jewelry', label: 'Bijoux', icon: Zap },
    { value: 'shoes', label: 'Chaussures', icon: Box },
    { value: 'furniture', label: 'Meubles', icon: Box },
  ];

  // Charger les modèles depuis l'API
  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ar-studio/models', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const apiModels = result.data?.models || result.models || [];
      
      const transformedModels: ARModel[] = apiModels.map((model: any) => ({
        id: model.id,
        name: model.name || 'Modèle sans nom',
        type: (model.category || model.type || 'other') as ARModel['type'],
        thumbnail: model.thumbnailUrl || model.thumbnail_url || '/placeholder-model.jpg',
        fileSize: model.fileSize ? `${(model.fileSize / 1024 / 1024).toFixed(1)} MB` : '0 MB',
        format: (model.usdzUrl || model.usdz_url) ? 'Both' : 'GLB',
        status: (model.status || 'active') as ARModel['status'],
        views: model.viewsCount || model.views_count || 0,
        tryOns: model.tryOnsCount || model.try_ons_count || 0,
        createdAt: model.createdAt || model.created_at || new Date().toISOString(),
      }));

      setModels(transformedModels);
      
      // Calculer les statistiques
      setStats({
        total: transformedModels.length,
        active: transformedModels.filter(m => m.status === 'active').length,
        views: transformedModels.reduce((sum, m) => sum + m.views, 0),
        tryOns: transformedModels.reduce((sum, m) => sum + m.tryOns, 0),
      });
    } catch (error) {
      logger.error('Error loading AR models', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les modèles AR',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const filteredModels = useMemo(() => {
    return models.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || model.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [models, searchTerm, filterType]);

  const quickActions = [
    {
      title: 'Prévisualisation AR',
      description: 'Tester vos modèles en AR',
      href: '/dashboard/ar-studio/preview',
      icon: Eye,
      color: 'from-cyan-500 to-blue-500',
    },
    {
      title: 'Collaboration',
      description: 'Travaillez en équipe',
      href: '/dashboard/ar-studio/collaboration',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Bibliothèque 3D',
      description: 'Gérer vos modèles',
      href: '/dashboard/ar-studio/library',
      icon: Database,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Intégrations',
      description: 'Connecter vos stores',
      href: '/dashboard/ar-studio/integrations',
      icon: Plug,
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <ErrorBoundary componentName="ARStudio">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Box className="w-8 h-8 text-cyan-400" />
              AR Studio
            </h1>
            <p className="text-slate-400 mt-2">
              Créez et gérez vos expériences de réalité augmentée
            </p>
          </div>
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <Upload className="w-4 h-4 mr-2" />
            Importer un modèle
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total modèles</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Box className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Actifs</p>
                  <p className="text-2xl font-bold text-white">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Vues totales</p>
                  <p className="text-2xl font-bold text-white">{stats.views.toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Essayages AR</p>
                  <p className="text-2xl font-bold text-white">{stats.tryOns.toLocaleString()}</p>
                </div>
                <Smartphone className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={action.href}>
                  <Card className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-white mb-1">{action.title}</h3>
                      <p className="text-sm text-slate-400">{action.description}</p>
                      <ArrowRight className="w-4 h-4 text-cyan-400 mt-2" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un modèle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="flex gap-2">
            {modelTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.value}
                  variant={filterType === type.value ? 'default' : 'outline'}
                  onClick={() => setFilterType(type.value)}
                  className={filterType === type.value ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {type.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Models Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <RotateCw className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Chargement des modèles...</p>
            </div>
          </div>
        ) : filteredModels.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Box className="w-16 h-16 text-slate-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Aucun modèle trouvé
              </h3>
              <p className="text-slate-400 text-center mb-4">
                Importez votre premier modèle 3D pour commencer
              </p>
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Upload className="w-4 h-4 mr-2" />
                Importer un modèle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredModels.map((model, index) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-900/50 border-slate-700 overflow-hidden hover:border-cyan-500/50 transition-all group">
                  <div className="relative aspect-square bg-slate-800">
                    <img
                      src={model.thumbnail}
                      alt={model.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant={model.status === 'active' ? 'default' : 'secondary'}
                        className={model.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}
                      >
                        {model.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white mb-2 truncate">{model.name}</h3>
                    <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                      <span>{model.fileSize}</span>
                      <span>{model.format}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {model.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3" />
                          {model.tryOns}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
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
    </ErrorBoundary>
  );
}

