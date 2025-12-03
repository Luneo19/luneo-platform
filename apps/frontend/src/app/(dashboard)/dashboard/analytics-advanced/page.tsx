'use client';

/**
 * Advanced Analytics Dashboard
 * A-001: Page analytics avancée avec métriques détaillées
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  ShoppingCart,
  DollarSign,
  Palette,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Layers,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';

// Types
interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  description: string;
}

interface FunnelStep {
  name: string;
  value: number;
  percentage: number;
  dropoff: number;
}

// Mock data generators
const generateTimeSeriesData = (days: number, baseValue: number, variance: number) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      x: date.toISOString().split('T')[0],
      y: Math.floor(baseValue + (Math.random() - 0.5) * variance * 2),
    };
  });
};

const generateFunnelData = (): FunnelStep[] => [
  { name: 'Visiteurs', value: 10000, percentage: 100, dropoff: 0 },
  { name: 'Vues produits', value: 6500, percentage: 65, dropoff: 35 },
  { name: 'Personnalisations', value: 3200, percentage: 32, dropoff: 50.77 },
  { name: 'Ajout panier', value: 1800, percentage: 18, dropoff: 43.75 },
  { name: 'Achats', value: 850, percentage: 8.5, dropoff: 52.78 },
];

const generateDeviceData = () => [
  { id: 'desktop', label: 'Desktop', value: 58, color: '#3b82f6' },
  { id: 'mobile', label: 'Mobile', value: 35, color: '#10b981' },
  { id: 'tablet', label: 'Tablet', value: 7, color: '#f59e0b' },
];

const generateTopProducts = () => [
  { product: 'T-Shirt Premium', designs: 1234, revenue: 36820 },
  { product: 'Mug Personnalisé', designs: 987, revenue: 14805 },
  { product: 'Poster A2', designs: 756, revenue: 15107 },
  { product: 'Casquette', designs: 543, revenue: 16290 },
  { product: 'Tote Bag', designs: 432, revenue: 8640 },
];

export default function AnalyticsAdvancedPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Metrics cards data
  const metrics: MetricCard[] = useMemo(() => [
    {
      id: 'revenue',
      title: 'Revenu Total',
      value: '€89,432',
      change: 12.5,
      trend: 'up',
      icon: DollarSign,
      description: 'vs période précédente',
    },
    {
      id: 'designs',
      title: 'Designs Créés',
      value: '3,847',
      change: 8.2,
      trend: 'up',
      icon: Palette,
      description: 'Personnalisations terminées',
    },
    {
      id: 'conversions',
      title: 'Taux de Conversion',
      value: '8.5%',
      change: -2.1,
      trend: 'down',
      icon: Target,
      description: 'Visiteurs → Achats',
    },
    {
      id: 'avgOrder',
      title: 'Panier Moyen',
      value: '€47.80',
      change: 5.3,
      trend: 'up',
      icon: ShoppingCart,
      description: 'Valeur moyenne commande',
    },
  ], []);

  // Time series data
  const revenueData = useMemo(() => [
    {
      id: 'revenue',
      color: '#3b82f6',
      data: generateTimeSeriesData(30, 3000, 1000),
    },
  ], []);

  const designsData = useMemo(() => [
    {
      id: 'designs',
      color: '#10b981',
      data: generateTimeSeriesData(30, 120, 40),
    },
  ], []);

  // Funnel data
  const funnelData = useMemo(() => generateFunnelData(), []);
  const deviceData = useMemo(() => generateDeviceData(), []);
  const topProducts = useMemo(() => generateTopProducts(), []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Avancés</h1>
          <p className="text-slate-400">Vue détaillée de vos performances</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="1y">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </motion.div>

      {/* Metrics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">{metric.title}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <div className="flex items-center mt-2">
                      {metric.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                      )}
                      <span className={metric.trend === 'up' ? 'text-green-400' : 'text-red-400'}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                      <span className="text-slate-500 text-sm ml-2">{metric.description}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg">
                    {React.createElement(metric.icon, { className: "w-6 h-6 text-blue-400" })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="funnel" className="data-[state=active]:bg-blue-600">
            <Layers className="w-4 h-4 mr-2" />
            Funnel
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-blue-600">
            <Palette className="w-4 h-4 mr-2" />
            Produits
          </TabsTrigger>
          <TabsTrigger value="audience" className="data-[state=active]:bg-blue-600">
            <Users className="w-4 h-4 mr-2" />
            Audience
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  Évolution du Revenu
                </CardTitle>
                <CardDescription>Revenus journaliers sur la période</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveLine
                    data={revenueData}
                    margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                    curve="monotoneX"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      format: (v) => v.slice(5),
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      format: (v) => `€${v}`,
                    }}
                    enableGridX={false}
                    colors={['#3b82f6']}
                    lineWidth={2}
                    pointSize={0}
                    enableArea={true}
                    areaOpacity={0.15}
                    theme={{
                      axis: { ticks: { text: { fill: '#94a3b8' } } },
                      grid: { line: { stroke: '#334155' } },
                      crosshair: { line: { stroke: '#3b82f6' } },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Designs Chart */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-green-400" />
                  Designs Créés
                </CardTitle>
                <CardDescription>Nombre de designs par jour</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveLine
                    data={designsData}
                    margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                    curve="monotoneX"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      format: (v) => v.slice(5),
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                    }}
                    enableGridX={false}
                    colors={['#10b981']}
                    lineWidth={2}
                    pointSize={0}
                    enableArea={true}
                    areaOpacity={0.15}
                    theme={{
                      axis: { ticks: { text: { fill: '#94a3b8' } } },
                      grid: { line: { stroke: '#334155' } },
                      crosshair: { line: { stroke: '#10b981' } },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Funnel de Conversion
              </CardTitle>
              <CardDescription>
                Analyse du parcours utilisateur de la visite à l'achat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.map((step, index) => (
                  <motion.div
                    key={step.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{step.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-400">{step.value.toLocaleString()}</span>
                        <span className="text-sm font-medium text-blue-400">{step.percentage}%</span>
                        {index > 0 && (
                          <span className="text-sm text-red-400">
                            -{step.dropoff.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-8 bg-slate-800 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${step.percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-400" />
                Top Produits
              </CardTitle>
              <CardDescription>Produits les plus personnalisés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <motion.div
                    key={product.product}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-lg font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.product}</p>
                        <p className="text-sm text-slate-400">{product.designs} designs</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">€{product.revenue.toLocaleString()}</p>
                      <p className="text-sm text-slate-400">revenu</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Distribution */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-cyan-400" />
                  Répartition par Appareil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsivePie
                    data={deviceData}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    innerRadius={0.6}
                    padAngle={2}
                    cornerRadius={4}
                    colors={{ datum: 'data.color' }}
                    borderWidth={0}
                    enableArcLabels={false}
                    enableArcLinkLabels={true}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLinkLabelsTextColor="#94a3b8"
                    theme={{
                      labels: { text: { fill: '#94a3b8' } },
                    }}
                  />
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {deviceData.map((device) => (
                    <div key={device.id} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: device.color }}
                      />
                      <span className="text-sm text-slate-400">{device.label}</span>
                      <span className="text-sm font-medium">{device.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-pink-400" />
                  Statistiques Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">Durée moyenne</span>
                    </div>
                    <p className="text-2xl font-bold">4m 32s</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">Pages/session</span>
                    </div>
                    <p className="text-2xl font-bold">5.8</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">Nouveaux users</span>
                    </div>
                    <p className="text-2xl font-bold">67%</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">Pays</span>
                    </div>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


