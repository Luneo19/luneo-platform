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

interface WebhookLog {
  id: string;
  event: string;
  payload: any;
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

  const { data, isLoading } = useQuery({
    queryKey: ['webhook-logs', webhookId, page],
    queryFn: async () => {
      const response = await endpoints.webhooks.logs(webhookId, { page, limit: 20 });
      return (response as any).data || response;
    },
    enabled: open,
  });

  const retryMutation = async (logId: string) => {
    try {
      await endpoints.webhooks.retry(logId);
      toast({
        title: 'Webhook relancé',
        description: 'Le webhook a été relancé avec succès.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de relancer le webhook',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Logs du webhook</DialogTitle>
          <DialogDescription className="text-gray-400">
            Historique des appels webhook
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              <p className="text-gray-400 mt-4">Chargement...</p>
            </div>
          ) : data && (data as any).data && (data as any).data.length > 0 ? (
            <>
              <div className="space-y-3">
                {((data as any).data || data.logs || []).map((log: WebhookLog) => (
                  <div
                    key={log.id}
                    className="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
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
                          <span className="text-sm text-gray-400">{log.duration}ms</span>
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
                      <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                        Voir le payload
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-900 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </details>
                    <p className="text-gray-400 text-xs mt-2">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>

              {data.pagination && data.pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400">
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
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucun log disponible</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
