/**
 * Modal de modification du rôle d'un membre
 */

'use client';

import { useState, useEffect } from 'react';
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
import { Save, RefreshCw } from 'lucide-react';
import { ROLE_OPTIONS } from '../../constants/team';
import type { TeamMember, TeamRole } from '../../types';

interface EditRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onUpdateRole: (memberId: string, role: TeamRole) => Promise<{ success: boolean }>;
  isUpdating?: boolean;
}

export function EditRoleModal({
  open,
  onOpenChange,
  member,
  onUpdateRole,
  isUpdating = false,
}: EditRoleModalProps) {
  const [role, setRole] = useState<TeamRole>('MEMBER');

  useEffect(() => {
    if (member) {
      setRole(member.role);
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    const result = await onUpdateRole(member.id, role);
    if (result.success) {
      onOpenChange(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Modifier le rôle</DialogTitle>
          <DialogDescription>
            Modifier le rôle de {member.name} dans l'équipe
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label className="text-gray-300">Rôle</Label>
            <Select value={role} onValueChange={(value) => setRole(value as TeamRole)}>
              <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((roleOption) => (
                  <SelectItem key={roleOption.id} value={roleOption.id}>
                    {roleOption.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || role === member.role}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


