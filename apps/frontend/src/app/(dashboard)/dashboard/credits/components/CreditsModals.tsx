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
import { useI18n } from '@/i18n/useI18n';
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
  const { t } = useI18n();
  const { toast } = useToast();
  const selectedPackData = selectedPack ? creditPacks.find((p) => p.id === selectedPack) : null;

  const getTypeLabel = (type: CreditTransaction['type']) => {
    const key = `credits.history.${type}` as 'credits.history.purchase' | 'credits.history.usage' | 'credits.history.refund' | 'credits.history.bonus' | 'credits.history.expiration';
    return t(key);
  };

  const handleExportCsv = () => {
    try {
      const filtered = transactions.filter((tr) => filterType === 'all' || tr.type === filterType);
      const headers = ['ID', t('credits.history.type'), t('credits.history.amount'), 'Source', 'Pack', t('credits.history.date')];
      const rows = filtered.map((tr) => [
        tr.id,
        getTypeLabel(tr.type),
        tr.amount > 0 ? `+${tr.amount}` : String(tr.amount),
        tr.source ?? '',
        tr.packName ?? '',
        new Date(tr.createdAt).toLocaleString(),
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `credits_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast({ title: t('credits.exportCsvTitle'), description: t('credits.exportCsvSuccess') });
      setShowExportModal(false);
    } catch {
      toast({ title: t('common.error'), description: t('credits.exportCsvFailed'), variant: 'destructive' });
    }
  };

  const handleExportJson = () => {
    try {
      const filtered = transactions.filter((tr) => filterType === 'all' || tr.type === filterType);
      const jsonContent = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          total: filtered.length,
          transactions: filtered.map((tr) => ({
            id: tr.id,
            type: tr.type,
            amount: tr.amount,
            balanceBefore: tr.balanceBefore,
            balanceAfter: tr.balanceAfter,
            source: tr.source,
            packId: tr.packId,
            packName: tr.packName,
            createdAt: tr.createdAt instanceof Date ? tr.createdAt.toISOString() : tr.createdAt,
            metadata: tr.metadata,
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
      toast({ title: t('credits.exportJsonTitle'), description: t('credits.exportJsonSuccess') });
      setShowExportModal(false);
    } catch {
      toast({ title: t('common.error'), description: t('credits.exportJsonFailed'), variant: 'destructive' });
    }
  };

  return (
    <>
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPackData ? t('credits.buyPack', { name: selectedPackData.name }) : t('credits.buy')}</DialogTitle>
            <DialogDescription>{t('credits.confirmPurchaseDesc')}</DialogDescription>
          </DialogHeader>
          {selectedPackData && (
            <div className="space-y-4 mt-4">
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedPackData.name}</h3>
                    <p className="text-sm text-gray-600">{selectedPackData.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold text-cyan-600">{formatNumber(selectedPackData.credits)}</p>
                    <p className="text-sm text-gray-600">{t('credits.creditsLabel')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(selectedPackData.price)}</p>
                    <p className="text-sm text-gray-600">{t('credits.ttc')}</p>
                  </div>
                </div>
                {selectedPackData.features && (
                  <div className="space-y-2">
                    {selectedPackData.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {feature}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseModal(false)} className="border-gray-300">
              {t('credits.cancel')}
            </Button>
            <Button onClick={onConfirmPurchase} className="bg-cyan-600 hover:bg-cyan-700">
              <CreditCard className="w-4 h-4 mr-2" />
              {t('credits.proceedToPayment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAutoRefillModal} onOpenChange={setShowAutoRefillModal}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle>{t('credits.autoRefillModalTitle')}</DialogTitle>
            <DialogDescription>{t('credits.autoRefillModalDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="auto-refill-threshold" className="text-gray-700 mb-2 block">
                {t('credits.thresholdLabel', { count: autoRefillThreshold })}
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
              <Label htmlFor="auto-refill-pack" className="text-gray-700 mb-2 block">{t('credits.packToBuy')}</Label>
              <Select value={autoRefillPack || ''} onValueChange={(v) => setAutoRefillPack(v || null)}>
                <SelectTrigger className="w-full bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder={t('credits.selectPack')} />
                </SelectTrigger>
                <SelectContent>
                  {creditPacksForSelect.map((pack) => (
                    <SelectItem key={pack.id} value={pack.id}>
                      {t('credits.packCreditsPrice', { name: pack.name, credits: formatNumber(pack.credits), price: formatPrice(pack.price) })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAutoRefillModal(false)} className="border-gray-300">
              {t('credits.cancel')}
            </Button>
            <Button onClick={onEnableAutoRefill} className="bg-cyan-600 hover:bg-cyan-700">
              <Save className="w-4 h-4 mr-2" />
              {t('credits.activate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle>{t('credits.exportHistoryTitle')}</DialogTitle>
            <DialogDescription>{t('credits.chooseExportFormat')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={handleExportCsv} className="border-gray-300">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={handleExportJson} className="border-gray-300">
                <FileJson className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportModal(false)} className="border-gray-300">
              {t('credits.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
