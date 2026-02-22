'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Factory,
  Printer,
  FileOutput,
  Truck,
  ArrowRight,
  Settings,
  CheckCircle2,
  Circle,
} from 'lucide-react';

export default function ProductProductionPage() {
  const params = useParams();
  const productId = params.id as string;

  return (
    <div className="space-y-6">
      {/* Production Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PipelineStep
          step={1}
          title="Fichiers print-ready"
          description="Export haute résolution, CMYK, fonds perdus"
          active={false}
          icon={FileOutput}
        />
        <PipelineStep
          step={2}
          title="Fabrication"
          description="SVG vectoriel, PDF production, DXF découpe"
          active={false}
          icon={Factory}
        />
        <PipelineStep
          step={3}
          title="Print-on-Demand"
          description="Envoi automatique à Printful, Gelato"
          active={false}
          icon={Printer}
        />
        <PipelineStep
          step={4}
          title="Expédition"
          description="Suivi, tracking, retours"
          active={false}
          icon={Truck}
        />
      </div>

      {/* POD Configuration */}
      <Card className="dash-card border-white/[0.06] bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-white">Print-on-Demand</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-white/50">
            Connectez un fournisseur POD pour automatiser la fabrication et l'expédition de ce produit.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PODProvider name="Printful" connected={false} />
            <PODProvider name="Gelato" connected={false} />
            <PODProvider name="Printify" connected={false} />
          </div>
          <Button asChild variant="outline" size="sm" className="border-white/[0.08] text-white/70 hover:bg-white/[0.04]">
            <Link href="/dashboard/production">
              <Settings className="w-4 h-4 mr-2" />
              Gérer la production
              <ArrowRight className="w-3 h-3 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Manufacturing Files */}
      <Card className="dash-card border-white/[0.06] bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-white">Fichiers de fabrication</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/50 mb-4">
            Les fichiers de production seront générés automatiquement à chaque commande de ce produit.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/[0.06] text-white/60">PDF print-ready (300 DPI)</span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/[0.06] text-white/60">SVG vectoriel</span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/[0.06] text-white/60">DXF découpe</span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/[0.06] text-white/60">PNG haute résolution</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PipelineStep({
  step,
  title,
  description,
  active,
  icon: Icon,
}: {
  step: number;
  title: string;
  description: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className={`dash-card border-white/[0.06] bg-white/[0.03] ${active ? 'border-green-500/20' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            active ? 'bg-green-500/20 text-green-400' : 'bg-white/[0.06] text-white/40'
          }`}>
            {step}
          </div>
          <Icon className={`w-4 h-4 ${active ? 'text-green-400' : 'text-white/40'}`} />
        </div>
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <p className="text-xs text-white/50 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function PODProvider({ name, connected }: { name: string; connected: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      connected ? 'border-green-500/20 bg-green-500/5' : 'border-white/[0.06] bg-white/[0.02]'
    }`}>
      {connected ? (
        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
      ) : (
        <Circle className="w-4 h-4 text-white/30 shrink-0" />
      )}
      <span className="text-sm text-white">{name}</span>
      <span className={`ml-auto text-xs ${connected ? 'text-green-400' : 'text-white/40'}`}>
        {connected ? 'Connecté' : 'Non connecté'}
      </span>
    </div>
  );
}
