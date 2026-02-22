'use client';

import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
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
import { useI18n } from '@/i18n/useI18n';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { api } from '@/lib/api/client';
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
  const { t } = useI18n();
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
      const formattedTemplates: Template[] = (templatesQuery.data?.templates || []).map((template: Record<string, unknown>) => ({
        id: String(template.id ?? ''),
        name: String(template.name ?? ''),
        category: (template.category as Template['category']) ?? 'other',
        thumbnail: String(template.thumbnail ?? ''),
        isPremium: Boolean(template.isPremium),
        isFavorite: Boolean(template.isFavorite),
        downloads: Number(template.downloads ?? 0),
        views: Number(template.views ?? 0),
        rating: Number(template.rating ?? 0),
        createdAt: String(template.createdAt ?? ''),
        tags: Array.isArray(template.tags) ? (template.tags as string[]) : [],
      }));

      if (page === 1) {
        setTemplates(formattedTemplates);
      } else {
        setTemplates((prev) => [...prev, ...formattedTemplates]);
      }

      setHasMore(templatesQuery.data?.pagination?.hasNext ?? false);
      setLoading(false);
      setLoadingMore(false);
    } else if (templatesQuery.isLoading) {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
    } else if (templatesQuery.isError) {
      setError(templatesQuery.error?.message || t('library.errorLoadingTemplates'));
      setLoading(false);
      setLoadingMore(false);
      toast({
        title: t('common.error'),
        description: templatesQuery.error?.message || t('library.errorLoadingTemplatesDesc'),
        variant: 'destructive',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (isFavorite) {
        await api.delete(`/api/v1/library/favorites?templateId=${templateId}`);
      } else {
        await api.post('/api/v1/library/favorites', { templateId });
      }

      setTemplates(templates.map(t =>
        t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
      ));

      toast({
        title: isFavorite ? t('library.removedFromFavorites') : t('library.addedToFavorites'),
        description: template?.name,
      });
    } catch (error: unknown) {
      toast({
        title: t('common.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const newTemplate = {
        ...template,
        id: `${template.id}-copy`,
        name: `${template.name} ${t('library.copySuffix')}`,
        downloads: 0,
        views: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };

      setTemplates([newTemplate, ...templates]);

      toast({
        title: t('library.templateDuplicated'),
        description: t('library.templateDuplicatedDesc'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('library.duplicateError'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!confirm(t('library.deleteTemplateConfirm', { name: templateName }))) {
      return;
    }

    try {
      await api.delete('/api/v1/library/templates', { params: { id: templateId } });

      setTemplates(templates.filter(t => t.id !== templateId));

      toast({
        title: t('library.templateDeleted'),
        description: t('library.templateDeletedDesc'),
      });
    } catch (error: unknown) {
      toast({
        title: t('common.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (designId: string) => {
    try {
      type DesignDownloadResponse = { downloadUrl?: string; previewUrl?: string; fileUrl?: string; name?: string };
      const response = await api.get<DesignDownloadResponse>(`/api/v1/designs/${designId}`);
      const raw = response as DesignDownloadResponse;
      const downloadUrl = raw.downloadUrl ?? raw.previewUrl ?? raw.fileUrl ?? '';

      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = raw.name ?? 'design';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({ title: t('common.success'), description: t('library.downloadStarted') });
    } catch (error: unknown) {
      toast({ title: t('common.error'), description: getErrorDisplayMessage(error), variant: 'destructive' });
    }
  };

  let filteredTemplates = templates.filter(t => {
    const matchesSearch = (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
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
      blue: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
      pink: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
      yellow: { bg: 'bg-[#fbbf24]/10', text: 'text-[#fbbf24]' },
      green: { bg: 'bg-[#4ade80]/10', text: 'text-[#4ade80]' },
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
    <div className="space-y-6 pb-10 dash-scroll">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Bibliothèque</h1>
          <p className="text-white/60">Vos templates et designs sauvegardés</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="border-white/[0.08] text-white/80 hover:bg-white/[0.04]" onClick={() => router.push('/dashboard/library/import')}>
            <FolderOpen className="w-4 h-4 mr-2" />
            {t('common.import')}
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white" onClick={() => router.push('/dashboard/customize')}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau template
          </Button>
          <Button
            variant="outline"
            className="border-[#4ade80]/50 text-[#4ade80] hover:bg-[#4ade80]/10 w-full sm:w-auto"
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
          <Card key={i} className="dash-card p-4 bg-white/[0.03] border-white/[0.06] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  statColorMap[stat.color as keyof typeof statColorMap]?.bg ?? 'bg-white/[0.04]'
                } ${statColorMap[stat.color as keyof typeof statColorMap]?.text ?? 'text-white/60'}`}
              >
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Categories */}
      <Card className="dash-card p-4 bg-white/[0.03] border-white/[0.06] backdrop-blur-sm">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                categoryFilter === cat.value
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                categoryFilter === cat.value ? 'bg-white/20' : 'bg-white/[0.06] text-white/60'
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            placeholder={t('common.searchByNameOrTag')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dash-input pl-10 border-white/[0.08] text-white placeholder:text-white/40"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular' | 'name')}
          className="dash-input px-4 py-2 bg-[#1a1a2e] border border-white/[0.08] rounded-xl text-white"
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
            className={viewMode === 'grid' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'border-white/[0.08] text-white/80 hover:bg-white/[0.04]'}
            aria-label="Grid view"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'border-white/[0.08] text-white/80 hover:bg-white/[0.04]'}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Templates Grid/List */}
      <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredTemplates.map((template, index) => (
          <motion
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden hover:bg-white/[0.05] hover:border-white/[0.10] transition-all group p-6">
              {/* Thumbnail */}
              <div className="relative mb-4 aspect-square bg-[#12121a] rounded-xl overflow-hidden">
                {template.thumbnail ? (
                  <Image
                    src={template.thumbnail}
                    alt={`Template ${template.name || 'Unnamed'}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2 text-sm text-white font-medium">
                    {getCategoryIcon(template.category)}
                    <span>{template.name}</span>
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex gap-2">
                  {template.isPremium && (
                    <span className="dash-badge-enterprise flex items-center gap-1">
                      <Star className="w-3 h-3" /> Premium
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleToggleFavorite(template.id)}
                  className="absolute top-2 left-2 p-2 bg-black/40 rounded-full hover:bg-white/[0.08] transition-colors border border-white/[0.06]"
                  aria-label={template.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-4 h-4 ${template.isFavorite ? 'fill-[#ec4899] text-[#ec4899]' : 'text-white/60'}`} />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="outline" className="border-white/20 bg-black/40 backdrop-blur text-white hover:bg-white/[0.08]" aria-label="Preview">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="border-white/20 bg-black/40 backdrop-blur text-white hover:bg-white/[0.08]" aria-label="Edit">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-2">{template.name}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {template.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-white/[0.04] text-white/60 text-xs rounded-lg border border-white/[0.06]">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    <span>{template.downloads}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{template.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-[#fbbf24] text-[#fbbf24]" />
                    <span>{template.rating}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(template.id)}
                  className="flex-1 border-white/[0.08] text-white/80 hover:bg-white/[0.04]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDuplicate(template)}
                  className="border-white/[0.08] text-white/80 hover:bg-white/[0.04]"
                  aria-label="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/[0.08] text-white/80 hover:bg-white/[0.04]"
                  aria-label="Share"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(template.id, template.name)}
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion>
        ))}
      </div>

      {/* Infinite Scroll Sentinel */}
      {hasMore && !loading && filteredTemplates.length > 0 && <Sentinel />}

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-white/60">{t('library.loadingMore')}</p>
          </div>
        </div>
      )}

      {error && (
        <Card className="dash-card p-6 bg-[#1a1a2e]/80 border-[#f87171]/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#f87171] mb-2">{t('library.loadErrorTitle')}</h3>
              <p className="text-sm text-white/60">{error}</p>
            </div>
            <Button onClick={() => templatesQuery.refetch()} variant="outline" className="border-white/[0.08] text-white/80 hover:bg-white/[0.04]">
              {t('common.retry')}
            </Button>
          </div>
        </Card>
      )}

      {filteredTemplates.length === 0 && !error && (
        <EmptyState
          icon={<Book className="w-16 h-16 text-white/40" />}
          title={searchTerm || categoryFilter !== 'all' ? t('library.noTemplatesFound') : t('library.noTemplates')}
          description={searchTerm || categoryFilter !== 'all'
            ? t('library.noTemplatesMatchFilters')
            : t('library.noTemplatesDesc')}
          action={{
            label: searchTerm || categoryFilter !== 'all' ? t('library.resetFilters') : t('library.createTemplate'),
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
      <Card className="dash-card-glow p-6 border-white/[0.06]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">{t('library.needInspiration')}</h3>
            <p className="text-white/60">{t('library.explorePremium')}</p>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white">
            <Zap className="w-4 h-4 mr-2" />
            {t('library.exploreTemplates')}
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
