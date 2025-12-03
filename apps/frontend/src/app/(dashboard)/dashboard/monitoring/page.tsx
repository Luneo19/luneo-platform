'use client';

/**
 * Monitoring Dashboard
 * MON-001: Dashboard de monitoring en temps réel
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Server,
  Database,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Globe,
  Cpu,
  HardDrive,
  RefreshCw,
  Bell,
  Eye,
  BarChart3,
  Gauge,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { HealthStatus, ServiceHealth, DashboardMetrics } from '@/lib/monitoring/types';

// Mock data for demo
const MOCK_METRICS: DashboardMetrics = {
  activeUsers: 127,
  requestsPerMinute: 342,
  errorRate: 0.8,
  avgResponseTime: 145,
  totalRequests24h: 156432,
  totalErrors24h: 1245,
  uniqueVisitors24h: 8543,
  peakRPM: 892,
  services: {
    database: { name: 'database', status: 'healthy', latency: 12, lastCheck: Date.now() },
    cache: { name: 'cache', status: 'healthy', latency: 3, lastCheck: Date.now() },
    storage: { name: 'storage', status: 'healthy', latency: 45, lastCheck: Date.now() },
    email: { name: 'email', status: 'degraded', latency: 890, lastCheck: Date.now(), message: 'High latency' },
    payments: { name: 'payments', status: 'healthy', latency: 234, lastCheck: Date.now() },
  },
  avgWebVitals: {
    LCP: 1850,
    FID: 45,
    CLS: 0.05,
    TTFB: 320,
    FCP: 1200,
  },
};

const MOCK_ALERTS = [
  { id: '1', severity: 'warning', title: 'High Email Latency', message: 'Email service responding slowly (>500ms)', timestamp: Date.now() - 5 * 60 * 1000 },
  { id: '2', severity: 'info', title: 'Deployment Complete', message: 'v1.2.3 deployed successfully', timestamp: Date.now() - 30 * 60 * 1000 },
];

const SERVICE_ICONS: Record<string, React.ElementType> = {
  database: Database,
  cache: Zap,
  storage: HardDrive,
  email: Globe,
  payments: Activity,
};

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(MOCK_METRICS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    try {
      // In production, fetch from /api/health?detailed=true
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLastRefresh(Date.now());
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'degraded':
        return 'text-amber-400';
      case 'unhealthy':
        return 'text-red-400';
    }
  };

  const getStatusIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return CheckCircle;
      case 'degraded':
        return AlertTriangle;
      case 'unhealthy':
        return XCircle;
    }
  };

  const formatUptime = (ms: number) => {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getVitalStatus = (metric: keyof typeof metrics.avgWebVitals, value?: number): HealthStatus => {
    if (!value) return 'healthy';
    const thresholds: Record<string, { good: number; poor: number }> = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
      FCP: { good: 1800, poor: 3000 },
    };
    const threshold = thresholds[metric];
    if (!threshold) return 'healthy';
    if (value <= threshold.good) return 'healthy';
    if (value <= threshold.poor) return 'degraded';
    return 'unhealthy';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-400" />
            Monitoring
          </h1>
          <p className="text-slate-400 mt-1">
            Surveillance en temps réel de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">
            Dernière mise à jour: {new Date(lastRefresh).toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Utilisateurs actifs</p>
                  <p className="text-3xl font-bold mt-1">{metrics.activeUsers}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 text-sm">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-green-400">+12%</span>
                <span className="text-slate-500">vs hier</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Requêtes/min</p>
                  <p className="text-3xl font-bold mt-1">{metrics.requestsPerMinute}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Zap className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 text-sm">
                <span className="text-slate-400">Peak:</span>
                <span className="text-white">{metrics.peakRPM} RPM</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Taux d'erreur</p>
                  <p className="text-3xl font-bold mt-1">{metrics.errorRate.toFixed(2)}%</p>
                </div>
                <div className={`p-3 rounded-xl ${metrics.errorRate < 1 ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                  <AlertTriangle className={`w-6 h-6 ${metrics.errorRate < 1 ? 'text-green-400' : 'text-amber-400'}`} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 text-sm">
                <span className="text-slate-400">{metrics.totalErrors24h} erreurs 24h</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Temps de réponse</p>
                  <p className="text-3xl font-bold mt-1">{metrics.avgResponseTime}ms</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 text-sm">
                <TrendingDown className="w-4 h-4 text-green-400" />
                <span className="text-green-400">-8%</span>
                <span className="text-slate-500">vs hier</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services Status */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                État des services
              </CardTitle>
              <CardDescription>Monitoring des services critiques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.services).map(([key, service]) => {
                  const Icon: React.ElementType = SERVICE_ICONS[key] || Server;
                  const StatusIcon = getStatusIcon(service.status);
                  
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg bg-slate-700`}>
                          {React.createElement(Icon, { className: "w-5 h-5" })}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{service.name}</p>
                          {service.message && (
                            <p className="text-sm text-slate-400">{service.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {service.latency !== undefined && (
                          <span className="text-sm text-slate-400">{service.latency}ms</span>
                        )}
                        <div className={`flex items-center gap-2 ${getStatusColor(service.status)}`}>
                          <StatusIcon className="w-5 h-5" />
                          <span className="capitalize">{service.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Web Vitals */}
          <Card className="bg-slate-900 border-slate-800 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                Core Web Vitals
              </CardTitle>
              <CardDescription>Performance utilisateur</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(metrics.avgWebVitals).map(([key, value]) => {
                  const status = getVitalStatus(key as keyof typeof metrics.avgWebVitals, value);
                  const StatusIcon = getStatusIcon(status);
                  
                  return (
                    <div key={key} className="p-4 bg-slate-800/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{key}</span>
                        <StatusIcon className={`w-4 h-4 ${getStatusColor(status)}`} />
                      </div>
                      <p className="text-2xl font-bold">
                        {key === 'CLS' ? value?.toFixed(3) : `${value?.toFixed(0)}ms`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Activity */}
        <div className="space-y-6">
          {/* Alerts */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Alertes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {MOCK_ALERTS.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p>Aucune alerte active</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {MOCK_ALERTS.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${
                        alert.severity === 'critical'
                          ? 'bg-red-500/10 border-red-500/30'
                          : alert.severity === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-blue-500/10 border-blue-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                          alert.severity === 'critical'
                            ? 'text-red-400'
                            : alert.severity === 'warning'
                            ? 'text-amber-400'
                            : 'text-blue-400'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-slate-400 mt-1">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Statistiques 24h
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-400">Total requêtes</span>
                    <span className="font-medium">{metrics.totalRequests24h.toLocaleString()}</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-400">Visiteurs uniques</span>
                    <span className="font-medium">{metrics.uniqueVisitors24h.toLocaleString()}</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-400">Erreurs</span>
                    <span className="font-medium">{metrics.totalErrors24h.toLocaleString()}</span>
                  </div>
                  <Progress value={metrics.errorRate} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">Système opérationnel</p>
                    <p className="text-sm text-slate-400">Uptime: {formatUptime(Date.now() - (Date.now() - 7 * 24 * 60 * 60 * 1000))}</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-0">v1.0.0</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


