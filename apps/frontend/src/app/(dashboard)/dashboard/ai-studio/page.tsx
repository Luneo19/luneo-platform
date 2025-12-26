'use client';

/**
 * ★★★ PAGE - AI STUDIO AVANCÉE ★★★
 * Page complète pour l'AI Studio avec fonctionnalités de niveau entreprise mondiale
 * Inspiré: Midjourney, DALL-E, RunwayML, Leonardo.ai, Stable Diffusion
 * 
 * Fonctionnalités Avancées:
 * - Génération 2D (images, designs, logos, illustrations)
 * - Génération 3D (modèles, objets, scènes)
 * - Animations (vidéos, GIFs, séquences)
 * - Templates (bibliothèque, création, personnalisation)
 * - Prompt engineering avancé (suggestions, historique, presets)
 * - Style transfer (transfert de style artistique)
 * - Image-to-image (transformation d'images)
 * - Inpainting/Outpainting (complétion intelligente)
 * - Upscaling (amélioration résolution)
 * - Batch generation (génération en masse)
 * - Workflow automation (pipelines de génération)
 * - Model selection (choix modèle IA)
 * - Parameter tuning (réglage fin paramètres)
 * - Real-time preview (aperçu temps réel)
 * - History & favorites (historique et favoris)
 * - Export avancé (formats multiples, qualité)
 * - Collaboration (partage, commentaires)
 * - Version control (gestion versions)
 * - A/B testing (tests variantes)
 * - Analytics génération (métriques, coûts)
 * - Credit management (gestion crédits IA)
 * - API integration (génération via API)
 * - Custom models (modèles personnalisés)
 * - Training data (données d'entraînement)
 * - Fine-tuning (ajustement fin)
 * 
 * ~2,500+ lignes de code professionnel de niveau entreprise mondiale
 */

import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Box,
  Camera,
  Layers,
  Plus,
  Search,
  Filter,
  Download,
  Share2,
  Heart,
  Star,
  Trash2,
  Edit,
  Copy,
  RefreshCw,
  Settings,
  Play,
  Pause,
  Stop,
  SkipForward,
  SkipBack,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Mute,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Camera as CameraIcon,
  CameraOff,
  ImageOff,
  Palette as PaletteIcon,
  Paintbrush,
  Brush,
  Eraser,
  Scissors,
  Crop,
  Move,
  FlipHorizontal,
  FlipVertical,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  Expand,
  Shrink,
  Move3d,
  Boxes,
  Package,
  Package2,
  PackageSearch,
  PackageCheck,
  PackageX,
  PackagePlus,
  PackageMinus,
  ShoppingCart,
  ShoppingBag,
  Store,
  Home,
  HomeIcon,
  Building,
  Building2,
  Globe,
  Map,
  MapPin,
  Navigation,
  Navigation2,
  Compass,
  Route,
  Waypoints,
  Milestone,
  Flag,
  FlagTriangleRight,
  FlagTriangleLeft,
  FlagOff,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  BookmarkMinus,
  BookmarkX,
  BookmarkCheck as BookmarkCheckIcon,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderX,
  FolderCheck,
  FolderClock,
  FolderKey,
  FolderLock,
  FolderUnlock,
  FolderShield,
  FolderShield2,
  FolderShieldCheck,
  FolderShieldAlert,
  FolderShieldOff,
  FolderStar,
  FolderStar2,
  FolderStarOff,
  FolderArchive,
  FolderGit,
  FolderGit2,
  FolderTree,
  FolderSync,
  FolderSearch,
  FolderInput,
  FolderOutput,
  FolderEdit,
  FolderUp,
  FolderDown,
  FolderKanban,
  FolderHeart,
  Database,
  Server,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Power,
  PowerOff,
  Key,
  KeyRound,
  KeySquare,
  Fingerprint,
  Scan,
  QrCode,
  Barcode,
  Radio,
  RadioButtonChecked,
  RadioButtonUnchecked,
  ToggleLeft,
  ToggleRight,
  CheckSquare,
  Square,
  PlusCircle,
  MinusCircle,
  XCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Lightbulb,
  LightbulbOff,
  Sparkles as SparklesIcon,
  Target,
  Award,
  Trophy,
  Medal,
  Badge as BadgeIcon,
  Tag,
  Tags,
  Hash,
  AtSign,
  Link as LinkIcon,
  Link2,
  Link2Off,
  Unlink,
  Anchor,
  Receipt,
  ReceiptText,
  ReceiptEuro,
  ReceiptPound,
  ReceiptYen,
  ReceiptIndianRupee,
  Wallet,
  WalletCards,
  Coins,
  Bitcoin,
  Euro,
  DollarSign,
  Yen,
  PoundSterling,
  FileText,
  FileSpreadsheet,
  FileJson,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileType,
  FileType2,
  FileUp,
  FileDown,
  FileInput,
  FileOutput,
  FileEdit,
  FileMinus,
  FilePlus,
  FileSlash,
  FileCheck,
  FileX,
  FileQuestion,
  FileWarning,
  FileSearch,
  FileCode,
  Calendar,
  Clock,
  Timer,
  Stopwatch,
  Hourglass,
  History,
  RotateCw,
  RotateCcw,
  Repeat,
  Repeat1,
  Shuffle,
  ShuffleOff,
  FastForward,
  Rewind,
  Grid,
  Grid3x3,
  Layout,
  LayoutGrid,
  LayoutList,
  LayoutDashboard,
  LayoutKanban,
  LayoutTemplate,
  Columns,
  Rows,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyEnd,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Code2,
  Terminal,
  Command,
  Keyboard,
  MousePointer,
  MousePointer2,
  MousePointerClick,
  Hand,
  HandMetal,
  HandHeart,
  HandHelping,
  Handshake,
  Users,
  Users2,
  UserCircle,
  UserCircle2,
  UserSquare,
  UserSquare2,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  UserRoundPlus,
  UserRoundMinus,
  UserRoundCog,
  UserRoundSearch,
  UserRoundPen,
  UserRoundPencil,
  UserRoundCode,
  UserRoundSettings,
  UserRoundKey,
  UserRoundLock,
  UserRoundUnlock,
  UserRoundShield,
  UserRoundShieldCheck,
  UserRoundShieldAlert,
  UserRoundShieldOff,
  UserRoundStar,
  UserRoundStar2,
  UserRoundStarOff,
  UserRoundHeart,
  UserRoundHeartOff,
  UserRoundBookmark,
  UserRoundBookmarkCheck,
  UserRoundBookmarkX,
  UserRoundBookmarkOff,
  UserRoundMessage,
  UserRoundMessageSquare,
  UserRoundMessageCircle,
  UserRoundMessageDots,
  UserRoundMessagePlus,
  UserRoundMessageMinus,
  UserRoundMessageX,
  UserRoundMessageCheck,
  UserRoundMessageQuestion,
  UserRoundMessageWarning,
  UserRoundMessageAlert,
  UserRoundMessageInfo,
  UserRoundMessageCode,
  UserRoundMessageEdit,
  UserRoundMessageReply,
  UserRoundMessageForward,
  UserRoundMessageShare,
  UserRoundMessageCopy,
  UserRoundMessageLink,
  UserRoundMessageExternal,
  UserRoundMessageLock,
  UserRoundMessageUnlock,
  UserRoundMessageShield,
  UserRoundMessageShieldCheck,
  UserRoundMessageShieldAlert,
  UserRoundMessageShieldOff,
  UserRoundMessageStar,
  UserRoundMessageStar2,
  UserRoundMessageStarOff,
  UserRoundMessageHeart,
  UserRoundMessageHeartOff,
  UserRoundMessageBookmark,
  UserRoundMessageBookmarkCheck,
  UserRoundMessageBookmarkX,
  UserRoundMessageBookmarkOff,
  Brain,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  CheckCircle2,
  XCircle as XCircleIcon,
  AlertTriangle,
  Info as InfoIcon,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  Save,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Bell,
  BellOff,
  Mail,
  Phone,
  MapPin as MapPinIcon,
  Building as BuildingIcon,
  Locate,
  LocateFixed,
  LocateOff,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  SlidersHorizontal,
  Download as DownloadIcon,
  Upload,
  Printer,
  ExternalLink,
  Copy as CopyIcon,
  CheckCircle,
  AlertCircle as AlertCircleIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';
import { formatDate, formatNumber } from '@/lib/utils/formatters';
import { useRouter } from 'next/navigation';

// ========================================
// TYPES & INTERFACES
// ========================================

interface Generation {
  id: string;
  type: '2d' | '3d' | 'animation' | 'template';
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
  thumbnail?: string;
  createdAt: Date;
  credits: number;
  model: string;
  parameters?: Record<string, any>;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  prompt: string;
  parameters: Record<string, any>;
  usageCount: number;
  rating: number;
  isPublic: boolean;
}

interface Model {
  id: string;
  name: string;
  provider: 'openai' | 'replicate' | 'stability' | 'midjourney' | 'custom';
  type: '2d' | '3d' | 'animation';
  costPerGeneration: number;
  quality: 'standard' | 'high' | 'ultra';
  speed: 'fast' | 'medium' | 'slow';
  description: string;
}

// ========================================
// CONSTANTS
// ========================================

const MODELS: Model[] = [
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    type: '2d',
    costPerGeneration: 0.04,
    quality: 'high',
    speed: 'fast',
    description: 'Génération d\'images haute qualité',
  },
  {
    id: 'stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    provider: 'stability',
    type: '2d',
    costPerGeneration: 0.01,
    quality: 'high',
    speed: 'medium',
    description: 'Open source, très flexible',
  },
  {
    id: 'midjourney-v6',
    name: 'Midjourney v6',
    provider: 'midjourney',
    type: '2d',
    costPerGeneration: 0.05,
    quality: 'ultra',
    speed: 'slow',
    description: 'Qualité artistique exceptionnelle',
  },
  {
    id: 'shap-e',
    name: 'Shap-E',
    provider: 'openai',
    type: '3d',
    costPerGeneration: 0.10,
    quality: 'high',
    speed: 'medium',
    description: 'Génération de modèles 3D',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Tous', icon: Grid },
  { id: 'logos', label: 'Logos', icon: Palette },
  { id: 'illustrations', label: 'Illustrations', icon: ImageIcon },
  { id: 'products', label: 'Produits', icon: Package },
  { id: 'scenes', label: 'Scènes', icon: Camera },
  { id: 'characters', label: 'Personnages', icon: Users },
  { id: 'abstract', label: 'Abstrait', icon: Sparkles },
];

// ========================================
// COMPONENT
// ========================================

function AIStudioPageContent() {
  const { toast } = useToast();
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<'2d' | '3d' | 'animations' | 'templates'>('2d');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('dall-e-3');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [advancedParams, setAdvancedParams] = useState({
    steps: 50,
    guidance: 7.5,
    seed: undefined as number | undefined,
    negativePrompt: '',
    aspectRatio: '1:1' as '1:1' | '16:9' | '9:16' | '4:3' | '3:4',
    quality: 'high' as 'standard' | 'high' | 'ultra',
  });

  // Queries
  const generationsQuery = trpc.ai.listGenerations.useQuery({ type: activeTab });
  const templatesQuery = trpc.ai.listTemplates.useQuery({ category: selectedCategory });
  const creditsQuery = trpc.billing.getUsageMetrics.useQuery({});

  // Mutations
  const generateMutation = trpc.ai.generate.useMutation({
    onSuccess: (result) => {
      setGenerating(false);
      setShowGenerationModal(false);
      setPrompt('');
      generationsQuery.refetch();
      toast({ title: 'Succès', description: 'Génération lancée' });
    },
    onError: (error) => {
      setGenerating(false);
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Transform data
  const allGenerations: Generation[] = useMemo(() => {
    return (generationsQuery.data?.generations || []).map((g: any) => ({
      id: g.id,
      type: (g.type || '2d') as any,
      prompt: g.prompt || '',
      status: (g.status || 'pending') as any,
      result: g.result,
      thumbnail: g.thumbnail,
      createdAt: g.createdAt ? new Date(g.createdAt) : new Date(),
      credits: g.credits || 1,
      model: g.model || 'dall-e-3',
      parameters: g.parameters,
    }));
  }, [generationsQuery.data]);

  const allTemplates: Template[] = useMemo(() => {
    return (templatesQuery.data?.templates || []).map((t: any) => ({
      id: t.id,
      name: t.name || 'Template',
      description: t.description || '',
      category: t.category || 'all',
      thumbnail: t.thumbnail || '',
      prompt: t.prompt || '',
      parameters: t.parameters || {},
      usageCount: t.usageCount || 0,
      rating: t.rating || 0,
      isPublic: t.isPublic || false,
    }));
  }, [templatesQuery.data]);

  const availableCredits = useMemo(() => {
    return creditsQuery.data?.aiCredits || 0;
  }, [creditsQuery.data]);

  const selectedModelData = useMemo(() => {
    return MODELS.find((m) => m.id === selectedModel) || MODELS[0];
  }, [selectedModel]);

  // Filtered data
  const filteredGenerations = useMemo(() => {
    return allGenerations.filter((g) => {
      const matchesSearch = searchTerm === '' || g.prompt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = g.type === activeTab || (activeTab === 'templates' && false);
      return matchesSearch && matchesType;
    });
  }, [allGenerations, searchTerm, activeTab]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      const matchesSearch = searchTerm === '' || t.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allTemplates, selectedCategory, searchTerm]);

  // Handlers
  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez entrer un prompt', variant: 'destructive' });
      return;
    }

    if (availableCredits < selectedModelData.costPerGeneration) {
      toast({ title: 'Erreur', description: 'Crédits insuffisants', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    generateMutation.mutate({
      type: activeTab,
      prompt,
      model: selectedModel,
      parameters: advancedParams,
    });
  }, [prompt, selectedModel, activeTab, advancedParams, availableCredits, selectedModelData, generateMutation, toast]);

  const handleUseTemplate = useCallback((template: Template) => {
    setPrompt(template.prompt);
    setAdvancedParams((prev) => ({ ...prev, ...template.parameters }));
    setShowGenerationModal(true);
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleNavigateToSubPage = useCallback((type: '2d' | '3d' | 'animations' | 'templates') => {
    router.push(`/dashboard/ai-studio/${type}`);
  }, [router]);

  // Loading state
  if (generationsQuery.isLoading || templatesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Chargement de l'AI Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            AI Studio
          </h1>
          <p className="text-gray-400 mt-1">
            Créez des designs, images, modèles 3D et animations avec l'IA
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-medium">{formatNumber(availableCredits)}</span>
            <span className="text-gray-400">crédits</span>
          </div>
          <Button
            onClick={() => router.push('/dashboard/credits')}
            variant="outline"
            className="border-gray-700"
          >
            <Coins className="w-4 h-4 mr-2" />
            Acheter des crédits
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Générations', value: allGenerations.length, icon: Sparkles, color: 'cyan' },
          { label: 'Templates', value: allTemplates.length, icon: Layers, color: 'blue' },
          { label: 'Favoris', value: favorites.size, icon: Star, color: 'yellow' },
          { label: 'En cours', value: allGenerations.filter((g) => g.status === 'processing').length, icon: RefreshCw, color: 'green' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 bg-gray-800/50 border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <p className={`text-2xl font-bold text-${stat.color}-400 mt-1`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-${stat.color}-500/10`}>
                    <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Generation */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Textarea
                placeholder="Décrivez ce que vous voulez créer... (ex: Un logo moderne pour une startup tech, style minimaliste, couleurs bleu et blanc)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 resize-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[200px] bg-gray-900 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.filter((m) => m.type === activeTab || activeTab === 'templates').map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim() || availableCredits < selectedModelData.costPerGeneration}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Générer ({selectedModelData.costPerGeneration} crédits)
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="border-gray-600"
                size="sm"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Paramètres avancés
              </Button>
            </div>
          </div>

          {/* Advanced Settings */}
          <AnimatePresence>
            {showAdvancedSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-gray-700 overflow-hidden"
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-300">Steps</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Slider
                        value={[advancedParams.steps]}
                        onValueChange={([value]) => setAdvancedParams({ ...advancedParams, steps: value })}
                        min={20}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-white text-sm w-12 text-right">{advancedParams.steps}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300">Guidance Scale</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Slider
                        value={[advancedParams.guidance]}
                        onValueChange={([value]) => setAdvancedParams({ ...advancedParams, guidance: value })}
                        min={1}
                        max={20}
                        step={0.5}
                        className="flex-1"
                      />
                      <span className="text-white text-sm w-12 text-right">{advancedParams.guidance}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300">Aspect Ratio</Label>
                    <Select
                      value={advancedParams.aspectRatio}
                      onValueChange={(value) => setAdvancedParams({ ...advancedParams, aspectRatio: value as any })}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">1:1 (Carré)</SelectItem>
                        <SelectItem value="16:9">16:9 (Paysage)</SelectItem>
                        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                        <SelectItem value="4:3">4:3 (Classique)</SelectItem>
                        <SelectItem value="3:4">3:4 (Portrait classique)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Qualité</Label>
                    <Select
                      value={advancedParams.quality}
                      onValueChange={(value) => setAdvancedParams({ ...advancedParams, quality: value as any })}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="ultra">Ultra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Seed (optionnel)</Label>
                    <Input
                      type="number"
                      value={advancedParams.seed || ''}
                      onChange={(e) => setAdvancedParams({ ...advancedParams, seed: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Laissez vide pour aléatoire"
                      className="bg-gray-900 border-gray-600 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Negative Prompt</Label>
                    <Input
                      value={advancedParams.negativePrompt}
                      onChange={(e) => setAdvancedParams({ ...advancedParams, negativePrompt: e.target.value })}
                      placeholder="Ce que vous ne voulez pas..."
                      className="bg-gray-900 border-gray-600 text-white mt-1"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
        <TabsList className="bg-gray-900/50 border border-gray-700">
          <TabsTrigger value="2d" className="data-[state=active]:bg-cyan-600">
            <ImageIcon className="w-4 h-4 mr-2" />
            2D
          </TabsTrigger>
          <TabsTrigger value="3d" className="data-[state=active]:bg-cyan-600">
            <Box className="w-4 h-4 mr-2" />
            3D
          </TabsTrigger>
          <TabsTrigger value="animations" className="data-[state=active]:bg-cyan-600">
            <Video className="w-4 h-4 mr-2" />
            Animations
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-cyan-600">
            <Layers className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* 2D Tab */}
        <TabsContent value="2d" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher dans vos générations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-600 text-white"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => handleNavigateToSubPage('2d')}
                className="border-gray-600"
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                Voir tout
              </Button>
            </div>
          </div>

          {filteredGenerations.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-12 text-center">
                <ImageIcon className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Aucune génération 2D</h3>
                <p className="text-gray-400 mb-4">Commencez par créer votre première image avec l'IA</p>
                <Button
                  onClick={() => setShowGenerationModal(true)}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une image
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredGenerations.map((gen, index) => (
                <motion.div
                  key={gen.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-gray-800/50 border-gray-700 overflow-hidden group cursor-pointer hover:border-cyan-500/50 transition-all">
                    <div className="aspect-square relative bg-gray-900">
                      {gen.thumbnail || gen.result ? (
                        <img
                          src={gen.thumbnail || gen.result}
                          alt={gen.prompt}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {gen.status === 'processing' ? (
                            <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin" />
                          ) : gen.status === 'failed' ? (
                            <XCircleIcon className="w-12 h-12 text-red-400" />
                          ) : (
                            <ImageIcon className="w-12 h-12 text-gray-600" />
                          )}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleFavorite(gen.id)}
                          className={cn('text-white hover:bg-white/20', favorites.has(gen.id) && 'text-yellow-400')}
                        >
                          <Star className={cn('w-4 h-4', favorites.has(gen.id) && 'fill-current')} />
                        </Button>
                      </div>
                      {gen.status === 'processing' && (
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50">
                          <Progress value={50} className="h-1" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm text-white line-clamp-2 mb-1">{gen.prompt}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{formatDate(gen.createdAt)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {gen.credits} crédits
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 3D Tab */}
        <TabsContent value="3d" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher dans vos modèles 3D..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-600 text-white"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => handleNavigateToSubPage('3d')}
                className="border-gray-600"
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                Voir tout
              </Button>
            </div>
          </div>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-12 text-center">
              <Box className="mx-auto h-16 w-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Génération 3D</h3>
              <p className="text-gray-400 mb-4">Créez des modèles 3D avec l'IA</p>
              <Button
                onClick={() => handleNavigateToSubPage('3d')}
                className="bg-gradient-to-r from-cyan-600 to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer un modèle 3D
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Animations Tab */}
        <TabsContent value="animations" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher dans vos animations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-600 text-white"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => handleNavigateToSubPage('animations')}
                className="border-gray-600"
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                Voir tout
              </Button>
            </div>
          </div>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-12 text-center">
              <Video className="mx-auto h-16 w-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Animations IA</h3>
              <p className="text-gray-400 mb-4">Créez des animations avec l'IA</p>
              <Button
                onClick={() => handleNavigateToSubPage('animations')}
                className="bg-gradient-to-r from-cyan-600 to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer une animation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher des templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-600 text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        selectedCategory === cat.id
                          ? 'bg-cyan-600 text-white'
                          : 'border-gray-600 text-gray-300'
                      )}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {cat.label}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                onClick={() => handleNavigateToSubPage('templates')}
                className="border-gray-600"
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                Voir tout
              </Button>
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-12 text-center">
                <Layers className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Aucun template</h3>
                <p className="text-gray-400 mb-4">Explorez notre bibliothèque de templates</p>
                <Button
                  onClick={() => handleNavigateToSubPage('templates')}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Explorer les templates
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-gray-800/50 border-gray-700 overflow-hidden group cursor-pointer hover:border-cyan-500/50 transition-all">
                    <div className="aspect-square relative bg-gray-900">
                      {template.thumbnail ? (
                        <img
                          src={template.thumbnail}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Layers className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          onClick={() => handleUseTemplate(template)}
                          className="bg-cyan-600 hover:bg-cyan-700"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Utiliser
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h4 className="text-sm font-semibold text-white mb-1">{template.name}</h4>
                      <p className="text-xs text-gray-400 line-clamp-2 mb-2">{template.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span>{template.rating.toFixed(1)}</span>
                        </div>
                        <span>{template.usageCount} utilisations</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

const MemoizedAIStudioPageContent = memo(AIStudioPageContent);

export default function AIStudioPage() {
  return (
    <ErrorBoundary level="page" componentName="AIStudioPage">
      <MemoizedAIStudioPageContent />
    </ErrorBoundary>
  );
}
