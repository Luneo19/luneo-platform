'use client';

import React, { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingBag,
  Instagram,
  Globe,
  Smartphone,
  Code2,
  ExternalLink,
  CheckCircle,
  Settings,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'available' | 'coming_soon' | 'connected';
  category: 'ecommerce' | 'social' | 'web' | 'mobile';
  docs?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'shopify-ar',
    name: 'Shopify AR',
    description:
      "Ajoutez l'essayage virtuel directement sur vos fiches produit Shopify. Les clients peuvent voir les produits en AR avant d'acheter.",
    icon: ShoppingBag,
    status: 'available',
    category: 'ecommerce',
  },
  {
    id: 'woocommerce-ar',
    name: 'WooCommerce AR',
    description:
      "Plugin WordPress/WooCommerce pour intégrer l'AR sur votre boutique en ligne existante.",
    icon: Globe,
    status: 'available',
    category: 'ecommerce',
  },
  {
    id: 'instagram-ar',
    name: 'Instagram AR Filter',
    description:
      "Créez des filtres Instagram AR pour que vos clients essaient vos produits directement dans l'app.",
    icon: Instagram,
    status: 'coming_soon',
    category: 'social',
  },
  {
    id: 'web-embed',
    name: 'Widget Web Embed',
    description:
      "Intégrez le Virtual Try-On sur n'importe quel site web avec un simple snippet JavaScript.",
    icon: Code2,
    status: 'available',
    category: 'web',
  },
  {
    id: 'ios-sdk',
    name: 'iOS SDK (ARKit)',
    description:
      "SDK natif iOS utilisant ARKit pour une expérience AR native dans votre application mobile.",
    icon: Smartphone,
    status: 'coming_soon',
    category: 'mobile',
  },
  {
    id: 'android-sdk',
    name: 'Android SDK (ARCore)',
    description:
      "SDK natif Android utilisant ARCore pour l'essayage virtuel dans votre app Android.",
    icon: Smartphone,
    status: 'coming_soon',
    category: 'mobile',
  },
];

function ARIntegrationsContent() {
  const [filter, setFilter] = useState<'all' | 'ecommerce' | 'social' | 'web' | 'mobile'>('all');

  const filtered: Integration[] =
    filter === 'all' ? INTEGRATIONS : INTEGRATIONS.filter((i) => i.category === filter);

  const statusColor = (s: string) => {
    if (s === 'connected') return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (s === 'available') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  const statusLabel = (s: string) => {
    if (s === 'connected') return 'Connecté';
    if (s === 'available') return 'Disponible';
    return 'Bientôt';
  };

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Intégrations AR</h1>
          <p className="text-muted-foreground mt-1">
            Connectez le Virtual Try-On à vos plateformes e-commerce, réseaux sociaux et sites web.
          </p>
        </div>
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { value: 'all', label: 'Toutes' },
            { value: 'ecommerce', label: 'E-commerce' },
            { value: 'social', label: 'Social' },
            { value: 'web', label: 'Web' },
            { value: 'mobile', label: 'Mobile' },
          ].map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value as 'all' | 'ecommerce' | 'social' | 'web' | 'mobile')}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((integration: Integration) => (
            <Card key={integration.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {React.createElement(integration.icon, { className: 'w-5 h-5 text-primary' })}
                    </div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className={statusColor(integration.status)}>
                    {String(statusLabel(integration.status))}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
                <div className="flex gap-2">
                  {integration.status === 'available' && (
                    <Button size="sm" className="flex-1">
                      <Settings className="w-4 h-4 mr-1" /> Configurer
                    </Button>
                  )}
                  {integration.status === 'connected' && (
                    <Button size="sm" variant="outline" className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-1" /> Gérer
                    </Button>
                  )}
                  {integration.status === 'coming_soon' && (
                    <Button size="sm" variant="outline" disabled className="flex-1">
                      Bientôt disponible
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5" /> API & Embed Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Utilisez votre clé API pour intégrer le Virtual Try-On via notre SDK JavaScript.
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm">
              {'<script src="https://cdn.luneo.app/tryon/v1/embed.js"></script>'}
              <br />
              {'<div id="luneo-tryon" data-brand-id="YOUR_BRAND_ID"></div>'}
            </div>
            <Button variant="outline" size="sm" className="mt-3">
              <ExternalLink className="w-4 h-4 mr-1" /> Documentation complète
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const MemoizedContent = memo(ARIntegrationsContent);

export default function ARIntegrationsPage() {
  return (
    <ErrorBoundary level="page" componentName="ARIntegrationsPage">
      <MemoizedContent />
    </ErrorBoundary>
  );
}
