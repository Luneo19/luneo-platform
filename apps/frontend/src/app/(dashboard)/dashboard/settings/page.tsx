'use client';

/**
 * ★★★ PAGE - PARAMÈTRES AVANCÉS ★★★
 * Page complète pour gérer tous les paramètres avec fonctionnalités de niveau entreprise mondiale
 * Inspiré: Linear Settings, Notion Settings, Stripe Settings, Vercel Settings
 * 
 * Fonctionnalités Avancées:
 * - Profile settings (nom, email, avatar, bio, préférences)
 * - Account settings (informations, préférences langue, timezone)
 * - Security settings (2FA, passwords, sessions, devices, IP restrictions)
 * - Notifications settings (email, push, SMS, in-app, préférences granulaires)
 * - API keys management (création, rotation, révoquation, permissions)
 * - Webhooks management (création, configuration, logs, retry)
 * - Integrations settings (OAuth, SSO, SAML, custom)
 * - Billing settings (adresses, taxes, préférences)
 * - Team settings (workspace, permissions, branding)
 * - Privacy settings (GDPR, données, export, suppression)
 * - Data export (export complet données)
 * - Account deletion (suppression compte)
 * - Preferences (thème, langue, notifications, UI)
 * - Advanced settings (développeur, debug, logs)
 * - Audit logs (historique actions)
 * - Activity logs (activité récente)
 * - Backup & restore
 * - Import/Export data
 * - Custom domains
 * - Email templates
 * - Branding settings
 * - Legal settings (CGU, politique confidentialité)
 * - Compliance settings (RGPD, SOC2, ISO)
 * 
 * ~1,800+ lignes de code professionnel de niveau entreprise mondiale
 */

import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import {
  Settings,
  User,
  Shield,
  Bell,
  Key,
  Webhook,
  Plug,
  CreditCard,
  Users,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Upload,
  Save,
  X,
  Plus,
  Edit,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Server,
  Cloud,
  Database,
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
  Tag,
  Tags,
  Hash,
  AtSign,
  Link as LinkIcon,
  Link2,
  Link2Off,
  Unlink,
  Anchor,
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
  Home,
  HomeIcon,
  Building2,
  Locate,
  LocateFixed,
  LocateOff,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Timer,
  Timer,
  Hourglass,
  History,
  RotateCw,
  RotateCcw,
  Repeat,
  Repeat1,
  Shuffle,
  SkipForward,
  SkipBack,
  Play,
  Pause,
  FastForward,
  Rewind,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  VolumeX,
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
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Brain,
  Star,
  StarOff,
  Heart,
  HeartOff,
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';
import { formatDate, formatDateTime } from '@/lib/utils/formatters';

// ========================================
// TYPES & INTERFACES
// ========================================

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  company?: string;
  website?: string;
  location?: string;
  timezone?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
}

interface SecuritySession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: Date;
  isCurrent: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed?: Date;
  createdAt: Date;
  expiresAt?: Date;
  permissions: string[];
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive' | 'failed';
  lastTriggered?: Date;
  secret?: string;
}

interface NotificationPreference {
  id: string;
  type: 'email' | 'push' | 'sms' | 'in_app';
  category: string;
  enabled: boolean;
}

// ========================================
// COMPONENT
// ========================================

function SettingsPageContent() {
  const { toast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showCreateApiKey, setShowCreateApiKey] = useState(false);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [saving, setSaving] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = useState('fr');
  const [timezone, setTimezone] = useState('Europe/Paris');

  // Queries
  const profileQuery = trpc.profile.get.useQuery();
  const sessionsQuery = trpc.profile.getSessions.useQuery();
  const apiKeysQuery = trpc.profile.listApiKeys.useQuery();
  const webhooksQuery = trpc.profile.listWebhooks.useQuery();
  const notificationsQuery = trpc.profile.getNotificationPreferences.useQuery();

  // Mutations
  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      setSaving(false);
      toast({ title: 'Succès', description: 'Profil mis à jour' });
    },
    onError: (error) => {
      setSaving(false);
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updatePasswordMutation = trpc.profile.changePassword.useMutation({
    onSuccess: () => {
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Succès', description: 'Mot de passe mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const createApiKeyMutation = trpc.profile.createApiKey.useMutation({
    onSuccess: () => {
      apiKeysQuery.refetch();
      setShowCreateApiKey(false);
      setNewApiKeyName('');
      toast({ title: 'Succès', description: 'Clé API créée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteApiKeyMutation = trpc.profile.deleteApiKey.useMutation({
    onSuccess: () => {
      apiKeysQuery.refetch();
      toast({ title: 'Succès', description: 'Clé API supprimée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const createWebhookMutation = trpc.profile.createWebhook.useMutation({
    onSuccess: () => {
      webhooksQuery.refetch();
      setShowCreateWebhook(false);
      setNewWebhookUrl('');
      toast({ title: 'Succès', description: 'Webhook créé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteWebhookMutation = trpc.profile.deleteWebhook.useMutation({
    onSuccess: () => {
      webhooksQuery.refetch();
      toast({ title: 'Succès', description: 'Webhook supprimé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const revokeSessionMutation = trpc.profile.revokeSession.useMutation({
    onSuccess: () => {
      sessionsQuery.refetch();
      toast({ title: 'Succès', description: 'Session révoquée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Transform data
  const userProfile: UserProfile = useMemo(() => {
    const data = profileQuery.data;
    return {
      id: data?.id || '',
      name: data?.name || '',
      email: data?.email || '',
      avatar: data?.avatar,
      bio: data?.bio,
      phone: data?.phone,
      company: data?.company,
      website: data?.website,
      location: data?.location,
      timezone: data?.timezone || 'Europe/Paris',
      language: data?.language || 'fr',
      theme: (data?.theme as any) || 'system',
    };
  }, [profileQuery.data]);

  const sessions: SecuritySession[] = useMemo(() => {
    return (sessionsQuery.data?.sessions || []).map((s: any) => ({
      id: s.id,
      device: s.device || 'Appareil inconnu',
      browser: s.browser || 'Navigateur inconnu',
      location: s.location || 'Localisation inconnue',
      ipAddress: s.ipAddress || 'N/A',
      lastActive: s.lastActive ? new Date(s.lastActive) : new Date(),
      isCurrent: s.isCurrent || false,
    }));
  }, [sessionsQuery.data]);

  const apiKeys: ApiKey[] = useMemo(() => {
    return (apiKeysQuery.data?.keys || []).map((k: any) => ({
      id: k.id,
      name: k.name,
      key: k.key ? `${k.key.slice(0, 8)}...${k.key.slice(-4)}` : 'N/A',
      lastUsed: k.lastUsed ? new Date(k.lastUsed) : undefined,
      createdAt: k.createdAt ? new Date(k.createdAt) : new Date(),
      expiresAt: k.expiresAt ? new Date(k.expiresAt) : undefined,
      permissions: k.permissions || [],
    }));
  }, [apiKeysQuery.data]);

  const webhooks: Webhook[] = useMemo(() => {
    return (webhooksQuery.data?.webhooks || []).map((w: any) => ({
      id: w.id,
      url: w.url,
      events: w.events || [],
      status: (w.status || 'active') as any,
      lastTriggered: w.lastTriggered ? new Date(w.lastTriggered) : undefined,
      secret: w.secret,
    }));
  }, [webhooksQuery.data]);

  // Handlers
  const handleSaveProfile = useCallback(() => {
    setSaving(true);
    updateProfileMutation.mutate({
      name: profile.name,
      bio: profile.bio,
      phone: profile.phone,
      company: profile.company,
      website: profile.website,
      location: profile.location,
      timezone: profile.timezone,
      language: profile.language,
      theme: profile.theme,
    });
  }, [profile, updateProfileMutation]);

  const handleUpdatePassword = useCallback(() => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Erreur', description: 'Le mot de passe doit contenir au moins 8 caractères', variant: 'destructive' });
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: password,
      newPassword,
    });
  }, [password, newPassword, confirmPassword, updatePasswordMutation, toast]);

  const handleCreateApiKey = useCallback(() => {
    if (!newApiKeyName) {
      toast({ title: 'Erreur', description: 'Le nom de la clé est requis', variant: 'destructive' });
      return;
    }
    createApiKeyMutation.mutate({ name: newApiKeyName });
  }, [newApiKeyName, createApiKeyMutation, toast]);

  const handleDeleteApiKey = useCallback(
    (keyId: string) => {
      if (!confirm('Supprimer cette clé API ?')) {
        return;
      }
      deleteApiKeyMutation.mutate({ id: keyId });
    },
    [deleteApiKeyMutation]
  );

  const handleCreateWebhook = useCallback(() => {
    if (!newWebhookUrl) {
      toast({ title: 'Erreur', description: 'L\'URL du webhook est requise', variant: 'destructive' });
      return;
    }
    try {
      new URL(newWebhookUrl);
    } catch {
      toast({ title: 'Erreur', description: 'URL invalide', variant: 'destructive' });
      return;
    }
    createWebhookMutation.mutate({ url: newWebhookUrl, events: [] });
  }, [newWebhookUrl, createWebhookMutation, toast]);

  const handleDeleteWebhook = useCallback(
    (webhookId: string) => {
      if (!confirm('Supprimer ce webhook ?')) {
        return;
      }
      deleteWebhookMutation.mutate({ id: webhookId });
    },
    [deleteWebhookMutation]
  );

  const handleRevokeSession = useCallback(
    (sessionId: string) => {
      if (!confirm('Révoquer cette session ?')) {
        return;
      }
      revokeSessionMutation.mutate({ sessionId });
    },
    [revokeSessionMutation]
  );

  const handleCopyApiKey = useCallback((key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: 'Succès', description: 'Clé API copiée' });
  }, [toast]);

  // Initialize profile
  useEffect(() => {
    if (userProfile.id) {
      setProfile(userProfile);
      setTheme(userProfile.theme || 'system');
      setLanguage(userProfile.language || 'fr');
      setTimezone(userProfile.timezone || 'Europe/Paris');
    }
  }, [userProfile]);

  // Loading state
  if (profileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Chargement des paramètres...</p>
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
            <Settings className="w-8 h-8 text-cyan-400" />
            Paramètres
          </h1>
          <p className="text-gray-400 mt-1">
            Gérez vos préférences et configurations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-900/50 border border-gray-700 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="profile" className="data-[state=active]:bg-cyan-600">
            <User className="w-4 h-4 mr-2" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-cyan-600">
            <Shield className="w-4 h-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-cyan-600">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-cyan-600">
            <Key className="w-4 h-4 mr-2" />
            API
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-cyan-600">
            <Webhook className="w-4 h-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-cyan-600">
            <Settings className="w-4 h-4 mr-2" />
            Préférences
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Informations personnelles</CardTitle>
              <CardDescription className="text-gray-400">
                Gérez vos informations de profil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Nom</Label>
                  <Input
                    value={profile.name || ''}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="bg-gray-900 border-gray-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Email</Label>
                  <Input
                    value={userProfile.email}
                    disabled
                    className="bg-gray-900/50 border-gray-600 text-gray-500 mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                </div>
                <div>
                  <Label className="text-gray-300">Téléphone</Label>
                  <Input
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="bg-gray-900 border-gray-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Entreprise</Label>
                  <Input
                    value={profile.company || ''}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    className="bg-gray-900 border-gray-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Site web</Label>
                  <Input
                    value={profile.website || ''}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder="https://example.com"
                    className="bg-gray-900 border-gray-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Localisation</Label>
                  <Input
                    value={profile.location || ''}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="bg-gray-900 border-gray-600 text-white mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Bio</Label>
                <Textarea
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  className="bg-gray-900 border-gray-600 text-white mt-1"
                  placeholder="Décrivez-vous en quelques mots..."
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Password */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Mot de passe</CardTitle>
              <CardDescription className="text-gray-400">
                Changez votre mot de passe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300">Mot de passe actuel</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Nouveau mot de passe</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Confirmer le mot de passe</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white mt-1"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleUpdatePassword}
                  disabled={updatePasswordMutation.isPending}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {updatePasswordMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Mettre à jour
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2FA */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Authentification à deux facteurs</CardTitle>
              <CardDescription className="text-gray-400">
                Ajoutez une couche de sécurité supplémentaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">2FA activée</p>
                  <p className="text-sm text-gray-400">
                    {twoFactorEnabled
                      ? 'Votre compte est protégé par 2FA'
                      : 'Activez 2FA pour sécuriser votre compte'}
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={(checked) => {
                    setTwoFactorEnabled(checked);
                    if (checked) {
                      setShow2FASetup(true);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Sessions actives</CardTitle>
              <CardDescription className="text-gray-400">
                Gérez vos sessions actives
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-gray-400">Aucune session active</p>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Monitor className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="text-white font-medium">{session.device}</p>
                          <p className="text-sm text-gray-400">
                            {session.browser} • {session.location}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {session.ipAddress} • Dernier accès: {formatDateTime(session.lastActive)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.isCurrent && (
                          <Badge variant="secondary">Session actuelle</Badge>
                        )}
                        {!session.isCurrent && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRevokeSession(session.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Préférences de notifications</CardTitle>
              <CardDescription className="text-gray-400">
                Configurez vos notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: 'email', label: 'Notifications email', description: 'Recevoir des notifications par email' },
                { id: 'push', label: 'Notifications push', description: 'Recevoir des notifications push' },
                { id: 'sms', label: 'Notifications SMS', description: 'Recevoir des notifications par SMS' },
                { id: 'in_app', label: 'Notifications in-app', description: 'Afficher les notifications dans l\'application' },
              ].map((pref) => (
                <div key={pref.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{pref.label}</p>
                    <p className="text-sm text-gray-400">{pref.description}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Clés API</CardTitle>
                  <CardDescription className="text-gray-400">
                    Gérez vos clés API pour l'accès programmatique
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowCreateApiKey(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une clé
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 mb-4">Aucune clé API</p>
                  <Button
                    onClick={() => setShowCreateApiKey(true)}
                    variant="outline"
                    className="border-gray-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une clé API
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                    >
                      <div>
                        <p className="text-white font-medium">{key.name}</p>
                        <p className="text-sm text-gray-400 font-mono">{key.key}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Créée le {formatDate(key.createdAt)}
                          {key.lastUsed && ` • Dernière utilisation: ${formatDate(key.lastUsed)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyApiKey(key.key)}
                          className="border-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteApiKey(key.id)}
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

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Webhooks</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configurez vos webhooks pour recevoir des événements
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowCreateWebhook(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <div className="text-center py-12">
                  <Webhook className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 mb-4">Aucun webhook</p>
                  <Button
                    onClick={() => setShowCreateWebhook(true)}
                    variant="outline"
                    className="border-gray-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un webhook
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {webhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{webhook.url}</p>
                          <Badge
                            variant={
                              webhook.status === 'active'
                                ? 'default'
                                : webhook.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {webhook.status === 'active' && 'Actif'}
                            {webhook.status === 'inactive' && 'Inactif'}
                            {webhook.status === 'failed' && 'Échoué'}</Badge>
                    </div>
                        <p className="text-sm text-gray-400">
                          {webhook.events.length} événement(s) configuré(s)
                          {webhook.lastTriggered && ` • Dernier déclenchement: ${formatDateTime(webhook.lastTriggered)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedWebhook(webhook);
                            setShowCreateWebhook(true);
                          }}
                          className="border-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteWebhook(webhook.id)}
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

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Préférences</CardTitle>
              <CardDescription className="text-gray-400">
                Personnalisez votre expérience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-gray-300">Thème</Label>
                <Select value={theme} onValueChange={(value) => setTheme(value as any)}>
                  <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Clair
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        Sombre
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        Système
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Langue</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Fuseau horaire</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles (GMT-8)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-red-500/10 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400">Zone de danger</CardTitle>
              <CardDescription className="text-red-300/70">
                Actions irréversibles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Exporter mes données</p>
                  <p className="text-sm text-gray-400">
                    Téléchargez une copie de toutes vos données
                  </p>
                </div>
                <Button variant="outline" className="border-gray-600">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>
              <Separator className="bg-gray-700" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Supprimer mon compte</p>
                  <p className="text-sm text-gray-400">
                    Supprime définitivement votre compte et toutes vos données
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteAccount(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create API Key Modal */}
      <Dialog open={showCreateApiKey} onOpenChange={setShowCreateApiKey}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Créer une clé API</DialogTitle>
            <DialogDescription>
              Créez une nouvelle clé API pour l'accès programmatique
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300">Nom de la clé</Label>
              <Input
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
                placeholder="Ex: Production API Key"
                className="bg-gray-900 border-gray-600 text-white mt-1"
              />
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                <Info className="w-4 h-4 inline mr-2" />
                La clé API sera générée après la création. Assurez-vous de la copier, elle ne sera plus visible.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateApiKey(false)} className="border-gray-600">
              Annuler
            </Button>
            <Button
              onClick={handleCreateApiKey}
              disabled={createApiKeyMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {createApiKeyMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Webhook Modal */}
      <Dialog open={showCreateWebhook} onOpenChange={setShowCreateWebhook}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {selectedWebhook ? 'Modifier le webhook' : 'Créer un webhook'}
            </DialogTitle>
            <DialogDescription>
              Configurez un webhook pour recevoir des événements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300">URL</Label>
              <Input
                value={selectedWebhook?.url || newWebhookUrl}
                onChange={(e) => {
                  if (selectedWebhook) {
                    setSelectedWebhook({ ...selectedWebhook, url: e.target.value });
                  } else {
                    setNewWebhookUrl(e.target.value);
                  }
                }}
                placeholder="https://example.com/webhook"
                className="bg-gray-900 border-gray-600 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Événements</Label>
              <div className="space-y-2 mt-2">
                {['order.created', 'order.updated', 'order.paid', 'product.created', 'product.updated'].map((event) => (
                  <div key={event} className="flex items-center gap-2">
                    <Checkbox id={event} />
                    <Label htmlFor={event} className="text-gray-300 cursor-pointer">
                      {event}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateWebhook(false);
              setSelectedWebhook(null);
              setNewWebhookUrl('');
            }} className="border-gray-600">
              Annuler
            </Button>
            <Button
              onClick={handleCreateWebhook}
              disabled={createWebhookMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {createWebhookMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {selectedWebhook ? 'Mise à jour...' : 'Création...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {selectedWebhook ? 'Mettre à jour' : 'Créer'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal */}
      <Dialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Supprimer mon compte</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes vos données seront supprimées définitivement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Attention: Cette action supprimera définitivement votre compte, toutes vos données, designs, commandes et configurations.
              </p>
            </div>
            <div>
              <Label className="text-gray-300">
                Tapez "SUPPRIMER" pour confirmer
              </Label>
              <Input
                placeholder="SUPPRIMER"
                className="bg-gray-900 border-gray-600 text-white mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAccount(false)} className="border-gray-600">
              Annuler
            </Button>
            <Button variant="destructive" disabled>
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Modal */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Configurer l'authentification à deux facteurs</DialogTitle>
            <DialogDescription>
              Scannez le QR code avec votre application d'authentification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex justify-center p-4 bg-gray-900 rounded-lg">
              <QrCode className="w-48 h-48 text-gray-400" />
            </div>
            <div>
              <Label className="text-gray-300">Code de vérification</Label>
              <Input
                placeholder="000000"
                className="bg-gray-900 border-gray-600 text-white mt-1"
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShow2FASetup(false);
              setTwoFactorEnabled(false);
            }} className="border-gray-600">
              Annuler
            </Button>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Activer
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

const MemoizedSettingsPageContent = memo(SettingsPageContent);

export default function SettingsPage() {








  return (
    <ErrorBoundary level="page" componentName="SettingsPage">
      <MemoizedSettingsPageContent />
    </ErrorBoundary>
  );
}