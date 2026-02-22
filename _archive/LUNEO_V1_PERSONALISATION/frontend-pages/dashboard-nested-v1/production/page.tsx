'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Factory,
  Printer,
  FileOutput,
  Truck,
  ArrowRight,
  Package,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Settings,
  BarChart3,
} from 'lucide-react';

interface ProductionStat {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const stats: ProductionStat[] = [
  { label: 'En attente', value: '—', icon: Clock, color: 'text-amber-400' },
  { label: 'En production', value: '—', icon: Factory, color: 'text-blue-400' },
  { label: 'Expédiées', value: '—', icon: Truck, color: 'text-green-400' },
  { label: 'Problèmes', value: '—', icon: AlertTriangle, color: 'text-red-400' },
];

export default function ProductionPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Production</h1>
        <p className="text-white/60 mt-1">
          Du design au produit livré. Gérez la fabrication, le print-on-demand et les expéditions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="dash-card border-white/[0.06] bg-white/[0.03]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-white/50">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Production Pipeline */}
      <Card className="dash-card border-white/[0.06] bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-white">Pipeline de production</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {[
              { label: 'Commande reçue', icon: Package, active: true },
              { label: 'Fichiers générés', icon: FileOutput, active: false },
              { label: 'En fabrication', icon: Factory, active: false },
              { label: 'Expédié', icon: Truck, active: false },
              { label: 'Livré', icon: CheckCircle2, active: false },
            ].map((step, i, arr) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-2 min-w-[100px]">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.active ? 'bg-purple-500/20 text-purple-400' : 'bg-white/[0.06] text-white/30'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs text-center ${step.active ? 'text-white' : 'text-white/40'}`}>
                    {step.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex-1 h-px bg-white/[0.08] min-w-[20px]" />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Print-on-Demand */}
        <Card className="dash-card border-white/[0.06] bg-white/[0.03]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                <Printer className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <CardTitle className="text-white text-base">Print-on-Demand</CardTitle>
                <p className="text-xs text-white/50">Fabrication automatique à la demande</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <PODRow name="Printful" connected={false} />
            <PODRow name="Gelato" connected={false} />
            <PODRow name="Printify" connected={false} />
            <Button asChild variant="outline" size="sm" className="w-full border-white/[0.08] text-white/70 hover:bg-white/[0.04]">
              <Link href="/dashboard/integrations-dashboard">
                <Settings className="w-3.5 h-3.5 mr-1.5" />
                Configurer les fournisseurs
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Manufacturing */}
        <Card className="dash-card border-white/[0.06] bg-white/[0.03]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                <Factory className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <CardTitle className="text-white text-base">Fabrication</CardTitle>
                <p className="text-xs text-white/50">Fichiers de production et export</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <FormatRow label="PDF print-ready" desc="300 DPI, CMYK, fonds perdus" />
              <FormatRow label="SVG vectoriel" desc="Découpe et gravure" />
              <FormatRow label="DXF" desc="Compatible CNC et laser" />
              <FormatRow label="PNG haute résolution" desc="Export numérique" />
            </div>
          </CardContent>
        </Card>

        {/* Fulfillment */}
        <Card className="dash-card border-white/[0.06] bg-white/[0.03]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                <Truck className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <CardTitle className="text-white text-base">Expéditions</CardTitle>
                <p className="text-xs text-white/50">Suivi et livraison</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-sm text-white/50 mb-3">
                Le suivi des expéditions s'affichera ici une fois vos premières commandes en production.
              </p>
              <Button asChild variant="outline" size="sm" className="border-white/[0.08] text-white/70 hover:bg-white/[0.04]">
                <Link href="/dashboard/orders">
                  Voir les commandes
                  <ArrowRight className="w-3 h-3 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card className="dash-card border-white/[0.06] bg-white/[0.03]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <CardTitle className="text-white text-base">Métriques production</CardTitle>
                <p className="text-xs text-white/50">Coûts, délais, qualité</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-sm text-white/50 mb-3">
                Les métriques de production apparaîtront ici avec vos premières commandes.
              </p>
              <Button asChild variant="outline" size="sm" className="border-white/[0.08] text-white/70 hover:bg-white/[0.04]">
                <Link href="/dashboard/analytics">
                  Analytics globales
                  <ArrowRight className="w-3 h-3 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PODRow({ name, connected }: { name: string; connected: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg ${
      connected ? 'bg-green-500/5 border border-green-500/20' : 'bg-white/[0.02] border border-white/[0.04]'
    }`}>
      {connected ? (
        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
      ) : (
        <Circle className="w-4 h-4 text-white/30 shrink-0" />
      )}
      <span className="text-sm text-white flex-1">{name}</span>
      <span className={`text-xs ${connected ? 'text-green-400' : 'text-white/40'}`}>
        {connected ? 'Connecté' : 'Non connecté'}
      </span>
    </div>
  );
}

function FormatRow({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
      <FileOutput className="w-4 h-4 text-white/40 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{label}</p>
        <p className="text-xs text-white/40">{desc}</p>
      </div>
    </div>
  );
}
