/**
 * Modal de suppression de compte
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountModal({
  open,
  onOpenChange,
}: DeleteAccountModalProps) {
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'SUPPRIMER') {
      toast({
        title: 'Erreur',
        description: 'Veuillez taper "SUPPRIMER" pour confirmer',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Implémenter la suppression de compte
    toast({
      title: 'Info',
      description: 'Fonctionnalité de suppression de compte à venir',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-red-400">Supprimer mon compte</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Toutes vos données seront supprimées définitivement.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Attention: Cette action supprimera définitivement votre compte, toutes vos
                données, designs, commandes et configurations. Cette action ne peut pas être
                annulée.
              </span>
            </p>
          </div>
          <div>
            <Label className="text-gray-300">
              Tapez "SUPPRIMER" pour confirmer
            </Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="bg-gray-900 border-gray-600 text-white mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmText('');
              onOpenChange(false);
            }}
            className="border-gray-600"
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== 'SUPPRIMER'}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



