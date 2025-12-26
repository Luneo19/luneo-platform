'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  Search,
  Download,
  Eye,
  ArrowLeft,
  Sparkles,
  Palette,
  Box,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

/**
 * Templates - AI Studio
 * Bibliothèque de templates prêts à l'emploi
 */
export default function AIStudioTemplatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Tous', icon: Layers },
    { id: 'logo', label: 'Logos', icon: Palette },
    { id: 'product', label: 'Produits', icon: Box },
    { id: 'animation', label: 'Animations', icon: Video },
  ];

  const templates = useMemo(() => [
    {
      id: '1',
      name: 'Logo Moderne',
      category: 'logo',
      thumbnail: 'https://picsum.photos/400/300?random=1',
      downloads: 1234,
      rating: 4.8,
    },
    {
      id: '2',
      name: 'Packaging Premium',
      category: 'product',
      thumbnail: 'https://picsum.photos/400/300?random=2',
      downloads: 856,
      rating: 4.6,
    },
    {
      id: '3',
      name: 'Animation Intro',
      category: 'animation',
      thumbnail: 'https://picsum.photos/400/300?random=3',
      downloads: 2341,
      rating: 4.9,
    },
    {
      id: '4',
      name: 'Logo Minimaliste',
      category: 'logo',
      thumbnail: 'https://picsum.photos/400/300?random=4',
      downloads: 987,
      rating: 4.7,
    },
    {
      id: '5',
      name: 'Affiche Événement',
      category: 'product',
      thumbnail: 'https://picsum.photos/400/300?random=5',
      downloads: 654,
      rating: 4.5,
    },
    {
      id: '6',
      name: 'Animation Loading',
      category: 'animation',
      thumbnail: 'https://picsum.photos/400/300?random=6',
      downloads: 1890,
      rating: 4.8,
    },
  ], []);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchTerm, selectedCategory]);

  return (
    <ErrorBoundary componentName="AIStudioTemplates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard/ai-studio">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Layers className="w-8 h-8 text-cyan-400" />
              Templates
            </h1>
            <p className="text-slate-400 mt-2">
              Bibliothèque de templates prêts à l'emploi pour accélérer votre créativité
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="flex gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Layers className="w-16 h-16 text-slate-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Aucun template trouvé
              </h3>
              <p className="text-slate-400 text-center">
                Essayez de modifier vos critères de recherche
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-900/50 border-slate-700 overflow-hidden hover:border-cyan-500/50 transition-all group">
                  <div className="relative aspect-video bg-slate-800">
                    <Image
                      src={template.thumbnail}
                      alt={template.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                            <Eye className="w-4 h-4 mr-2" />
                            Prévisualiser
                          </Button>
                          <Button size="sm" variant="outline" className="border-slate-600 hover:bg-slate-800">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white mb-2 truncate">{template.name}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Download className="w-4 h-4" />
                        <span>{template.downloads}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span className="text-slate-400">{template.rating}</span>
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

