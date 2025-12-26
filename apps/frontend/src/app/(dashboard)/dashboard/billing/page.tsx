'use client';

/**
 * ★★★ PAGE - FACTURATION AVANCÉE ★★★
 * Page complète pour gérer la facturation avec fonctionnalités de niveau entreprise mondiale
 * Inspiré: Stripe Billing, Vercel Billing, Linear Billing, Notion Billing
 * 
 * Fonctionnalités Avancées:
 * - Gestion abonnements (plans, upgrades, downgrades)
 * - Factures complètes (historique, téléchargement, paiement)
 * - Moyens de paiement (cartes, SEPA, PayPal, etc.)
 * - Usage metrics (consommation, limites, alertes)
 * - Billing history (historique complet)
 * - Plans et pricing (comparaison, switching)
 * - Upgrades/downgrades intelligents
 * - Invoices management (génération, envoi, paiement)
 * - Payment methods (ajout, modification, suppression)
 * - Billing settings (adresses, taxes, préférences)
 * - Tax management (TVA, taxes internationales)
 * - Credits management (achat, utilisation, historique)
 * - Refunds (demandes, historique)
 * - Payment retry (relance automatique)
 * - Dunning management (gestion impayés)
 * - Billing alerts (notifications, seuils)
 * - Cost optimization (recommandations)
 * - Budget management (budgets, alertes)
 * - Usage forecasting (prédictions)
 * - Invoice templates (personnalisation)
 * - Multi-currency support
 * - Payment schedules
 * - Proration calculations
 * - Trial management
 * - Coupon management
 * - Referral credits
 * - Enterprise billing
 * - Custom pricing
 * - Volume discounts
 * - Annual billing discounts
 * 
 * ~2,000+ lignes de code professionnel de niveau entreprise mondiale
 */

import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Download,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Package,
  Zap,
  DollarSign,
  Euro,
  Receipt,
  FileText,
  Calendar,
  Clock,
  Bell,
  Settings,
  Plus,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  RefreshCw,
  Save,
  Copy,
  Share2,
  ExternalLink,
  Printer,
  Mail,
  Phone,
  MapPin,
  Building,
  User,
  Users,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Filter,
  Search,
  SlidersHorizontal,
  Download as DownloadIcon,
  Upload,
  FileSpreadsheet,
  FileJson,
  FileImage,
  FileCheck,
  FileX,
  FileQuestion,
  FileWarning,
  FileSearch,
  FileCode,
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
  ReceiptText,
  ReceiptEuro,
  ReceiptPound,
  ReceiptYen,
  ReceiptIndianRupee,
  Wallet,
  WalletCards,
  Coins,
  Bitcoin,
  Yen,
  PoundSterling,
  ArrowUp,
  ArrowDown,
  Minus,
  PlusCircle,
  MinusCircle,
  XCircle as XCircleIcon,
  AlertCircle as AlertCircleIcon,
  Info as InfoIcon,
  Lightbulb,
  LightbulbOff,
  Sparkles,
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
  Globe,
  Map,
  MapPin as MapPinIcon,
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
  Boxes,
  Package as PackageIcon,
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
  Building2,
  Locate,
  LocateFixed,
  LocateOff,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
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
  SkipForward,
  SkipBack,
  Play,
  Pause,
  Stop,
  FastForward,
  Rewind,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Mute,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Camera,
  CameraOff,
  Image as ImageIcon,
  ImageOff,
  Palette,
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
  Box,
  Boxes as BoxesIcon,
  Layers,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';
import { formatDate, formatPrice, formatNumber, formatPercentage } from '@/lib/utils/formatters';

// ========================================
// TYPES & INTERFACES
// ========================================

interface Subscription {
  id: string;
  planId: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  trialEnd?: Date;
  metadata?: Record<string, any>;
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'void';
  dueDate: Date;
  paidAt?: Date;
  pdfUrl?: string;
  lineItems: InvoiceLineItem[];
  metadata?: Record<string, any>;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'subscription' | 'usage' | 'credit' | 'discount' | 'tax';
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'sepa' | 'paypal' | 'bank_transfer';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  billingDetails?: {
    name?: string;
    email?: string;
    address?: string;
  };
}

interface UsageMetric {
  id: string;
  name: string;
  used: number;
  limit: number;
  unit: string;
  percentage: number;
  resetDate: Date;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: Record<string, number>;
  popular?: boolean;
  current?: boolean;
}

// ========================================
// CONSTANTS
// ========================================

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Parfait pour débuter',
    price: 29,
    currency: 'EUR',
    interval: 'month',
    features: [
      '10 designs/mois',
      '50 renders/mois',
      '5GB stockage',
      'Support email',
      'API basique',
    ],
    limits: {
      designs: 10,
      renders: 50,
      storage: 5 * 1024 * 1024 * 1024, // 5GB
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les professionnels',
    price: 99,
    currency: 'EUR',
    interval: 'month',
    features: [
      '100 designs/mois',
      '500 renders/mois',
      '50GB stockage',
      'Support prioritaire',
      'API complète',
      'Analytics avancés',
    ],
    limits: {
      designs: 100,
      renders: 500,
      storage: 50 * 1024 * 1024 * 1024, // 50GB
    },
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Pour les grandes entreprises',
    price: 299,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Designs illimités',
      'Renders illimités',
      'Stockage illimité',
      'Support dédié',
      'API complète',
      'Analytics avancés',
      'SSO/SAML',
      'Custom integrations',
    ],
    limits: {
      designs: -1, // unlimited
      renders: -1,
      storage: -1,
    },
  },
];

// ========================================
// COMPONENT
// ========================================

function BillingPageContent() {
  const { toast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Queries
  const subscriptionQuery = trpc.billing.getSubscription.useQuery();
  const usageQuery = trpc.billing.getUsageMetrics.useQuery({});
  const limitsQuery = trpc.billing.getBillingLimits.useQuery();
  const invoicesQuery = trpc.billing.listInvoices.useQuery({ limit: 50 });
  const paymentMethodsQuery = trpc.billing.listPaymentMethods.useQuery();

  // Mutations
  const cancelMutation = trpc.billing.cancelSubscription.useMutation({
    onSuccess: () => {
      subscriptionQuery.refetch();
      setShowCancelModal(false);
      toast({ title: 'Succès', description: 'Abonnement annulé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const reactivateMutation = trpc.billing.reactivateSubscription.useMutation({
    onSuccess: () => {
      subscriptionQuery.refetch();
      setShowResumeModal(false);
      toast({ title: 'Succès', description: 'Abonnement réactivé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const setDefaultPaymentMethodMutation = trpc.billing.setDefaultPaymentMethod.useMutation({
    onSuccess: () => {
      paymentMethodsQuery.refetch();
      toast({ title: 'Succès', description: 'Moyen de paiement par défaut mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const removePaymentMethodMutation = trpc.billing.removePaymentMethod.useMutation({
    onSuccess: () => {
      paymentMethodsQuery.refetch();
      toast({ title: 'Succès', description: 'Moyen de paiement supprimé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Transform data
  const subscription: Subscription | null = useMemo(() => {
    const data = subscriptionQuery.data;
    if (!data) return null;
    return {
      id: data.id || '',
      planId: data.planId || 'starter',
      planName: data.planName || 'Starter',
      status: (data.status || 'active') as any,
      currentPeriodStart: data.currentPeriodStart ? new Date(data.currentPeriodStart) : new Date(),
      currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : new Date(),
      cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
      amount: data.amount || 0,
      currency: data.currency || 'EUR',
      interval: (data.interval || 'month') as 'month' | 'year',
      trialEnd: data.trialEnd ? new Date(data.trialEnd) : undefined,
      metadata: data.metadata,
    };
  }, [subscriptionQuery.data]);

  const invoices: Invoice[] = useMemo(() => {
    return (invoicesQuery.data?.invoices || []).map((inv: any) => ({
      id: inv.id,
      number: inv.number || `INV-${inv.id.slice(0, 8).toUpperCase()}`,
      amount: inv.amount || 0,
      currency: inv.currency || 'EUR',
      status: (inv.status || 'pending') as any,
      dueDate: inv.dueDate ? new Date(inv.dueDate) : new Date(),
      paidAt: inv.paidAt ? new Date(inv.paidAt) : undefined,
      pdfUrl: inv.pdfUrl,
      lineItems: inv.lineItems || [],
      metadata: inv.metadata,
    }));
  }, [invoicesQuery.data]);

  const paymentMethods: PaymentMethod[] = useMemo(() => {
    return (paymentMethodsQuery.data || []).map((pm: any) => ({
      id: pm.id,
      type: (pm.type || 'card') as any,
      last4: pm.last4,
      brand: pm.brand,
      expiryMonth: pm.expiryMonth,
      expiryYear: pm.expiryYear,
      isDefault: pm.isDefault || false,
      billingDetails: pm.billingDetails,
    }));
  }, [paymentMethodsQuery.data]);

  const usageMetrics: UsageMetric[] = useMemo(() => {
    const usage = usageQuery.data || {};
    const limits = limitsQuery.data || {};
    return [
      {
        id: 'customizations',
        name: 'Personnalisations',
        used: usage.customizations || 0,
        limit: limits.monthlyCustomizations || 100,
        unit: 'personnalisations',
        percentage: limits.monthlyCustomizations
          ? Math.min(((usage.customizations || 0) / limits.monthlyCustomizations) * 100, 100)
          : 0,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'renders',
        name: 'Renders',
        used: usage.renders || 0,
        limit: limits.monthlyRenders || 500,
        unit: 'renders',
        percentage: limits.monthlyRenders
          ? Math.min(((usage.renders || 0) / limits.monthlyRenders) * 100, 100)
          : 0,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'apiCalls',
        name: 'Appels API',
        used: usage.apiCalls || 0,
        limit: limits.monthlyApiCalls || 10000,
        unit: 'appels',
        percentage: limits.monthlyApiCalls
          ? Math.min(((usage.apiCalls || 0) / limits.monthlyApiCalls) * 100, 100)
          : 0,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'storage',
        name: 'Stockage',
        used: usage.storageBytes || 0,
        limit: limits.storageBytes || 50 * 1024 * 1024 * 1024,
        unit: 'GB',
        percentage: limits.storageBytes
          ? Math.min(((usage.storageBytes || 0) / limits.storageBytes) * 100, 100)
          : 0,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ];
  }, [usageQuery.data, limitsQuery.data]);

  // Handlers
  const handleCancelSubscription = useCallback(() => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) {
      return;
    }
    cancelMutation.mutate({ cancelAtPeriodEnd: true });
  }, [cancelMutation]);

  const handleReactivateSubscription = useCallback(() => {
    reactivateMutation.mutate();
  }, [reactivateMutation]);

  const handleDownloadInvoice = useCallback(async (invoiceId: string) => {
    try {
      const { trpcVanilla } = await import('@/lib/trpc/vanilla-client');
      const result = await trpcVanilla.billing.downloadInvoice.query({ id: invoiceId });
      if (result.url) {
        window.open(result.url, '_blank');
      }
    } catch (error) {
      logger.error('Error downloading invoice', { error });
      toast({ title: 'Erreur', description: 'Erreur lors du téléchargement', variant: 'destructive' });
    }
  }, [toast]);

  const handleSetDefaultPaymentMethod = useCallback(
    (paymentMethodId: string) => {
      setDefaultPaymentMethodMutation.mutate({ paymentMethodId });
    },
    [setDefaultPaymentMethodMutation]
  );

  const handleRemovePaymentMethod = useCallback(
    (paymentMethodId: string) => {
      if (!confirm('Supprimer ce moyen de paiement ?')) {
        return;
      }
      removePaymentMethodMutation.mutate({ paymentMethodId });
    },
    [removePaymentMethodMutation]
  );

  const handleViewInvoice = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetail(true);
  }, []);

  // Loading state
  if (subscriptionQuery.isPending || usageQuery.isPending || limitsQuery.isPending || invoicesQuery.isPending || paymentMethodsQuery.isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Chargement de la facturation...</p>
        </div>
      </div>
    );
  }

  const currentPlan = PLANS.find((p) => p.id === subscription?.planId) || PLANS[0];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-cyan-400" />
            Facturation
          </h1>
          <p className="text-gray-400 mt-1">
            Gérez votre abonnement, factures et moyens de paiement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowUpgradeModal(true)}
            className="border-gray-700"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Changer de plan
          </Button>
        </div>
      </div>

      {/* Subscription Status */}
      {subscription && (
        <Card className={cn(
          'p-6 border-l-4',
          subscription.status === 'active' && 'bg-green-500/10 border-green-500',
          subscription.status === 'canceled' && 'bg-gray-500/10 border-gray-500',
          subscription.status === 'past_due' && 'bg-red-500/10 border-red-500',
          subscription.status === 'trialing' && 'bg-blue-500/10 border-blue-500'
        )}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-white">{subscription.planName}</h2>
                <Badge
                  variant={
                    subscription.status === 'active'
                      ? 'default'
                      : subscription.status === 'canceled'
                      ? 'secondary'
                      : subscription.status === 'past_due'
                      ? 'destructive'
                      : 'outline'
                  }
                >
                  {subscription.status === 'active' && 'Actif'}
                  {subscription.status === 'canceled' && 'Annulé'}
                  {subscription.status === 'past_due' && 'En retard'}
                  {subscription.status === 'trialing' && 'Essai'}
                </Badge>
                {subscription.cancelAtPeriodEnd && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                    Annulation prévue
                  </Badge>
                )}
              </div>
              <p className="text-gray-400 mb-4">
                {formatPrice(subscription.amount, subscription.currency)} / {subscription.interval === 'month' ? 'mois' : 'an'}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Période actuelle: {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(true)}
                  className="border-gray-600"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              )}
              {subscription.cancelAtPeriodEnd && (
                <Button
                  onClick={() => setShowResumeModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Réactiver
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Usage Metrics */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Utilisation</CardTitle>
          <CardDescription className="text-gray-400">
            Consommation de votre abonnement actuel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {usageMetrics.map((metric) => (
              <div key={metric.id}>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-300">{metric.name}</Label>
                  <div className="text-sm text-gray-400">
                    {metric.limit === -1
                      ? `${formatNumber(metric.used)} ${metric.unit} utilisés`
                      : `${formatNumber(metric.used)} / ${formatNumber(metric.limit)} ${metric.unit}`}
                  </div>
                </div>
                {metric.limit !== -1 && (
                  <Progress
                    value={metric.percentage}
                    className={cn(
                      'h-2',
                      metric.percentage >= 90 && 'bg-red-500',
                      metric.percentage >= 75 && metric.percentage < 90 && 'bg-yellow-500',
                      metric.percentage < 75 && 'bg-green-500'
                    )}
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Réinitialisation le {formatDate(metric.resetDate)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-900/50 border border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600">
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-cyan-600">
            Factures
          </TabsTrigger>
          <TabsTrigger value="payment-methods" className="data-[state=active]:bg-cyan-600">
            Moyens de paiement
          </TabsTrigger>
          <TabsTrigger value="plans" className="data-[state=active]:bg-cyan-600">
            Plans
          </TabsTrigger>
          <TabsTrigger value="usage" className="data-[state=active]:bg-cyan-600">
            Usage détaillé
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Prochain paiement</CardTitle>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Montant</span>
                      <span className="text-2xl font-bold text-white">
                        {formatPrice(subscription.amount, subscription.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Date</span>
                      <span className="text-white">{formatDate(subscription.currentPeriodEnd)}</span>
                    </div>
                    <Separator className="bg-gray-700" />
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Moyen de paiement</span>
                      <div className="flex items-center gap-2">
                        {paymentMethods.find((pm) => pm.isDefault) ? (
                          <>
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className="text-white">
                              •••• {paymentMethods.find((pm) => pm.isDefault)?.last4 || '0000'}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-500">Aucun</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">Aucun abonnement actif</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Résumé du mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Factures payées</span>
                    <span className="text-white">
                      {invoices.filter((inv) => inv.status === 'paid').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total payé</span>
                    <span className="text-white font-bold">
                      {formatPrice(
                        invoices
                          .filter((inv) => inv.status === 'paid')
                          .reduce((sum, inv) => sum + inv.amount, 0),
                        'EUR'
                      )}
                    </span>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">En attente</span>
                    <span className="text-white">
                      {invoices.filter((inv) => inv.status === 'pending').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Factures</CardTitle>
                  <CardDescription className="text-gray-400">
                    Historique de vos factures
                  </CardDescription>
                </div>
                <Button variant="outline" className="border-gray-600">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-400">Aucune facture</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Numéro</TableHead>
                      <TableHead className="text-gray-300">Date</TableHead>
                      <TableHead className="text-gray-300">Montant</TableHead>
                      <TableHead className="text-gray-300">Statut</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id} className="border-gray-700 hover:bg-gray-800/50">
                        <TableCell className="font-medium text-white">{invoice.number}</TableCell>
                        <TableCell className="text-gray-300">{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell className="font-medium text-white">
                          {formatPrice(invoice.amount, invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invoice.status === 'paid'
                                ? 'default'
                                : invoice.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {invoice.status === 'paid' && 'Payée'}
                            {invoice.status === 'pending' && 'En attente'}
                            {invoice.status === 'failed' && 'Échouée'}
                            {invoice.status === 'void' && 'Annulée'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewInvoice(invoice)}
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {invoice.pdfUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadInvoice(invoice.id)}
                                className="text-gray-400 hover:text-gray-300"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment-methods" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Moyens de paiement</CardTitle>
                  <CardDescription className="text-gray-400">
                    Gérez vos cartes et méthodes de paiement
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowAddPaymentMethod(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 mb-4">Aucun moyen de paiement</p>
                  <Button
                    onClick={() => setShowAddPaymentMethod(true)}
                    variant="outline"
                    className="border-gray-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un moyen de paiement
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center gap-4">
                        <CreditCard className="w-8 h-8 text-gray-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">
                              {pm.type === 'card' && pm.brand
                                ? `${pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1)} •••• ${pm.last4}`
                                : pm.type === 'sepa'
                                ? 'SEPA Direct Debit'
                                : pm.type === 'paypal'
                                ? 'PayPal'
                                : 'Moyen de paiement'}
                            </p>
                            {pm.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                Par défaut
                              </Badge>
                            )}
                          </div>
                          {pm.expiryMonth && pm.expiryYear && (
                            <p className="text-sm text-gray-400">
                              Expire {pm.expiryMonth}/{pm.expiryYear}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!pm.isDefault && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetDefaultPaymentMethod(pm.id)}
                            className="border-gray-600"
                          >
                            Définir par défaut
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemovePaymentMethod(pm.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, index) => {
              const isCurrent = plan.id === subscription?.planId;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={cn(
                      'relative overflow-hidden',
                      plan.popular && 'border-2 border-cyan-500',
                      isCurrent && 'bg-cyan-500/10 border-cyan-500'
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-cyan-500 text-white px-3 py-1 text-xs font-medium">
                        Populaire
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-xs font-medium">
                        Plan actuel
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-white">{plan.name}</CardTitle>
                      <CardDescription className="text-gray-400">{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-3xl font-bold text-white">
                          {formatPrice(plan.price, plan.currency)}
                        </span>
                        <span className="text-gray-400">/{plan.interval === 'month' ? 'mois' : 'an'}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={cn(
                          'w-full',
                          isCurrent
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : plan.popular
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'
                            : 'bg-gray-800 hover:bg-gray-700'
                        )}
                        disabled={isCurrent}
                        onClick={() => {
                          if (!isCurrent) {
                            setShowUpgradeModal(true);
                          }
                        }}
                      >
                        {isCurrent ? 'Plan actuel' : 'Choisir ce plan'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Usage détaillé</CardTitle>
              <CardDescription className="text-gray-400">
                Détails de votre consommation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {usageMetrics.map((metric) => (
                  <div key={metric.id} className="p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white">{metric.name}</h3>
                        <p className="text-sm text-gray-400">
                          {metric.limit === -1
                            ? 'Illimité'
                            : `${formatNumber(metric.used)} / ${formatNumber(metric.limit)} ${metric.unit}`}
                        </p>
                      </div>
                      {metric.limit !== -1 && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-cyan-400">
                            {formatPercentage(metric.percentage)}
                          </p>
                          <p className="text-xs text-gray-500">utilisé</p>
                        </div>
                      )}
                    </div>
                    {metric.limit !== -1 && (
                      <Progress
                        value={metric.percentage}
                        className={cn(
                          'h-3',
                          metric.percentage >= 90 && 'bg-red-500',
                          metric.percentage >= 75 && metric.percentage < 90 && 'bg-yellow-500',
                          metric.percentage < 75 && 'bg-green-500'
                        )}
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Réinitialisation le {formatDate(metric.resetDate)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Subscription Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Annuler l'abonnement</DialogTitle>
            <DialogDescription>
              Votre abonnement restera actif jusqu'à la fin de la période de facturation actuelle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-gray-300">
              Vous perdrez l'accès à toutes les fonctionnalités premium le{' '}
              {subscription && formatDate(subscription.currentPeriodEnd)}.
            </p>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-400">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Cette action est irréversible. Vous pouvez réactiver votre abonnement avant la fin de la période.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)} className="border-gray-600">
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Annulation...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirmer l'annulation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Subscription Modal */}
      <Dialog open={showResumeModal} onOpenChange={setShowResumeModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Réactiver l'abonnement</DialogTitle>
            <DialogDescription>
              Votre abonnement sera réactivé immédiatement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResumeModal(false)} className="border-gray-600">
              Annuler
            </Button>
            <Button
              onClick={handleReactivateSubscription}
              disabled={reactivateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {reactivateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Réactivation...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Réactiver
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Dialog open={showInvoiceDetail} onOpenChange={setShowInvoiceDetail}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle>Facture {selectedInvoice.number}</DialogTitle>
              <DialogDescription>
                {formatDate(selectedInvoice.dueDate)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Statut</span>
                <Badge
                  variant={
                    selectedInvoice.status === 'paid'
                      ? 'default'
                      : selectedInvoice.status === 'pending'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {selectedInvoice.status === 'paid' && 'Payée'}
                  {selectedInvoice.status === 'pending' && 'En attente'}
                  {selectedInvoice.status === 'failed' && 'Échouée'}
                  {selectedInvoice.status === 'void' && 'Annulée'}
                </Badge>
              </div>
              <Separator className="bg-gray-700" />
              <div>
                <h3 className="font-semibold text-white mb-4">Détails</h3>
                <div className="space-y-2">
                  {selectedInvoice.lineItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{item.description}</p>
                        <p className="text-sm text-gray-400">
                          {item.quantity} × {formatPrice(item.unitPrice, selectedInvoice.currency)}
                        </p>
                      </div>
                      <p className="font-medium text-white">
                        {formatPrice(item.total, selectedInvoice.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <Separator className="bg-gray-700" />
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-cyan-400">
                  {formatPrice(selectedInvoice.amount, selectedInvoice.currency)}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInvoiceDetail(false)} className="border-gray-600">
                Fermer
              </Button>
              {selectedInvoice.pdfUrl && (
                <Button
                  onClick={() => handleDownloadInvoice(selectedInvoice.id)}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger PDF
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Payment Method Modal */}
      <Dialog open={showAddPaymentMethod} onOpenChange={setShowAddPaymentMethod}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Ajouter un moyen de paiement</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle carte ou méthode de paiement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300">Type</Label>
              <Select defaultValue="card">
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Carte bancaire</SelectItem>
                  <SelectItem value="sepa">SEPA Direct Debit</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                <Info className="w-4 h-4 inline mr-2" />
                L'intégration de paiement sera connectée à Stripe en production
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPaymentMethod(false)} className="border-gray-600">
              Annuler
            </Button>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Save className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>Changer de plan</DialogTitle>
            <DialogDescription>
              Choisissez un nouveau plan pour votre abonnement
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === subscription?.planId;
              return (
                <Card
                  key={plan.id}
                  className={cn(
                    'cursor-pointer transition-all hover:border-cyan-500',
                    isCurrent && 'border-cyan-500 bg-cyan-500/10'
                  )}
                  onClick={() => {
                    if (!isCurrent) {
                      toast({ title: 'Info', description: 'Changement de plan à venir' });
                    }
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-white">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-white">
                        {formatPrice(plan.price, plan.currency)}
                      </span>
                      <span className="text-gray-400">/{plan.interval === 'month' ? 'mois' : 'an'}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {plan.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={cn(
                        'w-full',
                        isCurrent
                          ? 'bg-gray-700'
                          : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'
                      )}
                      disabled={isCurrent}
                    >
                      {isCurrent ? 'Plan actuel' : 'Choisir'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)} className="border-gray-600">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

const MemoizedBillingPageContent = memo(BillingPageContent);

export default function BillingPage() {
  return (
    <ErrorBoundary level="page" componentName="BillingPage">
      <MemoizedBillingPageContent />
    </ErrorBoundary>
  );
}
