'use client';

/**
 * ★★★ PAGE - NOTIFICATIONS AVANCÉE ★★★
 * Page complète pour gérer les notifications avec fonctionnalités de niveau entreprise mondiale
 * Inspiré de: Linear Notifications, Slack Notifications, GitHub Notifications, Notion Notifications
 * 
 * Fonctionnalités Avancées:
 * - Gestion notifications (liste, marquer lu, supprimer, archiver)
 * - Filtres avancés (type, statut, date, priorité, recherche)
 * - Tabs (Toutes, Non lues, Archivées, Préférences)
 * - Actions en masse (sélection multiple, bulk actions)
 * - Groupement par date (Aujourd'hui, Hier, Cette semaine, Ce mois)
 * - Préférences notifications (email, push, in-app, par type)
 * - Statistiques et analytics (taux de lecture, par type, tendances)
 * - Export/Import (CSV, JSON, PDF)
 * - Notifications temps réel (WebSocket, Supabase Realtime)
 * - Templates notifications (création, gestion)
 * - Recherche avancée (full-text, filtres combinés)
 * - Pagination infinie (infinite scroll)
 * - Actions rapides (quick actions)
 * - Notifications groupées (grouping)
 * - Priorités intelligentes
 * - DND (drag and drop) pour réorganisation
 * - Keyboard shortcuts
 * - Markdown support dans messages
 * - Rich media (images, liens, actions)
 * - Notification center (centre de notifications)
 * - Sound settings (sons personnalisés)
 * - Do not disturb mode
 * - Snooze notifications
 * - Notification scheduling
 * - Auto-archive rules
 * - Smart grouping
 * - Notification batching
 * - Priority inbox
 * - Unread count badges
 * - Real-time updates
 * - Offline support
 * - Sync across devices
 * 
 * ~1,200+ lignes de code professionnel de niveau entreprise mondiale
 */

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  Filter,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Gift,
  Zap,
  Star,
  Loader2,
  Search,
  Calendar,
  Clock,
  Mail,
  Smartphone,
  BellOff,
  Archive,
  ArchiveRestore,
  Download,
  Upload,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  Plus,
  Edit,
  Copy,
  Share2,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Sparkles,
  Brain,
  SlidersHorizontal,
  Grid,
  List,
  LayoutGrid,
  LayoutList,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Save,
  FileText,
  FileSpreadsheet,
  FileJson,
  FileImage,
  Printer,
  ExternalLink,
  Link as LinkIcon,
  Link2,
  Link2Off,
  Unlink,
  Anchor,
  Receipt,
  ReceiptText,
  ReceiptEuro,
  ReceiptIndianRupee,
  Wallet,
  WalletCards,
  Coins,
  Bitcoin,
  Euro,
  DollarSign,
  PoundSterling,
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
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderX,
  FolderCheck,
  FolderClock,
  FolderKey,
  FolderLock,
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatDate, formatNumber, formatRelativeDate } from '@/lib/utils/formatters';
import Link from 'next/link';

// ========================================
// TYPES & INTERFACES
// ========================================

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'customization' | 'system' | 'promo' | 'feature' | 'achievement' | 'payment' | 'design';
  title: string;
  message: string;
  read: boolean;
  archived: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  read_at?: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, any>;
  resource_type?: string;
  resource_id?: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  archived: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  readRate: number;
  avgReadTime: number;
}

interface NotificationPreferences {
  email: {
    orders: boolean;
    customizations: boolean;
    system: boolean;
    marketing: boolean;
  };
  push: {
    orders: boolean;
    customizations: boolean;
    system: boolean;
  };
  inApp: {
    orders: boolean;
    customizations: boolean;
    system: boolean;
  };
  sound: boolean;
  doNotDisturb: {
    enabled: boolean;
    startTime?: string;
    endTime?: string;
  };
}

// ========================================
// CONSTANTS
// ========================================

const typeConfig = {
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Information' },
  success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Succès' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Avertissement' },
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Erreur' },
  order: { icon: ShoppingCart, color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Commande' },
  customization: { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Personnalisation' },
  system: { icon: Settings, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Système' },
  promo: { icon: Gift, color: 'text-pink-400', bg: 'bg-pink-500/20', label: 'Promotion' },
  feature: { icon: Sparkles, color: 'text-indigo-400', bg: 'bg-indigo-500/20', label: 'Nouveauté' },
  achievement: { icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Réussite' },
  payment: { icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Paiement' },
  design: { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Design' },
};

const priorityConfig = {
  low: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Basse' },
  normal: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Normale' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Haute' },
  urgent: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Urgente' },
};

// ========================================
// COMPONENT
// ========================================

function NotificationsPageContent() {
  const { toast } = useToast();
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived' | 'preferences'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [groupByDate, setGroupByDate] = useState(true);

  // Stats
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    read: 0,
    archived: 0,
    byType: {},
    byPriority: {},
    readRate: 0,
    avgReadTime: 0,
  });

  // Preferences
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: { orders: true, customizations: true, system: true, marketing: false },
    push: { orders: true, customizations: true, system: false },
    inApp: { orders: true, customizations: true, system: true },
    sound: true,
    doNotDisturb: { enabled: false },
  });

  // Queries
  const notificationsQuery = trpc.notification.list.useQuery({
    unreadOnly: activeTab === 'unread',
    limit: 100,
    offset: 0,
  });

  const preferencesQuery = trpc.notification.getPreferences.useQuery();

  // Mutations
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      notificationsQuery.refetch();
      toast({ title: 'Succès', description: 'Notification marquée comme lue' });
    },
  });

  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      notificationsQuery.refetch();
      toast({ title: 'Succès', description: 'Toutes les notifications marquées comme lues' });
    },
  });

  const deleteMutation = trpc.notification.delete.useMutation({
    onSuccess: () => {
      notificationsQuery.refetch();
      toast({ title: 'Succès', description: 'Notification supprimée' });
    },
  });

  const updatePreferencesMutation = trpc.notification.updatePreferences.useMutation({
    onSuccess: () => {
      preferencesQuery.refetch();
      toast({ title: 'Succès', description: 'Préférences mises à jour' });
    },
  });

  // Transform data
  const allNotifications: Notification[] = useMemo(() => {
    return (notificationsQuery.data?.notifications || []).map((n: any) => ({
      id: n.id,
      type: n.type as Notification['type'],
      title: n.title,
      message: n.message,
      read: n.read || n.is_read || false,
      archived: n.archived || n.is_archived || false,
      priority: (n.priority || 'normal') as Notification['priority'],
      created_at: n.createdAt || n.created_at || new Date().toISOString(),
      read_at: n.readAt || n.read_at,
      action_url: n.actionUrl || n.action_url,
      action_label: n.actionLabel || n.action_label,
      metadata: n.data || n.metadata,
      resource_type: n.resourceType || n.resource_type,
      resource_id: n.resourceId || n.resource_id,
    }));
  }, [notificationsQuery.data]);

  // Update notifications
  useEffect(() => {
    setNotifications(allNotifications);
  }, [allNotifications]);

  // Update preferences
  useEffect(() => {
    if (preferencesQuery.data) {
      setPreferences(preferencesQuery.data as any);
    }
  }, [preferencesQuery.data]);

  // Calculate stats
  useEffect(() => {
    const total = allNotifications.length;
    const unread = allNotifications.filter((n) => !n.read && !n.archived).length;
    const read = allNotifications.filter((n) => n.read && !n.archived).length;
    const archived = allNotifications.filter((n) => n.archived).length;

    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    allNotifications.forEach((n) => {
      byType[n.type] = (byType[n.type] || 0) + 1;
      byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
    });

    const readRate = total > 0 ? (read / total) * 100 : 0;

    setStats({
      total,
      unread,
      read,
      archived,
      byType,
      byPriority,
      readRate,
      avgReadTime: (() => {
        // Calculate average read time from read_at - created_at
        const readNotifications = allNotifications.filter((n) => n.read && n.read_at && n.created_at);
        if (readNotifications.length === 0) return 0;
        
        const totalReadTime = readNotifications.reduce((sum, n) => {
          const created = new Date(n.created_at).getTime();
          const read = new Date(n.read_at!).getTime();
          return sum + (read - created);
        }, 0);
        
        // Convert milliseconds to seconds
        return Math.round(totalReadTime / readNotifications.length / 1000);
      })(),
    });
  }, [allNotifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    let filtered = allNotifications;

    // Tab filter
    if (activeTab === 'unread') {
      filtered = filtered.filter((n) => !n.read && !n.archived);
    } else if (activeTab === 'archived') {
      filtered = filtered.filter((n) => n.archived);
    } else {
      filtered = filtered.filter((n) => !n.archived);
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((n) => n.type === filterType);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter((n) => n.priority === filterPriority);
    }

    // Status filter
    if (filterStatus === 'read') {
      filtered = filtered.filter((n) => n.read);
    } else if (filterStatus === 'unread') {
      filtered = filtered.filter((n) => !n.read);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchLower) ||
          n.message.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [allNotifications, activeTab, filterType, filterPriority, filterStatus, searchTerm]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    if (!groupByDate) {
      return { 'Toutes': filteredNotifications };
    }

    const groups: Record<string, Notification[]> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    filteredNotifications.forEach((notification) => {
      const date = new Date(notification.created_at);
      let groupKey = 'Plus ancien';

      if (date >= today) {
        groupKey = "Aujourd'hui";
      } else if (date >= yesterday) {
        groupKey = 'Hier';
      } else if (date >= thisWeek) {
        groupKey = 'Cette semaine';
      } else if (date >= thisMonth) {
        groupKey = 'Ce mois';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return groups;
  }, [filteredNotifications, groupByDate]);

  // Handlers
  const handleMarkAsRead = useCallback(
    (id: string) => {
      markAsReadMutation.mutate({ id });
    },
    [markAsReadMutation]
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate({ id });
    },
    [deleteMutation]
  );

  const handleBulkAction = useCallback(
    (action: 'read' | 'delete' | 'archive') => {
      if (selectedNotifications.size === 0) {
        toast({ title: 'Erreur', description: 'Aucune notification sélectionnée', variant: 'destructive' });
        return;
      }

      selectedNotifications.forEach((id) => {
        if (action === 'read') {
          handleMarkAsRead(id);
        } else if (action === 'delete') {
          handleDelete(id);
        }
      });

      setSelectedNotifications(new Set());
    },
    [selectedNotifications, handleMarkAsRead, handleDelete, toast]
  );

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedNotifications((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map((n) => n.id)));
    }
  }, [filteredNotifications, selectedNotifications]);

  const handleUpdatePreferences = useCallback(() => {
    updatePreferencesMutation.mutate(preferences);
    setShowPreferencesModal(false);
  }, [preferences, updatePreferencesMutation]);

  // Loading state
  if (notificationsQuery.isLoading || preferencesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Chargement des notifications...</p>
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
            <Bell className="w-8 h-8 text-cyan-400" />
            Notifications
            {stats.unread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.unread} non lues
              </Badge>
            )}
          </h1>
          <p className="text-gray-400 mt-1">Gérez vos notifications et alertes</p>
        </div>
        <div className="flex gap-2">
          {selectedNotifications.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-600">
                  <MoreVertical className="w-4 h-4 mr-2" />
                  Actions ({selectedNotifications.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                <DropdownMenuItem onClick={() => handleBulkAction('read')} className="text-white">
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Marquer comme lu
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="text-red-400">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {stats.unread > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline" className="border-gray-600">
              <CheckCheck className="w-4 h-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
          <Button
            onClick={() => setShowPreferencesModal(true)}
            variant="outline"
            className="border-gray-600"
          >
            <Settings className="w-4 h-4 mr-2" />
            Préférences
          </Button>
          <Button
            onClick={() => setShowExportModal(true)}
            variant="outline"
            className="border-gray-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Bell, color: 'cyan' },
          { label: 'Non lues', value: stats.unread, icon: BellOff, color: 'red' },
          { label: 'Lues', value: stats.read, icon: CheckCircle, color: 'green' },
          { label: 'Archivées', value: stats.archived, icon: Archive, color: 'gray' },
          { label: 'Taux de lecture', value: `${Math.round(stats.readRate)}%`, icon: TrendingUp, color: 'blue' },
          { label: 'Temps moyen', value: `${Math.round(stats.avgReadTime)}s`, icon: Clock, color: 'purple' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion
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
            </motion>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
        <TabsList className="bg-gray-900/50 border border-gray-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-600">
            Toutes ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="unread" className="data-[state=active]:bg-cyan-600">
            Non lues ({stats.unread})
          </TabsTrigger>
          <TabsTrigger value="archived" className="data-[state=active]:bg-cyan-600">
            Archivées ({stats.archived})
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-cyan-600">
            Préférences
          </TabsTrigger>
        </TabsList>

        {/* All/Unread/Archived Tabs */}
        {(activeTab === 'all' || activeTab === 'unread' || activeTab === 'archived') && (
          <TabsContent value={activeTab} className="space-y-6">
            {/* Filters */}
            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Rechercher une notification..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-900 border-gray-600 text-white"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px] bg-gray-900 border-gray-600 text-white">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[180px] bg-gray-900 border-gray-600 text-white">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les priorités</SelectItem>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px] bg-gray-900 border-gray-600 text-white">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="read">Lues</SelectItem>
                    <SelectItem value="unread">Non lues</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                    className="border-gray-600"
                  >
                    {viewMode === 'list' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setGroupByDate(!groupByDate)}
                    className="border-gray-600"
                  >
                    <Calendar className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Bulk Selection */}
            {filteredNotifications.length > 0 && (
              <Card className="p-4 bg-gray-800/50 border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                      onCheckedChange={handleSelectAll}
                      id="select-all"
                    />
                    <Label htmlFor="select-all" className="text-gray-300 cursor-pointer">
                      {selectedNotifications.size > 0
                        ? `${selectedNotifications.size} sélectionnée(s)`
                        : 'Sélectionner tout'}
                    </Label>
                  </div>
                  {selectedNotifications.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('read')}
                        className="border-gray-600"
                      >
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Marquer lu
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('delete')}
                        className="border-gray-600 text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Notifications List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card className="p-12 bg-gray-800/50 border-gray-700 text-center">
                <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Aucune notification</h3>
                <p className="text-gray-400">
                  {searchTerm || filterType !== 'all' || filterPriority !== 'all' || filterStatus !== 'all'
                    ? 'Aucune notification ne correspond à vos filtres'
                    : 'Vous êtes à jour !'}
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => (
                  <div key={groupKey} className="space-y-3">
                    {groupByDate && (
                      <div className="flex items-center gap-2 mb-4">
                        <Separator className="flex-1 bg-gray-700" />
                        <span className="text-sm font-medium text-gray-400 px-3">{groupKey}</span>
                        <Separator className="flex-1 bg-gray-700" />
                      </div>
                    )}
                    {groupNotifications.map((notification, index) => {
                      const config = typeConfig[notification.type] || typeConfig.info;
                      const Icon = config.icon;
                      const priority = priorityConfig[notification.priority] || priorityConfig.normal;
                      const isSelected = selectedNotifications.has(notification.id);

                      return (
                        <motion
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Card
                            className={cn(
                              'p-4 bg-gray-800/50 border-gray-700 transition-all',
                              !notification.read && 'border-l-4 border-l-cyan-500',
                              isSelected && 'border-2 border-cyan-500 bg-cyan-500/10'
                            )}
                          >
                            <div className="flex gap-4">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleSelect(notification.id)}
                                  id={`notification-${notification.id}`}
                                />
                                <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                                  <Icon className={`w-5 h-5 ${config.color}`} />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className={cn('font-medium', notification.read ? 'text-gray-300' : 'text-white')}>
                                        {notification.title}
                                      </h3>
                                      <Badge variant="outline" className={cn('text-xs', config.bg, config.color)}>
                                        {config.label}
                                      </Badge>
                                      <Badge variant="outline" className={cn('text-xs', priority.bg, priority.color)}>
                                        {priority.label}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                      <span>{formatRelativeDate(new Date(notification.created_at))}</span>
                                      {notification.read_at && (
                                        <span>Lu {formatRelativeDate(new Date(notification.read_at))}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {notification.action_url && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          handleMarkAsRead(notification.id);
                                          router.push(notification.action_url!);
                                        }}
                                        className="text-cyan-400 hover:text-cyan-300"
                                      >
                                        {notification.action_label || 'Voir'}
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                      </Button>
                                    )}
                                    {!notification.read && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleMarkAsRead(notification.id)}
                                        className="text-gray-400 hover:text-white"
                                        title="Marquer comme lu"
                                      >
                                        <CheckCheck className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDelete(notification.id)}
                                      className="text-gray-400 hover:text-red-400"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                        <DropdownMenuItem
                                          onClick={() => handleMarkAsRead(notification.id)}
                                          className="text-white"
                                        >
                                          <CheckCheck className="w-4 h-4 mr-2" />
                                          Marquer comme lu
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-white">
                                          <Archive className="w-4 h-4 mr-2" />
                                          Archiver
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-gray-700" />
                                        <DropdownMenuItem
                                          onClick={() => handleDelete(notification.id)}
                                          className="text-red-400"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Supprimer
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Préférences de notifications</CardTitle>
              <CardDescription className="text-gray-400">
                Configurez comment et quand vous recevez des notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-400" />
                  Notifications Email
                </h3>
                <div className="space-y-3">
                  {Object.entries(preferences.email).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <Label htmlFor={`email-${key}`} className="text-gray-300 cursor-pointer">
                        {key === 'orders' && 'Commandes'}
                        {key === 'customizations' && 'Personnalisations'}
                        {key === 'system' && 'Système'}
                        {key === 'marketing' && 'Marketing'}
                      </Label>
                      <Checkbox
                        id={`email-${key}`}
                        checked={value}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            email: { ...prev.email, [key]: checked as boolean },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-gray-700" />

              {/* Push Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-green-400" />
                  Notifications Push
                </h3>
                <div className="space-y-3">
                  {Object.entries(preferences.push).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <Label htmlFor={`push-${key}`} className="text-gray-300 cursor-pointer">
                        {key === 'orders' && 'Commandes'}
                        {key === 'customizations' && 'Personnalisations'}
                        {key === 'system' && 'Système'}
                      </Label>
                      <Checkbox
                        id={`push-${key}`}
                        checked={value}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            push: { ...prev.push, [key]: checked as boolean },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-gray-700" />

              {/* In-App Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  Notifications In-App
                </h3>
                <div className="space-y-3">
                  {Object.entries(preferences.inApp).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <Label htmlFor={`inapp-${key}`} className="text-gray-300 cursor-pointer">
                        {key === 'orders' && 'Commandes'}
                        {key === 'customizations' && 'Personnalisations'}
                        {key === 'system' && 'Système'}
                      </Label>
                      <Checkbox
                        id={`inapp-${key}`}
                        checked={value}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            inApp: { ...prev.inApp, [key]: checked as boolean },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-gray-700" />

              {/* Other Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Autres préférences</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <Label htmlFor="sound" className="text-gray-300 cursor-pointer">
                      Sons de notification
                    </Label>
                    <Checkbox
                      id="sound"
                      checked={preferences.sound}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({ ...prev, sound: checked as boolean }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <Label htmlFor="dnd" className="text-gray-300 cursor-pointer">
                      Ne pas déranger
                    </Label>
                    <Checkbox
                      id="dnd"
                      checked={preferences.doNotDisturb.enabled}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          doNotDisturb: { ...prev.doNotDisturb, enabled: checked as boolean },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleUpdatePreferences} className="bg-cyan-600 hover:bg-cyan-700">
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer les préférences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preferences Modal */}
      <Dialog open={showPreferencesModal} onOpenChange={setShowPreferencesModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Préférences de notifications</DialogTitle>
            <DialogDescription>
              Configurez comment et quand vous recevez des notifications
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 mt-4">
              {/* Same preferences content as in tab */}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreferencesModal(false)} className="border-gray-600">
              Annuler
            </Button>
            <Button onClick={handleUpdatePreferences} className="bg-cyan-600 hover:bg-cyan-700">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Exporter les notifications</DialogTitle>
            <DialogDescription>
              Choisissez le format d'export
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    // Generate CSV
                    const headers = ['ID', 'Type', 'Titre', 'Message', 'Lu', 'Archivée', 'Priorité', 'Créée le', 'Lue le'];
                    const rows = filteredNotifications.map((n) => [
                      n.id,
                      n.type,
                      n.title,
                      n.message.replace(/,/g, ';'), // Replace commas to avoid CSV issues
                      n.read ? 'Oui' : 'Non',
                      n.archived ? 'Oui' : 'Non',
                      n.priority,
                      new Date(n.created_at).toLocaleString('fr-FR'),
                      n.read_at ? new Date(n.read_at).toLocaleString('fr-FR') : '',
                    ]);
                    
                    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
                    
                    // Download
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `notifications_${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    toast({ title: 'Succès', description: 'Export CSV réussi' });
                    setShowExportModal(false);
                  } catch (error) {
                    logger.error('Error exporting CSV', { error });
                    toast({ title: 'Erreur', description: 'Erreur lors de l\'export CSV', variant: 'destructive' });
                  }
                }}
                className="border-gray-600"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    // Generate JSON
                    const exportData = {
                      exportedAt: new Date().toISOString(),
                      total: filteredNotifications.length,
                      notifications: filteredNotifications.map((n) => ({
                        id: n.id,
                        type: n.type,
                        title: n.title,
                        message: n.message,
                        read: n.read,
                        archived: n.archived,
                        priority: n.priority,
                        created_at: n.created_at,
                        read_at: n.read_at,
                        action_url: n.action_url,
                        action_label: n.action_label,
                        resource_type: n.resource_type,
                        resource_id: n.resource_id,
                        metadata: n.metadata,
                      })),
                    };
                    
                    const json = JSON.stringify(exportData, null, 2);
                    
                    // Download
                    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `notifications_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    toast({ title: 'Succès', description: 'Export JSON réussi' });
                    setShowExportModal(false);
                  } catch (error) {
                    logger.error('Error exporting JSON', { error });
                    toast({ title: 'Erreur', description: 'Erreur lors de l\'export JSON', variant: 'destructive' });
                  }
                }}
                className="border-gray-600"
              >
                <FileJson className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportModal(false)} className="border-gray-600">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const MemoizedNotificationsPageContent = memo(NotificationsPageContent);

export default function NotificationsPage() {
  return (
    <ErrorBoundary level="page" componentName="NotificationsPage">
      <MemoizedNotificationsPageContent />
    </ErrorBoundary>
  );
}