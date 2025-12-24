'use client';

/**
 * Integrations Dashboard
 * EC-005: Dashboard pour gérer les intégrations e-commerce
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plug,
  Store,
  ShoppingBag,
  Package,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Settings,
  Trash2,
  ExternalLink,
  Plus,
  Loader2,
  Clock,
  ArrowUpDown,
  Database,
  Webhook,
  Shield,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import type { Integration, EcommercePlatform, IntegrationStatus } from '@/lib/integrations/types';

// Available platforms
const PLATFORMS = [
  {
    id: 'shopify' as EcommercePlatform,
    name: 'Shopify',
    icon: '🛍️',
    color: 'from-green-500 to-emerald-500',
    description: 'Intégration complète avec Shopify',
    features: ['Sync produits', 'Sync commandes', 'Webhooks', 'Inventaire'],
  },
  {
    id: 'woocommerce' as EcommercePlatform,
    name: 'WooCommerce',
    icon: '🛒',
    color: 'from-purple-500 to-violet-500',
    description: 'Connectez votre boutique WordPress',
    features: ['Sync produits', 'Sync commandes', 'REST API', 'Inventaire'],
  },
  {
    id: 'prestashop' as EcommercePlatform,
    name: 'PrestaShop',
    icon: '🏪',
    color: 'from-pink-500 to-rose-500',
    description: 'Intégration PrestaShop',
    features: ['Sync produits', 'Sync commandes', 'Webservices'],
    comingSoon: true,
  },
  {
    id: 'magento' as EcommercePlatform,
    name: 'Magento',
    icon: '🔶',
    color: 'from-orange-500 to-amber-500',
    description: 'Pour les grandes boutiques',
    features: ['REST API', 'GraphQL', 'Sync complet'],
    comingSoon: true,
  },
];

// Mock connected integrations
const MOCK_INTEGRATIONS: Integration[] = [
  {
    id: 'int_1',
    userId: 'user_1',
    platform: 'shopify',
    status: 'connected',
    storeName: 'Ma Boutique Fashion',
    storeUrl: 'ma-boutique-fashion.myshopify.com',
    settings: {
      autoSync: true,
      syncInterval: 30,
      importProducts: true,
      exportDesigns: true,
      webhooksEnabled: true,
      notifyOnOrder: true,
      notifyOnSync: false,
    },
    syncConfig: {
      products: { enabled: true, direction: 'bidirectional' },
      orders: { enabled: true, statuses: ['paid', 'fulfilled'] },
      inventory: { enabled: true, updateStock: true },
    },
    lastSyncAt: Date.now() - 15 * 60 * 1000,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
];

// Mock sync history
const MOCK_SYNC_HISTORY = [
  { id: 's1', type: 'products', direction: 'import', items: 45, status: 'success', timestamp: Date.now() - 15 * 60 * 1000 },
  { id: 's2', type: 'orders', direction: 'import', items: 12, status: 'success', timestamp: Date.now() - 45 * 60 * 1000 },
  { id: 's3', type: 'inventory', direction: 'export', items: 8, status: 'partial', timestamp: Date.now() - 2 * 60 * 60 * 1000 },
  { id: 's4', type: 'products', direction: 'export', items: 3, status: 'failed', timestamp: Date.now() - 4 * 60 * 60 * 1000 },
];

function IntegrationsPageContent() {
  const [integrations, setIntegrations] = useState(MOCK_INTEGRATIONS);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<EcommercePlatform | null>(null);

  // Connection form state
  const [formData, setFormData] = useState({
    storeDomain: '',
    apiKey: '',
    apiSecret: '',
  });

  const handleConnect = async () => {
    if (!selectedPlatform) return;
    
    setIsConnecting(true);
    // Simulate connection
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const newIntegration: Integration = {
      id: `int_${Date.now()}`,
      userId: 'user_1',
      platform: selectedPlatform,
      status: 'connected',
      storeName: formData.storeDomain.split('.')[0],
      storeUrl: formData.storeDomain,
      settings: {
        autoSync: true,
        syncInterval: 30,
        importProducts: true,
        exportDesigns: true,
        webhooksEnabled: true,
        notifyOnOrder: true,
        notifyOnSync: false,
      },
      syncConfig: {
        products: { enabled: true, direction: 'bidirectional' },
        orders: { enabled: true },
        inventory: { enabled: true, updateStock: true },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setIntegrations([...integrations, newIntegration]);
    setIsConnecting(false);
    setShowAddDialog(false);
    setSelectedPlatform(null);
    setFormData({ storeDomain: '', apiKey: '', apiSecret: '' });
  };

  const handleSync = async (integrationId: string) => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsSyncing(false);
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(integrations.filter((i) => i.id !== integrationId));
    setSelectedIntegration(null);
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    return new Date(timestamp).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status: IntegrationStatus) => {
    const styles = {
      connected: 'bg-green-500/20 text-green-400 border-green-500/30',
      disconnected: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30',
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    const labels = {
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      error: 'Erreur',
      pending: 'En attente',
    };
    return (
      <Badge className={styles[status]} variant="outline">
        {status === 'connected' && <Check className="w-3 h-3 mr-1" />}
        {status === 'error' && <AlertTriangle className="w-3 h-3 mr-1" />}
        {labels[status]}
      </Badge>
    );
  };

  const platformConfig = PLATFORMS.find((p) => p.id === selectedPlatform);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Plug className="w-8 h-8 text-blue-400" />
            Intégrations
          </h1>
          <p className="text-slate-400 mt-1">
            Connectez vos boutiques e-commerce
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle intégration
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter une intégration</DialogTitle>
              <DialogDescription>
                Choisissez votre plateforme e-commerce
              </DialogDescription>
            </DialogHeader>

            {!selectedPlatform ? (
              <div className="grid grid-cols-2 gap-4 py-4">
                {PLATFORMS.map((platform) => (
                  <motion.button
                    key={platform.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => !platform.comingSoon && setSelectedPlatform(platform.id)}
                    disabled={platform.comingSoon}
                    className={`
                      p-4 rounded-xl border text-left transition-all relative
                      ${platform.comingSoon
                        ? 'border-slate-700 bg-slate-800/30 cursor-not-allowed opacity-60'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }
                    `}
                  >
                    {platform.comingSoon && (
                      <Badge className="absolute top-2 right-2 bg-slate-700">
                        Bientôt
                      </Badge>
                    )}
                    <div className="text-3xl mb-2">{platform.icon}</div>
                    <h3 className="font-semibold">{platform.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">{platform.description}</p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {platform.features.slice(0, 3).map((f) => (
                        <Badge key={f} variant="outline" className="text-xs border-slate-700">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                  <span className="text-2xl">{platformConfig?.icon}</span>
                  <div>
                    <h3 className="font-semibold">{platformConfig?.name}</h3>
                    <p className="text-sm text-slate-400">{platformConfig?.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setSelectedPlatform(null)}
                  >
                    Changer
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Domaine de la boutique</Label>
                    <Input
                      placeholder={selectedPlatform === 'shopify' ? 'ma-boutique.myshopify.com' : 'www.ma-boutique.com'}
                      value={formData.storeDomain}
                      onChange={(e) => setFormData({ ...formData, storeDomain: e.target.value })}
                      className="bg-slate-800 border-slate-700 mt-1"
                    />
                  </div>

                  {selectedPlatform === 'shopify' ? (
                    <div>
                      <Label>Access Token</Label>
                      <Input
                        type="password"
                        placeholder="shpat_xxxxxxxxxxxx"
                        value={formData.apiKey}
                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                        className="bg-slate-800 border-slate-700 mt-1"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Créez une app privée dans votre admin Shopify
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label>Consumer Key</Label>
                        <Input
                          placeholder="ck_xxxxxxxxxxxx"
                          value={formData.apiKey}
                          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                          className="bg-slate-800 border-slate-700 mt-1"
                        />
                      </div>
                      <div>
                        <Label>Consumer Secret</Label>
                        <Input
                          type="password"
                          placeholder="cs_xxxxxxxxxxxx"
                          value={formData.apiSecret}
                          onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                          className="bg-slate-800 border-slate-700 mt-1"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Annuler
              </Button>
              {selectedPlatform && (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || !formData.storeDomain || !formData.apiKey}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <Plug className="w-4 h-4 mr-2" />
                      Connecter
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connected Integrations */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Intégrations actives</h2>
          
          {integrations.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="py-12 text-center">
                <Store className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucune intégration</h3>
                <p className="text-slate-400 mb-6">
                  Connectez votre première boutique e-commerce
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une intégration
                </Button>
              </CardContent>
            </Card>
          ) : (
            integrations.map((integration) => {
              const platform = PLATFORMS.find((p) => p.id === integration.platform);
              return (
                <motion.div
                  key={integration.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    className={`bg-slate-900 border-slate-800 cursor-pointer transition-all hover:border-slate-700 ${
                      selectedIntegration?.id === integration.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform?.color} flex items-center justify-center text-2xl`}>
                            {platform?.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold">{integration.storeName}</h3>
                            <p className="text-sm text-slate-400">{integration.storeUrl}</p>
                            <div className="flex items-center gap-3 mt-2">
                              {getStatusBadge(integration.status)}
                              {integration.lastSyncAt && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Sync {formatTime(integration.lastSyncAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSync(integration.id);
                            }}
                            disabled={isSyncing}
                          >
                            <RefreshCw className={`w-4 h-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Quick stats */}
                      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
                        <div>
                          <p className="text-2xl font-bold">145</p>
                          <p className="text-sm text-slate-400">Produits sync</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">32</p>
                          <p className="text-sm text-slate-400">Commandes</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">98%</p>
                          <p className="text-sm text-slate-400">Taux de succès</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Sidebar - Integration Details or Available Platforms */}
        <div className="space-y-4">
          {selectedIntegration ? (
            <>
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sync automatique</p>
                      <p className="text-sm text-slate-400">Toutes les 30 min</p>
                    </div>
                    <Switch checked={selectedIntegration.settings.autoSync} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Import produits</p>
                      <p className="text-sm text-slate-400">Depuis la boutique</p>
                    </div>
                    <Switch checked={selectedIntegration.settings.importProducts} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Export designs</p>
                      <p className="text-sm text-slate-400">Vers la boutique</p>
                    </div>
                    <Switch checked={selectedIntegration.settings.exportDesigns} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Webhooks</p>
                      <p className="text-sm text-slate-400">Notifications temps réel</p>
                    </div>
                    <Switch checked={selectedIntegration.settings.webhooksEnabled} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">Historique de sync</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {MOCK_SYNC_HISTORY.map((sync) => (
                      <div key={sync.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {sync.status === 'success' && <Check className="w-4 h-4 text-green-400" />}
                          {sync.status === 'partial' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                          {sync.status === 'failed' && <X className="w-4 h-4 text-red-400" />}
                          <span className="capitalize">{sync.type}</span>
                          <Badge variant="outline" className="text-xs">
                            {sync.direction === 'import' ? '↓' : '↑'} {sync.items}
                          </Badge>
                        </div>
                        <span className="text-slate-500">{formatTime(sync.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => handleDisconnect(selectedIntegration.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Déconnecter
              </Button>
            </>
          ) : (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Plateformes disponibles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {PLATFORMS.map((platform) => (
                  <div
                    key={platform.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      platform.comingSoon ? 'opacity-50' : 'hover:bg-slate-800 cursor-pointer'
                    }`}
                    onClick={() => !platform.comingSoon && setShowAddDialog(true)}
                  >
                    <span className="text-2xl">{platform.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{platform.name}</p>
                    </div>
                    {platform.comingSoon ? (
                      <Badge variant="outline" className="text-xs">Bientôt</Badge>
                    ) : (
                      <Plus className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

const MemoizedIntegrationsPageContent = memo(IntegrationsPageContent);

export default function IntegrationsPage() {
  return (
    <ErrorBoundary level="page" componentName="IntegrationsPage">
      <MemoizedIntegrationsPageContent />
    </ErrorBoundary>
  );
}


