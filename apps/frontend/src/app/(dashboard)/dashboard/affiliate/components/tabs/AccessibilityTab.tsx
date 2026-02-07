'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accessibility } from 'lucide-react';

const A11Y_FEATURES = [
  { feature: "Support lecteur d'écran", standard: 'WCAG 2.1 AAA', compliance: 98.5 },
  { feature: 'Navigation au clavier', standard: 'WCAG 2.1 AAA', compliance: 100 },
  { feature: 'Mode contraste élevé', standard: 'WCAG 2.1 AAA', compliance: 100 },
  { feature: 'Mode daltonien', standard: 'WCAG 2.1 AAA', compliance: 97.2 },
  { feature: 'Commandes vocales', standard: 'WCAG 2.1 AAA', compliance: 95.8 },
  { feature: 'Support RTL', standard: 'WCAG 2.1 AAA', compliance: 100 },
];

export function AccessibilityTab() {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Accessibility className="w-5 h-5 text-purple-400" />
          Accessibilité
        </CardTitle>
        <CardDescription className="text-gray-400">
          Conformité WCAG 2.1 AAA pour une accessibilité maximale
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {A11Y_FEATURES.map((item, idx) => (
            <Card key={idx} className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base">{item.feature}</CardTitle>
                <Badge className="mt-2 bg-blue-500/20 text-blue-400">{item.standard}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Conformité</span>
                    <span className="text-white font-medium">{item.compliance}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${item.compliance}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
