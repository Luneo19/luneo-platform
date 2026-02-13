'use client';

import { useI18n } from '@/i18n/useI18n';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface CreateLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: () => void;
}

export function CreateLinkModal({ open, onOpenChange, onCreate }: CreateLinkModalProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('affiliate.createLink')}</DialogTitle>
          <DialogDescription>Créez un nouveau lien de parrainage personnalisé</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="link-name" className="text-gray-700 mb-2 block">
              Nom du lien (optionnel)
            </Label>
            <Input
              id="link-name"
              placeholder="Ex: Lien blog, Lien email..."
              className="bg-white border-gray-200 text-gray-900"
            />
          </div>
          <div>
            <Label htmlFor="link-code" className="text-gray-700 mb-2 block">
              Code personnalisé (optionnel)
            </Label>
            <Input
              id="link-code"
              placeholder="Ex: MONCODE"
              className="bg-white border-gray-200 text-gray-900"
            />
            <p className="text-xs text-gray-600 mt-1">Si vide, un code sera généré automatiquement</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">
            Annuler
          </Button>
          <Button onClick={onCreate} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Créer le lien
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
