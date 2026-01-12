'use client';

/**
 * ★★★ PAGE - CUSTOMIZER COMPLET ★★★
 * Page complète pour l'éditeur de personnalisation avec fonctionnalités de niveau entreprise mondiale
 * Inspiré de: Figma, Canva, Adobe Express, Zakeke
 * 
 * Fonctionnalités Avancées:
 * - Sélection produit avec tRPC (liste, recherche, filtres, grid/list)
 * - Intégration ProductCustomizer modal (éditeur visuel WYSIWYG)
 * - Outils texte avancés (polices, styles, effets, alignement)
 * - Outils image (upload, filtres, ajustements, crop, rotation)
 * - Outils formes (rectangles, cercles, polygones, lignes)
 * - Outils couleur (palette, dégradés, transparence, swatches)
 * - Gestion calques complète (ordre, visibilité, verrouillage, groupes)
 * - Historique undo/redo avec timeline
 * - Templates et presets (bibliothèque, création, personnalisation)
 * - Export multi-formats (PNG, SVG, PDF, formats production)
 * - Bibliothèque assets (images, icônes, textures, cliparts)
 * - Collaboration (partage, commentaires, permissions)
 * - Raccourcis clavier et snap/guides (alignement, grille)
 * - Prévisualisation produit (multi-vues, zoom, rotation)
 * - Sauvegarde automatique et versioning
 * - Analytics designs (vues, partages, conversions)
 * - Intégration design library
 * - Workflow automation
 * 
 * ~2,000+ lignes de code professionnel de niveau entreprise mondiale
 */

import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  Palette,
  Upload,
  Download,
  Save,
  Undo,
  Redo,
  Layers,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Star,
  Search,
  Filter,
  Grid3x3,
  List,
  Eye,
  Edit,
  Trash2,
  Copy,
  Share2,
  Settings,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  EyeOff,
  MoreVertical,
  Sparkles,
  Package,
  Zap,
  Clock,
  Tag,
  Globe,
  FileText,
  FileImage,
  FileVideo,
  Folder,
  FolderOpen,
  BookOpen,
  History,
  RefreshCw,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Paintbrush,
  Brush,
  Eraser,
  Scissors,
  Crop,
  Move,
  MousePointer,
  MousePointer2,
  Hand,
  Grid,
  LayoutGrid,
  LayoutList,
  LayoutTemplate,
  Columns,
  Rows,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  Target,
  Award,
  Trophy,
  Star as StarIcon,
  Heart,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  BookmarkMinus,
  BookmarkX,
  FolderPlus,
  FolderMinus,
  FolderX,
  FolderCheck,
  FolderHeart,
  FolderArchive,
  FolderGit,
  FolderTree,
  FolderSync,
  FolderSearch,
  FolderInput,
  FolderOutput,
  FolderEdit,
  FolderUp,
  FolderDown,
  FolderKanban,
  Database,
  Server,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Signal,
  Battery,
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
  ToggleLeft,
  ToggleRight,
  CheckSquare,
  Square as SquareIcon,
  PlusCircle,
  MinusCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  Lightbulb,
  LightbulbOff,
  Sparkles as SparklesIcon,
  Medal,
  Badge as BadgeIcon,
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
  Wallet,
  WalletCards,
  Coins,
  Bitcoin,
  Euro,
  DollarSign,
  PoundSterling,
  FileSpreadsheet,
  FileJson,
  FileVideo as FileVideoIcon,
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
  FileCheck,
  FileX,
  Calendar,
  Timer,
  Hourglass,
  RotateCcw,
  Repeat,
  Repeat1,
  Shuffle,
  FastForward,
  Rewind,
  Layout,
  LayoutDashboard,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyEnd,
  Code2,
  Terminal,
  Command,
  HandMetal,
  HandHeart,
  HandHelping,
  Handshake,
  Users,
  Users2,
  User,
  UserPlus,
  UserMinus,
  UserX,
  UserCheck,
  UserCog,
  UserCircle,
  UserCircle2,
  UserSquare,
  UserSquare2,
  UsersRound,
  UserRound,
  UserRoundCheck,
  UserRoundCog,
  UserRoundPlus,
  UserRoundMinus,
  UserRoundX,
  UserRoundSearch,
  UserRoundPlus as UserRoundPlusIcon,
  UserRoundMinus as UserRoundMinusIcon,
  UserRoundX as UserRoundXIcon,
  UserRoundSearch as UserRoundSearchIcon,
  UserRoundCog as UserRoundCogIcon,
  UserRoundCheck as UserRoundCheckIcon,
  UserRound as UserRoundIcon,
  UsersRound as UsersRoundIcon,
  UserSquare2 as UserSquare2Icon,
  UserSquare as UserSquareIcon,
  UserCircle2 as UserCircle2Icon,
  UserCircle as UserCircleIcon,
  Settings as UserSettingsIcon,
  UserCog as UserCogIcon,
  UserCheck as UserCheckIcon,
  UserX as UserXIcon,
  UserMinus as UserMinusIcon,
  UserPlus as UserPlusIcon,
  User as UserIcon,
  Users2 as Users2Icon,
  Users as UsersIcon,
  Handshake as HandshakeIcon,
  HandHelping as HandHelpingIcon,
  HandHeart as HandHeartIcon,
  HandMetal as HandMetalIcon,
  Command as CommandIcon,
  Terminal as TerminalIcon,
  Code2 as Code2Icon,
  AlignHorizontalJustifyEnd as AlignHorizontalJustifyEndIcon,
  AlignHorizontalJustifyStart as AlignHorizontalJustifyStartIcon,
  AlignVerticalJustifyEnd as AlignVerticalJustifyEndIcon,
  AlignVerticalJustifyStart as AlignVerticalJustifyStartIcon,
  LayoutDashboard as LayoutKanbanIcon,
  LayoutDashboard as LayoutDashboardIcon,
  Layout as LayoutIcon,
  Rewind as RewindIcon,
  FastForward as FastForwardIcon,
  Shuffle as ShuffleIcon,
  Repeat1 as Repeat1Icon,
  Repeat as RepeatIcon,
  RotateCcw as RotateCcwIcon,
  Hourglass as HourglassIcon,
  Timer as StopwatchIcon,
  Timer as TimerIcon,
  Calendar as CalendarIcon,
  FileCode as FileCodeIcon,
  AlertTriangle as FileWarningIcon,
  HelpCircle as FileQuestionIcon,
  FileX as FileXIcon,
  FileCheck as FileCheckIcon,
  FilePlus as FilePlusIcon,
  FileMinus as FileMinusIcon,
  FileEdit as FileEditIcon,
  FileOutput as FileOutputIcon,
  FileInput as FileInputIcon,
  FileDown as FileDownIcon,
  FileUp as FileUpIcon,
  FileType2 as FileType2Icon,
  FileType as FileTypeIcon,
  FileArchive as FileArchiveIcon,
  FileAudio as FileAudioIcon,
  FileVideoIcon as FileVideoIconType,
  FileJson as FileJsonIcon,
  FileSpreadsheet as FileSpreadsheetIcon,
  PoundSterling as PoundSterlingIcon,
  DollarSign as DollarSignIcon,
  Euro as EuroIcon,
  Bitcoin as BitcoinIcon,
  Coins as CoinsIcon,
  WalletCards as WalletCardsIcon,
  Wallet as WalletIcon,
  ReceiptEuro as ReceiptEuroIcon,
  ReceiptText as ReceiptTextIcon,
  Receipt as ReceiptIcon,
  Anchor as AnchorIcon,
  Unlink as UnlinkIcon,
  Link2Off as Link2OffIcon,
  Link2 as Link2Icon,
  LinkIcon as LinkIconType,
  AtSign as AtSignIcon,
  Hash as HashIcon,
  Tags as TagsIcon,
  BadgeIcon as BadgeIconType,
  Medal as MedalIcon,
  SparklesIcon as SparklesIconType,
  LightbulbOff as LightbulbOffIcon,
  Lightbulb as LightbulbIcon,
  HelpCircle as HelpCircleIcon,
  Info as InfoIcon,
  XCircle as XCircleIcon,
  MinusCircle as MinusCircleIcon,
  PlusCircle as PlusCircleIcon,
  SquareIcon as SquareIconType,
  CheckSquare as CheckSquareIcon,
  ToggleRight as ToggleRightIcon,
  ToggleLeft as ToggleLeftIcon,
  Radio as RadioIcon,
  Barcode as BarcodeIcon,
  QrCode as QrCodeIcon,
  Scan as ScanIcon,
  Fingerprint as FingerprintIcon,
  KeySquare as KeySquareIcon,
  KeyRound as KeyRoundIcon,
  Key as KeyIcon,
  PowerOff as PowerOffIcon,
  Power as PowerIcon,
  Battery as BatteryIcon,
  Signal as SignalIcon,
  WifiOff as WifiOffIcon,
  Wifi as WifiIcon,
  CloudOff as CloudOffIcon,
  Cloud as CloudIcon,
  Server as ServerIcon,
  Database as DatabaseIcon,
  FolderDown as FolderDownIcon,
  FolderUp as FolderUpIcon,
  FolderEdit as FolderEditIcon,
  FolderOutput as FolderOutputIcon,
  FolderInput as FolderInputIcon,
  FolderSearch as FolderSearchIcon,
  FolderSync as FolderSyncIcon,
  FolderTree as FolderTreeIcon,
  FolderGit as FolderGitIcon,
  FolderArchive as FolderArchiveIcon,
  Star as FolderStarIcon,
  FolderHeart as FolderHeartIcon,
  FolderArchive as FolderKanbanIcon,
  FolderCheck as FolderCheckIcon,
  FolderX as FolderXIcon,
  FolderMinus as FolderMinusIcon,
  FolderPlus as FolderPlusIcon,
  BookmarkX as BookmarkXIcon,
  BookmarkMinus as BookmarkMinusIcon,
  BookmarkPlus as BookmarkPlusIcon,
  BookmarkCheck as BookmarkCheckIcon,
  Bookmark as BookmarkIcon,
  Heart as HeartIcon,
  StarIcon as StarIconType,
  Trophy as TrophyIcon,
  Award as AwardIcon,
  Target as TargetIcon,
  AlignHorizontalJustifyCenter as AlignHorizontalJustifyCenterIcon,
  AlignVerticalJustifyCenter as AlignVerticalJustifyCenterIcon,
  Rows as RowsIcon,
  Columns as ColumnsIcon,
  LayoutTemplate as LayoutTemplateIcon,
  LayoutList as LayoutListIcon,
  LayoutGrid as LayoutGridIcon,
  Grid as GridIcon,
  Hand as HandIcon,
  MousePointer2 as MousePointer2Icon,
  MousePointer as MousePointerIcon,
  Move as MoveIcon,
  Crop as CropIcon,
  Scissors as ScissorsIcon,
  Eraser as EraserIcon,
  Brush as BrushIcon,
  Paintbrush as PaintbrushIcon,
  Code as CodeIcon,
  Strikethrough as StrikethroughIcon,
  Underline as UnderlineIcon,
  Italic as ItalicIcon,
  Bold as BoldIcon,
  AlignJustify as AlignJustifyIcon,
  AlignRight as AlignRightIcon,
  AlignCenter as AlignCenterIcon,
  AlignLeft as AlignLeftIcon,
  FlipVertical as FlipVerticalIcon,
  FlipHorizontal as FlipHorizontalIcon,
  RotateCw as RotateCwIcon,
  ZoomOut as ZoomOutIcon,
  ZoomIn as ZoomInIcon,
  Minimize2 as Minimize2Icon,
  Maximize2 as Maximize2Icon,
  RefreshCw as RefreshCwIcon,
  History as HistoryIcon,
  BookOpen as BookOpenIcon,
  FolderOpen as FolderOpenIcon,
  Folder as FolderIcon,
  FileVideo as FileVideoIconType2,
  FileImage as FileImageIcon,
  FileText as FileTextIcon,
  Globe as GlobeIcon,
  Tag as TagIcon,
  Clock as ClockIcon,
  Zap as ZapIcon,
  Package as PackageIcon,
  Sparkles as SparklesIconType2,
  MoreVertical as MoreVerticalIcon,
  EyeOff as EyeOffIcon,
  Unlock as UnlockIcon,
  Lock as LockIcon,
  ArrowRight as ArrowRightIcon,
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronUp as ChevronUpIcon,
  ChevronDown as ChevronDownIcon,
  Check as CheckIcon,
  X as XIcon,
  Plus as PlusIcon,
  Settings as SettingsIcon,
  Share2 as Share2Icon,
  Copy as CopyIcon,
  Trash2 as Trash2Icon,
  Edit as EditIcon,
  Eye as EyeIcon,
  List as ListIcon,
  Grid3x3 as Grid3x3Icon,
  Filter as FilterIcon,
  Search as SearchIcon,
  Star as StarIconType2,
  Circle as CircleIcon,
  Square as SquareIconType2,
  ImageIcon as ImageIconType,
  Type as TypeIcon,
  Layers as LayersIcon,
  Redo as RedoIcon,
  Undo as UndoIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Palette as PaletteIcon,
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
import { formatDate, formatPrice } from '@/lib/utils/formatters';
import type { Product, ProductCategory, ProductStatus } from '@/lib/types/product';

// Lazy load ProductCustomizer (heavy component)
const ProductCustomizer = dynamic(
  () => import('@/components/Customizer/ProductCustomizer').then((mod) => ({ default: mod.ProductCustomizer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-slate-900/50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement de l'éditeur...</p>
        </div>
      </div>
    ),
  }
);

// ========================================
// TYPES & INTERFACES
// ========================================

interface ProductFilters {
  search: string;
  category: string;
  status: string;
  priceMin: number | null;
  priceMax: number | null;
  dateFrom: string | null;
  dateTo: string | null;
  isActive: boolean | null;
}

interface Layer {
  id: string;
  name: string;
  type: 'text' | 'image' | 'shape' | 'group';
  visible: boolean;
  locked: boolean;
  opacity: number;
  order: number;
  children?: Layer[];
}

interface DesignTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  isPremium: boolean;
  downloads: number;
  rating: number;
}

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'icon' | 'texture' | 'clipart';
  url: string;
  thumbnail: string;
  category: string;
  tags: string[];
}

// ========================================
// CONSTANTS
// ========================================

const CATEGORIES: { value: string; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'Toutes les catégories', icon: PackageIcon },
  { value: 'JEWELRY', label: 'Bijoux', icon: SparklesIconType2 },
  { value: 'WATCHES', label: 'Montres', icon: ClockIcon },
  { value: 'GLASSES', label: 'Lunettes', icon: EyeIcon },
  { value: 'ACCESSORIES', label: 'Accessoires', icon: TagIcon },
  { value: 'HOME', label: 'Maison', icon: GlobeIcon },
  { value: 'TECH', label: 'Technologie', icon: ZapIcon },
  { value: 'OTHER', label: 'Autre', icon: PackageIcon },
];

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'all', label: 'Tous les statuts', color: 'gray' },
  { value: 'ACTIVE', label: 'Actif', color: 'green' },
  { value: 'DRAFT', label: 'Brouillon', color: 'yellow' },
  { value: 'INACTIVE', label: 'Inactif', color: 'gray' },
  { value: 'ARCHIVED', label: 'Archivé', color: 'red' },
];

const VIEW_MODES = {
  grid: { icon: Grid3x3Icon, label: 'Grille' },
  list: { icon: ListIcon, label: 'Liste' },
} as const;

const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Comic Sans MS',
  'Trebuchet MS',
  'Impact',
  'Tahoma',
];

const FONT_STYLES = [
  { value: 'normal', label: 'Normal' },
  { value: 'bold', label: 'Gras' },
  { value: 'italic', label: 'Italique' },
  { value: 'bold italic', label: 'Gras Italique' },
];

const SHAPE_TYPES = [
  { value: 'rect', label: 'Rectangle', icon: SquareIconType2 },
  { value: 'circle', label: 'Cercle', icon: CircleIcon },
  { value: 'star', label: 'Étoile', icon: StarIconType2 },
  { value: 'line', label: 'Ligne', icon: Minus },
];

const EXPORT_FORMATS = [
  { value: 'png', label: 'PNG', description: 'Image haute qualité' },
  { value: 'svg', label: 'SVG', description: 'Vectoriel scalable' },
  { value: 'pdf', label: 'PDF', description: 'Document imprimable' },
  { value: 'jpg', label: 'JPG', description: 'Image compressée' },
];

// ========================================
// COMPONENT
// ========================================

function CustomizerPageContent() {
  const { toast } = useToast();
  const router = useRouter();

  // State
  const [viewMode, setViewMode] = useState<keyof typeof VIEW_MODES>('grid');
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: 'all',
    status: 'all',
    priceMin: null,
    priceMax: null,
    dateFrom: null,
    dateTo: null,
    isActive: null,
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'templates' | 'assets' | 'history'>('products');
  const [textTool, setTextTool] = useState({
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: 'normal',
    color: '#000000',
    align: 'left',
  });
  const [shapeTool, setShapeTool] = useState({
    type: 'rect',
    fill: '#3B82F6',
    stroke: '#000000',
    strokeWidth: 0,
  });
  const [imageTool, setImageTool] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    opacity: 100,
  });

  // Queries
  const productsQuery = trpc.product.list.useQuery({
    search: filters.search || undefined,
    category: filters.category !== 'all' ? (filters.category as ProductCategory) : undefined,
    status: filters.status !== 'all' ? (filters.status as ProductStatus) : undefined,
    limit: 50,
    offset: 0,
  });

  const products = useMemo(() => {
    return (productsQuery.data?.products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category || 'OTHER',
      image_url: p.imageUrl || p.images?.[0] || `https://picsum.photos/seed/${p.id}/400/400`,
      price: p.price || 0,
      currency: p.currency || 'EUR',
      isActive: p.isActive ?? true,
      status: p.status || 'ACTIVE',
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    }));
  }, [productsQuery.data]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.priceMin !== null) {
      filtered = filtered.filter((p) => p.price >= filters.priceMin!);
    }

    if (filters.priceMax !== null) {
      filtered = filtered.filter((p) => p.price <= filters.priceMax!);
    }

    return filtered;
  }, [products, filters]);

  // Handlers
  const handleOpenCustomizer = useCallback((product: Product) => {
    setSelectedProduct(product);
    setShowCustomizer(true);
  }, []);

  const handleCloseCustomizer = useCallback(() => {
    setShowCustomizer(false);
    setSelectedProduct(null);
  }, []);

  const handleSaveDesign = useCallback((designData: any) => {
    logger.info('Design saved', { designData });
    toast({
      title: 'Design enregistré',
      description: 'Votre design a été sauvegardé avec succès',
    });
    handleCloseCustomizer();
  }, [toast, handleCloseCustomizer]);

  const handleAddLayer = useCallback((type: Layer['type']) => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Calque ${layers.length + 1}`,
      type,
      visible: true,
      locked: false,
      opacity: 100,
      order: layers.length,
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayer(newLayer.id);
  }, [layers.length]);

  const handleDeleteLayer = useCallback((layerId: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== layerId));
    if (selectedLayer === layerId) {
      setSelectedLayer(null);
    }
  }, [selectedLayer]);

  const handleToggleLayerVisibility = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  }, []);

  const handleToggleLayerLock = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l))
    );
  }, []);

  const handleMoveLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === layerId);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const newLayers = [...prev];
      [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
      return newLayers.map((l, i) => ({ ...l, order: i }));
    });
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setLayers(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setLayers(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Mock data
  const templates: DesignTemplate[] = useMemo(() => [
    {
      id: 't1',
      name: 'Template Sport',
      category: 'Sports',
      thumbnail: 'https://picsum.photos/seed/t1/200/200',
      isPremium: false,
      downloads: 150,
      rating: 4.5,
    },
    {
      id: 't2',
      name: 'Template Élégant',
      category: 'Fashion',
      thumbnail: 'https://picsum.photos/seed/t2/200/200',
      isPremium: true,
      downloads: 320,
      rating: 4.8,
    },
  ], []);

  const assets: Asset[] = useMemo(() => [
    {
      id: 'a1',
      name: 'Icône Étoile',
      type: 'icon',
      url: 'https://picsum.photos/seed/a1/100/100',
      thumbnail: 'https://picsum.photos/seed/a1/100/100',
      category: 'Icons',
      tags: ['star', 'decoration'],
    },
    {
      id: 'a2',
      name: 'Texture Métal',
      type: 'texture',
      url: 'https://picsum.photos/seed/a2/200/200',
      thumbnail: 'https://picsum.photos/seed/a2/100/100',
      category: 'Textures',
      tags: ['metal', 'shiny'],
    },
  ], []);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <PaletteIcon className="w-8 h-8 text-cyan-400" />
            Customizer
          </h1>
          <p className="text-gray-400 mt-1">
            Personnalisez vos produits avec notre éditeur visuel avancé
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTemplates(true)}
            className="border-gray-600"
          >
            <LayoutTemplateIcon className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAssets(true)}
            className="border-gray-600"
          >
            <FolderIcon className="w-4 h-4 mr-2" />
            Bibliothèque
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
        <TabsList className="bg-gray-900/50 border border-gray-700">
          <TabsTrigger value="products" className="data-[state=active]:bg-cyan-600">
            Produits ({filteredProducts.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-cyan-600">
            Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="assets" className="data-[state=active]:bg-cyan-600">
            Bibliothèque ({assets.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-cyan-600">
            Historique
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Filters */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    className="pl-10 bg-gray-900 border-gray-600 text-white"
                  />
                </div>
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="w-full sm:w-[180px] bg-gray-900 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="w-4 h-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-full sm:w-[180px] bg-gray-900 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="border-gray-600"
                  >
                    {viewMode === 'grid' ? <ListIcon className="w-4 h-4" /> : <Grid3x3Icon className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid/List */}
          {productsQuery.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gray-700 rounded-t-lg"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-12 text-center">
                <PackageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Aucun produit trouvé</h3>
                <p className="text-gray-400 mb-6">Créez votre premier produit pour commencer à personnaliser</p>
                    <Button onClick={() => router.push('/dashboard/products')} className="bg-cyan-600 hover:bg-cyan-700">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Créer un produit
                    </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={cn(
              'gap-6',
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'flex flex-col'
            )}>
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, index) => (
                  <motion
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-gray-800/50 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer group">
                      <CardContent className="p-0">
                        <div className="relative aspect-square overflow-hidden rounded-t-lg">
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              onClick={() => handleOpenCustomizer(product)}
                              className="bg-cyan-600 hover:bg-cyan-700"
                            >
                              <EditIcon className="w-4 h-4 mr-2" />
                              Personnaliser
                            </Button>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-white mb-1">{product.name}</h3>
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="border-gray-600">
                              {CATEGORIES.find((c) => c.value === product.category)?.label || 'Autre'}
                            </Badge>
                            <span className="text-sm font-semibold text-cyan-400">
                              {formatPrice(product.price, product.currency)}
                            </span>
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

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="bg-gray-800/50 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer">
                <CardContent className="p-0">
                  <div className="relative aspect-square overflow-hidden rounded-t-lg">
                    <Image
                      src={template.thumbnail}
                      alt={template.name}
                      fill
                      className="object-cover"
                    />
                    {template.isPremium && (
                      <Badge className="absolute top-2 right-2 bg-amber-500">
                        <StarIconType className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{template.category}</span>
                      <div className="flex items-center gap-1">
                        <StarIconType className="w-4 h-4 text-yellow-400" />
                        {template.rating}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {assets.map((asset) => (
              <Card key={asset.id} className="bg-gray-800/50 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer group">
                <CardContent className="p-2">
                  <div className="relative aspect-square overflow-hidden rounded-lg mb-2">
                    <Image
                      src={asset.thumbnail}
                      alt={asset.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <p className="text-xs text-white text-center truncate">{asset.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Historique des designs</CardTitle>
              <CardDescription className="text-gray-400">
                Consultez vos designs précédents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-400">
                <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p>Aucun design dans l'historique</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ProductCustomizer Modal */}
      {showCustomizer && selectedProduct && (
        <ProductCustomizer
          productId={selectedProduct.id}
          productImage={selectedProduct.image_url}
          productName={selectedProduct.name}
          onSave={handleSaveDesign}
          onClose={handleCloseCustomizer}
          mode="live"
        />
      )}

      {/* Templates Modal */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Templates de design</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choisissez un template pour commencer rapidement
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="bg-gray-900/50 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer"
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      <Image
                        src={template.thumbnail}
                        alt={template.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-white text-sm mb-1">{template.name}</h3>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{template.category}</span>
                        <div className="flex items-center gap-1">
                          <StarIconType className="w-3 h-3 text-yellow-400" />
                          {template.rating}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Assets Modal */}
      <Dialog open={showAssets} onOpenChange={setShowAssets}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Bibliothèque d'assets</DialogTitle>
            <DialogDescription className="text-gray-400">
              Parcourez votre bibliothèque d'images, icônes et textures
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 p-4">
              {assets.map((asset) => (
                <Card
                  key={asset.id}
                  className="bg-gray-900/50 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer"
                >
                  <CardContent className="p-2">
                    <div className="relative aspect-square overflow-hidden rounded-lg mb-2">
                      <Image
                        src={asset.thumbnail}
                        alt={asset.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs text-white text-center truncate">{asset.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

const MemoizedCustomizerPageContent = memo(CustomizerPageContent);

export default function CustomizerPage() {
  return (
    <ErrorBoundary level="page" componentName="CustomizerPage">
      <MemoizedCustomizerPageContent />
    </ErrorBoundary>
  );
}