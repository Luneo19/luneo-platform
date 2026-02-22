'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import { api } from '@/lib/api/client';

interface LanguageItem {
  id: number | string;
  language: string;
  code: string;
  coverage: number;
  status: 'complete' | 'partial';
}

export function I18nTab() {
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get<{ languages?: LanguageItem[]; data?: LanguageItem[] }>('/api/v1/referral/i18n');
        const list = response?.languages ?? response?.data ?? [];
        setLanguages(Array.isArray(list) ? list : []);
      } catch {
        setLanguages([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-400" />
            Internationalisation
          </CardTitle>
          <CardDescription className="text-gray-600">
            Chargement...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-400" />
          Internationalisation
        </CardTitle>
        <CardDescription className="text-gray-600">
          Support multilingue et multi-devises
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {languages.length === 0 ? (
            <p className="text-gray-500 col-span-full py-8 text-center">Aucune langue configurée.</p>
          ) : languages.map((lang) => (
            <Card key={lang.id} className="bg-gray-100 border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{lang.language}</span>
                  {lang.status === 'complete' ? (
                    <Badge className="bg-green-500/20 text-green-400 text-xs">✓</Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">~</Badge>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${lang.coverage}%` }} />
                </div>
                <p className="text-xs text-gray-600">{typeof lang.coverage === 'number' ? lang.coverage.toFixed(0) : 0}%</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
