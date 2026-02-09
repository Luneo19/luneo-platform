/**
 * Section de gestion de la 2FA
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, ShieldOff } from 'lucide-react';
import { useTwoFactor } from '../hooks/useTwoFactor';
import { Enable2FAModal } from './modals/Enable2FAModal';
import { Disable2FAModal } from './modals/Disable2FAModal';
import { BackupCodesModal } from './modals/BackupCodesModal';

export function TwoFactorSection() {
  const { status, isLoading, isEnabling, isDisabling, enable2FA, disable2FA } = useTwoFactor();
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);

  if (isLoading) {
    return (
      <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Authentification à deux facteurs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/60">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Authentification à deux facteurs
              </CardTitle>
              <CardDescription className="text-white/60 mt-1">
                Ajoutez une couche supplémentaire de sécurité à votre compte
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {status.enabled ? (
                <>
                  <Badge variant="outline" className="border-green-500/50 text-green-400">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Activée
                  </Badge>
                  <Button
                    variant="outline"
                    onClick={() => setShowBackupCodesModal(true)}
                    className="border-white/[0.06] hover:bg-white/[0.04]"
                  >
                    Codes de secours
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDisableModal(true)}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <ShieldOff className="w-4 h-4 mr-2" />
                    Désactiver
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowEnableModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Activer 2FA
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-white/60">
            {status.enabled ? (
              <>
                <p>• La 2FA est activée et protège votre compte</p>
                <p>• Utilisez votre application d'authentification pour vous connecter</p>
                <p>• Conservez vos codes de secours en lieu sûr</p>
              </>
            ) : (
              <>
                <p>• Protégez votre compte avec une authentification à deux facteurs</p>
                <p>• Utilisez une application comme Google Authenticator ou Authy</p>
                <p>• Vous recevrez des codes de secours à enregistrer</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Enable2FAModal
        open={showEnableModal}
        onOpenChange={setShowEnableModal}
        onEnable={enable2FA}
        isEnabling={isEnabling}
        qrCode={status.qrCode}
        backupCodes={status.backupCodes}
      />

      <Disable2FAModal
        open={showDisableModal}
        onOpenChange={setShowDisableModal}
        onDisable={disable2FA}
        isDisabling={isDisabling}
      />

      {status.backupCodes && (
        <BackupCodesModal
          open={showBackupCodesModal}
          onOpenChange={setShowBackupCodesModal}
          backupCodes={status.backupCodes}
        />
      )}
    </>
  );
}



