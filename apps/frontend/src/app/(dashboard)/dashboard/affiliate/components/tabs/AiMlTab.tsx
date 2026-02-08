'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Clock,
  Link as LinkIcon,
  Shield,
  Sparkles as SparklesIcon,
  Star as StarIcon,
  Target as TargetIcon,
} from 'lucide-react';

const AI_FEATURES = [
  { name: 'Prédiction de conversion', description: 'Prédisez la probabilité de conversion pour chaque visiteur', accuracy: '94.2%', icon: TargetIcon },
  { name: 'Optimisation de liens', description: 'Génération automatique de liens optimisés par ML', accuracy: '91.5%', icon: LinkIcon },
  { name: 'Recommandations intelligentes', description: 'Recommandations personnalisées pour maximiser les conversions', accuracy: '89.8%', icon: SparklesIcon },
  { name: 'Détection de fraude', description: 'Détection automatique des conversions frauduleuses', accuracy: '96.7%', icon: Shield },
  { name: 'Scoring de qualité', description: 'Score ML pour évaluer la qualité des référents', accuracy: '92.3%', icon: StarIcon },
  { name: 'Optimisation de timing', description: 'Meilleur moment pour envoyer des communications', accuracy: '87.6%', icon: Clock },
];

export function AiMlTab() {
  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-400" />
          Intelligence Artificielle & Machine Learning
        </CardTitle>
        <CardDescription className="text-gray-600">
          Fonctionnalités avancées d&apos;IA/ML pour optimiser votre programme d&apos;affiliation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AI_FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card key={idx} className="bg-gray-100 border-gray-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className="w-5 h-5 text-purple-400" />
                    <Badge className="bg-green-500/20 text-green-400">{feature.accuracy}</Badge>
                  </div>
                  <CardTitle className="text-white text-base mt-2">{feature.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                  <Button size="sm" variant="outline" className="w-full border-purple-500/50 text-purple-400">
                    Configurer
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
