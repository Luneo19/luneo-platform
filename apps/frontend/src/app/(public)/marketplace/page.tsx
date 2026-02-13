'use client';

/**
 * Marketplace Page
 * MK-001 à MK-005: Page principale du marketplace de templates
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useI18n } from '@/i18n/useI18n';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  Download,
  Heart,
  Eye,
  Sparkles,
  TrendingUp,
  Clock,
  Tag,
  Crown,
  Check,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { TEMPLATE_CATEGORIES, type TemplateCategory, type Template } from '@/lib/marketplace/types';
import OptimizedImage from '@/components/optimized/OptimizedImage';

// Empty state when API fails (no mock data in production)
const EMPTY_TEMPLATES: Template[] = [];

function normalizeApiTemplate(raw: Record<string, unknown>): Template {
  const creatorId = String(raw.creatorId ?? raw.creator_id ?? '');
  const previewImages = Array.isArray(raw.previewImages)
    ? (raw.previewImages as string[])
    : Array.isArray(raw.preview_images)
      ? (raw.preview_images as string[])
      : [];
  const thumb = raw.thumbnailUrl ?? raw.thumbnail_url;
  const previewImage = typeof thumb === 'string' ? thumb : (previewImages[0] || '');
  const createdAt = raw.createdAt ?? raw.created_at;
  const updatedAt = raw.updatedAt ?? raw.updated_at;
  const publishedAt = raw.publishedAt ?? raw.published_at;
  const toTs = (v: unknown) => (v instanceof Date ? v.getTime() : typeof v === 'string' ? new Date(v).getTime() : Date.now());
  const creator = (raw.creator as Record<string, unknown>) || {};
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    slug: String(raw.slug ?? ''),
    previewImage: previewImage || '/placeholder-template.svg',
    previewImages,
    category: (raw.category as Template['category']) || 'other',
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    price: raw.isFree || raw.is_free ? 0 : Math.round(Number(raw.priceCents ?? raw.price_cents ?? 0) / 100),
    currency: 'EUR',
    isPremium: Boolean(raw.priceCents ?? raw.price_cents),
    isFeatured: Boolean(raw.featured ?? raw.isFeatured ?? raw.is_featured),
    creatorId,
    creator: {
      id: String(creator.id ?? creatorId),
      name: String(creator.name ?? creator.displayName ?? 'Créateur'),
      username: String(creator.username ?? creatorId.slice(0, 8)),
      avatar: creator.avatar != null ? String(creator.avatar) : undefined,
      verified: Boolean(creator.verified),
    },
    downloads: Number(raw.downloads ?? 0),
    views: Number(raw.views ?? raw.downloads ?? 0) * 2,
    likes: Number(raw.likes ?? 0),
    rating: Number(raw.averageRating ?? raw.average_rating ?? raw.rating ?? 0),
    reviewCount: Number(raw.reviews ?? raw.reviewCount ?? 0),
    format: 'json',
    dimensions: { width: 4000, height: 4000 },
    fileSize: Number(raw.fileSize ?? 0) || 1000000,
    compatibility: ['luneo'],
    createdAt: toTs(createdAt),
    updatedAt: toTs(updatedAt),
    publishedAt: publishedAt != null ? toTs(publishedAt) : undefined,
    status: (raw.status as Template['status']) || 'published',
  };
}

function MarketplacePageContent() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating'>('popular');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setTemplatesLoading(true);
      try {
        const res = await endpoints.marketplace.templates({
          status: 'published',
          limit: 100,
          page: 1,
          sortBy: 'popular',
        });
        const data = res as { templates?: unknown[]; items?: unknown[] };
        const list = data?.templates ?? data?.items ?? [];
        const normalized = (Array.isArray(list) ? list : []).map((t) =>
          normalizeApiTemplate(t as Record<string, unknown>)
        );
        if (!cancelled) setTemplates(normalized);
      } catch (error) {
        logger.error('Failed to fetch marketplace templates', { error });
        if (!cancelled) setTemplates(EMPTY_TEMPLATES);
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Search query
      if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Category
      if (selectedCategory !== 'all' && template.category !== selectedCategory) {
        return false;
      }
      // Price range
      if (template.price < priceRange[0] || template.price > priceRange[1]) {
        return false;
      }
      // Free only
      if (freeOnly && template.price > 0) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt - a.createdAt;
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'popular':
        default:
          return b.downloads - a.downloads;
      }
    });
  }, [templates, searchQuery, selectedCategory, sortBy, priceRange, freeOnly]);

  // Featured templates
  const featuredTemplates = useMemo(() => {
    return templates.filter((t) => t.isFeatured).slice(0, 3);
  }, [templates]);

  if (templatesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-400">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <motion
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              +1000 {t('marketplace.title').toLowerCase()}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t('marketplace.heroTitle')}{' '}
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Templates
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              {t('marketplace.subtitle')}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder={t('marketplace.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg bg-slate-800/50 border-slate-700 rounded-full focus:border-purple-500"
                />
              </div>
            </div>
          </motion>
        </div>
      </div>

      {/* Featured Templates */}
      {featuredTemplates.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <Crown className="w-5 h-5 text-amber-400" />
            <h2 className="text-2xl font-bold">{t('marketplace.featured')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTemplates.map((template, index) => (
              <motion
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TemplateCard template={template} featured />
              </motion>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {/* Categories */}
            <Select value={selectedCategory} onValueChange={(v: string) => setSelectedCategory(v as TemplateCategory | 'all')}>
              <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                <SelectValue placeholder={t('marketplace.filters.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('marketplace.filters.allCategories')}</SelectItem>
                {Object.entries(TEMPLATE_CATEGORIES).map(([key, { name, icon }]) => (
                  <SelectItem key={key} value={key}>
                    {icon} {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v: string) => setSortBy(v as 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating')}>
              <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700">
                <SelectValue placeholder={t('marketplace.filters.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {t('marketplace.filters.popular')}
                  </div>
                </SelectItem>
                <SelectItem value="newest">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {t('marketplace.filters.recent')}
                  </div>
                </SelectItem>
                <SelectItem value="price_asc">{t('marketplace.filters.priceAsc')}</SelectItem>
                <SelectItem value="price_desc">{t('marketplace.filters.priceDesc')}</SelectItem>
                <SelectItem value="rating">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    {t('marketplace.filters.rating')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile Filter Button */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden border-slate-700">
                  <Filter className="w-4 h-4 mr-2" />
                  {t('marketplace.filters.filters')}
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-slate-900 border-slate-800">
                <SheetHeader>
                  <SheetTitle>{t('marketplace.filters.filters')}</SheetTitle>
                  <SheetDescription>{t('marketplace.filters.refineSearch')}</SheetDescription>
                </SheetHeader>
                <FilterPanel
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  freeOnly={freeOnly}
                  setFreeOnly={setFreeOnly}
                />
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-4">
            {/* Results count */}
            <span className="text-sm text-slate-400">
              {filteredTemplates.length} {t('marketplace.results')}
            </span>

            {/* View Mode */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className={viewMode === 'grid' ? 'bg-slate-700' : ''}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={viewMode === 'list' ? 'bg-slate-700' : ''}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <Card className="bg-slate-900 border-slate-800 sticky top-4">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  {t('marketplace.filters.filters')}
                </h3>
                <FilterPanel
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  freeOnly={freeOnly}
                  setFreeOnly={setFreeOnly}
                />
              </CardContent>
            </Card>
          </div>

          {/* Templates Grid */}
          <div className="flex-1">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('marketplace.noResults')}</h3>
                <p className="text-slate-400">
                  {t('marketplace.noResultsHint')}
                </p>
              </div>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                <AnimatePresence mode="popLayout">
                  {filteredTemplates.map((template, index) => (
                    <motion
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <TemplateCard template={template} viewMode={viewMode} />
                    </motion>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const MemoizedMarketplacePageContent = memo(MarketplacePageContent);

export default function MarketplacePage() {
  return (
    <ErrorBoundary level="page" componentName="MarketplacePage">
      <MemoizedMarketplacePageContent />
    </ErrorBoundary>
  );
}

// Template Card Component
function TemplateCard({
  template,
  featured = false,
  viewMode = 'grid',
}: {
  template: Template;
  featured?: boolean;
  viewMode?: 'grid' | 'list';
}) {
  const { t } = useI18n();
  const [isLiked, setIsLiked] = useState(false);

  if (viewMode === 'list') {
    return (
      <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all overflow-hidden">
        <div className="flex">
          <div className="w-48 h-32 relative flex-shrink-0">
            <OptimizedImage src={template.previewImage} alt={template.name} className="w-full h-full object-cover" />
            {template.price === 0 && (
              <Badge className="absolute top-2 left-2 bg-green-500/90">{t('marketplace.filters.free')}</Badge>
            )}
          </div>
          <CardContent className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-1">{template.name}</h3>
                <p className="text-sm text-slate-400 line-clamp-1">{template.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {template.rating}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Download className="w-4 h-4" />
                    {template.downloads}
                  </span>
                </div>
              </div>
              <div className="text-right">
                {template.price > 0 ? (
                  <p className="text-xl font-bold">{template.price}€</p>
                ) : (
                  <Badge variant="outline" className="text-green-400 border-green-400">{t('marketplace.filters.free')}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`
      bg-slate-900 border-slate-800 hover:border-slate-700 transition-all overflow-hidden group
      ${featured ? 'ring-2 ring-amber-500/50' : ''}
    `}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <OptimizedImage src={template.previewImage} alt={template.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {template.price === 0 && (
            <Badge className="bg-green-500/90">{t('marketplace.filters.free')}</Badge>
          )}
          {featured && (
            <Badge className="bg-amber-500/90">
              <Crown className="w-3 h-3 mr-1" />
              {t('marketplace.featuredBadge')}
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-slate-900/80 hover:bg-slate-800"
            onClick={(e) => {
              e.preventDefault();
              setIsLiked(!isLiked);
            }}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>

        {/* View Button */}
        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/marketplace/${template.slug}`}>
            <Button className="w-full bg-white/20 border-2 border-white/50 text-white hover:bg-white/30">
              <Eye className="w-4 h-4 mr-2" />
              {t('marketplace.viewTemplate')}
            </Button>
          </Link>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Creator */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold">
            {template.creator.name.charAt(0)}
          </div>
          <span className="text-sm text-slate-400">{template.creator.name}</span>
          {template.creator.verified && (
            <Check className="w-4 h-4 text-blue-400" />
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold mb-2 line-clamp-1">{template.name}</h3>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              {template.rating}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              {template.downloads}
            </span>
          </div>
          
          {/* Price */}
          {template.price > 0 ? (
            <span className="text-lg font-bold text-white">{template.price}€</span>
          ) : (
            <Badge variant="outline" className="text-green-400 border-green-400/50">
              {t('marketplace.filters.free')}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Filter Panel Component
function FilterPanel({
  priceRange,
  setPriceRange,
  freeOnly,
  setFreeOnly,
}: {
  priceRange: number[];
  setPriceRange: (value: number[]) => void;
  freeOnly: boolean;
  setFreeOnly: (value: boolean) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <label className="text-sm font-medium mb-3 block">
          {t('marketplace.priceLabel')}: {priceRange[0]}€ - {priceRange[1]}€
        </label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={100}
          step={5}
          className="py-4"
        />
      </div>

      {/* Free Only */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="free-only"
          checked={freeOnly}
          onCheckedChange={(checked) => setFreeOnly(checked as boolean)}
        />
        <label htmlFor="free-only" className="text-sm cursor-pointer">
          {t('marketplace.freeOnlyLabel')}
        </label>
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-medium mb-3 block">{t('marketplace.popularTags')}</label>
        <div className="flex flex-wrap gap-2">
          {['streetwear', 'minimal', 'social', 'logo', 'packaging'].map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer hover:bg-slate-800 border-slate-700"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}


