'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link as LinkIcon } from 'lucide-react';

const CATEGORIES = ['Analytics', 'CRM', 'Marketing', 'E-commerce', 'Payment', 'Communication'];

interface IntegrationHubBlockProps {
  title: string;
  namePrefix?: string;
  count?: number;
}

export function IntegrationHubBlock({
  title,
  namePrefix = 'Intégration ',
  count = 120,
}: IntegrationHubBlockProps) {
  const integrations = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${namePrefix}${i + 1}`,
    category: CATEGORIES[i % 6],
    status: Math.random() > 0.3 ? 'connected' : 'available',
    description: `Description de l'intégration ${i + 1} avec toutes les fonctionnalités`,
  }));

  return (
    <Card className="bg-gray-800/50 border-gray-700 mt-6">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-purple-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {integrations.map((integration) => (
            <Card key={integration.id} className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base">{integration.name}</CardTitle>
                  {integration.status === 'connected' ? (
                    <Badge className="bg-green-500/20 text-green-400">Connecté</Badge>
                  ) : (
                    <Badge className="bg-slate-500/20 text-slate-400">Disponible</Badge>
                  )}
                </div>
                <Badge variant="outline" className="mt-2 border-slate-600 text-slate-400">
                  {integration.category}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-4">{integration.description}</p>
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
      </CardContent>
    </Card>
  );
}
