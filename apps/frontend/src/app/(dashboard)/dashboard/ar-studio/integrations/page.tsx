'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Plug,
  ArrowLeft,
  CheckCircle,
  XCircle,
  ExternalLink,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Intégrations AR - AR Studio
 * Configuration des intégrations AR
 */
export default function ARStudioIntegrationsPage() {
  const [integrations, setIntegrations] = useState([
    { id: 'shopify', name: 'Shopify', enabled: true, status: 'connected' },
    { id: 'woocommerce', name: 'WooCommerce', enabled: false, status: 'disconnected' },
    { id: 'magento', name: 'Magento', enabled: false, status: 'disconnected' },
    { id: 'prestashop', name: 'PrestaShop', enabled: true, status: 'connected' },
  ]);

  const handleToggle = (id: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id
          ? { ...integration, enabled: !integration.enabled }
          : integration
      )
    );
  };

  return (
    <ErrorBoundary componentName="ARStudioIntegrations">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard/ar-studio">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Plug className="w-8 h-8 text-cyan-400" />
              Intégrations AR
            </h1>
            <p className="text-slate-400 mt-2">
              Connectez vos modèles AR à vos plateformes e-commerce
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{integration.name}</CardTitle>
                      <CardDescription className="text-slate-400">
                        Intégration e-commerce
                      </CardDescription>
                    </div>
                    <Badge
                      variant={integration.status === 'connected' ? 'default' : 'secondary'}
                      className={integration.status === 'connected' ? 'bg-green-500' : 'bg-slate-600'}
                    >
                      {integration.status === 'connected' ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connecté
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Déconnecté
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Activer l'intégration</span>
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={() => handleToggle(integration.id)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-700 hover:bg-slate-800 text-white"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configurer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700 hover:bg-slate-800 text-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Documentation */}
        <Card className="bg-cyan-950/20 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-cyan-300 text-sm flex items-center gap-2">
              <Plug className="w-4 h-4" />
              Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-4">
              Pour plus d'informations sur l'intégration de vos modèles AR, consultez notre documentation complète.
            </p>
            <Button variant="outline" className="border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-300">
              <ExternalLink className="w-4 h-4 mr-2" />
              Voir la documentation
            </Button>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}

