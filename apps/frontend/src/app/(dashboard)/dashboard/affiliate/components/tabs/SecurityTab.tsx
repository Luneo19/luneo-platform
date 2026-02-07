'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const SECURITY_FEATURES = [
  { name: 'Authentification à deux facteurs', enabled: true, level: 'Avancé' },
  { name: 'Chiffrement end-to-end', enabled: true, level: 'Entreprise' },
  { name: 'Watermarking invisible', enabled: true, level: 'Avancé' },
  { name: 'Protection contre les screenshots', enabled: true, level: 'Avancé' },
  { name: 'Audit trail complet', enabled: true, level: 'Entreprise' },
  { name: 'SSO/SAML', enabled: false, level: 'Entreprise' },
];

export function SecurityTab() {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          Sécurité Avancée
        </CardTitle>
        <CardDescription className="text-gray-400">
          Fonctionnalités de sécurité de niveau entreprise
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECURITY_FEATURES.map((feature, idx) => (
            <Card key={idx} className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm">{feature.name}</CardTitle>
                  {feature.enabled ? (
                    <Badge className="bg-green-500/20 text-green-400">Activé</Badge>
                  ) : (
                    <Badge className="bg-slate-500/20 text-slate-400">Désactivé</Badge>
                  )}
                </div>
                <Badge variant="outline" className="mt-2 border-purple-500/50 text-purple-400">
                  {feature.level}
                </Badge>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="outline" className="w-full border-slate-600">
                  {feature.enabled ? 'Configurer' : 'Activer'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
