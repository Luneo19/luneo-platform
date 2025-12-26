'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Search,
  Upload,
  Download,
  Eye,
  ArrowLeft,
  Filter,
  Grid,
  List,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

/**
 * Bibliothèque 3D - AR Studio
 * Gestion de la bibliothèque de modèles 3D
 */
export default function ARStudioLibraryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');

  const models = useMemo(() => [
    {
      id: '1',
      name: 'Lunettes de soleil Premium',
      type: 'glasses',
      thumbnail: 'https://picsum.photos/400/400?random=1',
      size: '2.4 MB',
      format: 'USDZ',
      status: 'active',
      views: 1234,
    },
    {
      id: '2',
      name: 'Montre de luxe',
      type: 'watch',
      thumbnail: 'https://picsum.photos/400/400?random=2',
      size: '3.1 MB',
      format: 'GLB',
      status: 'active',
      views: 856,
    },
    {
      id: '3',
      name: 'Bague en or',
      type: 'jewelry',
      thumbnail: 'https://picsum.photos/400/400?random=3',
      size: '1.8 MB',
      format: 'Both',
      status: 'active',
      views: 2341,
    },
    {
      id: '4',
      name: 'Chaussures sport',
      type: 'shoes',
      thumbnail: 'https://picsum.photos/400/400?random=4',
      size: '4.2 MB',
      format: 'USDZ',
      status: 'processing',
      views: 0,
    },
  ], []);

  const filteredModels = useMemo(() => {
    return models.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || model.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [models, searchTerm, filterType]);

  return (
    <ErrorBoundary componentName="ARStudioLibrary">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard/ar-studio">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-cyan-400" />
              Bibliothèque 3D
            </h1>
            <p className="text-slate-400 mt-2">
              Gérez votre collection de modèles 3D pour la réalité augmentée
            </p>
          </div>
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <Upload className="w-4 h-4 mr-2" />
            Importer un modèle
          </Button>
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
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
              className={filterType === 'all' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'}
            >
              <Filter className="w-4 h-4 mr-2" />
              Tous
            </Button>
            <div className="flex gap-1 border border-slate-700 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-slate-700' : ''}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-slate-700' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Models Grid/List */}
        {filteredModels.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Database className="w-16 h-16 text-slate-500 mb-4" />
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
        ) : viewMode === 'grid' ? (
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
                    <Image
                      src={model.thumbnail}
                      alt={model.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
                      <span>{model.size}</span>
                      <span>{model.format}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Eye className="w-3 h-3" />
                        <span>{model.views}</span>
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
        ) : (
          <div className="space-y-2">
            {filteredModels.map((model, index) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={model.thumbnail}
                          alt={model.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white truncate">{model.name}</h3>
                          <Badge
                            variant={model.status === 'active' ? 'default' : 'secondary'}
                            className={model.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}
                          >
                            {model.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{model.size}</span>
                          <span>•</span>
                          <span>{model.format}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {model.views}
                          </span>
                        </div>
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

