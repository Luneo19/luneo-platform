/**
 * Modal de modification de statut de commande
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Save } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import type { OrderStatus } from '../../types';

interface UpdateOrderStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: OrderStatus;
  orderId: string;
  onUpdate: (orderId: string, status: OrderStatus, notes?: string) => Promise<{ success: boolean }>;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'processing', label: 'En traitement' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'delivered', label: 'Livrée' },
  { value: 'cancelled', label: 'Annulée' },
];

export function UpdateOrderStatusModal({
  open,
  onOpenChange,
  currentStatus,
  orderId,
  onUpdate,
}: UpdateOrderStatusModalProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await onUpdate(orderId, status, notes);
      if (result.success) {
        setNotes('');
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900">
        <DialogHeader>
          <DialogTitle>{t('orders.updateStatusTitle')}</DialogTitle>
          <DialogDescription>
            {t('orders.updateStatusDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-gray-700">{t('orders.newStatus')}</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(`orders.statuses.${option.value}` as string)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-700">{t('orders.notesOptionalPlaceholder')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('orders.statusNotesPlaceholder')}
              rows={3}
              className="bg-white border-gray-200 text-gray-900 mt-1 resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-200"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={saving || status === currentStatus}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t('orders.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('common.save')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



