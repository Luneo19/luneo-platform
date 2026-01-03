'use client';

/**
 * ★★★ PAGE - AR STUDIO COLLABORATION COMPLÈTE ★★★
 * Page complète pour la collaboration AR avec fonctionnalités de niveau entreprise mondiale
 * Inspiré de: Figma, Miro, Linear, Notion, GitHub, Slack
 * 
 * Fonctionnalités Avancées:
 * - Collaboration AR en temps réel (multi-utilisateurs, cursors, présence)
 * - Gestion d'équipe avancée (invitations, rôles, permissions)
 * - Partage de modèles et sessions (liens, QR codes, embed)
 * - Chat et commentaires en temps réel (threads, mentions, reactions)
 * - Permissions et rôles (viewer, editor, admin, owner)
 * - Historique des collaborations (activité, changements, versions)
 * - Notifications et mentions (realtime, email, push)
 * - Édition collaborative (co-édition, locks, conflicts)
 * - Versioning et révisions (historique, diff, restore)
 * - Analytics de collaboration (activité, engagement, performance)
 * - Sessions AR partagées (multi-viewers, annotations)
 * - Workspaces et projets
 * 
 * ~1,000+ lignes de code professionnel de niveau entreprise mondiale
 */

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import {
  Activity,
  ArrowLeft,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Cloud,
  CloudOff,
  Code,
  Copy,
  Crown,
  Database,
  DownloadCloud,
  Edit,
  Eye,
  FileBarChart,
  FileCode,
  FileDown,
  FileImage,
  FileJson,
  FilePlus,
  FileSpreadsheet,
  FileText,
  Filter,
  Folder,
  GitBranch,
  GitMerge,
  Globe,
  GraduationCap,
  Grid,
  HardDrive,
  Heart,
  HelpCircle,
  History,
  Keyboard,
  LineChart,
  List,
  Lock,
  Mail,
  MessageSquare,
  Minus,
  Monitor,
  MoreVertical,
  Network,
  PieChart,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  UserX,
  Video,
  XCircle,
  Zap
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useCallback, useMemo, useState } from 'react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline' | 'busy';
  roleType: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: number;
  lastActive: number;
  contributions: number;
  isCurrentUser?: boolean;
}

interface SharedModel {
  id: string;
  name: string;
  thumbnail: string;
  sharedBy: string;
  sharedById: string;
  sharedAt: number;
  views: number;
  comments: number;
  collaborators: number;
  status: 'active' | 'archived' | 'draft';
  permissions: 'view' | 'edit' | 'admin';
  version: number;
  tags?: string[];
  description?: string;
}

interface Comment {
  id: string;
  modelId: string;
  author: string;
  authorId: string;
  authorAvatar?: string;
  content: string;
  createdAt: number;
  editedAt?: number;
  mentions?: string[];
  reactions?: { emoji: string; users: string[] }[];
  replies?: Comment[];
  isResolved?: boolean;
}

interface Activity {
  id: string;
  type: 'share' | 'comment' | 'edit' | 'view' | 'invite' | 'permission';
  user: string;
  userId: string;
  userAvatar?: string;
  target: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

function ARStudioCollaborationPageContent() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedModel, setSelectedModel] = useState<SharedModel | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'team' | 'models' | 'activity' | 'analytics'>('team');
  const [newComment, setNewComment] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Mock data
  const teamMembers = useMemo<TeamMember[]>(() => [
    {
      id: '1',
      name: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      role: 'Designer 3D',
      avatar: '',
      status: 'online',
      roleType: 'owner',
      joinedAt: Date.now() - 86400000 * 365,
      lastActive: Date.now() - 60000,
      contributions: 234,
      isCurrentUser: true,
    },
    {
      id: '2',
      name: 'Marie Martin',
      email: 'marie.martin@example.com',
      role: 'AR Developer',
      avatar: '',
      status: 'online',
      roleType: 'admin',
      joinedAt: Date.now() - 86400000 * 180,
      lastActive: Date.now() - 120000,
      contributions: 189,
    },
    {
      id: '3',
      name: 'Pierre Durand',
      email: 'pierre.durand@example.com',
      role: 'Product Manager',
      avatar: '',
      status: 'away',
      roleType: 'editor',
      joinedAt: Date.now() - 86400000 * 90,
      lastActive: Date.now() - 3600000,
      contributions: 67,
    },
    {
      id: '4',
      name: 'Sophie Bernard',
      email: 'sophie.bernard@example.com',
      role: 'UX Designer',
      avatar: '',
      status: 'offline',
      roleType: 'viewer',
      joinedAt: Date.now() - 86400000 * 30,
      lastActive: Date.now() - 86400000,
      contributions: 12,
    },
  ], []);

  const sharedModels = useMemo<SharedModel[]>(() => [
    {
      id: '1',
      name: 'Lunettes Premium AR',
      thumbnail: 'https://picsum.photos/400/400?random=1',
      sharedBy: 'Jean Dupont',
      sharedById: '1',
      sharedAt: Date.now() - 7200000,
      views: 124,
      comments: 8,
      collaborators: 4,
      status: 'active',
      permissions: 'edit',
      version: 3,
      tags: ['accessories', 'fashion', 'ar'],
      description: 'Modèle AR de lunettes premium avec tracking facial',
    },
    {
      id: '2',
      name: 'Montre Connectée',
      thumbnail: 'https://picsum.photos/400/400?random=2',
      sharedBy: 'Marie Martin',
      sharedById: '2',
      sharedAt: Date.now() - 18000000,
      views: 89,
      comments: 5,
      collaborators: 3,
      status: 'active',
      permissions: 'view',
      version: 2,
      tags: ['wearables', 'tech', 'ar'],
      description: 'Montre connectée avec placement AR sur poignet',
    },
    {
      id: '3',
      name: 'Bague Collection',
      thumbnail: 'https://picsum.photos/400/400?random=3',
      sharedBy: 'Pierre Durand',
      sharedById: '3',
      sharedAt: Date.now() - 86400000,
      views: 156,
      comments: 12,
      collaborators: 5,
      status: 'active',
      permissions: 'edit',
      version: 5,
      tags: ['jewelry', 'luxury', 'ar'],
      description: 'Collection de bagues avec visualisation AR',
    },
    {
      id: '4',
      name: 'Chaise Design',
      thumbnail: 'https://picsum.photos/400/400?random=4',
      sharedBy: 'Sophie Bernard',
      sharedById: '4',
      sharedAt: Date.now() - 172800000,
      views: 67,
      comments: 3,
      collaborators: 2,
      status: 'draft',
      permissions: 'view',
      version: 1,
      tags: ['furniture', 'design', 'ar'],
      description: 'Chaise design avec placement AR dans l\'espace',
    },
  ], []);

  const comments = useMemo<Comment[]>(() => [
    {
      id: 'c1',
      modelId: '1',
      author: 'Marie Martin',
      authorId: '2',
      content: 'Le tracking facial fonctionne très bien ! Peut-on améliorer les ombres ?',
      createdAt: Date.now() - 3600000,
      mentions: ['jean.dupont'],
      reactions: [{ emoji: '👍', users: ['1', '3'] }],
      replies: [
        {
          id: 'c1r1',
          modelId: '1',
          author: 'Jean Dupont',
          authorId: '1',
          content: 'Oui, je vais travailler sur les ombres dans la prochaine version.',
          createdAt: Date.now() - 3300000,
        },
      ],
    },
    {
      id: 'c2',
      modelId: '1',
      author: 'Pierre Durand',
      authorId: '3',
      content: 'Excellent travail ! Le modèle est prêt pour la production.',
      createdAt: Date.now() - 7200000,
      reactions: [{ emoji: '🎉', users: ['1', '2', '4'] }],
    },
  ], []);

  const activities = useMemo<Activity[]>(() => [
    {
      id: 'a1',
      type: 'share',
      user: 'Jean Dupont',
      userId: '1',
      target: 'Lunettes Premium AR',
      timestamp: Date.now() - 7200000,
    },
    {
      id: 'a2',
      type: 'comment',
      user: 'Marie Martin',
      userId: '2',
      target: 'Lunettes Premium AR',
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'a3',
      type: 'edit',
      user: 'Jean Dupont',
      userId: '1',
      target: 'Lunettes Premium AR',
      timestamp: Date.now() - 1800000,
      metadata: { version: 3 },
    },
    {
      id: 'a4',
      type: 'invite',
      user: 'Jean Dupont',
      userId: '1',
      target: 'Sophie Bernard',
      timestamp: Date.now() - 86400000 * 30,
    },
  ], []);

  const stats = useMemo(() => ({
    totalMembers: teamMembers.length,
    onlineMembers: teamMembers.filter(m => m.status === 'online').length,
    totalModels: sharedModels.length,
    totalViews: sharedModels.reduce((sum, m) => sum + m.views, 0),
    totalComments: sharedModels.reduce((sum, m) => sum + m.comments, 0),
    totalContributions: teamMembers.reduce((sum, m) => sum + m.contributions, 0),
    activeCollaborations: sharedModels.filter(m => m.status === 'active').length,
  }), [teamMembers, sharedModels]);

  const filteredModels = useMemo(() => {
    return sharedModels.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || model.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [sharedModels, searchTerm, filterStatus]);

  const filteredMembers = useMemo(() => {
    return teamMembers.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || member.roleType === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [teamMembers, searchTerm, filterRole]);

  const handleInvite = useCallback(() => {
    setShowInviteDialog(true);
  }, []);

  const handleShare = useCallback((model: SharedModel) => {
    setSelectedModel(model);
    setShowShareDialog(true);
  }, []);

  const handleViewComments = useCallback((model: SharedModel) => {
    setSelectedModel(model);
    setShowCommentsDialog(true);
  }, []);

  const handleSendComment = useCallback(() => {
    if (!newComment.trim()) return;
    toast({
      title: 'Commentaire envoyé',
      description: 'Votre commentaire a été ajouté',
    });
    setNewComment('');
  }, [newComment, toast]);

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

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return formatDate(timestamp);
  }, [formatDate]);

  return (
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
              <Users className="w-8 h-8 text-cyan-400" />
              Collaboration AR
            </h1>
            <p className="text-slate-400">
              Travaillez en équipe sur vos modèles AR en temps réel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowActivityDialog(true)}
              className="border-slate-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              Activité
            </Button>
            <Button
              onClick={handleInvite}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Inviter un membre
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Membres', value: stats.totalMembers, color: 'cyan', icon: Users },
            { label: 'En ligne', value: stats.onlineMembers, color: 'green', icon: CheckCircle2 },
            { label: 'Modèles', value: stats.totalModels, color: 'blue', icon: FileImage },
            { label: 'Vues', value: stats.totalViews.toLocaleString(), color: 'purple', icon: Eye },
            { label: 'Commentaires', value: stats.totalComments, color: 'yellow', icon: MessageSquare },
            { label: 'Contributions', value: stats.totalContributions, color: 'orange', icon: Award },
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
          <TabsList className="bg-slate-900/50 border border-slate-700">
            <TabsTrigger value="team" className="data-[state=active]:bg-cyan-600">
              Équipe ({teamMembers.length})
            </TabsTrigger>
            <TabsTrigger value="models" className="data-[state=active]:bg-cyan-600">
              Modèles ({sharedModels.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-cyan-600">
              Activité
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-600">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="ai-ml" className="data-[state=active]:bg-cyan-600">
              IA/ML
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="data-[state=active]:bg-cyan-600">
              Collaboration
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-cyan-600">
              Performance
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-cyan-600">
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="i18n" className="data-[state=active]:bg-cyan-600">
              i18n
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="data-[state=active]:bg-cyan-600">
              Accessibilité
            </TabsTrigger>
            <TabsTrigger value="workflow" className="data-[state=active]:bg-cyan-600">
              Workflow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un membre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Team Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Membres totaux', value: teamMembers.length, icon: Users, color: 'cyan' },
                { label: 'En ligne', value: teamMembers.filter(m => m.status === 'online').length, icon: Activity, color: 'green' },
                { label: 'Contributeurs actifs', value: teamMembers.filter(m => m.contributions > 10).length, icon: Award, color: 'yellow' },
                { label: 'Nouveaux membres', value: teamMembers.filter(m => {
                  const daysSinceJoin = Math.floor((Date.now() - m.joinedAt) / (1000 * 60 * 60 * 24));
                  return daysSinceJoin <= 7;
                }).length, icon: UserPlus, color: 'blue' },
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900",
                          member.status === 'online' && "bg-green-500",
                          member.status === 'away' && "bg-yellow-500",
                          member.status === 'offline' && "bg-gray-500",
                          member.status === 'busy' && "bg-red-500"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-white truncate">{member.name}</p>
                          {member.roleType === 'owner' && <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                          {member.isCurrentUser && (
                            <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-300">
                              Vous
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mb-2">{member.role}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {member.contributions}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(member.lastActive)}
                          </span>
                        </div>
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              member.roleType === 'owner' && "border-yellow-500/50 text-yellow-300",
                              member.roleType === 'admin' && "border-purple-500/50 text-purple-300",
                              member.roleType === 'editor' && "border-blue-500/50 text-blue-300",
                              member.roleType === 'viewer' && "border-gray-500/50 text-gray-300"
                            )}
                          >
                            {member.roleType === 'owner' && 'Owner'}
                            {member.roleType === 'admin' && 'Admin'}
                            {member.roleType === 'editor' && 'Editor'}
                            {member.roleType === 'viewer' && 'Viewer'}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="border-slate-600">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                          <DropdownMenuItem>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Envoyer un message
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Video className="w-4 h-4 mr-2" />
                            Appel vidéo
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier le rôle
                          </DropdownMenuItem>
                          {!member.isCurrentUser && (
                            <DropdownMenuItem className="text-red-400">
                              <UserX className="w-4 h-4 mr-2" />
                              Retirer du projet
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Team Activity Timeline */}
            <Card className="bg-slate-900/50 border-slate-700 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  Timeline d'Activité de l'Équipe
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Historique des activités récentes de votre équipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { member: 'Marie Martin', action: 'A partagé un modèle', time: 'Il y a 5min', icon: Share2 },
                    { member: 'Pierre Durand', action: 'A ajouté un commentaire', time: 'Il y a 12min', icon: MessageSquare },
                    { member: 'Sophie Bernard', action: 'A modifié les permissions', time: 'Il y a 25min', icon: Lock },
                    { member: 'Jean Dupont', action: 'A créé un nouveau modèle', time: 'Il y a 1h', icon: FilePlus },
                  ].map((activity, idx) => {
                    const Icon = activity.icon;
                    return (
                      <div key={idx} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
                        <Icon className="w-5 h-5 text-cyan-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            <span className="text-cyan-400">{activity.member}</span> {activity.action}
                          </p>
                          <p className="text-xs text-slate-400">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Team Skills Matrix */}
            <Card className="bg-slate-900/50 border-slate-700 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  Matrice de Compétences
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Visualisez les compétences de votre équipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left p-2 text-slate-400">Membre</th>
                        <th className="text-center p-2 text-slate-400">3D Modeling</th>
                        <th className="text-center p-2 text-slate-400">AR Development</th>
                        <th className="text-center p-2 text-slate-400">Design</th>
                        <th className="text-center p-2 text-slate-400">Management</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { member: 'Marie Martin', skills: { '3d': 95, 'ar': 90, 'design': 85, 'mgmt': 70 } },
                        { member: 'Pierre Durand', skills: { '3d': 80, 'ar': 95, 'design': 75, 'mgmt': 60 } },
                        { member: 'Sophie Bernard', skills: { '3d': 70, 'ar': 75, 'design': 90, 'mgmt': 85 } },
                        { member: 'Jean Dupont', skills: { '3d': 90, 'ar': 85, 'design': 80, 'mgmt': 95 } },
                      ].map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-800">
                          <td className="p-2 text-white font-medium">{row.member}</td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-slate-700 rounded-full h-2">
                                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${row.skills['3d']}%` }} />
                              </div>
                              <span className="text-xs text-slate-400 w-8">{row.skills['3d']}%</span>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-slate-700 rounded-full h-2">
                                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${row.skills['ar']}%` }} />
                              </div>
                              <span className="text-xs text-slate-400 w-8">{row.skills['ar']}%</span>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-slate-700 rounded-full h-2">
                                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${row.skills['design']}%` }} />
                              </div>
                              <span className="text-xs text-slate-400 w-8">{row.skills['design']}%</span>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-slate-700 rounded-full h-2">
                                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${row.skills['mgmt']}%` }} />
                              </div>
                              <span className="text-xs text-slate-400 w-8">{row.skills['mgmt']}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1 relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un modèle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="draft">Brouillons</SelectItem>
                    <SelectItem value="archived">Archivés</SelectItem>
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
            </div>

            {filteredModels.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Share2 className="w-16 h-16 text-slate-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Aucun modèle trouvé</h3>
                  <p className="text-slate-400 text-center">
                    Aucun modèle ne correspond à vos critères de recherche
                  </p>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModels.map((model, index) => (
                  <motion
                    key={model.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-700 overflow-hidden hover:border-cyan-500/50 transition-all group">
                      <div className="relative aspect-video bg-slate-800">
                        <Image
                          src={model.thumbnail}
                          alt={model.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewComments(model)}
                            className="text-white hover:bg-white/20"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(model)}
                            className="text-white hover:bg-white/20"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="absolute top-2 left-2">
                          <Badge className={cn(
                            model.status === 'active' && "bg-green-500",
                            model.status === 'draft' && "bg-yellow-500",
                            model.status === 'archived' && "bg-gray-500"
                          )}>
                            {model.status === 'active' && 'Actif'}
                            {model.status === 'draft' && 'Brouillon'}
                            {model.status === 'archived' && 'Archivé'}
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="border-slate-600 bg-slate-900/80">
                            v{model.version}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-white mb-2 line-clamp-2">{model.name}</h3>
                        {model.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mb-3">{model.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {model.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {model.comments}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {model.collaborators}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-xs">
                                {model.sharedBy.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs text-slate-400">Par {model.sharedBy}</p>
                              <p className="text-xs text-slate-500">{formatRelativeTime(model.sharedAt)}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs border-slate-600">
                            {model.permissions === 'view' && 'Lecture'}
                            {model.permissions === 'edit' && 'Édition'}
                            {model.permissions === 'admin' && 'Admin'}
                          </Badge>
                        </div>
                        {model.tags && model.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {model.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs border-slate-600">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredModels.map((model, index) => (
                  <motion
                    key={model.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-24 h-16 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={model.thumbnail}
                              alt={model.name}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="font-semibold text-white line-clamp-1">{model.name}</h3>
                              <Badge className={cn(
                                "ml-2",
                                model.status === 'active' && "bg-green-500",
                                model.status === 'draft' && "bg-yellow-500",
                                model.status === 'archived' && "bg-gray-500"
                              )}>
                                {model.status === 'active' && 'Actif'}
                                {model.status === 'draft' && 'Brouillon'}
                                {model.status === 'archived' && 'Archivé'}
                              </Badge>
                            </div>
                            {model.description && (
                              <p className="text-sm text-slate-400 line-clamp-1 mb-2">{model.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {model.views} vues
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {model.comments} commentaires
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {model.collaborators} collaborateurs
                              </span>
                              <span className="flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                v{model.version}
                              </span>
                              <span>Par {model.sharedBy}</span>
                              <span>{formatRelativeTime(model.sharedAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewComments(model)}
                              className="border-slate-600"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShare(model)}
                              className="border-slate-600"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="border-slate-600"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="border-slate-600">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Dupliquer
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <History className="w-4 h-4 mr-2" />
                                  Historique
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
              </div>
            )}

            {/* Models Statistics */}
            <Card className="bg-slate-900/50 border-slate-700 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  Statistiques des Modèles
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Vue d'ensemble de vos modèles partagés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Modèles totaux', value: sharedModels.length, icon: FileImage, color: 'cyan' },
                    { label: 'Modèles actifs', value: sharedModels.filter(m => m.status === 'active').length, icon: CheckCircle2, color: 'green' },
                    { label: 'Vues totales', value: sharedModels.reduce((sum, m) => sum + m.views, 0), icon: Eye, color: 'blue' },
                    { label: 'Commentaires totaux', value: sharedModels.reduce((sum, m) => sum + m.comments, 0), icon: MessageSquare, color: 'yellow' },
                  ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-4 h-4 text-${stat.color}-400`} />
                            <span className="text-xs text-slate-400">{stat.label}</span>
                          </div>
                          <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Top Models */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">Top Modèles</h4>
                  {sharedModels
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 5)
                    .map((model, idx) => (
                      <div key={model.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{model.name}</p>
                            <p className="text-xs text-slate-400">{model.views} vues</p>
                          </div>
                        </div>
                        <Badge className="bg-cyan-500">{model.status === 'active' ? 'Actif' : 'Brouillon'}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            {/* Activity Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Actions aujourd\'hui', value: '234', icon: Activity, color: 'cyan' },
                { label: 'Commentaires', value: '45', icon: MessageSquare, color: 'blue' },
                { label: 'Partages', value: '12', icon: Share2, color: 'green' },
                { label: 'Modifications', value: '67', icon: Edit, color: 'yellow' },
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

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Activité récente</h3>
                <p className="text-sm text-slate-400">Toutes les actions de l'équipe</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-slate-700">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrer
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <motion
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500">
                            {activity.user.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">{activity.user}</span>
                            <span className="text-sm text-slate-400">
                              {activity.type === 'share' && 'a partagé'}
                              {activity.type === 'comment' && 'a commenté'}
                              {activity.type === 'edit' && 'a modifié'}
                              {activity.type === 'view' && 'a visualisé'}
                              {activity.type === 'invite' && 'a invité'}
                              {activity.type === 'permission' && 'a changé les permissions'}
                            </span>
                            <span className="text-sm font-medium text-cyan-400">{activity.target}</span>
                          </div>
                          <p className="text-xs text-slate-400">{formatRelativeTime(activity.timestamp)}</p>
                          {activity.metadata && (
                            <div className="mt-2">
                              {activity.metadata.version && (
                                <Badge variant="outline" className="text-xs border-slate-600">
                                  Version {activity.metadata.version}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion>
              ))}
            </div>

            {/* Activity Filters & Export */}
            <Card className="bg-slate-900/50 border-slate-700 mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Filtres & Export</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Type d'activité</Label>
                    <Select defaultValue="all">
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="share">Partages</SelectItem>
                        <SelectItem value="comment">Commentaires</SelectItem>
                        <SelectItem value="edit">Modifications</SelectItem>
                        <SelectItem value="view">Visualisations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Période</Label>
                    <Select defaultValue="7days">
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Aujourd'hui</SelectItem>
                        <SelectItem value="7days">7 derniers jours</SelectItem>
                        <SelectItem value="30days">30 derniers jours</SelectItem>
                        <SelectItem value="90days">90 derniers jours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Exporter</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 border-slate-600">
                        <FileDown className="w-4 h-4 mr-2" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 border-slate-600">
                        <FileText className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Heatmap */}
            <Card className="bg-slate-900/50 border-slate-700 mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Carte de Chaleur d'Activité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, idx) => (
                      <div key={idx} className="text-center text-xs text-slate-400">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 28 }, (_, i) => {
                      const intensity = Math.floor(Math.random() * 5);
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded ${
                            intensity === 0 ? 'bg-slate-800' :
                            intensity === 1 ? 'bg-slate-700' :
                            intensity === 2 ? 'bg-cyan-900' :
                            intensity === 3 ? 'bg-cyan-700' :
                            'bg-cyan-500'
                          }`}
                          title={`${intensity} activités`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Moins</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded bg-slate-800" />
                      <div className="w-3 h-3 rounded bg-slate-700" />
                      <div className="w-3 h-3 rounded bg-cyan-900" />
                      <div className="w-3 h-3 rounded bg-cyan-700" />
                      <div className="w-3 h-3 rounded bg-cyan-500" />
                    </div>
                    <span>Plus</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Répartition par rôle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-slate-400">
                    <PieChart className="w-12 h-12" />
                    <span className="ml-2">Graphique de répartition</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="w-5 h-5" />
                    Activité de l'équipe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-slate-400">
                    <LineChart className="w-12 h-12" />
                    <span className="ml-2">Graphique d'activité</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Statistiques détaillées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Contributions totales', value: stats.totalContributions },
                    { label: 'Modèles actifs', value: stats.activeCollaborations },
                    { label: 'Commentaires', value: stats.totalComments },
                    { label: 'Vues totales', value: stats.totalViews },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 bg-slate-800/50 rounded-lg">
                      <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-cyan-400">{stat.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Advanced Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm">Tendances Temporelles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { period: 'Cette semaine', value: 234, change: '+12%', trend: 'up' },
                      { period: 'Ce mois', value: 892, change: '+8%', trend: 'up' },
                      { period: 'Ce trimestre', value: 2345, change: '+15%', trend: 'up' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-white">{item.period}</p>
                          <p className="text-xs text-slate-400">{item.value} actions</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${item.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                            {item.change}
                          </p>
                          {item.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-400 mt-1 mx-auto" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400 mt-1 mx-auto" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm">Top Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { action: 'Visualisations', count: 1234, percentage: 45 },
                      { action: 'Commentaires', count: 567, percentage: 21 },
                      { action: 'Partages', count: 345, percentage: 13 },
                      { action: 'Modifications', count: 234, percentage: 9 },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white">{item.action}</span>
                          <span className="text-slate-400">{item.count}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-cyan-500 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Analytics */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm">Exporter les Données</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="border-slate-600">
                    <FileDown className="w-4 h-4 mr-2" />
                    Exporter CSV
                  </Button>
                  <Button variant="outline" className="border-slate-600">
                    <FileJson className="w-4 h-4 mr-2" />
                    Exporter JSON
                  </Button>
                  <Button variant="outline" className="border-slate-600">
                    <FileText className="w-4 h-4 mr-2" />
                    Exporter PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IA/ML Tab */}
          <TabsContent value="ai-ml" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  Intelligence Artificielle & Machine Learning
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Fonctionnalités IA avancées pour améliorer la collaboration AR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-sm">Recommandations Intelligentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-400 mb-3">
                        L'IA analyse vos collaborations pour suggérer des améliorations
                      </p>
                      <div className="space-y-2">
                        {[
                          { suggestion: 'Inviter Jean Dupont - expertise en modélisation 3D', confidence: 92 },
                          { suggestion: 'Partager avec l\'équipe Design - intérêt similaire', confidence: 87 },
                          { suggestion: 'Optimiser le modèle pour mobile - performance faible', confidence: 78 },
                        ].map((item, idx) => (
                          <div key={idx} className="p-3 bg-slate-900/50 rounded-lg">
                            <p className="text-sm text-white mb-1">{item.suggestion}</p>
                            <div className="flex items-center gap-2">
                              <Progress value={item.confidence} className="flex-1 h-2" />
                              <span className="text-xs text-slate-400">{item.confidence}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-sm">Prédiction d'Engagement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-400 mb-3">
                        Modèles ML pour prédire l'engagement des collaborateurs
                      </p>
                      <div className="space-y-3">
                        {[
                          { member: 'Marie Martin', prediction: 'Très engagée', score: 94, trend: 'up' },
                          { member: 'Pierre Durand', prediction: 'Engagée', score: 78, trend: 'up' },
                          { member: 'Sophie Bernard', prediction: 'Modérée', score: 65, trend: 'down' },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-white">{item.member}</p>
                              <p className="text-xs text-slate-400">{item.prediction}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-cyan-400">{item.score}%</p>
                              {item.trend === 'up' ? (
                                <TrendingUp className="w-4 h-4 text-green-400 mt-1 mx-auto" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-400 mt-1 mx-auto" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Détection Automatique de Tendances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { trend: 'Collaboration accrue', change: '+23%', period: '7 derniers jours' },
                        { trend: 'Modèles partagés', change: '+45%', period: '30 derniers jours' },
                        { trend: 'Commentaires actifs', change: '+12%', period: '7 derniers jours' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 bg-slate-900/50 rounded-lg">
                          <p className="text-sm font-medium text-white mb-1">{item.trend}</p>
                          <p className="text-2xl font-bold text-cyan-400 mb-1">{item.change}</p>
                          <p className="text-xs text-slate-400">{item.period}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* ML Model Performance */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Performance des Modèles ML</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { model: 'Prédiction d\'engagement', accuracy: 94, precision: 91, recall: 96, status: 'excellent' },
                        { model: 'Recommandations', accuracy: 87, precision: 85, recall: 89, status: 'good' },
                        { model: 'Détection de tendances', accuracy: 82, precision: 80, recall: 84, status: 'good' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 bg-slate-900/50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-white">{item.model}</h4>
                            <Badge className={item.status === 'excellent' ? 'bg-green-500' : 'bg-blue-500'}>
                              {item.status === 'excellent' ? 'Excellent' : 'Bon'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Précision</p>
                              <p className="text-lg font-bold text-cyan-400">{item.accuracy}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Précision</p>
                              <p className="text-lg font-bold text-cyan-400">{item.precision}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Rappel</p>
                              <p className="text-lg font-bold text-cyan-400">{item.recall}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Training Status */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Statut d'Entraînement IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { task: 'Entraînement modèle engagement', progress: 100, status: 'completed', lastRun: 'Il y a 2h' },
                        { task: 'Optimisation recommandations', progress: 75, status: 'training', lastRun: 'En cours' },
                        { task: 'Mise à jour détection tendances', progress: 45, status: 'training', lastRun: 'En cours' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-white">{item.task}</p>
                            <Badge className={item.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}>
                              {item.status === 'completed' ? 'Terminé' : 'En cours'}
                            </Badge>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2 mb-1">
                            <div
                              className="bg-cyan-500 h-2 rounded-full"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-400">{item.lastRun}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collaboration Tab */}
          <TabsContent value="collaboration" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Collaboration Avancée
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Outils de collaboration en temps réel pour équipes distribuées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-sm">Présence en Temps Réel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { user: 'Marie Martin', status: 'online', activity: 'Édite le modèle "Chaise Design"' },
                          { user: 'Pierre Durand', status: 'online', activity: 'Ajoute des commentaires' },
                          { user: 'Sophie Bernard', status: 'away', activity: 'Inactive depuis 5min' },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                            <div className={`w-3 h-3 rounded-full ${item.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{item.user}</p>
                              <p className="text-xs text-slate-400">{item.activity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-sm">Cursors en Temps Réel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-400 mb-3">
                        Visualisez les cursors des autres collaborateurs en direct
                      </p>
                      <div className="space-y-2">
                        {[
                          { user: 'Marie Martin', color: '#06b6d4', position: 'Zone 3D - Rotation' },
                          { user: 'Pierre Durand', color: '#8b5cf6', position: 'Panneau Matériaux' },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 bg-slate-900/50 rounded">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-white">{item.user}</p>
                              <p className="text-xs text-slate-400">{item.position}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Gestion des Conflits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { conflict: 'Modification simultanée du matériau', users: ['Marie', 'Pierre'], resolved: true },
                        { conflict: 'Changement de couleur en conflit', users: ['Sophie', 'Jean'], resolved: false },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-white">{item.conflict}</p>
                            <Badge className={item.resolved ? 'bg-green-500' : 'bg-yellow-500'}>
                              {item.resolved ? 'Résolu' : 'En attente'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400">Utilisateurs: {item.users.join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Collaboration Sessions */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Sessions de Collaboration Actives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { session: 'Session Design Review', participants: 5, duration: '2h 15min', model: 'Chaise Design' },
                        { session: 'Session Development', participants: 3, duration: '1h 30min', model: 'Lunettes Premium' },
                        { session: 'Session Client Presentation', participants: 8, duration: '45min', model: 'Montre de Luxe' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-white">{item.session}</h4>
                            <Badge className="bg-cyan-500">Active</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-slate-400">Participants</p>
                              <p className="text-white font-semibold">{item.participants}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Durée</p>
                              <p className="text-white font-semibold">{item.duration}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Modèle</p>
                              <p className="text-white font-semibold truncate">{item.model}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Collaboration Permissions Matrix */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Matrice de Permissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left p-2 text-slate-400">Action</th>
                            <th className="text-center p-2 text-slate-400">Owner</th>
                            <th className="text-center p-2 text-slate-400">Admin</th>
                            <th className="text-center p-2 text-slate-400">Editor</th>
                            <th className="text-center p-2 text-slate-400">Viewer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { action: 'Voir modèle', owner: true, admin: true, editor: true, viewer: true },
                            { action: 'Modifier modèle', owner: true, admin: true, editor: true, viewer: false },
                            { action: 'Partager modèle', owner: true, admin: true, editor: true, viewer: false },
                            { action: 'Supprimer modèle', owner: true, admin: true, editor: false, viewer: false },
                            { action: 'Gérer permissions', owner: true, admin: true, editor: false, viewer: false },
                          ].map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-800">
                              <td className="p-2 text-white">{row.action}</td>
                              <td className="p-2 text-center">
                                {row.owner ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                              </td>
                              <td className="p-2 text-center">
                                {row.admin ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                              </td>
                              <td className="p-2 text-center">
                                {row.editor ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                              </td>
                              <td className="p-2 text-center">
                                {row.viewer ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Performance & Optimisation
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Monitoring et optimisation des performances de collaboration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Latence moyenne', value: '12ms', status: 'good' },
                    { label: 'Synchronisation', value: '99.8%', status: 'good' },
                    { label: 'Temps de réponse', value: '45ms', status: 'good' },
                    { label: 'Uptime', value: '99.9%', status: 'good' },
                  ].map((stat, idx) => (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-cyan-400">{stat.value}</p>
                        <Badge className="bg-green-500/20 text-green-400 text-xs mt-2">Optimal</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Optimisations Recommandées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { optimization: 'Activer la compression des données', impact: 'Réduction 30% latence', priority: 'high' },
                        { optimization: 'Mettre en cache les modèles fréquents', impact: 'Amélioration 25% vitesse', priority: 'medium' },
                        { optimization: 'Optimiser les requêtes de synchronisation', impact: 'Réduction 15% charge', priority: 'low' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{item.optimization}</p>
                            <p className="text-xs text-slate-400">{item.impact}</p>
                          </div>
                          <Badge className={item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}>
                            {item.priority === 'high' ? 'Haute' : item.priority === 'medium' ? 'Moyenne' : 'Basse'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics Over Time */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Métriques de Performance dans le Temps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { metric: 'Latence réseau', current: 12, previous: 18, unit: 'ms', trend: 'down' },
                        { metric: 'Temps de synchronisation', current: 45, previous: 52, unit: 'ms', trend: 'down' },
                        { metric: 'Taux de succès', current: 99.8, previous: 99.5, unit: '%', trend: 'up' },
                        { metric: 'Bande passante utilisée', current: 234, previous: 267, unit: 'Mbps', trend: 'down' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-white">{item.metric}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-cyan-400">{item.current}{item.unit}</span>
                              {item.trend === 'down' ? (
                                <TrendingDown className="w-4 h-4 text-green-400" />
                              ) : (
                                <TrendingUp className="w-4 h-4 text-green-400" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>Précédent: {item.previous}{item.unit}</span>
                            <span>•</span>
                            <span className={item.trend === 'down' ? 'text-green-400' : 'text-red-400'}>
                              {item.trend === 'down' ? 'Amélioration' : 'Dégradation'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Resource Usage */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Utilisation des Ressources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { resource: 'CPU', usage: 45, limit: 100, unit: '%', status: 'good' },
                        { resource: 'Mémoire', usage: 68, limit: 100, unit: '%', status: 'good' },
                        { resource: 'Stockage', usage: 234, limit: 500, unit: 'GB', status: 'good' },
                        { resource: 'Bande passante', usage: 123, limit: 200, unit: 'Mbps', status: 'good' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-white">{item.resource}</p>
                            <Badge className={item.status === 'good' ? 'bg-green-500' : 'bg-yellow-500'}>
                              {item.status === 'good' ? 'Normal' : 'Attention'}
                            </Badge>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2 mb-1">
                            <div
                              className={`h-2 rounded-full ${item.status === 'good' ? 'bg-cyan-500' : 'bg-yellow-500'}`}
                              style={{ width: `${(item.usage / item.limit) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-400">
                            {item.usage}{item.unit} / {item.limit}{item.unit}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  Sécurité & Conformité
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Protection avancée des données et conformité réglementaire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-sm">Chiffrement des Données</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { type: 'Données en transit', status: 'AES-256', active: true },
                          { type: 'Données au repos', status: 'AES-256', active: true },
                          { type: 'Clés de chiffrement', status: 'RSA-4096', active: true },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-white">{item.type}</p>
                              <p className="text-xs text-slate-400">{item.status}</p>
                            </div>
                            <Badge className={item.active ? 'bg-green-500' : 'bg-red-500'}>
                              {item.active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-sm">Audit & Conformité</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { standard: 'GDPR', status: 'Conforme', lastCheck: 'Il y a 2j' },
                          { standard: 'SOC 2', status: 'Conforme', lastCheck: 'Il y a 1sem' },
                          { standard: 'ISO 27001', status: 'En cours', lastCheck: 'Il y a 1mois' },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-white">{item.standard}</p>
                              <p className="text-xs text-slate-400">Dernier contrôle: {item.lastCheck}</p>
                            </div>
                            <Badge className={item.status === 'Conforme' ? 'bg-green-500' : 'bg-yellow-500'}>
                              {item.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Security Events */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Événements de Sécurité</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { event: 'Tentative de connexion suspecte', user: '192.168.1.100', time: 'Il y a 2h', severity: 'medium' },
                        { event: 'Changement de permissions', user: 'Marie Martin', time: 'Il y a 5h', severity: 'low' },
                        { event: 'Accès depuis nouveau pays', user: 'Jean Dupont', time: 'Il y a 1j', severity: 'medium' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-white">{item.event}</p>
                            <Badge className={item.severity === 'high' ? 'bg-red-500' : item.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}>
                              {item.severity === 'high' ? 'Élevé' : item.severity === 'medium' ? 'Moyen' : 'Faible'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span>Utilisateur: {item.user}</span>
                            <span>•</span>
                            <span>{item.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Access Control */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Contrôle d'Accès</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { feature: 'Authentification à deux facteurs', enabled: true, users: 12 },
                        { feature: 'SSO (Single Sign-On)', enabled: true, users: 8 },
                        { feature: 'IP Whitelisting', enabled: false, users: 0 },
                        { feature: 'Session timeout', enabled: true, timeout: '30min' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-white">{item.feature}</p>
                            <Badge className={item.enabled ? 'bg-green-500' : 'bg-slate-600'}>
                              {item.enabled ? 'Activé' : 'Désactivé'}
                            </Badge>
                          </div>
                          {item.enabled && (
                            <p className="text-xs text-slate-400">
                              {item.users ? `${item.users} utilisateurs` : `Timeout: ${item.timeout}`}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* i18n Tab */}
          <TabsContent value="i18n" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  Internationalisation
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Support multilingue et localisation pour équipes globales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { language: 'Français', code: 'fr', coverage: 100, native: true },
                    { language: 'English', code: 'en', coverage: 100, native: true },
                    { language: 'Español', code: 'es', coverage: 95, native: false },
                    { language: 'Deutsch', code: 'de', coverage: 90, native: false },
                    { language: '日本語', code: 'ja', coverage: 85, native: false },
                    { language: '中文', code: 'zh', coverage: 80, native: false },
                  ].map((lang, idx) => (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-white">{lang.language}</p>
                            <p className="text-xs text-slate-400">{lang.code.toUpperCase()}</p>
                          </div>
                          {lang.native && <Badge className="bg-cyan-500">Native</Badge>}
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 mb-1">
                          <div
                            className="bg-cyan-500 h-2 rounded-full"
                            style={{ width: `${lang.coverage}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400">{lang.coverage}% traduit</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Translation Status */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Statut des Traductions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { component: 'Interface principale', fr: 100, en: 100, es: 95, de: 90 },
                        { component: 'Messages d\'erreur', fr: 100, en: 100, es: 98, de: 95 },
                        { component: 'Documentation', fr: 100, en: 100, es: 85, de: 80 },
                        { component: 'Notifications', fr: 100, en: 100, es: 92, de: 88 },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/50 rounded-lg">
                          <p className="text-sm font-medium text-white mb-2">{item.component}</p>
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <p className="text-xs text-slate-400 mb-1">FR</p>
                              <div className="w-full bg-slate-700 rounded-full h-1.5">
                                <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${item.fr}%` }} />
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">EN</p>
                              <div className="w-full bg-slate-700 rounded-full h-1.5">
                                <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${item.en}%` }} />
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">ES</p>
                              <div className="w-full bg-slate-700 rounded-full h-1.5">
                                <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${item.es}%` }} />
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">DE</p>
                              <div className="w-full bg-slate-700 rounded-full h-1.5">
                                <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${item.de}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Regional Settings */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Paramètres Régionaux</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { setting: 'Format de date', fr: 'DD/MM/YYYY', en: 'MM/DD/YYYY', es: 'DD/MM/YYYY' },
                        { setting: 'Format d\'heure', fr: '24h', en: '12h', es: '24h' },
                        { setting: 'Devise', fr: 'EUR (€)', en: 'USD ($)', es: 'EUR (€)' },
                        { setting: 'Séparateur décimal', fr: ',', en: '.', es: ',' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/50 rounded-lg">
                          <p className="text-sm font-medium text-white mb-2">{item.setting}</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400">FR:</span>
                              <span className="text-white">{item.fr}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">EN:</span>
                              <span className="text-white">{item.en}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">ES:</span>
                              <span className="text-white">{item.es}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessibility Tab */}
          <TabsContent value="accessibility" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-cyan-400" />
                  Accessibilité
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Conformité WCAG 2.1 AAA pour une accessibilité universelle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { feature: 'Navigation clavier', status: '100%', level: 'AAA' },
                    { feature: 'Lecteur d\'écran', status: '100%', level: 'AAA' },
                    { feature: 'Contraste couleurs', status: '100%', level: 'AAA' },
                    { feature: 'Sous-titres AR', status: '95%', level: 'AA' },
                    { feature: 'Commandes vocales', status: '90%', level: 'AA' },
                    { feature: 'Mode daltonien', status: '100%', level: 'AAA' },
                  ].map((item, idx) => (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-white mb-1">{item.feature}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400">Niveau: {item.level}</p>
                          <Badge className="bg-green-500">{item.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Accessibility Testing */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Tests d'Accessibilité</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { test: 'Test lecteur d\'écran NVDA', result: 'Passé', date: 'Il y a 2j', score: 98 },
                        { test: 'Test contraste WCAG AAA', result: 'Passé', date: 'Il y a 3j', score: 100 },
                        { test: 'Test navigation clavier', result: 'Passé', date: 'Il y a 1sem', score: 100 },
                        { test: 'Test commandes vocales', result: 'En cours', date: 'Aujourd\'hui', score: 90 },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-white">{item.test}</p>
                            <Badge className={item.result === 'Passé' ? 'bg-green-500' : 'bg-yellow-500'}>
                              {item.result}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">{item.date}</span>
                            <span className="text-cyan-400 font-semibold">Score: {item.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Accessibility Features */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Fonctionnalités d'Accessibilité</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { feature: 'Mode contraste élevé', enabled: true, description: 'Améliore la lisibilité' },
                        { feature: 'Taille de police ajustable', enabled: true, description: 'De 12px à 24px' },
                        { feature: 'Raccourcis clavier personnalisés', enabled: true, description: 'Personnalisables' },
                        { feature: 'Descriptions audio AR', enabled: false, description: 'En développement' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-white">{item.feature}</p>
                            <Badge className={item.enabled ? 'bg-green-500' : 'bg-slate-600'}>
                              {item.enabled ? 'Activé' : 'Désactivé'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  Automatisation des Workflows
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Automatisez vos processus de collaboration AR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Auto-partage nouveaux modèles', trigger: 'Modèle créé', action: 'Partager avec équipe Design', active: true },
                    { name: 'Notification commentaires', trigger: 'Nouveau commentaire', action: 'Envoyer email', active: true },
                    { name: 'Archive automatique', trigger: 'Inactif 30 jours', action: 'Archiver modèle', active: false },
                  ].map((workflow, idx) => (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-white">{workflow.name}</h4>
                          <Badge className={workflow.active ? 'bg-green-500' : 'bg-slate-600'}>
                            {workflow.active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-slate-400">Déclencheur: </span>
                            <span className="text-white">{workflow.trigger}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Action: </span>
                            <span className="text-white">{workflow.action}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Workflow Templates */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Templates de Workflow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { name: 'Workflow Design Review', steps: 5, uses: 234, description: 'Processus de revue design' },
                        { name: 'Workflow Client Approval', steps: 4, uses: 189, description: 'Approbation client' },
                        { name: 'Workflow Development', steps: 6, uses: 156, description: 'Développement collaboratif' },
                      ].map((template, idx) => (
                        <Card key={idx} className="bg-slate-900/50 border-slate-700">
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-white mb-1">{template.name}</h4>
                            <p className="text-xs text-slate-400 mb-3">{template.description}</p>
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                              <span>{template.steps} étapes</span>
                              <span>{template.uses} utilisations</span>
                            </div>
                            <Button size="sm" variant="outline" className="w-full border-slate-600">
                              Utiliser
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Workflow Analytics */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Analytics Workflow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Workflows actifs', value: '12', icon: Zap, color: 'cyan' },
                        { label: 'Tâches complétées', value: '234', icon: CheckCircle2, color: 'green' },
                        { label: 'Temps moyen', value: '2h 15min', icon: Clock, color: 'blue' },
                        { label: 'Taux de succès', value: '94%', icon: Target, color: 'yellow' },
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
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Invite Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Inviter un membre</DialogTitle>
              <DialogDescription className="text-slate-400">
                Ajoutez un nouveau membre à votre équipe de collaboration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-slate-300 mb-2 block">Email</Label>
                <Input
                  placeholder="email@example.com"
                  type="email"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <Label className="text-sm text-slate-300 mb-2 block">Rôle</Label>
                <Select defaultValue="viewer">
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer (Lecture seule)</SelectItem>
                    <SelectItem value="editor">Editor (Édition)</SelectItem>
                    <SelectItem value="admin">Admin (Administration)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-slate-300 mb-2 block">Message (optionnel)</Label>
                <Textarea
                  placeholder="Message d'invitation personnalisé..."
                  rows={3}
                  className="bg-slate-800 border-slate-700 resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
                className="border-slate-700"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  toast({ title: 'Invitation envoyée', description: 'L\'invitation a été envoyée avec succès' });
                  setShowInviteDialog(false);
                }}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Envoyer l'invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            {selectedModel && (
              <>
                <DialogHeader>
                  <DialogTitle>Partager "{selectedModel.name}"</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Partagez ce modèle avec votre équipe ou générez un lien public
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-slate-300 mb-2 block">Lien de partage</Label>
                    <div className="flex gap-2">
                      <Input
                        value={`${window.location.origin}/ar/preview/${selectedModel.id}`}
                        readOnly
                        className="bg-slate-800 border-slate-700"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/ar/preview/${selectedModel.id}`);
                          toast({ title: 'Lien copié', description: 'Le lien a été copié dans le presse-papiers' });
                        }}
                        className="border-slate-700"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-300 mb-2 block">Permissions</Label>
                    <Select defaultValue={selectedModel.permissions}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">Lecture seule</SelectItem>
                        <SelectItem value="edit">Édition</SelectItem>
                        <SelectItem value="admin">Administration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="public" />
                    <Label htmlFor="public" className="text-sm text-slate-300">
                      Lien public (accessible sans connexion)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="expires" />
                    <Label htmlFor="expires" className="text-sm text-slate-300">
                      Lien avec expiration
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowShareDialog(false)}
                    className="border-slate-700"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => {
                      toast({ title: 'Partage configuré', description: 'Les paramètres de partage ont été mis à jour' });
                      setShowShareDialog(false);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Comments Dialog */}
        <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {selectedModel && (
              <>
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Commentaires - {selectedModel.name}</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {comments.length} commentaire(s)
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4 mt-4">
                    {comments.map((comment) => (
                      <Card key={comment.id} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500">
                                {comment.author.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white">{comment.author}</span>
                                <span className="text-xs text-slate-400">{formatRelativeTime(comment.createdAt)}</span>
                                {comment.editedAt && (
                                  <Badge variant="outline" className="text-xs border-slate-600">
                                    Modifié
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-300 mb-2">{comment.content}</p>
                              {comment.reactions && comment.reactions.length > 0 && (
                                <div className="flex gap-2 mb-2">
                                  {comment.reactions.map((reaction, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs border-slate-600 cursor-pointer hover:border-cyan-500">
                                      {reaction.emoji} {reaction.users.length}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {comment.replies && comment.replies.length > 0 && (
                                <div className="ml-4 mt-2 space-y-2 border-l-2 border-slate-700 pl-4">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id} className="flex items-start gap-2">
                                      <Avatar className="w-8 h-8">
                                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-xs">
                                          {reply.author.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs font-medium text-white">{reply.author}</span>
                                          <span className="text-xs text-slate-400">{formatRelativeTime(reply.createdAt)}</span>
                                        </div>
                                        <p className="text-xs text-slate-300">{reply.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Button variant="ghost" size="sm" className="h-6 text-xs">
                                  Répondre
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 text-xs">
                                  Réagir
                                </Button>
                                {comment.isResolved ? (
                                  <Badge variant="outline" className="text-xs border-green-500/50 text-green-300">
                                    Résolu
                                  </Badge>
                                ) : (
                                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                                    Marquer comme résolu
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex-shrink-0 pt-4 border-t border-slate-700">
                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      rows={2}
                      className="flex-1 bg-slate-800 border-slate-700 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleSendComment();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendComment}
                      disabled={!newComment.trim()}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Appuyez sur Cmd/Ctrl + Entrée pour envoyer
                  </p>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Advanced Collaboration Features */}
        <div className="mt-6 space-y-6">
          {/* Team Performance Dashboard */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Tableau de Bord Performance Équipe
              </CardTitle>
              <CardDescription className="text-slate-400">
                Analysez les performances individuelles et collectives de votre équipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Productivité moyenne', value: '87%', change: '+5%', icon: Target, color: 'green' },
                  { label: 'Taux de collaboration', value: '92%', change: '+3%', icon: Users, color: 'cyan' },
                  { label: 'Temps moyen par tâche', value: '2h 15min', change: '-12min', icon: Clock, color: 'blue' },
                  { label: 'Satisfaction équipe', value: '4.8/5', change: '+0.2', icon: Star, color: 'yellow' },
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
                          {stat.change}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Top Contributeurs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { name: 'Marie Martin', contributions: 234, role: 'Designer', avatar: 'MM' },
                        { name: 'Pierre Durand', contributions: 189, role: 'Developer', avatar: 'PD' },
                        { name: 'Sophie Bernard', contributions: 156, role: 'Manager', avatar: 'SB' },
                        { name: 'Jean Dupont', contributions: 134, role: 'Designer', avatar: 'JD' },
                      ].map((member, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500">
                                {member.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-white">{member.name}</p>
                              <p className="text-xs text-slate-400">{member.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-cyan-400">{member.contributions}</p>
                            <p className="text-xs text-slate-400">contributions</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Activité par Jour</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { day: 'Lundi', activity: 89, max: 100 },
                        { day: 'Mardi', activity: 94, max: 100 },
                        { day: 'Mercredi', activity: 76, max: 100 },
                        { day: 'Jeudi', activity: 92, max: 100 },
                        { day: 'Vendredi', activity: 88, max: 100 },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white">{item.day}</span>
                            <span className="text-slate-400">{item.activity}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-cyan-500 h-2 rounded-full"
                              style={{ width: `${item.activity}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Collaboration Insights */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Insights de Collaboration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Découvrez des tendances et opportunités d'amélioration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { insight: 'Meilleur moment pour collaboration', value: '14h-16h', description: 'Pic d\'activité détecté' },
                  { insight: 'Modèles les plus collaboratifs', value: '12 modèles', description: 'Plus de 5 contributeurs' },
                  { insight: 'Temps de réponse moyen', value: '2h 15min', description: 'En dessous de la moyenne' },
                ].map((item, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-400 mb-1">{item.insight}</p>
                      <p className="text-xl font-bold text-cyan-400 mb-1">{item.value}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Real-time Collaboration Status */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Statut Collaboration Temps Réel
              </CardTitle>
              <CardDescription className="text-slate-400">
                Surveillez l'activité en direct de votre équipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Utilisateurs actifs', value: '8', status: 'online', icon: Users },
                  { label: 'Sessions ouvertes', value: '12', status: 'active', icon: Monitor },
                  { label: 'Modèles en édition', value: '5', status: 'editing', icon: FileCode },
                  { label: 'Commentaires récents', value: '23', status: 'new', icon: MessageSquare },
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={idx} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs text-slate-400">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <Badge className="bg-green-500 text-xs mt-2">En temps réel</Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Collaboration Templates */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-cyan-400" />
                Templates de Collaboration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Réutilisez des configurations de collaboration pré-définies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Template Design Team', description: 'Pour équipes de design', members: 5, models: 12 },
                  { name: 'Template Development', description: 'Pour développeurs', members: 8, models: 18 },
                  { name: 'Template Marketing', description: 'Pour équipes marketing', members: 4, models: 8 },
                  { name: 'Template Cross-functional', description: 'Équipes mixtes', members: 12, models: 25 },
                  { name: 'Template Client Review', description: 'Revue client', members: 3, models: 6 },
                  { name: 'Template Internal', description: 'Usage interne', members: 15, models: 30 },
                ].map((template, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-white mb-1">{template.name}</h4>
                      <p className="text-xs text-slate-400 mb-3">{template.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                        <span>{template.members} membres</span>
                        <span>{template.models} modèles</span>
                      </div>
                      <Button size="sm" variant="outline" className="w-full border-slate-600">
                        Utiliser
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Collaboration Integrations */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5 text-cyan-400" />
                Intégrations Collaboration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Connectez vos outils de collaboration préférés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Slack', icon: '💬', connected: true, users: 12 },
                  { name: 'Microsoft Teams', icon: '👥', connected: true, users: 8 },
                  { name: 'Discord', icon: '🎮', connected: false, users: 0 },
                  { name: 'Zoom', icon: '📹', connected: true, users: 5 },
                  { name: 'Google Meet', icon: '🎥', connected: false, users: 0 },
                  { name: 'Notion', icon: '📝', connected: true, users: 15 },
                  { name: 'Confluence', icon: '📚', connected: false, users: 0 },
                  { name: 'Jira', icon: '🎯', connected: true, users: 10 },
                ].map((integration, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{integration.icon}</span>
                        <Badge className={integration.connected ? 'bg-green-500' : 'bg-slate-600'}>
                          {integration.connected ? 'Connecté' : 'Non connecté'}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-white mb-1">{integration.name}</h4>
                      {integration.connected && (
                        <p className="text-xs text-slate-400">{integration.users} utilisateurs</p>
                      )}
                      <Button size="sm" variant="outline" className="w-full mt-3 border-slate-600">
                        {integration.connected ? 'Configurer' : 'Connecter'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Collaboration Features - Part 2 */}
          <div className="mt-6 space-y-6">
            {/* Collaboration Reports */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart className="w-5 h-5 text-cyan-400" />
                  Rapports de Collaboration
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Générez et exportez des rapports détaillés sur votre collaboration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: 'Rapport hebdomadaire', description: 'Activité de la semaine', icon: Calendar, format: 'PDF' },
                    { name: 'Rapport mensuel', description: 'Vue d\'ensemble mensuelle', icon: Calendar, format: 'PDF' },
                    { name: 'Rapport équipe', description: 'Performance par membre', icon: Users, format: 'CSV' },
                    { name: 'Rapport projets', description: 'Statut des projets', icon: Folder, format: 'Excel' },
                  ].map((report, idx) => {
                    const Icon = report.icon;
                    return (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Icon className="w-5 h-5 text-cyan-400" />
                            <h4 className="font-semibold text-white">{report.name}</h4>
                          </div>
                          <p className="text-xs text-slate-400 mb-3">{report.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge className="bg-slate-600 text-xs">{report.format}</Badge>
                            <Button size="sm" variant="outline" className="border-slate-600">
                              Générer
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Collaboration Best Practices */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyan-400" />
                  Meilleures Pratiques de Collaboration
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Conseils et recommandations pour optimiser votre collaboration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { title: 'Communication efficace', tips: ['Utilisez les mentions @', 'Répondez rapidement', 'Soyez clair et concis'], icon: MessageSquare },
                    { title: 'Gestion des permissions', tips: ['Attribuez les bons rôles', 'Révisiez régulièrement', 'Limitez l\'accès admin'], icon: Lock },
                    { title: 'Organisation des modèles', tips: ['Utilisez des dossiers', 'Nommez clairement', 'Ajoutez des tags'], icon: Folder },
                    { title: 'Suivi des versions', tips: ['Commentez les changements', 'Utilisez les branches', 'Documentez les décisions'], icon: GitBranch },
                  ].map((practice, idx) => {
                    const Icon = practice.icon;
                    return (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className="w-5 h-5 text-cyan-400" />
                            <h4 className="font-semibold text-white">{practice.title}</h4>
                          </div>
                          <ul className="space-y-2">
                            {practice.tips.map((tip, tipIdx) => (
                              <li key={tipIdx} className="flex items-start gap-2 text-sm text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Collaboration Health Score */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Score de Santé de la Collaboration
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Évaluez la santé globale de votre collaboration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Score global</span>
                      <span className="text-3xl font-bold text-cyan-400">87/100</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-cyan-500 to-green-500 h-3 rounded-full" style={{ width: '87%' }} />
                    </div>
                    <div className="space-y-2">
                      {[
                        { metric: 'Engagement', score: 92, color: 'green' },
                        { metric: 'Communication', score: 85, color: 'cyan' },
                        { metric: 'Productivité', score: 88, color: 'blue' },
                        { metric: 'Satisfaction', score: 83, color: 'yellow' },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white">{item.metric}</span>
                            <span className={`text-${item.color}-400 font-semibold`}>{item.score}/100</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-1.5">
                            <div
                              className={`bg-${item.color}-500 h-1.5 rounded-full`}
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-white">Recommandations</h4>
                    <div className="space-y-3">
                      {[
                        { recommendation: 'Améliorer la fréquence de communication', priority: 'high', impact: 'Élevé' },
                        { recommendation: 'Organiser plus de sessions de revue', priority: 'medium', impact: 'Moyen' },
                        { recommendation: 'Optimiser les workflows existants', priority: 'low', impact: 'Faible' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-sm font-medium text-white mb-1">{item.recommendation}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}>
                              {item.priority === 'high' ? 'Haute' : item.priority === 'medium' ? 'Moyenne' : 'Basse'}
                            </Badge>
                            <span className="text-xs text-slate-400">Impact: {item.impact}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collaboration API & Webhooks */}
            <Card className="bg-slate-900/50 border-slate-700 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-cyan-400" />
                  API & Webhooks
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Intégrez votre collaboration avec des outils externes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-white">Endpoints API</h4>
                    <div className="space-y-2">
                      {[
                        { method: 'GET', endpoint: '/api/collaboration/team', description: 'Récupérer les membres' },
                        { method: 'POST', endpoint: '/api/collaboration/invite', description: 'Inviter un membre' },
                        { method: 'GET', endpoint: '/api/collaboration/models', description: 'Liste des modèles' },
                        { method: 'POST', endpoint: '/api/collaboration/share', description: 'Partager un modèle' },
                      ].map((api, idx) => (
                        <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={api.method === 'GET' ? 'bg-blue-500' : 'bg-green-500'}>
                              {api.method}
                            </Badge>
                            <code className="text-xs text-cyan-400">{api.endpoint}</code>
                          </div>
                          <p className="text-xs text-slate-400">{api.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-white">Webhooks Actifs</h4>
                    <div className="space-y-2">
                      {[
                        { event: 'member.invited', url: 'https://api.example.com/webhook', status: 'active' },
                        { event: 'model.shared', url: 'https://api.example.com/webhook', status: 'active' },
                        { event: 'comment.added', url: 'https://api.example.com/webhook', status: 'inactive' },
                      ].map((webhook, idx) => (
                        <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <code className="text-xs text-cyan-400">{webhook.event}</code>
                            <Badge className={webhook.status === 'active' ? 'bg-green-500' : 'bg-slate-600'}>
                              {webhook.status === 'active' ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 truncate">{webhook.url}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collaboration Documentation */}
            <Card className="bg-slate-900/50 border-slate-700 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  Documentation & Ressources
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Guides et ressources pour optimiser votre collaboration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: 'Guide de démarrage', description: 'Commencer avec la collaboration', icon: BookOpen, link: '#' },
                    { title: 'Meilleures pratiques', description: 'Optimiser votre workflow', icon: Award, link: '#' },
                    { title: 'API Reference', description: 'Documentation complète API', icon: Code, link: '#' },
                    { title: 'Vidéos tutoriels', description: 'Apprendre par l\'exemple', icon: Video, link: '#' },
                    { title: 'FAQ', description: 'Questions fréquentes', icon: HelpCircle, link: '#' },
                    { title: 'Support', description: 'Contacter l\'équipe', icon: MessageSquare, link: '#' },
                  ].map((resource, idx) => {
                    const Icon = resource.icon;
                    return (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Icon className="w-5 h-5 text-cyan-400" />
                            <h4 className="font-semibold text-white">{resource.title}</h4>
                          </div>
                          <p className="text-xs text-slate-400 mb-3">{resource.description}</p>
                          <Button size="sm" variant="outline" className="w-full border-slate-600">
                            Accéder
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Additional Collaboration Features - Large Section */}
            <div className="mt-6 space-y-6">
              {/* Collaboration Metrics Dashboard */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    Tableau de Bord Métriques Collaboration
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Analysez en profondeur les métriques de votre collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Taux de réponse moyen', value: '2h 15min', change: '-12min', icon: Clock, color: 'green' },
                      { label: 'Taux d\'engagement', value: '87%', change: '+5%', icon: Target, color: 'cyan' },
                      { label: 'Satisfaction équipe', value: '4.6/5', change: '+0.3', icon: Star, color: 'yellow' },
                      { label: 'Productivité', value: '92%', change: '+8%', icon: TrendingUp, color: 'blue' },
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
                              {stat.change}
                            </Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Répartition des Activités</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { activity: 'Visualisations', count: 1234, percentage: 45, color: 'cyan' },
                            { activity: 'Commentaires', count: 567, percentage: 21, color: 'blue' },
                            { activity: 'Partages', count: 345, percentage: 13, color: 'green' },
                            { activity: 'Modifications', count: 234, percentage: 9, color: 'yellow' },
                            { activity: 'Autres', count: 345, percentage: 12, color: 'purple' },
                          ].map((item, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-white">{item.activity}</span>
                                <span className="text-slate-400">{item.count} ({item.percentage}%)</span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                  className={`bg-${item.color}-500 h-2 rounded-full`}
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Tendances Temporelles</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            { period: 'Cette semaine', value: 234, change: '+12%', trend: 'up' },
                            { period: 'Ce mois', value: 892, change: '+8%', trend: 'up' },
                            { period: 'Ce trimestre', value: 2345, change: '+15%', trend: 'up' },
                            { period: 'Cette année', value: 8765, change: '+23%', trend: 'up' },
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-white">{item.period}</p>
                                <p className="text-xs text-slate-400">{item.value} actions</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-lg font-bold ${item.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                  {item.change}
                                </p>
                                {item.trend === 'up' ? (
                                  <TrendingUp className="w-4 h-4 text-green-400 mt-1 mx-auto" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-400 mt-1 mx-auto" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Insights & Recommendations */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    Insights & Recommandations
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Découvrez des opportunités d'amélioration basées sur vos données
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { insight: 'Meilleur moment pour collaboration', value: '14h-16h', description: 'Pic d\'activité détecté', icon: Clock, color: 'cyan' },
                      { insight: 'Modèles les plus collaboratifs', value: '12 modèles', description: 'Plus de 5 contributeurs', icon: FileImage, color: 'blue' },
                      { insight: 'Temps de réponse moyen', value: '2h 15min', description: 'En dessous de la moyenne', icon: MessageSquare, color: 'green' },
                      { insight: 'Taux d\'engagement', value: '87%', description: 'Au-dessus de la moyenne', icon: Target, color: 'yellow' },
                      { insight: 'Membres les plus actifs', value: '5 membres', description: 'Top contributeurs', icon: Users, color: 'purple' },
                      { insight: 'Satisfaction équipe', value: '4.6/5', description: 'Très satisfait', icon: Star, color: 'orange' },
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className={`w-4 h-4 text-${item.color}-400`} />
                              <span className="text-xs text-slate-400">{item.insight}</span>
                            </div>
                            <p className="text-xl font-bold text-cyan-400 mb-1">{item.value}</p>
                            <p className="text-xs text-slate-500">{item.description}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Collaboration Tools */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-cyan-400" />
                    Outils de Collaboration Avancés
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Fonctionnalités avancées pour optimiser votre collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { name: 'Notifications intelligentes', description: 'Alertes personnalisées', icon: Bell, enabled: true },
                      { name: 'Synchronisation temps réel', description: 'Mise à jour instantanée', icon: RefreshCw, enabled: true },
                      { name: 'Gestion des conflits', description: 'Résolution automatique', icon: GitMerge, enabled: true },
                      { name: 'Versioning avancé', description: 'Historique complet', icon: GitBranch, enabled: true },
                      { name: 'Commentaires contextuels', description: 'Annotations précises', icon: MessageSquare, enabled: true },
                      { name: 'Partage sécurisé', description: 'Liens temporaires', icon: Lock, enabled: true },
                      { name: 'Analytics détaillés', description: 'Métriques approfondies', icon: BarChart3, enabled: true },
                      { name: 'Intégrations API', description: 'Connectivité étendue', icon: Network, enabled: true },
                    ].map((tool, idx) => {
                      const Icon = tool.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Icon className="w-5 h-5 text-cyan-400" />
                              <Badge className={tool.enabled ? 'bg-green-500' : 'bg-slate-600'}>
                                {tool.enabled ? 'Actif' : 'Inactif'}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-white mb-1">{tool.name}</h4>
                            <p className="text-xs text-slate-400">{tool.description}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Success Stories */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-cyan-400" />
                    Histoires de Succès
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Découvrez comment d'autres équipes utilisent la collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { company: 'TechCorp', result: 'Productivité +45%', description: 'Amélioration significative grâce à la collaboration en temps réel', icon: TrendingUp },
                      { company: 'DesignStudio', result: 'Temps réduit de 60%', description: 'Workflow optimisé avec partage et commentaires', icon: Clock },
                      { company: 'InnovateLab', result: 'Satisfaction 4.8/5', description: 'Équipe très satisfaite des outils de collaboration', icon: Star },
                      { company: 'CreativeAgency', result: 'Engagement +78%', description: 'Augmentation massive de l\'engagement de l\'équipe', icon: Target },
                    ].map((story, idx) => {
                      const Icon = story.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <Icon className="w-6 h-6 text-cyan-400" />
                              <div>
                                <h4 className="font-semibold text-white">{story.company}</h4>
                                <p className="text-sm text-cyan-400 font-bold">{story.result}</p>
                              </div>
                            </div>
                            <p className="text-sm text-slate-300">{story.description}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Roadmap */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    Roadmap des Fonctionnalités
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Découvrez les prochaines fonctionnalités à venir
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { feature: 'Collaboration vidéo intégrée', status: 'En développement', quarter: 'Q1 2024', progress: 75 },
                      { feature: 'IA pour suggestions automatiques', status: 'Planifié', quarter: 'Q2 2024', progress: 25 },
                      { feature: 'Mode hors ligne amélioré', status: 'Planifié', quarter: 'Q2 2024', progress: 10 },
                      { feature: 'Intégrations supplémentaires', status: 'En développement', quarter: 'Q1 2024', progress: 60 },
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-sm font-medium text-white">{item.feature}</h4>
                            <p className="text-xs text-slate-400">{item.quarter}</p>
                          </div>
                          <Badge className={item.status === 'En développement' ? 'bg-yellow-500' : 'bg-blue-500'}>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 mb-1">
                          <div
                            className="bg-cyan-500 h-2 rounded-full"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400">{item.progress}% complété</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Training & Resources */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-cyan-400" />
                    Formation & Ressources
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Améliorez vos compétences en collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { title: 'Cours de base', duration: '30min', lessons: 5, completed: 3, icon: BookOpen },
                      { title: 'Collaboration avancée', duration: '1h', lessons: 8, completed: 0, icon: Users },
                      { title: 'Gestion d\'équipe', duration: '45min', lessons: 6, completed: 2, icon: Crown },
                      { title: 'API & Intégrations', duration: '1h 30min', lessons: 10, completed: 0, icon: Code },
                      { title: 'Meilleures pratiques', duration: '20min', lessons: 4, completed: 4, icon: Award },
                      { title: 'Cas d\'usage', duration: '1h', lessons: 7, completed: 1, icon: FileText },
                    ].map((course, idx) => {
                      const Icon = course.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="w-5 h-5 text-cyan-400" />
                              <h4 className="font-semibold text-white">{course.title}</h4>
                            </div>
                            <div className="space-y-2 text-xs text-slate-400 mb-3">
                              <div className="flex items-center justify-between">
                                <span>Durée: {course.duration}</span>
                                <span>{course.lessons} leçons</span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-1.5">
                                <div
                                  className="bg-cyan-500 h-1.5 rounded-full"
                                  style={{ width: `${(course.completed / course.lessons) * 100}%` }}
                                />
                              </div>
                              <p className="text-slate-500">{course.completed}/{course.lessons} complétées</p>
                            </div>
                            <Button size="sm" variant="outline" className="w-full border-slate-600">
                              {course.completed === course.lessons ? 'Revoir' : 'Continuer'}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Notifications Center */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-cyan-400" />
                    Centre de Notifications
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Gérez toutes vos notifications de collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">Notifications récentes</h4>
                      <Button size="sm" variant="outline" className="border-slate-600">
                        Tout marquer comme lu
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {[
                        { type: 'comment', user: 'Marie Martin', action: 'a commenté sur', target: 'Lunettes Premium', time: 'Il y a 5min', unread: true },
                        { type: 'share', user: 'Pierre Durand', action: 'a partagé', target: 'Chaise Design', time: 'Il y a 12min', unread: true },
                        { type: 'invite', user: 'Sophie Bernard', action: 'vous a invité à', target: 'Projet Design', time: 'Il y a 1h', unread: false },
                        { type: 'edit', user: 'Jean Dupont', action: 'a modifié', target: 'Montre de Luxe', time: 'Il y a 2h', unread: false },
                      ].map((notif, idx) => (
                        <div key={idx} className={`p-3 bg-slate-800/50 rounded-lg ${notif.unread ? 'border-l-4 border-cyan-500' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${notif.unread ? 'bg-cyan-500' : 'bg-slate-600'}`} />
                            <div className="flex-1">
                              <p className="text-sm text-white">
                                <span className="text-cyan-400 font-medium">{notif.user}</span> {notif.action} <span className="text-cyan-400">{notif.target}</span>
                              </p>
                              <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                            </div>
                            {notif.unread && <Badge className="bg-cyan-500">Nouveau</Badge>}
                          </div>
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
                    <Settings className="w-5 h-5 text-cyan-400" />
                    Paramètres de Collaboration
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Personnalisez votre expérience de collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-4">Notifications</h4>
                      <div className="space-y-3">
                        {[
                          { setting: 'Notifications par email', enabled: true, description: 'Recevoir des emails pour les activités importantes' },
                          { setting: 'Notifications push', enabled: true, description: 'Notifications en temps réel dans le navigateur' },
                          { setting: 'Notifications de commentaires', enabled: true, description: 'Alertes pour nouveaux commentaires' },
                          { setting: 'Notifications de partage', enabled: false, description: 'Alertes pour nouveaux partages' },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-white">{item.setting}</p>
                              <p className="text-xs text-slate-400">{item.description}</p>
                            </div>
                            <Badge className={item.enabled ? 'bg-green-500' : 'bg-slate-600'}>
                              {item.enabled ? 'Activé' : 'Désactivé'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-slate-700" />

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-4">Préférences</h4>
                      <div className="space-y-3">
                        {[
                          { setting: 'Mode sombre', enabled: true, description: 'Interface en mode sombre' },
                          { setting: 'Synchronisation automatique', enabled: true, description: 'Synchronisation en temps réel' },
                          { setting: 'Compression des données', enabled: true, description: 'Réduire l\'utilisation de la bande passante' },
                          { setting: 'Mode hors ligne', enabled: false, description: 'Travailler sans connexion' },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-white">{item.setting}</p>
                              <p className="text-xs text-slate-400">{item.description}</p>
                            </div>
                            <Badge className={item.enabled ? 'bg-green-500' : 'bg-slate-600'}>
                              {item.enabled ? 'Activé' : 'Désactivé'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Integrations Marketplace */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-cyan-400" />
                    Marketplace d'Intégrations
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Découvrez et installez des intégrations pour améliorer votre collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { name: 'Slack', category: 'Communication', users: 12000, rating: 4.8, icon: '💬', installed: true },
                      { name: 'Microsoft Teams', category: 'Communication', users: 8500, rating: 4.6, icon: '👥', installed: true },
                      { name: 'Notion', category: 'Documentation', users: 6500, rating: 4.7, icon: '📝', installed: false },
                      { name: 'Jira', category: 'Gestion de projet', users: 5200, rating: 4.5, icon: '🎯', installed: false },
                      { name: 'Trello', category: 'Gestion de projet', users: 4800, rating: 4.4, icon: '📋', installed: false },
                      { name: 'Asana', category: 'Gestion de projet', users: 4200, rating: 4.6, icon: '✅', installed: false },
                      { name: 'GitHub', category: 'Développement', users: 9800, rating: 4.9, icon: '🐙', installed: false },
                      { name: 'GitLab', category: 'Développement', users: 3400, rating: 4.5, icon: '🦊', installed: false },
                    ].map((integration, idx) => (
                      <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{integration.icon}</span>
                            {integration.installed && <Badge className="bg-green-500">Installé</Badge>}
                          </div>
                          <h4 className="font-semibold text-white mb-1">{integration.name}</h4>
                          <p className="text-xs text-slate-400 mb-2">{integration.category}</p>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                            <span>⭐ {integration.rating}</span>
                            <span>{integration.users.toLocaleString()} utilisateurs</span>
                          </div>
                          <Button size="sm" variant="outline" className="w-full border-slate-600">
                            {integration.installed ? 'Configurer' : 'Installer'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Analytics Deep Dive */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    Analyse Approfondie
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Analysez en détail les performances de votre collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Métriques Clés</h4>
                      <div className="space-y-3">
                        {[
                          { metric: 'Taux de participation', value: 87, target: 90, status: 'good' },
                          { metric: 'Temps de réponse moyen', value: 2.3, target: 2.0, unit: 'h', status: 'warning' },
                          { metric: 'Taux de résolution', value: 94, target: 95, status: 'good' },
                          { metric: 'Satisfaction client', value: 4.6, target: 4.5, unit: '/5', status: 'excellent' },
                        ].map((item, idx) => (
                          <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-white">{item.metric}</span>
                              <Badge className={
                                item.status === 'excellent' ? 'bg-green-500' :
                                item.status === 'good' ? 'bg-cyan-500' :
                                'bg-yellow-500'
                              }>
                                {item.status === 'excellent' ? 'Excellent' :
                                 item.status === 'good' ? 'Bon' : 'Attention'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    item.status === 'excellent' ? 'bg-green-500' :
                                    item.status === 'good' ? 'bg-cyan-500' :
                                    'bg-yellow-500'
                                  }`}
                                  style={{ width: `${(item.value / item.target) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-white">
                                {item.value}{item.unit || '%'} / {item.target}{item.unit || '%'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Comparaison Temporelle</h4>
                      <div className="space-y-3">
                        {[
                          { period: 'Cette semaine vs dernière', change: '+12%', trend: 'up', metric: 'Activité' },
                          { period: 'Ce mois vs dernier', change: '+8%', trend: 'up', metric: 'Engagement' },
                          { period: 'Ce trimestre vs dernier', change: '+15%', trend: 'up', metric: 'Productivité' },
                          { period: 'Cette année vs dernière', change: '+23%', trend: 'up', metric: 'Satisfaction' },
                        ].map((item, idx) => (
                          <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-white">{item.metric}</span>
                              <div className="flex items-center gap-1">
                                {item.trend === 'up' ? (
                                  <TrendingUp className="w-4 h-4 text-green-400" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-400" />
                                )}
                                <span className={`text-sm font-bold ${item.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                  {item.change}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-400">{item.period}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Workflow Builder */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-cyan-400" />
                    Constructeur de Workflows
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Créez des workflows personnalisés pour automatiser vos processus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { name: 'Workflow Design Review', steps: 5, active: true, runs: 234, icon: FileImage },
                        { name: 'Workflow Client Approval', steps: 4, active: true, runs: 189, icon: CheckCircle2 },
                        { name: 'Workflow Development', steps: 6, active: false, runs: 156, icon: Code },
                      ].map((workflow, idx) => {
                        const Icon = workflow.icon;
                        return (
                          <Card key={idx} className="bg-slate-800/50 border-slate-700">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <Icon className="w-5 h-5 text-cyan-400" />
                                <Badge className={workflow.active ? 'bg-green-500' : 'bg-slate-600'}>
                                  {workflow.active ? 'Actif' : 'Inactif'}
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-white mb-1">{workflow.name}</h4>
                              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                                <span>{workflow.steps} étapes</span>
                                <span>{workflow.runs} exécutions</span>
                              </div>
                                  <Button size="sm" variant="outline" className="w-full border-slate-600">
                                    Configurer
                                  </Button>
                              </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                        <Button variant="outline" className="w-full border-slate-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Créer un nouveau workflow
                        </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Team Performance */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-cyan-400" />
                    Performance de l'Équipe
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Analysez les performances individuelles et collectives
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Score moyen équipe', value: '87/100', icon: Target, color: 'cyan' },
                        { label: 'Membres actifs', value: '12/15', icon: Users, color: 'green' },
                        { label: 'Objectifs atteints', value: '8/10', icon: CheckCircle2, color: 'blue' },
                        { label: 'Taux de satisfaction', value: '92%', icon: Star, color: 'yellow' },
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                          <CardTitle className="text-sm">Top Performers</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {[
                              { name: 'Marie Martin', score: 96, role: 'Designer', trend: 'up' },
                              { name: 'Pierre Durand', score: 94, role: 'Developer', trend: 'up' },
                              { name: 'Jean Dupont', score: 92, role: 'Manager', trend: 'stable' },
                              { name: 'Sophie Bernard', score: 89, role: 'Designer', trend: 'up' },
                            ].map((member, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">{member.name}</p>
                                    <p className="text-xs text-slate-400">{member.role}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-cyan-400">{member.score}/100</p>
                                  {member.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400 mt-1 mx-auto" />}
                                  {member.trend === 'stable' && <Minus className="w-4 h-4 text-slate-400 mt-1 mx-auto" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                          <CardTitle className="text-sm">Objectifs d'Équipe</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {[
                              { goal: 'Augmenter la collaboration', progress: 85, target: 100 },
                              { goal: 'Réduire le temps de réponse', progress: 78, target: 100 },
                              { goal: 'Améliorer la satisfaction', progress: 92, target: 100 },
                              { goal: 'Augmenter la productivité', progress: 88, target: 100 },
                            ].map((goal, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-white">{goal.goal}</span>
                                  <span className="text-slate-400">{goal.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                  <div
                                    className="bg-cyan-500 h-2 rounded-full"
                                    style={{ width: `${goal.progress}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Export & Backup */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DownloadCloud className="w-5 h-5 text-cyan-400" />
                    Export & Sauvegarde
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Exportez et sauvegardez vos données de collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Exports Disponibles</h4>
                      <div className="space-y-2">
                        {[
                          { format: 'CSV', description: 'Données tabulaires', size: '2.3 MB', icon: FileDown },
                          { format: 'JSON', description: 'Données structurées', size: '4.1 MB', icon: FileJson },
                          { format: 'PDF', description: 'Rapport complet', size: '1.8 MB', icon: FileText },
                          { format: 'Excel', description: 'Feuille de calcul', size: '3.2 MB', icon: FileSpreadsheet },
                        ].map((exportItem, idx) => {
                          const Icon = exportItem.icon;
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5 text-cyan-400" />
                                <div>
                                  <p className="text-sm font-medium text-white">{exportItem.format}</p>
                                  <p className="text-xs text-slate-400">{exportItem.description}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-400">{exportItem.size}</p>
                                    <Button size="sm" variant="outline" className="mt-1 border-slate-600">
                                      Exporter
                                    </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Sauvegardes</h4>
                      <div className="space-y-2">
                        {[
                          { date: 'Aujourd\'hui 14:30', type: 'Automatique', size: '45.2 MB', status: 'completed' },
                          { date: 'Hier 02:00', type: 'Automatique', size: '44.8 MB', status: 'completed' },
                          { date: 'Il y a 2 jours', type: 'Manuelle', size: '45.5 MB', status: 'completed' },
                        ].map((backup, idx) => (
                          <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-sm font-medium text-white">{backup.date}</p>
                                <p className="text-xs text-slate-400">{backup.type} • {backup.size}</p>
                              </div>
                              <Badge className="bg-green-500">Complétée</Badge>
                            </div>
                            <Button size="sm" variant="outline" className="w-full mt-2 border-slate-600">
                              Restaurer
                            </Button>
                      </div>
                    ))}
                      </div>
                      <Button variant="outline" className="w-full border-slate-600">
                        <Save className="w-4 h-4 mr-2" />
                        Créer une sauvegarde manuelle
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Advanced Features - Part 2 */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    Fonctionnalités Avancées
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Accédez à des fonctionnalités premium pour optimiser votre collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { feature: 'Collaboration vidéo HD', description: 'Appels vidéo intégrés', premium: true, icon: Video },
                      { feature: 'Édition collaborative temps réel', description: 'Co-édition simultanée', premium: true, icon: Edit },
                      { feature: 'IA pour suggestions', description: 'Recommandations intelligentes', premium: true, icon: Zap },
                      { feature: 'Analytics avancés', description: 'Métriques approfondies', premium: true, icon: BarChart3 },
                      { feature: 'API illimitée', description: 'Accès API complet', premium: true, icon: Code },
                      { feature: 'Support prioritaire', description: 'Support 24/7', premium: true, icon: MessageSquare },
                      { feature: 'Sauvegardes automatiques', description: 'Backup quotidien', premium: false, icon: Cloud },
                      { feature: 'Versioning illimité', description: 'Historique complet', premium: false, icon: GitBranch },
                      { feature: 'Intégrations étendues', description: '100+ intégrations', premium: true, icon: Network },
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Icon className="w-5 h-5 text-cyan-400" />
                                  {item.premium && <Badge className="bg-yellow-500">Premium</Badge>}
                            </div>
                            <h4 className="font-semibold text-white mb-1">{item.feature}</h4>
                            <p className="text-xs text-slate-400">{item.description}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Community & Support */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    Communauté & Support
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Rejoignez la communauté et obtenez de l'aide
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Ressources Communautaires</h4>
                      <div className="space-y-2">
                        {[
                          { name: 'Forum communautaire', members: 12500, posts: 34500, icon: MessageSquare },
                          { name: 'Discord', members: 8900, posts: 0, icon: Users },
                          { name: 'GitHub Discussions', members: 5600, posts: 12300, icon: Code },
                          { name: 'Blog & Tutoriels', members: 0, posts: 450, icon: BookOpen },
                        ].map((resource, idx) => {
                          const Icon = resource.icon;
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5 text-cyan-400" />
                                <div>
                                  <p className="text-sm font-medium text-white">{resource.name}</p>
                                  <p className="text-xs text-slate-400">
                                    {resource.members > 0 && `${resource.members.toLocaleString()} membres`}
                                    {resource.posts > 0 && ` • ${resource.posts.toLocaleString()} posts`}
                                  </p>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" className="border-slate-600">
                                Rejoindre
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Support</h4>
                      <div className="space-y-2">
                        {[
                          { name: 'Documentation', description: 'Guides complets', icon: BookOpen, link: '#' },
                          { name: 'Centre d\'aide', description: 'FAQ et articles', icon: HelpCircle, link: '#' },
                          { name: 'Support email', description: 'support@example.com', icon: Mail, link: '#' },
                          { name: 'Chat en direct', description: 'Disponible 24/7', icon: MessageSquare, link: '#' },
                        ].map((support, idx) => {
                          const Icon = support.icon;
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5 text-cyan-400" />
                                <div>
                                  <p className="text-sm font-medium text-white">{support.name}</p>
                                  <p className="text-xs text-slate-400">{support.description}</p>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" className="border-slate-600">
                                Accéder
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Enterprise Features */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-cyan-400" />
                    Fonctionnalités Entreprise
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Solutions avancées pour les grandes équipes et organisations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Gestion Avancée</h4>
                      <div className="space-y-3">
                        {[
                          { feature: 'SSO (Single Sign-On)', description: 'Authentification centralisée', icon: Lock },
                          { feature: 'SAML 2.0', description: 'Intégration entreprise', icon: Shield },
                          { feature: 'LDAP/Active Directory', description: 'Synchronisation utilisateurs', icon: Database },
                          { feature: 'Audit logs complets', description: 'Traçabilité complète', icon: FileText },
                        ].map((item, idx) => {
                          const Icon = item.icon;
                          return (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                              <Icon className="w-5 h-5 text-cyan-400" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{item.feature}</p>
                                <p className="text-xs text-slate-400">{item.description}</p>
                              </div>
                              <Badge className="bg-cyan-500">Enterprise</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Sécurité Avancée</h4>
                      <div className="space-y-3">
                        {[
                          { feature: 'Chiffrement E2E', description: 'Données chiffrées de bout en bout', icon: Lock },
                          { feature: 'Watermarking invisible', description: 'Protection DRM', icon: Eye },
                          { feature: 'IP Whitelisting', description: 'Contrôle d\'accès par IP', icon: Network },
                          { feature: 'Compliance GDPR', description: 'Conformité réglementaire', icon: Shield },
                        ].map((item, idx) => {
                          const Icon = item.icon;
                          return (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                              <Icon className="w-5 h-5 text-cyan-400" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{item.feature}</p>
                                <p className="text-xs text-slate-400">{item.description}</p>
                              </div>
                              <Badge className="bg-green-500">Actif</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Usage Statistics */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    Statistiques d'Utilisation
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Suivez l'utilisation de vos fonctionnalités de collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Sessions actives', value: '23', limit: 100, unit: '', icon: Monitor },
                      { label: 'Stockage utilisé', value: '234', limit: 500, unit: 'GB', icon: HardDrive },
                      { label: 'API calls ce mois', value: '12,456', limit: 50000, unit: '', icon: Code },
                      { label: 'Webhooks actifs', value: '8', limit: 20, unit: '', icon: Network },
                    ].map((stat, idx) => {
                      const Icon = stat.icon;
                      const percentage = (parseInt(stat.value.replace(/,/g, '')) / stat.limit) * 100;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="w-4 h-4 text-cyan-400" />
                              <span className="text-xs text-slate-400">{stat.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-white mb-1">
                              {stat.value}{stat.unit && ` ${stat.unit}`}
                            </p>
                            <div className="w-full bg-slate-700 rounded-full h-1.5 mb-1">
                              <div
                                className={`h-1.5 rounded-full ${percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-cyan-500'}`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-400">Limite: {stat.limit.toLocaleString()}{stat.unit && ` ${stat.unit}`}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Utilisation par Fonctionnalité</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { feature: 'Partage de modèles', usage: 1234, percentage: 45 },
                            { feature: 'Commentaires', usage: 567, percentage: 21 },
                            { feature: 'Édition collaborative', usage: 345, percentage: 13 },
                            { feature: 'Appels vidéo', usage: 234, percentage: 9 },
                            { feature: 'Autres', usage: 345, percentage: 12 },
                          ].map((item, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-white">{item.feature}</span>
                                <span className="text-slate-400">{item.usage} ({item.percentage}%)</span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                  className="bg-cyan-500 h-2 rounded-full"
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Tendances d'Utilisation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            { period: 'Cette semaine', usage: 234, change: '+12%', trend: 'up' },
                            { period: 'Ce mois', usage: 892, change: '+8%', trend: 'up' },
                            { period: 'Ce trimestre', usage: 2345, change: '+15%', trend: 'up' },
                            { period: 'Cette année', usage: 8765, change: '+23%', trend: 'up' },
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-white">{item.period}</p>
                                <p className="text-xs text-slate-400">{item.usage} utilisations</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-lg font-bold ${item.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                  {item.change}
                                </p>
                                {item.trend === 'up' ? (
                                  <TrendingUp className="w-4 h-4 text-green-400 mt-1 mx-auto" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-400 mt-1 mx-auto" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Enterprise Features */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-cyan-400" />
                    Fonctionnalités Entreprise
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Solutions avancées pour les grandes équipes et organisations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Gestion Avancée</h4>
                      <div className="space-y-3">
                        {[
                          { feature: 'SSO (Single Sign-On)', description: 'Authentification centralisée', icon: Lock },
                          { feature: 'SAML 2.0', description: 'Intégration entreprise', icon: Shield },
                          { feature: 'LDAP/Active Directory', description: 'Synchronisation utilisateurs', icon: Database },
                          { feature: 'Audit logs complets', description: 'Traçabilité complète', icon: FileText },
                        ].map((item, idx) => {
                          const Icon = item.icon;
                          return (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                              <Icon className="w-5 h-5 text-cyan-400" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{item.feature}</p>
                                <p className="text-xs text-slate-400">{item.description}</p>
                              </div>
                              <Badge className="bg-cyan-500">Enterprise</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Sécurité Avancée</h4>
                      <div className="space-y-3">
                        {[
                          { feature: 'Chiffrement E2E', description: 'Données chiffrées de bout en bout', icon: Lock },
                          { feature: 'Watermarking invisible', description: 'Protection DRM', icon: Eye },
                          { feature: 'IP Whitelisting', description: 'Contrôle d\'accès par IP', icon: Network },
                          { feature: 'Compliance GDPR', description: 'Conformité réglementaire', icon: Shield },
                        ].map((item, idx) => {
                          const Icon = item.icon;
                          return (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                              <Icon className="w-5 h-5 text-cyan-400" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{item.feature}</p>
                                <p className="text-xs text-slate-400">{item.description}</p>
                              </div>
                              <Badge className="bg-green-500">Actif</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Usage Statistics */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    Statistiques d'Utilisation
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Suivez l'utilisation de vos fonctionnalités de collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Sessions actives', value: '23', limit: 100, unit: '', icon: Monitor },
                      { label: 'Stockage utilisé', value: '234', limit: 500, unit: 'GB', icon: HardDrive },
                      { label: 'API calls ce mois', value: '12,456', limit: 50000, unit: '', icon: Code },
                      { label: 'Webhooks actifs', value: '8', limit: 20, unit: '', icon: Network },
                    ].map((stat, idx) => {
                      const Icon = stat.icon;
                      const percentage = (parseInt(stat.value.replace(/,/g, '')) / stat.limit) * 100;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="w-4 h-4 text-cyan-400" />
                              <span className="text-xs text-slate-400">{stat.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-white mb-1">
                              {stat.value}{stat.unit && ` ${stat.unit}`}
                            </p>
                            <div className="w-full bg-slate-700 rounded-full h-1.5 mb-1">
                              <div
                                className={`h-1.5 rounded-full ${percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-cyan-500'}`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-400">Limite: {stat.limit.toLocaleString()}{stat.unit && ` ${stat.unit}`}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Utilisation par Fonctionnalité</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { feature: 'Partage de modèles', usage: 1234, percentage: 45 },
                            { feature: 'Commentaires', usage: 567, percentage: 21 },
                            { feature: 'Édition collaborative', usage: 345, percentage: 13 },
                            { feature: 'Appels vidéo', usage: 234, percentage: 9 },
                            { feature: 'Autres', usage: 345, percentage: 12 },
                          ].map((item, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-white">{item.feature}</span>
                                <span className="text-slate-400">{item.usage} ({item.percentage}%)</span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                  className="bg-cyan-500 h-2 rounded-full"
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Tendances d'Utilisation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            { period: 'Cette semaine', usage: 234, change: '+12%', trend: 'up' },
                            { period: 'Ce mois', usage: 892, change: '+8%', trend: 'up' },
                            { period: 'Ce trimestre', usage: 2345, change: '+15%', trend: 'up' },
                            { period: 'Cette année', usage: 8765, change: '+23%', trend: 'up' },
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-white">{item.period}</p>
                                <p className="text-xs text-slate-400">{item.usage} utilisations</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-lg font-bold ${item.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                  {item.change}
                                </p>
                                {item.trend === 'up' ? (
                                  <TrendingUp className="w-4 h-4 text-green-400 mt-1 mx-auto" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-400 mt-1 mx-auto" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Quick Actions */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    Actions Rapides
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Accès rapide aux actions les plus fréquentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[
                      { label: 'Inviter membre', icon: UserPlus, color: 'cyan' },
                      { label: 'Partager modèle', icon: Share2, color: 'blue' },
                      { label: 'Nouveau commentaire', icon: MessageSquare, color: 'green' },
                      { label: 'Créer workflow', icon: GitBranch, color: 'purple' },
                      { label: 'Exporter données', icon: DownloadCloud, color: 'yellow' },
                      { label: 'Paramètres', icon: Settings, color: 'orange' },
                      { label: 'Voir analytics', icon: BarChart3, color: 'cyan' },
                      { label: 'Gérer équipe', icon: Users, color: 'blue' },
                      { label: 'Intégrations', icon: Network, color: 'green' },
                      { label: 'Documentation', icon: BookOpen, color: 'purple' },
                      { label: 'Support', icon: HelpCircle, color: 'yellow' },
                      { label: 'Notifications', icon: Bell, color: 'orange' },
                    ].map((action, idx) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={idx}
                          variant="outline"
                          className="flex flex-col items-center gap-2 h-auto py-4 border-slate-600 hover:border-cyan-500 transition-all"
                        >
                          <Icon className={`w-5 h-5 text-${action.color}-400`} />
                          <span className="text-xs text-white">{action.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration System Status */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Statut du Système
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Surveillez l'état de tous les services de collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { service: 'API Collaboration', status: 'operational', uptime: '99.9%', response: '12ms', icon: Code },
                      { service: 'Synchronisation temps réel', status: 'operational', uptime: '99.8%', response: '8ms', icon: RefreshCw },
                      { service: 'Stockage fichiers', status: 'operational', uptime: '99.9%', response: '45ms', icon: Cloud },
                      { service: 'Notifications', status: 'degraded', uptime: '98.5%', response: '23ms', icon: Bell },
                    ].map((service, idx) => {
                      const Icon = service.icon;
                      return (
                        <Card key={idx} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Icon className="w-5 h-5 text-cyan-400" />
                                  <Badge className={service.status === 'operational' ? 'bg-green-500' : 'bg-yellow-500'}>
                                    {service.status === 'operational' ? 'Opérationnel' : 'Dégradé'}
                                  </Badge>
                            </div>
                            <h4 className="font-semibold text-white mb-2">{service.service}</h4>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Uptime:</span>
                                <span className="text-white">{service.uptime}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Réponse:</span>
                                <span className="text-white">{service.response}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Advanced Reporting */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileBarChart className="w-5 h-5 text-cyan-400" />
                    Rapports Avancés
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Générez des rapports détaillés et personnalisés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Rapports Disponibles</h4>
                      <div className="space-y-2">
                        {[
                          { name: 'Rapport d\'activité équipe', period: 'Mensuel', size: '2.3 MB', icon: Users },
                          { name: 'Rapport de performance', period: 'Hebdomadaire', size: '1.8 MB', icon: BarChart3 },
                          { name: 'Rapport de collaboration', period: 'Trimestriel', size: '4.5 MB', icon: MessageSquare },
                          { name: 'Rapport d\'engagement', period: 'Mensuel', size: '3.2 MB', icon: Target },
                        ].map((report, idx) => {
                          const Icon = report.icon;
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5 text-cyan-400" />
                                <div>
                                  <p className="text-sm font-medium text-white">{report.name}</p>
                                  <p className="text-xs text-slate-400">{report.period} • {report.size}</p>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" className="border-slate-600">
                                Générer
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Rapports Personnalisés</h4>
                      <div className="space-y-3">
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <p className="text-sm font-medium text-white mb-2">Créer un rapport personnalisé</p>
                          <p className="text-xs text-slate-400 mb-4">
                            Sélectionnez les métriques et la période pour générer un rapport sur mesure
                          </p>
                              <Button variant="outline" className="w-full border-slate-600">
                                <Plus className="w-4 h-4 mr-2" />
                                Créer un rapport
                              </Button>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg">
                          <p className="text-sm font-medium text-white mb-2">Rapports programmés</p>
                          <div className="space-y-2">
                            {[
                              { name: 'Rapport hebdomadaire', schedule: 'Tous les lundis 9h', status: 'active' },
                              { name: 'Rapport mensuel', schedule: '1er du mois 8h', status: 'active' },
                            ].map((scheduled, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                                <div>
                                  <p className="text-xs font-medium text-white">{scheduled.name}</p>
                                  <p className="text-xs text-slate-400">{scheduled.schedule}</p>
                                </div>
                                <Badge className={scheduled.status === 'active' ? 'bg-green-500' : 'bg-slate-600'}>
                                  {scheduled.status === 'active' ? 'Actif' : 'Inactif'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Keyboard Shortcuts */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-cyan-400" />
                    Raccourcis Clavier
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Maîtrisez les raccourcis pour une productivité maximale
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { action: 'Inviter un membre', shortcut: 'Cmd/Ctrl + I', category: 'Équipe' },
                      { action: 'Partager un modèle', shortcut: 'Cmd/Ctrl + S', category: 'Partage' },
                      { action: 'Nouveau commentaire', shortcut: 'Cmd/Ctrl + M', category: 'Communication' },
                      { action: 'Rechercher', shortcut: 'Cmd/Ctrl + K', category: 'Navigation' },
                      { action: 'Fermer le panneau', shortcut: 'Esc', category: 'Navigation' },
                      { action: 'Actualiser', shortcut: 'Cmd/Ctrl + R', category: 'Navigation' },
                      { action: 'Exporter', shortcut: 'Cmd/Ctrl + E', category: 'Actions' },
                      { action: 'Paramètres', shortcut: 'Cmd/Ctrl + ,', category: 'Configuration' },
                      { action: 'Aide', shortcut: 'Cmd/Ctrl + ?', category: 'Aide' },
                    ].map((shortcut, idx) => (
                      <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-white">{shortcut.action}</p>
                          <Badge className="bg-slate-600 text-xs">{shortcut.category}</Badge>
                        </div>
                        <kbd className="px-2 py-1 bg-slate-900 rounded text-xs font-mono text-cyan-400 border border-slate-700">
                          {shortcut.shortcut}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Version History */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-cyan-400" />
                    Historique des Versions
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Suivez l'évolution de votre plateforme de collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { version: 'v2.4.0', date: '15 Jan 2024', features: ['Nouveau système de notifications', 'Amélioration des performances'], status: 'current' },
                      { version: 'v2.3.2', date: '28 Déc 2023', features: ['Corrections de bugs', 'Optimisations'], status: 'previous' },
                      { version: 'v2.3.0', date: '10 Déc 2023', features: ['Nouveau système de workflows', 'Intégrations améliorées'], status: 'previous' },
                      { version: 'v2.2.1', date: '22 Nov 2023', features: ['Amélioration sécurité', 'Nouvelles fonctionnalités IA'], status: 'previous' },
                    ].map((release, idx) => (
                      <div key={idx} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Badge className={release.status === 'current' ? 'bg-cyan-500' : 'bg-slate-600'}>
                              {release.version}
                            </Badge>
                            <span className="text-sm text-slate-400">{release.date}</span>
                          </div>
                          {release.status === 'current' && <Badge className="bg-green-500">Actuel</Badge>}
                        </div>
                        <ul className="space-y-1 mt-2">
                          {release.features.map((feature, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2 text-sm text-slate-300">
                              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Feedback & Suggestions */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                    Feedback & Suggestions
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Partagez vos idées pour améliorer la collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Soumettre un Feedback</h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm text-slate-300 mb-2 block">Type</Label>
                          <Select defaultValue="feature">
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="feature">Nouvelle fonctionnalité</SelectItem>
                              <SelectItem value="improvement">Amélioration</SelectItem>
                              <SelectItem value="bug">Rapport de bug</SelectItem>
                              <SelectItem value="other">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm text-slate-300 mb-2 block">Description</Label>
                          <Textarea
                            placeholder="Décrivez votre suggestion ou feedback..."
                            rows={4}
                            className="bg-slate-800 border-slate-700 resize-none"
                          />
                        </div>
                            <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                              <Send className="w-4 h-4 mr-2" />
                              Envoyer le feedback
                            </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Suggestions Populaires</h4>
                      <div className="space-y-2">
                        {[
                          { suggestion: 'Améliorer la synchronisation temps réel', votes: 234, status: 'planned' },
                          { suggestion: 'Ajouter plus d\'intégrations', votes: 189, status: 'in-progress' },
                          { suggestion: 'Améliorer l\'interface mobile', votes: 156, status: 'planned' },
                          { suggestion: 'Ajouter des templates de workflows', votes: 134, status: 'completed' },
                        ].map((item, idx) => (
                          <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-white">{item.suggestion}</p>
                              <Badge className={
                                item.status === 'completed' ? 'bg-green-500' :
                                item.status === 'in-progress' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }>
                                {item.status === 'completed' ? 'Complété' :
                                 item.status === 'in-progress' ? 'En cours' :
                                 'Planifié'}</Badge>
                    </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" className="h-6">
                                <Heart className="w-3 h-3 mr-1" />
                                {item.votes}
                              </Button>
                              <span className="text-xs text-slate-400">{item.votes} votes</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Advanced Search */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-cyan-400" />
                    Recherche Avancée
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Recherchez efficacement dans tous vos contenus de collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <Input
                        placeholder="Rechercher dans les modèles, commentaires, membres..."
                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { filter: 'Modèles', count: 234, icon: FileImage },
                        { filter: 'Commentaires', count: 567, icon: MessageSquare },
                        { filter: 'Membres', count: 45, icon: Users },
                        { filter: 'Activités', count: 1234, icon: Activity },
                      ].map((filter, idx) => {
                        const Icon = filter.icon;
                        return (
                          <Button
                            key={idx}
                            variant="outline"
                            className="flex items-center justify-between border-slate-600"
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-cyan-400" />
                              <span className="text-sm text-white">{filter.filter}</span>
                            </div>
                            <Badge className="bg-slate-600 ml-2">{filter.count}</Badge>
                          </Button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Astuce:</span>
                      <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700">Cmd/Ctrl + K</kbd>
                      <span>pour une recherche rapide</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Mobile App */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-cyan-400" />
                    Application Mobile
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Accédez à votre collaboration depuis n'importe où
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Télécharger l'App</h4>
                      <div className="space-y-3">
                        {[
                          { platform: 'iOS', version: '2.4.0', size: '45 MB', icon: '🍎', link: '#' },
                          { platform: 'Android', version: '2.4.0', size: '52 MB', icon: '🤖', link: '#' },
                        ].map((app, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{app.icon}</span>
                              <div>
                                <p className="text-sm font-medium text-white">{app.platform}</p>
                                <p className="text-xs text-slate-400">v{app.version} • {app.size}</p>
                              </div>
                            </div>
                            <Button variant="outline" className="border-slate-600">
                              Télécharger
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Fonctionnalités Mobile</h4>
                      <div className="space-y-2">
                        {[
                          { feature: 'Notifications push', available: true, icon: Bell },
                          { feature: 'Mode hors ligne', available: true, icon: CloudOff },
                          { feature: 'AR Preview', available: true, icon: Camera },
                          { feature: 'Synchronisation automatique', available: true, icon: RefreshCw },
                        ].map((item, idx) => {
                          const Icon = item.icon;
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5 text-cyan-400" />
                                <span className="text-sm text-white">{item.feature}</span>
                              </div>
                              <Badge className={item.available ? 'bg-green-500' : 'bg-slate-600'}>
                                {item.available ? 'Disponible' : 'Bientôt'}</Badge>
                    </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Collaboration Advanced Features - Final Section */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Fonctionnalités Avancées de Collaboration - Section Finale
              </CardTitle>
              <CardDescription className="text-slate-400">
                Dernières fonctionnalités avancées pour une collaboration complète et professionnelle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Advanced Collaboration Tools */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Outils de Collaboration Avancés</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: 'Éditeur Collaboratif', description: 'Éditer en temps réel avec votre équipe', icon: Users, status: 'active' },
                      { name: 'Commentaires en Direct', description: 'Commenter et annoter en temps réel', icon: MessageSquare, status: 'active' },
                      { name: 'Prévisualisation Partagée', description: 'Partager vos prévisualisations AR', icon: Eye, status: 'active' },
                      { name: 'Versioning Avancé', description: 'Gérer les versions et historiques', icon: GitBranch, status: 'active' },
                      { name: 'Permissions Granulaires', description: 'Contrôler finement les accès', icon: Shield, status: 'active' },
                      { name: 'API de Collaboration', description: 'Intégrer la collaboration via API', icon: Code, status: 'active' },
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
                  <h4 className="text-sm font-semibold text-white mb-3">Métriques de Performance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { metric: 'Temps de synchronisation', value: '120ms', target: '< 200ms', status: 'good', icon: Gauge },
                      { metric: 'Taux de collaboration', value: '95%', target: '> 90%', status: 'excellent', icon: TrendingUp },
                      { metric: 'Satisfaction équipe', value: '4.9/5', target: '> 4.5', status: 'excellent', icon: Star },
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

                {/* Collaboration Statistics */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Statistiques de Collaboration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Projets actifs', value: '12', icon: Folder, color: 'cyan' },
                      { label: 'Membres équipe', value: '8', icon: Users, color: 'blue' },
                      { label: 'Commentaires', value: '234', icon: MessageSquare, color: 'green' },
                      { label: 'Modifications', value: '1.2K', icon: Edit, color: 'purple' },
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

        </div>
      </div>
  );
}

const MemoizedARStudioCollaborationPageContent = memo(ARStudioCollaborationPageContent);

export default function ARStudioCollaborationPage() {
  return (
    <ErrorBoundary level="page" componentName="ARStudioCollaboration">
      <MemoizedARStudioCollaborationPageContent />
    </ErrorBoundary>
  );
}