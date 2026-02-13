/**
 * Modal d'invitation d'un membre
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, RefreshCw } from 'lucide-react';
import { ROLE_OPTIONS } from '../../constants/team';
import type { TeamRole } from '../../types';
import { useI18n } from '@/i18n/useI18n';

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: TeamRole) => Promise<{ success: boolean }>;
  isInviting?: boolean;
}

export function InviteMemberModal({
  open,
  onOpenChange,
  onInvite,
  isInviting = false,
}: InviteMemberModalProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('MEMBER');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onInvite(email, role);
    if (result.success) {
      setEmail('');
      setRole('MEMBER');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900">
        <DialogHeader>
          <DialogTitle>{t('dashboard.team.inviteModalTitle')}</DialogTitle>
          <DialogDescription>
            {t('dashboard.team.inviteDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label className="text-gray-700">{t('dashboard.team.emailLabel')}</Label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border-gray-200 text-gray-900 mt-1"
              required
            />
          </div>
          <div>
            <Label className="text-gray-700">{t('dashboard.team.role')}</Label>
            <Select value={role} onValueChange={(value) => setRole(value as TeamRole)}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((roleOption) => (
                  <SelectItem key={roleOption.id} value={roleOption.id}>
                    {t(`dashboard.team.roles.${roleOption.id.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmail('');
                setRole('MEMBER');
                onOpenChange(false);
              }}
              className="border-gray-200"
            >
              {t('dashboard.common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isInviting || !email}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {isInviting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t('dashboard.team.sending')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('dashboard.team.sendInvitation')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



