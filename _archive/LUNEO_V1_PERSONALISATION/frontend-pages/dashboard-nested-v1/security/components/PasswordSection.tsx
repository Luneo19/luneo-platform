/**
 * Section de gestion du mot de passe
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { ChangePasswordModal } from './modals/ChangePasswordModal';
import { useSecuritySettings } from '../hooks/useSecuritySettings';

export function PasswordSection() {
  const { changePassword, isChangingPassword } = useSecuritySettings();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-400" />
                Mot de passe
              </CardTitle>
              <CardDescription className="text-white/60 mt-1">
                Changez votre mot de passe régulièrement pour maintenir la sécurité de votre compte
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
            >
              Changer le mot de passe
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-white/60">
            <p>• Votre mot de passe doit contenir au moins 8 caractères</p>
            <p>• Utilisez une combinaison de lettres, chiffres et symboles</p>
            <p>• Ne partagez jamais votre mot de passe</p>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordModal
        open={showModal}
        onOpenChange={setShowModal}
        onChangePassword={changePassword}
        isChanging={isChangingPassword}
      />
    </>
  );
}



