'use client';

import React from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, FileText, Factory, Truck, AlertCircle, ArrowRight } from 'lucide-react';

interface PipelineStage {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

interface PipelineAlert {
  message: string;
  href: string;
  cta: string;
}

function getAlerts(products: number, selling: number, orders: number): PipelineAlert[] {
  const alerts: PipelineAlert[] = [];
  if (products === 0) {
    alerts.push({
      message: 'Créez votre premier produit pour démarrer.',
      href: '/dashboard/products',
      cta: 'Créer un produit',
    });
  } else if (selling === 0) {
    alerts.push({
      message: `${products} produit${products > 1 ? 's' : ''} sans canal de vente. Connectez un canal pour commencer à vendre.`,
      href: '/dashboard/channels',
      cta: 'Connecter un canal',
    });
  }
  if (orders > 0 && selling === 0) {
    alerts.push({
      message: 'Des commandes sont en attente. Vérifiez vos canaux de distribution.',
      href: '/dashboard/orders',
      cta: 'Voir les commandes',
    });
  }
  return alerts;
}

export function OverviewPipeline({
  products = 0,
  selling = 0,
  orders = 0,
  inProduction = 0,
  delivered = 0,
}: {
  products?: number;
  selling?: number;
  orders?: number;
  inProduction?: number;
  delivered?: number;
}) {
  const stages: PipelineStage[] = [
    { label: 'Produits', value: products, icon: Package, href: '/dashboard/products', color: 'from-purple-500 to-pink-500' },
    { label: 'En vente', value: selling, icon: ShoppingBag, href: '/dashboard/channels', color: 'from-cyan-500 to-blue-500' },
    { label: 'Commandes', value: orders, icon: FileText, href: '/dashboard/orders', color: 'from-amber-500 to-orange-500' },
    { label: 'Production', value: inProduction, icon: Factory, href: '/dashboard/production', color: 'from-emerald-500 to-cyan-500' },
    { label: 'Livrées', value: delivered, icon: Truck, href: '/dashboard/orders', color: 'from-green-500 to-emerald-500' },
  ];

  const alerts = getAlerts(products, selling, orders);

  return (
    <div className="dash-card rounded-2xl p-5 border border-white/[0.06]">
      <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">
        Pipeline — Du design à la livraison
      </h2>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <React.Fragment key={stage.label}>
              <Link href={stage.href} className="flex-1 min-w-[110px] group">
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stage.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">{stage.value}</span>
                  <span className="text-xs text-white/50">{stage.label}</span>
                </div>
              </Link>
              {i < stages.length - 1 && (
                <div className="flex items-center shrink-0 px-0.5">
                  <div className="w-6 h-px bg-white/[0.12]" />
                  <div className="w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] border-l-white/[0.15]" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {alerts.map((alert) => (
            <Link
              key={alert.href}
              href={alert.href}
              className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 hover:bg-amber-500/10 transition-colors group"
            >
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs text-amber-200/80 flex-1">{alert.message}</span>
              <span className="flex items-center gap-1 text-xs font-medium text-amber-400 group-hover:text-amber-300 shrink-0">
                {alert.cta}
                <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
