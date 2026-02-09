'use client';

import React, { useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Settings,
  Zap,
  ShoppingCart,
  Mail,
  Calendar,
  Code,
} from 'lucide-react';
import Link from 'next/link';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'pending';
  category: 'ecommerce' | 'marketing' | 'development' | 'other';
  connectUrl?: string;
  settingsUrl?: string;
}

const integrations: Integration[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Intégration native pour synchroniser produits et commandes',
    icon: <ShoppingCart className="w-6 h-6" />,
    status: 'disconnected',
    category: 'ecommerce',
    connectUrl: '/api/integrations/shopify/connect',
    settingsUrl: '/dashboard/integrations/shopify',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Connectez votre boutique WooCommerce',
    icon: <ShoppingCart className="w-6 h-6" />,
    status: 'disconnected',
    category: 'ecommerce',
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    description: 'Synchronisez vos emails marketing',
    icon: <Mail className="w-6 h-6" />,
    status: 'disconnected',
    category: 'marketing',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automatisez vos workflows avec Zapier',
    icon: <Zap className="w-6 h-6" />,
    status: 'disconnected',
    category: 'other',
  },
  {
    id: 'api',
    name: 'API REST',
    description: 'Intégration via API REST',
    icon: <Code className="w-6 h-6" />,
    status: 'connected',
    category: 'development',
    settingsUrl: '/help/documentation/api',
  },
];

const getStatusIcon = (status: Integration['status']) => {
  switch (status) {
    case 'connected':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'pending':
      return <Clock className="w-5 h-5 text-yellow-500" />;
    default:
      return <XCircle className="w-5 h-5 text-white/30" />;
  }
};

const getStatusLabel = (status: Integration['status']) => {
  switch (status) {
    case 'connected':
      return 'Connecté';
    case 'pending':
      return 'En attente';
    default:
      return 'Non connecté';
  }
};

function IntegrationsDashboardPageContent() {
  const [filter, setFilter] = useState<'all' | Integration['category']>('all');

  const filteredIntegrations = filter === 'all'
    ? integrations
    : integrations.filter(i => i.category === filter);

  const categories = [
    { id: 'all', label: 'Toutes', count: integrations.length },
    { id: 'ecommerce', label: 'E-commerce', count: integrations.filter(i => i.category === 'ecommerce').length },
    { id: 'marketing', label: 'Marketing', count: integrations.filter(i => i.category === 'marketing').length },
    { id: 'development', label: 'Développement', count: integrations.filter(i => i.category === 'development').length },
    { id: 'other', label: 'Autres', count: integrations.filter(i => i.category === 'other').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Intégrations</h1>
          <p className="text-white/60">
            Connectez vos outils préférés pour automatiser vos workflows
          </p>
        </div>
        <Link href="/help/documentation/integrations">
          <Button variant="outline" className="border-white/[0.06] hover:bg-white/[0.04]">
            <ExternalLink className="w-4 h-4 mr-2" />
            Documentation
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id as 'all' | Integration['category'])}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === cat.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.06]'
            }`}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => (
          <Card
            key={integration.id}
            className="dash-card p-6 border-white/[0.06] bg-white/[0.03] backdrop-blur-sm hover:border-white/[0.10] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                  {integration.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(integration.status)}
                    <span className="text-sm text-white/60">{getStatusLabel(integration.status)}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-white/60 mb-4">{integration.description}</p>

            <div className="flex gap-2">
              {integration.status === 'connected' ? (
                <>
                  {integration.settingsUrl && (
                    <Link href={integration.settingsUrl} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full border-white/[0.06] hover:bg-white/[0.04]">
                        <Settings className="w-4 h-4 mr-2" />
                        Paramètres
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  {integration.connectUrl ? (
                    <Link href={integration.connectUrl} className="flex-1">
                      <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                        Connecter
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" className="flex-1 bg-white/[0.06] hover:bg-white/[0.04] text-white/60" disabled>
                      Bientôt disponible
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="dash-card-glow p-6 border-purple-500/30 bg-purple-500/5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 flex-shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Besoin d'aide ?</h3>
            <p className="text-sm text-white/60 mb-4">
              Consultez notre documentation pour configurer vos intégrations ou contactez notre support.
            </p>
            <div className="flex gap-3">
              <Link href="/help/documentation/integrations">
                <Button variant="outline" size="sm" className="border-purple-500/50 hover:bg-purple-500/10">
                  Documentation
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="sm" className="border-white/[0.06] hover:bg-white/[0.04]">
                  Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function IntegrationsDashboardPage() {
  return (
    <ErrorBoundary level="page" componentName="IntegrationsDashboardPage">
      <IntegrationsDashboardPageContent />
    </ErrorBoundary>
  );
}
