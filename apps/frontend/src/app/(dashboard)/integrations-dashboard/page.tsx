'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plug, Search, Plus, CheckCircle, XCircle, Settings, 
  Key, Copy, Eye, EyeOff, Trash2, Edit,
  ExternalLink, Code, Webhook, AlertCircle, Zap,
  ShoppingCart, Mail, Database, Cloud, Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface Integration {
  id: string;
  name: string;
  category: 'ecommerce' | 'email' | 'storage' | 'payment' | 'analytics' | 'other';
  logo: string;
  description: string;
  isConnected: boolean;
  status: 'active' | 'inactive' | 'error';
  lastSync?: string;
  config?: {
    apiKey?: string;
    webhookUrl?: string;
    storeUrl?: string;
  };
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
}

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read']);
  const [newKeyExpiration, setNewKeyExpiration] = useState<'never' | '30d' | '90d'>('never');

  const [integrations, setIntegrations] = useState<Integration[]>([]);


  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'luneo_live_1234567890abcdef',
      permissions: ['read', 'write'],
      createdAt: '2025-10-01',
      lastUsed: '2025-11-03'
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'luneo_test_abcdef1234567890',
      permissions: ['read'],
      createdAt: '2025-10-15',
      lastUsed: '2025-11-02'
    }
  ]);

  const [webhooks, setWebhooks] = useState([
    {
      id: '1',
      url: 'https://api.example.com/webhooks/luneo',
      events: ['order.created', 'order.updated', 'design.completed'],
      status: 'active',
      lastTriggered: '2025-11-03T10:00:00'
    }
  ]);

  const categories = [
    { value: 'all', label: 'Toutes', icon: <Package className="w-4 h-4" />, count: integrations.length },
    { value: 'ecommerce', label: 'E-commerce', icon: <ShoppingCart className="w-4 h-4" />, count: integrations.filter(i => i.category === 'ecommerce').length },
    { value: 'payment', label: 'Paiement', icon: <Zap className="w-4 h-4" />, count: integrations.filter(i => i.category === 'payment').length },
    { value: 'email', label: 'Email', icon: <Mail className="w-4 h-4" />, count: integrations.filter(i => i.category === 'email').length },
    { value: 'analytics', label: 'Analytics', icon: <Database className="w-4 h-4" />, count: integrations.filter(i => i.category === 'analytics').length },
    { value: 'other', label: 'Autres', icon: <Cloud className="w-4 h-4" />, count: integrations.filter(i => i.category === 'other').length }
  ];

  useEffect(() => {
    void loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const [integrationsResult, apiKeysResult, webhooksResult] = await Promise.allSettled([
        fetch('/api/integrations/list'),
        fetch('/api/integrations/api-keys'),
        fetch('/api/integrations/webhooks')
      ]);

      if (
        integrationsResult.status === 'fulfilled' &&
        integrationsResult.value.ok
      ) {
        const payload = await integrationsResult.value.json();
        setIntegrations(payload.data || []);
      }

      if (apiKeysResult.status === 'fulfilled' && apiKeysResult.value.ok) {
        const payload = await apiKeysResult.value.json();
        setApiKeys(payload.data?.apiKeys || []);
      }

      if (webhooksResult.status === 'fulfilled' && webhooksResult.value.ok) {
        const payload = await webhooksResult.value.json();
        setWebhooks(payload.data || []);
      }
    } catch (error) {
      logger.error('Error loading integrations', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permission: string) => {
    setNewKeyPermissions(prev =>
      prev.includes(permission)
        ? prev.filter((perm) => perm !== permission)
        : [...prev, permission]
    );
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Nom requis',
        description: 'Veuillez définir un nom pour la nouvelle clé API.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingKey(true);
    try {
      const response = await fetch('/api/integrations/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          permissions: newKeyPermissions,
          expiresIn: newKeyExpiration,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Impossible de créer la clé API');
      }

      const now = new Date();
      const expiresAt =
        newKeyExpiration === 'never'
          ? undefined
          : new Date(now.getTime() + (newKeyExpiration === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 10);

      const createdKey: ApiKey =
        (result.data as ApiKey | undefined) ?? {
          id: `temp-${Date.now()}`,
          name: newKeyName,
          key: 'luneo_' + Math.random().toString(36).slice(2, 18),
          permissions: newKeyPermissions,
          createdAt: now.toISOString(),
          expiresAt,
        };
      setApiKeys((prev) => [createdKey, ...prev]);
      setShowNewKeyModal(false);
      setNewKeyName('');
      setNewKeyPermissions(['read']);
      setNewKeyExpiration('never');

      toast({
        title: 'Clé API créée',
        description: 'Stockez-la dans un endroit sécurisé. Vous ne pourrez plus la voir en clair.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la clé API',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleConnect = async (integration: Integration) => {
    try {
      toast({
        title: "Connexion en cours",
        description: `Connexion à ${integration.name}...`,
      });

      const response = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          integrationName: integration.name,
          config: integration.config || {}
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to connect integration');
      }

      setIntegrations(integrations.map(i =>
        i.id === integration.id
          ? { ...i, isConnected: true, status: 'active', lastSync: new Date().toISOString() }
          : i
      ));

      toast({
        title: "Connexion réussie",
        description: `${integration.name} est maintenant connecté`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || `Impossible de connecter ${integration.name}`,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    if (!confirm(`Êtes-vous sûr de vouloir déconnecter ${integration.name} ?`)) {
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setIntegrations(integrations.map(i =>
        i.id === integration.id
          ? { ...i, isConnected: false, status: 'inactive', config: undefined }
          : i
      ));

      toast({
        title: "Déconnexion réussie",
        description: `${integration.name} a été déconnecté`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter l'intégration",
        variant: "destructive",
      });
    }
  };

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Clé copiée",
      description: "La clé API a été copiée dans le presse-papier",
    });
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette clé API ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/integrations/api-keys?id=${keyId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete API key');
      }

      setApiKeys(apiKeys.filter(k => k.id !== keyId));

      toast({
        title: "Clé supprimée",
        description: "La clé API a été supprimée",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la clé",
        variant: "destructive",
      });
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newRevealed = new Set(revealedKeys);
    if (newRevealed.has(keyId)) {
      newRevealed.delete(keyId);
    } else {
      newRevealed.add(keyId);
    }
    setRevealedKeys(newRevealed);
  };

  const filteredIntegrations = integrations.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         i.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || i.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: integrations.length,
    connected: integrations.filter(i => i.isConnected).length,
    active: integrations.filter(i => i.status === 'active').length,
    errors: integrations.filter(i => i.status === 'error').length
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { label: 'Actif', icon: <CheckCircle className="w-3 h-3" />, color: 'green' },
      inactive: { label: 'Inactif', icon: <XCircle className="w-3 h-3" />, color: 'gray' },
      error: { label: 'Erreur', icon: <AlertCircle className="w-3 h-3" />, color: 'red' }
    };

    const { label, icon, color } = config[status as keyof typeof config] || config.inactive;

    return (
      <span className={`px-2 py-1 bg-${color}-500/10 text-${color}-400 text-xs rounded-full flex items-center gap-1`}>
        {icon}
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      {loading && (
        <Card className="p-4 bg-gray-900/70 border border-blue-500/30 text-sm text-gray-300 animate-pulse">
          Synchronisation des intégrations en cours...
        </Card>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Intégrations</h1>
          <p className="text-gray-400">Connectez vos outils et services favoris</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowApiKeys(!showApiKeys)}
            className="border-gray-700"
          >
            <Key className="w-4 h-4 mr-2" />
            Clés API
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Demander une intégration
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total intégrations', value: stats.total, icon: <Plug className="w-5 h-5" />, color: 'blue' },
          { label: 'Connectées', value: stats.connected, icon: <CheckCircle className="w-5 h-5" />, color: 'green' },
          { label: 'Actives', value: stats.active, icon: <Zap className="w-5 h-5" />, color: 'purple' },
          { label: 'Erreurs', value: stats.errors, icon: <AlertCircle className="w-5 h-5" />, color: 'red' }
        ].map((stat, i) => (
          <Card key={i} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-400`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Categories */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                categoryFilter === cat.value
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-900/50 text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                categoryFilter === cat.value ? 'bg-white/20' : 'bg-gray-800'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Rechercher une intégration..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-800 border-gray-700 text-white"
        />
      </div>

      {/* Integrations Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration, index) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all h-full flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{integration.logo}</div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{integration.name}</h3>
                    {getStatusBadge(integration.status)}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-4 flex-1">{integration.description}</p>

              {integration.isConnected && integration.lastSync && (
                <div className="text-xs text-gray-500 mb-4">
                  Dernière synchro: {new Date(integration.lastSync).toLocaleString('fr-FR')}
                </div>
              )}

              <div className="flex gap-2">
                {integration.isConnected ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-gray-700"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configurer
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDisconnect(integration)}
                    >
                      Déconnecter
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleConnect(integration)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <Plug className="w-4 h-4 mr-2" />
                    Connecter
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* API Keys Section */}
      <AnimatePresence>
        {showApiKeys && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Clés API</h3>
                <Button
                  size="sm"
                  onClick={() => setShowNewKeyModal(true)}
                  className="bg-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle clé
                </Button>
              </div>

              <AnimatePresence>
                {showNewKeyModal && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-6 rounded-lg border border-blue-500/40 bg-blue-500/5 p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-1">
                        <label className="text-xs uppercase tracking-wide text-blue-200/70">
                          Nom de la clé
                        </label>
                        <Input
                          placeholder="Nom interne (ex: Production)"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          className="mt-2 bg-gray-900 border-blue-500/40 text-white"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-xs uppercase tracking-wide text-blue-200/70">
                          Expiration
                        </label>
                        <select
                          value={newKeyExpiration}
                          onChange={(e) => setNewKeyExpiration(e.target.value as 'never' | '30d' | '90d')}
                          className="mt-2 w-full rounded-md border border-blue-500/40 bg-gray-900 px-3 py-2 text-sm text-white"
                        >
                          <option value="never">Jamais</option>
                          <option value="30d">30 jours</option>
                          <option value="90d">90 jours</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="text-xs uppercase tracking-wide text-blue-200/70">
                        Permissions
                      </label>
                      <div className="mt-2 flex flex-wrap gap-3">
                        {['read', 'write', 'webhooks', 'billing'].map((permission) => (
                          <button
                            key={permission}
                            type="button"
                            onClick={() => togglePermission(permission)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                              newKeyPermissions.includes(permission)
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-gray-900 text-gray-300 hover:text-white border border-blue-500/20'
                            }`}
                          >
                            {permission}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowNewKeyModal(false);
                          setNewKeyName('');
                          setNewKeyPermissions(['read']);
                          setNewKeyExpiration('never');
                        }}
                        className="border-blue-500/40"
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleCreateApiKey}
                        disabled={isCreatingKey}
                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                      >
                        {isCreatingKey ? 'Création...' : 'Créer la clé'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-white font-medium mb-1">{key.name}</h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {key.permissions.map((perm, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded">
                              {perm}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">
                          Créée le {new Date(key.createdAt).toLocaleDateString('fr-FR')}
                          {key.lastUsed && ` • Dernière utilisation: ${new Date(key.lastUsed).toLocaleDateString('fr-FR')}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="border-gray-600"
                        >
                          {revealedKeys.has(key.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteApiKey(key.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-gray-800 rounded text-sm text-gray-300 font-mono overflow-x-auto">
                        {revealedKeys.has(key.id) ? key.key : '••••••••••••••••••••••••'}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyApiKey(key.key)}
                        className="border-gray-600"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Webhooks */}
            <Card className="p-6 bg-gray-800/50 border-gray-700 mt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Webhooks</h3>
                <Button size="sm" className="bg-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau webhook
                </Button>
              </div>

              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Webhook className="w-4 h-4 text-purple-400" />
                          <code className="text-white text-sm font-mono">{webhook.url}</code>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {webhook.events.map((event, i) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded">
                              {event}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">
                          Dernier déclenchement: {new Date(webhook.lastTriggered).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-gray-600">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">
                      Actif
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documentation */}
      <Card className="p-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Documentation API
            </h3>
            <p className="text-gray-300">
              Consultez notre documentation complète pour intégrer Luneo dans vos applications
            </p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <ExternalLink className="w-4 h-4 mr-2" />
            Voir la documentation
          </Button>
        </div>
      </Card>
    </div>
  );
}
