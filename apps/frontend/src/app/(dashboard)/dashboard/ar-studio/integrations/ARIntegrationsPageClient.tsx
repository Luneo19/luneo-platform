/**
 * Client Component pour AR Studio Integrations
 * Version professionnelle simplifiée
 */

'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { IntegrationsHeader } from './components/IntegrationsHeader';
import { IntegrationsStats } from './components/IntegrationsStats';
import { useIntegrations } from './hooks/useIntegrations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, CheckCircle2, XCircle, RefreshCw, ExternalLink, Settings } from 'lucide-react';
import { CATEGORY_CONFIG } from './constants/integrations';
import { formatDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import type { IntegrationCategory } from './types';

export function ARIntegrationsPageClient() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'integrations' | 'logs'>('integrations');

  const {
    integrations,
    syncLogs,
    stats,
    isLoading,
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm,
    toggleIntegration,
    testConnection,
  } = useIntegrations();

  const handleToggle = async (integrationId: string, enabled: boolean) => {
    const result = await toggleIntegration(integrationId, enabled);
    if (result.success) {
      toast({
        title: 'Succès',
        description: `Intégration ${enabled ? 'activée' : 'désactivée'}`,
      });
    } else {
      toast({
        title: 'Erreur',
        description: result.error || 'Erreur lors de la modification',
        variant: 'destructive',
      });
    }
  };

  const handleTestConnection = async (integrationId: string) => {
    const result = await testConnection(integrationId);
    if (result.success) {
      toast({
        title: 'Succès',
        description: 'Connexion testée avec succès',
      });
    } else {
      toast({
        title: 'Erreur',
        description: result.error || 'Erreur lors du test',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-16 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <IntegrationsHeader onAddIntegration={() => toast({ title: 'Fonctionnalité à venir' })} />
      <IntegrationsStats {...stats} />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="integrations" className="data-[state=active]:bg-gray-700">
            Intégrations
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-gray-700">
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4 mt-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher une intégration..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-gray-900 border-gray-600 text-white pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={selectedCategory}
                  onValueChange={(v) => setSelectedCategory(v as IntegrationCategory | 'all')}
                >
                  <SelectTrigger className="w-48 bg-gray-900 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {integrations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {integrations.map((integration) => {
                    const categoryConfig = CATEGORY_CONFIG[integration.category];
                    const CategoryIcon = categoryConfig.icon;

                    return (
                      <Card
                        key={integration.id}
                        className="bg-gray-900/50 border-gray-700 hover:border-cyan-500/50 transition-colors"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'p-2 rounded-lg',
                                  integration.status === 'connected'
                                    ? 'bg-green-500/10'
                                    : 'bg-gray-700'
                                )}
                              >
                                <CategoryIcon className={cn('w-5 h-5', categoryConfig.color)} />
                              </div>
                              <div>
                                <CardTitle className="text-white text-lg">{integration.name}</CardTitle>
                                <CardDescription className="text-gray-400 text-xs">
                                  {categoryConfig.label}
                                </CardDescription>
                              </div>
                            </div>
                            {integration.isPopular && (
                              <Badge className="bg-yellow-500/20 text-yellow-400">Populaire</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-gray-300">{integration.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {integration.status === 'connected' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-gray-400" />
                              )}
                              <span
                                className={cn(
                                  'text-xs',
                                  integration.status === 'connected'
                                    ? 'text-green-400'
                                    : 'text-gray-400'
                                )}
                              >
                                {integration.status === 'connected' ? 'Connecté' : 'Déconnecté'}
                              </span>
                            </div>
                            <Switch
                              checked={integration.enabled}
                              onCheckedChange={(checked) => handleToggle(integration.id, checked)}
                            />
                          </div>
                          {integration.status === 'connected' && (
                            <div className="space-y-2 pt-2 border-t border-gray-700">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Synchronisations</span>
                                <span className="text-white">{integration.syncCount}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Taux de succès</span>
                                <span className="text-green-400">{integration.successRate}%</span>
                              </div>
                              {integration.lastSync && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-400">Dernière sync</span>
                                  <span className="text-gray-300">
                                    {formatDate(new Date(integration.lastSync))}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestConnection(integration.id)}
                              className="flex-1 border-gray-600"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Tester
                            </Button>
                            {integration.documentation && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(integration.documentation, '_blank')}
                                className="border-gray-600"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="border-gray-600">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">Aucune intégration trouvée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 mt-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Historique des synchronisations</CardTitle>
              <CardDescription>Logs des dernières synchronisations</CardDescription>
            </CardHeader>
            <CardContent>
              {syncLogs.length > 0 ? (
                <div className="space-y-3">
                  {syncLogs.slice(0, 20).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-medium">{log.integrationName}</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {formatDate(new Date(log.timestamp))}
                          {log.recordsSynced && ` • ${log.recordsSynced} enregistrements`}
                        </p>
                        {log.error && (
                          <p className="text-red-400 text-xs mt-1">{log.error}</p>
                        )}
                      </div>
                      <Badge
                        className={
                          log.status === 'success'
                            ? 'bg-green-500'
                            : log.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                        }
                      >
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-12">Aucun log pour le moment</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}



