'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Eye,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Palette,
  RefreshCw,
  Bell,
  Calendar,
  Users,
  ShoppingCart,
  Target,
  Award,
  Rocket,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  BarChart3,
  PieChart,
  Activity,
  Box,
  Layers,
  Settings,
  HelpCircle,
  ExternalLink,
  Plus,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
// ✅ Use React Query hooks instead of old hooks
import { useDashboardStats, useDashboardChartData } from '@/lib/hooks/api/useDashboard';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { DemoModeBanner } from '@/components/demo/DemoModeBanner';
import { DemoModeToggle } from '@/components/demo/DemoModeToggle';
import { useDemoMode } from '@/hooks/useDemoMode';

// Mini Chart Component (simple bar chart without external deps)
const MiniBarChart = ({ data, color }: { data: number[], color: string }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, i) => (
        <motion
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(value / max) * 100}%` }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className={`w-2 rounded-sm ${color}`}
          style={{ minHeight: value > 0 ? '2px' : '0' }}
        />
      ))}
    </div>
  );
};

// Progress Ring Component
const ProgressRing = ({ 
  progress, 
  size = 60, 
  strokeWidth = 6,
  color = 'stroke-cyan-500'
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        className="stroke-slate-700"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{ 
          strokeDasharray: circumference,
          strokeDashoffset: offset,
          transition: 'stroke-dashoffset 1s ease-out'
        }}
      />
    </svg>
  );
};

// Notification type
interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// Quick action type
interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  badge?: string;
}

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const router = useRouter();

  // ✅ Use React Query hooks for dashboard data
  const { data: dashboardStats, isLoading: statsLoading, error: statsError, refetch: refreshStats } = useDashboardStats(selectedPeriod);
  const { data: chartData, isLoading: chartLoading } = useDashboardChartData(selectedPeriod);
  const { notifications, loading: notificationsLoading } = useNotifications(10);
  const { isDemoMode } = useDemoMode();

  // Transform React Query data to match existing component expectations
  const stats = useMemo(() => {
    if (!dashboardStats?.overview) return [];
    return [
      {
        title: 'Designs créés',
        value: dashboardStats.overview.designs.toLocaleString('fr-FR'),
        change: `+${dashboardStats.period.designs}`,
        changeType: 'positive' as const,
        icon: 'Palette',
      },
      {
        title: 'Vues totales',
        value: '0', // TODO: Récupérer depuis usage_tracking
        change: '+0%',
        changeType: 'positive' as const,
        icon: 'Eye',
      },
      {
        title: 'Téléchargements',
        value: '0', // TODO: Récupérer depuis usage_tracking
        change: '+0%',
        changeType: 'positive' as const,
        icon: 'Download',
      },
      {
        title: 'Revenus',
        value: `€${dashboardStats.period.revenue.toFixed(2)}`,
        change: `+${dashboardStats.period.orders} commandes`,
        changeType: dashboardStats.period.revenue > 0 ? 'positive' as const : 'negative' as const,
        icon: 'DollarSign',
      },
    ];
  }, [dashboardStats]);

  const recentActivity = useMemo(() => {
    if (!dashboardStats?.recent) return [];
    return [
      ...(dashboardStats.recent.designs?.slice(0, 3) || []).map((design) => ({
        id: design.id,
        type: 'design',
        title: design.prompt || 'Design créé',
        description: `Design ${design.status || 'créé'}`,
        time: design.created_at,
        status: design.status,
        image: design.preview_url,
      })),
      ...(dashboardStats.recent.orders?.slice(0, 2) || []).map((order) => ({
        id: order.id,
        type: 'order',
        title: `Commande ${order.status}`,
        description: `Montant: €${order.total_amount.toFixed(2)}`,
        time: order.created_at,
        status: order.status,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
  }, [dashboardStats]);

  const topDesigns = useMemo(() => {
    if (!dashboardStats?.recent?.designs) return [];
    return dashboardStats.recent.designs.slice(0, 5).map((design) => ({
      id: design.id,
      title: design.prompt || 'Design sans titre',
      image: design.preview_url || '/placeholder-design.jpg',
      views: 0, // TODO: Récupérer depuis usage_tracking
      likes: 0, // TODO: Récupérer depuis usage_tracking
      created_at: design.created_at,
    }));
  }, [dashboardStats]);

  const loading = statsLoading || chartLoading;
  const error = statsError?.message || null;
  
  const refresh = useCallback(() => {
    refreshStats();
  }, [refreshStats]);

  // Fallback data si erreur mais on veut quand même afficher quelque chose
  const displayStats = stats.length > 0 ? stats : [
    { title: 'Designs créés', value: '0', change: '+0', changeType: 'positive' as const, icon: 'Palette' },
    { title: 'Vues totales', value: '0', change: '+0%', changeType: 'positive' as const, icon: 'Eye' },
    { title: 'Téléchargements', value: '0', change: '+0%', changeType: 'positive' as const, icon: 'Download' },
    { title: 'Revenus', value: '€0.00', change: '+0 commandes', changeType: 'positive' as const, icon: 'DollarSign' },
  ];

  // Chart data et notifications récupérés depuis les APIs
  // Les données sont maintenant réelles au lieu de mockées

  // Quick actions - Actions de navigation statiques (configuration)
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'ai-studio',
      title: 'AI Studio',
      description: 'Générer des designs avec IA',
      icon: <Sparkles className="w-6 h-6" />,
      href: '/dashboard/ai-studio',
      color: 'from-purple-500 to-pink-500',
      badge: 'Populaire',
    },
    {
      id: 'customizer',
      title: 'Customizer',
      description: 'Éditeur de personnalisation',
      icon: <Palette className="w-6 h-6" />,
      href: '/dashboard/customizer',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      id: '3d-config',
      title: 'Configurateur 3D',
      description: 'Visualisation produits 3D',
      icon: <Box className="w-6 h-6" />,
      href: '/dashboard/configurator-3d',
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 'library',
      title: 'Ma Bibliothèque',
      description: 'Gérer mes designs',
      icon: <Layers className="w-6 h-6" />,
      href: '/dashboard/library',
      color: 'from-green-500 to-emerald-500',
    },
  ], []);

  // Goals/Targets (could come from API)
  const goals = useMemo(() => [
    { label: 'Designs créés', current: 45, target: 100, color: 'stroke-cyan-500' },
    { label: 'Conversions', current: 78, target: 100, color: 'stroke-green-500' },
    { label: 'Engagement', current: 62, target: 100, color: 'stroke-purple-500' },
  ], []);

  // Icon mapping
  const iconMap: Record<string, React.ReactNode> = useMemo(() => ({
    'Palette': <Palette className="w-5 h-5" />,
    'Eye': <Eye className="w-5 h-5" />,
    'Download': <Download className="w-5 h-5" />,
    'DollarSign': <DollarSign className="w-5 h-5" />,
  }), []);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handlePeriodChange = useCallback((period: '24h' | '7d' | '30d' | '90d') => {
    setSelectedPeriod(period);
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
            <Sparkles className="w-6 h-6 text-cyan-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 mt-4">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  // Error state - mais on affiche quand même le dashboard avec des données vides
  // pour éviter un écran blanc complet
  if (error && !stats.length && !recentActivity.length) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-8 max-w-md bg-red-50 border-red-200 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={refresh} className="bg-red-600 hover:bg-red-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
            <Button 
              onClick={() => router.push('/dashboard/ai-studio')} 
              variant="outline"
              className="border-gray-300 hover:bg-gray-100"
            >
              Continuer quand même
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary level="page" componentName="DashboardOverview">
      <div className="space-y-6">
        <DemoModeBanner />

      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            {isDemoMode && (
              <span className="px-2.5 py-1 bg-purple-100 border border-purple-200 rounded-full text-xs font-medium text-purple-700">
                Mode Démo
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            Bienvenue ! Voici un aperçu de votre activité.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {(['24h', '7d', '30d', '90d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          
          <DemoModeToggle />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <motion
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Card className="p-4 bg-yellow-950/20 border-yellow-500/30">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-yellow-300 font-medium">Données partiellement disponibles</p>
                <p className="text-xs text-yellow-400/80 mt-0.5">{error}</p>
              </div>
              <Button onClick={refresh} size="sm" variant="outline" className="border-yellow-500/50 hover:bg-yellow-500/10">
                <RefreshCw className="w-4 h-4 mr-1" />
                Réessayer
              </Button>
            </div>
          </Card>
        </motion>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat, index) => {
          const colorMap: Record<string, { gradient: string; bg: string; chart: string }> = {
            'Designs créés': { gradient: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-500/10', chart: 'bg-cyan-500' },
            'Vues totales': { gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10', chart: 'bg-purple-500' },
            'Téléchargements': { gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10', chart: 'bg-green-500' },
            'Revenus': { gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/10', chart: 'bg-orange-500' }
          };
          const colors = colorMap[stat.title] || { gradient: 'from-slate-500 to-slate-600', bg: 'bg-slate-500/10', chart: 'bg-slate-500' };

          return (
            <motion
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="p-5 bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${colors.bg}`}>
                    <div className={`bg-gradient-to-br ${colors.gradient} bg-clip-text text-transparent`}>
                      {iconMap[stat.icon] || <Zap className="w-5 h-5" />}
                    </div>
                  </div>
                  <div className={`flex items-center text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stat.changeType === 'positive' ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {stat.change}
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-sm text-slate-400 mb-3">{stat.title}</p>
                
                {/* Mini chart */}
                <MiniBarChart 
                  data={stat.title === 'Designs créés' ? (chartData?.designs || []) :
                        stat.title === 'Vues totales' ? (chartData?.views || []) :
                        stat.title === 'Revenus' ? (chartData?.revenue || []) :
                        [15, 22, 18, 25, 20, 28, 24]} 
                  color={colors.chart}
                />
              </Card>
            </motion>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Activity & Designs */}
        <div className="xl:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card className="p-6 bg-slate-900/50 border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Rocket className="w-5 h-5 text-cyan-400" />
                Actions Rapides
              </h2>
              <Link href="/dashboard/settings">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((action, index) => (
                <motion
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={action.href}>
                    <div className="group p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 transition-all cursor-pointer">
                      <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                        {action.icon}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-white text-sm">{action.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{action.description}</p>
                        </div>
                        {action.badge && (
                          <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] rounded-full">
                            {action.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion>
              ))}
            </div>
          </Card>

          {/* Recent Activity & Top Designs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="p-5 bg-slate-900/50 border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Activité Récente
                </h2>
                <Link href="/dashboard/monitoring">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    Voir tout
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-slate-400 text-sm">Aucune activité récente</p>
                    <Link href="/dashboard/ai-studio">
                      <Button size="sm" className="mt-3 bg-cyan-600 hover:bg-cyan-700">
                        <Plus className="w-4 h-4 mr-1" />
                        Créer un design
                      </Button>
                    </Link>
                  </div>
                ) : (
                  recentActivity.slice(0, 5).map((activity, index) => (
                    <motion
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      {activity.image ? (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={activity.image}
                            alt={activity.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Palette className="w-5 h-5 text-cyan-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{activity.title}</p>
                        <p className="text-xs text-slate-500 truncate">{activity.description}</p>
                      </div>
                      <span className="text-xs text-slate-600 flex-shrink-0">
                        {new Date(activity.time).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </motion>
                  ))
                )}
              </div>
            </Card>

            {/* Top Designs */}
            <Card className="p-5 bg-slate-900/50 border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Top Designs
                </h2>
                <Link href="/dashboard/library">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    Voir tout
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-3">
                {topDesigns.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Layers className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-slate-400 text-sm">Aucun design encore</p>
                    <p className="text-xs text-slate-500 mt-1">Créez votre premier chef-d&apos;œuvre</p>
                  </div>
                ) : (
                  topDesigns.slice(0, 4).map((design, index) => (
                    <motion
                      key={design.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-slate-400">
                        {index + 1}
                      </div>
                      {design.image ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={design.image}
                            alt={design.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-6 h-6 text-cyan-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{design.title}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {design.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {design.likes}
                          </span>
                        </div>
                      </div>
                    </motion>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Goals Progress */}
          <Card className="p-5 bg-slate-900/50 border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Objectifs
              </h2>
              <span className="text-xs text-slate-500">{selectedPeriod}</span>
            </div>
            
            <div className="space-y-4">
              {goals.map((goal, index) => (
                <motion
                  key={goal.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="relative">
                    <ProgressRing progress={goal.current} size={50} strokeWidth={5} color={goal.color} />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                      {goal.current}%
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{goal.label}</p>
                    <p className="text-xs text-slate-500">{goal.current}/{goal.target} objectif</p>
                  </div>
                </motion>
              ))}
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-5 bg-slate-900/50 border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-400" />
                Notifications
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-400 hover:text-white"
                onClick={() => setShowAllNotifications(!showAllNotifications)}
              >
                {showAllNotifications ? 'Moins' : 'Tout'}
              </Button>
            </div>
            
            <AnimatePresence>
              <div className="space-y-2">
                {(showAllNotifications ? notifications : notifications.slice(0, 3)).map((notification, index) => (
                  <motion
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      notification.read 
                        ? 'bg-slate-800/30 border-slate-800 hover:bg-slate-800/50' 
                        : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${notification.read ? 'text-slate-400' : 'text-white'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{notification.message}</p>
                      </div>
                      <span className="text-xs text-slate-600 flex-shrink-0">{notification.time}</span>
                    </div>
                  </motion>
                ))}
              </div>
            </AnimatePresence>
          </Card>

          {/* Help & Resources */}
          <Card className="p-5 bg-gradient-to-br from-cyan-950/50 to-blue-950/50 border-cyan-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Besoin d&apos;aide ?</h3>
                <p className="text-xs text-slate-400">Consultez notre documentation</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link href="/docs">
                <Button variant="outline" size="sm" className="w-full justify-start bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="sm" className="w-full justify-start bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Contacter le support
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
      </ErrorBoundary>
  );
}
