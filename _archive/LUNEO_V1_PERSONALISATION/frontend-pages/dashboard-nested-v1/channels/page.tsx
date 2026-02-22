'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShoppingBag,
  Globe,
  Code,
  Key,
  Zap,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Circle,
  Settings,
  Plug,
  Store,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ComingSoonBadge } from '@/components/ui/coming-soon-badge';

interface Channel {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'available' | 'coming_soon';
  href: string;
  configHref?: string;
  category: 'ecommerce' | 'embed' | 'api' | 'automation';
}

const channels: Channel[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Synchronisez vos produits et commandes avec votre boutique Shopify. Installation en 2 clics.',
    icon: '🛍️',
    status: 'available',
    href: '/dashboard/integrations-dashboard',
    category: 'ecommerce',
  },
  {
    id: 'storefront',
    name: 'Storefront Luneo',
    description: 'Votre boutique hébergée directement sur Luneo. Partagez le lien, les clients personnalisent et achètent.',
    icon: '🌐',
    status: 'connected',
    href: '/dashboard/settings',
    category: 'ecommerce',
  },
  {
    id: 'widget',
    name: 'Widget embarqué',
    description: 'Collez un simple script sur n\'importe quel site. Le customizer apparaît sur votre page produit.',
    icon: '📦',
    status: 'connected',
    href: '/dashboard/customizer',
    category: 'embed',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Intégrez le customizer sur votre boutique WordPress/WooCommerce.',
    icon: '🔌',
    status: 'coming_soon',
    href: '/dashboard/integrations-dashboard',
    category: 'ecommerce',
  },
  {
    id: 'api',
    name: 'API publique',
    description: 'API REST complète pour les intégrations custom. Documentation interactive et SDK TypeScript.',
    icon: '⚡',
    status: 'available',
    href: '/dashboard/webhooks',
    category: 'api',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connectez Luneo à plus de 5000 applications via Zapier.',
    icon: '🔗',
    status: 'coming_soon',
    href: '/dashboard/integrations-dashboard',
    category: 'automation',
  },
];

const categoryLabels: Record<string, string> = {
  ecommerce: 'E-commerce',
  embed: 'Embarqué',
  api: 'Développeurs',
  automation: 'Automatisation',
};

export default function ChannelsPage() {
  const { user } = useAuth();
  const brandSlug = (user as { brandSlug?: string })?.brandSlug || 'ma-marque';

  const grouped = channels.reduce<Record<string, Channel[]>>((acc, ch) => {
    (acc[ch.category] ??= []).push(ch);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Canaux de vente</h1>
          <p className="text-white/60 mt-1">
            Vendez vos produits personnalisés partout. Connectez vos boutiques, activez le widget, ou utilisez l'API.
          </p>
        </div>
        <Button asChild variant="outline" className="border-white/[0.08] text-white/80 hover:bg-white/[0.04]">
          <Link href="/dashboard/integrations-dashboard">
            <Settings className="w-4 h-4 mr-2" />
            Intégrations avancées
          </Link>
        </Button>
      </div>

      {/* Storefront URL Banner */}
      <Card className="dash-card border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-white">Votre Storefront</h3>
            <p className="text-sm text-white/50 mt-0.5">
              luneo.app/w/{brandSlug}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline" className="border-white/[0.08] text-white/70 hover:bg-white/[0.04]">
              <Link href={`/w/${brandSlug}`} target="_blank">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Ouvrir
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Channels by Category */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">
            {categoryLabels[category] || category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((channel) => {
              const isComingSoon = channel.status === 'coming_soon';
              const cardContent = (
                <Card className="dash-card border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.10] transition-all cursor-pointer group h-full relative overflow-hidden">
                  {isComingSoon && (
                    <ComingSoonBadge variant="overlay" showNotify featureKey={channel.id} />
                  )}
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center text-lg shrink-0">
                        {channel.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-white">{channel.name}</h3>
                          {channel.status === 'connected' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          )}
                          {isComingSoon && (
                            <ComingSoonBadge />
                          )}
                        </div>
                        <span className={`text-xs ${
                          channel.status === 'connected' ? 'text-green-400' :
                          isComingSoon ? 'text-white/30' :
                          'text-white/50'
                        }`}>
                          {channel.status === 'connected' ? 'Actif' :
                           isComingSoon ? 'Bientôt' :
                           'Disponible'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-white/50 flex-1">{channel.description}</p>
                    <div className="flex items-center gap-1 mt-3 text-xs text-purple-400 group-hover:text-purple-300 transition-colors">
                      {channel.status === 'connected' ? 'Gérer' : isComingSoon ? '' : 'Connecter'}
                      {!isComingSoon && <ArrowRight className="w-3 h-3" />}
                    </div>
                  </CardContent>
                </Card>
              );
              return isComingSoon ? (
                <div key={channel.id}>{cardContent}</div>
              ) : (
                <Link key={channel.id} href={channel.href}>
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
