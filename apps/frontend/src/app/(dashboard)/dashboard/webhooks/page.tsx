'use client';

/**
 * Webhooks Dashboard Page
 * Complete webhook management interface
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Webhook, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  Trash2,
  Edit,
  Play,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { endpoints } from '@/lib/api/client';
import { CreateWebhookModal } from './components/CreateWebhookModal';
import { EditWebhookModal } from './components/EditWebhookModal';
import { WebhookLogsModal } from './components/WebhookLogsModal';
import { TestWebhookModal } from './components/TestWebhookModal';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastCalledAt: string | null;
  lastStatusCode: number | null;
  failureCount: number;
  createdAt: string;
  _count?: {
    webhookLogs: number;
  };
}

interface WebhookLog {
  id: string;
  event: string;
  statusCode: number | null;
  error: string | null;
  createdAt: string;
  duration?: number;
}

export default function WebhooksPage() {
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  // Fetch webhooks
  const { data: webhooks, isLoading, isError: isWebhooksError, error: webhooksError, refetch: refetchWebhooks } = useQuery<Webhook[]>({
    queryKey: ['webhooks'],
    queryFn: async (): Promise<Webhook[]> => {
      const response = await endpoints.webhooks.list();
      const raw = (response as { data?: Webhook[] })?.data;
      return Array.isArray(raw) ? raw : (Array.isArray(response) ? (response as Webhook[]) : []);
    },
  });

  // Fetch webhook history
  const { data: history, isLoading: isLoadingHistory } = useQuery<{ data: WebhookLog[] }>({
    queryKey: ['webhook-history'],
    queryFn: async (): Promise<{ data: WebhookLog[] }> => {
      const response = await endpoints.webhooks.history({ page: 1, limit: 50 });
      const raw = (response as { data?: WebhookLog[] })?.data ?? response;
      const list = Array.isArray(raw) ? raw : (raw as { data?: WebhookLog[] })?.data ?? [];
      return { data: Array.isArray(list) ? list : [] };
    },
  });

  // Create webhook mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      url: string;
      secret?: string;
      events: string[];
      isActive?: boolean;
    }) => {
      const response = await endpoints.webhooks.create(data);
      const payload = (response as { data?: Webhook })?.data;
      return payload ?? (response as Webhook);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setShowCreateModal(false);
      toast({
        title: t('webhooks.created'),
        description: t('webhooks.createdDesc'),
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: t('common.error'),
        description: err.response?.data?.message || t('webhooks.createError'),
        variant: 'destructive',
      });
    },
  });

  // Update webhook mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await endpoints.webhooks.update(id, data);
      const payload = (response as { data?: Webhook })?.data;
      return payload ?? (response as Webhook);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setShowEditModal(false);
      setSelectedWebhook(null);
      toast({
        title: t('webhooks.updated'),
        description: t('webhooks.updatedDesc'),
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: t('common.error'),
        description: err.response?.data?.message || t('webhooks.updateError'),
        variant: 'destructive',
      });
    },
  });

  // Delete webhook mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await endpoints.webhooks.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({
        title: t('webhooks.deleted'),
        description: t('webhooks.deletedDesc'),
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: t('common.error'),
        description: err.response?.data?.message || t('webhooks.deleteError'),
        variant: 'destructive',
      });
    },
  });

  // Retry webhook mutation
  const retryMutation = useMutation({
    mutationFn: async (logId: string) => {
      const response = await endpoints.webhooks.retry(logId);
      const payload = (response as { data?: WebhookLog })?.data;
      return payload ?? (response as WebhookLog);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-history'] });
      toast({
        title: t('webhooks.retried'),
        description: t('webhooks.retriedDesc'),
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: t('common.error'),
        description: err.response?.data?.message || t('webhooks.retryError'),
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setShowEditModal(true);
  };

  const handleDelete = async (webhook: Webhook) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le webhook "${webhook.name}" ?`)) {
      deleteMutation.mutate(webhook.id);
    }
  };

  const handleViewLogs = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setShowLogsModal(true);
  };

  const handleTest = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setShowTestModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('common.copied'),
      description: t('webhooks.urlCopied'),
    });
  };

  return (
    <ErrorBoundary level="page" componentName="WebhooksPage">
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Webhooks</h1>
            <p className="text-white/60">
              Gérez vos webhooks pour recevoir des notifications en temps réel
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un webhook
          </Button>
        </div>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList className="dash-card border-white/[0.06] bg-white/[0.04] p-1">
          <TabsTrigger value="webhooks" className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04]">Webhooks</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04]">Historique</TabsTrigger>
        </TabsList>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <p className="text-white/60 mt-4">Chargement...</p>
            </div>
          ) : webhooks && webhooks.length > 0 ? (
            <div className="grid gap-4">
              {webhooks.map((webhook: Webhook) => (
                <Card key={webhook.id} className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Webhook className="w-5 h-5 text-purple-400" />
                          <CardTitle className="text-white">{webhook.name}</CardTitle>
                          <Badge
                            variant={webhook.isActive ? 'default' : 'secondary'}
                            className={webhook.isActive ? 'bg-green-600' : 'bg-white/10 text-white/60'}
                          >
                            {webhook.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <CardDescription className="text-white/60 flex items-center gap-2 mt-2">
                          <span className="font-mono text-sm">{webhook.url}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(webhook.url)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTest(webhook)}
                          title="Tester"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewLogs(webhook)}
                          title="Voir les logs"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(webhook)}
                          title={t('common.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(webhook)}
                          title={t('common.delete')}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-white/60 mb-1">Événements</p>
                        <div className="flex flex-wrap gap-2">
                          {webhook.events.map((event: string) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-white/60">Dernier appel</p>
                          <p className="text-white">
                            {webhook.lastCalledAt
                              ? new Date(webhook.lastCalledAt).toLocaleString('fr-FR')
                              : 'Jamais'}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60">Dernier statut</p>
                          <div className="flex items-center gap-2">
                            {webhook.lastStatusCode ? (
                              webhook.lastStatusCode >= 200 && webhook.lastStatusCode < 300 ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )
                            ) : (
                              <Clock className="w-4 h-4 text-white/40" />
                            )}
                            <span className="text-white">
                              {webhook.lastStatusCode || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-white/60">Échecs</p>
                          <p className="text-white">{webhook.failureCount}</p>
                        </div>
                      </div>
                      {webhook._count && (
                        <div>
                          <p className="text-sm text-white/60">
                            {webhook._count.webhookLogs} log(s) au total
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <Webhook className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60 mb-4">Aucun webhook configuré</p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer votre premier webhook
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          {isLoadingHistory ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <p className="text-white/60 mt-4">Chargement...</p>
            </div>
          ) : history?.data?.length ? (
            <div className="space-y-4">
              {history.data.map((log: WebhookLog) => (
                <Card key={log.id} className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {log.statusCode ? (
                            log.statusCode >= 200 && log.statusCode < 300 ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                          <Badge variant="outline">{log.event}</Badge>
                          {log.statusCode && (
                            <Badge
                              variant={
                                log.statusCode >= 200 && log.statusCode < 300
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {log.statusCode}
                            </Badge>
                          )}
                        </div>
                        {log.error && (
                          <p className="text-red-400 text-sm mt-2">{log.error}</p>
                        )}
                        <p className="text-white/60 text-sm mt-2">
                          {new Date(log.createdAt).toLocaleString('fr-FR')}
                          {log.duration && ` • ${log.duration}ms`}
                        </p>
                      </div>
                      {log.statusCode && log.statusCode >= 400 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => retryMutation.mutate(log.id)}
                          disabled={retryMutation.isPending}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Relancer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">Aucun historique disponible</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showCreateModal && (
        <CreateWebhookModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}

      {showEditModal && selectedWebhook && (
        <EditWebhookModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedWebhook(null);
          }}
          webhook={selectedWebhook}
          onSubmit={(data) =>
            updateMutation.mutate({ id: selectedWebhook.id, data })
          }
          isLoading={updateMutation.isPending}
        />
      )}

      {showLogsModal && selectedWebhook && (
        <WebhookLogsModal
          open={showLogsModal}
          onClose={() => {
            setShowLogsModal(false);
            setSelectedWebhook(null);
          }}
          webhookId={selectedWebhook.id}
        />
      )}

      {showTestModal && selectedWebhook && (
        <TestWebhookModal
          open={showTestModal}
          onClose={() => {
            setShowTestModal(false);
            setSelectedWebhook(null);
          }}
          webhook={selectedWebhook}
        />
      )}
      </div>
    </ErrorBoundary>
  );
}
