'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPrice } from '@/lib/utils/formatters';
import { CreditCard } from 'lucide-react';

interface PayoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingCommissions: number;
}

export function PayoutModal({ open, onOpenChange, pendingCommissions }: PayoutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Demander un paiement</DialogTitle>
          <DialogDescription>Demandez le paiement de vos commissions en attente</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-gray-900/50 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Montant disponible</p>
            <p className="text-3xl font-bold text-green-400">{formatPrice(pendingCommissions)}</p>
          </div>
          <div>
            <Label htmlFor="payout-method" className="text-gray-300 mb-2 block">
              Méthode de paiement
            </Label>
            <Select defaultValue="bank">
              <SelectTrigger className="w-full bg-gray-900 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Virement bancaire</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-600">
            Annuler
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <CreditCard className="w-4 h-4 mr-2" />
            Demander le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
