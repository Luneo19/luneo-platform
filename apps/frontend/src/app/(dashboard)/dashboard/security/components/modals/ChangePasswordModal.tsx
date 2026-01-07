/**
 * Modal de changement de mot de passe
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
import { Eye, EyeOff, RefreshCw } from 'lucide-react';

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChangePassword: (current: string, newPassword: string) => Promise<{ success: boolean }>;
  isChanging?: boolean;
}

export function ChangePasswordModal({
  open,
  onOpenChange,
  onChangePassword,
  isChanging = false,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      return;
    }

    if (newPassword.length < 8) {
      return;
    }

    const result = await onChangePassword(currentPassword, newPassword);
    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Changer le mot de passe</DialogTitle>
          <DialogDescription>
            Entrez votre mot de passe actuel et choisissez un nouveau mot de passe sécurisé
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label className="text-gray-300">Mot de passe actuel</Label>
            <div className="relative mt-1">
              <Input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-gray-900 border-gray-600 text-white pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label className="text-gray-300">Nouveau mot de passe</Label>
            <div className="relative mt-1">
              <Input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-gray-900 border-gray-600 text-white pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Au moins 8 caractères</p>
          </div>
          <div>
            <Label className="text-gray-300">Confirmer le nouveau mot de passe</Label>
            <div className="relative mt-1">
              <Input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-gray-900 border-gray-600 text-white pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                onOpenChange(false);
              }}
              className="border-gray-600"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isChanging || newPassword !== confirmPassword || newPassword.length < 8}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isChanging ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Changement...
                </>
              ) : (
                'Changer le mot de passe'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


