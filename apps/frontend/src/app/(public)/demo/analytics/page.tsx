'use client';

import React, { useState, memo, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const mockMetrics = [
  { label: 'Visiteurs uniques', value: '12,480', change: '+8.3%', up: true, icon: Users },
  { label: 'Taux de conversion', value: '4.2%', change: '+1.1%', up: true, icon: Target },
  { label: 'Designs personnalises', value: '3,847', change: '+22.4%', up: true, icon: TrendingUp },
  { label: 'Engagement moyen', value: '2m 34s', change: '+15.6%', up: true, icon: PieChart },
];

const mockFunnel = [
  { step: 'Vue produit', count: 8240, pct: 100 },
  { step: 'Personnalisation lancee', count: 4120, pct: 50.0 },
  { step: 'Design finalise', count: 2060, pct: 25.0 },
  { step: 'Commande validee', count: 1030, pct: 12.5 },
];

const mockCohorts = [
  { month: 'Jan', m0: 100, m1: 72, m2: 58, m3: 49, m4: 44 },
  { month: 'Fev', m0: 100, m1: 68, m2: 54, m3: 47 },
  { month: 'Mar', m0: 100, m1: 74, m2: 61 },
  { month: 'Avr', m0: 100, m1: 71 },
  { month: 'Mai', m0: 100 },
];

function SmartAnalyticsDemoPageContent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'cohorts'>('overview');

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/demo">
            <Button variant="outline" className="border-emerald-500/50 hover:bg-emerald-500/10 mb-6">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Retour
            </Button>
          </Link>

          <motion initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-2">
                  Smart Analytics
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/50">
                    Demo
                  </span>
                </h1>
                <p className="text-gray-400">Analytics avances avec predictions IA et funnels</p>
              </div>
            </div>
          </motion>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {(['overview', 'funnel', 'cohorts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {tab === 'overview' ? 'Vue globale' : tab === 'funnel' ? 'Funnel' : 'Cohortes'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockMetrics.map((m) => (
                <Card key={m.label} className="p-5 bg-gray-900/50 border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <m.icon className="w-5 h-5 text-emerald-400" />
                    <span
                      className={`text-xs font-medium flex items-center gap-0.5 ${
                        m.up ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {m.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {m.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">{m.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{m.label}</p>
                </Card>
              ))}
            </div>

            {/* Mock chart placeholder */}
            <Card className="p-6 bg-gray-900/50 border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Tendance des revenus (30 jours)
              </h3>
              <div className="h-48 flex items-end gap-1">
                {Array.from({ length: 30 }, (_, i) => {
                  const h = 20 + Math.sin(i * 0.4) * 15 + Math.random() * 30;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                      style={{ height: `${h}%` }}
                      title={`Jour ${i + 1}`}
                    />
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Funnel Tab */}
        {activeTab === 'funnel' && (
          <Card className="p-6 bg-gray-900/50 border-gray-700">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Funnel de conversion
            </h3>
            <div className="space-y-4">
              {mockFunnel.map((step, i) => (
                <div key={step.step}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{step.step}</span>
                    <span className="text-sm text-gray-400">
                      {step.count.toLocaleString()} ({step.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-8 bg-gray-800 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${step.pct}%` }}
                    >
                      {step.pct > 15 && (
                        <span className="text-xs text-white font-medium">{step.pct}%</span>
                      )}
                    </div>
                  </div>
                  {i < mockFunnel.length - 1 && (
                    <p className="text-xs text-gray-500 mt-1 ml-4">
                      Taux de passage : {((mockFunnel[i + 1].count / step.count) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Cohorts Tab */}
        {activeTab === 'cohorts' && (
          <Card className="p-6 bg-gray-900/50 border-gray-700 overflow-x-auto">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-400" />
              Retention par cohorte (%)
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400">
                  <th className="text-left py-2 pr-4">Cohorte</th>
                  <th className="px-3 py-2">M0</th>
                  <th className="px-3 py-2">M1</th>
                  <th className="px-3 py-2">M2</th>
                  <th className="px-3 py-2">M3</th>
                  <th className="px-3 py-2">M4</th>
                </tr>
              </thead>
              <tbody>
                {mockCohorts.map((row) => (
                  <tr key={row.month} className="border-t border-gray-800">
                    <td className="py-2 pr-4 text-gray-300 font-medium">{row.month} 2026</td>
                    {[row.m0, row.m1, row.m2, row.m3, row.m4].map((v, ci) => (
                      <td key={ci} className="px-3 py-2 text-center">
                        {v !== undefined ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              v >= 70
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : v >= 50
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : v >= 30
                                    ? 'bg-orange-500/20 text-orange-400'
                                    : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {v}%
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-900/50 border border-emerald-500/20 rounded-lg">
            <BarChart3 className="w-10 h-10 text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Predictions IA</h3>
            <p className="text-sm text-gray-400">
              Anticipez les tendances avec des modeles predictifs entraines sur vos donnees
            </p>
          </div>
          <div className="p-6 bg-gray-900/50 border border-teal-500/20 rounded-lg">
            <Target className="w-10 h-10 text-teal-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Funnels avances</h3>
            <p className="text-sm text-gray-400">
              Visualisez chaque etape du parcours client et identifiez les points de friction
            </p>
          </div>
          <div className="p-6 bg-gray-900/50 border border-cyan-500/20 rounded-lg">
            <Activity className="w-10 h-10 text-cyan-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Anomalies detectees</h3>
            <p className="text-sm text-gray-400">
              Alertes automatiques quand une metrique devie de la normale
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">Debloquez les analytics IA complets avec un compte</p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8"
            >
              Commencer Gratuitement
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const MemoizedContent = memo(SmartAnalyticsDemoPageContent);

export default function SmartAnalyticsDemoPage() {
  return (
    <ErrorBoundary level="page" componentName="SmartAnalyticsDemoPage">
      <MemoizedContent />
    </ErrorBoundary>
  );
}
