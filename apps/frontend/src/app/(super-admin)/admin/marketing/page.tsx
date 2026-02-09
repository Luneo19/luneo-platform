'use client';

/**
 * Admin Marketing - Vue d'ensemble campagnes et automations
 */
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Mail,
  Zap,
  BarChart3,
  Target,
  ArrowRight,
  Send,
  TrendingUp,
} from 'lucide-react';

const KPI_CARDS = [
  { label: 'Campagnes actives', value: '12', icon: Target, color: 'text-cyan-400' },
  { label: 'Emails envoyés', value: '48.2k', icon: Send, color: 'text-green-400' },
  { label: "Taux d'ouverture", value: '34%', icon: Mail, color: 'text-amber-400' },
  { label: 'Conversions', value: '2.8%', icon: TrendingUp, color: 'text-purple-400' },
];

export default function AdminMarketingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Marketing</h1>
        <p className="mt-2 text-zinc-400">
          Gestion des campagnes et automations
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="border-zinc-700 bg-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">{kpi.label}</p>
                    <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-700/50 p-3">
                    <Icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Links grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link href="/admin/marketing/automations">
          <Card className="border-zinc-700 bg-zinc-800 transition-colors hover:border-cyan-500/50 hover:bg-zinc-800/90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="h-5 w-5 text-cyan-400" />
                Automations
              </CardTitle>
              <ArrowRight className="h-5 w-5 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-400">
                Gérer les workflows automatisés
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-zinc-700 bg-zinc-800 opacity-90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-white">
              <Mail className="h-5 w-5 text-cyan-400" />
              Campagnes Email
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-zinc-400">
              Créer et gérer les campagnes email (à venir)
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
