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
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountModal({
  open,
  onOpenChange,
}: DeleteAccountModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'SUPPRIMER') {
      toast({
        title: 'Erreur',
        description: 'Veuillez taper "SUPPRIMER" pour confirmer',
        variant: 'destructive',
      });
      return;
    }

    if (!password) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer votre mot de passe',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    try {
      await endpoints.security.deleteAccount({
        password,
        reason: 'User requested account deletion via settings',
      });

      toast({
        title: 'Compte supprimé',
        description: 'Votre compte a été supprimé avec succès. Vous allez être déconnecté.',
      });

      // Clear local storage and redirect to home
      localStorage.clear();
      setTimeout(() => {
        router.push('/');
        window.location.reload();
      }, 2000);
    } catch (error: unknown) {
      logger.error(
        'Error deleting account',
        error instanceof Error ? error : new Error(String(error)),
        { response: error && typeof error === 'object' && 'response' in error ? (error as { response?: unknown }).response : undefined }
      );
      const desc =
        (error && typeof error === 'object' && 'response' in error && (error as { response?: { data?: { message?: string } } }).response?.data?.message) ||
        (error instanceof Error ? error.message : 'Erreur lors de la suppression du compte');
      toast({
        title: 'Erreur',
        description: typeof desc === 'string' ? desc : 'Erreur lors de la suppression du compte',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900">
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
            <Label className="text-gray-700">
              Mot de passe
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              className="bg-white border-gray-200 text-gray-900 mt-1"
            />
          </div>
          <div>
            <Label className="text-gray-700">
              Tapez "SUPPRIMER" pour confirmer
            </Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="bg-white border-gray-200 text-gray-900 mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmText('');
              setPassword('');
              onOpenChange(false);
            }}
            className="border-gray-200"
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== 'SUPPRIMER' || !password || isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



