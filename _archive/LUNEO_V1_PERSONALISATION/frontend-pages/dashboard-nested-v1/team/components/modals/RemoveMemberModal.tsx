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
import { useI18n } from '@/i18n/useI18n';

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
  const { t } = useI18n();
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
      <DialogContent className="bg-white border-gray-200 text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-red-400">{t('dashboard.team.removeFromTeamTitle')}</DialogTitle>
          <DialogDescription>
            {t('dashboard.team.removeConfirmDescription')} {member.name}{t('dashboard.team.removeConfirmSuffix')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                {t('dashboard.team.removeNote')}
              </span>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-200"
          >
            {t('dashboard.common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <>
                <Trash2 className="w-4 h-4 mr-2 animate-spin" />
                {t('dashboard.team.removing')}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                {t('dashboard.team.removeFromTeamMenu')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



