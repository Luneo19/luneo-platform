'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { endpoints } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';

interface WebhookLog {
  id: string;
  event: string;
  payload: Record<string, unknown>;
  statusCode: number | null;
  response: string | null;
  error: string | null;
  duration: number | null;
  createdAt: string;
}

interface WebhookLogsModalProps {
  open: boolean;
  onClose: () => void;
  webhookId: string;
}

export function WebhookLogsModal({
  open,
  onClose,
  webhookId,
}: WebhookLogsModalProps) {
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const { t } = useI18n();

  interface WebhookLogsResponse {
    data?: WebhookLog[];
    logs?: WebhookLog[];
    pagination?: { page: number; pages: number };
  }

  const { data, isLoading } = useQuery({
    queryKey: ['webhook-logs', webhookId, page],
    queryFn: async (): Promise<WebhookLogsResponse> => {
      const response = await endpoints.webhooks.logs(webhookId, { page, limit: 20 });
      const res = response as WebhookLogsResponse;
      return res?.data ? res : { data: Array.isArray(response) ? response : [response] as WebhookLog[] };
    },
    enabled: open,
  });

  const retryMutation = async (logId: string) => {
    try {
      await endpoints.webhooks.retry(logId);
      toast({
        title: t('webhooks.retried'),
        description: t('webhooks.retriedDesc'),
      });
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error && typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
        ? (error as { response: { data: { message: string } } }).response.data.message
        : t('webhooks.retryError');
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="dash-card border-white/[0.06] bg-[#12121a] text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Logs du webhook</DialogTitle>
          <DialogDescription className="text-white/60">
            Historique des appels webhook
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <p className="text-white/60 mt-4">Chargement...</p>
            </div>
          ) : data && data.data && data.data.length > 0 ? (
            <>
              <div className="space-y-3">
                {(data.data || data.logs || []).map((log: WebhookLog) => (
                  <div
                    key={log.id}
                    className="p-4 bg-white/[0.04] rounded-lg border border-white/[0.06]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
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
                        {log.duration && (
                          <span className="text-sm text-white/40">{log.duration}ms</span>
                        )}
                      </div>
                      {log.statusCode && log.statusCode >= 400 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => retryMutation(log.id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Relancer
                        </Button>
                      )}
                    </div>
                    {log.error && (
                      <p className="text-red-400 text-sm mb-2">{log.error}</p>
                    )}
                    {log.response && (
                      <p className="text-green-400 text-sm mb-2">{log.response}</p>
                    )}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-white/60 hover:text-white/80">
                        Voir le payload
                      </summary>
                      <pre className="mt-2 p-3 bg-white/[0.04] rounded text-xs overflow-x-auto text-white/80">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </details>
                    <p className="text-white/40 text-xs mt-2">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>

              {data?.pagination && data.pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <p className="text-sm text-white/60">
                    Page {data.pagination.page} sur {data.pagination.pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.pagination.pages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">Aucun log disponible</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-white/[0.06]">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
