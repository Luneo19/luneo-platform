'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';

const LANGUAGES = Array.from({ length: 32 }, (_, i) => ({
  id: i + 1,
  language: `Langue ${i + 1}`,
  code: `L${i + 1}`,
  coverage: Math.random() * 100,
  status: Math.random() > 0.2 ? 'complete' : 'partial',
}));

export function I18nTab() {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-400" />
          Internationalisation
        </CardTitle>
        <CardDescription className="text-gray-400">
          Support multilingue et multi-devises
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {LANGUAGES.map((lang) => (
            <Card key={lang.id} className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{lang.language}</span>
                  {lang.status === 'complete' ? (
                    <Badge className="bg-green-500/20 text-green-400 text-xs">✓</Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">~</Badge>
                  )}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${lang.coverage}%` }} />
                </div>
                <p className="text-xs text-gray-400">{lang.coverage.toFixed(0)}%</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
