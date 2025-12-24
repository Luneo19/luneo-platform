'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Book,
  Grid,
  List,
  Search,
  Plus,
  Eye,
  Download,
  Copy,
  Trash2,
  Star,
  Package,
  Image as ImageIcon,
  Layers,
  Zap,
  Edit,
  Heart,
  Share2,
  FolderOpen,
  Play,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LibrarySkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-states/EmptyState';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { trpc } from '@/lib/trpc/client';

interface Template {
  id: string;
  name: string;
  category: 'tshirt' | 'mug' | 'poster' | 'sticker' | 'card' | 'other';
  thumbnail: string;
  isPremium: boolean;
  isFavorite: boolean;
  downloads: number;
  views: number;
  rating: number;
  createdAt: string;
  tags: string[];
}

function LibraryPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'name'>('recent');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 12;

  const [templates, setTemplates] = useState<Template[]>([]);

  const categories = [
    { value: 'all', label: 'Tous', icon: <Package className="w-4 h-4" />, count: templates.length },
    { value: 'tshirt', label: 'T-Shirts', icon: <Layers className="w-4 h-4" />, count: templates.filter(t => t.category === 'tshirt').length },
    { value: 'mug', label: 'Mugs', icon: <Package className="w-4 h-4" />, count: templates.filter(t => t.category === 'mug').length },
    { value: 'poster', label: 'Posters', icon: <ImageIcon className="w-4 h-4" />, count: templates.filter(t => t.category === 'poster').length },
    { value: 'sticker', label: 'Stickers', icon: <Star className="w-4 h-4" />, count: templates.filter(t => t.category === 'sticker').length },
    { value: 'card', label: 'Cartes', icon: <Book className="w-4 h-4" />, count: templates.filter(t => t.category === 'card').length }
  ];

  // Query templates from tRPC
  const templatesQuery = trpc.library.listTemplates.useQuery({
    page,
    limit: ITEMS_PER_PAGE,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: searchTerm || undefined,
    sortBy,
  });

  useEffect(() => {
    if (templatesQuery.data) {
      const formattedTemplates: Template[] = templatesQuery.data.templates.map((template) => ({
        id: template.id,
        name: template.name,
        category: template.category,
        thumbnail: template.thumbnail,
        isPremium: template.isPremium,
        isFavorite: template.isFavorite,
        downloads: template.downloads,
        views: template.views,
        rating: template.rating,
        createdAt: template.createdAt,
        tags: template.tags,
      }));

      if (page === 1) {
        setTemplates(formattedTemplates);
      } else {
        setTemplates((prev) => [...prev, ...formattedTemplates]);
      }

      setHasMore(templatesQuery.data.pagination.hasNext);
      setLoading(false);
      setLoadingMore(false);
    } else if (templatesQuery.isLoading) {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
    } else if (templatesQuery.isError) {
      setError(templatesQuery.error?.message || 'Erreur lors du chargement des templates');
      setLoading(false);
      setLoadingMore(false);
      toast({
        title: 'Erreur',
        description: templatesQuery.error?.message || 'Impossible de charger les templates',
        variant: 'destructive',
      });
    }
  }, [templatesQuery.data, templatesQuery.isLoading, templatesQuery.isError, templatesQuery.error, page, toast]);

  const loadMoreTemplates = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setPage((prev) => prev + 1);
  }, [hasMore, loadingMore]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    // Templates are loaded via templatesQuery which refetches automatically
  }, [categoryFilter, searchTerm, sortBy]);

  // Infinite scroll
  const { Sentinel } = useInfiniteScroll({
    hasMore,
    loading: loadingMore,
    onLoadMore: loadMoreTemplates,
    threshold: 200,
  });

  const handleToggleFavorite = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      const isFavorite = template?.isFavorite;

      const response = await fetch(
        isFavorite 
          ? `/api/library/favorites?templateId=${templateId}` 
          : '/api/library/favorites',
        {
          method: isFavorite ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: isFavorite ? undefined : JSON.stringify({ templateId })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to toggle favorite');
      }

      setTemplates(templates.map(t => 
        t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
      ));

      toast({
        title: isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
        description: template?.name,
      });
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de modifier les favoris",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const newTemplate = {
        ...template,
        id: `${template.id}-copy`,
        name: `${template.name} (Copie)`,
        downloads: 0,
        views: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };

      setTemplates([newTemplate, ...templates]);

      toast({
        title: "Template dupliqué",
        description: "Le template a été dupliqué avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de dupliquer le template",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${templateName}" ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/library/templates?id=${templateId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete template');
      }

      setTemplates(templates.filter(t => t.id !== templateId));

      toast({
        title: "Template supprimé",
        description: "Le template a été supprimé avec succès",
      });
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le template",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (template: Template) => {
    try {
      toast({
        title: "Téléchargement",
        description: `Téléchargement de ${template.name}...`,
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      setTemplates(templates.map(t => 
        t.id === template.id ? { ...t, downloads: t.downloads + 1 } : t
      ));

      toast({
        title: "Téléchargement réussi",
        description: "Le template a été téléchargé",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le template",
        variant: "destructive",
      });
    }
  };

  let filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Sort
  filteredTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const stats = {
    total: templates.length,
    favorites: templates.filter(t => t.isFavorite).length,
    premium: templates.filter(t => t.isPremium).length,
    totalDownloads: templates.reduce((sum, t) => sum + t.downloads, 0),
    totalViews: templates.reduce((sum, t) => sum + t.views, 0)
  };

  const statColorMap = useMemo(
    () => ({
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
      pink: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
      yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
      green: { bg: 'bg-green-500/10', text: 'text-green-400' },
      purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
    }),
    [],
  );

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : <Package className="w-4 h-4" />;
  };

  if (loading) {
    return <LibrarySkeleton />;
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Bibliothèque</h1>
          <p className="text-gray-400">Vos templates et designs sauvegardés</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="border-gray-700" onClick={() => router.push('/dashboard/library/import')}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Importer
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600" onClick={() => router.push('/dashboard/customize')}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau template
          </Button>
          <Button
            variant="outline"
            className="border-green-500/50 hover:bg-green-500/10 w-full sm:w-auto"
            onClick={() => router.push('/demo/asset-hub')}
          >
            <Play className="w-4 h-4 mr-2" />
            Essayer 3D Asset Hub
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total templates', value: stats.total, icon: <Book className="w-5 h-5" />, color: 'blue' },
          { label: 'Favoris', value: stats.favorites, icon: <Heart className="w-5 h-5" />, color: 'pink' },
          { label: 'Premium', value: stats.premium, icon: <Star className="w-5 h-5" />, color: 'yellow' },
          { label: 'Téléchargements', value: stats.totalDownloads, icon: <Download className="w-5 h-5" />, color: 'green' },
          { label: 'Vues totales', value: stats.totalViews, icon: <Eye className="w-5 h-5" />, color: 'purple' }
        ].map((stat, i) => (
          <Card key={i} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  statColorMap[stat.color as keyof typeof statColorMap]?.bg ?? 'bg-gray-500/10'
                } ${statColorMap[stat.color as keyof typeof statColorMap]?.text ?? 'text-gray-400'}`}
              >
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Categories */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                categoryFilter === cat.value
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-900/50 text-gray-300 hover:text-white hover:bg-gray-900'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                categoryFilter === cat.value ? 'bg-white/20' : 'bg-gray-800'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Rechercher par nom ou tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="recent">Plus récents</option>
          <option value="popular">Plus populaires</option>
          <option value="name">Nom (A-Z)</option>
        </select>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="border-gray-700"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="border-gray-700"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Templates Grid/List */}
      <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all group">
              {/* Thumbnail */}
              <div className="relative mb-4 aspect-square bg-gray-900 rounded-lg overflow-hidden">
                <Image
                  src={template.thumbnail}
                  alt={`Template ${template.name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2 text-sm text-white font-medium">
                    {getCategoryIcon(template.category)}
                    <span>{template.name}</span>
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex gap-2">
                  {template.isPremium && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> Premium
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleToggleFavorite(template.id)}
                  className="absolute top-2 left-2 p-2 bg-gray-900/80 rounded-full hover:bg-gray-900 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${template.isFavorite ? 'fill-red-400 text-red-400' : 'text-gray-400'}`} />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="outline" className="border-white/20 bg-black/40 backdrop-blur">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="border-white/20 bg-black/40 backdrop-blur">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-2">{template.name}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {template.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-900/50 text-gray-400 text-xs rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    <span>{template.downloads}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{template.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{template.rating}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(template)}
                  className="flex-1 border-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDuplicate(template)}
                  className="border-gray-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-700"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(template.id, template.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Infinite Scroll Sentinel */}
      {hasMore && !loading && filteredTemplates.length > 0 && <Sentinel />}
      
      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-400">Chargement de plus de templates...</p>
          </div>
        </div>
      )}

      {error && (
        <Card className="p-6 bg-red-900/20 border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">Erreur de chargement</h3>
              <p className="text-sm text-red-300">{error}</p>
            </div>
            <Button onClick={() => templatesQuery.refetch()} variant="outline" className="border-red-500/50 text-red-400">
              Réessayer
            </Button>
          </div>
        </Card>
      )}

      {filteredTemplates.length === 0 && !error && (
        <EmptyState
          icon={<Book className="w-16 h-16" />}
          title={searchTerm || categoryFilter !== 'all' ? "Aucun template trouvé" : "Aucun template"}
          description={searchTerm || categoryFilter !== 'all'
            ? `Aucun template ne correspond à vos filtres. Essayez de modifier votre recherche ou vos filtres.`
            : "Commencez par créer votre premier template pour personnaliser vos produits."}
          action={{
            label: searchTerm || categoryFilter !== 'all' ? "Réinitialiser les filtres" : "Créer un template",
            onClick: () => {
              if (searchTerm || categoryFilter !== 'all') {
                setSearchTerm('');
                setCategoryFilter('all');
              } else {
                router.push('/dashboard/customize');
              }
            }
          }}
        />
      )}

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Besoin d'inspiration ?</h3>
            <p className="text-gray-300">Découvrez notre collection de templates premium</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Zap className="w-4 h-4 mr-2" />
            Explorer les templates
          </Button>
        </div>
      </Card>
    </div>
  );
}

const MemoizedLibraryPageContent = memo(LibraryPageContent);

export default function LibraryPage() {
  return (
    <ErrorBoundary level="page" componentName="LibraryPage">
      <MemoizedLibraryPageContent />
    </ErrorBoundary>
  );
}
