/**
 * Modal de suppression d'un membre
 */

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
import { AlertTriangle, Trash2 } from 'lucide-react';
import type { TeamMember } from '../../types';

interface RemoveMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onRemove: (memberId: string) => Promise<{ success: boolean }>;
  isRemoving?: boolean;
}

export function RemoveMemberModal({
  open,
  onOpenChange,
  member,
  onRemove,
  isRemoving = false,
}: RemoveMemberModalProps) {
  const handleRemove = async () => {
    if (!member) return;

    const result = await onRemove(member.id);
    if (result.success) {
      onOpenChange(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-red-400">Retirer de l'équipe</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir retirer {member.name} de l'équipe ?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Cette action retirera {member.name} de l'équipe. Il perdra l'accès à toutes les
                fonctionnalités de l'équipe.
              </span>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-600"
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <>
                <Trash2 className="w-4 h-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Retirer de l'équipe
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



