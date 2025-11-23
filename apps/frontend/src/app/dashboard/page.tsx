'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Zap,
  Eye,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Palette,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { DemoModeBanner } from '@/components/demo/DemoModeBanner';
import { DemoModeToggle } from '@/components/demo/DemoModeToggle';
import { useDemoMode } from '@/hooks/useDemoMode';

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const router = useRouter();

  // Get real data from API
  const { stats, recentActivity, topDesigns, loading, error, refresh } = useDashboardData(selectedPeriod);
  const { isDemoMode } = useDemoMode();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Card className="p-6 max-w-md bg-red-900/20 border-red-400/30">
            <p className="text-red-400 mb-2 font-semibold">Erreur de chargement</p>
            <p className="text-sm text-gray-300 mb-4">{error}</p>
            <Button onClick={refresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Icon mapping
  const iconMap: Record<string, React.ReactNode> = {
    'Palette': <Palette className="w-5 h-5" />,
    'Eye': <Eye className="w-5 h-5" />,
    'Download': <Download className="w-5 h-5" />,
    'DollarSign': <DollarSign className="w-5 h-5" />,
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <DemoModeBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            Dashboard
            {isDemoMode && (
              <span className="rounded-full border border-purple-400/60 bg-purple-500/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-purple-100">
                Demo mode
              </span>
            )}
          </h1>
          <p className="text-gray-300 mt-1">
            {isDemoMode
              ? 'Scénario commercial – KPIs multi-marques, exports AR et revenus synthétiques.'
              : 'Vue d\'ensemble de votre activité'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Dernières 24h</option>
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
          </select>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <DemoModeToggle />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          // Vibrant colors by category
          const colorMap: Record<string, string> = {
            'Designs créés': 'from-blue-500 to-blue-600',
            'Vues totales': 'from-purple-500 to-purple-600',
            'Téléchargements': 'from-green-500 to-green-600',
            'Revenus': 'from-orange-500 to-orange-600'
          };
          const gradient = colorMap[stat.title] || 'from-gray-500 to-gray-600';
          const borderHover =
            stat.changeType === 'positive' ? 'hover:border-green-500/50' : 'hover:border-red-500/50';

          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                className={`p-6 bg-gray-800/50 border-2 border-gray-700 ${borderHover} hover:shadow-xl transition-all`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                    {iconMap[stat.icon] || <Zap className="w-5 h-5" />}
                  </div>
                  <div
                    className={`flex items-center text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 mr-1" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-sm font-semibold text-gray-400">{stat.title}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Activité récente</h2>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/monitoring')}>
              Tout voir
            </Button>
          </div>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-400 space-y-4">
                <div>
                  <p>Aucune activité récente</p>
                  <p className="text-sm mt-2">Commencez par créer un design</p>
                </div>
                <Button onClick={() => router.push('/dashboard/ai-studio')}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Créer un premier design
                </Button>
              </div>
            ) : (
              recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  {activity.image ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                      <Image
                        src={activity.image}
                        alt={activity.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center">
                      <Palette className="w-6 h-6 text-blue-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{activity.title}</p>
                    <p className="text-sm text-gray-400 truncate">{activity.description}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(activity.time).toLocaleDateString('fr-FR')}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>

        {/* Top Designs */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Designs populaires</h2>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/library')}>
              Voir tous
            </Button>
          </div>
          <div className="space-y-4">
            {topDesigns.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>Aucun design encore</p>
                <p className="text-sm mt-2">Créez votre premier design</p>
              </div>
            ) : (
              topDesigns.map((design, index) => (
                <motion.div
                  key={design.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  {design.image ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <Image
                        src={design.image}
                        alt={design.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-blue-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{design.title}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                      <div className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {design.views}
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {design.likes}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            className="h-20 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            onClick={() => router.push('/dashboard/ai-studio')}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Créer un design
          </Button>
          <Button
            variant="outline"
            className="h-20 border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => router.push('/dashboard/library')}
          >
            <Download className="w-5 h-5 mr-2" />
            Voir mes designs
          </Button>
          <Button
            variant="outline"
            className="h-20 border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => router.push('/dashboard/analytics')}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Analytics
          </Button>
        </div>
      </Card>
    </div>
  );
}
