'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { CreditCard, Save, FileSpreadsheet, FileJson } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatNumber, formatPrice } from '@/lib/utils/formatters';
import { TRANSACTION_TYPE_CONFIG } from './constants';
import type { CreditPack, CreditTransaction } from './types';

interface CreditsModalsProps {
  showPurchaseModal: boolean;
  setShowPurchaseModal: (v: boolean) => void;
  selectedPack: string | null;
  creditPacks: CreditPack[];
  onConfirmPurchase: () => void;
  showAutoRefillModal: boolean;
  setShowAutoRefillModal: (v: boolean) => void;
  autoRefillThreshold: number;
  setAutoRefillThreshold: (v: number) => void;
  autoRefillPack: string | null;
  setAutoRefillPack: (v: string | null) => void;
  creditPacksForSelect: CreditPack[];
  onEnableAutoRefill: () => void;
  showExportModal: boolean;
  setShowExportModal: (v: boolean) => void;
  transactions: CreditTransaction[];
  filterType: string;
}

export function CreditsModals({
  showPurchaseModal,
  setShowPurchaseModal,
  selectedPack,
  creditPacks,
  onConfirmPurchase,
  showAutoRefillModal,
  setShowAutoRefillModal,
  autoRefillThreshold,
  setAutoRefillThreshold,
  autoRefillPack,
  setAutoRefillPack,
  creditPacksForSelect,
  onEnableAutoRefill,
  showExportModal,
  setShowExportModal,
  transactions,
  filterType,
}: CreditsModalsProps) {
  const { toast } = useToast();
  const selectedPackData = selectedPack ? creditPacks.find((p) => p.id === selectedPack) : null;

  const handleExportCsv = () => {
    try {
      const filtered = transactions.filter((t) => filterType === 'all' || t.type === filterType);
      const headers = ['ID', 'Type', 'Montant', 'Source', 'Pack', 'Date'];
      const rows = filtered.map((t) => [
        t.id,
        TRANSACTION_TYPE_CONFIG[t.type]?.label ?? t.type,
        t.amount > 0 ? `+${t.amount}` : String(t.amount),
        t.source ?? '',
        t.packName ?? '',
        new Date(t.createdAt).toLocaleString('fr-FR'),
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `credits_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast({ title: 'Export CSV', description: 'Export CSV réussi !' });
      setShowExportModal(false);
    } catch {
      toast({ title: 'Erreur', description: "Échec de l'export CSV", variant: 'destructive' });
    }
  };

  const handleExportJson = () => {
    try {
      const filtered = transactions.filter((t) => filterType === 'all' || t.type === filterType);
      const jsonContent = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          total: filtered.length,
          transactions: filtered.map((t) => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            balanceBefore: t.balanceBefore,
            balanceAfter: t.balanceAfter,
            source: t.source,
            packId: t.packId,
            packName: t.packName,
            createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
            metadata: t.metadata,
          })),
        },
        null,
        2,
      );
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `credits_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      toast({ title: 'Export JSON', description: 'Export JSON réussi !' });
      setShowExportModal(false);
    } catch {
      toast({ title: 'Erreur', description: "Échec de l'export JSON", variant: 'destructive' });
    }
  };

  return (
    <>
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Acheter {selectedPackData?.name}</DialogTitle>
            <DialogDescription>Confirmez votre achat de crédits</DialogDescription>
          </DialogHeader>
          {selectedPackData && (
            <div className="space-y-4 mt-4">
              <div className="p-6 bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedPackData.name}</h3>
                    <p className="text-sm text-gray-400">{selectedPackData.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold text-cyan-400">{formatNumber(selectedPackData.credits)}</p>
                    <p className="text-sm text-gray-400">crédits</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{formatPrice(selectedPackData.price)}</p>
                    <p className="text-sm text-gray-400">TTC</p>
                  </div>
                </div>
                {selectedPackData.features && (
                  <div className="space-y-2">
                    {selectedPackData.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        {feature}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseModal(false)} className="border-gray-600">
              Annuler
            </Button>
            <Button onClick={onConfirmPurchase} className="bg-cyan-600 hover:bg-cyan-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Procéder au paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAutoRefillModal} onOpenChange={setShowAutoRefillModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Recharge automatique</DialogTitle>
            <DialogDescription>Configurez la recharge automatique de vos crédits</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="auto-refill-threshold" className="text-gray-300 mb-2 block">
                Seuil de recharge ({autoRefillThreshold} crédits)
              </Label>
              <Slider
                id="auto-refill-threshold"
                value={[autoRefillThreshold]}
                onValueChange={(v) => setAutoRefillThreshold(v[0])}
                min={10}
                max={500}
                step={10}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="auto-refill-pack" className="text-gray-300 mb-2 block">Pack à acheter</Label>
              <Select value={autoRefillPack || ''} onValueChange={(v) => setAutoRefillPack(v || null)}>
                <SelectTrigger className="w-full bg-gray-900 border-gray-600 text-white">
                  <SelectValue placeholder="Sélectionner un pack" />
                </SelectTrigger>
                <SelectContent>
                  {creditPacksForSelect.map((pack) => (
                    <SelectItem key={pack.id} value={pack.id}>
                      {pack.name} - {formatNumber(pack.credits)} crédits ({formatPrice(pack.price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAutoRefillModal(false)} className="border-gray-600">
              Annuler
            </Button>
            <Button onClick={onEnableAutoRefill} className="bg-cyan-600 hover:bg-cyan-700">
              <Save className="w-4 h-4 mr-2" />
              Activer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Exporter l'historique</DialogTitle>
            <DialogDescription>Choisissez le format d'export</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={handleExportCsv} className="border-gray-600">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={handleExportJson} className="border-gray-600">
                <FileJson className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportModal(false)} className="border-gray-600">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
