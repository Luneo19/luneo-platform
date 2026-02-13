'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link as LinkIcon } from 'lucide-react';
import { api } from '@/lib/api/client';

interface IntegrationHubBlockProps {
  title: string;
  namePrefix?: string;
  count?: number;
}

interface IntegrationItem {
  id: string | number;
  name: string;
  category?: string;
  status: string;
  description?: string;
}

export function IntegrationHubBlock({
  title,
  namePrefix = 'Intégration ',
  count = 120,
}: IntegrationHubBlockProps) {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/api/v1/integrations');
        const raw = response as Record<string, unknown>;
        const list = Array.isArray(raw) ? raw : (raw?.integrations ?? raw?.data ?? []) as unknown[];
        setIntegrations(
          (list as Array<Record<string, unknown>>).map((item, i) => {
            const rawId = item.id;
            const id = typeof rawId === 'string' || typeof rawId === 'number' ? rawId : i + 1;
            return {
              id,
              name: String(item.name ?? `${namePrefix}${i + 1}`),
              category: String(item.category ?? ''),
              status: String(item.status ?? 'available'),
              description: String(item.description ?? ''),
            };
          })
        );
      } catch {
        setIntegrations([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [namePrefix]);

  return (
    <Card className="bg-gray-50 border-gray-200 mt-6">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-purple-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Chargement des intégrations...</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {integrations.slice(0, count).map((integration) => (
            <Card key={integration.id} className="bg-gray-100 border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 text-base">{integration.name}</CardTitle>
                  {integration.status === 'connected' ? (
                    <Badge className="bg-green-500/20 text-green-400">Connecté</Badge>
                  ) : (
                    <Badge className="bg-slate-500/20 text-slate-400">Disponible</Badge>
                  )}
                </div>
                <Badge variant="outline" className="mt-2 border-gray-200 text-slate-400">
                  {integration.category}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                <Button
                  size="sm"
                  variant={integration.status === 'connected' ? 'outline' : 'default'}
                  className="w-full"
                >
                  {integration.status === 'connected' ? 'Gérer' : 'Connecter'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
}
