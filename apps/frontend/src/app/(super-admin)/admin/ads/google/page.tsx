/**
 * ★★★ GOOGLE ADS PAGE ★★★
 * Placeholder – intégration à venir
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function GoogleAdsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Google Ads</h1>
        <p className="text-zinc-400 mt-2">
          Intégration Google Ads – bientôt disponible
        </p>
      </div>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Google Ads Integration – Coming Soon
            </h2>
            <p className="text-zinc-400 mb-6">
              L&apos;intégration Google Ads sera disponible prochainement. En attendant, utilisez
              Meta Ads pour gérer vos campagnes publicitaires.
            </p>
            <Button variant="outline" size="lg" disabled>
              Connect (bientôt)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
