'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Save } from 'lucide-react';
import { formatNumber, formatPrice } from '@/lib/utils/formatters';
import type { CreditPack } from './types';

interface CreditsSettingsTabProps {
  autoRefillEnabled: boolean;
  setAutoRefillEnabled: (v: boolean) => void;
  autoRefillThreshold: number;
  setAutoRefillThreshold: (v: number) => void;
  autoRefillPack: string | null;
  setAutoRefillPack: (v: string | null) => void;
  creditPacks: CreditPack[];
  onSaveAutoRefill: () => void;
}

export function CreditsSettingsTab({
  autoRefillEnabled,
  setAutoRefillEnabled,
  autoRefillThreshold,
  setAutoRefillThreshold,
  autoRefillPack,
  setAutoRefillPack,
  creditPacks,
  onSaveAutoRefill,
}: CreditsSettingsTabProps) {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Paramètres de crédits</CardTitle>
        <CardDescription className="text-gray-400">Configurez vos préférences de crédits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Recharge automatique</h3>
              <p className="text-sm text-gray-400">Rechargez automatiquement vos crédits quand le solde est faible</p>
            </div>
            <Checkbox checked={autoRefillEnabled} onCheckedChange={(checked) => setAutoRefillEnabled(checked === true)} id="auto-refill" />
          </div>
          {autoRefillEnabled && (
            <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
              <div>
                <Label htmlFor="threshold" className="text-gray-300 mb-2 block">
                  Seuil de recharge ({autoRefillThreshold} crédits)
                </Label>
                <Slider id="threshold" value={[autoRefillThreshold]} onValueChange={(value) => setAutoRefillThreshold(value[0])} min={10} max={500} step={10} className="w-full" />
              </div>
              <div>
                <Label htmlFor="pack" className="text-gray-300 mb-2 block">Pack à acheter</Label>
                <Select value={autoRefillPack || ''} onValueChange={(v) => setAutoRefillPack(v || null)}>
                  <SelectTrigger className="w-full bg-gray-900 border-gray-600 text-white">
                    <SelectValue placeholder="Sélectionner un pack" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditPacks.map((pack) => (
                      <SelectItem key={pack.id} value={pack.id}>
                        {pack.name} - {formatNumber(pack.credits)} crédits ({formatPrice(pack.price)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={onSaveAutoRefill} className="w-full bg-cyan-600 hover:bg-cyan-700">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          )}
        </div>
        <Separator className="bg-gray-700" />
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Alertes</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">Alerte solde faible</p>
                <p className="text-xs text-gray-400">Notifier quand le solde est inférieur à 50 crédits</p>
              </div>
              <Checkbox defaultChecked id="low-balance-alert" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">Alerte expiration</p>
                <p className="text-xs text-gray-400">Notifier avant expiration des crédits</p>
              </div>
              <Checkbox defaultChecked id="expiration-alert" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
