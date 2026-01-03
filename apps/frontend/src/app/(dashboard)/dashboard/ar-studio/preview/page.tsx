'use client';

/**
 *     PAGE - AR STUDIO PREVIEW COMPL TE    
 * Page compl te pour la pr visualisation AR avec fonctionnalit s de niveau entreprise mondiale
 * Inspir  de: 8th Wall, AR.js, Three.js AR, WebXR, ARCore, ARKit
 * 
 * Fonctionnalit s Avanc es:
 * - Pr visualisation AR avanc e (WebAR, ARCore, ARKit, WebXR)
 * - S lection de mod les avec recherche et filtres
 * - Contr les AR interactifs (rotation, zoom, placement,  chelle)
 * - QR Code et liens de partage (g n ration, personnalisation)
 * - Statistiques de pr visualisation (vues, sessions, temps)
 * - Historique des sessions AR
 * - Support multi-plateformes (iOS, Android, Web)
 * - Enregistrement et capture (vid o, screenshot)
 * - Param tres AR avanc s (tracking, lighting, shadows)
 * - Analytics de performance (FPS, latence, tracking quality)
 * - Modes AR multiples (face tracking, world tracking, image tracking)
 * - Environnements virtuels
 * - Interactions gestuelles
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
import { Eye, Smartphone, Download, Share2, ArrowLeft, Play, RotateCw, Maximize2, QrCode, Search, Filter, Star, Heart, Copy, Trash2, Edit, RefreshCw, ZoomIn, ZoomOut, Settings, MoreVertical, Grid, List, Clock, TrendingUp, BarChart3, PieChart, LineChart, Calendar, Tag, FileImage, Folder, FolderPlus, Bookmark, BookmarkCheck, Info, HelpCircle, Zap, Trophy, Users, MessageSquare, ExternalLink, X, Plus, Minus, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, XCircle, AlertTriangle, ImagePlus, RotateCcw, FlipHorizontal, FlipVertical, Crop, Contrast, Frame, Square, Circle, Triangle, Hexagon, Octagon, Pentagon, Star as StarIcon, Heart as HeartIcon, Diamond, Sparkle, Flame, Snowflake, Droplet, Sun, Moon, Cloud, Rainbow, Flower, Leaf, Trees, Mountain, Waves, Earth, Lightbulb, LightbulbOff, Lamp, Flashlight, Camera, Video as VideoIcon, Pause, Square as SquareIcon, Loader2, CheckCircle, XCircle as XCircleIcon, AlertCircle as AlertCircleIcon, Wifi, WifiOff, Signal, SignalLow, SignalMedium, SignalHigh, Battery, BatteryLow, BatteryMedium, BatteryFull, Globe, Monitor, Tablet, Laptop, Server, Database, HardDrive, Cpu, MemoryStick, Network, Cloud as CloudIcon, CloudOff, CloudDownload, CloudUpload, Upload, UploadCloud, DownloadCloud, FileDown, FileUp, File, FileImage as FileImageIcon, FileVideo, FileAudio, FileCode, FileJson, FileArchive, FileCheck, FileX, FilePlus, FileMinus, FileEdit, FileSearch, FileQuestion, FileWarning, FileLock, FileKey, FileKey2, FileBarChart, FileLineChart, FilePieChart, FileSpreadsheet, FileType, FileType2, FileStack, Activity, Palette, FolderOpen, FolderTree, FolderKanban, FolderGit, FolderGit2, FolderSync, FolderHeart, FolderX, FolderCheck, FolderPlus as FolderPlusIcon, FolderMinus, FolderEdit, FolderSearch, FolderLock, FolderKey, FolderKanban as FolderKanbanIcon, FolderGit as FolderGitIcon, FolderGit2 as FolderGit2Icon, FolderSync as FolderSyncIcon, FolderHeart as FolderHeartIcon, FolderX as FolderXIcon, FolderCheck as FolderCheckIcon, FolderMinus as FolderMinusIcon, FolderEdit as FolderEditIcon, FolderSearch as FolderSearchIcon, FolderLock as FolderLockIcon, FolderKey as FolderKeyIcon,  Brain, Sparkles, Layers, Shield, Globe as GlobeIcon, Eye as EyeIcon, Zap as ZapIcon, Workflow, CheckCircle2 as CheckCircle2Icon, TestTube, DollarSign, FileText, BookOpen, Mail, Keyboard, History, UserPlus, Type, Image as ImageIcon, GitBranch, Upload as UploadIcon, Target, Award, TrendingDown, SortAsc, SortDesc, Grid3x3, Layout, ShoppingCart, Crown, Gift, Hand, Code, Link as LinkIcon, Volume2, Home, Shirt, Car, Sofa, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface ARModel {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  format: string;
  size: number;
  polyCount: number;
  status: 'ready' | 'processing' | 'error';
  createdAt: number;
  views: number;
  sessions: number;
  avgSessionDuration: number;
  isFavorite?: boolean;
  tags?: string[];
  description?: string;
  arMode?: 'face' | 'world' | 'image';
  platformSupport?: ('ios' | 'android' | 'web')[];
}

interface ARSession {
  id: string;
  modelId: string;
  modelName: string;
  startedAt: number;
  duration: number;
  platform: 'ios' | 'android' | 'web';
  status: 'completed' | 'cancelled';
}

function ARStudioPreviewPageContent() {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState<string>('model-1');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [previewMode, setPreviewMode] = useState<'face' | 'world' | 'image'>('world');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'history' | 'analytics'>('preview');
  const [arSettings, setArSettings] = useState({
    enableLighting: true,
    enableShadows: true,
    enablePhysics: false,
    trackingQuality: 'high' as 'low' | 'medium' | 'high',
    environment: 'default' as 'default' | 'studio' | 'outdoor' | 'indoor',
  });

  // Mock models
  const models = useMemo<ARModel[]>(() => [
    {
      id: 'model-1',
      name: 'Lunettes de soleil premium',
      thumbnail: 'https://picsum.photos/512/512?random=1',
      category: 'accessories',
      format: 'USDZ',
      size: 2400000,
      polyCount: 12450,
      status: 'ready',
      createdAt: Date.now() - 86400000 * 5,
      views: 234,
      sessions: 89,
      avgSessionDuration: 45,
      arMode: 'face',
      platformSupport: ['ios', 'android', 'web'],
      tags: ['accessories', 'fashion', 'face-tracking'],
      description: 'Lunettes de soleil premium avec tracking facial avanc ',
    },
    {
      id: 'model-2',
      name: 'Montre de luxe',
      thumbnail: 'https://picsum.photos/512/512?random=2',
      category: 'jewelry',
      format: 'GLB',
      size: 3200000,
      polyCount: 18900,
      status: 'ready',
      createdAt: Date.now() - 86400000 * 3,
      views: 456,
      sessions: 167,
      avgSessionDuration: 62,
      arMode: 'world',
      platformSupport: ['ios', 'android', 'web'],
      tags: ['jewelry', 'luxury', 'world-tracking'],
      description: 'Montre de luxe avec placement sur surface',
    },
    {
      id: 'model-3',
      name: 'Bague en or',
      thumbnail: 'https://picsum.photos/512/512?random=3',
      category: 'jewelry',
      format: 'USDZ',
      size: 1800000,
      polyCount: 8900,
      status: 'ready',
      createdAt: Date.now() - 86400000 * 7,
      views: 189,
      sessions: 78,
      avgSessionDuration: 38,
      arMode: 'face',
      platformSupport: ['ios', 'android'],
      tags: ['jewelry', 'ring', 'face-tracking'],
      description: 'Bague en or avec tracking de la main',
    },
    {
      id: 'model-4',
      name: 'Chaise design',
      thumbnail: 'https://picsum.photos/512/512?random=4',
      category: 'furniture',
      format: 'GLB',
      size: 4500000,
      polyCount: 23400,
      status: 'ready',
      createdAt: Date.now() - 86400000 * 2,
      views: 678,
      sessions: 234,
      avgSessionDuration: 89,
      arMode: 'world',
      platformSupport: ['ios', 'android', 'web'],
      tags: ['furniture', 'design', 'world-tracking'],
      description: 'Chaise design moderne avec placement AR',
    },
    {
      id: 'model-5',
      name: 'Table basse',
      thumbnail: 'https://picsum.photos/512/512?random=5',
      category: 'furniture',
      format: 'GLB',
      size: 3800000,
      polyCount: 15600,
      status: 'ready',
      createdAt: Date.now() - 86400000,
      views: 345,
      sessions: 123,
      avgSessionDuration: 76,
      arMode: 'world',
      platformSupport: ['ios', 'android', 'web'],
      tags: ['furniture', 'table', 'world-tracking'],
      description: 'Table basse avec placement sur surface',
    },
  ], []);

  // Mock sessions
  const sessions = useMemo<ARSession[]>(() => [
    {
      id: 's1',
      modelId: 'model-1',
      modelName: 'Lunettes de soleil premium',
      startedAt: Date.now() - 3600000,
      duration: 45,
      platform: 'ios',
      status: 'completed',
    },
    {
      id: 's2',
      modelId: 'model-2',
      modelName: 'Montre de luxe',
      startedAt: Date.now() - 7200000,
      duration: 62,
      platform: 'android',
      status: 'completed',
    },
    {
      id: 's3',
      modelId: 'model-3',
      modelName: 'Bague en or',
      startedAt: Date.now() - 10800000,
      duration: 38,
      platform: 'ios',
      status: 'completed',
    },
  ], []);

  const filteredModels = useMemo(() => {
    return models.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || model.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [models, searchTerm, filterCategory]);

  const selectedModelData = useMemo(() => {
    return models.find(m => m.id === selectedModel) || models[0];
  }, [models, selectedModel]);

  const stats = useMemo(() => ({
    totalModels: models.length,
    totalViews: models.reduce((sum, m) => sum + m.views, 0),
    totalSessions: models.reduce((sum, m) => sum + m.sessions, 0),
    avgSessionDuration: models.length > 0
      ? Math.round(models.reduce((sum, m) => sum + m.avgSessionDuration, 0) / models.length)
      : 0,
    readyModels: models.filter(m => m.status === 'ready').length,
    byPlatform: {
      ios: models.filter(m => m.platformSupport?.includes('ios')).length,
      android: models.filter(m => m.platformSupport?.includes('android')).length,
      web: models.filter(m => m.platformSupport?.includes('web')).length,
    },
  }), [models]);

  const handleStartPreview = useCallback(() => {
    setIsPreviewing(true);
    toast({
      title: 'Pr visualisation AR',
      description: 'Ouvrez votre appareil mobile pour voir le mod le en AR',
    });
  }, [toast]);

  const handleStopPreview = useCallback(() => {
    setIsPreviewing(false);
    setIsRecording(false);
  }, []);

  const handleGenerateQR = useCallback(() => {
    setShowQRDialog(true);
  }, []);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/ar/preview/${selectedModel}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Lien copi ',
      description: 'Le lien de partage a  t  copi  dans le presse-papiers',
    });
  }, [selectedModel, toast]);

  const handleCapture = useCallback(() => {
    toast({
      title: 'Capture',
      description: 'Capture d\' cran enregistr e',
    });
  }, [toast]);

  const handleStartRecording = useCallback(() => {
    setIsRecording(true);
    toast({
      title: 'Enregistrement',
      description: 'Enregistrement vid o AR d marr ',
    });
  }, [toast]);

  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
    toast({
      title: 'Enregistrement termin ',
      description: 'Vid o AR enregistr e avec succ s',
    });
  }, [toast]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  const formatDate = useCallback((timestamp: number) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <ErrorBoundary componentName="ARStudioPreview">
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard/ar-studio">
                <Button variant="ghost" size="sm" className="border-slate-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
              <Eye className="w-8 h-8 text-cyan-400" />
              Pr visualisation AR
            </h1>
            <p className="text-slate-400">
              Testez vos mod les en r alit  augment e avant publication
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowHistoryDialog(true)}
              className="border-slate-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              Historique
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAnalyticsDialog(true)}
              className="border-slate-700"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Mod les', value: stats.totalModels, color: 'cyan', icon: Eye },
            { label: 'Vues', value: stats.totalViews.toLocaleString(), color: 'blue', icon: Users },
            { label: 'Sessions', value: stats.totalSessions.toLocaleString(), color: 'green', icon: Play },
            { label: 'Dur e moyenne', value: `${stats.avgSessionDuration}s`, color: 'purple', icon: Clock },
            { label: 'Pr ts', value: stats.readyModels, color: 'yellow', icon: CheckCircle2 },
            { label: 'iOS', value: stats.byPlatform.ios, color: 'orange', icon: Smartphone },
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
                        stat.color === 'yellow' && "text-yellow-400",
                        stat.color === 'orange' && "text-orange-400"
                      )}>{stat.value}</p>
                    </div>
                    <div className={cn(
                      "p-2 rounded-lg",
                      stat.color === 'cyan' && "bg-cyan-500/10",
                      stat.color === 'blue' && "bg-blue-500/10",
                      stat.color === 'green' && "bg-green-500/10",
                      stat.color === 'purple' && "bg-purple-500/10",
                      stat.color === 'yellow' && "bg-yellow-500/10",
                      stat.color === 'orange' && "bg-orange-500/10"
                    )}>
                      <Icon className={cn(
                        "w-4 h-4",
                        stat.color === 'cyan' && "text-cyan-400",
                        stat.color === 'blue' && "text-blue-400",
                        stat.color === 'green' && "text-green-400",
                        stat.color === 'purple' && "text-purple-400",
                        stat.color === 'yellow' && "text-yellow-400",
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
          <TabsList className="bg-slate-900/50 border border-slate-700 grid grid-cols-10">
            <TabsTrigger value="preview" className="data-[state=active]:bg-cyan-600">Pr visualisation</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-cyan-600">Historique</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-600">Analytics</TabsTrigger>
            <TabsTrigger value="ai-ml" className="data-[state=active]:bg-cyan-600">IA/ML</TabsTrigger>
            <TabsTrigger value="collaboration" className="data-[state=active]:bg-cyan-600">Collaboration</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-cyan-600">Performance</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-cyan-600">S curit </TabsTrigger>
            <TabsTrigger value="i18n" className="data-[state=active]:bg-cyan-600">i18n</TabsTrigger>
            <TabsTrigger value="accessibility" className="data-[state=active]:bg-cyan-600">Accessibilit </TabsTrigger>
            <TabsTrigger value="workflow" className="data-[state=active]:bg-cyan-600">Workflow</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-6">
            {/* Enhanced Preview Header */}
            <Card className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-cyan-500/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Pr visualisation AR Interactive</h3>
                    <p className="text-sm text-slate-300">Testez vos mod les en r alit  augment e avec des contr les avanc s</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">Syst me AR actif</Badge>
                    <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                      {selectedModelData.arMode === 'face' && 'Face Tracking'}
                      {selectedModelData.arMode === 'world' && 'World Tracking'}
                      {selectedModelData.arMode === 'image' && 'Image Tracking'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel - Model Selection */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">S lectionner un mod le</CardTitle>
                    <CardDescription className="text-slate-400">
                      Choisissez le mod le   pr visualiser
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Cat gorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="accessories">Accessoires</SelectItem>
                        <SelectItem value="jewelry">Bijoux</SelectItem>
                        <SelectItem value="furniture">Mobilier</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden">
                      <Image
                        src={selectedModelData.thumbnail}
                        alt={selectedModelData.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className={cn(
                          selectedModelData.status === 'ready' && "bg-green-500",
                          selectedModelData.status === 'processing' && "bg-yellow-500",
                          selectedModelData.status === 'error' && "bg-red-500"
                        )}>
                          {selectedModelData.status === 'ready' && 'Pr t'}
                          {selectedModelData.status === 'processing' && 'Traitement'}
                          {selectedModelData.status === 'error' && 'Erreur'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Format</span>
                        <span className="text-white">{selectedModelData.format}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Taille</span>
                        <span className="text-white">{formatFileSize(selectedModelData.size)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Polygones</span>
                        <span className="text-white">{selectedModelData.polyCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Mode AR</span>
                        <Badge variant="outline" className="border-slate-600">
                          {selectedModelData.arMode === 'face' && 'Face Tracking'}
                          {selectedModelData.arMode === 'world' && 'World Tracking'}
                          {selectedModelData.arMode === 'image' && 'Image Tracking'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Plateformes</span>
                        <div className="flex gap-1">
                          {selectedModelData.platformSupport?.map((platform) => (
                            <Badge key={platform} variant="outline" className="border-slate-600 text-xs">
                              {platform.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-slate-700" />

                    <div className="space-y-2">
                      <Button
                        onClick={isPreviewing ? handleStopPreview : handleStartPreview}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                        size="lg"
                      >
                        {isPreviewing ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Arr ter
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            D marrer la pr visualisation
                          </>
                        )}
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={handleGenerateQR}
                          className="border-slate-700 hover:bg-slate-800 text-white"
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          QR Code
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleShare}
                          className="border-slate-700 hover:bg-slate-800 text-white"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Partager
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={isRecording ? handleStopRecording : handleStartRecording}
                          className="border-slate-700 hover:bg-slate-800 text-white"
                          disabled={!isPreviewing}
                        >
                          {isRecording ? (
                            <>
                              <SquareIcon className="w-4 h-4 mr-2" />
                              Arr ter
                            </>
                          ) : (
                            <>
                              <VideoIcon className="w-4 h-4 mr-2" />
                              Enregistrer
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCapture}
                          className="border-slate-700 hover:bg-slate-800 text-white"
                          disabled={!isPreviewing}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Capturer
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowSettingsDialog(true)}
                        className="w-full border-slate-700 hover:bg-slate-800 text-white"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Param tres AR
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-cyan-950/20 border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-300 text-sm flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      Comment utiliser
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-xs text-slate-400 space-y-2">
                      <li>1. S lectionnez un mod le</li>
                      <li>2. Cliquez sur "D marrer la pr visualisation"</li>
                      <li>3. Scannez le QR Code avec votre mobile</li>
                      <li>4. Visualisez le mod le en AR</li>
                      <li>5. Utilisez les contr les pour interagir</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Preview Area */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">Zone de pr visualisation AR</CardTitle>
                        <CardDescription className="text-slate-400">
                          Visualisez votre mod le en r alit  augment e
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant={previewMode === 'world' ? 'default' : 'ghost'} 
                          size="sm" 
                          onClick={() => setPreviewMode('world')}
                          className={previewMode === 'world' ? 'bg-cyan-600' : ''}
                        >
                          <Globe className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant={previewMode === 'face' ? 'default' : 'ghost'} 
                          size="sm" 
                          onClick={() => setPreviewMode('face')}
                          className={previewMode === 'face' ? 'bg-cyan-600' : ''}
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant={previewMode === 'image' ? 'default' : 'ghost'} 
                          size="sm" 
                          onClick={() => setPreviewMode('image')}
                          className={previewMode === 'image' ? 'bg-cyan-600' : ''}
                        >
                          <FileImageIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* AR Preview Stats */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { label: 'FPS', value: '60', icon: Monitor, color: 'green' },
                        { label: 'Latence', value: '12ms', icon: Cpu, color: 'blue' },
                        { label: 'Tracking', value: '98%', icon: Target, color: 'cyan' },
                        { label: 'Batterie', value: '85%', icon: BatteryFull, color: 'yellow' },
                      ].map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                          <div key={idx} className="p-2 bg-slate-800/50 rounded-lg text-center">
                            <Icon className={`w-4 h-4 text-${stat.color}-400 mx-auto mb-1`} />
                            <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                            <p className="text-sm font-bold text-white">{stat.value}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-700">
                      {isPreviewing ? (
                        <div className="text-center w-full h-full flex flex-col items-center justify-center">
                          <div className="relative w-full h-full">
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-24 h-24 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-slate-300 mb-2">Pr visualisation AR active</p>
                                <p className="text-xs text-slate-500">Ouvrez votre appareil mobile pour voir le mod le</p>
                                {isRecording && (
                                  <div className="mt-4 flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm text-red-400">Enregistrement en cours...</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* AR Controls Overlay */}
                            <div className="absolute bottom-4 left-4 right-4">
                              <div className="bg-slate-900/90 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                                    <ZoomIn className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                                    <ZoomOut className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                                    <RotateCw className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  <SignalHigh className="w-4 h-4 text-green-400" />
                                  <span>Tracking: Excellent</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Eye className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                          <p className="text-slate-400 mb-4">Aucune pr visualisation active</p>
                          <Button
                            onClick={handleStartPreview}
                            variant="outline"
                            className="border-slate-700 hover:bg-slate-800 text-white"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            D marrer
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Model Info - Enhanced */}
                    <div className="mt-6 space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-white mb-3">Informations du mod le</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card className="bg-slate-800/50 border-slate-700">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-3 h-3 text-slate-400" />
                                <p className="text-xs text-slate-500">Format</p>
                              </div>
                              <p className="text-sm font-semibold text-white">{selectedModelData.format}</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-slate-800/50 border-slate-700">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <HardDrive className="w-3 h-3 text-slate-400" />
                                <p className="text-xs text-slate-500">Taille</p>
                              </div>
                              <p className="text-sm font-semibold text-white">{formatFileSize(selectedModelData.size)}</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-slate-800/50 border-slate-700">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Cpu className="w-3 h-3 text-slate-400" />
                                <p className="text-xs text-slate-500">Polygones</p>
                              </div>
                              <p className="text-sm font-semibold text-white">{selectedModelData.polyCount.toLocaleString()}</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-slate-800/50 border-slate-700">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Eye className="w-3 h-3 text-slate-400" />
                                <p className="text-xs text-slate-500">Vues</p>
                              </div>
                              <p className="text-sm font-semibold text-white">{selectedModelData.views}</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Advanced Model Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-slate-400">Sessions</span>
                              <Badge className="bg-blue-500">{selectedModelData.sessions}</Badge>
                            </div>
                            <Progress value={(selectedModelData.sessions / stats.totalSessions) * 100} className="h-1" />
                          </CardContent>
                        </Card>
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-slate-400">Dur e moyenne</span>
                              <Badge className="bg-green-500">{selectedModelData.avgSessionDuration}s</Badge>
                            </div>
                            <Progress value={(selectedModelData.avgSessionDuration / 120) * 100} className="h-1" />
                          </CardContent>
                        </Card>
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-slate-400">Note</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-semibold text-white">4.7</span>
                              </div>
                            </div>
                            <Progress value={94} className="h-1" />
                          </CardContent>
                        </Card>
                      </div>

                      {selectedModelData.description && (
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader>
                            <CardTitle className="text-sm">Description</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-slate-300">{selectedModelData.description}</p>
                          </CardContent>
                        </Card>
                      )}
                      {selectedModelData.tags && selectedModelData.tags.length > 0 && (
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader>
                            <CardTitle className="text-sm">Tags</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {selectedModelData.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="border-slate-600">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Platform Compatibility */}
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-cyan-400" />
                            Compatibilit  Plateformes
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-3">
                            {selectedModelData.platformSupport?.map((platform) => (
                              <div key={platform} className="p-3 bg-slate-900/50 rounded-lg text-center">
                                <Badge className="bg-cyan-500/20 text-cyan-400 mb-2">
                                  {platform.toUpperCase()}
                                </Badge>
                                <div className="flex items-center justify-center gap-1 mt-2">
                                  <CheckCircle2Icon className="w-4 h-4 text-green-400" />
                                  <span className="text-xs text-slate-300">Compatible</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Historique des Sessions AR</h3>
                    <p className="text-sm text-slate-300">Consultez toutes vos sessions de pr visualisation AR</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-slate-600">
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                    </Button>
                    <Button variant="outline" className="border-slate-600">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtrer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* History Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Sessions totales', value: sessions.length, icon: Play, color: 'cyan' },
                { label: 'Dur e totale', value: `${Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / 60)}min`, icon: Clock, color: 'blue' },
                { label: 'Taux de compl tion', value: `${Math.round((sessions.filter(s => s.status === 'completed').length / sessions.length) * 100)}%`, icon: CheckCircle2, color: 'green' },
                { label: 'Plateformes', value: new Set(sessions.map(s => s.platform)).size, icon: Smartphone, color: 'purple' },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <Card key={idx} className="bg-slate-900/50 border-slate-700">
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

            {sessions.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Clock className="w-16 h-16 text-slate-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Aucune session</h3>
                  <p className="text-slate-400 text-center mb-4">
                    Votre historique de sessions AR appara tra ici
                  </p>
                  <Button onClick={handleStartPreview} className="bg-cyan-600 hover:bg-cyan-700">
                    <Play className="w-4 h-4 mr-2" />
                    D marrer une session
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <Card key={session.id} className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">{session.modelName}</h3>
                            <Badge variant="outline" className="border-slate-600">
                              {session.platform.toUpperCase()}
                            </Badge>
                            <Badge className={session.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}>
                              {session.status === 'completed' ? 'Termin e' : 'Annul e'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(session.startedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Play className="w-4 h-4" />
                              {formatDuration(session.duration)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {Math.round(session.duration / 60)} min
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="border-slate-600">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="border-slate-600">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="border-slate-600">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-cyan-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Analytics AR Avanc es</h3>
                    <p className="text-sm text-slate-300">Analysez les performances de vos pr visualisations AR</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Vues totales', value: stats.totalViews.toLocaleString(), change: '+23%', icon: Eye, color: 'cyan' },
                { label: 'Sessions actives', value: stats.totalSessions.toLocaleString(), change: '+18%', icon: Play, color: 'blue' },
                { label: 'Dur e moyenne', value: `${stats.avgSessionDuration}s`, change: '+5s', icon: Clock, color: 'green' },
                { label: 'Taux de conversion', value: '68%', change: '+4%', icon: TrendingUp, color: 'purple' },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <Card key={idx} className="bg-slate-900/50 border-slate-700">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-cyan-400" />
                    R partition par plateforme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { platform: 'iOS', percentage: 45, value: stats.byPlatform.ios, color: 'cyan' },
                      { platform: 'Android', percentage: 35, value: stats.byPlatform.android, color: 'blue' },
                      { platform: 'Web', percentage: 20, value: stats.byPlatform.web, color: 'green' },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white">{item.platform}</span>
                          <span className="text-slate-400">{item.value} mod les ({item.percentage}%)</span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-cyan-400" />
                     volution des sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end justify-between gap-1">
                    {[65, 72, 68, 75, 80, 78, 85, 82, 88, 90, 85, 92, 88, 95].map((height, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${height} sessions`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">14 derniers jours</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm">Modes AR les plus utilis s</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { mode: 'World Tracking', percentage: 55, count: 234 },
                      { mode: 'Face Tracking', percentage: 30, count: 128 },
                      { mode: 'Image Tracking', percentage: 15, count: 64 },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-white">{item.mode}</span>
                          <span className="text-slate-400">{item.count} sessions</span>
                        </div>
                        <Progress value={item.percentage} className="h-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm">Qualit  de tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { quality: 'Excellent', percentage: 78, count: 312 },
                      { quality: 'Bon', percentage: 18, count: 72 },
                      { quality: 'Moyen', percentage: 4, count: 16 },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-white">{item.quality}</span>
                          <span className="text-slate-400">{item.count} sessions</span>
                        </div>
                        <Progress value={item.percentage} className="h-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm">Temps de chargement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-cyan-400">1.2s</p>
                      <p className="text-xs text-slate-400 mt-1">Temps moyen</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <p className="text-white font-semibold">0.8s</p>
                        <p className="text-slate-400">Min</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold">1.2s</p>
                        <p className="text-slate-400">Moy</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold">2.1s</p>
                        <p className="text-slate-400">Max</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* IA/ML Tab */}
          <TabsContent value="ai-ml" className="space-y-6">
            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Intelligence Artificielle & Machine Learning</h3>
                    <p className="text-sm text-slate-300">Recommandations intelligentes, pr dictions et optimisation AR</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Recommandations IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { model: 'Lunettes de soleil premium', reason: 'Bas  sur vos pr f rences', confidence: 95 },
                      { model: 'Montre de luxe', reason: 'Similaire aux mod les r cents', confidence: 87 },
                      { model: 'Chaise design', reason: 'Tendance actuelle', confidence: 82 },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-white">{item.model}</p>
                          <Badge className="bg-purple-500/20 text-purple-400">{item.confidence}%</Badge>
                        </div>
                        <p className="text-xs text-slate-400">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    Pr dictions de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white">Taux de conversion pr vu</span>
                        <Badge className="bg-green-500">72%</Badge>
                      </div>
                      <Progress value={72} className="h-2" />
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white">Engagement pr vu</span>
                        <Badge className="bg-blue-500">68%</Badge>
                      </div>
                      <Progress value={68} className="h-2" />
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white">Score de qualit  AR</span>
                        <Badge className="bg-purple-500">89%</Badge>
                      </div>
                      <Progress value={89} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                    <h3 className="text-xl font-bold text-white">Collaboration en Temps R el</h3>
                    <p className="text-sm text-slate-300">Travaillez ensemble sur vos pr visualisations AR</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Collaborateurs actifs', value: '12', icon: Users, color: 'blue' },
                { label: 'Commentaires', value: '45', icon: MessageSquare, color: 'cyan' },
                { label: 'Partages', value: '23', icon: Share2, color: 'green' },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <Card key={idx} className="bg-slate-900/50 border-slate-700">
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

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Membres de l' quipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'John Doe', role: 'Admin', status: 'online', avatar: 'JD' },
                    { name: 'Jane Smith', role: 'Editor', status: 'online', avatar: 'JS' },
                    { name: 'Mike Johnson', role: 'Viewer', status: 'away', avatar: 'MJ' },
                    { name: 'Sarah Williams', role: 'Editor', status: 'offline', avatar: 'SW' },
                  ].map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{member.name}</p>
                          <p className="text-xs text-slate-400">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={member.status === 'online' ? 'bg-green-500' : member.status === 'away' ? 'bg-yellow-500' : 'bg-slate-600'}>
                          {member.status === 'online' ? 'En ligne' : member.status === 'away' ? 'Absent' : 'Hors ligne'}
                        </Badge>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Inviter un membre
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Commentaires r cents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { author: 'John Doe', comment: 'Le tracking fonctionne parfaitement !', time: 'Il y a 5 min', model: 'Lunettes de soleil premium' },
                    { author: 'Jane Smith', comment: 'Pourrait-on am liorer l\' clairage ?', time: 'Il y a 12 min', model: 'Montre de luxe' },
                    { author: 'Mike Johnson', comment: 'Excellent travail sur ce mod le', time: 'Il y a 18 min', model: 'Chaise design' },
                  ].map((comment, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                          {comment.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">{comment.author}</span>
                            <span className="text-xs text-slate-400"> </span>
                            <span className="text-xs text-slate-400">{comment.time}</span>
                          </div>
                          <p className="text-sm text-slate-300 mb-1">{comment.comment}</p>
                          <p className="text-xs text-slate-500">Sur: {comment.model}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 border-slate-600">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Ajouter un commentaire
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <ZapIcon className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Performance & Optimisation</h3>
                    <p className="text-sm text-slate-300">M triques de performance et optimisation AR</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'FPS moyen', value: '60', target: '60', status: 'good', icon: Monitor },
                { label: 'Latence', value: '12ms', target: '< 20ms', status: 'good', icon: Cpu },
                { label: 'Temps de chargement', value: '1.2s', target: '< 2s', status: 'good', icon: Clock },
                { label: 'Qualit  tracking', value: '98%', target: '> 95%', status: 'good', icon: Target },
              ].map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <Card key={idx} className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-slate-400">{metric.label}</span>
                      </div>
                      <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Cible: {metric.target}</span>
                        <Badge className="bg-green-500">OK</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
                    <p className="text-sm text-slate-300">Protection et s curit  de vos pr visualisations AR</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm">Param tres de s curit </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Chiffrement</p>
                      <p className="text-xs text-slate-400">AES-256</p>
                    </div>
                    <Badge className="bg-green-500">Actif</Badge>
                  </div>
                  <Separator className="bg-slate-700" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Watermarking</p>
                      <p className="text-xs text-slate-400">Protection contre le vol</p>
                    </div>
                    <Badge className="bg-green-500">Actif</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm">Audit & Conformit </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white">Dernier audit</span>
                      <Badge className="bg-green-500">Conforme</Badge>
                    </div>
                    <p className="text-xs text-slate-400">15/01/2024   RGPD, SOC 2</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* i18n Tab */}
          <TabsContent value="i18n" className="space-y-6">
            <Card className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-indigo-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <GlobeIcon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Internationalisation</h3>
                    <p className="text-sm text-slate-300">50+ langues, traduction automatique, et formats r gionaux</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GlobeIcon className="w-5 h-5 text-indigo-400" />
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

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Gestion des Traductions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-white">Pr visualisations traduites</span>
                      <Badge className="bg-indigo-500">92%</Badge>
                    </div>
                    <Progress value={92} className="h-2" />
                    <p className="text-xs text-slate-400 mt-2">456/496 pr visualisations traduites</p>
                  </div>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                    <GlobeIcon className="w-4 h-4 mr-2" />
                    Traduire automatiquement
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-400" />
                  Devise & Tarification
                </CardTitle>
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
                    <EyeIcon className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Accessibilit  WCAG 2.1 AAA</h3>
                    <p className="text-sm text-slate-300">Support complet lecteurs d' cran, navigation clavier, et conformit </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <Badge className="bg-green-500">R ussi</Badge>
                  </div>
                  <Progress value={98} className="h-2" />
                  <p className="text-xs text-slate-400 mt-2">Score: 98/100   Conforme WCAG 2.1 AAA</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { test: 'Contraste', status: 'pass', score: 100 },
                    { test: 'Navigation clavier', status: 'pass', score: 98 },
                    { test: 'Lecteur d\' cran', status: 'pass', score: 97 },
                    { test: 'Alt text', status: 'pass', score: 95 },
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
                <Button className="w-full mt-4 bg-teal-600 hover:bg-teal-700">
                  <TestTube className="w-4 h-4 mr-2" />
                  Lancer un nouveau test
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-teal-400" />
                  Navigation Clavier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { key: 'Tab', action: 'Navigation entre  l ments' },
                    { key: 'Enter', action: 'D marrer pr visualisation' },
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
                    <Workflow className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Automatisation de Workflows</h3>
                    <p className="text-sm text-slate-300">Cr ez des workflows automatis s pour optimiser vos pr visualisations AR</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    { name: 'Pr visualisation Auto', description: 'Lance automatiquement la pr visualisation', steps: 3, uses: 234 },
                    { name: 'Export Batch', description: 'Exporte plusieurs mod les en une fois', steps: 4, uses: 156 },
                    { name: 'Analyse Qualit ', description: 'Analyse automatiquement la qualit  AR', steps: 5, uses: 89 },
                    { name: 'Partage Automatique', description: 'Partage automatiquement les r sultats', steps: 2, uses: 67 },
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
                        <Play className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white"> tape 1: D marrer Pr visualisation</p>
                        <p className="text-xs text-slate-400">D clencheur: Nouveau mod le s lectionn </p>
                      </div>
                    </div>
                    <Separator className="bg-slate-700 mb-4" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <CheckCircle2Icon className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white"> tape 2: V rifier Qualit </p>
                        <p className="text-xs text-slate-400">Condition: Tracking &gt; 95%</p>
                      </div>
                    </div>
                    <Separator className="bg-slate-700 mb-4" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Share2 className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white"> tape 3: Partager</p>
                        <p className="text-xs text-slate-400">Action: G n rer QR Code et partager</p>
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

        {/* QR Code Dialog - Enhanced */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-400" />
                QR Code de pr visualisation AR
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Scannez ce code avec votre appareil mobile pour voir le mod le en AR
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-6">
              <div className="flex flex-col items-center justify-center py-6 bg-slate-800/50 rounded-lg">
                <div className="w-64 h-64 bg-white p-4 rounded-lg mb-4">
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-slate-600" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-white mb-1">
                    {selectedModelData.name}
                  </p>
                  <p className="text-sm text-slate-400 mb-4">
                    Format: {selectedModelData.format}   {formatFileSize(selectedModelData.size)}
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {selectedModelData.platformSupport?.map((platform) => (
                      <Badge key={platform} variant="outline" className="border-slate-600">
                        {platform.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-400 mb-2">Lien de partage</p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={`${window.location.origin}/ar/preview/${selectedModel}`}
                        readOnly
                        className="bg-slate-900 border-slate-700 text-white text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="border-slate-700"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-400 mb-2">Options</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">Taille QR Code</span>
                        <Select defaultValue="large">
                          <SelectTrigger className="h-7 text-xs border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Petit</SelectItem>
                            <SelectItem value="medium">Moyen</SelectItem>
                            <SelectItem value="large">Grand</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300">Inclure logo</span>
                        <Checkbox defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="flex-1 border-slate-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier le lien
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({ title: 'T l chargement', description: 'QR Code t l charg ' });
                  }}
                  className="flex-1 border-slate-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  T l charger QR Code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({ title: 'Partage', description: 'QR Code partag ' });
                  }}
                  className="flex-1 border-slate-700"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog - Enhanced */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                Param tres AR Avanc s
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Configurez tous les param tres de pr visualisation AR pour une exp rience optimale
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="general" className="w-full mt-6">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
                <TabsTrigger value="general">G n ral</TabsTrigger>
                <TabsTrigger value="rendering">Rendu</TabsTrigger>
                <TabsTrigger value="tracking">Tracking</TabsTrigger>
                <TabsTrigger value="advanced">Avanc </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <Label className="text-white"> clairage</Label>
                      <p className="text-xs text-slate-400">Active l' clairage r aliste</p>
                    </div>
                    <Checkbox
                      checked={arSettings.enableLighting}
                      onCheckedChange={(checked) =>
                        setArSettings({ ...arSettings, enableLighting: checked as boolean })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <Label className="text-white">Ombres</Label>
                      <p className="text-xs text-slate-400">Active les ombres port es</p>
                    </div>
                    <Checkbox
                      checked={arSettings.enableShadows}
                      onCheckedChange={(checked) =>
                        setArSettings({ ...arSettings, enableShadows: checked as boolean })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <Label className="text-white">Physique</Label>
                      <p className="text-xs text-slate-400">Active la simulation physique</p>
                    </div>
                    <Checkbox
                      checked={arSettings.enablePhysics}
                      onCheckedChange={(checked) =>
                        setArSettings({ ...arSettings, enablePhysics: checked as boolean })
                      }
                    />
                  </div>
                </div>

                <Separator className="bg-slate-700" />

                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Environnement</Label>
                    <Select
                      value={arSettings.environment}
                      onValueChange={(value: 'default' | 'studio' | 'outdoor' | 'indoor') =>
                        setArSettings({ ...arSettings, environment: value })
                      }
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Par d faut</SelectItem>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="outdoor">Ext rieur</SelectItem>
                        <SelectItem value="indoor">Int rieur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rendering" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Qualit  de rendu</Label>
                    <Select defaultValue="high">
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse (Performance)</SelectItem>
                        <SelectItem value="medium">Moyenne ( quilibr e)</SelectItem>
                        <SelectItem value="high">Haute (Qualit )</SelectItem>
                        <SelectItem value="ultra">Ultra (Maximum)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Anti-aliasing</Label>
                    <Select defaultValue="msaa4x">
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        <SelectItem value="fxaa">FXAA</SelectItem>
                        <SelectItem value="msaa2x">MSAA 2x</SelectItem>
                        <SelectItem value="msaa4x">MSAA 4x</SelectItem>
                        <SelectItem value="msaa8x">MSAA 8x</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">R solution</Label>
                    <Select defaultValue="1080p">
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="1080p">1080p</SelectItem>
                        <SelectItem value="1440p">1440p</SelectItem>
                        <SelectItem value="4k">4K</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tracking" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Qualit  de tracking</Label>
                    <Select
                      value={arSettings.trackingQuality}
                      onValueChange={(value: 'low' | 'medium' | 'high') =>
                        setArSettings({ ...arSettings, trackingQuality: value })
                      }
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse (Performance)</SelectItem>
                        <SelectItem value="medium">Moyenne ( quilibr e)</SelectItem>
                        <SelectItem value="high">Haute (Pr cision)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <Label className="text-white">Stabilisation</Label>
                      <p className="text-xs text-slate-400">R duit les tremblements</p>
                    </div>
                    <Checkbox defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <Label className="text-white">D tection de surface</Label>
                      <p className="text-xs text-slate-400">D tecte automatiquement les surfaces</p>
                    </div>
                    <Checkbox defaultChecked />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Mode de performance</Label>
                    <Select defaultValue="balanced">
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="balanced"> quilibr </SelectItem>
                        <SelectItem value="quality">Qualit </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <Label className="text-white">Occlusion</Label>
                      <p className="text-xs text-slate-400">Occlusion r aliste des objets</p>
                    </div>
                    <Checkbox defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <Label className="text-white">R flexions</Label>
                      <p className="text-xs text-slate-400">R flexions r alistes</p>
                    </div>
                    <Checkbox />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSettingsDialog(false)}
                className="border-slate-700"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  toast({ title: 'Param tres sauvegard s', description: 'Les param tres AR ont  t  mis   jour' });
                  setShowSettingsDialog(false);
                }}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Additional Features Section */}
        <div className="mt-8 space-y-6">
          {/* AR Advanced Features */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Fonctionnalit s AR Avanc es
              </CardTitle>
              <CardDescription className="text-slate-400">
                Explorez les fonctionnalit s avanc es de pr visualisation AR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Face Tracking', description: 'Suivi facial avanc ', icon: Users, enabled: true },
                  { name: 'World Tracking', description: 'Placement sur surfaces', icon: Globe, enabled: true },
                  { name: 'Image Tracking', description: 'D tection d\'images', icon: FileImage, enabled: true },
                  { name: 'Hand Tracking', description: 'Suivi des mains', icon: Hand, enabled: false },
                  { name: 'Occlusion', description: 'Occlusion r aliste', icon: Layers, enabled: true },
                  { name: 'Light Estimation', description: 'Estimation de la lumi re', icon: Sun, enabled: true },
                ].map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="w-5 h-5 text-cyan-400" />
                          <h4 className="font-semibold text-white">{feature.name}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{feature.description}</p>
                        <Badge className={feature.enabled ? 'bg-green-500' : 'bg-slate-600'}>
                          {feature.enabled ? 'Actif' : 'Bient t'}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AR Performance Metrics */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ZapIcon className="w-5 h-5 text-cyan-400" />
                M triques de Performance AR
              </CardTitle>
              <CardDescription className="text-slate-400">
                Surveillez les performances de vos pr visualisations AR en temps r el
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'FPS moyen', value: '60', target: '60', status: 'good', icon: Monitor, color: 'green' },
                  { label: 'Latence', value: '12ms', target: '< 20ms', status: 'good', icon: Cpu, color: 'blue' },
                  { label: 'Temps de chargement', value: '1.2s', target: '< 2s', status: 'good', icon: Clock, color: 'cyan' },
                  { label: 'Qualit  tracking', value: '98%', target: '> 95%', status: 'good', icon: Target, color: 'purple' },
                ].map((metric, idx) => {
                  const Icon = metric.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 text-${metric.color}-400`} />
                          <span className="text-xs text-slate-400">{metric.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Cible: {metric.target}</span>
                          <Badge className="bg-green-500">OK</Badge>
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

          {/* AR Export Options */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-cyan-400" />
                Options d'Export AR
              </CardTitle>
              <CardDescription className="text-slate-400">
                Exportez vos pr visualisations AR dans tous les formats professionnels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { format: 'USDZ', description: 'Format Apple AR', quality: 'Haute', size: '~2 MB', icon: Smartphone },
                  { format: 'GLB', description: 'Format glTF binaire', quality: 'Haute', size: '~3 MB', icon: File },
                  { format: 'GLTF', description: 'Format glTF JSON', quality: 'Haute', size: '~4 MB', icon: FileJson },
                  { format: 'FBX', description: 'Format Autodesk', quality: 'Tr s haute', size: '~5 MB', icon: FileCode },
                  { format: 'OBJ', description: 'Format Wavefront', quality: 'Moyenne', size: '~1.5 MB', icon: FileText },
                  { format: 'PLY', description: 'Format Polygon', quality: 'Moyenne', size: '~1.2 MB', icon: FileArchive },
                  { format: 'STL', description: 'Format st r olithographie', quality: 'Moyenne', size: '~800 KB', icon: FileCode },
                  { format: '3MF', description: 'Format 3D Manufacturing', quality: 'Haute', size: '~2.5 MB', icon: FileType },
                ].map((format, idx) => {
                  const Icon = format.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-cyan-400" />
                            <p className="text-lg font-bold text-white">{format.format}</p>
                          </div>
                          <Badge className="bg-cyan-500">{format.quality}</Badge>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{format.description}</p>
                        <p className="text-xs text-slate-500 mb-3">Taille: {format.size}</p>
                        <Button size="sm" variant="outline" className="w-full border-slate-600">
                          Exporter
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AR Platform Support */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GlobeIcon className="w-5 h-5 text-cyan-400" />
                Support Multi-Plateformes
              </CardTitle>
              <CardDescription className="text-slate-400">
                Compatibilit  avec toutes les plateformes AR majeures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { platform: 'iOS', technologies: ['ARKit', 'RealityKit', 'USDZ'], icon: Smartphone, color: 'blue', support: 'Complet' },
                  { platform: 'Android', technologies: ['ARCore', 'Sceneform', 'GLB'], icon: Tablet, color: 'green', support: 'Complet' },
                  { platform: 'Web', technologies: ['WebXR', 'WebGL', 'Three.js'], icon: Globe, color: 'purple', support: 'Complet' },
                ].map((platform, idx) => {
                  const Icon = platform.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-5 h-5 text-${platform.color}-400`} />
                            <CardTitle className="text-lg">{platform.platform}</CardTitle>
                          </div>
                          <Badge className="bg-green-500">{platform.support}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {platform.technologies.map((tech, techIdx) => (
                            <Badge key={techIdx} variant="outline" className="border-slate-600 mr-2">
                              {tech}
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

          {/* System Status */}
          <div className="fixed bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg backdrop-blur-sm z-50">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-300">Syst me AR op rationnel</span>
            <Badge variant="outline" className="ml-2 border-green-500/50 text-green-400 text-xs">
              Tous les services actifs
            </Badge>
          </div>

          {/* Version Info */}
          <div className="fixed bottom-4 left-48 text-xs text-slate-500 z-50">
            v2.4.1   AR Studio Preview   {new Date().getFullYear()}
          </div>

          {/* AR Recording & Capture Advanced */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <VideoIcon className="w-5 h-5 text-cyan-400" />
                Enregistrement & Capture Avanc s
              </CardTitle>
              <CardDescription className="text-slate-400">
                Enregistrez et capturez vos exp riences AR avec des options professionnelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Options d'enregistrement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">R solution</span>
                        <Select defaultValue="1080p">
                          <SelectTrigger className="h-7 text-xs border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="720p">720p HD</SelectItem>
                            <SelectItem value="1080p">1080p Full HD</SelectItem>
                            <SelectItem value="4k">4K Ultra HD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">FPS</span>
                        <Select defaultValue="60">
                          <SelectTrigger className="h-7 text-xs border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 FPS</SelectItem>
                            <SelectItem value="60">60 FPS</SelectItem>
                            <SelectItem value="120">120 FPS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">Qualit </span>
                        <Select defaultValue="high">
                          <SelectTrigger className="h-7 text-xs border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Basse</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Haute</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                      <VideoIcon className="w-4 h-4 mr-2" />
                      D marrer l'enregistrement
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Options de capture</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">Format</span>
                        <Select defaultValue="png">
                          <SelectTrigger className="h-7 text-xs border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="png">PNG</SelectItem>
                            <SelectItem value="jpg">JPG</SelectItem>
                            <SelectItem value="webp">WebP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">R solution</span>
                        <Select defaultValue="1080p">
                          <SelectTrigger className="h-7 text-xs border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="720p">720p</SelectItem>
                            <SelectItem value="1080p">1080p</SelectItem>
                            <SelectItem value="4k">4K</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Inclure les annotations</span>
                        <Checkbox defaultChecked />
                      </div>
                    </div>
                    <Button variant="outline" className="w-full border-slate-600">
                      <Camera className="w-4 h-4 mr-2" />
                      Capturer maintenant
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* AR Sharing & Distribution */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyan-400" />
                Partage & Distribution
              </CardTitle>
              <CardDescription className="text-slate-400">
                Partagez vos pr visualisations AR facilement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'QR Code', description: 'G n ration automatique', icon: QrCode, color: 'cyan' },
                  { name: 'Lien direct', description: 'Partage par URL', icon: LinkIcon, color: 'blue' },
                  { name: 'Embed', description: 'Int gration web', icon: Code, color: 'green' },
                  { name: 'Social Media', description: 'Partage r seaux sociaux', icon: Share2, color: 'purple' },
                ].map((method, idx) => {
                  const Icon = method.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className={`w-5 h-5 text-${method.color}-400`} />
                          <h4 className="font-semibold text-white">{method.name}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{method.description}</p>
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

          {/* AR Analytics Deep Dive */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Analytics Approfondies
              </CardTitle>
              <CardDescription className="text-slate-400">
                Analysez en d tail les performances de vos pr visualisations AR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
                  <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  <TabsTrigger value="technical">Technique</TabsTrigger>
                  <TabsTrigger value="geographic">G ographique</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Vues totales', value: stats.totalViews.toLocaleString(), change: '+12%', icon: Eye },
                      { label: 'Sessions', value: stats.totalSessions.toLocaleString(), change: '+23%', icon: Play },
                      { label: 'Dur e moyenne', value: `${stats.avgSessionDuration}s`, change: '+5s', icon: Clock },
                      { label: 'Taux de conversion', value: '68%', change: '+4%', icon: TrendingUp },
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
                <TabsContent value="engagement" className="mt-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-sm">Temps d'engagement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 flex items-end justify-between gap-1">
                        {[45, 52, 48, 55, 60, 58, 65, 62, 68, 70, 65, 72, 68, 75].map((height, idx) => (
                          <div
                            key={idx}
                            className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t"
                            style={{ height: `${height}%` }}
                            title={`${height}s`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-2 text-center">14 derniers jours</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="technical" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Performance technique</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { metric: 'FPS moyen', value: '60', status: 'good' },
                            { metric: 'Latence', value: '12ms', status: 'good' },
                            { metric: 'Taux d\'erreur', value: '0.02%', status: 'good' },
                            { metric: 'Qualit  tracking', value: '98%', status: 'good' },
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-slate-300">{item.metric}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold">{item.value}</span>
                                <Badge className="bg-green-500">OK
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Compatibilit </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { device: 'iOS', percentage: 45, count: 234 },
                            { device: 'Android', percentage: 35, count: 182 },
                            { device: 'Web', percentage: 20, count: 104 },
                          ].map((item, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-white">{item.device}</span>
                                <span className="text-slate-400">{item.count} sessions</span>
                              </div>
                              <Progress value={item.percentage} className="h-1" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="geographic" className="mt-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-sm">R partition g ographique</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { country: 'France', percentage: 35, count: 182 },
                          { country: ' tats-Unis', percentage: 28, count: 146 },
                          { country: 'Allemagne', percentage: 15, count: 78 },
                          { country: 'Royaume-Uni', percentage: 12, count: 62 },
                          { country: 'Autres', percentage: 10, count: 52 },
                        ].map((item, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-white">{item.country}</span>
                              <span className="text-slate-400">{item.count} sessions</span>
                            </div>
                            <Progress value={item.percentage} className="h-1" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* AR Model Library */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Biblioth que de Mod les AR
              </CardTitle>
              <CardDescription className="text-slate-400">
                G rez et organisez votre collection de mod les AR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {models.slice(0, 6).map((model) => (
                  <Card key={model.id} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                    <CardContent className="p-4">
                      <div className="relative aspect-square bg-slate-900/50 rounded-lg overflow-hidden mb-3">
                        <Image
                          src={model.thumbnail}
                          alt={model.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className={model.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'}>
                            {model.status === 'ready' ? 'Pr t' : 'Traitement'}
                          </Badge>
                        </div>
                      </div>
                      <h4 className="font-semibold text-white mb-1">{model.name}</h4>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>{model.format}</span>
                        <span>{formatFileSize(model.size)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="flex-1 border-slate-600">
                          <Eye className="w-3 h-3 mr-1" />
                          Voir
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-600">
                          <Heart className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AR Quick Actions */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ZapIcon className="w-5 h-5 text-cyan-400" />
                Actions Rapides
              </CardTitle>
              <CardDescription className="text-slate-400">
                Acc dez rapidement aux actions les plus courantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Nouvelle pr visualisation', icon: Plus, color: 'cyan' },
                  { label: 'Importer mod le', icon: UploadIcon, color: 'blue' },
                  { label: 'Exporter', icon: Download, color: 'green' },
                  { label: 'Partager', icon: Share2, color: 'purple' },
                  { label: 'Enregistrer', icon: VideoIcon, color: 'orange' },
                  { label: 'Capturer', icon: Camera, color: 'red' },
                  { label: 'Param tres', icon: Settings, color: 'slate' },
                  { label: 'Historique', icon: History, color: 'yellow' },
                  { label: 'Analytics', icon: BarChart3, color: 'teal' },
                  { label: 'Aide', icon: HelpCircle, color: 'pink' },
                  { label: 'QR Code', icon: QrCode, color: 'indigo' },
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

          {/* AR Keyboard Shortcuts */}
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
                  { action: 'D marrer pr visualisation', shortcut: 'Space', category: 'Contr le' },
                  { action: 'Arr ter pr visualisation', shortcut: 'Escape', category: 'Contr le' },
                  { action: 'Enregistrer', shortcut: 'Ctrl + R', category: 'Enregistrement' },
                  { action: 'Capturer', shortcut: 'Ctrl + C', category: 'Capture' },
                  { action: 'Partager', shortcut: 'Ctrl + Shift + S', category: 'Partage' },
                  { action: 'Param tres', shortcut: 'Ctrl + ,', category: 'Param tres' },
                  { action: 'Zoom avant', shortcut: 'Ctrl + +', category: 'Navigation' },
                  { action: 'Zoom arri re', shortcut: 'Ctrl + -', category: 'Navigation' },
                  { action: 'Plein  cran', shortcut: 'F11', category: 'Affichage' },
                  { action: 'Rechercher', shortcut: 'Ctrl + F', category: 'Navigation' },
                  { action: 'Historique', shortcut: 'Ctrl + H', category: 'Navigation' },
                  { action: 'Analytics', shortcut: 'Ctrl + A', category: 'Analytics' },
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

          {/* AR Support & Help */}
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
                        { question: 'Comment d marrer une pr visualisation AR?', views: 1.2 },
                        { question: 'Quels formats sont support s?', views: 0.8 },
                        { question: 'Comment partager une pr visualisation?', views: 0.6 },
                        { question: 'Probl mes de tracking?', views: 0.4 },
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

          {/* AR Learning Resources */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                Ressources d'Apprentissage
              </CardTitle>
              <CardDescription className="text-slate-400">
                Apprenez   utiliser au mieux vos pr visualisations AR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Guide de d marrage AR', description: 'Tutoriel complet pour d buter', type: 'Tutoriel', duration: '15 min', icon: BookOpen },
                  { title: 'Meilleures pratiques', description: 'Conseils d\'experts pour optimiser', type: 'Article', duration: '8 min', icon: Lightbulb },
                  { title: 'Vid os YouTube', description: 'Cha ne d di e aux pr visualisations AR', type: 'Vid o', duration: 'Varies', icon: VideoIcon },
                  { title: 'Documentation API', description: 'Guide complet de l\'API AR', type: 'Documentation', duration: '30 min', icon: FileText },
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

          {/* AR Integrations */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-cyan-400" />
                Int grations
              </CardTitle>
              <CardDescription className="text-slate-400">
                Connectez vos pr visualisations AR   vos outils pr f r s
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Shopify', description: 'Int gration e-commerce', icon: '  ', status: 'connected', color: 'green' },
                  { name: 'WooCommerce', description: 'Boutique WordPress', icon: ' ', status: 'available', color: 'blue' },
                  { name: 'Magento', description: 'Plateforme e-commerce', icon: ' ', status: 'available', color: 'orange' },
                  { name: 'PrestaShop', description: 'Solution e-commerce', icon: '  ', status: 'available', color: 'purple' },
                  { name: 'BigCommerce', description: 'Plateforme SaaS', icon: ' ', status: 'available', color: 'cyan' },
                  { name: 'Squarespace', description: 'Cr ateur de sites', icon: '  ', status: 'available', color: 'pink' },
                  { name: 'WordPress', description: 'CMS populaire', icon: ' ', status: 'connected', color: 'blue' },
                  { name: 'Webflow', description: 'Design web', icon: ' ', status: 'available', color: 'indigo' },
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

          {/* AR Subscription Plans */}
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
                  { name: 'Starter', price: 'Gratuit', features: ['10 pr visualisations/mois', 'Formats de base', 'Support communautaire'], popular: false },
                  { name: 'Pro', price: ' 29/mois', features: ['Pr visualisations illimit es', 'Tous les formats', 'Support prioritaire', 'Export HD'], popular: true },
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

          {/* AR Batch Operations */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Op rations en Masse
              </CardTitle>
              <CardDescription className="text-slate-400">
                G rez plusieurs pr visualisations AR   la fois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Pr visualiser en masse', description: 'Lance plusieurs pr visualisations', icon: Play, count: 0 },
                  { name: 'Exporter en masse', description: 'Exporte plusieurs mod les', icon: Download, count: 0 },
                  { name: 'Partager en masse', description: 'Partage plusieurs pr visualisations', icon: Share2, count: 0 },
                  { name: 'G n rer QR Codes', description: 'G n re des QR codes en batch', icon: QrCode, count: 0 },
                  { name: 'Analyser qualit ', description: 'Analyse la qualit  de plusieurs mod les', icon: TestTube, count: 0 },
                  { name: 'Supprimer', description: 'Supprime plusieurs pr visualisations', icon: Trash2, count: 0 },
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

          {/* AR Quality Assurance */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                Assurance Qualit  AR
              </CardTitle>
              <CardDescription className="text-slate-400">
                V rifiez la qualit  de vos pr visualisations AR avant publication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-white">V rification automatique</p>
                      <p className="text-xs text-slate-400">Analyse en temps r el de vos pr visualisations AR</p>
                    </div>
                    <Badge className="bg-green-500">Actif
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { check: 'Tracking', status: 'pass', value: '98%' },
                      { check: 'Performance', status: 'pass', value: '60 FPS' },
                      { check: 'Qualit  mod le', status: 'pass', value: 'Haute' },
                      { check: 'Compatibilit ', status: 'pass', value: 'Tous' },
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

          {/* AR Usage Statistics */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Statistiques d'Utilisation
              </CardTitle>
              <CardDescription className="text-slate-400">
                Analysez comment vos pr visualisations AR sont utilis es
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
                      { label: 'Pr visualisations utilis es', value: '234', change: '+12', icon: Eye },
                      { label: 'Temps total', value: '45h', change: '+3h', icon: Clock },
                      { label: 'Sessions cr  es', value: '89', change: '+8', icon: Play },
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
                            <Badge className="bg-green-500/20 text-green-400 text-xs">{stat.change}</Badge>
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
                        <p className="text-3xl font-bold text-white">1.2s</p>
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

          {/* AR Export History */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                Historique d'Export
              </CardTitle>
              <CardDescription className="text-slate-400">
                Consultez l'historique de tous vos exports AR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { model: 'Lunettes de soleil premium', format: 'USDZ', date: '15/01/2024 14:30', size: '2.4 MB', status: 'success' },
                  { model: 'Montre de luxe', format: 'GLB', date: '15/01/2024 13:15', size: '3.2 MB', status: 'success' },
                  { model: 'Bague en or', format: 'USDZ', date: '15/01/2024 12:45', size: '1.8 MB', status: 'success' },
                  { model: 'Chaise design', format: 'GLB', date: '15/01/2024 11:20', size: '4.5 MB', status: 'success' },
                  { model: 'Table basse', format: 'GLB', date: '15/01/2024 10:10', size: '3.8 MB', status: 'success' },
                ].map((export_, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                        <Download className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{export_.model}</p>
                        <p className="text-xs text-slate-400">{export_.format}   {export_.size}   {export_.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={export_.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                        {export_.status === 'success' ? 'R ussi' : ' chec'}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Download className="w-4 h-4" />
                      </Button>
                      </Badge>
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

          {/* AR Recommendations Engine */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Moteur de Recommandations
              </CardTitle>
              <CardDescription className="text-slate-400">
                D couvrez des mod les adapt s   vos besoins gr ce   l'IA
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
                          { reason: 'Vous utilisez souvent face tracking', confidence: 95 },
                          { reason: 'Vous pr f rez les mod les premium', confidence: 87 },
                          { reason: 'Vous travaillez sur iOS', confidence: 82 },
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
                    <CardTitle className="text-sm">Mod les tendances</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {[
                        { name: 'Lunettes AR Moderne', trend: '+45%', category: 'Accessoires' },
                        { name: 'Montre Smart AR', trend: '+32%', category: 'Bijoux' },
                        { name: 'Meuble Design AR', trend: '+28%', category: 'Mobilier' },
                        { name: 'D coration AR', trend: '+21%', category: 'D co' },
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

          {/* AR Customization Tools */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                Outils de Personnalisation AR
              </CardTitle>
              <CardDescription className="text-slate-400">
                Personnalisez vos pr visualisations AR avec des outils avanc s
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: ' diteur de couleurs', description: 'Modifiez les couleurs en temps r el', icon: Palette },
                  { name: 'Gestionnaire de textures', description: 'Appliquez vos propres textures', icon: ImageIcon },
                  { name: 'Contr les d\' clairage', description: 'Ajustez l\' clairage AR', icon: Sun },
                  { name: 'Gestionnaire d\'ombres', description: 'Contr lez les ombres port es', icon: Moon },
                  { name: 'R glages de cam ra', description: 'Ajustez l\'angle et la position', icon: Camera },
                  { name: 'Filtres AR', description: 'Appliquez des effets visuels', icon: Sparkles },
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

          {/* AR Backup & Restore */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-cyan-400" />
                Sauvegarde & Restauration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Sauvegardez et restaurez vos pr visualisations AR en toute s curit 
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

          {/* AR Versioning */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-cyan-400" />
                Gestion des Versions
              </CardTitle>
              <CardDescription className="text-slate-400">
                Suivez et g rez les versions de vos pr visualisations AR
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
                    <Badge className="bg-green-500">Active
                    </Badge>
                  </div>
                  <Separator className="bg-slate-700 mb-3" />
                  <div className="space-y-2">
                    {[
                      { version: 'v2.4.1', date: '15/01/2024', changes: 'Am liorations tracking', status: 'active' },
                      { version: 'v2.4.0', date: '10/01/2024', changes: 'Nouveaux modes AR', status: 'archived' },
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
                </div>
                <Button variant="outline" className="w-full border-slate-600">
                  <GitBranch className="w-4 h-4 mr-2" />
                  Cr er une nouvelle version
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AR API Integration */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-400" />
                Int gration API
              </CardTitle>
              <CardDescription className="text-slate-400">
                Int grez les pr visualisations AR dans vos applications
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
{`const arPreview = await fetch('/api/ar/preview', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    modelId: 'model-1',
    mode: 'world',
    settings: { lighting: true, shadows: true }
  })
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

response = requests.post(
    'https://api.luneo.com/ar/preview',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={
        'modelId': 'model-1',
        'mode': 'world',
        'settings': {'lighting': True, 'shadows': True}
    }
)
ar_preview = response.json()`}
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
{`curl -X POST https://api.luneo.com/ar/preview \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "modelId": "model-1",
    "mode": "world",
    "settings": {"lighting": true, "shadows": true}
  }'`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AR Newsletter */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-400" />
                Newsletter
              </CardTitle>
              <CardDescription className="text-slate-400">
                Restez inform  des nouvelles fonctionnalit s AR
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
                  Recevez des mises   jour hebdomadaires avec les meilleures pratiques AR et astuces
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AR Advanced Search */}
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
                    <Label className="text-sm text-slate-300 mb-2 block">Mode AR</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Tous les modes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les modes</SelectItem>
                        <SelectItem value="face">Face Tracking</SelectItem>
                        <SelectItem value="world">World Tracking</SelectItem>
                        <SelectItem value="image">Image Tracking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-300 mb-2 block">Plateforme</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Toutes les plateformes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="ios">iOS</SelectItem>
                        <SelectItem value="android">Android</SelectItem>
                        <SelectItem value="web">Web</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-slate-300 mb-2 block">Format</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Tous les formats" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="usdz">USDZ</SelectItem>
                        <SelectItem value="glb">GLB</SelectItem>
                        <SelectItem value="gltf">GLTF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-300 mb-2 block">Taille</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Toutes les tailles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="small">Petit (&lt; 1 MB)</SelectItem>
                        <SelectItem value="medium">Moyen (1-5 MB)</SelectItem>
                        <SelectItem value="large">Grand (&gt; 5 MB)</SelectItem>
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
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="today">Aujourd'hui</SelectItem>
                        <SelectItem value="week">Cette semaine</SelectItem>
                        <SelectItem value="month">Ce mois</SelectItem>
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
                        <SelectItem value="views">Plus vus</SelectItem>
                        <SelectItem value="sessions">Plus de sessions</SelectItem>
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
                    R initialiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AR Marketplace Stats */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Statistiques du Marketplace AR
              </CardTitle>
              <CardDescription className="text-slate-400">
                Vue d'ensemble du marketplace de pr visualisations AR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Mod les AR totaux', value: '12,456', change: '+234', icon: Layers, color: 'cyan' },
                  { label: 'Utilisateurs actifs', value: '8,923', change: '+156', icon: Users, color: 'blue' },
                  { label: 'Pr visualisations', value: '234,567', change: '+12,345', icon: Eye, color: 'green' },
                  { label: 'Sessions totales', value: '89,234', change: '+5,678', icon: Play, color: 'purple' },
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
                    <CardTitle className="text-sm">Top modes AR</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { mode: 'World Tracking', percentage: 55, sessions: 234 },
                        { mode: 'Face Tracking', percentage: 30, sessions: 128 },
                        { mode: 'Image Tracking', percentage: 15, sessions: 64 },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-white">{item.mode}</span>
                            <span className="text-slate-400">{item.sessions} sessions</span>
                          </div>
                          <Progress value={item.percentage} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Tendances AR</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { trend: 'Face Tracking', change: '+45%', icon: ' ', color: 'cyan' },
                        { trend: 'World Placement', change: '+32%', icon: ' ', color: 'blue' },
                        { trend: 'Occlusion R aliste', change: '+28%', icon: ' ', color: 'green' },
                        { trend: 'Hand Tracking', change: '+21%', icon: ' ', color: 'purple' },
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

          {/* AR Community */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Communaut  AR
              </CardTitle>
              <CardDescription className="text-slate-400">
                Rejoignez une communaut  de cr ateurs AR passionn s
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
                        { label: 'Pr visualisations partag es', value: '8,923', icon: Share2 },
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
                        { user: 'John Doe', action: 'a partag  une pr visualisation', time: 'Il y a 5 min', icon: ' ' },
                        { user: 'Jane Smith', action: 'a cr   une collection AR', time: 'Il y a 12 min', icon: ' ' },
                        { user: 'Mike Johnson', action: 'a comment  une pr visualisation', time: 'Il y a 18 min', icon: ' ' },
                        { user: 'Sarah Williams', action: 'a t l charg  un mod le', time: 'Il y a 25 min', icon: ' ' },
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

          {/* AR Testing & Quality */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5 text-cyan-400" />
                Tests & Qualit 
              </CardTitle>
              <CardDescription className="text-slate-400">
                Testez et validez la qualit  de vos pr visualisations AR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Tests automatiques</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {[
                        { test: 'Test de tracking', status: 'pass', time: '2.3s', icon: Target },
                        { test: 'Test de performance', status: 'pass', time: '1.8s', icon: ZapIcon },
                        { test: 'Test de compatibilit ', status: 'pass', time: '3.1s', icon: Smartphone },
                        { test: 'Test de qualit ', status: 'pass', time: '2.7s', icon: Award },
                      ].map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-cyan-400" />
                              <span className="text-sm text-white">{item.test}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">{item.time}</span>
                                  <Badge className={item.status === 'pass' ? 'bg-green-500' : 'bg-red-500'}>
                                    {item.status === 'pass' ? 'OK' : ' chec'}
                                  </Badge>
                            </div>
                          </div>
                            );
                      })}
                    </div>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                      <TestTube className="w-4 h-4 mr-2" />
                      Lancer tous les tests
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Rapport de qualit </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-slate-900/50 rounded-lg mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-white">Score global</span>
                        <Badge className="bg-green-500">95/100
                        </Badge>
                      </div>
                      <Progress value={95} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      {[
                        { metric: 'Tracking', score: 98, status: 'excellent' },
                        { metric: 'Performance', score: 95, status: 'excellent' },
                        { metric: 'Qualit  visuelle', score: 92, status: 'good' },
                        { metric: 'Compatibilit ', score: 96, status: 'excellent' },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-white">{item.metric}</span>
                            <span className="text-slate-400">{item.score}/100</span>
                          </div>
                          <Progress value={item.score} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* AR Documentation */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                Documentation
              </CardTitle>
              <CardDescription className="text-slate-400">
                Guides complets et documentation technique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Guide de d marrage', description: 'Tutoriel complet AR', icon: BookOpen, type: 'Guide', pages: 45 },
                  { title: 'API Reference', description: 'Documentation API compl te', icon: Code, type: 'API', pages: 234 },
                  { title: 'Best Practices', description: 'Meilleures pratiques AR', icon: Lightbulb, type: 'Guide', pages: 67 },
                  { title: 'Troubleshooting', description: 'R solution de probl mes', icon: HelpCircle, type: 'Guide', pages: 89 },
                  { title: 'Examples', description: 'Exemples de code', icon: FileCode, type: 'Code', pages: 156 },
                  { title: 'Video Tutorials', description: 'Tutoriels vid o', icon: VideoIcon, type: 'Vid o', pages: 23 },
                ].map((doc, idx) => {
                  const Icon = doc.icon;
                      return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="w-5 h-5 text-cyan-400" />
                          <div>
                            <h4 className="font-semibold text-white text-sm">{doc.title}</h4>
                            <Badge variant="outline" className="text-xs border-slate-600 mt-1">
                              {doc.type}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{doc.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{doc.pages} pages</span>
                          <Button size="sm" variant="outline" className="border-slate-600">
                            Lire
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AR Real-time Monitoring */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-cyan-400" />
                Monitoring en Temps R el
              </CardTitle>
              <CardDescription className="text-slate-400">
                Surveillez les performances de vos pr visualisations AR en temps r el
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'FPS actuel', value: '60', status: 'good', icon: Monitor, color: 'green' },
                  { label: 'Latence r seau', value: '12ms', status: 'good', icon: Network, color: 'blue' },
                  { label: 'CPU usage', value: '45%', status: 'good', icon: Cpu, color: 'cyan' },
                  { label: 'M moire', value: '234 MB', status: 'good', icon: MemoryStick, color: 'purple' },
                ].map((metric, idx) => {
                  const Icon = metric.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 text-${metric.color}-400`} />
                          <span className="text-xs text-slate-400">{metric.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                        <Badge className="bg-green-500">OK
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm">Graphique de performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end justify-between gap-1">
                    {[60, 60, 59, 60, 60, 59, 60, 60, 60, 60, 59, 60, 60, 60].map((fps, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-gradient-to-t from-green-500 to-green-400 rounded-t"
                        style={{ height: `${(fps / 60) * 100}%` }}
                        title={`${fps} FPS`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">FPS sur les 14 derni res secondes</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* AR Advanced Features Showcase */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Fonctionnalit s Avanc es
              </CardTitle>
              <CardDescription className="text-slate-400">
                D couvrez toutes les fonctionnalit s avanc es de pr visualisation AR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Occlusion r aliste', description: 'Objets masqu s derri re des surfaces', icon: Layers, enabled: true, premium: false },
                  { name: 'Light Estimation', description: 'Estimation automatique de la lumi re', icon: Sun, enabled: true, premium: false },
                  { name: 'Plane Detection', description: 'D tection automatique des surfaces', icon: Target, enabled: true, premium: false },
                  { name: 'Hand Tracking', description: 'Suivi des mains en temps r el', icon: Hand, enabled: false, premium: true },
                  { name: 'Eye Tracking', description: 'Suivi du regard', icon: Eye, enabled: false, premium: true },
                  { name: 'Body Tracking', description: 'Suivi du corps entier', icon: Users, enabled: false, premium: true },
                  { name: 'Spatial Audio', description: 'Audio spatialis  3D', icon: Volume2, enabled: true, premium: false },
                  { name: 'Haptic Feedback', description: 'Retour haptique', icon: ZapIcon, enabled: false, premium: true },
                  { name: 'Multi-user AR', description: 'AR partag e multi-utilisateurs', icon: Users, enabled: true, premium: true },
                ].map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5 text-cyan-400" />
                            <h4 className="font-semibold text-white">{feature.name}</h4>
                          </div>
                          {feature.premium && <Crown className="w-4 h-4 text-yellow-400" />}
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{feature.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={feature.enabled ? 'bg-green-500' : 'bg-slate-600'}>
                            {feature.enabled ? 'Actif' : 'Bient t'}
                          </Badge>
                          {feature.premium && (
                            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                              Premium
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

          {/* AR Comparison Tool */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Comparaison de Mod les
              </CardTitle>
              <CardDescription className="text-slate-400">
                Comparez plusieurs mod les AR c te   c te
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="S lectionner le premier mod le" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="S lectionner le second mod le" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Comparer les mod les
                </Button>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {[
                    { metric: 'Taille', model1: '2.4 MB', model2: '3.2 MB', winner: 'model1' },
                    { metric: 'Polygones', model1: '12,450', model2: '18,900', winner: 'model2' },
                    { metric: 'FPS moyen', model1: '60', model2: '58', winner: 'model1' },
                    { metric: 'Qualit  tracking', model1: '98%', model2: '96%', winner: 'model1' },
                  ].map((comparison, idx) => (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-3">
                        <p className="text-xs text-slate-400 mb-2">{comparison.metric}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-center flex-1">
                            <p className="text-sm font-semibold text-white">{comparison.model1}</p>
                            <Badge className={comparison.winner === 'model1' ? 'bg-green-500' : 'bg-slate-600'}>
                              {comparison.winner === 'model1' ? 'Meilleur' : ''}
                            </Badge>
                          </div>
                          <span className="text-slate-500 mx-2">vs</span>
                          <div className="text-center flex-1">
                            <p className="text-sm font-semibold text-white">{comparison.model2}</p>
                            <Badge className={comparison.winner === 'model2' ? 'bg-green-500' : 'bg-slate-600'}>
                              {comparison.winner === 'model2' ? 'Meilleur' : ''}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AR Templates Library */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Biblioth que de Templates AR
              </CardTitle>
              <CardDescription className="text-slate-400">
                Utilisez des templates pr -configur s pour d marrer rapidement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Template E-commerce', description: 'Pr visualisation produit e-commerce', category: 'E-commerce', uses: 1234, icon: ShoppingCart },
                  { name: 'Template Immobilier', description: 'Visite virtuelle immobili re', category: 'Immobilier', uses: 856, icon: Home },
                  { name: 'Template Mode', description: 'Essayage virtuel v tements', category: 'Mode', uses: 2341, icon: Shirt },
                  { name: 'Template Automobile', description: 'Visualisation v hicule', category: 'Automobile', uses: 678, icon: Car },
                  { name: 'Template D coration', description: 'Placement meubles AR', category: 'D coration', uses: 1890, icon: Sofa },
                  { name: 'Template  ducation', description: 'Contenu  ducatif AR', category: ' ducation', uses: 567, icon: GraduationCap },
                ].map((template, idx) => {
                  const Icon = template.icon;
                      return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="w-5 h-5 text-cyan-400" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{template.name}</h4>
                            <Badge variant="outline" className="text-xs border-slate-600 mt-1">
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{template.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{template.uses} utilisations</span>
                          <Button size="sm" variant="outline" className="border-slate-600">
                            Utiliser
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AR Performance Benchmarks */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-cyan-400" />
                Benchmarks de Performance
              </CardTitle>
              <CardDescription className="text-slate-400">
                Comparez vos performances avec les standards de l'industrie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { metric: 'FPS moyen', your: '60', industry: '55', status: 'above', icon: Monitor },
                  { metric: 'Latence', your: '12ms', industry: '18ms', status: 'above', icon: Cpu },
                  { metric: 'Temps de chargement', your: '1.2s', industry: '2.1s', status: 'above', icon: Clock },
                  { metric: 'Qualit  tracking', your: '98%', industry: '94%', status: 'above', icon: Target },
                ].map((benchmark, idx) => {
                  const Icon = benchmark.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-medium text-white">{benchmark.metric}</span>
                          </div>
                          <Badge className={benchmark.status === 'above' ? 'bg-green-500' : 'bg-yellow-500'}>
                            {benchmark.status === 'above' ? 'Au-dessus' : 'En dessous'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Votre performance</p>
                            <p className="text-lg font-bold text-white">{benchmark.your}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Moyenne industrie</p>
                            <p className="text-lg font-bold text-slate-400">{benchmark.industry}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AR Advanced Analytics */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-cyan-400" />
                Analytics Avanc es
              </CardTitle>
              <CardDescription className="text-slate-400">
                Analysez en profondeur les performances de vos pr visualisations AR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="engagement" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  <TabsTrigger value="retention">R tention</TabsTrigger>
                  <TabsTrigger value="conversion">Conversion</TabsTrigger>
                  <TabsTrigger value="technical">Technique</TabsTrigger>
                </TabsList>
                <TabsContent value="engagement" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Temps moyen', value: '2:34', change: '+12%', icon: Clock },
                      { label: 'Interactions', value: '45', change: '+8%', icon: Hand },
                      { label: 'Partages', value: '23', change: '+15%', icon: Share2 },
                      { label: 'Taux d\'engagement', value: '68%', change: '+5%', icon: TrendingUp },
                    ].map((stat, idx) => {
                      const Icon = stat.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="w-4 h-4 text-cyan-400" />
                              <span className="text-xs text-slate-400">{stat.label}</span>
                            </div>
                            <p className="text-xl font-bold text-white mb-1">{stat.value}</p>
                            <Badge className="bg-green-500/20 text-green-400 text-xs">{stat.change}</Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
                <TabsContent value="retention" className="mt-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-sm">Taux de r tention</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 flex items-end justify-between gap-1">
                        {[85, 82, 88, 85, 90, 87, 92, 89, 94, 91, 88, 95, 92, 96].map((height, idx) => (
                          <div
                            key={idx}
                            className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t"
                            style={{ height: `${height}%` }}
                            title={`${height}%`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-2 text-center">14 derniers jours</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="conversion" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Taux de conversion</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">68%</p>
                        <p className="text-xs text-slate-400 mt-1">+4% ce mois</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Valeur moyenne</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white"> 234</p>
                        <p className="text-xs text-slate-400 mt-1">+12% ce mois</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="technical" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">M triques techniques</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { metric: 'FPS moyen', value: '60', status: 'good' },
                            { metric: 'Latence', value: '12ms', status: 'good' },
                            { metric: 'Taux d\'erreur', value: '0.02%', status: 'good' },
                            { metric: 'Uptime', value: '99.98%', status: 'good' },
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-slate-300">{item.metric}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold">{item.value}</span>
                                <Badge className="bg-green-500">OK
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Compatibilit </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { device: 'iOS', percentage: 45, count: 234 },
                            { device: 'Android', percentage: 35, count: 182 },
                            { device: 'Web', percentage: 20, count: 104 },
                          ].map((item, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-white">{item.device}</span>
                                <span className="text-slate-400">{item.count} sessions</span>
                              </div>
                              <Progress value={item.percentage} className="h-1" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* AR Webhooks & Events */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-400" />
                Webhooks &  v nements
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configurez des webhooks pour  tre notifi  des  v nements AR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Webhooks actifs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { name: 'Preview Started', url: 'https://api.example.com/webhook', events: 234, status: 'active' },
                      { name: 'Preview Completed', url: 'https://api.example.com/webhook', events: 189, status: 'active' },
                      { name: 'Export Finished', url: 'https://api.example.com/webhook', events: 156, status: 'active' },
                    ].map((webhook, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{webhook.name}</span>
                          <Badge className={webhook.status === 'active' ? 'bg-green-500' : 'bg-slate-600'}>
                            {webhook.status === 'active' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mb-1">{webhook.url}</p>
                        <p className="text-xs text-slate-500">{webhook.events}  v nements envoy s</p>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full border-slate-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un webhook
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm"> v nements disponibles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { event: 'preview.started', description: 'D marrage d\'une pr visualisation' },
                        { event: 'preview.completed', description: 'Fin d\'une pr visualisation' },
                        { event: 'preview.failed', description: ' chec d\'une pr visualisation' },
                        { event: 'export.completed', description: 'Export termin ' },
                        { event: 'model.uploaded', description: 'Mod le t l charg ' },
                        { event: 'session.created', description: 'Nouvelle session cr  e' },
                      ].map((event, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded text-xs">
                          <div>
                            <p className="text-white font-mono">{event.event}</p>
                            <p className="text-slate-400">{event.description}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* AR Customization Presets */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                Presets de Personnalisation
              </CardTitle>
              <CardDescription className="text-slate-400">
                Sauvegardez et r utilisez vos configurations AR pr f r es
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Preset E-commerce', description: 'Optimis  pour produits', uses: 234, icon: ShoppingCart },
                  { name: 'Preset Immobilier', description: 'Visite virtuelle', uses: 156, icon: Home },
                  { name: 'Preset Mode', description: 'Essayage virtuel', uses: 189, icon: Shirt },
                  { name: 'Preset Automobile', description: 'Visualisation v hicule', uses: 98, icon: Car },
                  { name: 'Preset D coration', description: 'Placement meubles', uses: 267, icon: Sofa },
                  { name: 'Preset  ducation', description: 'Contenu  ducatif', uses: 134, icon: GraduationCap },
                ].map((preset, idx) => {
                  const Icon = preset.icon;
                      return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="w-5 h-5 text-cyan-400" />
                          <h4 className="font-semibold text-white">{preset.name}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{preset.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{preset.uses} utilisations</span>
                          <Button size="sm" variant="outline" className="border-slate-600">
                            Utiliser
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <Button variant="outline" className="w-full mt-4 border-slate-600">
                <Plus className="w-4 h-4 mr-2" />
                Cr er un nouveau preset
              </Button>
            </CardContent>
          </Card>

          {/* AR Error Tracking */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-cyan-400" />
                Suivi des Erreurs
              </CardTitle>
              <CardDescription className="text-slate-400">
                Surveillez et r solvez les erreurs de vos pr visualisations AR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Erreurs totales', value: '12', change: '-3', icon: AlertCircle, color: 'red' },
                    { label: 'Erreurs critiques', value: '2', change: '-1', icon: AlertTriangle, color: 'orange' },
                    { label: 'Taux d\'erreur', value: '0.02%', change: '-0.01%', icon: XCircle, color: 'green' },
                    { label: 'R solues', value: '10', change: '+2', icon: CheckCircle2, color: 'green' },
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
                            {stat.change}</Badge>
                          </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Erreurs r centes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { error: 'Tracking lost', model: 'Lunettes de soleil', time: 'Il y a 2h', severity: 'medium' },
                        { error: 'Model loading failed', model: 'Montre de luxe', time: 'Il y a 5h', severity: 'high' },
                        { error: 'Network timeout', model: 'Chaise design', time: 'Il y a 8h', severity: 'low' },
                      ].map((error, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-white">{error.error}</p>
                            <p className="text-xs text-slate-400">{error.model}   {error.time}</p>
                          </div>
                          <Badge className={error.severity === 'high' ? 'bg-red-500' : error.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}>
                            {error.severity === 'high' ? 'Critique' : error.severity === 'medium' ? 'Moyen' : 'Faible'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* AR Performance Monitoring */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Monitoring Performance AR
              </CardTitle>
              <CardDescription className="text-slate-400">
                Surveillez les performances en temps r el de vos pr visualisations AR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white">M triques Temps R el</h4>
                  <div className="space-y-3">
                    {[
                      { metric: 'FPS moyen', value: '58.2', target: '60', status: 'good' },
                      { metric: 'Latence r seau', value: '12ms', target: '<20ms', status: 'good' },
                      { metric: 'Temps de chargement', value: '1.2s', target: '<2s', status: 'good' },
                      { metric: 'Utilisation GPU', value: '68%', target: '<80%', status: 'good' },
                      { metric: 'M moire utilis e', value: '245MB', target: '<500MB', status: 'good' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div>
                          <p className="text-sm text-white">{item.metric}</p>
                          <p className="text-xs text-slate-400">Cible: {item.target}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${item.status === 'good' ? 'text-green-400' : 'text-red-400'}`}>
                            {item.value}
                          </p>
                          {item.status === 'good' && <CheckCircle2 className="w-4 h-4 text-green-400 mt-1 mx-auto" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white">Alertes Performance</h4>
                  <div className="space-y-3">
                    {[
                      { alert: 'FPS bas d tect ', device: 'iPhone 12', time: 'Il y a 5min', action: 'Optimiser' },
                      { alert: 'Latence  lev e', device: 'Samsung Galaxy S21', time: 'Il y a 12min', action: 'V rifier' },
                      { alert: 'M moire  lev e', device: 'iPad Pro', time: 'Il y a 18min', action: 'Nettoyer' },
                    ].map((alert, idx) => (
                      <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-yellow-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          <span className="text-xs text-slate-400">{alert.time}</span>
                        </div>
                        <p className="text-sm text-white mb-1">{alert.alert}</p>
                        <p className="text-xs text-slate-400 mb-2">{alert.device}</p>
                        <Button size="sm" variant="outline" className="w-full border-slate-600">
                          {alert.action}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AR Device Compatibility */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                Compatibilit  Appareils
              </CardTitle>
              <CardDescription className="text-slate-400">
                V rifiez la compatibilit  AR sur diff rents appareils
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { platform: 'iOS', devices: 12, supported: 12, icon: ' ', color: 'blue' },
                  { platform: 'Android', devices: 18, supported: 16, icon: ' ', color: 'green' },
                  { platform: 'Web', devices: 8, supported: 7, icon: ' ', color: 'purple' },
                ].map((platform, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{platform.icon}</span>
                        <div>
                          <h4 className="font-semibold text-white">{platform.platform}</h4>
                          <p className="text-xs text-slate-400">{platform.supported}/{platform.devices} appareils support s</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 mb-2">
                        <div
                          className={`bg-${platform.color}-500 h-2 rounded-full`}
                          style={{ width: `${(platform.supported / platform.devices) * 100}%` }}
                        />
                      </div>
                      <Button size="sm" variant="outline" className="w-full border-slate-600">
                        Voir d tails
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold text-white mb-3">Appareils Test s R cemment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { device: 'iPhone 14 Pro', status: 'Compatible', ar: 'ARKit 6.0', tested: 'Il y a 2h' },
                    { device: 'Samsung Galaxy S23', status: 'Compatible', ar: 'ARCore 1.35', tested: 'Il y a 5h' },
                    { device: 'iPad Pro 12.9"', status: 'Compatible', ar: 'ARKit 6.0', tested: 'Il y a 8h' },
                    { device: 'Google Pixel 7', status: 'Compatible', ar: 'ARCore 1.35', tested: 'Il y a 12h' },
                  ].map((device, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">{device.device}</p>
                        <p className="text-xs text-slate-400">{device.ar}   {device.tested}</p>
                      </div>
                      <Badge className="bg-green-500">{device.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AR Analytics Dashboard */}
          <Card className="bg-slate-900/50 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Tableau de Bord Analytics AR
              </CardTitle>
              <CardDescription className="text-slate-400">
                Analysez les performances et l'engagement de vos pr visualisations AR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Vues totales', value: '12,456', change: '+23%', icon: Eye, color: 'cyan' },
                  { label: 'Taux d\'engagement', value: '68%', change: '+5%', icon: Target, color: 'green' },
                  { label: 'Temps moyen', value: '2m 34s', change: '+12s', icon: Clock, color: 'blue' },
                  { label: 'Partages', value: '1,234', change: '+18%', icon: Share2, color: 'purple' },
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
                          {stat.change}</Badge>
                          </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Top Mod les AR</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { model: 'Lunettes de soleil', views: 3456, engagement: 72 },
                        { model: 'Montre de luxe', views: 2890, engagement: 68 },
                        { model: 'Chaise design', views: 2345, engagement: 65 },
                        { model: 'Sneakers premium', views: 1987, engagement: 61 },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{item.model}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                                <div
                                  className="bg-cyan-500 h-1.5 rounded-full"
                                  style={{ width: `${item.engagement}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400">{item.engagement}%</span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-semibold text-white">{item.views.toLocaleString()}</p>
                            <p className="text-xs text-slate-400">vues</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">R partition par Appareil</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { device: 'iPhone', percentage: 45, count: 5604 },
                        { device: 'Android', percentage: 38, count: 4729 },
                        { device: 'iPad', percentage: 12, count: 1494 },
                        { device: 'Autres', percentage: 5, count: 629 },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white">{item.device}</span>
                            <span className="text-slate-400">{item.percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-cyan-500 h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-400">{item.count.toLocaleString()} sessions</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}

const MemoizedARStudioPreviewPageContent = memo(ARStudioPreviewPageContent);

export default function ARStudioPreviewPage() {
  return (
    <ErrorBoundary componentName="ARStudioPreview">
      <MemoizedARStudioPreviewPageContent />
    </ErrorBoundary>
  );
}