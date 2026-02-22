'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { endpoints } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';

interface Webhook {
  id: string;
  name: string;
  url: string;
  secret?: string;
}

interface TestWebhookModalProps {
  open: boolean;
  onClose: () => void;
  webhook: Webhook;
}

export function TestWebhookModal({
  open,
  onClose,
  webhook,
}: TestWebhookModalProps) {
  const [testUrl, setTestUrl] = useState(webhook.url);
  const [testSecret, setTestSecret] = useState(webhook.secret || '');
  const { toast } = useToast();
  const { t } = useI18n();

  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await endpoints.webhooks.test(testUrl, testSecret || '');
      return response as { success: boolean; message?: string; error?: string; statusCode?: number; data?: Record<string, unknown> };
    },
    onSuccess: (data) => {
      if (data.success) {
        const status = String(data.statusCode ?? data.data?.statusCode ?? 'N/A');
        toast({
          title: t('webhooks.testSuccess'),
          description: t('webhooks.testSuccessDesc', { status }),
        });
      } else {
        toast({
          title: t('webhooks.testFailed'),
          description: data.error || t('webhooks.testFailedDesc'),
          variant: 'destructive',
        });
      }
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('webhooks.testError');
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
    },
  });

  const handleTest = () => {
    testMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="dash-card border-white/[0.06] bg-[#12121a] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>Tester le webhook</DialogTitle>
          <DialogDescription className="text-white/60">
            Envoyez une requête de test à votre webhook
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-url">URL du webhook</Label>
            <Input
              id="test-url"
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              className="bg-white/[0.04] border-white/[0.06] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-secret">Secret (optionnel)</Label>
            <Input
              id="test-secret"
              type="password"
              value={testSecret}
              onChange={(e) => setTestSecret(e.target.value)}
              placeholder="Secret pour la signature"
              className="bg-white/[0.04] border-white/[0.06] text-white"
            />
          </div>

          {testMutation.data && (
            <div className="p-4 bg-white/[0.04] rounded-lg border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-2">
                {testMutation.data.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-green-400 font-semibold">Test réussi</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-400 font-semibold">Test échoué</span>
                  </>
                )}
              </div>
              {testMutation.data.statusCode && (
                <p className="text-sm text-white/80">
                  Statut HTTP: {testMutation.data.statusCode}
                </p>
              )}
              {testMutation.data.error && (
                <p className="text-sm text-red-400 mt-2">{testMutation.data.error}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
            <Button
              onClick={handleTest}
              disabled={testMutation.isPending || !testUrl}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
            >
              {testMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Test en cours...
                </>
              ) : (
                'Tester'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
