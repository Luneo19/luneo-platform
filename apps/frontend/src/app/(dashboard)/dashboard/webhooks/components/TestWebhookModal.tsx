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

  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await endpoints.webhooks.test(testUrl, testSecret || '');
      return response as { success: boolean; message?: string; error?: string; statusCode?: number; data?: any };
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Test réussi',
          description: `Le webhook a répondu avec le statut ${data.statusCode || data.data?.statusCode || 'N/A'}`,
        });
      } else {
        toast({
          title: 'Test échoué',
          description: data.error || 'Le webhook n\'a pas répondu correctement',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de tester le webhook',
        variant: 'destructive',
      });
    },
  });

  const handleTest = () => {
    testMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-lg">
        <DialogHeader>
          <DialogTitle>Tester le webhook</DialogTitle>
          <DialogDescription className="text-gray-600">
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
              className="bg-white border-gray-200"
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
              className="bg-white border-gray-200"
            />
          </div>

          {testMutation.data && (
            <div className="p-4 bg-white/50 rounded-lg border border-gray-200">
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
                <p className="text-sm text-gray-700">
                  Statut HTTP: {testMutation.data.statusCode}
                </p>
              )}
              {testMutation.data.error && (
                <p className="text-sm text-red-400 mt-2">{testMutation.data.error}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
            <Button
              onClick={handleTest}
              disabled={testMutation.isPending || !testUrl}
              className="bg-cyan-600 hover:bg-cyan-700"
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
