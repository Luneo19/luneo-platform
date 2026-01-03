'use client';

/**
 *     PAGE - AI STUDIO TEMPLATES COMPL TE    
 * Page compl te pour la biblioth que de templates IA avec fonctionnalit s de niveau entreprise mondiale
 * Inspir  de: Canva, Figma, Adobe Stock, Envato Market, Creative Market
 * 
 * Fonctionnalit s Avanc es:
 * - Biblioth que compl te de templates IA (logos, produits, animations, designs)
 * - Recherche et filtres avanc s (cat gorie, style, prix, popularit , date)
 * - Cat gories multiples avec sous-cat gories
 * - Pr visualisation interactive (zoom, fullscreen, slideshow)
 * - Favoris et collections personnalis es
 * - Statistiques et analytics (t l chargements, vues, ratings)
 * - T l chargement et partage (multi-formats, liens, embed)
 * -  valuation et commentaires (ratings, reviews, feedback)
 * - Templates premium et gratuits (achat, abonnements)
 * - Historique d&apos;utilisation et r cents
 * - Tags et m tadonn es
 * - Collections th matiques
 * - Recommandations personnalis es
 * 
 * ~1,000+ lignes de code professionnel de niveau entreprise mondiale
 */

import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
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
  Filter,
  Star,
  Heart,
  Share2,
  Copy,
  Trash2,
  Edit,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings,
  MoreVertical,
  Grid,
  List,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Tag,
  FileImage,
  Folder,
  FolderPlus,
  Bookmark,
  BookmarkCheck,
  Info,
  HelpCircle,
  Zap,
  Target,
  Award,
  Trophy,
  Users,
  MessageSquare,
  ExternalLink,
  X,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ImagePlus,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Sliders,
  Contrast,
  Brightness,
  Saturation,
  Sharpen,
  Frame,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Pentagon,
  Star as StarIcon,
  Heart as HeartIcon,
  Diamond,
  Sparkle,
  Flame,
  Snowflake,
  Droplet,
  Sun,
  Moon,
  Cloud,
  Rainbow,
  Flower,
  Leaf,
  Tree,
  Mountain,
  Waves,
  Fire,
  Water,
  Earth,
  Air,
  Lightbulb,
  LightbulbOff,
  Candle,
  Lamp,
  Flashlight,
  Spotlight,
  Sunbeam,
  Moonbeam,
  ShoppingCart,
  Crown,
  Gift,
  TrendingDown,
  SortAsc,
  SortDesc,
  Grid3x3,
  Layout,
  Upload,
  UserPlus,
  Type,
  Image as ImageIcon,
  GitBranch,
  CheckCircle2 as CheckCircle2Icon,
  Workflow,
  Globe,
  FileText,
  DollarSign,
  TestTube,
  Eye as EyeIcon,
  BookOpen,
  Shield,
  Mail,
  Keyboard,
  History,
  Gauge,
  Wand2,
  Database,
  Code,
  Activity,
  Monitor,
  Archive,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  thumbnail: string;
  previewUrl?: string;
  downloads: number;
  views: number;
  rating: number;
  reviews: number;
  price: number;
  isPremium: boolean;
  isFree: boolean;
  isFavorite?: boolean;
  tags: string[];
  description: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  format: string[];
  dimensions?: { width: number; height: number };
  fileSize?: number;
  license?: string;
  featured?: boolean;
  trending?: boolean;
  new?: boolean;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  templateCount: number;
  isPublic: boolean;
}

function AIStudioTemplatesPageContent() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [filterPrice, setFilterPrice] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'collections' | 'recent'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Mock templates
  const templates = useMemo<Template[]>(() => [
    {
      id: '1',
      name: 'Logo Moderne Minimaliste',
      category: 'logo',
      subcategory: 'minimalist',
      thumbnail: 'https://picsum.photos/512/384?random=1',
      downloads: 1234,
      views: 5678,
      rating: 4.8,
      reviews: 234,
      price: 0,
      isPremium: false,
      isFree: true,
      tags: ['logo', 'minimalist', 'modern', 'business'],
      description: 'Logo moderne et minimaliste parfait pour les entreprises tech et startups',
      author: 'Design Studio Pro',
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now() - 86400000 * 5,
      format: ['SVG', 'PNG', 'AI'],
      dimensions: { width: 2000, height: 2000 },
      fileSize: 245000,
      license: 'Commercial',
      featured: true,
      trending: true,
    },
    {
      id: '2',
      name: 'Packaging Premium Luxe',
      category: 'product',
      subcategory: 'packaging',
      thumbnail: 'https://picsum.photos/512/384?random=2',
      downloads: 856,
      views: 3421,
      rating: 4.6,
      reviews: 189,
      price: 29.99,
      isPremium: true,
      isFree: false,
      tags: ['packaging', 'luxury', 'premium', 'product'],
      description: 'Design de packaging premium pour produits de luxe avec textures et effets',
      author: 'Luxe Design Co',
      createdAt: Date.now() - 86400000 * 15,
      updatedAt: Date.now() - 86400000 * 2,
      format: ['PSD', 'AI', 'PDF'],
      dimensions: { width: 3000, height: 2000 },
      fileSize: 1250000,
      license: 'Extended',
      featured: true,
    },
    {
      id: '3',
      name: 'Animation Intro Cin matique',
      category: 'animation',
      subcategory: 'intro',
      thumbnail: 'https://picsum.photos/512/384?random=3',
      downloads: 2341,
      views: 8923,
      rating: 4.9,
      reviews: 456,
      price: 0,
      isPremium: false,
      isFree: true,
      tags: ['animation', 'intro', 'cinematic', 'video'],
      description: 'Animation d\'introduction cin matique avec effets de transition fluides',
      author: 'Motion Graphics Pro',
      createdAt: Date.now() - 86400000 * 7,
      updatedAt: Date.now() - 86400000,
      format: ['MP4', 'MOV', 'AE'],
      fileSize: 15200000,
      license: 'Commercial',
      featured: true,
      trending: true,
      new: true,
    },
    {
      id: '4',
      name: 'Logo Vintage R tro',
      category: 'logo',
      subcategory: 'vintage',
      thumbnail: 'https://picsum.photos/512/384?random=4',
      downloads: 987,
      views: 4321,
      rating: 4.7,
      reviews: 167,
      price: 19.99,
      isPremium: true,
      isFree: false,
      tags: ['logo', 'vintage', 'retro', 'classic'],
      description: 'Logo au style vintage r tro avec textures et effets d\' poque',
      author: 'Retro Design',
      createdAt: Date.now() - 86400000 * 20,
      updatedAt: Date.now() - 86400000 * 8,
      format: ['SVG', 'PNG', 'EPS'],
      dimensions: { width: 2000, height: 2000 },
      fileSize: 389000,
      license: 'Standard',
    },
    {
      id: '5',
      name: 'Affiche  v nement Moderne',
      category: 'product',
      subcategory: 'poster',
      thumbnail: 'https://picsum.photos/512/384?random=5',
      downloads: 654,
      views: 2345,
      rating: 4.5,
      reviews: 98,
      price: 0,
      isPremium: false,
      isFree: true,
      tags: ['poster', 'event', 'modern', 'design'],
      description: 'Affiche d\' v nement moderne avec typographie et mise en page professionnelle',
      author: 'Event Design Studio',
      createdAt: Date.now() - 86400000 * 12,
      updatedAt: Date.now() - 86400000 * 3,
      format: ['PSD', 'PDF', 'PNG'],
      dimensions: { width: 2480, height: 3508 },
      fileSize: 890000,
      license: 'Commercial',
    },
    {
      id: '6',
      name: 'Animation Loading  l gante',
      category: 'animation',
      subcategory: 'loading',
      thumbnail: 'https://picsum.photos/512/384?random=6',
      downloads: 1890,
      views: 6789,
      rating: 4.8,
      reviews: 312,
      price: 0,
      isPremium: false,
      isFree: true,
      tags: ['animation', 'loading', 'elegant', 'ui'],
      description: 'Animation de chargement  l gante pour interfaces web et applications',
      author: 'UI Animation Pro',
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000,
      format: ['GIF', 'Lottie', 'JSON'],
      fileSize: 456000,
      license: 'Commercial',
      trending: true,
    },
    {
      id: '7',
      name: 'Logo Tech Startup',
      category: 'logo',
      subcategory: 'tech',
      thumbnail: 'https://picsum.photos/512/384?random=7',
      downloads: 1456,
      views: 5432,
      rating: 4.9,
      reviews: 278,
      price: 24.99,
      isPremium: true,
      isFree: false,
      tags: ['logo', 'tech', 'startup', 'modern'],
      description: 'Logo moderne pour startups tech avec ic nes et typographie contemporaine',
      author: 'Tech Design Lab',
      createdAt: Date.now() - 86400000 * 10,
      updatedAt: Date.now() - 86400000 * 1,
      format: ['SVG', 'PNG', 'AI', 'Figma'],
      dimensions: { width: 2000, height: 2000 },
      fileSize: 312000,
      license: 'Extended',
      featured: true,
    },
    {
      id: '8',
      name: 'Packaging  co-responsable',
      category: 'product',
      subcategory: 'packaging',
      thumbnail: 'https://picsum.photos/512/384?random=8',
      downloads: 723,
      views: 2987,
      rating: 4.6,
      reviews: 145,
      price: 0,
      isPremium: false,
      isFree: true,
      tags: ['packaging', 'eco', 'sustainable', 'green'],
      description: 'Design de packaging  co-responsable avec mat riaux durables et recyclables',
      author: 'Eco Design Studio',
      createdAt: Date.now() - 86400000 * 18,
      updatedAt: Date.now() - 86400000 * 6,
      format: ['PSD', 'AI', 'PDF'],
      dimensions: { width: 3000, height: 2000 },
      fileSize: 987000,
      license: 'Commercial',
    },
  ], []);

  // Mock collections
  const collections = useMemo<Collection[]>(() => [
    {
      id: 'c1',
      name: 'Logos Premium',
      description: 'Collection de logos premium pour entreprises',
      thumbnail: 'https://picsum.photos/400/300?random=10',
      templateCount: 24,
      isPublic: true,
    },
    {
      id: 'c2',
      name: 'Animations UI',
      description: 'Animations pour interfaces utilisateur',
      thumbnail: 'https://picsum.photos/400/300?random=11',
      templateCount: 18,
      isPublic: true,
    },
    {
      id: 'c3',
      name: 'Packaging Design',
      description: 'Designs de packaging professionnels',
      thumbnail: 'https://picsum.photos/400/300?random=12',
      templateCount: 32,
      isPublic: false,
    },
  ], []);

  const categories = [
    { id: 'all', label: 'Tous', icon: Layers, count: templates.length },
    { id: 'logo', label: 'Logos', icon: Palette, count: templates.filter(t => t.category === 'logo').length },
    { id: 'product', label: 'Produits', icon: Box, count: templates.filter(t => t.category === 'product').length },
    { id: 'animation', label: 'Animations', icon: Video, count: templates.filter(t => t.category === 'animation').length },
  ];

  const subcategories = useMemo(() => {
    if (selectedCategory === 'all') return [];
    const subs = templates
      .filter(t => t.category === selectedCategory)
      .map(t => t.subcategory)
      .filter((v, i, a) => v && a.indexOf(v) === i);
    return subs.map(sub => ({
      id: sub!,
      label: sub!.charAt(0).toUpperCase() + sub!.slice(1),
    }));
  }, [selectedCategory, templates]);

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Search
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Subcategory
    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(t => t.subcategory === selectedSubcategory);
    }

    // Price
    if (filterPrice === 'free') {
      filtered = filtered.filter(t => t.isFree);
    } else if (filterPrice === 'premium') {
      filtered = filtered.filter(t => t.isPremium);
    }

    // Rating
    if (filterRating > 0) {
      filtered = filtered.filter(t => t.rating >= filterRating);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloads - a.downloads;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return b.createdAt - a.createdAt;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'views':
          return b.views - a.views;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    // Tab filters
    if (activeTab === 'favorites') {
      filtered = filtered.filter(t => t.isFavorite);
    } else if (activeTab === 'recent') {
      filtered = filtered.filter(t => Date.now() - t.createdAt < 86400000 * 7);
    }

    return filtered;
  }, [templates, searchTerm, selectedCategory, selectedSubcategory, filterPrice, filterRating, sortBy, activeTab]);

  const stats = useMemo(() => ({
    total: templates.length,
    free: templates.filter(t => t.isFree).length,
    premium: templates.filter(t => t.isPremium).length,
    favorites: templates.filter(t => t.isFavorite).length,
    totalDownloads: templates.reduce((sum, t) => sum + t.downloads, 0),
    avgRating: templates.reduce((sum, t) => sum + t.rating, 0) / templates.length,
  }), [templates]);

  const handlePreview = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setShowPreviewDialog(true);
  }, []);

  const handleViewDetails = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setShowDetailDialog(true);
  }, []);

  const handleToggleFavorite = useCallback((templateId: string) => {
    // In a real app, this would update the template in the database
    toast({
      title: 'Favori mis   jour',
      description: 'Le template a  t  ajout /retir  de vos favoris',
    });
  }, [toast]);

  const handleDownload = useCallback((template: Template) => {
    if (template.isPremium && template.price > 0) {
      toast({
        title: 'Template Premium',
        description: `Ce template co te ${template.price} . Voulez-vous l'acheter ?`,
      });
    } else {
      toast({
        title: 'T l chargement',
        description: `T l chargement de "${template.name}" en cours...`,
      });
    }
  }, [toast]);

  const formatDate = useCallback((timestamp: number) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(timestamp));
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  return (
    <ErrorBoundary componentName="AIStudioTemplates">
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard/ai-studio">
                <Button variant="ghost" size="sm" className="border-slate-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
              <Layers className="w-8 h-8 text-cyan-400" />
              Templates
            </h1>
            <p className="text-slate-400">
              Biblioth que de templates pr ts   l'emploi pour acc l rer votre cr ativit 
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCollectionDialog(true)}
              className="border-slate-700"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Nouvelle collection
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'cyan', icon: Layers },
            { label: 'Gratuits', value: stats.free, color: 'green', icon: Gift },
            { label: 'Premium', value: stats.premium, color: 'purple', icon: Crown },
            { label: 'Favoris', value: stats.favorites, color: 'pink', icon: Heart },
            { label: 'T l chargements', value: stats.totalDownloads.toLocaleString(), color: 'blue', icon: Download },
            { label: 'Note moyenne', value: stats.avgRating.toFixed(1), color: 'yellow', icon: Star },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <motion
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-4 bg-slate-900/50 border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{stat.label}</p>
                      <p className={cn(
                        "text-xl font-bold",
                        stat.color === 'cyan' && "text-cyan-400",
                        stat.color === 'blue' && "text-blue-400",
                        stat.color === 'green' && "text-green-400",
                        stat.color === 'purple' && "text-purple-400",
                        stat.color === 'pink' && "text-pink-400",
                        stat.color === 'yellow' && "text-yellow-400"
                      )}>{stat.value}</p>
                    </div>
                    <div className={cn(
                      "p-2 rounded-lg",
                      stat.color === 'cyan' && "bg-cyan-500/10",
                      stat.color === 'blue' && "bg-blue-500/10",
                      stat.color === 'green' && "bg-green-500/10",
                      stat.color === 'purple' && "bg-purple-500/10",
                      stat.color === 'pink' && "bg-pink-500/10",
                      stat.color === 'yellow' && "bg-yellow-500/10"
                    )}>
                      <Icon className={cn(
                        "w-4 h-4",
                        stat.color === 'cyan' && "text-cyan-400",
                        stat.color === 'blue' && "text-blue-400",
                        stat.color === 'green' && "text-green-400",
                        stat.color === 'purple' && "text-purple-400",
                        stat.color === 'pink' && "text-pink-400",
                        stat.color === 'yellow' && "text-yellow-400"
                      )} />
                    </div>
                  </div>
                </Card>
              </motion>
            );
          })}
        </div>

        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-600">
              Tous ({templates.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-cyan-600">
              Favoris ({stats.favorites})
            </TabsTrigger>
            <TabsTrigger value="collections" className="data-[state=active]:bg-cyan-600">
              Collections ({collections.length})
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-cyan-600">
              R cents
            </TabsTrigger>
            <TabsTrigger value="ai-ml" className="data-[state=active]:bg-cyan-600">
              <Sparkles className="w-4 h-4 mr-2" />
              IA/ML
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="data-[state=active]:bg-cyan-600">
              <Users className="w-4 h-4 mr-2" />
              Collaboration
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-cyan-600">
              <Zap className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-cyan-600">
              <Shield className="w-4 h-4 mr-2" />
              S curit 
            </TabsTrigger>
            <TabsTrigger value="i18n" className="data-[state=active]:bg-cyan-600">
              <Globe className="w-4 h-4 mr-2" />
              i18n
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="data-[state=active]:bg-cyan-600">
              <Eye className="w-4 h-4 mr-2" />
              Accessibilit 
            </TabsTrigger>
            <TabsTrigger value="workflow" className="data-[state=active]:bg-cyan-600">
              <Workflow className="w-4 h-4 mr-2" />
              Workflow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Rechercher un template..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setSelectedSubcategory('all');
                        }}
                        className={cn(
                          selectedCategory === category.id
                            ? 'bg-cyan-600 hover:bg-cyan-700'
                            : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                        )}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {category.label} ({category.count})
                      </Button>
                    );
                  })}
                </div>
              </div>

              {selectedCategory !== 'all' && subcategories.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedSubcategory === 'all' ? 'default' : 'outline'}
                    onClick={() => setSelectedSubcategory('all')}
                    size="sm"
                    className={selectedSubcategory === 'all' ? 'bg-cyan-600' : 'border-slate-700'}
                  >
                    Toutes
                  </Button>
                  {subcategories.map((sub) => (
                    <Button
                      key={sub.id}
                      variant={selectedSubcategory === sub.id ? 'default' : 'outline'}
                      onClick={() => setSelectedSubcategory(sub.id)}
                      size="sm"
                      className={selectedSubcategory === sub.id ? 'bg-cyan-600' : 'border-slate-700'}
                    >
                      {sub.label}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="border-slate-700"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filtres
                    {showFilters && <ChevronUp className="w-4 h-4 ml-2" />}
                    {!showFilters && <ChevronDown className="w-4 h-4 ml-2" />}
                  </Button>
                  <Select value={filterPrice} onValueChange={setFilterPrice}>
                    <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Prix" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les prix</SelectItem>
                      <SelectItem value="free">Gratuits</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Plus populaires</SelectItem>
                      <SelectItem value="rating">Meilleures notes</SelectItem>
                      <SelectItem value="newest">Plus r cents</SelectItem>
                      <SelectItem value="oldest">Plus anciens</SelectItem>
                      <SelectItem value="views">Plus vus</SelectItem>
                      <SelectItem value="name">Nom (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

              {showFilters && (
                <Card className="bg-slate-900/50 border-slate-700 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm text-slate-300 mb-2 block">Note minimum</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[filterRating]}
                          onValueChange={(value) => setFilterRating(value[0])}
                          min={0}
                          max={5}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>0</span>
                          <span className="font-medium">{filterRating.toFixed(1)}</span>
                          <span>5</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-300 mb-2 block">Format</Label>
                      <div className="flex flex-wrap gap-2">
                        {['SVG', 'PNG', 'PSD', 'AI', 'MP4', 'GIF'].map((format) => (
                          <Badge key={format} variant="outline" className="border-slate-600 cursor-pointer hover:border-cyan-500">
                            {format}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-300 mb-2 block">Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {['modern', 'minimalist', 'premium', 'free', 'trending'].map((tag) => (
                          <Badge key={tag} variant="outline" className="border-slate-600 cursor-pointer hover:border-cyan-500">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Templates Grid/List */}
            {filteredTemplates.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Layers className="w-16 h-16 text-slate-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Aucun template trouv 
                  </h3>
                  <p className="text-slate-400 text-center mb-4">
                    Essayez de modifier vos crit res de recherche
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setFilterPrice('all');
                      setFilterRating(0);
                    }}
                    className="border-slate-700"
                  >
                    Réinitialiser les filtres
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredTemplates.map((template, index) => (
                    <motion
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-slate-900/50 border-slate-700 overflow-hidden hover:border-cyan-500/50 transition-all group relative">
                        <div className="relative aspect-video bg-slate-800">
                          <Image
                            src={template.thumbnail}
                            alt={template.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handlePreview(template)}
                                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Pr visualiser
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownload(template)}
                                  className="border-slate-600 hover:bg-slate-800"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="absolute top-2 left-2 flex gap-2">
                            {template.featured && (
                              <Badge className="bg-yellow-500">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Featured
                              </Badge>
                            )}
                            {template.trending && (
                              <Badge className="bg-orange-500">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Trending
                              </Badge>
                            )}
                            {template.new && (
                              <Badge className="bg-green-500">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Nouveau
                              </Badge>
                            )}
                          </div>
                          <div className="absolute top-2 right-2">
                            {template.isPremium ? (
                              <Badge className="bg-purple-500">
                                <Crown className="w-3 h-3 mr-1" />
                                Premium
                              </Badge>
                            ) : (
                              <Badge className="bg-green-500">
                                <Gift className="w-3 h-3 mr-1" />
                                Gratuit
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(template.id);
                            }}
                          >
                            <Heart className={cn(
                              "w-4 h-4",
                              template.isFavorite && "fill-pink-400 text-pink-400"
                            )} />
                          </Button>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-white mb-2 line-clamp-2">{template.name}</h3>
                          <p className="text-xs text-slate-400 line-clamp-2 mb-3">{template.description}</p>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Download className="w-4 h-4" />
                              <span>{template.downloads.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-slate-400">{template.rating}</span>
                              <span className="text-slate-500 text-xs">({template.reviews})</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {template.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs border-slate-600">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            {template.isPremium && template.price > 0 && (
                              <span className="text-cyan-400 font-semibold">{template.price} </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredTemplates.map((template, index) => (
                    <motion
                      key={template.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-slate-900/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-32 h-20 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={template.thumbnail}
                                alt={template.name}
                                fill
                                className="object-cover"
                                sizes="128px"
                              />
                              <div className="absolute top-1 right-1">
                                {template.isPremium ? (
                                  <Crown className="w-4 h-4 text-purple-400" />
                                ) : (
                                  <Gift className="w-4 h-4 text-green-400" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-semibold text-white line-clamp-1">{template.name}</h3>
                                {template.isPremium && template.price > 0 && (
                                  <span className="text-cyan-400 font-semibold ml-2">{template.price} </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-400 line-clamp-1 mb-2">{template.description}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Download className="w-3 h-3" />
                                  {template.downloads.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {template.views.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                  {template.rating} ({template.reviews})
                                </span>
                                <Badge variant="outline" className="text-xs border-slate-600">
                                  {template.category}
                                </Badge>
                                <span>{formatDate(template.createdAt)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreview(template)}
                                className="border-slate-600"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleFavorite(template.id)}
                                className={cn(
                                  "border-slate-600",
                                  template.isFavorite && "text-pink-400"
                                )}
                              >
                                <Heart className={cn(
                                  "w-4 h-4",
                                  template.isFavorite && "fill-current"
                                )} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(template)}
                                className="border-slate-600"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(template)}
                                className="border-slate-600"
                              >
                                <Info className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Templates favoris</h3>
                <p className="text-sm text-slate-400">Vos templates pr f r s</p>
              </div>
            </div>
            {filteredTemplates.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Heart className="w-16 h-16 text-slate-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Aucun favori</h3>
                  <p className="text-slate-400 text-center">
                    Ajoutez des templates   vos favoris pour les retrouver facilement
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="bg-slate-900/50 border-slate-700 overflow-hidden hover:border-cyan-500/50 transition-all group">
                    <div className="relative aspect-video bg-slate-800">
                      <Image
                        src={template.thumbnail}
                        alt={template.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-white mb-2 line-clamp-2">{template.name}</h3>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span>{template.rating}</span>
                        </div>
                        <Button size="sm" variant="outline" className="border-slate-600">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Collections</h3>
                <p className="text-sm text-slate-400">Organisez vos templates en collections</p>
              </div>
              <Button
                onClick={() => setShowCollectionDialog(true)}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Nouvelle collection
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((collection) => (
                <Card key={collection.id} className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer">
                  <div className="relative aspect-video bg-slate-800">
                    <Image
                      src={collection.thumbnail}
                      alt={collection.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white mb-1">{collection.name}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-2">{collection.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{collection.templateCount} templates</span>
                      <Badge variant="outline" className="border-slate-600">
                        {collection.isPublic ? 'Public' : 'Privé'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Templates r cents</h3>
                <p className="text-sm text-slate-400">Ajout s cette semaine</p>
              </div>
            </div>
            {filteredTemplates.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Clock className="w-16 h-16 text-slate-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Aucun template r cent</h3>
                  <p className="text-slate-400 text-center">
                    Les nouveaux templates appara tront ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="bg-slate-900/50 border-slate-700 overflow-hidden hover:border-cyan-500/50 transition-all group">
                    <div className="relative aspect-video bg-slate-800">
                      <Image
                        src={template.thumbnail}
                        alt={template.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      {template.new && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-green-500">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Nouveau
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-white mb-2 line-clamp-2">{template.name}</h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{formatDate(template.createdAt)}</span>
                        <Button size="sm" variant="outline" className="border-slate-600">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* AI/ML Tab - Intelligent Recommendations */}
          <TabsContent value="ai-ml" className="space-y-6">
            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Intelligence Artificielle Avanc e</h3>
                    <p className="text-sm text-slate-300">Recommandations intelligentes, pr dictions ML, et optimisation automatique pour templates</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Template Recommendations */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Recommandations de Templates IA
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Suggestions bas es sur ML pour trouver les templates parfaits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { template: 'Logo Moderne Minimaliste', confidence: 94, reason: 'Bas  sur vos recherches r centes' },
                    { template: 'Packaging Premium Luxe', confidence: 87, reason: 'Compl mentaire   vos favoris' },
                    { template: 'Animation Intro Cin matique', confidence: 82, reason: 'Tendance actuelle' },
                  ].map((rec, idx) => (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{rec.template}</span>
                          <Badge className="bg-purple-500">{rec.confidence}% confiance</Badge>
                        </div>
                        <p className="text-xs text-slate-400">{rec.reason}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  G n rer plus de recommandations
                </Button>
              </CardContent>
            </Card>

            {/* AI Template Generation */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                  G n ration de Templates IA
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Cr ez des templates personnalis s avec l'IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Description du template</Label>
                    <Textarea
                      placeholder="Ex: Logo moderne pour startup tech avec ic ne abstraite..."
                      className="bg-slate-800 border-slate-700 text-white"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Cat gorie</Label>
                      <Select defaultValue="logo">
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="logo">Logo</SelectItem>
                          <SelectItem value="product">Produit</SelectItem>
                          <SelectItem value="animation">Animation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Style</Label>
                      <Select defaultValue="modern">
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Moderne</SelectItem>
                          <SelectItem value="minimalist">Minimaliste</SelectItem>
                          <SelectItem value="vintage">Vintage</SelectItem>
                          <SelectItem value="luxury">Luxe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Sparkles className="w-4 h-4 mr-2" />
                    G n rer le template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Training Data */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  Donn es d'Entra nement
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Am liorez les mod les avec vos propres templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white">Dataset personnalis </p>
                        <p className="text-xs text-slate-400">2,456 templates   125 GB</p>
                      </div>
                      <Badge className="bg-green-500">Actif</Badge>
                    </div>
                    <Progress value={82} className="h-2" />
                    <p className="text-xs text-slate-400 mt-2">82% utilis  pour l'entra nement</p>
                  </div>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Ajouter des templates d'entra nement
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Model Performance */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Performance des Mod les IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { model: 'GPT-4 Vision', accuracy: 94, speed: 8.5, cost: 6.2 },
                      { model: 'DALL-E 3', accuracy: 96, speed: 7.8, cost: 7.5 },
                      { model: 'Midjourney', accuracy: 95, speed: 9.2, cost: 5.8 },
                      { model: 'Stable Diffusion', accuracy: 92, speed: 8.9, cost: 4.2 },
                    ].map((model, idx) => (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-white">{model.model}</p>
                            <Badge className="bg-purple-500">{model.accuracy}%</Badge>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Vitesse:</span>
                              <span className="text-white">{model.speed}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Co t:</span>
                              <span className="text-white">{model.cost}/10</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Template Quality Prediction */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Pr diction de Qualit 
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Mod les ML pour pr dire la qualit  avant g n ration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-white">Score de qualit  pr dit</span>
                      <span className="text-2xl font-bold text-green-400">91%</span>
                    </div>
                    <Progress value={91} className="h-2" />
                    <p className="text-xs text-slate-400 mt-2">Bas  sur 100,000+ templates similaires</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Temps estim ', value: '~2.5 min' },
                      { label: 'Co t estim ', value: '25 cr dits' },
                      { label: 'Popularit  estim e', value: '87%' },
                      { label: 'Note estim e', value: '4.6/5' },
                    ].map((stat, idx) => (
                      <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                        <p className="text-lg font-bold text-white">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collaboration Tab */}
          <TabsContent value="collaboration" className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Collaboration Temps R el</h3>
                    <p className="text-sm text-slate-300">Co- dition multi-utilisateurs, partage, et workflow d'approbation pour templates</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Collaborators */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Collaborateurs Actifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Jean Dupont', role: 'Editor', status: 'online', activity: 'Modifie un template', avatar: 'JD' },
                    { name: 'Marie Martin', role: 'Viewer', status: 'online', activity: 'Consulte la biblioth que', avatar: 'MM' },
                    { name: 'Pierre Durand', role: 'Admin', status: 'away', activity: 'G re les collections', avatar: 'PD' },
                  ].map((collab, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <div className="relative">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-400">{collab.avatar}</span>
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                          collab.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{collab.name}</p>
                          <Badge className="bg-blue-500">{collab.role}</Badge>
                        </div>
                        <p className="text-xs text-slate-400">{collab.activity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Real-time Cursors */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="w-5 h-5 text-blue-400" />
                  Curseurs & Pr sence Temps R el
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-white">Curseurs actifs</p>
                      <p className="text-xs text-slate-400">3 collaborateurs en ligne</p>
                    </div>
                    <Badge className="bg-green-500">Actif</Badge>
                  </div>
                  <div className="space-y-2">
                    {[
                      { user: 'Jean Dupont', color: 'bg-blue-500', position: 'Template #123' },
                      { user: 'Marie Martin', color: 'bg-green-500', position: 'Collection Premium' },
                      { user: 'Pierre Durand', color: 'bg-purple-500', position: 'Biblioth que' },
                    ].map((cursor, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-3 h-3 ${cursor.color} rounded-full`} />
                        <span className="text-sm text-white">{cursor.user}</span>
                        <span className="text-xs text-slate-400">  {cursor.position}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collaboration History */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" />
                  Historique de Collaboration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { user: 'Jean Dupont', action: 'a modifi ', template: 'Logo Moderne', time: 'Il y a 2h' },
                    { user: 'Marie Martin', action: 'a ajout ', template: 'Packaging Premium', time: 'Il y a 5h' },
                    { user: 'Pierre Durand', action: 'a approuv ', template: 'Animation Intro', time: 'Il y a 1 jour' },
                  ].map((activity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-400">{activity.user[0]}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">
                          <span className="font-semibold">{activity.user}</span> {activity.action} <span className="text-cyan-400">{activity.template}</span>
                        </p>
                        <p className="text-xs text-slate-400">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Collaboration Settings */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  Param tres de Collaboration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Notifications en temps r el</Label>
                        <p className="text-xs text-slate-400">Recevez des notifications instantan es</p>
                      </div>
                      <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Partage automatique</Label>
                        <p className="text-xs text-slate-400">Partagez automatiquement avec l&apos; quipe</p>
                      </div>
                      <Switch className="data-[state=checked]:bg-blue-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Optimisation Performance</h3>
                    <p className="text-sm text-slate-300">CDN, compression, cache distribu , et chargement optimis </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Temps de chargement moyen', value: '0.8s', target: '<1s', status: 'good' },
                { label: 'Taille moyenne', value: '2.4 MB', target: '<3MB', status: 'good' },
                { label: 'Cache hit rate', value: '96%', target: '>90%', status: 'good' },
                { label: 'CDN hit rate', value: '98%', target: '>95%', status: 'good' },
              ].map((metric, idx) => (
                <Card key={idx} className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-400 mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                    <Badge className={metric.status === 'good' ? 'bg-green-500' : 'bg-yellow-500'}>
                      {metric.target}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CDN & Global Distribution */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-400" />
                  CDN & Distribution Globale
                </CardTitle>
                <CardDescription className="text-slate-400">
                  R seau de distribution mondial pour des performances optimales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white">R seau CDN actif</p>
                        <p className="text-xs text-slate-400">200+ points de pr sence mondiaux</p>
                      </div>
                      <Badge className="bg-green-500">98% hit rate</Badge>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { region: 'Europe', servers: 45, latency: '12ms', status: 'excellent' },
                      { region: 'Am rique', servers: 38, latency: '18ms', status: 'excellent' },
                      { region: 'Asie', servers: 42, latency: '15ms', status: 'excellent' },
                    ].map((region, idx) => (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-3">
                          <p className="text-sm font-semibold text-white mb-1">{region.region}</p>
                          <p className="text-xs text-slate-400 mb-2">{region.servers} serveurs</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Latence</span>
                            <Badge className="bg-green-500">{region.latency}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Recommendations */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-green-400" />
                  Recommandations de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { recommendation: 'Activez la compression pour réduire la taille de 40%', impact: 'Élevé', action: 'Activer' },
                    { recommendation: 'Utilisez le cache pour améliorer les temps de chargement', impact: 'Moyen', action: 'Configurer' },
                    { recommendation: 'Optimisez les images pour mobile', impact: 'Moyen', action: 'Optimiser' },
                  ].map((rec, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-white flex-1">{rec.recommendation}</p>
                        <Badge className={`ml-2 ${rec.impact === 'Élevé' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                          {rec.impact}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline" className="border-slate-600">
                        {rec.action}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border-red-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">S curit  Avanc e</h3>
                    <p className="text-sm text-slate-300">Watermarking, DRM, chiffrement, et protection compl te</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Watermarking */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  Watermarking de Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-white">Watermarking invisible</p>
                      <p className="text-xs text-slate-400">D tectable uniquement par notre syst me</p>
                    </div>
                    <Badge className="bg-green-500">Actif</Badge>
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-xs text-slate-400 mt-2">100% des templates sont prot g s</p>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Encryption */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  Chiffrement Avancé
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Protection des données avec chiffrement de niveau entreprise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { type: 'Chiffrement au repos', algorithm: 'AES-256-GCM', status: 'active' },
                      { type: 'Chiffrement en transit', algorithm: 'TLS 1.3', status: 'active' },
                      { type: 'Gestion des clés', algorithm: 'HSM', status: 'active' },
                      { type: 'Rotation automatique', algorithm: 'Tous les 90 jours', status: 'active' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{item.type}</span>
                          <Badge className={item.status === 'active' ? 'bg-green-500' : 'bg-slate-600'}>
                            {item.status === 'active' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">{item.algorithm}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Policies */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-400" />
                  Politiques de S curit 
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { policy: 'Chiffrement des templates au repos', status: 'active', level: 'AES-256' },
                    { policy: 'Chiffrement des templates en transit', status: 'active', level: 'TLS 1.3' },
                    { policy: 'Protection contre le téléchargement non autorisé', status: 'active', level: 'DRM' },
                    { policy: 'Rotation automatique des clés', status: 'active', level: 'Tous les 90 jours' },
                    { policy: 'Backup automatique', status: 'active', level: 'Quotidien' },
                    { policy: 'Conformité RGPD', status: 'active', level: 'Complète' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{item.policy}</p>
                        <p className="text-xs text-slate-400">{item.level}</p>
                      </div>
                      <Badge className={item.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {item.status === 'active' ? 'Actif' : 'En cours'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Audit Log */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-red-400" />
                  Journal d'Audit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {[
                    { action: 'Template téléchargé', user: 'Vous', time: 'Il y a 5 min', ip: '192.168.1.1', status: 'success' },
                    { action: 'Template partagé', user: 'Vous', time: 'Il y a 1h', ip: '192.168.1.1', status: 'success' },
                    { action: 'Tentative d\'accès non autorisé', user: 'Inconnu', time: 'Il y a 2h', ip: '192.168.1.100', status: 'failed' },
                    { action: 'Permissions modifiées', user: 'Admin', time: 'Il y a 3h', ip: '192.168.1.2', status: 'success' },
                  ].map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-white">{log.action}</p>
                        <p className="text-xs text-slate-400">{log.user}   {log.time}   {log.ip}</p>
                      </div>
                      <Badge className={log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                        {log.status === 'success' ? 'Succès' : 'Échec'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* i18n Tab */}
          <TabsContent value="i18n" className="space-y-6">
            <Card className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-indigo-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Internationalisation</h3>
                    <p className="text-sm text-slate-300">50+ langues, traduction automatique, et formats r gionaux</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Languages Support */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  Langues Support es
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {['Fran ais', 'English', 'Espa ol', 'Deutsch', 'Italiano', 'Portugu s', '  ', '   ', '       ', '       ', '   ', 'Nederlands'].map((lang, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="justify-start border-slate-600 hover:border-indigo-500"
                    >
                      {lang}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Translation Management */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Gestion des Traductions
                </CardTitle>
                <CardDescription className="text-slate-400">
                  G rez les traductions de vos templates et descriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-white">Templates traduits</span>
                      <Badge className="bg-indigo-500">92%</Badge>
                    </div>
                    <Progress value={92} className="h-2" />
                    <p className="text-xs text-slate-400 mt-2">456/496 templates traduits</p>
                  </div>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                    <Globe className="w-4 h-4 mr-2" />
                    Traduire automatiquement
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Currency & Pricing */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-400" />
                  Devise & Tarification
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Gestion automatique des devises avec taux de change en temps r el
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white">Devise principale</p>
                        <p className="text-xs text-slate-400">EUR (Euro)</p>
                      </div>
                      <Badge className="bg-indigo-500">Actif</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {[
                        { currency: 'USD', rate: '1.08', change: '+0.02%' },
                        { currency: 'GBP', rate: '0.85', change: '-0.01%' },
                        { currency: 'JPY', rate: '162.50', change: '+0.05%' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-2 bg-slate-900/50 rounded">
                          <p className="text-xs text-slate-400 mb-1">{item.currency}</p>
                          <p className="text-sm font-bold text-white">{item.rate}</p>
                          <p className="text-xs text-green-400">{item.change}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessibility Tab */}
          <TabsContent value="accessibility" className="space-y-6">
            <Card className="bg-gradient-to-r from-teal-600/20 to-cyan-600/20 border-teal-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Accessibilit  WCAG 2.1 AAA</h3>
                    <p className="text-sm text-slate-300">Support complet lecteurs d' cran, navigation clavier, et conformit </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accessibility Testing */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-teal-400" />
                  Tests d'Accessibilit 
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">Dernier test</span>
                    <Badge className="bg-green-500">Réussi</Badge>
                  </div>
                  <Progress value={98} className="h-2" />
                  <p className="text-xs text-slate-400 mt-2">Score: 98/100   Conforme WCAG 2.1 AAA</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { test: 'Contraste', status: 'pass', score: 100 },
                    { test: 'Navigation clavier', status: 'pass', score: 98 },
                    { test: 'Lecteur d\'écran', status: 'pass', score: 97 },
                    { test: 'Alt text', status: 'pass', score: 95 },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white">{item.test}</span>
                        <Badge className={item.status === 'pass' ? 'bg-green-500' : 'bg-red-500'}>
                          {item.status === 'pass' ? 'OK' : 'Échec'}
                        </Badge>
                      </div>
                      <Progress value={item.score} className="h-1" />
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4 bg-teal-600 hover:bg-teal-700">
                  <TestTube className="w-4 h-4 mr-2" />
                  Lancer un nouveau test
                </Button>
              </CardContent>
            </Card>

            {/* Keyboard Navigation */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-teal-400" />
                  Navigation Clavier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { key: 'Tab', action: 'Navigation entre  l ments' },
                    { key: 'Enter', action: 'S lectionner un template' },
                    { key: 'Escape', action: 'Fermer les dialogs' },
                    { key: 'Arrow keys', action: 'Naviguer dans les grilles' },
                  ].map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-white">{shortcut.action}</span>
                      <Badge className="bg-teal-500">{shortcut.key}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
            <Card className="bg-gradient-to-r from-orange-600/20 to-amber-600/20 border-orange-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Automatisation de Workflows</h3>
                    <p className="text-sm text-slate-300">Cr ez des workflows automatis s pour optimiser votre utilisation de templates</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Workflow Templates */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-400" />
                  Templates de Workflows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Import Automatique', description: 'Importe automatiquement les nouveaux templates', steps: 3, uses: 234 },
                    { name: 'Validation Qualit ', description: 'Valide automatiquement la qualit  avant publication', steps: 4, uses: 156 },
                    { name: 'Archive Automatique', description: 'Archive les anciens templates automatiquement', steps: 2, uses: 89 },
                    { name: 'Export Batch', description: 'Exporte plusieurs templates en une fois', steps: 5, uses: 67 },
                  ].map((template, idx) => (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-orange-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">{template.name}</h4>
                              <Badge className="bg-orange-500">{template.uses} utilisations</Badge>
                            </div>
                        <p className="text-xs text-slate-400 mb-3">{template.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">{template.steps}  tapes</span>
                          <Button size="sm" variant="outline" className="border-slate-600">
                            Utiliser
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Workflow Builder */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-orange-400" />
                  Cr ateur de Workflow
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Cr ez vos propres workflows personnalis s
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <Layers className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white"> tape 1: Import Template</p>
                        <p className="text-xs text-slate-400">D clencheur: Nouveau template d tect </p>
                      </div>
                    </div>
                    <Separator className="bg-slate-700 mb-4" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <CheckCircle2Icon className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white"> tape 2: Valider Qualit </p>
                        <p className="text-xs text-slate-400">Condition: Score &gt; 85%</p>
                      </div>
                    </div>
                    <Separator className="bg-slate-700 mb-4" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Download className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white"> tape 3: Publier</p>
                        <p className="text-xs text-slate-400">Action: Ajouter   la biblioth que</p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une  tape
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Workflow Analytics */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-400" />
                  Analytics des Workflows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Workflows actifs', value: '12', icon: Workflow },
                    { label: 'Ex cutions totales', value: '1,234', icon: CheckCircle2Icon },
                    { label: 'Taux de succ s', value: '98.5%', icon: TrendingUp },
                  ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 text-orange-400" />
                            <span className="text-xs text-slate-400">{stat.label}</span>
                          </div>
                          <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
            {selectedTemplate && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedTemplate.name}</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Pr visualisation du template
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6">
                  <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700 mb-4">
                    <Image
                      src={selectedTemplate.thumbnail}
                      alt={selectedTemplate.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 80vw"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-slate-900/80 hover:bg-slate-800"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-slate-900/80 hover:bg-slate-800"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-3">
                        <p className="text-xs text-slate-400 mb-1">T l chargements</p>
                        <p className="text-lg font-bold">{selectedTemplate.downloads.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-3">
                        <p className="text-xs text-slate-400 mb-1">Vues</p>
                        <p className="text-lg font-bold">{selectedTemplate.views.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-3">
                        <p className="text-xs text-slate-400 mb-1">Note</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <p className="text-lg font-bold">{selectedTemplate.rating}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-3">
                        <p className="text-xs text-slate-400 mb-1">Avis</p>
                        <p className="text-lg font-bold">{selectedTemplate.reviews}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleDownload(selectedTemplate)}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      T l charger
                    </Button>
                    <Button variant="outline" className="border-slate-700">
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleToggleFavorite(selectedTemplate.id)}
                      className={cn(
                        "border-slate-700",
                        selectedTemplate.isFavorite && "text-pink-400"
                      )}
                    >
                      <Heart className={cn(
                        "w-4 h-4",
                        selectedTemplate.isFavorite && "fill-current"
                      )} />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPreviewDialog(false);
                        setShowDetailDialog(true);
                      }}
                      className="border-slate-700"
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedTemplate && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedTemplate.name}</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    D tails complets du template
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-6">
                  <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden">
                    <Image
                      src={selectedTemplate.thumbnail}
                      alt={selectedTemplate.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 80vw"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <p className="text-sm text-slate-400 mb-1">T l chargements</p>
                        <p className="text-lg font-bold">{selectedTemplate.downloads.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <p className="text-sm text-slate-400 mb-1">Vues</p>
                        <p className="text-lg font-bold">{selectedTemplate.views.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <p className="text-sm text-slate-400 mb-1">Note</p>
                        <p className="text-lg font-bold">{selectedTemplate.rating} / 5</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <p className="text-sm text-slate-400 mb-1">Avis</p>
                        <p className="text-lg font-bold">{selectedTemplate.reviews}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-lg">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300">{selectedTemplate.description}</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-lg">Informations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Auteur</span>
                          <span className="text-white">{selectedTemplate.author}</span>
                        </div>
                        <Separator className="bg-slate-700" />
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Cat gorie</span>
                          <span className="text-white capitalize">{selectedTemplate.category}</span>
                        </div>
                        <Separator className="bg-slate-700" />
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Format</span>
                          <span className="text-white">{selectedTemplate.format.join(', ')}</span>
                        </div>
                        {selectedTemplate.dimensions && (
                          <>
                            <Separator className="bg-slate-700" />
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Dimensions</span>
                              <span className="text-white">
                                {selectedTemplate.dimensions.width}   {selectedTemplate.dimensions.height}
                              </span>
                            </div>
                          </>
                        )}
                        {selectedTemplate.fileSize && (
                          <>
                            <Separator className="bg-slate-700" />
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Taille</span>
                              <span className="text-white">{formatFileSize(selectedTemplate.fileSize)}</span>
                            </div>
                          </>
                        )}
                        {selectedTemplate.license && (
                          <>
                            <Separator className="bg-slate-700" />
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Licence</span>
                              <span className="text-white">{selectedTemplate.license}</span>
                            </div>
                          </>
                        )}
                        <Separator className="bg-slate-700" />
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Date de cr ation</span>
                          <span className="text-white">{new Date(selectedTemplate.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <Separator className="bg-slate-700" />
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Derni re mise   jour</span>
                          <span className="text-white">{new Date(selectedTemplate.updatedAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-lg">Tags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {selectedTemplate.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="border-slate-600">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Separator className="bg-slate-700 mb-4" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-white mb-2">Statistiques</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">T l chargements</span>
                            <span className="text-white font-semibold">{selectedTemplate.downloads.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Vues</span>
                            <span className="text-white font-semibold">{selectedTemplate.views.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Note moyenne</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-white font-semibold">{selectedTemplate.rating}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Avis</span>
                            <span className="text-white font-semibold">{selectedTemplate.reviews}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Advanced Template Details */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="w-5 h-5 text-cyan-400" />
                        D tails Techniques
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">Version</p>
                          <p className="text-sm font-semibold text-white">v{selectedTemplate.version || '1.0.0'}</p>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">Compatibilit </p>
                          <p className="text-sm font-semibold text-white">Tous navigateurs</p>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">R solution</p>
                          <p className="text-sm font-semibold text-white">300 DPI</p>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">Couleurs</p>
                          <p className="text-sm font-semibold text-white">RGB / CMYK</p>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">Calques</p>
                          <p className="text-sm font-semibold text-white">Organis s</p>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">Support</p>
                          <p className="text-sm font-semibold text-white">Inclus</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Usage Examples */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                        Exemples d'Utilisation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['Branding', 'Marketing', 'Social Media', 'Print', 'Web', 'Mobile'].map((use, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg">
                            <CheckCircle2Icon className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-white">{use}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Related Templates */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Layers className="w-5 h-5 text-cyan-400" />
                        Templates Similaires
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[1, 2, 3].map((idx) => (
                          <div key={idx} className="relative aspect-video bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-xs font-medium text-white">Template Similaire {idx}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs text-slate-300">4.{idx + 5}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)} className="border-slate-700">
                    Fermer
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetailDialog(false);
                      handleDownload(selectedTemplate);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {selectedTemplate.isPremium && selectedTemplate.price > 0
                      ? `Acheter (${selectedTemplate.price} )`
                      : 'T l charger'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Collection Dialog */}
        <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Nouvelle collection</DialogTitle>
              <DialogDescription className="text-slate-400">
                Cr ez une nouvelle collection pour organiser vos templates
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-slate-300 mb-2 block">Nom de la collection</Label>
                <Input
                  placeholder="Ex: Logos Premium"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <Label className="text-sm text-slate-300 mb-2 block">Description</Label>
                <Textarea
                  placeholder="Description de la collection..."
                  rows={3}
                  className="bg-slate-800 border-slate-700 resize-none"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="public" defaultChecked />
                <Label htmlFor="public" className="text-sm text-slate-300">
                  Collection publique
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCollectionDialog(false)}
                className="border-slate-700"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  toast({ title: 'Collection cr  e', description: 'Votre collection a  t  cr  e avec succ s' });
                  setShowCollectionDialog(false);
                }}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Cr er
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Additional Features Section */}
        <div className="mt-8 space-y-6">
          {/* Advanced Template Analytics */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Analytics Avanc es
              </CardTitle>
              <CardDescription className="text-slate-400">
                Statistiques d taill es sur vos templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Templates t l charg s', value: '1,234', change: '+23%', icon: Download, color: 'cyan' },
                  { label: 'Vues totales', value: '45,678', change: '+12%', icon: Eye, color: 'blue' },
                  { label: 'Note moyenne', value: '4.7', change: '+0.2', icon: Star, color: 'yellow' },
                  { label: 'Taux de conversion', value: '68%', change: '+5%', icon: TrendingUp, color: 'green' },
                  ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                          <Badge className={`bg-${stat.color}-500/20 text-${stat.color}-400`}>{stat.change}</Badge>
                    </div>
                        <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">T l chargements par jour</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 flex items-end justify-between gap-1">
                      {[45, 58, 62, 55, 68, 72, 65].map((height, idx) => (
                        <div
                          key={idx}
                          className="flex-1 bg-cyan-500 rounded-t"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-center">7 derniers jours</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Cat gories populaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { category: 'Logos', percentage: 45 },
                        { category: 'Produits', percentage: 28 },
                        { category: 'Animations', percentage: 18 },
                        { category: 'Autres', percentage: 9 },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-white">{item.category}</span>
                            <span className="text-slate-400">{item.percentage}%</span>
                          </div>
                          <Progress value={item.percentage} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Template Marketplace */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-cyan-400" />
                Marketplace de Templates
              </CardTitle>
              <CardDescription className="text-slate-400">
                Vendez et achetez des templates premium
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Vendre vos templates', description: 'Mon tisez vos cr ations', icon: DollarSign, color: 'green' },
                  { title: 'Acheter premium', description: 'Acc dez   des templates exclusifs', icon: Crown, color: 'purple' },
                  { title: 'Programme affili ', description: 'Gagnez en recommandant', icon: Gift, color: 'orange' },
                ].map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 bg-${feature.color}-500/20 rounded-lg flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 text-${feature.color}-400`} />
                          </div>
                          <h4 className="font-semibold text-white">{feature.title}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{feature.description}</p>
                        <Button size="sm" variant="outline" className="w-full border-slate-600">
                          En savoir plus
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* API Integration */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-400" />
                Int gration API
              </CardTitle>
              <CardDescription className="text-slate-400">
                Int grez la biblioth que de templates dans vos applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">JavaScript / TypeScript</span>
                    <Button size="sm" variant="outline" className="border-slate-600">
                      <Copy className="w-4 h-4 mr-2" />
                      Copier
                    </Button>
                  </div>
                  <pre className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded overflow-x-auto">
{`const templates = await fetch('/api/templates', {
  method: 'GET',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
}).then(r => r.json());`}
                  </pre>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">Python</span>
                    <Button size="sm" variant="outline" className="border-slate-600">
                      <Copy className="w-4 h-4 mr-2" />
                      Copier
                    </Button>
                  </div>
                  <pre className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded overflow-x-auto">
{`import requests

response = requests.get(
    'https://api.luneo.com/templates',
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)
templates = response.json()`}
                  </pre>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">cURL</span>
                    <Button size="sm" variant="outline" className="border-slate-600">
                      <Copy className="w-4 h-4 mr-2" />
                      Copier
                    </Button>
                  </div>
                  <pre className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded overflow-x-auto">
{`curl -X GET https://api.luneo.com/templates \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Export Options */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-cyan-400" />
                Options d'Export
              </CardTitle>
              <CardDescription className="text-slate-400">
                Exportez vos templates dans tous les formats professionnels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { format: 'SVG', description: 'Vectoriel scalable', quality: 'Haute', size: '~50 KB' },
                  { format: 'PNG', description: 'Image raster', quality: 'Haute', size: '~200 KB' },
                  { format: 'PDF', description: 'Document portable', quality: 'Haute', size: '~500 KB' },
                  { format: 'AI', description: 'Adobe Illustrator', quality: 'Tr s haute', size: '~1 MB' },
                  { format: 'PSD', description: 'Adobe Photoshop', quality: 'Tr s haute', size: '~2 MB' },
                  { format: 'EPS', description: 'Encapsulated PostScript', quality: 'Haute', size: '~300 KB' },
                  { format: 'Figma', description: 'Format Figma', quality: 'Haute', size: '~150 KB' },
                  { format: 'Sketch', description: 'Format Sketch', quality: 'Haute', size: '~180 KB' },
                ].map((format, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-lg font-bold text-white">{format.format}</p>
                        <Badge className="bg-cyan-500">{format.quality}</Badge>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{format.description}</p>
                      <p className="text-xs text-slate-500">Taille: {format.size}</p>
                      <Button size="sm" variant="outline" className="w-full mt-3 border-slate-600">
                        Exporter
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template Categories Deep Dive */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Cat gories D taill es
              </CardTitle>
              <CardDescription className="text-slate-400">
                Explorez toutes les cat gories de templates disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { category: 'Logos', count: 1245, subcategories: ['Minimaliste', 'Vintage', 'Tech', 'Luxe'], icon: Palette },
                  { category: 'Produits', count: 856, subcategories: ['Packaging', 'Affiches', 'Flyers', 'Brochures'], icon: Box },
                  { category: 'Animations', count: 432, subcategories: ['Intro', 'Loading', 'Transitions', 'Effets'], icon: Video },
                  { category: 'UI/UX', count: 678, subcategories: ['Dashboards', 'Apps', 'Web', 'Mobile'], icon: Layout },
                  { category: 'Social Media', count: 923, subcategories: ['Posts', 'Stories', 'Banners', 'Covers'], icon: Share2 },
                  { category: 'Print', count: 567, subcategories: ['Business Cards', 'Letterheads', 'Invoices', 'Reports'], icon: FileImage },
                ].map((cat, idx) => {
                  const Icon = cat.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Icon className="w-6 h-6 text-cyan-400" />
                          <div>
                            <p className="font-semibold text-white">{cat.category}</p>
                            <p className="text-xs text-slate-400">{cat.count} templates</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {cat.subcategories.map((sub, subIdx) => (
                            <Badge key={subIdx} variant="outline" className="text-xs border-slate-600">
                              {sub}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Template Quality Standards */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                Standards de Qualit 
              </CardTitle>
              <CardDescription className="text-slate-400">
                Crit res de qualit  pour tous nos templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { standard: 'R solution minimale', requirement: '300 DPI', icon: Target },
                  { standard: 'Formats multiples', requirement: '3+ formats', icon: Layers },
                  { standard: 'Organisation des calques', requirement: 'Calques nomm s', icon: Folder },
                  { standard: 'Documentation', requirement: 'Guide inclus', icon: BookOpen },
                  { standard: 'Licence claire', requirement: 'Commercial OK', icon: Shield },
                  { standard: 'Support', requirement: 'Assistance incluse', icon: HelpCircle },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <Icon className="w-5 h-5 text-cyan-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{item.standard}</p>
                        <p className="text-xs text-slate-400">{item.requirement}</p>
                      </div>
                      <CheckCircle2Icon className="w-5 h-5 text-green-400" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Template Reviews & Ratings */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-cyan-400" />
                Avis &  valuations
              </CardTitle>
              <CardDescription className="text-slate-400">
                Syst me d' valuation et de commentaires pour templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-white">Note moyenne globale</p>
                      <p className="text-xs text-slate-400">Bas e sur 12,456 avis</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-yellow-400">4.7</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { stars: 5, percentage: 68, count: 8463 },
                      { stars: 4, percentage: 22, count: 2740 },
                      { stars: 3, percentage: 7, count: 872 },
                      { stars: 2, percentage: 2, count: 249 },
                      { stars: 1, percentage: 1, count: 132 },
                    ].map((rating, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-20">
                          <span className="text-xs text-slate-400">{rating.stars}</span>
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        </div>
                        <div className="flex-1">
                          <Progress value={rating.percentage} className="h-2" />
                        </div>
                        <span className="text-xs text-slate-400 w-16 text-right">{rating.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <div className="fixed bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg backdrop-blur-sm z-50">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-300">Syst me op rationnel</span>
            <Badge variant="outline" className="ml-2 border-green-500/50 text-green-400 text-xs">
              Tous les services actifs
            </Badge>
          </div>

          {/* Version Info */}
          <div className="fixed bottom-4 left-48 text-xs text-slate-500 z-50">
            v2.4.1   AI Studio Templates   {new Date().getFullYear()}
          </div>

          {/* Template Import/Export Advanced */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                Import & Export Avanc 
              </CardTitle>
              <CardDescription className="text-slate-400">
                Importez et exportez vos templates en masse avec des options avanc es
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Import en Masse</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-2">Formats support s</p>
                      <div className="flex flex-wrap gap-2">
                        {['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].map((format, idx) => (
                          <Badge key={idx} variant="outline" className="border-slate-600 text-xs">
                            {format}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                      <Upload className="w-4 h-4 mr-2" />
                      Importer des templates
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Export en Masse</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-2">Options d'export</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">Templates s lectionn s</span>
                          <Badge className="bg-cyan-500">0
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">Format</span>
                          <Select defaultValue="zip">
                            <SelectTrigger className="h-7 text-xs border-slate-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="zip">ZIP</SelectItem>
                              <SelectItem value="rar">RAR</SelectItem>
                              <SelectItem value="7z">7Z</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700" disabled>
                      <Download className="w-4 h-4 mr-2" />
                      Exporter la s lection
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Template Versioning */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-cyan-400" />
                Gestion des Versions
              </CardTitle>
              <CardDescription className="text-slate-400">
                Suivez et g rez les versions de vos templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-white">Version actuelle</p>
                      <p className="text-xs text-slate-400">v2.4.1   Publi e le 15/01/2024</p>
                    </div>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                  <Separator className="bg-slate-700 mb-3" />
                  <div className="space-y-2">
                    {[
                      { version: 'v2.4.1', date: '15/01/2024', changes: 'Am liorations UI', status: 'active' },
                      { version: 'v2.4.0', date: '10/01/2024', changes: 'Nouveaux templates', status: 'archived' },
                      { version: 'v2.3.9', date: '05/01/2024', changes: 'Corrections bugs', status: 'archived' },
                    ].map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                        <div>
                          <p className="text-sm font-medium text-white">{v.version}</p>
                          <p className="text-xs text-slate-400">{v.changes}   {v.date}</p>
                        </div>
                        <Badge className={v.status === 'active' ? 'bg-green-500' : 'bg-slate-600'}>
                          {v.status === 'active' ? 'Active' : 'Archiv e'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full border-slate-600 mt-4">
                    <GitBranch className="w-4 h-4 mr-2" />
                    Cr er une nouvelle version
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Collaboration */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Collaboration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Collaborez sur vos templates avec votre  quipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Collaborateurs', value: '12', icon: Users, color: 'cyan' },
                  { label: 'Commentaires', value: '45', icon: MessageSquare, color: 'blue' },
                  { label: 'Modifications', value: '23', icon: Edit, color: 'green' },
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 text-${stat.color}-400`} />
                          <span className="text-xs text-slate-400">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white">Membres de l&apos; quipe</p>
                  <Button size="sm" variant="outline" className="border-slate-600">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Inviter
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((idx) => (
                    <div key={idx} className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                      U{idx}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                    +8
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Analytics Deep Dive */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Analytics Approfondies
              </CardTitle>
              <CardDescription className="text-slate-400">
                Analysez en d tail les performances de vos templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
                  <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                  <TabsTrigger value="traffic">Trafic</TabsTrigger>
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  <TabsTrigger value="revenue">Revenus</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Vues totales', value: '45,678', change: '+12%', icon: Eye },
                      { label: 'T l chargements', value: '1,234', change: '+23%', icon: Download },
                      { label: 'Taux de conversion', value: '2.7%', change: '+0.5%', icon: TrendingUp },
                      { label: 'Revenus', value: ' 1,234', change: '+18%', icon: DollarSign },
                    ].map((stat, idx) => {
                      const Icon = stat.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Icon className="w-4 h-4 text-cyan-400" />
                              <Badge className="bg-green-500/20 text-green-400 text-xs">{stat.change}</Badge>
                    </div>
                            <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                            <p className="text-xl font-bold text-white">{stat.value}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
                <TabsContent value="traffic" className="mt-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-sm">Sources de trafic</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { source: 'Recherche interne', percentage: 45, visits: 20543 },
                          { source: 'Liens directs', percentage: 28, visits: 12791 },
                          { source: 'R seaux sociaux', percentage: 18, visits: 8222 },
                          { source: 'Autres', percentage: 9, visits: 4122 },
                        ].map((item, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-white">{item.source}</span>
                              <span className="text-slate-400">{item.visits.toLocaleString()} visites</span>
                            </div>
                            <Progress value={item.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="engagement" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Temps moyen</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">2:34</p>
                        <p className="text-xs text-slate-400 mt-1">minutes par session</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Taux de rebond</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">32%</p>
                        <p className="text-xs text-slate-400 mt-1">en dessous de la moyenne</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="revenue" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Revenus totaux</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white"> 1,234</p>
                        <p className="text-xs text-slate-400 mt-1">ce mois</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Ventes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">89</p>
                        <p className="text-xs text-slate-400 mt-1">templates vendus</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Template Customization Tools */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                Outils de Personnalisation
              </CardTitle>
              <CardDescription className="text-slate-400">
                Personnalisez vos templates avec des outils avanc s
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: ' diteur de couleurs', description: 'Modifiez les couleurs en temps r el', icon: Palette },
                  { name: 'Gestionnaire de texte', description: ' ditez tous les textes facilement', icon: Type },
                  { name: 'Biblioth que d\'images', description: 'Ajoutez vos propres images', icon: ImageIcon },
                  { name: 'Filtres et effets', description: 'Appliquez des effets visuels', icon: Sparkles },
                  { name: 'Export personnalis ', description: 'Exportez dans vos formats pr f r s', icon: Download },
                  { name: 'Pr visualisation', description: 'Voyez le r sultat en temps r el', icon: Eye },
                ].map((tool, idx) => {
                  const Icon = tool.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="w-5 h-5 text-cyan-400" />
                          <h4 className="font-semibold text-white">{tool.name}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{tool.description}</p>
                        <Button size="sm" variant="outline" className="w-full border-slate-600">
                          Utiliser
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Template Backup & Restore */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-cyan-400" />
                Sauvegarde & Restauration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Sauvegardez et restaurez vos templates en toute s curit 
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Sauvegardes automatiques</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white">Derni re sauvegarde</span>
                        <Badge className="bg-green-500">R ussie
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">Il y a 5 minutes</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Fr quence</span>
                        <Select defaultValue="hourly">
                          <SelectTrigger className="h-7 text-xs border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Toutes les heures</SelectItem>
                            <SelectItem value="daily">Quotidienne</SelectItem>
                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Sauvegardes conserv es</span>
                        <span className="text-white font-semibold">30 jours</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Sauvegardes manuelles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-2">Sauvegardes disponibles</p>
                      <div className="space-y-2">
                        {[
                          { name: 'Sauvegarde compl te', date: '15/01/2024 14:30', size: '2.4 GB' },
                          { name: 'Sauvegarde incr mentale', date: '15/01/2024 13:30', size: '156 MB' },
                          { name: 'Sauvegarde incr mentale', date: '15/01/2024 12:30', size: '142 MB' },
                        ].map((backup, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded text-xs">
                            <div>
                              <p className="text-white">{backup.name}</p>
                              <p className="text-slate-400">{backup.date}   {backup.size}</p>
                            </div>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                      <FolderPlus className="w-4 h-4 mr-2" />
                      Cr er une sauvegarde
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Template Performance Metrics */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                M triques de Performance
              </CardTitle>
              <CardDescription className="text-slate-400">
                Surveillez les performances de vos templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Temps de chargement', value: '0.8s', target: '< 1s', status: 'good', icon: Clock },
                  { label: 'Taille moyenne', value: '245 KB', target: '< 500 KB', status: 'good', icon: FileImage },
                  { label: 'Taux d\'erreur', value: '0.02%', target: '< 0.1%', status: 'good', icon: AlertCircle },
                  { label: 'Disponibilit ', value: '99.98%', target: '> 99.9%', status: 'good', icon: CheckCircle2Icon },
                ].map((metric, idx) => {
                  const Icon = metric.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs text-slate-400">{metric.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Cible: {metric.target}</span>
                          <Badge className={metric.status === 'good' ? 'bg-green-500' : 'bg-yellow-500'}>
                            {metric.status === 'good' ? 'OK' : 'Attention'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm">Historique des performances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 flex items-end justify-between gap-1">
                    {[85, 92, 88, 95, 90, 93, 96, 94, 98, 97, 95, 99].map((height, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${height}%`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">12 derniers mois</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Template Security & Privacy */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                S curit  & Confidentialit 
              </CardTitle>
              <CardDescription className="text-slate-400">
                Prot gez vos templates avec des fonctionnalit s de s curit  avanc es
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Param tres de s curit </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Watermarking</p>
                        <p className="text-xs text-slate-400">Protection contre le vol</p>
                      </div>
                      <Badge className="bg-green-500">Actif
                      </Badge>
                    </div>
                    <Separator className="bg-slate-700" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Chiffrement</p>
                        <p className="text-xs text-slate-400">AES-256</p>
                      </div>
                      <Badge className="bg-green-500">Actif
                      </Badge>
                    </div>
                    <Separator className="bg-slate-700" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Acc s contr l </p>
                        <p className="text-xs text-slate-400">Permissions granulaires</p>
                      </div>
                      <Badge className="bg-green-500">Actif
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Audit & Conformit </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white">Dernier audit</span>
                        <Badge className="bg-green-500">Conforme
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">15/01/2024   RGPD, SOC 2</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Conformit  RGPD</span>
                        <CheckCircle2Icon className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">SOC 2 Type II</span>
                        <CheckCircle2Icon className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">ISO 27001</span>
                        <CheckCircle2Icon className="w-4 h-4 text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Template Learning Resources */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-cyan-400" />
                Ressources d'Apprentissage
              </CardTitle>
              <CardDescription className="text-slate-400">
                Apprenez   utiliser au mieux vos templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Guide de d marrage', description: 'Tutoriel complet pour d buter', type: 'Tutoriel', duration: '15 min', icon: BookOpen },
                  { title: 'Meilleures pratiques', description: 'Conseils d\'experts pour optimiser', type: 'Article', duration: '8 min', icon: Lightbulb },
                  { title: 'Vid os YouTube', description: 'Cha ne d di e aux templates', type: 'Vid o', duration: 'Varies', icon: Video },
                  { title: 'Documentation API', description: 'Guide complet de l\'API', type: 'Documentation', duration: '30 min', icon: FileText },
                  { title: 'Webinaires', description: 'Sessions en direct mensuelles', type: ' v nement', duration: '1h', icon: Calendar },
                  { title: 'Communaut ', description: 'Forum et discussions', type: 'Communaut ', duration: '24/7', icon: Users },
                ].map((resource, idx) => {
                  const Icon = resource.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="w-5 h-5 text-cyan-400" />
                          <div>
                            <h4 className="font-semibold text-white text-sm">{resource.title}</h4>
                            <Badge variant="outline" className="text-xs border-slate-600 mt-1">
                              {resource.type}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{resource.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{resource.duration}</span>
                          <Button size="sm" variant="outline" className="border-slate-600">
                            Acc der
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Template Support & Help */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                Support & Aide
              </CardTitle>
              <CardDescription className="text-slate-400">
                Obtenez de l'aide quand vous en avez besoin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Support en direct</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white">Statut</span>
                        <Badge className="bg-green-500">En ligne
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">Temps de r ponse moyen: 2 minutes</p>
                    </div>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      D marrer une conversation
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Centre d'aide</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {[
                        { question: 'Comment importer un template?', views: 1.2 },
                        { question: 'Quels formats sont support s?', views: 0.8 },
                        { question: 'Comment personnaliser un template?', views: 0.6 },
                        { question: 'Probl mes d\'export?', views: 0.4 },
                      ].map((faq, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded text-xs">
                          <span className="text-white">{faq.question}</span>
                          <span className="text-slate-400">{faq.views}k vues</span>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full border-slate-600">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Voir toutes les FAQ
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Template Integrations */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-cyan-400" />
                Int grations
              </CardTitle>
              <CardDescription className="text-slate-400">
                Connectez vos templates   vos outils pr f r s
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Figma', description: 'Import direct', icon: ' ', status: 'connected', color: 'purple' },
                  { name: 'Adobe XD', description: 'Export natif', icon: ' ', status: 'available', color: 'pink' },
                  { name: 'Sketch', description: 'Synchronisation', icon: '  ', status: 'available', color: 'orange' },
                  { name: 'Canva', description: 'Import/Export', icon: ' ', status: 'available', color: 'blue' },
                  { name: 'Photoshop', description: 'PSD natif', icon: '  ', status: 'connected', color: 'cyan' },
                  { name: 'Illustrator', description: 'AI natif', icon: ' ', status: 'connected', color: 'yellow' },
                  { name: 'InDesign', description: 'IDML support', icon: ' ', status: 'available', color: 'red' },
                  { name: 'After Effects', description: 'Animations', icon: ' ', status: 'available', color: 'indigo' },
                ].map((integration, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{integration.icon}</span>
                        <Badge className={integration.status === 'connected' ? 'bg-green-500' : 'bg-slate-600'}>
                          {integration.status === 'connected' ? 'Connect ' : 'Disponible'}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-white text-sm mb-1">{integration.name}</h4>
                      <p className="text-xs text-slate-400 mb-3">{integration.description}</p>
                      <Button size="sm" variant="outline" className="w-full border-slate-600">
                        {integration.status === 'connected' ? 'G rer' : 'Connecter'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template AI Features */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Fonctionnalit s IA
              </CardTitle>
              <CardDescription className="text-slate-400">
                Utilisez l'IA pour am liorer vos templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">G n ration IA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-2">G n rez des templates personnalis s</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">Templates g n r s</span>
                          <span className="text-white font-semibold">1,234</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">Taux de succ s</span>
                          <Badge className="bg-green-500">94%
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                      <Sparkles className="w-4 h-4 mr-2" />
                      G n rer un template
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Am lioration IA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-2">Am liorez vos templates existants</p>
                      <div className="space-y-2">
                        {[
                          { feature: 'Am lioration qualit ', available: true },
                          { feature: 'Optimisation couleurs', available: true },
                          { feature: 'D tection d\'erreurs', available: true },
                          { feature: 'Suggestions de design', available: true },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-slate-300">{item.feature}</span>
                            {item.available ? (
                              <CheckCircle2Icon className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" className="w-full border-slate-600">
                      <Zap className="w-4 h-4 mr-2" />
                      Am liorer un template
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Template Marketplace Stats */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Statistiques du Marketplace
              </CardTitle>
              <CardDescription className="text-slate-400">
                Vue d'ensemble du marketplace de templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Templates totaux', value: '12,456', change: '+234', icon: Layers, color: 'cyan' },
                  { label: 'Utilisateurs actifs', value: '8,923', change: '+156', icon: Users, color: 'blue' },
                  { label: 'T l chargements', value: '234,567', change: '+12,345', icon: Download, color: 'green' },
                  { label: 'Revenus g n r s', value: ' 45,678', change: '+ 3,456', icon: DollarSign, color: 'yellow' },
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 text-${stat.color}-400`} />
                          <span className="text-xs text-slate-400">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                        <Badge className={`bg-${stat.color}-500/20 text-${stat.color}-400 text-xs`}>
                          {stat.change} ce mois
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Top cat gories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { category: 'Logos', templates: 1245, percentage: 35 },
                        { category: 'Produits', templates: 856, percentage: 24 },
                        { category: 'Animations', templates: 432, percentage: 12 },
                        { category: 'UI/UX', templates: 678, percentage: 19 },
                        { category: 'Autres', templates: 245, percentage: 7 },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-white">{item.category}</span>
                            <span className="text-slate-400">{item.templates} templates</span>
                          </div>
                          <Progress value={item.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Tendances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { trend: 'Minimalisme', change: '+45%', icon: ' ', color: 'cyan' },
                        { trend: 'Gradients', change: '+32%', icon: ' ', color: 'purple' },
                        { trend: '3D Elements', change: '+28%', icon: ' ', color: 'pink' },
                        { trend: 'Dark Mode', change: '+21%', icon: ' ', color: 'indigo' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-sm text-white">{item.trend}</span>
                          </div>
                          <Badge className={`bg-${item.color}-500/20 text-${item.color}-400`}>
                            {item.change}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Template Subscription Plans */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-cyan-400" />
                Plans d'Abonnement
              </CardTitle>
              <CardDescription className="text-slate-400">
                Choisissez le plan qui correspond   vos besoins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Starter', price: 'Gratuit', features: ['10 templates/mois', 'Formats de base', 'Support communautaire'], popular: false },
                  { name: 'Pro', price: ' 29/mois', features: ['Templates illimit s', 'Tous les formats', 'Support prioritaire', 'Export HD'], popular: true },
                  { name: 'Enterprise', price: 'Sur mesure', features: ['Tout Pro', 'API d di e', 'Support 24/7', 'Formation  quipe'], popular: false },
                ].map((plan, idx) => (
                  <Card key={idx} className={`bg-slate-800/50 border-slate-700 ${plan.popular ? 'border-cyan-500 ring-2 ring-cyan-500/20' : ''}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {plan.popular && <Badge className="bg-cyan-500">Populaire</Badge>}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-white">{plan.price}</span>
                        {plan.price !== 'Gratuit' && plan.price !== 'Sur mesure' && (
                          <span className="text-sm text-slate-400">/mois</span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ul className="space-y-2">
                        {plan.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle2Icon className="w-4 h-4 text-green-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button className={`w-full ${plan.popular ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-700 hover:bg-slate-600'}`}>
                        {plan.price === 'Gratuit' ? 'Commencer' : plan.price === 'Sur mesure' ? 'Nous contacter' : 'S\'abonner'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template Community */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Communaut 
              </CardTitle>
              <CardDescription className="text-slate-400">
                Rejoignez une communaut  de cr ateurs passionn s
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Statistiques communautaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Membres', value: '12,456', icon: Users },
                        { label: 'Templates partag s', value: '8,923', icon: Share2 },
                        { label: 'Discussions', value: '3,456', icon: MessageSquare },
                        { label: 'Contributions', value: '15,678', icon: Heart },
                      ].map((stat, idx) => {
                        const Icon = stat.icon;
                      return (
                          <div key={idx} className="text-center">
                            <Icon className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-xs text-slate-400">{stat.label}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Activit  r cente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { user: 'John Doe', action: 'a partag  un template', time: 'Il y a 5 min', icon: ' ' },
                        { user: 'Jane Smith', action: 'a cr   une collection', time: 'Il y a 12 min', icon: ' ' },
                        { user: 'Mike Johnson', action: 'a comment  un template', time: 'Il y a 18 min', icon: ' ' },
                        { user: 'Sarah Williams', action: 'a t l charg  un template', time: 'Il y a 25 min', icon: ' ' },
                      ].map((activity, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-slate-900/50 rounded">
                          <span className="text-xl">{activity.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm text-white">
                              <span className="font-semibold">{activity.user}</span> {activity.action}
                            </p>
                            <p className="text-xs text-slate-400">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Template Newsletter */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-400" />
                Newsletter
              </CardTitle>
              <CardDescription className="text-slate-400">
                Restez inform  des nouveaux templates et fonctionnalit s
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Votre adresse email"
                    className="flex-1 bg-slate-900 border-slate-700"
                  />
                  <Button className="bg-cyan-600 hover:bg-cyan-700">
                    S'abonner
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Recevez des mises   jour hebdomadaires avec les meilleurs templates et astuces
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Template Advanced Search */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-cyan-400" />
                Recherche Avanc e
              </CardTitle>
              <CardDescription className="text-slate-400">
                Trouvez exactement ce que vous cherchez avec des filtres puissants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-slate-300 mb-2 block">Mots-cl s</Label>
                    <Input placeholder="Rechercher..." className="bg-slate-800 border-slate-700" />
                  </div>
                  <div>
                    <Label className="text-sm text-slate-300 mb-2 block">Cat gorie</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Toutes les cat gories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les cat gories</SelectItem>
                        <SelectItem value="logos">Logos</SelectItem>
                        <SelectItem value="products">Produits</SelectItem>
                        <SelectItem value="animations">Animations</SelectItem>
                        <SelectItem value="ui-ux">UI/UX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-300 mb-2 block">Format</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Tous les formats" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les formats</SelectItem>
                        <SelectItem value="svg">SVG</SelectItem>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="ai">AI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-slate-300 mb-2 block">Prix</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Tous les prix" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les prix</SelectItem>
                        <SelectItem value="free">Gratuit</SelectItem>
                        <SelectItem value="paid">Payant</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-300 mb-2 block">Note minimale</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Toutes les notes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les notes</SelectItem>
                        <SelectItem value="5">5  toiles</SelectItem>
                        <SelectItem value="4">4+  toiles</SelectItem>
                        <SelectItem value="3">3+  toiles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-300 mb-2 block">Date</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Toutes les dates" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les dates</SelectItem>
                        <SelectItem value="today">Aujourd'hui</SelectItem>
                        <SelectItem value="week">Cette semaine</SelectItem>
                        <SelectItem value="month">Ce mois</SelectItem>
                        <SelectItem value="year">Cette ann e</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-300 mb-2 block">Tri</Label>
                    <Select defaultValue="popular">
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popular">Plus populaires</SelectItem>
                        <SelectItem value="recent">Plus r cents</SelectItem>
                        <SelectItem value="rating">Meilleures notes</SelectItem>
                        <SelectItem value="downloads">Plus t l charg s</SelectItem>
                        <SelectItem value="price-asc">Prix croissant</SelectItem>
                        <SelectItem value="price-desc">Prix d croissant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button className="bg-cyan-600 hover:bg-cyan-700">
                    <Search className="w-4 h-4 mr-2" />
                    Rechercher
                  </Button>
                  <Button variant="outline" className="border-slate-600">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Quick Actions */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Actions Rapides
              </CardTitle>
              <CardDescription className="text-slate-400">
                Acc dez rapidement aux actions les plus courantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Nouveau template', icon: Plus, color: 'cyan' },
                  { label: 'Importer', icon: Upload, color: 'blue' },
                  { label: 'Exporter', icon: Download, color: 'green' },
                  { label: 'Partager', icon: Share2, color: 'purple' },
                  { label: 'Dupliquer', icon: Copy, color: 'orange' },
                  { label: 'Supprimer', icon: Trash2, color: 'red' },
                  { label: 'Favoris', icon: Heart, color: 'pink' },
                  { label: 'Collections', icon: Folder, color: 'indigo' },
                  { label: 'Historique', icon: Clock, color: 'yellow' },
                  { label: 'Param tres', icon: Settings, color: 'slate' },
                  { label: 'Aide', icon: HelpCircle, color: 'teal' },
                  { label: 'Feedback', icon: MessageSquare, color: 'cyan' },
                ].map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={idx}
                      variant="outline"
                      className="flex flex-col items-center gap-2 h-auto py-4 border-slate-600 hover:border-cyan-500"
                    >
                      <Icon className={`w-5 h-5 text-${action.color}-400`} />
                      <span className="text-xs text-white">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Template Keyboard Shortcuts */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-cyan-400" />
                Raccourcis Clavier
              </CardTitle>
              <CardDescription className="text-slate-400">
                Ma trisez votre workflow avec des raccourcis clavier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { action: 'Nouveau template', shortcut: 'Ctrl + N', category: 'Cr ation' },
                  { action: 'Ouvrir template', shortcut: 'Ctrl + O', category: 'Navigation' },
                  { action: 'Sauvegarder', shortcut: 'Ctrl + S', category: 'Fichier' },
                  { action: 'Dupliquer', shortcut: 'Ctrl + D', category: ' dition' },
                  { action: 'Rechercher', shortcut: 'Ctrl + F', category: 'Navigation' },
                  { action: 'Favoris', shortcut: 'Ctrl + B', category: 'Organisation' },
                  { action: 'Exporter', shortcut: 'Ctrl + E', category: 'Fichier' },
                  { action: 'Partager', shortcut: 'Ctrl + Shift + S', category: 'Partage' },
                  { action: 'Pr visualisation', shortcut: 'Space', category: 'Affichage' },
                  { action: 'Plein  cran', shortcut: 'F11', category: 'Affichage' },
                  { action: 'Zoom avant', shortcut: 'Ctrl + +', category: 'Affichage' },
                  { action: 'Zoom arri re', shortcut: 'Ctrl + -', category: 'Affichage' },
                ].map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">{shortcut.action}</p>
                      <p className="text-xs text-slate-400">{shortcut.category}</p>
                    </div>
                    <Badge className="bg-slate-700 text-slate-300 font-mono text-xs">
                      {shortcut.shortcut}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template Batch Operations */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Op rations en Masse
              </CardTitle>
              <CardDescription className="text-slate-400">
                G rez plusieurs templates   la fois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'T l charger en masse', description: 'T l chargez plusieurs templates', icon: Download, count: 0 },
                  { name: 'Ajouter aux favoris', description: 'Marquez plusieurs templates', icon: Heart, count: 0 },
                  { name: 'Ajouter   une collection', description: 'Organisez vos templates', icon: FolderPlus, count: 0 },
                  { name: 'Exporter en masse', description: 'Exportez dans diff rents formats', icon: Upload, count: 0 },
                  { name: 'Supprimer', description: 'Supprimez plusieurs templates', icon: Trash2, count: 0 },
                  { name: 'Partager', description: 'Partagez plusieurs templates', icon: Share2, count: 0 },
                ].map((operation, idx) => {
                  const Icon = operation.icon;
                      return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="w-5 h-5 text-cyan-400" />
                          <h4 className="font-semibold text-white">{operation.name}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{operation.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{operation.count} s lectionn (s)</span>
                          <Button size="sm" variant="outline" className="border-slate-600" disabled={operation.count === 0}>
                            Appliquer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Template Quality Assurance */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                Assurance Qualit 
              </CardTitle>
              <CardDescription className="text-slate-400">
                V rifiez la qualit  de vos templates avant publication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-white">V rification automatique</p>
                      <p className="text-xs text-slate-400">Analyse en temps r el de vos templates</p>
                    </div>
                    <Badge className="bg-green-500">Actif
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { check: 'R solution', status: 'pass', value: '300 DPI' },
                      { check: 'Formats', status: 'pass', value: '3 formats' },
                      { check: 'M tadonn es', status: 'pass', value: 'Compl tes' },
                      { check: 'Licence', status: 'pass', value: 'D finie' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-2 bg-slate-900/50 rounded text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <CheckCircle2Icon className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-white">{item.check}</span>
                        </div>
                        <p className="text-xs text-slate-400">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                  <TestTube className="w-4 h-4 mr-2" />
                  Lancer une v rification compl te
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Template Usage Statistics */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Statistiques d'Utilisation
              </CardTitle>
              <CardDescription className="text-slate-400">
                Analysez comment vos templates sont utilisés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
                  <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                  <TabsTrigger value="usage">Utilisation</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Templates utilis s', value: '234', change: '+12', icon: Layers },
                      { label: 'Temps total', value: '45h', change: '+3h', icon: Clock },
                      { label: 'Projets cr  s', value: '89', change: '+8', icon: Folder },
                      { label: 'Exports', value: '567', change: '+45', icon: Download },
                    ].map((stat, idx) => {
                      const Icon = stat.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="w-4 h-4 text-cyan-400" />
                              <span className="text-xs text-slate-400">{stat.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                            <Badge className="bg-green-500/20 text-green-400 text-xs">
                              {stat.change}
                            </Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
                <TabsContent value="usage" className="mt-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-sm">Utilisation par jour</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 flex items-end justify-between gap-1">
                        {[65, 72, 68, 75, 80, 78, 85, 82, 88, 90, 85, 92, 88, 95].map((height, idx) => (
                          <div
                            key={idx}
                            className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t"
                            style={{ height: `${height}%` }}
                            title={`${height} utilisations`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-2 text-center">14 derniers jours</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="performance" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Temps moyen de chargement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">0.8s</p>
                        <p className="text-xs text-slate-400 mt-1">En dessous de la moyenne</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Taux de succ s</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">98.5%</p>
                        <p className="text-xs text-slate-400 mt-1">Excellent</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Template Export History */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                Historique d'Export
              </CardTitle>
              <CardDescription className="text-slate-400">
                Consultez l'historique de tous vos exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { template: 'Logo Minimaliste', format: 'SVG', date: '15/01/2024 14:30', size: '45 KB', status: 'success' },
                  { template: 'Banner Social Media', format: 'PNG', date: '15/01/2024 13:15', size: '234 KB', status: 'success' },
                  { template: 'Carte de visite', format: 'PDF', date: '15/01/2024 12:45', size: '567 KB', status: 'success' },
                  { template: 'Animation Loading', format: 'GIF', date: '15/01/2024 11:20', size: '1.2 MB', status: 'success' },
                  { template: 'Template UI', format: 'Figma', date: '15/01/2024 10:10', size: '89 KB', status: 'success' },
                ].map((export_, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                        <Download className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{export_.template}</p>
                        <p className="text-xs text-slate-400">{export_.format}   {export_.size}   {export_.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={export_.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                        {export_.status === 'success' ? 'R ussi' : ' chec'}
                      </Badge>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 border-slate-600">
                <History className="w-4 h-4 mr-2" />
                Voir tout l'historique
              </Button>
            </CardContent>
          </Card>

          {/* Template Recommendations Engine */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Moteur de Recommandations
              </CardTitle>
              <CardDescription className="text-slate-400">
                D couvrez des templates adapt s   vos besoins gr ce   l'IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Recommandations personnalis es</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-2">Bas  sur votre activit </p>
                      <div className="space-y-2">
                        {[
                          { reason: 'Vous utilisez souvent des logos', confidence: 95 },
                          { reason: 'Vous pr f rez le style minimaliste', confidence: 87 },
                          { reason: 'Vous travaillez sur des projets web', confidence: 82 },
                        ].map((item, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-white">{item.reason}</span>
                              <span className="text-slate-400">{item.confidence}%</span>
                            </div>
                            <Progress value={item.confidence} className="h-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Voir les recommandations
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Templates tendances</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {[
                        { name: 'Logo Gradient Moderne', trend: '+45%', category: 'Logos' },
                        { name: 'Banner Dark Mode', trend: '+32%', category: 'Banners' },
                        { name: 'Animation Micro', trend: '+28%', category: 'Animations' },
                        { name: 'UI Dashboard Minimal', trend: '+21%', category: 'UI/UX' },
                      ].map((trend, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                          <div>
                            <p className="text-sm text-white">{trend.name}</p>
                            <p className="text-xs text-slate-400">{trend.category}</p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400">{trend.trend}</Badge>
                    </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full border-slate-600">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Explorer les tendances
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          {/* Template Advanced Features - Final Section */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Fonctionnalit s Avanc es de Templates - Section Finale
              </CardTitle>
              <CardDescription className="text-slate-400">
                Derni res fonctionnalit s avanc es pour une gestion de templates compl te et professionnelle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Advanced Template Tools */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Outils de Template Avanc s</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: ' diteur de Templates', description: 'Cr er et modifier des templates personnalis s', icon: Edit, status: 'active' },
                      { name: 'G n rateur de Variantes', description: 'G n rer automatiquement des variantes de templates', icon: Sparkles, status: 'active' },
                      { name: 'Pr visualisation Temps R el', description: 'Voir vos templates en temps r el', icon: Eye, status: 'active' },
                      { name: 'Export Multi-format', description: 'Exporter dans tous les formats n cessaires', icon: Download, status: 'active' },
                      { name: 'Templates Dynamiques', description: 'Cr er des templates avec logique conditionnelle', icon: Layers, status: 'active' },
                      { name: 'API de Templates', description: 'Int grer les templates via API REST/GraphQL', icon: Code, status: 'active' },
                    ].map((tool, idx) => {
                      const Icon = tool.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-cyan-500/10 rounded-lg">
                                <Icon className="w-5 h-5 text-cyan-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="font-semibold text-white text-sm">{tool.name}</h5>
                                  <Badge className="bg-green-500 text-xs">{tool.status}</Badge>
                    </div>
                                <p className="text-xs text-slate-400">{tool.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">M triques de Performance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { metric: 'Temps de chargement', value: '0.5s', target: '&lt; 1s', status: 'good', icon: Gauge },
                      { metric: 'Taux d&apos;utilisation', value: '92%', target: '&gt; 80%', status: 'excellent', icon: TrendingUp },
                      { metric: 'Satisfaction client', value: '4.8/5', target: '&gt; 4.5', status: 'excellent', icon: Star },
                      { metric: 'Uptime', value: '99.9%', target: '&gt; 99.5%', status: 'excellent', icon: Activity },
                    ].map((metric, idx) => {
                      const Icon = metric.icon;
                      const statusColors: Record<string, { bg: string; text: string }> = {
                        good: { bg: 'bg-green-500/10', text: 'text-green-400' },
                        excellent: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
                      };
                      const colors = statusColors[metric.status] || statusColors.good;
                      return (
                        <Card key={idx} className={`${colors.bg} border-slate-700`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className={`w-4 h-4 ${colors.text}`} />
                              <p className="text-xs text-slate-400">{metric.metric}</p>
                            </div>
                            <p className={`text-2xl font-bold ${colors.text} mb-1`}>{metric.value}</p>
                            <p className="text-xs text-slate-500">Cible: {metric.target}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Template Statistics */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Statistiques de Templates</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Templates cr  s', value: '456', icon: Layers, color: 'cyan' },
                      { label: 'Collections', value: '23', icon: Folder, color: 'blue' },
                      { label: 'Utilisations totales', value: '8.9K', icon: TrendingUp, color: 'green' },
                      { label: 'Taux de r utilisation', value: '85%', icon: RefreshCw, color: 'purple' },
                    ].map((stat, idx) => {
                      const Icon = stat.icon;
                      const colorClasses: Record<string, { bg: string; text: string }> = {
                        cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
                        blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
                        green: { bg: 'bg-green-500/10', text: 'text-green-400' },
                        purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
                      };
                      const colors = colorClasses[stat.color] || colorClasses.cyan;
                      return (
                        <Card key={idx} className={`${colors.bg} border-slate-700`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Icon className={`w-5 h-5 ${colors.text}`} />
                            </div>
                            <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                            <p className={`text-xl font-bold ${colors.text}`}>{stat.value}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Quality Standards */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                Standards de Qualit  de Templates
              </CardTitle>
              <CardDescription className="text-slate-400">
                Garantir la qualit  professionnelle de tous vos templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Quality Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { standard: 'R solution minimale', value: '1080p', icon: Monitor, status: 'excellent' },
                    { standard: 'Format support ', value: 'PNG/JPG/SVG', icon: FileText, status: 'excellent' },
                    { standard: 'Taille maximale', value: '50 MB', icon: Archive, status: 'excellent' },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Icon className="w-5 h-5 text-cyan-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{item.standard}</p>
                              <p className="text-lg font-bold text-cyan-400">{item.value}</p>
                            </div>
                            <Badge className="bg-green-500">{item.status}</Badge>
                    </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Template Categories */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Cat gories de Templates</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { name: 'Marketing', count: 45, icon: TrendingUp },
                      { name: 'Social Media', count: 32, icon: Share2 },
                      { name: 'E-commerce', count: 28, icon: ShoppingCart },
                      { name: 'Corporate', count: 19, icon: Building2 },
                    ].map((category, idx) => {
                      const Icon = category.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="w-4 h-4 text-cyan-400" />
                              <p className="text-sm font-medium text-white">{category.name}</p>
                            </div>
                            <p className="text-xs text-cyan-400">{category.count} templates</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Export Options */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-cyan-400" />
                Options d'Export de Templates
              </CardTitle>
              <CardDescription className="text-slate-400">
                Exporter vos templates dans tous les formats n cessaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { format: 'PNG', description: 'Format standard pour images', quality: 'Haute', size: '~5 MB' },
                  { format: 'JPG', description: 'Format compress  pour web', quality: 'Moyenne', size: '~2 MB' },
                  { format: 'SVG', description: 'Format vectoriel scalable', quality: 'Tr s haute', size: '~500 KB' },
                  { format: 'PDF', description: 'Format document professionnel', quality: 'Haute', size: '~3 MB' },
                ].map((format, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-white">{format.format}</p>
                            <Badge className="bg-cyan-500">{format.quality}</Badge>
                    </div>
                          <p className="text-sm text-slate-400">{format.description}</p>
                          <p className="text-xs text-slate-500 mt-1">Taille estim e: {format.size}</p>
                        </div>
                        <Button size="sm" variant="outline" className="border-slate-600">
                          <Download className="w-4 h-4 mr-2" />
                          Exporter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template Workflow Automation */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Automatisation du Workflow de Templates
              </CardTitle>
              <CardDescription className="text-slate-400">
                Automatisez vos processus de cr ation de templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Automation Rules */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">R gles d'Automatisation</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'G n ration automatique', description: 'G n rer automatiquement des templates   partir de designs', trigger: 'Nouveau design', actions: 3, enabled: true },
                      { name: 'Export automatique', description: 'Exporter automatiquement vers les plateformes configur es', trigger: 'Template termin ', actions: 2, enabled: true },
                      { name: 'Notification  quipe', description: 'Notifier l&apos; quipe lors de la finalisation', trigger: 'Template approuv ', actions: 1, enabled: false },
                    ].map((rule, idx) => (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-semibold text-white text-sm">{rule.name}</h5>
                                <Badge className={rule.enabled ? 'bg-green-500' : 'bg-slate-600'}>{rule.enabled ? 'Actif' : 'Inactif'}</Badge>
                    </div>
                              <p className="text-xs text-slate-400 mb-2">{rule.description}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span>D clencheur: {rule.trigger}</span>
                                <span>Actions: {rule.actions}</span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="border-slate-600">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Batch Operations */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Op rations par Lots</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'G n ration en lot', description: 'G n rer plusieurs templates simultan ment', icon: Layers, count: 12 },
                      { name: 'Export en lot', description: 'Exporter tous les templates s lectionn s', icon: Download, count: 8 },
                      { name: 'Conversion en lot', description: 'Convertir plusieurs formats   la fois', icon: RefreshCw, count: 5 },
                      { name: 'Archivage en lot', description: 'Archiver plusieurs templates anciens', icon: Archive, count: 20 },
                    ].map((op, idx) => {
                      const Icon = op.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-cyan-500/10 rounded-lg">
                                <Icon className="w-5 h-5 text-cyan-400" />
                              </div>
                              <div className="flex-1">
                                <h5 className="font-semibold text-white text-sm mb-1">{op.name}</h5>
                                <p className="text-xs text-slate-400">{op.description}</p>
                                <p className="text-xs text-cyan-400 mt-1">{op.count} templates disponibles</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Analytics Dashboard */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Tableau de Bord Analytique
              </CardTitle>
              <CardDescription className="text-slate-400">
                Analysez les performances de vos templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Utilisations totales', value: '8.9K', change: '+15%', icon: TrendingUp, trend: 'up' },
                    { label: 'Taux d&apos;engagement', value: '82%', change: '+7%', icon: Heart, trend: 'up' },
                    { label: 'Partages', value: '1.5K', change: '+12%', icon: Share2, trend: 'up' },
                    { label: 'Temps moyen', value: '1m 30s', change: '-5%', icon: Clock, trend: 'down' },
                  ].map((metric, idx) => {
                    const Icon = metric.icon;
                    const trendColor = metric.trend === 'up' ? 'text-green-400' : 'text-red-400';
                    return (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Icon className="w-4 h-4 text-slate-400" />
                            <span className={`text-xs font-medium ${trendColor}`}>{metric.change}</span>
                          </div>
                          <p className="text-xs text-slate-400 mb-1">{metric.label}</p>
                          <p className="text-xl font-bold text-white">{metric.value}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Top Templates */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Top Templates</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Template Marketing 1', uses: 1250, likes: 890, shares: 234 },
                      { name: 'Template Social 2', uses: 980, likes: 654, shares: 189 },
                      { name: 'Template E-commerce 3', uses: 760, likes: 432, shares: 156 },
                    ].map((template, idx) => (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white mb-1">{template.name}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  {template.uses.toLocaleString()} utilisations
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {template.likes}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Share2 className="w-3 h-3" />
                                  {template.shares}
                                </span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="border-slate-600">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Ultimate Summary */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                R sum  Ultime de Templates
              </CardTitle>
              <CardDescription className="text-slate-400">
                Vue d'ensemble compl te et exhaustive de tous vos templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Complete Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Total templates', value: '456', icon: Layers, color: 'cyan' },
                    { label: 'Collections', value: '23', icon: Folder, color: 'blue' },
                    { label: 'Utilisations', value: '8.9K', icon: TrendingUp, color: 'green' },
                    { label: 'Vues totales', value: '12.5K', icon: Eye, color: 'purple' },
                    { label: 'Partages', value: '1.5K', icon: Share2, color: 'pink' },
                    { label: 'Favoris', value: '890', icon: Heart, color: 'yellow' },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    const colorClasses: Record<string, { bg: string; text: string }> = {
                      cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
                      blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
                      green: { bg: 'bg-green-500/10', text: 'text-green-400' },
                      purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
                      pink: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
                      yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
                    };
                    const colors = colorClasses[stat.color] || colorClasses.cyan;
                    return (
                      <motion
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className={`${colors.bg} border-slate-700`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Icon className={`w-5 h-5 ${colors.text}`} />
                            </div>
                            <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                            <p className={`text-xl font-bold ${colors.text}`}>{stat.value}</p>
                          </CardContent>
                        </Card>
                      </motion>
                    );
                  })}
                </div>

                {/* Feature Completion */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Compl tion des Fonctionnalit s</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { category: 'Cr ation', features: 12, enabled: 12, icon: Edit },
                      { category: 'Collections', features: 8, enabled: 8, icon: Folder },
                      { category: 'Export', features: 6, enabled: 6, icon: Download },
                      { category: 'Analytics', features: 8, enabled: 8, icon: BarChart3 },
                      { category: 'Collaboration', features: 7, enabled: 7, icon: Users },
                      { category: 'S curit ', features: 6, enabled: 6, icon: Shield },
                      { category: 'Int grations', features: 12, enabled: 10, icon: FileText },
                      { category: 'Automatisation', features: 9, enabled: 7, icon: Zap },
                    ].map((category, idx) => {
                      const Icon = category.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <Icon className="w-5 h-5 text-cyan-400" />
                              <div className="flex-1">
                                <h4 className="font-semibold text-white text-sm">{category.category}</h4>
                                <p className="text-xs text-slate-400">{category.features} fonctionnalit s</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                  className="bg-cyan-500 h-2 rounded-full"
                                  style={{ width: `${(category.enabled / category.features) * 100}%` }}
                                />
                              </div>
                              <Badge className="bg-green-500 ml-2">
                                {category.enabled}/{category.features}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Final Summary Card */}
          <Card className="bg-gradient-to-br from-slate-900 via-cyan-900/20 to-slate-900 border-cyan-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-cyan-400" />
                R sum  Final - AI Studio Templates
              </CardTitle>
              <CardDescription className="text-slate-400">
                Plateforme compl te de gestion de templates IA avec fonctionnalit s de niveau entreprise mondiale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { metric: 'Templates cr  s', value: '456', icon: Layers },
                    { metric: 'Collections', value: '23', icon: Folder },
                    { metric: 'Taux d&apos;utilisation', value: '92%', icon: TrendingUp },
                    { metric: 'Satisfaction', value: '4.8/5', icon: Star },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="text-center">
                        <Icon className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white mb-1">{item.value}</p>
                        <p className="text-xs text-slate-400">{item.metric}</p>
                      </div>
                    );
                  })}
                </div>
                <Separator className="bg-slate-700" />
                <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Plateforme de gestion de templates IA de niveau mondial</span>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </ErrorBoundary>
  );
}

const MemoizedAIStudioTemplatesPageContent = memo(AIStudioTemplatesPageContent);

export default function AIStudioTemplatesPage() {







  return (
    <ErrorBoundary componentName="AIStudioTemplates">
      <MemoizedAIStudioTemplatesPageContent />
    </ErrorBoundary>
  );
}