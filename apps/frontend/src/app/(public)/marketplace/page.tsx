'use client';

/**
 * Marketplace Page
 * MK-001 à MK-005: Page principale du marketplace de templates
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  Download,
  Heart,
  Eye,
  ChevronDown,
  X,
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  Tag,
  User,
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
import { useMarketplace } from '@/lib/marketplace/useMarketplace';
import { TEMPLATE_CATEGORIES, type TemplateCategory, type Template } from '@/lib/marketplace/types';
import OptimizedImage from '../../../components/optimized/OptimizedImage';

// Mock data for demo
const MOCK_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'T-Shirt Streetwear Pack',
    description: 'Collection de 12 designs streetwear pour t-shirts',
    slug: 't-shirt-streetwear-pack',
    previewImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    previewImages: [],
    category: 'apparel',
    tags: ['streetwear', 'urban', 'fashion'],
    price: 29,
    currency: 'EUR',
    isPremium: true,
    isFeatured: true,
    creatorId: 'c1',
    creator: { id: 'c1', name: 'DesignMaster', username: 'designmaster', verified: true },
    downloads: 1234,
    views: 8567,
    likes: 456,
    rating: 4.8,
    reviewCount: 89,
    format: 'json',
    dimensions: { width: 4000, height: 4000 },
    fileSize: 2500000,
    compatibility: ['luneo', 'photoshop'],
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 28 * 24 * 60 * 60 * 1000,
    status: 'published',
  },
  {
    id: '2',
    name: 'Minimalist Logo Kit',
    description: 'Templates de logos minimalistes éditables',
    slug: 'minimalist-logo-kit',
    previewImage: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400',
    previewImages: [],
    category: 'digital',
    tags: ['logo', 'minimal', 'branding'],
    price: 0,
    currency: 'EUR',
    isPremium: false,
    isFeatured: false,
    creatorId: 'c2',
    creator: { id: 'c2', name: 'LogoLab', username: 'logolab', verified: false },
    downloads: 5678,
    views: 23456,
    likes: 1234,
    rating: 4.5,
    reviewCount: 234,
    format: 'svg',
    dimensions: { width: 1000, height: 1000 },
    fileSize: 500000,
    compatibility: ['luneo', 'illustrator'],
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 58 * 24 * 60 * 60 * 1000,
    status: 'published',
  },
  {
    id: '3',
    name: 'Social Media Bundle',
    description: '50+ templates pour Instagram, Facebook et LinkedIn',
    slug: 'social-media-bundle',
    previewImage: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
    previewImages: [],
    category: 'social',
    tags: ['social', 'instagram', 'marketing'],
    price: 49,
    currency: 'EUR',
    isPremium: true,
    isFeatured: true,
    creatorId: 'c3',
    creator: { id: 'c3', name: 'SocialPro', username: 'socialpro', avatar: '', verified: true },
    downloads: 3456,
    views: 15678,
    likes: 890,
    rating: 4.9,
    reviewCount: 167,
    format: 'json',
    dimensions: { width: 1080, height: 1080 },
    fileSize: 8000000,
    compatibility: ['luneo', 'canva'],
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
    status: 'published',
  },
  {
    id: '4',
    name: 'Packaging Box Templates',
    description: 'Templates professionnels pour boîtes produits',
    slug: 'packaging-box-templates',
    previewImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
    previewImages: [],
    category: 'packaging',
    tags: ['packaging', 'box', 'product'],
    price: 39,
    currency: 'EUR',
    isPremium: true,
    isFeatured: false,
    creatorId: 'c4',
    creator: { id: 'c4', name: 'PackDesign', username: 'packdesign', verified: true },
    downloads: 789,
    views: 4567,
    likes: 234,
    rating: 4.7,
    reviewCount: 45,
    format: 'json',
    dimensions: { width: 3000, height: 3000 },
    fileSize: 5000000,
    compatibility: ['luneo'],
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 43 * 24 * 60 * 60 * 1000,
    status: 'published',
  },
  {
    id: '5',
    name: 'Mug & Cup Collection',
    description: 'Designs créatifs pour mugs et gobelets',
    slug: 'mug-cup-collection',
    previewImage: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
    previewImages: [],
    category: 'accessories',
    tags: ['mug', 'cup', 'drinkware'],
    price: 19,
    currency: 'EUR',
    isPremium: false,
    isFeatured: false,
    creatorId: 'c5',
    creator: { id: 'c5', name: 'CupArt', username: 'cupart', verified: false },
    downloads: 2345,
    views: 9876,
    likes: 567,
    rating: 4.3,
    reviewCount: 78,
    format: 'json',
    dimensions: { width: 2000, height: 2000 },
    fileSize: 1500000,
    compatibility: ['luneo', 'photoshop'],
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 88 * 24 * 60 * 60 * 1000,
    status: 'published',
  },
  {
    id: '6',
    name: 'Business Card Pro',
    description: 'Templates de cartes de visite premium',
    slug: 'business-card-pro',
    previewImage: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400',
    previewImages: [],
    category: 'print',
    tags: ['business', 'card', 'professional'],
    price: 15,
    currency: 'EUR',
    isPremium: false,
    isFeatured: false,
    creatorId: 'c6',
    creator: { id: 'c6', name: 'PrintPro', username: 'printpro', verified: true },
    downloads: 4567,
    views: 18765,
    likes: 987,
    rating: 4.6,
    reviewCount: 156,
    format: 'json',
    dimensions: { width: 1050, height: 600 },
    fileSize: 800000,
    compatibility: ['luneo', 'illustrator', 'indesign'],
    createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 118 * 24 * 60 * 60 * 1000,
    status: 'published',
  },
];

function MarketplacePageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating'>('popular');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // In real app, use useMarketplace hook
  const templates = MOCK_TEMPLATES;

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              +1000 templates disponibles
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Marketplace de{' '}
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Templates
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Découvrez des designs professionnels créés par notre communauté de créateurs talentueux
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Rechercher des templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg bg-slate-800/50 border-slate-700 rounded-full focus:border-purple-500"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Featured Templates */}
      {featuredTemplates.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <Crown className="w-5 h-5 text-amber-400" />
            <h2 className="text-2xl font-bold">Templates en vedette</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TemplateCard template={template} featured />
              </motion.div>
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
            <Select value={selectedCategory} onValueChange={(v: any) => setSelectedCategory(v)}>
              <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {Object.entries(TEMPLATE_CATEGORIES).map(([key, { name, icon }]) => (
                  <SelectItem key={key} value={key}>
                    {icon} {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Populaires
                  </div>
                </SelectItem>
                <SelectItem value="newest">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Récents
                  </div>
                </SelectItem>
                <SelectItem value="price_asc">Prix croissant</SelectItem>
                <SelectItem value="price_desc">Prix décroissant</SelectItem>
                <SelectItem value="rating">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Mieux notés
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile Filter Button */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden border-slate-700">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-slate-900 border-slate-800">
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                  <SheetDescription>Affinez votre recherche</SheetDescription>
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
              {filteredTemplates.length} résultats
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
                  Filtres
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
                <h3 className="text-xl font-semibold mb-2">Aucun template trouvé</h3>
                <p className="text-slate-400">
                  Essayez de modifier vos filtres ou votre recherche
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
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <TemplateCard template={template} viewMode={viewMode} />
                    </motion.div>
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
  const [isLiked, setIsLiked] = useState(false);

  if (viewMode === 'list') {
    return (
      <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all overflow-hidden">
        <div className="flex">
          <div className="w-48 h-32 relative flex-shrink-0">
            <OptimizedImage alt="" className="w-full h-full object-cover" />
            {template.price === 0 && (
              <Badge className="absolute top-2 left-2 bg-green-500/90">Gratuit</Badge>
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
                  <Badge variant="outline" className="text-green-400 border-green-400">Gratuit</Badge>
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
        <OptimizedImage alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {template.price === 0 && (
            <Badge className="bg-green-500/90">Gratuit</Badge>
          )}
          {featured && (
            <Badge className="bg-amber-500/90">
              <Crown className="w-3 h-3 mr-1" />
              Vedette
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
              Voir le template
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
              Gratuit
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
  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <label className="text-sm font-medium mb-3 block">
          Prix: {priceRange[0]}€ - {priceRange[1]}€
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
          Templates gratuits uniquement
        </label>
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-medium mb-3 block">Tags populaires</label>
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


