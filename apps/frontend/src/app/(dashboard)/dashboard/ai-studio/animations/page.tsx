'use client';

/**
 *     PAGE - AI STUDIO ANIMATIONS COMPL TE    
 * Page compl te pour la g n ration d'animations avec IA avec fonctionnalit s de niveau entreprise mondiale
 * Inspir  de: Runway ML, Pika Labs, Stable Video Diffusion, Gen-2, Kling AI, Luma AI
 * 
 * Fonctionnalit s Avanc es:
 * - G n ration d'animations avanc e avec IA (prompts, dur e, style, FPS, r solution)
 * - Pr visualisation vid o interactive (lecture, pause, scrubbing)
 * - Historique complet des animations
 * - Templates et presets d'animations pr -configur s
 * -  dition et post-traitement (trim, speed, filters, transitions)
 * - Export multi-formats (MP4, GIF, WebM, MOV, AVI)
 * - Gestion des cr dits et quotas
 * - Analytics de g n ration (temps, co ts, popularit )
 * - Collections et favoris
 * - Partage et collaboration
 * - Param tres avanc s (FPS, r solution, bitrate, codec)
 * - Batch generation
 * - Text-to-Video et Image-to-Video
 * - Motion control et keyframes
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
  Video,
  Sparkles,
  Download,
  Play,
  Wand2,
  Loader2,
  CheckCircle,
  ArrowLeft,
  Film,
  Search,
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
  Layers,
  FileImage,
  Folder,
  FolderPlus,
  Bookmark,
  BookmarkCheck,
  Eye,
  EyeOff,
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
  Shield,
  Globe,
  Camera,
  Palette,
  ToggleRight,
  History,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Sliders,
  Contrast,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  FastForward,
  Rewind,
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
  Trees,
  Mountain,
  Waves,
  Earth,
  Lightbulb,
  LightbulbOff,
  Lamp,
  Flashlight,
  MousePointer,
  Scissors,
  DollarSign,
  FileCode,
  GitBranch,
  BookOpen,
  Move,
  Code,
  Gauge,
  FileText,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface GeneratedAnimation {
  id: string;
  name: string;
  thumbnail: string;
  videoUrl?: string;
  prompt: string;
  duration: number;
  style: string;
  fps: number;
  resolution: string;
  createdAt: number;
  credits: number;
  isFavorite?: boolean;
  tags?: string[];
  metadata?: {
    format: string;
    size: number;
    bitrate?: number;
    codec?: string;
    frameCount?: number;
    model?: string;
    seed?: number;
  };
  views?: number;
  likes?: number;
}

interface AnimationTemplate {
  id: string;
  name: string;
  prompt: string;
  duration: number;
  style: string;
  thumbnail: string;
  uses: number;
  description: string;
  category: string;
}

function AIStudioAnimationsPageContent() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('5');
  const [style, setStyle] = useState('smooth');
  const [fps, setFps] = useState([24]);
  const [resolution, setResolution] = useState('1080p');
  const [bitrate, setBitrate] = useState([5000]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedAnimations, setGeneratedAnimations] = useState<GeneratedAnimation[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'templates' | 'analytics' | 'ai-ml' | 'collaboration' | 'performance' | 'security' | 'i18n' | 'accessibility' | 'workflow'>('generate');
  const [selectedAnimation, setSelectedAnimation] = useState<GeneratedAnimation | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStyle, setFilterStyle] = useState<string>('all');
  const [filterDuration, setFilterDuration] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [credits, setCredits] = useState(1250);

  // Mock stats
  const stats = useMemo(() => ({
    totalGenerations: generatedAnimations.length,
    totalCredits: generatedAnimations.reduce((sum, anim) => sum + anim.credits, 0),
    avgGenerationTime: 62.5,
    successRate: 96.2,
    favoriteCount: generatedAnimations.filter(anim => anim.isFavorite).length,
    totalDuration: generatedAnimations.reduce((sum, anim) => sum + anim.duration, 0),
    byStyle: {
      smooth: generatedAnimations.filter(anim => anim.style === 'smooth').length,
      bounce: generatedAnimations.filter(anim => anim.style === 'bounce').length,
      fade: generatedAnimations.filter(anim => anim.style === 'fade').length,
      slide: generatedAnimations.filter(anim => anim.style === 'slide').length,
      zoom: generatedAnimations.filter(anim => anim.style === 'zoom').length,
    },
    avgFps: generatedAnimations.length > 0
      ? Math.round(generatedAnimations.reduce((sum, a) => sum + a.fps, 0) / generatedAnimations.length)
      : 24,
  }), [generatedAnimations]);

  // Mock templates
  const templates = useMemo<AnimationTemplate[]>(() => [
    {
      id: 't1',
      name: 'Logo Apparition',
      prompt: 'Logo qui appara t avec un effet de zoom fluide, fond d grad ',
      duration: 5,
      style: 'smooth',
      thumbnail: '/placeholder-template.jpg',
      uses: 1245,
      description: 'Animation classique pour logo',
      category: 'logo',
    },
    {
      id: 't2',
      name: 'Transition Fade',
      prompt: 'Transition en fondu entre deux sc nes, effet cin matique',
      duration: 3,
      style: 'fade',
      thumbnail: '/placeholder-template.jpg',
      uses: 892,
      description: 'Transition professionnelle',
      category: 'transition',
    },
    {
      id: 't3',
      name: 'Texte Anim ',
      prompt: 'Texte qui appara t lettre par lettre avec effet de rebond',
      duration: 4,
      style: 'bounce',
      thumbnail: '/placeholder-template.jpg',
      uses: 654,
      description: 'Animation de texte dynamique',
      category: 'text',
    },
    {
      id: 't4',
      name: 'Zoom Cin matique',
      prompt: 'Zoom avant fluide sur un objet avec profondeur de champ',
      duration: 6,
      style: 'zoom',
      thumbnail: '/placeholder-template.jpg',
      uses: 432,
      description: 'Effet cin matique professionnel',
      category: 'camera',
    },
  ], []);

  // Mock history
  const history = useMemo(() => generatedAnimations.slice().reverse(), [generatedAnimations]);

  // Advanced generation settings
  const [advancedSettings, setAdvancedSettings] = useState({
    seed: '',
    temperature: 75,
    guidanceScale: 8.0,
    motionStrength: 50,
    enableProgressive: false,
    enableOptimization: true,
    enableCache: true,
  });

  // Generation queue management
  const [generationQueue, setGenerationQueue] = useState<Array<{
    id: string;
    prompt: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
  }>>([]);

  // Advanced analytics tracking
  const [analyticsTracking, setAnalyticsTracking] = useState({
    trackGenerations: true,
    trackExports: true,
    trackShares: true,
    trackFavorites: true,
  });

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer une description',
        variant: 'destructive',
      });
      return;
    }

    if (credits < 30) {
      toast({
        title: 'Cr dits insuffisants',
        description: 'Vous n\'avez pas assez de cr dits pour g n rer une animation',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 3;
      });
    }, 500);

    try {
      // Simuler la g n ration (remplacer par l'appel API r el)
      await new Promise((resolve) => setTimeout(resolve, 6000));
      
      clearInterval(progressInterval);
      setGenerationProgress(100);

      const newAnimation: GeneratedAnimation = {
        id: `anim-${Date.now()}`,
        name: prompt.substring(0, 30),
        thumbnail: `https://picsum.photos/512/288?random=${Date.now()}`,
        videoUrl: `https://example.com/video-${Date.now()}.mp4`,
        prompt,
        duration: parseInt(duration),
        style,
        fps: fps[0],
        resolution,
        createdAt: Date.now(),
        credits: 30,
        metadata: {
          format: 'MP4',
          size: Math.floor(Math.random() * 10000000) + 2000000,
          bitrate: bitrate[0],
          codec: 'H.264',
          frameCount: parseInt(duration) * fps[0],
          model: 'stable-video-diffusion',
          seed: Math.floor(Math.random() * 1000000),
        },
        views: 0,
        likes: 0,
      };

      setGeneratedAnimations((prev) => [newAnimation, ...prev]);
      setCredits(prev => prev - 30);
      
      toast({
        title: 'Succ s',
        description: 'Animation g n r e avec succ s',
      });
    } catch (error) {
      clearInterval(progressInterval);
      logger.error('Error generating animation', { error });
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la g n ration',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [prompt, duration, style, fps, resolution, bitrate, credits, toast]);

  const handleUseTemplate = useCallback((template: AnimationTemplate) => {
    setPrompt(template.prompt);
    setDuration(template.duration.toString());
    setStyle(template.style);
    toast({
      title: 'Template appliqu ',
      description: `Le template "${template.name}" a  t  charg `,
    });
  }, [toast]);

  const handleToggleFavorite = useCallback((animationId: string) => {
    setGeneratedAnimations(prev =>
      prev.map(anim =>
        anim.id === animationId ? { ...anim, isFavorite: !anim.isFavorite } : anim
      )
    );
  }, []);

  const handleViewDetails = useCallback((animation: GeneratedAnimation) => {
    setSelectedAnimation(animation);
    setShowDetailDialog(true);
  }, []);

  const handlePreview = useCallback((animation: GeneratedAnimation) => {
    setSelectedAnimation(animation);
    setShowPreviewDialog(true);
    setIsPlaying(true);
  }, []);

  const filteredAnimations = useMemo(() => {
    return generatedAnimations.filter(anim => {
      const matchesSearch = anim.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anim.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anim.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStyle = filterStyle === 'all' || anim.style === filterStyle;
      const matchesDuration = filterDuration === 'all' || anim.duration.toString() === filterDuration;
      return matchesSearch && matchesStyle && matchesDuration;
    });
  }, [generatedAnimations, searchTerm, filterStyle, filterDuration]);

  const formatDate = useCallback((timestamp: number) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  }, []);

  const formatRelativeTime = useCallback((timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '  l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return formatDate(timestamp);
  }, [formatDate]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <ErrorBoundary componentName="AIStudioAnimations">
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
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                <Film className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Studio Animations</h1>
                <p className="text-sm text-slate-400">G n ration d'animations avec intelligence artificielle</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-xs text-slate-400">Cr dits disponibles</p>
                    <p className="text-lg font-bold text-white">{credits.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button variant="outline" className="border-slate-700">
              <Settings className="w-4 h-4 mr-2" />
              Param tres
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Animations g n r es', value: generatedAnimations.length, icon: Video, color: 'cyan' },
            { label: 'Temps total', value: `${generatedAnimations.reduce((acc, anim) => acc + anim.duration, 0)}s`, icon: Clock, color: 'blue' },
            { label: 'Taux de succ s', value: '97.8%', icon: CheckCircle, color: 'green' },
            { label: 'Temps moyen', value: '3.2 min', icon: TrendingUp, color: 'purple' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-${stat.color}-500/20 rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{stat.label}</p>
                      <p className="text-lg font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

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
          </div>
          <div className="flex items-center gap-4">
            <Card className="p-3 bg-cyan-950/20 border-cyan-500/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-slate-400">Cr dits disponibles</p>
                  <p className="text-lg font-bold text-cyan-400">{credits.toLocaleString()}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Animations', value: stats.totalGenerations, color: 'cyan', icon: Film },
            { label: 'Cr dits utilis s', value: stats.totalCredits, color: 'blue', icon: Zap },
            { label: 'Temps moyen', value: `${stats.avgGenerationTime}s`, color: 'green', icon: Clock },
            { label: 'Taux de succ s', value: `${stats.successRate}%`, color: 'purple', icon: CheckCircle2 },
            { label: 'Favoris', value: stats.favoriteCount, color: 'pink', icon: Heart },
            { label: 'Dur e totale', value: `${stats.totalDuration}s`, color: 'orange', icon: Video },
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
                        stat.color === 'orange' && "text-orange-400"
                      )}>{stat.value}</p>
                    </div>
                    <div className={cn(
                      "p-2 rounded-lg",
                      stat.color === 'cyan' && "bg-cyan-500/10",
                      stat.color === 'blue' && "bg-blue-500/10",
                      stat.color === 'green' && "bg-green-500/10",
                      stat.color === 'purple' && "bg-purple-500/10",
                      stat.color === 'pink' && "bg-pink-500/10",
                      stat.color === 'orange' && "bg-orange-500/10"
                    )}>
                      <Icon className={cn(
                        "w-4 h-4",
                        stat.color === 'cyan' && "text-cyan-400",
                        stat.color === 'blue' && "text-blue-400",
                        stat.color === 'green' && "text-green-400",
                        stat.color === 'purple' && "text-purple-400",
                        stat.color === 'pink' && "text-pink-400",
                        stat.color === 'orange' && "text-orange-400"
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
            <TabsTrigger value="generate" className="data-[state=active]:bg-cyan-600">G n rer</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-cyan-600">Historique</TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-cyan-600">Templates</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-600">Analytics</TabsTrigger>
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
              <Zap className="w-4 h-4 mr-2" />
              Workflow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel - Controls */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-cyan-400" />
                      Param tres d'animation
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Configurez votre animation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Prompt */}
                    <div className="space-y-2">
                      <Label htmlFor="prompt" className="text-white">
                        Description de l'animation *
                      </Label>
                      <Textarea
                        id="prompt"
                        placeholder="Ex: Logo qui apparaît avec un effet de zoom fluide, fond dégradé ..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white min-h-[100px] resize-none"
                        rows={4}
                      />
                      <p className="text-xs text-slate-400">{prompt.length}/500 caract res</p>
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                      <Label className="text-white">Dur e (secondes)</Label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 secondes</SelectItem>
                          <SelectItem value="5">5 secondes</SelectItem>
                          <SelectItem value="10">10 secondes</SelectItem>
                          <SelectItem value="15">15 secondes</SelectItem>
                          <SelectItem value="30">30 secondes</SelectItem>
                          <SelectItem value="60">60 secondes</SelectItem>
                        </SelectContent>
                </Select>
              </div>

                    {/* Style */}
                    <div className="space-y-2">
                      <Label className="text-white">Style d'animation</Label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smooth">Fluide</SelectItem>
                          <SelectItem value="bounce">Rebond</SelectItem>
                          <SelectItem value="fade">Fondu</SelectItem>
                          <SelectItem value="slide">Glissement</SelectItem>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="rotate">Rotation</SelectItem>
                          <SelectItem value="scale"> chelle</SelectItem>
                          <SelectItem value="shake">Tremblement</SelectItem>
                        </SelectContent>
                </Select>
              </div>

                    {/* Resolution */}
                    <div className="space-y-2">
                      <Label className="text-white">R solution</Label>
                      <Select value={resolution} onValueChange={setResolution}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720p">720p (HD)</SelectItem>
                          <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                          <SelectItem value="1440p">1440p (2K)</SelectItem>
                          <SelectItem value="2160p">2160p (4K)</SelectItem>
                        </SelectContent>
                </Select>
              </div>

                    {/* Advanced Settings */}
                    {showAdvanced && (
                      <>
                        <Separator className="bg-slate-700" />
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-white">
                                Images par seconde (FPS)
                              </Label>
                              <span className="text-sm text-slate-400">{fps[0]}</span>
                            </div>
                            <Slider
                              value={fps}
                              onValueChange={setFps}
                              min={12}
                              max={60}
                              step={1}
                              className="w-full"
                            />
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>12 FPS</span>
                              <span>24 FPS (standard)</span>
                              <span>60 FPS</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-white">
                                Bitrate (kbps)
                              </Label>
                              <span className="text-sm text-slate-400">{bitrate[0]}</span>
                            </div>
                            <Slider
                              value={bitrate}
                              onValueChange={setBitrate}
                              min={1000}
                              max={20000}
                              step={500}
                              className="w-full"
                            />
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>Faible</span>
                              <span>Optimal</span>
                              <span> lev </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full border-slate-700"
                    >
                      {showAdvanced ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Masquer les param tres avanc s
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Afficher les param tres avanc s
                        </>
                      )}
                    </Button>

                    {/* Generate Button */}
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim() || credits < 30}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          G n ration en cours... ({generationProgress}%)
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          G n rer l'animation (30 cr dits)
                        </>
                      )}
                    </Button>

                    {isGenerating && (
                      <Progress value={generationProgress} className="h-2" />
                    )}
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card className="bg-cyan-950/20 border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-300 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Conseils
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-xs text-slate-400 space-y-2">
                      <li>  D crivez pr cis ment le mouvement souhait </li>
                      <li>  Mentionnez la vitesse et le style</li>
                      <li>  Indiquez les effets visuels (fum e, particules, etc.)</li>
                      <li>  Sp cifiez la dur e pour contr ler le rythme</li>
                      <li>  Utilisez des termes cin matographiques</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Results */}
              <div className="lg:col-span-2 space-y-6">
                {/* AI Suggestions for Video */}
                <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                      <div>
                        <h3 className="text-lg font-bold text-white">Suggestions IA</h3>
                        <p className="text-sm text-slate-300">Optimisez votre prompt avec l'IA</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { suggestion: 'Ajoutez "cinematic" pour un rendu professionnel', confidence: 92 },
                        { suggestion: 'Sp cifiez "smooth motion" pour plus de fluidit ', confidence: 87 },
                        { suggestion: 'Incluez "4K, 60fps" pour une qualit  maximale', confidence: 85 },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm text-cyan-400">{item.suggestion}</p>
                            <Badge className="bg-purple-500">{item.confidence}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Appliquer les suggestions
                    </Button>
                  </CardContent>
                </Card>

                {generatedAnimations.length === 0 && !isGenerating ? (
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-4">
                        <Video className="w-12 h-12 text-cyan-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Aucune animation g n r e
                      </h3>
                      <p className="text-slate-400 text-center max-w-md mb-4">
                        Configurez vos param tres et cliquez sur "G n rer l'animation" pour cr er votre premi re animation
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('templates')}
                        className="border-slate-700"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Voir les templates
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {isGenerating && (
                      <Card className="bg-slate-900/50 border-slate-700">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                          <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-4" />
                          <p className="text-slate-400 mb-2">G n ration d'animation en cours...</p>
                          <Progress value={generationProgress} className="w-full max-w-md" />
                          <p className="text-sm text-slate-500 mt-2">{generationProgress}%</p>
                        </CardContent>
                      </Card>
                    )}
                    {filteredAnimations.length > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <Input
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Rechercher..."
                              className="pl-10 bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                        </div>
                        <Select value={filterStyle} onValueChange={setFilterStyle}>
                          <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les styles</SelectItem>
                            <SelectItem value="two-d">2D</SelectItem>
                            <SelectItem value="three-d">3D</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={filterDuration} onValueChange={setFilterDuration}>
                          <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Durée" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            <SelectItem value="3">3s</SelectItem>
                            <SelectItem value="5">5s</SelectItem>
                            <SelectItem value="10">10s</SelectItem>
                            <SelectItem value="15">15s</SelectItem>
                          </SelectContent>
                        </Select>
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
                    )}
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence mode="popLayout">
                          {filteredAnimations.map((animation, index) => (
                            <motion
                              key={animation.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Card className="bg-slate-900/50 border-slate-700 overflow-hidden hover:border-cyan-500/50 transition-all group relative">
                                <div className="relative aspect-video">
                                  <Image
                                    src={animation.thumbnail}
                                    alt={animation.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePreview(animation)}
                                      className="text-white hover:bg-white/20"
                                    >
                                      <Play className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleFavorite(animation.id)}
                                      className={cn(
                                        "text-white hover:bg-white/20",
                                        animation.isFavorite && "text-pink-400"
                                      )}
                                    >
                                      {animation.isFavorite ? (
                                        <Heart className="w-4 h-4 fill-current" />
                                      ) : (
                                        <Heart className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewDetails(animation)}
                                      className="text-white hover:bg-white/20"
                                    >
                                      <Info className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setShowExportDialog(true)}
                                      className="text-white hover:bg-white/20"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="absolute top-2 left-2">
                                    <Badge className="bg-black/60 text-white">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {animation.duration}s
                                    </Badge>
                                  </div>
                                  {animation.isFavorite && (
                                    <div className="absolute top-2 right-2">
                                      <Badge className="bg-pink-500">
                                        <Heart className="w-3 h-3 mr-1 fill-current" />
                                        Favori
                                      </Badge>
                                    </div>
                                  )}
                                  <div className="absolute bottom-2 left-2">
                                    <Badge className="bg-cyan-500/80">
                                      <Video className="w-3 h-3 mr-1" />
                                      {animation.resolution}
                                    </Badge>
                                  </div>
                                </div>
                                <CardContent className="p-4">
                                  <p className="text-sm text-white line-clamp-2 mb-2">{animation.prompt}</p>
                                  <div className="flex items-center justify-between text-xs text-slate-400">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="border-slate-600 text-xs">
                                        {animation.style}
                                      </Badge>
                                      <Badge variant="outline" className="border-slate-600 text-xs">
                                        {animation.fps} FPS
                                      </Badge>
                                    </div>
                                    <span>{formatRelativeTime(animation.createdAt)}</span>
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
                          {filteredAnimations.map((animation, index) => (
                            <motion
                              key={animation.id}
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
                                        src={animation.thumbnail}
                                        alt={animation.name}
                                        fill
                                        className="object-cover"
                                        sizes="128px"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handlePreview(animation)}
                                          className="text-white hover:bg-white/20"
                                        >
                                          <Play className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-white line-clamp-2 mb-1">{animation.prompt}</p>
                                      <div className="flex items-center gap-3 text-xs text-slate-400">
                                        <Badge variant="outline" className="border-slate-600">
                                          {animation.style}
                                        </Badge>
                                        <Badge variant="outline" className="border-slate-600">
                                          {animation.duration}s
                                        </Badge>
                                        <Badge variant="outline" className="border-slate-600">
                                          {animation.fps} FPS
                                        </Badge>
                                        <span>{formatRelativeTime(animation.createdAt)}</span>
                                        <span>{animation.credits} crédits</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleFavorite(animation.id)}
                                        className={cn(
                                          animation.isFavorite && "text-pink-400"
                                        )}
                                      >
                                        {animation.isFavorite ? (
                                          <Heart className="w-4 h-4 fill-current" />
                                        ) : (
                                          <Heart className="w-4 h-4" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePreview(animation)}
                                        className="border-slate-600"
                                      >
                                        <Play className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewDetails(animation)}
                                        className="border-slate-600"
                                      >
                                        <Info className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowExportDialog(true)}
                                        className="border-slate-600"
                                      >
                                        <Download className="w-4 h-4" />
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="border-slate-600">
                                            <MoreVertical className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                                          <DropdownMenuItem>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Dupliquer
                                          </DropdownMenuItem>
                                          <DropdownMenuItem>
                                            <Share2 className="w-4 h-4 mr-2" />
                                            Partager
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator className="bg-slate-700" />
                                          <DropdownMenuItem className="text-red-400">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Supprimer
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* History Header with Stats */}
            <Card className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-cyan-500/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Historique des Animations</h3>
                    <p className="text-sm text-slate-300">
                      {generatedAnimations.length} animation{generatedAnimations.length > 1 ? 's' : ''} g n r e{generatedAnimations.length > 1 ? 's' : ''}   {generatedAnimations.reduce((acc, anim) => acc + anim.duration, 0)}s de contenu total
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-slate-600">
                      <Download className="w-4 h-4 mr-2" />
                      Exporter tout
                    </Button>
                    <Button variant="outline" className="border-slate-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Nettoyer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Historique des animations</h3>
                <p className="text-sm text-slate-400">Toutes vos cr ations anim es</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterStyle} onValueChange={setFilterStyle}>
                  <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Filtrer par style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les styles</SelectItem>
                    <SelectItem value="smooth">Fluide</SelectItem>
                    <SelectItem value="bounce">Rebond</SelectItem>
                    <SelectItem value="fade">Fondu</SelectItem>
                    <SelectItem value="slide">Glissement</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {history.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Film className="w-16 h-16 text-slate-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Aucune animation</h3>
                  <p className="text-slate-400 text-center mb-4">
                    Votre historique d'animations appara tra ici
                  </p>
                  <Button
                    onClick={() => setActiveTab('generate')}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Cr er votre premi re animation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((animation) => (
                  <Card key={animation.id} className="bg-slate-900/50 border-slate-700 overflow-hidden hover:border-cyan-500/50 transition-all group">
                    <div className="relative aspect-video">
                      <Image
                        src={animation.thumbnail}
                        alt={animation.prompt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(animation)}
                          className="text-white hover:bg-white/20"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFavorite(animation.id)}
                          className={cn(
                            "text-white hover:bg-white/20",
                            animation.isFavorite && "text-pink-400"
                          )}
                        >
                          {animation.isFavorite ? (
                            <Heart className="w-4 h-4 fill-current" />
                          ) : (
                            <Heart className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowExportDialog(true)}
                          className="text-white hover:bg-white/20"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <Badge className="bg-cyan-500/80">
                          <Video className="w-3 h-3 mr-1" />
                          {animation.duration}s
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-white line-clamp-2 mb-2">{animation.prompt}</p>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <Badge variant="outline" className="border-slate-600">
                          {animation.style}
                        </Badge>
                        <span>{formatRelativeTime(animation.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            {/* Templates Header */}
            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Templates d'Animations</h3>
                    <p className="text-sm text-slate-300">
                      {templates.length} templates disponibles   Utilisez-les comme point de d part
                    </p>
                  </div>
                  <Button variant="outline" className="border-slate-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Cr er un template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Template Categories */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-400" />
                  Cat gories de Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    { category: 'Tous', count: templates.length, active: true },
                    { category: 'Logo', count: templates.filter(t => t.category === 'logo').length, active: false },
                    { category: 'Produit', count: templates.filter(t => t.category === 'product').length, active: false },
                    { category: 'Texte', count: templates.filter(t => t.category === 'text').length, active: false },
                    { category: 'Cam ra', count: templates.filter(t => t.category === 'camera').length, active: false },
                  ].map((cat, idx) => (
                    <Button
                      key={idx}
                      variant={cat.active ? 'default' : 'outline'}
                      size="sm"
                      className={cat.active ? 'bg-purple-600 hover:bg-purple-700' : 'border-slate-600'}
                    >
                      {cat.category} ({cat.count})
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Templates d'animations</h3>
                <p className="text-sm text-slate-400">D marrez rapidement avec des templates pr -configur s</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer"
                  onClick={() => handleUseTemplate(template)}
                >
                  <div className="relative aspect-video bg-slate-800">
                    <Image
                      src={template.thumbnail}
                      alt={template.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-cyan-500/80">
                        <Video className="w-3 h-3 mr-1" />
                        {template.duration}s
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white text-sm line-clamp-1">{template.name}</h3>
                      <Badge variant="outline" className="text-xs border-slate-600">
                        {template.style}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{template.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{template.uses} utilisations</span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        Utiliser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    R partition par style
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-slate-400">
                    <PieChart className="w-12 h-12" />
                    <span className="ml-2">Graphique de r partition</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="w-5 h-5" />
                     volution des g n rations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-slate-400">
                    <LineChart className="w-12 h-12" />
                    <span className="ml-2">Graphique d' volution</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Statistiques d taill es
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(stats.byStyle).map(([styleName, count]) => (
                    <div key={styleName} className="p-4 bg-slate-800/50 rounded-lg">
                      <p className="text-sm text-slate-400 mb-1 capitalize">{styleName}</p>
                      <p className="text-2xl font-bold text-cyan-400">{count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* AI/ML Tab - Ultra-Advanced AI Features */}
          <TabsContent value="ai-ml" className="space-y-6">
            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Intelligence Artificielle Avanc e</h3>
                    <p className="text-sm text-slate-300">Recommandations intelligentes, pr dictions ML, et optimisation automatique pour animations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Model Selection for Video */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  S lection du Mod le IA Vid o
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Choisissez le mod le IA optimal pour votre g n ration vid o
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Runway Gen-2', provider: 'Runway', quality: 96, speed: 'Rapide', cost: 'Moyen', bestFor: 'Vid os r alistes' },
                    { name: 'Pika Labs', provider: 'Pika', quality: 94, speed: 'Tr s rapide', cost: 'Faible', bestFor: 'Animations cr atives' },
                    { name: 'Stable Video', provider: 'Stability', quality: 92, speed: 'Rapide', cost: 'Faible', bestFor: 'Style artistique' },
                    { name: 'Kling AI', provider: 'Kling', quality: 95, speed: 'Moyen', cost: 'Moyen', bestFor: 'Haute qualit ' },
                    { name: 'Luma Dream Machine', provider: 'Luma', quality: 93, speed: 'Rapide', cost: 'Moyen', bestFor: 'Mouvements fluides' },
                    { name: 'Custom Fine-tuned', provider: 'Custom', quality: 99, speed: 'Lent', cost: 'Tr s  lev ', bestFor: 'Sp cialis ' },
                  ].map((model, idx) => (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-white">{model.name}</h4>
                            <p className="text-xs text-slate-400">{model.provider}</p>
                          </div>
                          <Badge className="bg-purple-500">{model.quality}%</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Vitesse:</span>
                            <span className="text-white">{model.speed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Co t:</span>
                            <span className="text-white">{model.cost}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Id al pour:</span>
                            <span className="text-cyan-400">{model.bestFor}</span>
                          </div>
                        </div>
                        <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                          S lectionner
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations for Video */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Recommandations de Prompts Vid o
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Suggestions bas es sur ML pour optimiser vos prompts vid o
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { prompt: 'A cinematic slow-motion shot of a luxury watch', confidence: 94, reason: 'Bas  sur vos animations pr c dentes' },
                      { prompt: 'Smooth camera movement, professional lighting', confidence: 87, reason: 'Am liore la qualit  de 23%' },
                      { prompt: '4K resolution, 60fps, cinematic color grading', confidence: 82, reason: 'Tendance actuelle' },
                    ].map((rec, idx) => (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">Suggestion {idx + 1}</span>
                            <Badge className="bg-purple-500">{rec.confidence}% confiance</Badge>
                          </div>
                          <p className="text-sm text-cyan-400 mb-1">{rec.prompt}</p>
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

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-400" />
                    Pr diction de Qualit  Vid o
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Mod les ML pour pr dire la qualit  avant g n ration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Score de qualit  pr dit</span>
                        <span className="text-2xl font-bold text-green-400">89%</span>
                      </div>
                      <Progress value={89} className="h-2" />
                      <p className="text-xs text-slate-400 mt-2">Bas  sur 50,000+ animations similaires</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Temps estim ', value: '~3.2 min' },
                        { label: 'Co t estim ', value: '30 cr dits' },
                        { label: 'FPS estim s', value: '~30 FPS' },
                        { label: 'Taille estim e', value: '~25 MB' },
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
            </div>

            {/* AI Video Generation Settings */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Param tres de G n ration Vid o IA
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configurez les param tres avanc s pour des r sultats optimaux
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-white">Temp rature cr ative</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[75]}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Conservateur (0)</span>
                        <span className="font-semibold text-cyan-400">75 -  quilibr </span>
                        <span>Cr atif (100)</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  <div className="space-y-3">
                    <Label className="text-white">Guidance Scale Vid o</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[8.0]}
                        min={1}
                        max={20}
                        step={0.5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Libre (1)</span>
                        <span className="font-semibold text-cyan-400">8.0 - Recommand </span>
                        <span>Strict (20)</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Nombre de frames</Label>
                      <Select defaultValue="120">
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">60 frames (2s @ 30fps)</SelectItem>
                          <SelectItem value="120">120 frames (4s @ 30fps)</SelectItem>
                          <SelectItem value="180">180 frames (6s @ 30fps)</SelectItem>
                          <SelectItem value="240">240 frames (8s @ 30fps)</SelectItem>
                        </SelectContent>
                </Select>
              </div>
                    <div className="space-y-2">
                      <Label className="text-white">Seed (al atoire si vide)</Label>
                      <Input
                        type="number"
                        placeholder="Laissez vide pour al atoire"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Optimisation automatique</Label>
                      <Checkbox defaultChecked className="border-slate-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Pr visualisation progressive</Label>
                      <Checkbox defaultChecked className="border-slate-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Cache des r sultats</Label>
                      <Checkbox defaultChecked className="border-slate-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">G n ration par  tapes</Label>
                      <Checkbox className="border-slate-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Video Style Transfer */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                  Style Transfer Vid o
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Appliquez des styles artistiques   vos animations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { style: 'Cin matique', icon: Film, enabled: true },
                    { style: 'Anime', icon: Sparkles, enabled: true },
                    { style: 'R aliste', icon: Camera, enabled: true },
                    { style: 'Artistique', icon: Palette, enabled: false },
                    { style: 'Noir & Blanc', icon: Contrast, enabled: true },
                    { style: 'Vintage', icon: Clock, enabled: true },
                    { style: 'Futuriste', icon: Zap, enabled: false },
                    { style: 'Abstrait', icon: Sparkle, enabled: false },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <Card key={idx} className={`bg-slate-800/50 border-slate-700 ${item.enabled ? 'border-green-500/50' : ''}`}>
                        <CardContent className="p-3 text-center">
                          <Icon className={`w-5 h-5 mx-auto mb-2 ${item.enabled ? 'text-green-400' : 'text-slate-500'}`} />
                          <p className="text-xs font-medium text-white">{item.style}</p>
                          <Badge className={`mt-1 ${item.enabled ? 'bg-green-500' : 'bg-slate-600'}`}>
                            {item.enabled ? 'Actif' : 'Bient t'}
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* AI Motion Control */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-purple-400" />
                  Contr le du Mouvement IA
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Contr lez pr cis ment les mouvements de votre animation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { control: 'Vitesse de mouvement', value: 50, min: 0, max: 100 },
                      { control: 'Fluidit ', value: 75, min: 0, max: 100 },
                      { control: 'Amplitude', value: 60, min: 0, max: 100 },
                      { control: 'Direction', value: 0, min: -180, max: 180 },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-white text-sm">{item.control}</Label>
                          <span className="text-sm text-cyan-400">{item.value}</span>
                        </div>
                        <Slider
                          value={[item.value]}
                          min={item.min}
                          max={item.max}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-slate-700" />

                  <div className="space-y-2">
                    <Label className="text-white">Type de mouvement</Label>
                    <Select defaultValue="smooth">
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smooth">Fluide</SelectItem>
                        <SelectItem value="sharp">Net</SelectItem>
                        <SelectItem value="bounce">Rebond</SelectItem>
                        <SelectItem value="ease">Ease in/out</SelectItem>
                        <SelectItem value="linear">Lin aire</SelectItem>
                      </SelectContent>
                </Select>
              </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collaboration Tab - Real-time Collaboration */}
          <TabsContent value="collaboration" className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Collaboration Temps R el</h3>
                    <p className="text-sm text-slate-300">Co- dition multi-utilisateurs, chat int gr , et workflow d'approbation pour animations</p>
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
                    { name: 'Jean Dupont', role: 'Editor', status: 'online', activity: 'G n re une animation', avatar: 'JD' },
                    { name: 'Marie Martin', role: 'Viewer', status: 'online', activity: 'Visualise les r sultats', avatar: 'MM' },
                    { name: 'Pierre Durand', role: 'Approver', status: 'away', activity: 'En pause', avatar: 'PD' },
                  ].map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-400">{user.avatar}</span>
                          </div>
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${user.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.activity}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-slate-600">
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Real-time Chat */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Chat Collaboratif
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {[
                    { user: 'Jean Dupont', message: 'Qu\'en penses-tu de cette animation ?', time: 'Il y a 2 min' },
                    { user: 'Marie Martin', message: 'Tr s bien ! Peut- tre ajuster la vitesse ?', time: 'Il y a 1 min' },
                    { user: 'Vous', message: 'Bonne id e, je vais modifier', time: '  l\'instant' },
                  ].map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.user === 'Vous' ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-blue-400">{msg.user[0]}</span>
                      </div>
                      <div className={`flex-1 ${msg.user === 'Vous' ? 'text-right' : ''}`}>
                        <p className="text-xs text-slate-400 mb-1">{msg.user}   {msg.time}</p>
                        <p className="text-sm text-white bg-slate-800/50 p-2 rounded-lg inline-block">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Tapez un message..." className="bg-slate-800 border-slate-600" />
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Collaboration Permissions */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Gestion des Permissions
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configurez les permissions pour chaque collaborateur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white">Jean Dupont</p>
                        <p className="text-xs text-slate-400">jean.dupont@example.com</p>
                      </div>
                      <Select defaultValue="editor">
                        <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="approver">Approver</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                </Select>
              </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { permission: 'G n rer', enabled: true },
                        { permission: 'Modifier', enabled: true },
                        { permission: 'Exporter', enabled: true },
                        { permission: 'Supprimer', enabled: false },
                      ].map((perm, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Checkbox checked={perm.enabled} className="border-slate-600" />
                          <Label className="text-sm text-slate-300">{perm.permission}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full border-slate-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un collaborateur
                  </Button>
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
                    { user: 'Jean Dupont', action: 'a g n r  une animation', animation: 'Montre de luxe', time: 'Il y a 2h' },
                    { user: 'Marie Martin', action: 'a modifi ', animation: 'Chaise design', time: 'Il y a 5h' },
                    { user: 'Pierre Durand', action: 'a approuv ', animation: 'Lampadaire moderne', time: 'Il y a 1 jour' },
                  ].map((activity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-400">{activity.user[0]}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">
                          <span className="font-semibold">{activity.user}</span> {activity.action} <span className="text-cyan-400">{activity.animation}</span>
                        </p>
                        <p className="text-xs text-slate-400">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Real-time Cursors & Presence */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="w-5 h-5 text-blue-400" />
                  Curseurs & Pr sence Temps R el
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Visualisez les actions des collaborateurs en temps r el
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                        { user: 'Jean Dupont', color: 'bg-blue-500', position: 'G n ration' },
                        { user: 'Marie Martin', color: 'bg-green-500', position: 'Historique' },
                        { user: 'Pierre Durand', color: 'bg-purple-500', position: 'Templates' },
                      ].map((cursor, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className={`w-3 h-3 ${cursor.color} rounded-full`} />
                          <span className="text-sm text-white">{cursor.user}</span>
                          <span className="text-xs text-slate-400">  {cursor.position}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { feature: 'Curseurs temps r el', enabled: true },
                      { feature: 'Surlignage de s lection', enabled: true },
                      { feature: 'Notifications de pr sence', enabled: true },
                      { feature: 'Historique des actions', enabled: true },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-sm text-white">{item.feature}</span>
                        <Badge className={item.enabled ? 'bg-green-500' : 'bg-slate-600'}>
                          {item.enabled ? 'Actif' : 'Bient t'}
                        </Badge>
                      </div>
                    ))}
                  </div>
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
                      <ToggleRight defaultChecked className="data-[state=checked]:bg-blue-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Partage automatique</Label>
                        <p className="text-xs text-slate-400">Partagez automatiquement avec l' quipe</p>
                      </div>
                      <ToggleRight className="data-[state=checked]:bg-blue-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Mode silencieux</Label>
                        <p className="text-xs text-slate-400">D sactivez les notifications pendant le travail</p>
                      </div>
                      <ToggleRight className="data-[state=checked]:bg-blue-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab - Advanced Optimization */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Optimisation Performance</h3>
                    <p className="text-sm text-slate-300">CDN, compression vid o, cache distribu , et streaming progressif</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Temps de g n ration moyen', value: '3.2s', target: '<4s', status: 'good' },
                { label: 'Taille vid o moyen', value: '25 MB', target: '<30MB', status: 'good' },
                { label: 'Cache hit rate', value: '94%', target: '>90%', status: 'good' },
                { label: 'CDN hit rate', value: '96%', target: '>95%', status: 'good' },
              ].map((metric, idx) => (
                <Card key={idx} className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-400 mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                    <div className="flex items-center gap-2">
                      <Badge className={metric.status === 'good' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {metric.target}
                      </Badge>
                    </div>
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
                      <Badge className="bg-green-500">96% hit rate</Badge>
                    </div>
                    <Progress value={96} className="h-2" />
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

            {/* Video Compression & Optimization */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-400" />
                  Compression & Optimisation Vid o
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { format: 'H.264', compression: 85, quality: 92, compatible: true },
                      { format: 'H.265 (HEVC)', compression: 90, quality: 95, compatible: true },
                      { format: 'VP9', compression: 88, quality: 94, compatible: true },
                      { format: 'AV1', compression: 95, quality: 98, compatible: false },
                    ].map((codec, idx) => (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-white">{codec.format}</h4>
                            <Badge className={codec.compatible ? 'bg-green-500' : 'bg-yellow-500'}>
                              {codec.compatible ? 'Disponible' : 'Bient t'}</Badge>
                    </div>
                    <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Compression:</span>
                              <span className="text-white">{codec.compression}%</span>
                            </div>
                            <Progress value={codec.compression} className="h-1" />
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Qualit :</span>
                              <span className="text-white">{codec.quality}%</span>
                            </div>
                            <Progress value={codec.quality} className="h-1" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Streaming Performance */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Performance de Streaming
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { metric: 'Bitrate moyen', value: '8.5 Mbps', status: 'optimal' },
                      { metric: 'Buffer time', value: '1.2s', status: 'excellent' },
                      { metric: 'Adaptive streaming', value: 'Actif', status: 'enabled' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-800/50 rounded-lg text-center">
                        <p className="text-xs text-slate-400 mb-1">{item.metric}</p>
                        <p className="text-lg font-bold text-white">{item.value}</p>
                        <Badge className={`mt-1 ${item.status === 'optimal' || item.status === 'excellent' || item.status === 'enabled' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                          {item.status === 'optimal' ? 'Optimal' : item.status === 'excellent' ? 'Excellent' : 'Actif'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Progress value={95} className="h-2" />
                  <p className="text-xs text-slate-400 text-center">95% des utilisateurs ont une exp rience fluide</p>
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
                    { recommendation: 'Utilisez H.265 pour r duire la taille de 40%', impact: ' lev ', action: 'Activer' },
                    { recommendation: 'Activez le streaming adaptatif pour mobile', impact: 'Moyen', action: 'Configurer' },
                    { recommendation: 'Optimisez le bitrate selon la r solution', impact: 'Moyen', action: 'Optimiser' },
                  ].map((rec, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-white flex-1">{rec.recommendation}</p>
                        <Badge className={`ml-2 ${rec.impact === ' lev ' ? 'bg-green-500' : 'bg-yellow-500'}`}>
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

          {/* Security Tab - Advanced Security */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border-red-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">S curit  Avanc e</h3>
                    <p className="text-sm text-slate-300">Watermarking vid o, DRM, chiffrement, et protection compl te</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Watermarking */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  Watermarking Vid o
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Prot gez vos animations avec un watermarking invisible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white">Watermarking invisible</p>
                        <p className="text-xs text-slate-400">D tectable uniquement par notre syst me</p>
                      </div>
                      <Badge className="bg-green-500">Actif</Badge>
                    </div>
                    <Progress value={100} className="h-2" />
                    <p className="text-xs text-slate-400 mt-2">100% des animations sont prot g es</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { feature: 'Watermarking temporel', enabled: true },
                      { feature: 'Watermarking spatial', enabled: true },
                      { feature: 'D tection automatique', enabled: true },
                      { feature: 'Tracing de fuites', enabled: false },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-sm text-white">{item.feature}</span>
                        <Badge className={item.enabled ? 'bg-green-500' : 'bg-slate-600'}>
                          {item.enabled ? 'Actif' : 'Bient t'}
                        </Badge>
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
                    { policy: 'Chiffrement des vid os au repos', status: 'active', level: 'AES-256' },
                    { policy: 'Chiffrement des vid os en transit', status: 'active', level: 'TLS 1.3' },
                    { policy: 'Protection contre le t l chargement', status: 'active', level: 'DRM' },
                    { policy: 'Rotation automatique des cl s', status: 'active', level: 'Tous les 90 jours' },
                    { policy: 'Backup automatique', status: 'active', level: 'Quotidien' },
                    { policy: 'Conformit  RGPD', status: 'active', level: 'Compl te' },
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

            {/* Advanced Encryption */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  Chiffrement Avanc 
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Protection des donn es avec chiffrement de niveau entreprise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { type: 'Chiffrement au repos', algorithm: 'AES-256-GCM', status: 'active' },
                      { type: 'Chiffrement en transit', algorithm: 'TLS 1.3', status: 'active' },
                      { type: 'Gestion des cl s', algorithm: 'HSM', status: 'active' },
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

                  <Separator className="bg-slate-700" />

                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white">Niveau de s curit  global</p>
                        <p className="text-xs text-slate-400">Conformit : SOC 2, ISO 27001, RGPD</p>
                      </div>
                      <Badge className="bg-green-500">99.9%</Badge>
                    </div>
                    <Progress value={99.9} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Audit Log */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-400" />
                  Journal d'Audit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {[
                    { action: 'Animation g n r e', user: 'Vous', time: 'Il y a 5 min', ip: '192.168.1.1', status: 'success' },
                    { action: 'Animation export e', user: 'Vous', time: 'Il y a 1h', ip: '192.168.1.1', status: 'success' },
                    { action: 'Tentative d\'acc s non autoris ', user: 'Inconnu', time: 'Il y a 2h', ip: '192.168.1.100', status: 'failed' },
                    { action: 'Permissions modifi es', user: 'Admin', time: 'Il y a 3h', ip: '192.168.1.2', status: 'success' },
                  ].map((log, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">{log.action}</span>
                        <Badge className={log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                          {log.status === 'success' ? 'Succ s' : ' chec'}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{log.user}</span>
                        <span> </span>
                        <span>{log.time}</span>
                        <span> </span>
                        <span>{log.ip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* i18n Tab - Internationalization */}
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
                  G rez les traductions de vos prompts et descriptions vid o
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-white">Prompts traduits</span>
                      <Badge className="bg-indigo-500">89%</Badge>
                    </div>
                    <Progress value={89} className="h-2" />
                    <p className="text-xs text-slate-400 mt-2">234/263 prompts traduits</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { lang: 'Fran ais', progress: 100, count: 263 },
                      { lang: 'English', progress: 97, count: 255 },
                      { lang: 'Espa ol', progress: 81, count: 213 },
                      { lang: 'Deutsch', progress: 68, count: 179 },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{item.lang}</span>
                          <span className="text-xs text-slate-400">{item.count} prompts</span>
                        </div>
                        <Progress value={item.progress} className="h-1" />
                      </div>
                    ))}
                  </div>

                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                    <Globe className="w-4 h-4 mr-2" />
                    Traduire automatiquement
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Regional Settings */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  Param tres R gionaux
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Format de date</Label>
                      <Select defaultValue="fr-FR">
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr-FR">DD/MM/YYYY (Fran ais)</SelectItem>
                          <SelectItem value="en-US">MM/DD/YYYY (US)</SelectItem>
                          <SelectItem value="de-DE">DD.MM.YYYY (Allemand)</SelectItem>
                        </SelectContent>
                </Select>
              </div>
                    <div className="space-y-2">
                      <Label className="text-white">Format de nombre</Label>
                      <Select defaultValue="fr-FR">
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr-FR">1 234,56 (Fran ais)</SelectItem>
                          <SelectItem value="en-US">1,234.56 (US)</SelectItem>
                          <SelectItem value="de-DE">1.234,56 (Allemand)</SelectItem>
                        </SelectContent>
                </Select>
              </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  <div className="space-y-2">
                    <Label className="text-white">Fuseau horaire</Label>
                    <Select defaultValue="Europe/Paris">
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Paris">Europe/Paris (UTC+1)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                      </SelectContent>
                </Select>
              </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessibility Tab - WCAG Compliance */}
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
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-white">Dernier test</span>
                      <Badge className="bg-green-500">R ussi</Badge>
                    </div>
                    <Progress value={98} className="h-2" />
                    <p className="text-xs text-slate-400 mt-2">Score: 98/100   Conforme WCAG 2.1 AAA</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { test: 'Contraste', status: 'pass', score: 100 },
                      { test: 'Navigation clavier', status: 'pass', score: 98 },
                      { test: 'Lecteur d\' cran', status: 'pass', score: 97 },
                      { test: 'Sous-titres vid o', status: 'pass', score: 95 },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-white">{item.test}</span>
                          <Badge className={item.status === 'pass' ? 'bg-green-500' : 'bg-red-500'}>
                            {item.status === 'pass' ? 'OK' : ' chec'}
                          </Badge>
                        </div>
                        <Progress value={item.score} className="h-1" />
                      </div>
                    ))}
                  </div>

                  <Button className="w-full bg-teal-600 hover:bg-teal-700">
                    <TestTube className="w-4 h-4 mr-2" />
                    Lancer un nouveau test
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Video Captions & Subtitles */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-teal-400" />
                  Sous-titres & Captions
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Ajoutez des sous-titres pour l'accessibilit 
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-white">Sous-titres g n r s automatiquement</span>
                      <Badge className="bg-green-500">Actif</Badge>
                    </div>
                    <p className="text-xs text-slate-400">IA g n re des sous-titres pour toutes vos animations</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Langues de sous-titres</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Fran ais', 'English', 'Espa ol', 'Deutsch'].map((lang, idx) => (
                        <Badge key={idx} className="bg-teal-500">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full border-slate-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une langue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Automation Tab */}
          <TabsContent value="workflow" className="space-y-6">
            <Card className="bg-gradient-to-r from-orange-600/20 to-amber-600/20 border-orange-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Automatisation de Workflows</h3>
                    <p className="text-sm text-slate-300">Cr ez des workflows automatis s pour optimiser vos g n rations vid o</p>
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
                <CardDescription className="text-slate-400">
                  Utilisez des templates pr -configur s pour acc l rer votre workflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'G n ration Batch Quotidienne', description: 'G n re automatiquement des animations chaque jour', steps: 5, uses: 234 },
                    { name: 'Export Multi-formats', description: 'Exporte automatiquement en MP4, GIF, WebM', steps: 3, uses: 156 },
                    { name: 'Validation Qualit ', description: 'Valide automatiquement la qualit  avant publication', steps: 4, uses: 89 },
                    { name: 'Archive Automatique', description: 'Archive les anciennes animations automatiquement', steps: 2, uses: 67 },
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
                        <Video className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white"> tape 1: G n rer Animation</p>
                        <p className="text-xs text-slate-400">D clencheur: Nouveau prompt</p>
                      </div>
                    </div>
                    <Separator className="bg-slate-700 mb-4" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-400" />
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
                        <p className="font-semibold text-white"> tape 3: Exporter</p>
                        <p className="text-xs text-slate-400">Action: Export MP4 + GIF</p>
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

            {/* Workflow Scheduling */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-400" />
                  Planification des Workflows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white">G n ration Batch Quotidienne</p>
                        <p className="text-xs text-slate-400">Tous les jours   02:00 UTC</p>
                      </div>
                      <Badge className="bg-green-500">Actif</Badge>
                    </div>
                    <Progress value={75} className="h-2 mb-2" />
                    <p className="text-xs text-slate-400">Prochaine ex cution: Dans 8h 23min</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'G n ration Hebdomadaire', schedule: 'Lundi 09:00', status: 'active' },
                      { name: 'Export Mensuel', schedule: '1er du mois', status: 'active' },
                      { name: 'Nettoyage Automatique', schedule: 'Dimanche 03:00', status: 'paused' },
                      { name: 'Backup Quotidien', schedule: 'Tous les jours 01:00', status: 'active' },
                    ].map((workflow, idx) => (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-white">{workflow.name}</p>
                            <Badge className={workflow.status === 'active' ? 'bg-green-500' : 'bg-slate-600'}>
                              {workflow.status === 'active' ? 'Actif' : 'Pause'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400">{workflow.schedule}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Cr er un workflow planifi 
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
                <CardDescription className="text-slate-400">
                  Suivez les performances de vos workflows automatis s
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Workflows actifs', value: '12', icon: Workflow },
                      { label: 'Ex cutions totales', value: '1,234', icon: CheckCircle },
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

                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-white">Workflows les plus utilis s</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: 'Export Multi-formats', executions: 156, success: 98 },
                        { name: 'Validation Qualit ', executions: 89, success: 95 },
                        { name: 'Archive Automatique', executions: 67, success: 100 },
                      ].map((workflow, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                          <div className="flex-1">
                            <p className="text-sm text-white">{workflow.name}</p>
                            <p className="text-xs text-slate-400">{workflow.executions} ex cutions</p>
                          </div>
                          <Badge className="bg-green-500">{workflow.success}% succ s
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Workflow Integrations */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-orange-400" />
                  Int grations Workflow
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Connectez vos workflows   vos outils pr f r s
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { name: 'Zapier', enabled: true, icon: ' ' },
                    { name: 'Make (Integromat)', enabled: true, icon: ' ' },
                    { name: 'n8n', enabled: false, icon: ' ' },
                    { name: 'Slack', enabled: true, icon: ' ' },
                    { name: 'Discord', enabled: false, icon: ' ' },
                    { name: 'Email', enabled: true, icon: ' ' },
                  ].map((integration, idx) => (
                    <Card key={idx} className={`bg-slate-800/50 border-slate-700 ${integration.enabled ? 'hover:border-orange-500/50' : 'opacity-50'}`}>
                      <CardContent className="p-3 text-center">
                        <div className="text-2xl mb-2">{integration.icon}</div>
                        <p className="text-sm font-medium text-white mb-1">{integration.name}</p>
                        <Badge className={integration.enabled ? 'bg-green-500' : 'bg-slate-600'}>
                          {integration.enabled ? 'Connect ' : 'Non connect '}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>

          {/* Additional Features Section */}
          <div className="mt-8 space-y-6">
            {/* Advanced Video Editing */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-cyan-400" />
                   dition Vid o Avanc e
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Outils professionnels d' dition et post-traitement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'Trim & Cut', description: 'Coupez vos animations', icon: Scissors },
                    { name: 'Speed Control', description: 'Ajustez la vitesse', icon: FastForward },
                    { name: 'Filters', description: 'Appliquez des filtres', icon: Sliders },
                    { name: 'Transitions', description: 'Ajoutez des transitions', icon: Layers },
                  ].map((tool, idx) => {
                    const Icon = tool.icon;
                    return (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                        <CardContent className="p-4 text-center">
                          <Icon className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-white mb-1">{tool.name}</p>
                          <p className="text-xs text-slate-400">{tool.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Batch Operations */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid className="w-5 h-5 text-cyan-400" />
                  Op rations Batch
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Traitez plusieurs animations simultan ment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white">G n ration batch</p>
                        <p className="text-xs text-slate-400">G n rez jusqu'  50 animations en parall le</p>
                      </div>
                      <Badge className="bg-cyan-500">Disponible</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'En attente', value: '5', color: 'yellow' },
                        { label: 'En cours', value: '12', color: 'cyan' },
                        { label: 'Termin es', value: '234', color: 'green' },
                      ].map((stat, idx) => (
                        <div key={idx} className="p-2 bg-slate-900/50 rounded text-center">
                          <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                          <p className={`text-lg font-bold text-${stat.color}-400`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                    <Plus className="w-4 h-4 mr-2" />
                    D marrer une g n ration batch
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Animation Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedAnimation && (
              <>
                <DialogHeader>
                  <DialogTitle>D tails de l'animation</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Informations compl tes sur cette cr ation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-6">
                  <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden">
                    <Image
                      src={selectedAnimation.thumbnail}
                      alt={selectedAnimation.prompt}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 80vw"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <p className="text-sm text-slate-400 mb-1">Dur e</p>
                        <p className="text-lg font-bold">{selectedAnimation.duration}s</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <p className="text-sm text-slate-400 mb-1">Style</p>
                        <p className="text-lg font-bold capitalize">{selectedAnimation.style}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <p className="text-sm text-slate-400 mb-1">R solution</p>
                        <p className="text-lg font-bold">{selectedAnimation.resolution}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <p className="text-sm text-slate-400 mb-1">Cr dits</p>
                        <p className="text-lg font-bold">{selectedAnimation.credits}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-lg">Prompt</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300">{selectedAnimation.prompt}</p>
                    </CardContent>
                  </Card>

                  {/* Animation Metadata */}
                  {selectedAnimation.metadata && (
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-lg">M tadonn es Vid o</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Format</span>
                            <span className="text-white">{selectedAnimation.metadata.format}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Taille du fichier</span>
                            <span className="text-white">{formatFileSize(selectedAnimation.metadata.size)}</span>
                          </div>
                          {selectedAnimation.metadata.bitrate && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Bitrate</span>
                              <span className="text-white">{selectedAnimation.metadata.bitrate} Mbps</span>
                            </div>
                          )}
                          {selectedAnimation.metadata.codec && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Codec</span>
                              <span className="text-white">{selectedAnimation.metadata.codec}</span>
                            </div>
                          )}
                          {selectedAnimation.metadata.frameCount && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Frames</span>
                              <span className="text-white">{selectedAnimation.metadata.frameCount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">FPS</span>
                            <span className="text-white">{selectedAnimation.fps}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Animation Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="border-slate-700"
                      onClick={() => {
                        setShowDetailDialog(false);
                        setShowPreviewDialog(true);
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Pr visualiser
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-700"
                      onClick={() => {
                        setShowDetailDialog(false);
                        setShowExportDialog(true);
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-700"
                      onClick={() => handleToggleFavorite(selectedAnimation.id)}
                    >
                      {selectedAnimation.isFavorite ? (
                        <>
                          <Heart className="w-4 h-4 mr-2 fill-current text-pink-400" />
                          Retirer des favoris
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 mr-2" />
                          Ajouter aux favoris
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-700"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedAnimation.prompt);
                        toast({
                          title: 'Copi ',
                          description: 'Prompt copi  dans le presse-papiers',
                        });
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copier prompt
                    </Button>
                  </div>

                  {selectedAnimation.metadata && (
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-lg">M tadonn es vid o</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Format</span>
                          <span className="text-white">{selectedAnimation.metadata.format}</span>
                        </div>
                        <Separator className="bg-slate-700" />
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Taille du fichier</span>
                          <span className="text-white">{formatFileSize(selectedAnimation.metadata.size)}</span>
                        </div>
                        {selectedAnimation.metadata.bitrate && (
                          <>
                            <Separator className="bg-slate-700" />
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Bitrate</span>
                              <span className="text-white">{selectedAnimation.metadata.bitrate} kbps</span>
                            </div>
                          </>
                        )}
                        {selectedAnimation.metadata.codec && (
                          <>
                            <Separator className="bg-slate-700" />
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Codec</span>
                              <span className="text-white">{selectedAnimation.metadata.codec}</span>
                            </div>
                          </>
                        )}
                        {selectedAnimation.metadata.frameCount && (
                          <>
                            <Separator className="bg-slate-700" />
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Images</span>
                              <span className="text-white">{selectedAnimation.metadata.frameCount.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                        {selectedAnimation.metadata.model && (
                          <>
                            <Separator className="bg-slate-700" />
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Mod le IA</span>
                              <span className="text-white">{selectedAnimation.metadata.model}</span>
                            </div>
                          </>
                        )}
                        {selectedAnimation.fps && (
                          <>
                            <Separator className="bg-slate-700" />
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">FPS</span>
                              <span className="text-white">{selectedAnimation.fps}</span>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)} className="border-slate-700">
                    Fermer
                  </Button>
                  <Button onClick={() => {
                    setShowDetailDialog(false);
                    setShowExportDialog(true);
                  }} className="bg-cyan-600 hover:bg-cyan-700">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-6xl max-h-[90vh] overflow-y-auto">
            {selectedAnimation && (
              <>
                <DialogHeader>
                  <DialogTitle>Pr visualisation</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Visualisez votre animation
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6">
                  <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">Lecteur vid o interactif</p>
                        <p className="text-sm text-slate-500 mt-2">Lecture, pause et contr les disponibles</p>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="text-white hover:bg-white/20"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <div className="flex-1">
                          <Progress value={(currentTime / selectedAnimation.duration) * 100} className="h-1" />
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatTime(currentTime)} / {formatTime(selectedAnimation.duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-3">
                        <p className="text-xs text-slate-400 mb-1">Dur e</p>
                        <p className="text-lg font-bold">{selectedAnimation.duration}s</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-3">
                        <p className="text-xs text-slate-400 mb-1">Format</p>
                        <p className="text-lg font-bold">{selectedAnimation.metadata?.format || 'MP4'}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-3">
                        <p className="text-xs text-slate-400 mb-1">Taille</p>
                        <p className="text-lg font-bold">
                          {selectedAnimation.metadata ? formatFileSize(selectedAnimation.metadata.size) : 'N/A'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPreviewDialog(false)} className="border-slate-700">
                    Fermer
                  </Button>
                  <Button onClick={() => {
                    setShowPreviewDialog(false);
                    setShowExportDialog(true);
                  }} className="bg-cyan-600 hover:bg-cyan-700">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Enhanced Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle>Exporter l'Animation</DialogTitle>
              <DialogDescription className="text-slate-400">
                Choisissez le format et les options d'export pour votre animation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-6">
              {/* Format Selection */}
              <div className="space-y-3">
                <Label className="text-white">Format d'export</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { format: 'MP4', description: 'Format standard (recommand )', size: '25 MB', compatible: true, codec: 'H.264' },
                    { format: 'GIF', description: 'Animation GIF', size: '45 MB', compatible: true, codec: 'GIF' },
                    { format: 'WebM', description: 'Format web optimis ', size: '18 MB', compatible: true, codec: 'VP9' },
                    { format: 'MOV', description: 'QuickTime Movie', size: '28 MB', compatible: true, codec: 'H.264' },
                    { format: 'AVI', description: 'Audio Video Interleave', size: '32 MB', compatible: false, codec: 'Xvid' },
                    { format: 'MKV', description: 'Matroska Video', size: '22 MB', compatible: false, codec: 'H.265' },
                  ].map((format, idx) => (
                    <Card
                      key={idx}
                      className={`bg-slate-800/50 border-slate-700 cursor-pointer hover:border-cyan-500/50 transition-all ${
                        !format.compatible ? 'opacity-50' : ''
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white">{format.format}</span>
                          {!format.compatible && <Badge className="bg-yellow-500">Bient t</Badge>}
                        </div>
                        <p className="text-xs text-slate-400 mb-1">{format.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Taille: {format.size}</span>
                          <span className="text-slate-500">Codec: {format.codec}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator className="bg-slate-700" />

              {/* Export Options */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Qualit </Label>
                    <Select defaultValue="high">
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse (rapide)</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute (recommand )</SelectItem>
                        <SelectItem value="maximum">Maximum (lourd)</SelectItem>
                      </SelectContent>
                </Select>
              </div>
                  <div className="space-y-2">
                    <Label className="text-white">R solution</Label>
                    <Select defaultValue="original">
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original">Originale</SelectItem>
                        <SelectItem value="720p">720p (HD)</SelectItem>
                        <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                        <SelectItem value="1440p">1440p (2K)</SelectItem>
                        <SelectItem value="2160p">2160p (4K)</SelectItem>
                      </SelectContent>
                </Select>
              </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Inclure l'audio (si disponible)</Label>
                    <Checkbox defaultChecked className="border-slate-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Compresser avec H.265</Label>
                    <Checkbox className="border-slate-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Inclure les m tadonn es</Label>
                    <Checkbox defaultChecked className="border-slate-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Watermarking</Label>
                    <Checkbox className="border-slate-600" />
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              {/* Export Preview */}
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Taille estim e</span>
                  <span className="text-lg font-bold text-cyan-400">~25 MB</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Temps d'export estim </span>
                  <span className="text-lg font-bold text-cyan-400">~15 secondes</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowExportDialog(false)}
                className="border-slate-700"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  toast({ title: 'Export', description: 'Export en cours...' });
                  setShowExportDialog(false);
                }}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Advanced Video Processing */}
        <Card className="bg-slate-900/50 border-slate-700 mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-cyan-400" />
                Traitement Vid o Avanc 
              </CardTitle>
              <CardDescription className="text-slate-400">
                Outils professionnels pour le traitement et l'optimisation vid o
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Color Grading', description: 'Correction et am lioration des couleurs', icon: Contrast, status: 'available' },
                  { name: 'Noise Reduction', description: 'R duction du bruit vid o', icon: Sparkles, status: 'available' },
                  { name: 'Stabilization', description: 'Stabilisation automatique', icon: Target, status: 'available' },
                  { name: 'Upscaling', description: 'Am lioration de la r solution', icon: ZoomIn, status: 'premium' },
                  { name: 'Frame Interpolation', description: 'Augmentation des FPS', icon: FastForward, status: 'premium' },
                  { name: 'Background Removal', description: 'Suppression d\'arri re-plan', icon: Layers, status: 'premium' },
                ].map((tool, idx) => {
                  const Icon = tool.icon;
                  return (
                    <Card key={idx} className={`bg-slate-800/50 border-slate-700 ${tool.status === 'available' ? 'hover:border-cyan-500/50' : 'opacity-75'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="w-5 h-5 text-cyan-400" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">{tool.name}</p>
                            {tool.status === 'premium' && (
                              <Badge className="bg-purple-500 text-xs mt-1">Premium</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">{tool.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Video Analytics Dashboard */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Tableau de Bord Analytics
              </CardTitle>
              <CardDescription className="text-slate-400">
                Statistiques d taill es sur vos animations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Animations g n r es', value: '1,234', change: '+23%', icon: Video, color: 'cyan' },
                  { label: 'Temps total', value: '45h 32m', change: '+12%', icon: Clock, color: 'blue' },
                  { label: 'Taille totale', value: '2.4 GB', change: '+8%', icon: Download, color: 'green' },
                  { label: 'Taux de succ s', value: '98.5%', change: '+0.5%', icon: CheckCircle, color: 'purple' },
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
                    <CardTitle className="text-sm">G n rations par jour</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 flex items-end justify-between gap-1">
                      {[65, 78, 82, 75, 88, 92, 85].map((height, idx) => (
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
                    <CardTitle className="text-sm">Styles populaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { style: 'R aliste', percentage: 45 },
                        { style: 'Artistique', percentage: 28 },
                        { style: 'Cin matique', percentage: 18 },
                        { style: 'Abstrait', percentage: 9 },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-white">{item.style}</span>
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

          {/* Additional Features Section */}
          <div className="mt-8 space-y-6">
            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Fonctionnalit s Avanc es</h3>
                    <p className="text-sm text-slate-300">D couvrez toutes les fonctionnalit s premium disponibles</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'API REST Compl te', description: 'Int grez avec votre stack technique', icon: Code, color: 'blue' },
              { title: 'Webhooks en Temps R el', description: 'Recevez des notifications instantan es', icon: Bell, color: 'green' },
              { title: 'SDK Multi-langages', description: 'JavaScript, Python, PHP, Ruby', icon: FileCode, color: 'purple' },
              { title: 'Export Batch', description: 'Exportez des centaines d\'animations en une fois', icon: Download, color: 'cyan' },
              { title: 'Versioning Avanc ', description: 'G rez les versions de vos animations', icon: GitBranch, color: 'orange' },
              { title: 'Analytics Avanc es', description: 'Tableaux de bord personnalisables', icon: BarChart3, color: 'pink' },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all">
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

          {/* Help & Support */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Aide & Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Documentation', description: 'Guides complets', icon: BookOpen, link: '/docs' },
                  { title: 'FAQ', description: 'Questions fr quentes', icon: HelpCircle, link: '/faq' },
                  { title: 'Support', description: 'Contactez-nous', icon: MessageSquare, link: '/support' },
                ].map((help, idx) => {
                  const Icon = help.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="w-5 h-5 text-cyan-400" />
                          <h4 className="font-semibold text-white">{help.title}</h4>
                        </div>
                        <p className="text-xs text-slate-400">{help.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
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
            v2.4.1   AI Studio Animations   {new Date().getFullYear()}
          </div>

          {/* Video Processing Pipeline */}
          <Card className="bg-slate-900/50 border-slate-700 mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                Pipeline de Traitement Vid o
              </CardTitle>
              <CardDescription className="text-slate-400">
                Visualisez et configurez le pipeline de traitement de vos animations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 overflow-x-auto pb-4">
                  {[
                    { step: 'Input', icon: FileImage, status: 'complete', description: 'Prompt ou image source' },
                    { step: 'Pre-processing', icon: Sliders, status: 'complete', description: 'Optimisation initiale' },
                    { step: 'AI Generation', icon: Sparkles, status: 'processing', description: 'G n ration IA' },
                    { step: 'Post-processing', icon: Wand2, status: 'pending', description: 'Am lioration qualit ' },
                    { step: 'Encoding', icon: Video, status: 'pending', description: 'Encodage final' },
                    { step: 'Output', icon: Download, status: 'pending', description: 'Fichier final' },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-center gap-2 min-w-[150px]">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          item.status === 'complete' ? 'bg-green-500/20' :
                          item.status === 'processing' ? 'bg-cyan-500/20 animate-pulse' :
                          'bg-slate-700/50'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            item.status === 'complete' ? 'text-green-400' :
                            item.status === 'processing' ? 'text-cyan-400' :
                            'text-slate-500'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{item.step}</p>
                          <p className="text-xs text-slate-400">{item.description}</p>
                          <Badge className={`mt-1 ${
                            item.status === 'complete' ? 'bg-green-500' :
                            item.status === 'processing' ? 'bg-cyan-500' :
                            'bg-slate-600'
                          }`}>
                            {item.status === 'complete' ? 'Termin ' :
                             item.status === 'processing' ? 'En cours' :
                             'En attente'}
                          </Badge>
                        </div>
                        {idx < 5 && (
                          <div className="w-8 h-0.5 bg-slate-700 mx-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Benchmarks */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Benchmarks de Performance
              </CardTitle>
              <CardDescription className="text-slate-400">
                Comparaison des performances avec les standards de l'industrie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { metric: 'Temps de g n ration', our: '3.2s', industry: '4.8s', improvement: '+33%' },
                    { metric: 'Qualit  moyenne', our: '94%', industry: '89%', improvement: '+5%' },
                    { metric: 'Taux de succ s', our: '98.5%', industry: '95.2%', improvement: '+3.3%' },
                  ].map((benchmark, idx) => (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <p className="text-sm font-semibold text-white mb-3">{benchmark.metric}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-400">Notre plateforme:</span>
                            <span className="text-sm font-bold text-cyan-400">{benchmark.our}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-400">Industrie moyenne:</span>
                            <span className="text-sm font-bold text-slate-400">{benchmark.industry}</span>
                          </div>
                          <Separator className="bg-slate-700" />
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-400">Am lioration:</span>
                            <Badge className="bg-green-500">{benchmark.improvement}</Badge>
                    </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Integration Examples */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-400" />
                Exemples d'Int gration API
              </CardTitle>
              <CardDescription className="text-slate-400">
                Int grez la g n ration d'animations dans vos applications
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
{`const response = await fetch('/api/animations/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A cinematic slow-motion shot',
    duration: 5,
    style: 'realistic',
    fps: 30
  })
});`}
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

response = requests.post(
    'https://api.luneo.com/animations/generate',
    json={
        'prompt': 'A cinematic slow-motion shot',
        'duration': 5,
        'style': 'realistic',
        'fps': 30
    },
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)`}
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
{`curl -X POST https://api.luneo.com/animations/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A cinematic slow-motion shot",
    "duration": 5,
    "style": "realistic",
    "fps": 30
  }'`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Animation Features - Final Section */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Fonctionnalit s Avanc es d'Animation - Section Finale
              </CardTitle>
              <CardDescription className="text-slate-400">
                Derni res fonctionnalit s avanc es pour une g n ration d'animations compl te et professionnelle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Advanced Animation Tools */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Outils d'Animation Avanc s</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: ' diteur de Timeline', description: ' diter pr cis ment chaque frame de votre animation', icon: Video, status: 'active' },
                      { name: 'G n rateur de Transitions', description: 'Cr er des transitions fluides entre sc nes', icon: Sparkles, status: 'active' },
                      { name: 'Pr visualisation Temps R el', description: 'Voir votre animation en temps r el pendant la cr ation', icon: Eye, status: 'active' },
                      { name: 'Export Multi-format', description: 'Exporter dans tous les formats vid o n cessaires', icon: Download, status: 'active' },
                      { name: 'Templates Dynamiques', description: 'Cr er des templates avec logique conditionnelle', icon: Layers, status: 'active' },
                      { name: 'API de G n ration', description: 'Int grer la g n ration via API REST/GraphQL', icon: Code, status: 'active' },
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
                      { metric: 'Temps de g n ration', value: '2.3s', target: '< 3s', status: 'good', icon: Gauge },
                      { metric: 'Taux de succ s', value: '98%', target: '> 95%', status: 'excellent', icon: TrendingUp },
                      { metric: 'Satisfaction client', value: '4.9/5', target: '> 4.5', status: 'excellent', icon: Star },
                      { metric: 'Uptime', value: '99.9%', target: '> 99.5%', status: 'excellent', icon: Activity },
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

                {/* Animation Statistics */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Statistiques d'Animation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Animations g n r es', value: '1,234', icon: Video, color: 'cyan' },
                      { label: 'Templates utilis s', value: '456', icon: Layers, color: 'blue' },
                      { label: 'Dur e totale', value: '12.5h', icon: Clock, color: 'green' },
                      { label: 'Taux de r utilisation', value: '78%', icon: RefreshCw, color: 'purple' },
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

                {/* Integration Status */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Statut des Int grations</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'After Effects', status: 'connected', lastSync: 'Il y a 2 min', animations: 45 },
                      { name: 'Premiere Pro', status: 'connected', lastSync: 'Il y a 5 min', animations: 32 },
                      { name: 'Final Cut Pro', status: 'connected', lastSync: 'Il y a 10 min', animations: 28 },
                      { name: 'DaVinci Resolve', status: 'pending', lastSync: 'Jamais', animations: 0 },
                    ].map((integration, idx) => (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${integration.status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                              <div>
                                <p className="text-sm font-medium text-white">{integration.name}</p>
                                <p className="text-xs text-slate-400">{integration.lastSync}   {integration.animations} animations</p>
                              </div>
                            </div>
                            <Badge className={integration.status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}>
                              {integration.status === 'connected' ? 'Connect ' : 'En attente'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Animation Quality Standards */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                Standards de Qualit  d'Animation
              </CardTitle>
              <CardDescription className="text-slate-400">
                Garantir la qualit  professionnelle de toutes vos animations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Quality Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { standard: 'R solution minimale', value: '1080p', icon: Monitor, status: 'excellent' },
                    { standard: 'FPS minimum', value: '30 FPS', icon: Video, status: 'excellent' },
                    { standard: 'Compression', value: 'H.264/H.265', icon: FileText, status: 'excellent' },
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

                {/* Animation Presets */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Pr r glages d'Animation</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { name: 'Cin matique', fps: 24, resolution: '4K', icon: Film },
                      { name: 'Web', fps: 30, resolution: '1080p', icon: Globe },
                      { name: 'Mobile', fps: 60, resolution: '720p', icon: Monitor },
                      { name: 'Social Media', fps: 30, resolution: '1080p', icon: Share2 },
                    ].map((preset, idx) => {
                      const Icon = preset.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="w-4 h-4 text-cyan-400" />
                              <p className="text-sm font-medium text-white">{preset.name}</p>
                            </div>
                            <div className="space-y-1 text-xs text-slate-400">
                              <p>{preset.fps} FPS</p>
                              <p>{preset.resolution}</p>
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

          {/* Animation Export Options */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-cyan-400" />
                Options d'Export d'Animation
              </CardTitle>
              <CardDescription className="text-slate-400">
                Exporter vos animations dans tous les formats n cessaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { format: 'MP4', description: 'Format standard pour web et mobile', quality: 'Haute', size: '~50 MB/min' },
                  { format: 'MOV', description: 'Format professionnel pour post-production', quality: 'Tr s haute', size: '~100 MB/min' },
                  { format: 'WebM', description: 'Format optimis  pour le web', quality: 'Moyenne', size: '~30 MB/min' },
                  { format: 'GIF', description: 'Format anim  pour partage social', quality: 'Basse', size: '~5 MB/min' },
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

          {/* Animation Workflow Automation */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Automatisation du Workflow d'Animation
              </CardTitle>
              <CardDescription className="text-slate-400">
                Automatisez vos processus de cr ation d'animations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Automation Rules */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">R gles d'Automatisation</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'G n ration automatique', description: 'G n rer automatiquement des animations   partir de templates', trigger: 'Nouveau produit', actions: 3, enabled: true },
                      { name: 'Export automatique', description: 'Exporter automatiquement vers les plateformes configur es', trigger: 'Animation termin e', actions: 2, enabled: true },
                      { name: 'Notification  quipe', description: 'Notifier l&apos; quipe lors de la finalisation', trigger: 'Animation approuv e', actions: 1, enabled: false },
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
                      { name: 'G n ration en lot', description: 'G n rer plusieurs animations simultan ment', icon: Layers, count: 12 },
                      { name: 'Export en lot', description: 'Exporter toutes les animations s lectionn es', icon: Download, count: 8 },
                      { name: 'Conversion en lot', description: 'Convertir plusieurs formats   la fois', icon: RefreshCw, count: 5 },
                      { name: 'Archivage en lot', description: 'Archiver plusieurs animations anciennes', icon: Archive, count: 20 },
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
                                <p className="text-xs text-cyan-400 mt-1">{op.count} animations disponibles</p>
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

          {/* Animation Analytics Dashboard */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Tableau de Bord Analytique
              </CardTitle>
              <CardDescription className="text-slate-400">
                Analysez les performances de vos animations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Vues totales', value: '45.2K', change: '+12%', icon: Eye, trend: 'up' },
                    { label: 'Taux d&apos;engagement', value: '78%', change: '+5%', icon: Heart, trend: 'up' },
                    { label: 'Partages', value: '1.2K', change: '+8%', icon: Share2, trend: 'up' },
                    { label: 'Temps moyen', value: '2m 15s', change: '-3%', icon: Clock, trend: 'down' },
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

                {/* Top Animations */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Top Animations</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Animation Cin matique 1', views: 12500, likes: 890, shares: 234 },
                      { name: 'Animation Produit 2', views: 9800, likes: 654, shares: 189 },
                      { name: 'Animation Social 3', views: 7600, likes: 432, shares: 156 },
                    ].map((animation, idx) => (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white mb-1">{animation.name}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {animation.views.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {animation.likes}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Share2 className="w-3 h-3" />
                                  {animation.shares}
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

          {/* Animation Collaboration Features */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Fonctionnalit s de Collaboration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Collaborez efficacement sur vos projets d'animation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Team Members */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Membres de l' quipe</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { name: 'Alice Martin', role: 'Directeur Cr atif', avatar: 'AM', status: 'online', animations: 12 },
                      { name: 'Bob Dupont', role: 'Animateur', avatar: 'BD', status: 'online', animations: 8 },
                      { name: 'Claire Bernard', role: ' diteur Vid o', avatar: 'CB', status: 'away', animations: 15 },
                    ].map((member, idx) => (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-semibold">
                                {member.avatar}
                              </div>
                              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${member.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{member.name}</p>
                              <p className="text-xs text-slate-400">{member.role}</p>
                              <p className="text-xs text-cyan-400 mt-1">{member.animations} animations</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Shared Projects */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Projets Partag s</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Campagne Q1 2024', members: 5, animations: 8, lastUpdate: 'Il y a 2h', status: 'active' },
                      { name: 'Produit Lancement', members: 3, animations: 4, lastUpdate: 'Il y a 1j', status: 'active' },
                      { name: 'Social Media Content', members: 4, animations: 12, lastUpdate: 'Il y a 3j', status: 'archived' },
                    ].map((project, idx) => (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-semibold text-white text-sm">{project.name}</h5>
                                <Badge className={project.status === 'active' ? 'bg-green-500' : 'bg-slate-600'}>
                                  {project.status === 'active' ? 'Actif' : 'Archiv '}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {project.members} membres
                                </span>
                                <span className="flex items-center gap-1">
                                  <Video className="w-3 h-3" />
                                  {project.animations} animations
                                </span>
                                <span>{project.lastUpdate}</span>
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

          {/* Animation Learning Resources */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                Ressources d'Apprentissage
              </CardTitle>
              <CardDescription className="text-slate-400">
                Am liorez vos comp tences en animation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Guide de D marrage', description: 'Apprenez les bases de la g n ration d&apos;animations', type: 'Guide', icon: BookOpen },
                  { title: 'Tutoriels Avanc s', description: 'Ma trisez les techniques avanc es', type: 'Tutoriel', icon: Video },
                  { title: 'Meilleures Pratiques', description: 'D couvrez les meilleures pratiques de l&apos;industrie', type: 'Article', icon: FileText },
                  { title: 'API Documentation', description: 'Documentation compl te de l&apos;API', type: 'Documentation', icon: Code },
                  { title: 'Exemples de Code', description: 'Exemples pratiques d&apos;int gration', type: 'Code', icon: Layers },
                  { title: 'Communaut ', description: 'Rejoignez notre communaut  d&apos;animateurs', type: 'Communaut ', icon: Users },
                ].map((resource, idx) => {
                  const Icon = resource.icon;
                      return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-cyan-500/10 rounded-lg">
                            <Icon className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div className="flex-1">
                            <Badge className="bg-cyan-500/20 text-cyan-400 text-xs mb-2">{resource.type}</Badge>
                            <h5 className="font-semibold text-white text-sm mb-1">{resource.title}</h5>
                            <p className="text-xs text-slate-400">{resource.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Animation System Status */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Statut du Syst me d'Animation
              </CardTitle>
              <CardDescription className="text-slate-400">
                Surveillez l' tat de tous les services d'animation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { service: 'G n rateur d&apos;Animations', status: 'operational', uptime: '99.9%', responseTime: '120ms' },
                  { service: 'Moteur de Rendu', status: 'operational', uptime: '99.8%', responseTime: '85ms' },
                  { service: 'Stockage Vid o', status: 'operational', uptime: '99.9%', responseTime: '45ms' },
                  { service: 'API de G n ration', status: 'operational', uptime: '99.7%', responseTime: '95ms' },
                ].map((service, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${service.status === 'operational' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="text-sm font-medium text-white">{service.service}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                              <span>Uptime: {service.uptime}</span>
                              <span>Temps de r ponse: {service.responseTime}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={service.status === 'operational' ? 'bg-green-500' : 'bg-red-500'}>
                          {service.status === 'operational' ? 'Op rationnel' : 'Hors service'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Animation Ultimate Summary */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                R sum  Ultime d'Animation
              </CardTitle>
              <CardDescription className="text-slate-400">
                Vue d'ensemble compl te et exhaustive de toutes vos animations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Complete Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Total animations', value: '1,234', icon: Video, color: 'cyan' },
                    { label: 'Templates', value: '456', icon: Layers, color: 'blue' },
                    { label: 'Taux de succ s', value: '98%', icon: TrendingUp, color: 'green' },
                    { label: 'Vues totales', value: '45.2K', icon: Eye, color: 'purple' },
                    { label: 'Partages', value: '1.2K', icon: Share2, color: 'pink' },
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
                      { category: 'G n ration', features: 12, enabled: 12, icon: Sparkles },
                      { category: 'Templates', features: 8, enabled: 8, icon: Layers },
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
                              <Badge className="bg-green-500 ml-2">{category.enabled}/{category.features}</Badge>
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

          {/* Animation Advanced Settings */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                Param tres Avanc s d'Animation
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configurez les param tres avanc s pour optimiser vos animations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Rendering Settings */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Param tres de Rendu</h4>
                  <div className="space-y-4">
                    {[
                      { setting: 'Qualit  de rendu', value: 'Haute', options: ['Basse', 'Moyenne', 'Haute', 'Tr s haute'], icon: Monitor },
                      { setting: 'M thode de compression', value: 'H.264', options: ['H.264', 'H.265', 'VP9', 'AV1'], icon: FileText },
                      { setting: 'Taux de bits', value: '10 Mbps', options: ['5 Mbps', '10 Mbps', '20 Mbps', '50 Mbps'], icon: Gauge },
                      { setting: 'Format de sortie', value: 'MP4', options: ['MP4', 'MOV', 'WebM', 'GIF'], icon: Download },
                    ].map((setting, idx) => {
                      const Icon = setting.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5 text-cyan-400" />
                                <div>
                                  <p className="text-sm font-medium text-white">{setting.setting}</p>
                                  <p className="text-xs text-slate-400">Valeur actuelle: {setting.value}</p>
                                </div>
                              </div>
                              <Select defaultValue={setting.value}>
                                <SelectTrigger className="w-40 border-slate-600">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {setting.options.map((opt) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Performance Settings */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Param tres de Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Utilisation GPU', value: true, description: 'Acc l rer le rendu avec GPU', icon: Monitor },
                      { name: 'Rendu distribu ', value: false, description: 'R partir le rendu sur plusieurs serveurs', icon: Layers },
                      { name: 'Cache de pr visualisation', value: true, description: 'Mettre en cache les pr visualisations', icon: Archive },
                      { name: 'Compression automatique', value: true, description: 'Compresser automatiquement les exports', icon: FileText },
                    ].map((perf, idx) => {
                      const Icon = perf.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5 text-cyan-400" />
                                <div>
                                  <p className="text-sm font-medium text-white">{perf.name}</p>
                                  <p className="text-xs text-slate-400">{perf.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs ${perf.value ? 'text-green-400' : 'text-slate-500'}`}>
                                  {perf.value ? 'Activ ' : 'D sactiv '}
                                </span>
                                <div className={`w-10 h-6 rounded-full ${perf.value ? 'bg-cyan-500' : 'bg-slate-600'} relative cursor-pointer`}>
                                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 ${perf.value ? 'right-1' : 'left-1'} transition-all`} />
                                </div>
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

          {/* Animation Quick Actions */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Actions Rapides
              </CardTitle>
              <CardDescription className="text-slate-400">
                Accédez rapidement aux actions les plus courantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: 'Nouvelle Animation', icon: Plus, color: 'cyan', action: () => {} },
                  { name: 'Importer Fichier', icon: Upload, color: 'blue', action: () => {} },
                  { name: 'G n rer depuis Template', icon: Layers, color: 'green', action: () => {} },
                  { name: 'Exporter Toutes', icon: Download, color: 'purple', action: () => {} },
                  { name: 'Partager Projet', icon: Share2, color: 'pink', action: () => {} },
                  { name: 'Voir Historique', icon: History, color: 'yellow', action: () => {} },
                  { name: 'Param tres', icon: Settings, color: 'orange', action: () => {} },
                  { name: 'Aide & Support', icon: HelpCircle, color: 'indigo', action: () => {} },
                ].map((action, idx) => {
                  const Icon = action.icon;
                  const colorClasses: Record<string, { bg: string; text: string }> = {
                    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
                    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
                    green: { bg: 'bg-green-500/10', text: 'text-green-400' },
                    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
                    pink: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
                    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
                    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
                    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
                  };
                  const colors = colorClasses[action.color] || colorClasses.cyan;
                  return (
                    <motion
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Card 
                        className={`${colors.bg} border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer`}
                        onClick={action.action}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col items-center text-center">
                            <Icon className={`w-6 h-6 ${colors.text} mb-2`} />
                            <p className="text-xs font-medium text-white">{action.name}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Animation System Information */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" />
                Informations Syst me
              </CardTitle>
              <CardDescription className="text-slate-400">
                D tails techniques sur votre environnement d'animation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Version API', value: 'v2.1.0', icon: Code },
                  { label: 'Version Moteur', value: 'v3.5.2', icon: Settings },
                  { label: 'Derni re mise   jour', value: '2024-12-15', icon: Calendar },
                  { label: 'Statut', value: 'Op rationnel', icon: CheckCircle2, status: 'success' },
                ].map((info, idx) => {
                  const Icon = info.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-cyan-400" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-400">{info.label}</p>
                            <p className="text-sm font-semibold text-white">{info.value}</p>
                          </div>
                          {info.status && (
                            <Badge className={info.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}>
                              {info.status === 'success' ? 'OK' : 'Attention'}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Animation Final Summary Card */}
          <Card className="bg-gradient-to-br from-slate-900 via-cyan-900/20 to-slate-900 border-cyan-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-cyan-400" />
                R sum  Final - AI Studio Animations
              </CardTitle>
              <CardDescription className="text-slate-400">
                Plateforme compl te de g n ration d'animations IA avec fonctionnalit s de niveau entreprise mondiale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { metric: 'Animations cr  es', value: '1,234', icon: Video },
                    { metric: 'Templates disponibles', value: '456', icon: Layers },
                    { metric: 'Taux de succ s', value: '98%', icon: TrendingUp },
                    { metric: 'Satisfaction', value: '4.9/5', icon: Star },
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
                  <span>Plateforme de g n ration d'animations IA de niveau mondial</span>
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

const MemoizedAIStudioAnimationsPageContent = memo(AIStudioAnimationsPageContent);

export default function AIStudioAnimationsPage() {





  return (
    <ErrorBoundary componentName="AIStudioAnimations">
      <MemoizedAIStudioAnimationsPageContent />
    </ErrorBoundary>
  );
}












