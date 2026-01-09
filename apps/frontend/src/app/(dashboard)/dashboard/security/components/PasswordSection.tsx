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
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                Mot de passe
              </CardTitle>
              <CardDescription className="text-gray-400 mt-1">
                Changez votre mot de passe régulièrement pour maintenir la sécurité de votre compte
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              Changer le mot de passe
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-400">
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



