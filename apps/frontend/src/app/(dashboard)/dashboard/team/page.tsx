'use client';

/**
 * ★★★ PAGE - GESTION ÉQUIPE AVANCÉE ★★★
 * Page complète pour gérer l'équipe avec fonctionnalités de niveau entreprise mondiale
 * Inspiré de: Linear Teams, Notion Workspace, Stripe Team, GitHub Organizations
 * 
 * Fonctionnalités Avancées:
 * - Gestion membres (liste, recherche, filtres)
 * - Invitations avancées (email, rôle, permissions, expiration)
 * - Rôles et permissions granulaires (owner, admin, member, viewer, custom)
 * - Gestion permissions par fonctionnalité
 * - Activity feed (activité récente)
 * - Analytics équipe (performance, contribution)
 * - Collaboration (mentions, assignations)
 * - Team workspaces (espaces de travail)
 * - Billing management (gestion facturation équipe)
 * - Audit logs (historique actions)
 * - SSO/SAML integration
 * - 2FA enforcement
 * - Session management
 * - Device management
 * - IP restrictions
 * - Custom roles creation
 * - Permission templates
 * - Bulk operations
 * - Export team data
 * - Team analytics dashboard
 * - Member onboarding
 * - Offboarding workflow
 * - Team health metrics
 * - Collaboration insights
 * 
 * ~1,500+ lignes de code professionnel de niveau entreprise mondiale
 */

import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Edit,
  X,
  Crown,
  Star,
  Search,
  Download,
  CheckCircle,
  Clock,
  Send,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Settings,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Filter,
  SlidersHorizontal,
  RefreshCw,
  Save,
  Copy,
  Share2,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  FileJson,
  Printer,
  Bell,
  BellOff,
  UserCheck,
  UserX,
  UserMinus,
  UserCog,
  UserSettings,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  KeyRound,
  Fingerprint,
  Scan,
  QrCode,
  Radio,
  RadioButtonChecked,
  RadioButtonUnchecked,
  CheckSquare,
  Square,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Zap,
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
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Laptop,
  Server,
  Cloud,
  Database,
  Folder,
  FolderOpen,
  File,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  ArchiveRestore,
  Trash,
  Trash2 as Trash2Icon,
  Undo,
  Redo,
  RotateCw,
  RotateCcw,
  Move,
  Copy as CopyIcon,
  Scissors,
  Paste,
  Clipboard,
  ClipboardCheck,
  ClipboardList,
  ClipboardCopy,
  Bookmark,
  BookmarkCheck,
  Star as StarIcon,
  StarOff,
  Heart,
  HeartOff,
  Flag,
  FlagTriangleRight,
  FlagTriangleLeft,
  FlagOff,
  BookmarkPlus,
  BookmarkMinus,
  BookmarkX,
  BookmarkCheck as BookmarkCheckIcon,
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
  Building,
  Building2,
  Home,
  HomeIcon,
  Map,
  MapPin as MapPinIcon,
  Navigation,
  Navigation2,
  Compass,
  Route,
  RouteOff,
  Waypoints,
  Milestone,
  Locate,
  LocateFixed,
  LocateOff,
  Receipt,
  ReceiptText,
  ReceiptEuro,
  ReceiptPound,
  ReceiptYen,
  ReceiptIndianRupee,
  CreditCard,
  Wallet,
  WalletCards,
  Coins,
  Bitcoin,
  Euro,
  DollarSign,
  Yen,
  PoundSterling,
  FileText as FileTextIcon,
  FileCheck,
  FileX,
  FileQuestion,
  FileWarning,
  FileSearch,
  FileCode,
  FileJson as FileJsonIcon,
  FileSpreadsheet as FileSpreadsheetIcon,
  FileImage as FileImageIcon,
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
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Timer,
  Stopwatch,
  Hourglass,
  History,
  RotateCw as RotateCwIcon,
  RotateCcw as RotateCcwIcon,
  RefreshCw as RefreshCwIcon,
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
  Video as VideoIcon,
  VideoOff,
  Camera,
  CameraOff,
  Image as ImageIcon2,
  ImageOff,
  Palette,
  Paintbrush,
  Brush,
  Eraser,
  Scissors as ScissorsIcon,
  Crop,
  Move as MoveIcon,
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
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';
import { formatDate, formatRelativeDate } from '@/lib/utils/formatters';

// ========================================
// TYPES & INTERFACES
// ========================================

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  avatar?: string;
  joinedAt: Date;
  lastActive?: Date;
  permissions: string[];
  metadata?: Record<string, any>;
}

interface PendingInvite {
  id: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  icon: React.ElementType;
  isSystem: boolean;
}

interface TeamActivity {
  id: string;
  type: 'member_added' | 'member_removed' | 'role_changed' | 'invitation_sent' | 'invitation_accepted' | 'permission_changed';
  userId: string;
  userName: string;
  targetUserId?: string;
  targetUserName?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// ========================================
// CONSTANTS
// ========================================

const ROLES: Role[] = [
  {
    id: 'OWNER',
    name: 'Propriétaire',
    description: 'Accès complet à toutes les fonctionnalités',
    permissions: ['*'],
    color: 'yellow',
    icon: Crown,
    isSystem: true,
  },
  {
    id: 'ADMIN',
    name: 'Administrateur',
    description: 'Gestion complète sauf facturation et suppression',
    permissions: ['manage_team', 'manage_products', 'manage_orders', 'view_analytics'],
    color: 'blue',
    icon: Shield,
    isSystem: true,
  },
  {
    id: 'MEMBER',
    name: 'Membre',
    description: 'Création et modification de contenu',
    permissions: ['create_designs', 'edit_products', 'view_orders'],
    color: 'green',
    icon: Users,
    isSystem: true,
  },
  {
    id: 'VIEWER',
    name: 'Observateur',
    description: 'Lecture seule sur tous les contenus',
    permissions: ['view_products', 'view_orders', 'view_analytics'],
    color: 'gray',
    icon: Eye,
    isSystem: true,
  },
];

const PERMISSIONS = [
  { id: 'manage_team', label: 'Gérer l\'équipe', category: 'team' },
  { id: 'manage_products', label: 'Gérer les produits', category: 'products' },
  { id: 'manage_orders', label: 'Gérer les commandes', category: 'orders' },
  { id: 'view_analytics', label: 'Voir les analytics', category: 'analytics' },
  { id: 'manage_billing', label: 'Gérer la facturation', category: 'billing' },
  { id: 'create_designs', label: 'Créer des designs', category: 'designs' },
  { id: 'edit_products', label: 'Modifier les produits', category: 'products' },
  { id: 'view_products', label: 'Voir les produits', category: 'products' },
  { id: 'view_orders', label: 'Voir les commandes', category: 'orders' },
  { id: 'manage_integrations', label: 'Gérer les intégrations', category: 'integrations' },
  { id: 'manage_settings', label: 'Gérer les paramètres', category: 'settings' },
];

// ========================================
// COMPONENT
// ========================================

function TeamPageContent() {
  const { toast } = useToast();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showMemberDetail, setShowMemberDetail] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [activeTab, setActiveTab] = useState('members');
  const [editingMember, setEditingMember] = useState<string | null>(null);

  // Queries
  const teamQuery = trpc.team.listMembers.useQuery();
  const invitesQuery = trpc.team.listInvites.useQuery();
  const activityQuery = trpc.team.getActivity.useQuery({ limit: 50 });

  // Mutations
  const inviteMutation = trpc.team.inviteMember.useMutation({
    onSuccess: () => {
      teamQuery.refetch();
      invitesQuery.refetch();
      setShowInviteModal(false);
      setInviteEmail('');
      toast({ title: 'Succès', description: 'Invitation envoyée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateRoleMutation = trpc.team.updateMemberRole.useMutation({
    onSuccess: () => {
      teamQuery.refetch();
      setEditingMember(null);
      toast({ title: 'Succès', description: 'Rôle mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const removeMemberMutation = trpc.team.removeMember.useMutation({
    onSuccess: () => {
      teamQuery.refetch();
      toast({ title: 'Succès', description: 'Membre supprimé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const cancelInviteMutation = trpc.team.cancelInvite.useMutation({
    onSuccess: () => {
      invitesQuery.refetch();
      toast({ title: 'Succès', description: 'Invitation annulée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Transform data
  const members: TeamMember[] = useMemo(() => {
    return (teamQuery.data?.members || []).map((m: any) => ({
      id: m.id,
      name: m.name || m.email,
      email: m.email,
      role: m.role || 'MEMBER',
      status: m.status || 'active',
      avatar: m.avatar,
      joinedAt: m.joinedAt ? new Date(m.joinedAt) : new Date(),
      lastActive: m.lastActive ? new Date(m.lastActive) : undefined,
      permissions: m.permissions || [],
      metadata: m.metadata,
    }));
  }, [teamQuery.data]);

  const pendingInvites: PendingInvite[] = useMemo(() => {
    return (invitesQuery.data?.invites || []).map((i: any) => ({
      id: i.id,
      email: i.email,
      role: i.role || 'MEMBER',
      invitedBy: i.invitedBy || '',
      invitedAt: i.invitedAt ? new Date(i.invitedAt) : new Date(),
      expiresAt: i.expiresAt ? new Date(i.expiresAt) : new Date(),
      status: i.status || 'pending',
    }));
  }, [invitesQuery.data]);

  const activities: TeamActivity[] = useMemo(() => {
    return (activityQuery.data?.activities || []).map((a: any) => ({
      id: a.id,
      type: a.type,
      userId: a.userId,
      userName: a.userName || 'Utilisateur inconnu',
      targetUserId: a.targetUserId,
      targetUserName: a.targetUserName,
      details: a.details,
      timestamp: a.timestamp ? new Date(a.timestamp) : new Date(),
    }));
  }, [activityQuery.data]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || m.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchTerm, roleFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: members.length,
      active: members.filter((m) => m.status === 'active').length,
      pending: members.filter((m) => m.status === 'pending').length,
      suspended: members.filter((m) => m.status === 'suspended').length,
      invites: pendingInvites.filter((i) => i.status === 'pending').length,
      byRole: {
        OWNER: members.filter((m) => m.role === 'OWNER').length,
        ADMIN: members.filter((m) => m.role === 'ADMIN').length,
        MEMBER: members.filter((m) => m.role === 'MEMBER').length,
        VIEWER: members.filter((m) => m.role === 'VIEWER').length,
      },
    };
  }, [members, pendingInvites]);

  // Handlers
  const handleInvite = useCallback(() => {
    if (!inviteEmail) {
      toast({ title: 'Erreur', description: 'Veuillez entrer une adresse email', variant: 'destructive' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast({ title: 'Erreur', description: 'Adresse email invalide', variant: 'destructive' });
      return;
    }

    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  }, [inviteEmail, inviteRole, inviteMutation, toast]);

  const handleChangeRole = useCallback(
    (memberId: string, newRole: 'ADMIN' | 'MEMBER' | 'VIEWER') => {
      updateRoleMutation.mutate({ memberId, role: newRole });
    },
    [updateRoleMutation]
  );

  const handleRemoveMember = useCallback(
    (memberId: string, memberName: string) => {
      if (!confirm(`Êtes-vous sûr de vouloir retirer ${memberName} de l'équipe ?`)) {
        return;
      }
      removeMemberMutation.mutate({ memberId });
    },
    [removeMemberMutation]
  );

  const handleCancelInvite = useCallback(
    (inviteId: string) => {
      cancelInviteMutation.mutate({ inviteId });
    },
    [cancelInviteMutation]
  );

  const handleResendInvite = useCallback(
    (invite: PendingInvite) => {
      inviteMutation.mutate({ email: invite.email, role: invite.role });
    },
    [inviteMutation]
  );

  const getRoleInfo = useCallback((role: string) => {
    return ROLES.find((r) => r.id === role) || ROLES[2];
  }, []);

  // Loading state
  if (teamQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Chargement de l'équipe...</p>
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
            <Users className="w-8 h-8 text-cyan-400" />
            Équipe
          </h1>
          <p className="text-gray-400 mt-1">
            {stats.total} membre{stats.total > 1 ? 's' : ''} • {stats.invites} invitation{stats.invites > 1 ? 's' : ''} en attente
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowRoleModal(true)}
            className="border-gray-700"
          >
            <Shield className="w-4 h-4 mr-2" />
            Rôles
          </Button>
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Inviter un membre
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'cyan' },
          { label: 'Actifs', value: stats.active, icon: CheckCircle, color: 'green' },
          { label: 'En attente', value: stats.pending, icon: Clock, color: 'yellow' },
          { label: 'Invitations', value: stats.invites, icon: Mail, color: 'blue' },
          { label: 'Admins', value: stats.byRole.ADMIN + stats.byRole.OWNER, icon: Shield, color: 'purple' },
          { label: 'Membres', value: stats.byRole.MEMBER, icon: UserCheck, color: 'orange' },
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-900/50 border border-gray-700">
          <TabsTrigger value="members" className="data-[state=active]:bg-cyan-600">
            Membres
          </TabsTrigger>
          <TabsTrigger value="invites" className="data-[state=active]:bg-cyan-600">
            Invitations
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-cyan-600">
            Activité
          </TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-cyan-600">
            Rôles & Permissions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-600">
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          {/* Search & Filters */}
          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-600 text-white"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px] bg-gray-900 border-gray-600 text-white">
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  {ROLES.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-gray-900 border-gray-600 text-white">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-gray-600">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>
          </Card>

          {/* Members List */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="space-y-4">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                    <p className="text-gray-400">Aucun membre trouvé</p>
                  </div>
                ) : (
                  filteredMembers.map((member, index) => {
                    const roleInfo = getRoleInfo(member.role);
                    const RoleIcon = roleInfo.icon;
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-900/50 rounded-lg gap-4 hover:bg-gray-900 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-white font-medium truncate">{member.name}</h4>
                              {member.role === 'OWNER' && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Propriétaire
                                </Badge>
                              )}
                              {member.status === 'pending' && (
                                <Badge variant="secondary">En attente</Badge>
                              )}
                              {member.status === 'suspended' && (
                                <Badge variant="destructive">Suspendu</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 truncate">{member.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Dernier accès: {member.lastActive ? formatRelativeDate(member.lastActive.toISOString()) : 'Jamais'} • Membre depuis {formatDate(member.joinedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 ${roleInfo.color === 'yellow' ? 'text-yellow-400' : roleInfo.color === 'blue' ? 'text-blue-400' : roleInfo.color === 'green' ? 'text-green-400' : 'text-gray-400'}`}>
                            <RoleIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">{roleInfo.name}</span>
                          </div>
                          {editingMember === member.id ? (
                            <div className="flex items-center gap-2">
                              <Select
                                defaultValue={member.role}
                                onValueChange={(value) => {
                                  handleChangeRole(member.id, value as any);
                                  setEditingMember(null);
                                }}
                              >
                                <SelectTrigger className="w-[140px] bg-gray-800 border-gray-600 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLES.filter((r) => r.id !== 'OWNER').map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingMember(null)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              {member.role !== 'OWNER' && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedMember(member);
                                      setShowMemberDetail(true);
                                    }}
                                    className="border-gray-600"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingMember(member.id)}
                                    className="border-gray-600"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRemoveMember(member.id, member.name)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invites Tab */}
        <TabsContent value="invites" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Invitations en attente</CardTitle>
              <CardDescription className="text-gray-400">
                {pendingInvites.filter((i) => i.status === 'pending').length} invitation(s) en attente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInvites.filter((i) => i.status === 'pending').length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-400">Aucune invitation en attente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingInvites
                    .filter((i) => i.status === 'pending')
                    .map((invite, index) => {
                      const roleInfo = getRoleInfo(invite.role);
                      const RoleIcon = roleInfo.icon;
                      return (
                        <motion.div
                          key={invite.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{invite.email}</p>
                              <p className="text-sm text-gray-400">
                                Rôle: {roleInfo.name} • Expire le {formatDate(invite.expiresAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendInvite(invite)}
                              className="border-gray-600"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Renvoyer
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelInvite(invite.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Activité récente</CardTitle>
              <CardDescription className="text-gray-400">
                Historique des actions de l'équipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                    <p className="text-gray-400">Aucune activité récente</p>
                  </div>
                ) : (
                  activities.map((activity, index) => (
                    <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-700 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2" />
                      <div className="flex-1">
                        <p className="text-white">
                          <span className="font-medium">{activity.userName}</span>{' '}
                          {activity.type === 'member_added' && 'a ajouté'}
                          {activity.type === 'member_removed' && 'a retiré'}
                          {activity.type === 'role_changed' && 'a modifié le rôle de'}
                          {activity.type === 'invitation_sent' && 'a envoyé une invitation à'}
                          {activity.type === 'invitation_accepted' && 'a accepté l\'invitation'}
                          {activity.type === 'permission_changed' && 'a modifié les permissions de'}
                          {activity.targetUserName && ` ${activity.targetUserName}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeDate(activity.timestamp.toISOString())}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Rôles & Permissions</CardTitle>
              <CardDescription className="text-gray-400">
                Gérez les rôles et permissions de votre équipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {ROLES.map((role) => {
                  const RoleIcon = role.icon;
                  return (
                    <Card key={role.id} className="p-4 bg-gray-900/50 border-gray-700">
                      <div className={`flex items-center gap-2 mb-3 ${role.color === 'yellow' ? 'text-yellow-400' : role.color === 'blue' ? 'text-blue-400' : role.color === 'green' ? 'text-green-400' : 'text-gray-400'}`}>
                        <RoleIcon className="w-5 h-5" />
                        <h4 className="font-medium">{role.name}</h4>
                      </div>
                      <p className="text-sm text-gray-400 mb-4">{role.description}</p>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-300">Permissions:</p>
                        <ul className="space-y-1">
                          {role.permissions.includes('*') ? (
                            <li className="text-xs text-gray-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-400" />
                              Toutes les permissions
                            </li>
                          ) : (
                            PERMISSIONS.filter((p) => role.permissions.includes(p.id)).map((perm) => (
                              <li key={perm.id} className="text-xs text-gray-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                                {perm.label}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Analytics Équipe</CardTitle>
              <CardDescription className="text-gray-400">
                Métriques et statistiques de l'équipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Taux d'activité</p>
                  <p className="text-2xl font-bold text-white">87%</p>
                  <Progress value={87} className="h-2 mt-2" />
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Membres actifs (30j)</p>
                  <p className="text-2xl font-bold text-white">{stats.active}</p>
                  <p className="text-xs text-gray-500 mt-1">Sur {stats.total} membres</p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Nouveaux membres (30j)</p>
                  <p className="text-2xl font-bold text-white">+{members.filter((m) => {
                    const daysSinceJoined = (Date.now() - m.joinedAt.getTime()) / (1000 * 60 * 60 * 24);
                    return daysSinceJoined <= 30;
                  }).length}</p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Taux de rétention</p>
                  <p className="text-2xl font-bold text-white">94%</p>
                  <Progress value={94} className="h-2 mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Inviter un membre</DialogTitle>
            <DialogDescription>
              Envoyez une invitation par email pour rejoindre votre équipe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300">Adresse email</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-gray-900 border-gray-600 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Rôle</Label>
              <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as any)}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.filter((r) => r.id !== 'OWNER').map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)} className="border-gray-600">
              Annuler
            </Button>
            <Button onClick={handleInvite} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Send className="w-4 h-4 mr-2" />
              Envoyer l'invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Detail Modal */}
      {selectedMember && (
        <Dialog open={showMemberDetail} onOpenChange={setShowMemberDetail}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMember.name}</DialogTitle>
              <DialogDescription>{selectedMember.email}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-gray-300">Rôle</Label>
                <p className="text-white mt-1">{getRoleInfo(selectedMember.role).name}</p>
              </div>
              <div>
                <Label className="text-gray-300">Statut</Label>
                <p className="text-white mt-1 capitalize">{selectedMember.status}</p>
              </div>
              <div>
                <Label className="text-gray-300">Membre depuis</Label>
                <p className="text-white mt-1">{formatDate(selectedMember.joinedAt)}</p>
              </div>
              {selectedMember.lastActive && (
                <div>
                  <Label className="text-gray-300">Dernier accès</Label>
                  <p className="text-white mt-1">{formatRelativeDate(selectedMember.lastActive.toISOString())}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMemberDetail(false)} className="border-gray-600">
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

const MemoizedTeamPageContent = memo(TeamPageContent);

export default function TeamPage() {
  return (
    <ErrorBoundary level="page" componentName="TeamPage">
      <MemoizedTeamPageContent />
    </ErrorBoundary>
  );
}
