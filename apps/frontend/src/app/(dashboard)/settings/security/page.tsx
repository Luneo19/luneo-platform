'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { FadeIn, SlideUp } from '@/components/animations';
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  QrCode,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { endpoints } from '@/lib/api/client';
import Image from 'next/image';

function toStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is string => typeof item === 'string');
}

function SecuritySettingsPageContent() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationToken, setVerificationToken] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    check2FAStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const check2FAStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = await endpoints.auth.me();
      // Note: L'API devrait retourner is2FAEnabled dans le user
      // Pour l'instant, on suppose que c'est false par défaut
      setIs2FAEnabled(false);
    } catch (err) {
      logger.error('Error checking 2FA status', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setup2FA = useCallback(async () => {
    try {
      setIsSettingUp(true);
      setError('');
      const response = await endpoints.auth.setup2FA();

      setQrCodeUrl(response.qrCodeUrl ?? (response as { qrCode?: string }).qrCode);
      setSecret(response.secret);
      setBackupCodes(toStringArray(response.backupCodes));
    } catch (err) {
      logger.error('Error setting up 2FA', err);
      setError('Erreur lors de la configuration de la 2FA');
    } finally {
      setIsSettingUp(false);
    }
  }, []);

  const verifyAndEnable2FA = useCallback(async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError('Veuillez entrer un code à 6 chiffres');
      return;
    }

    try {
      setIsVerifying(true);
      setError('');
      const response = await endpoints.auth.verify2FA(verificationToken);

      setSuccess('2FA activée avec succès !');
      setIs2FAEnabled(true);
      setShowBackupCodes(true);
      setBackupCodes(toStringArray(response.backupCodes));
      setVerificationToken('');
      setQrCodeUrl('');
      setSecret('');
    } catch (err) {
      logger.error('Error verifying 2FA', err);
      setError('Code invalide. Veuillez réessayer.');
    } finally {
      setIsVerifying(false);
    }
  }, [verificationToken]);

  const disable2FA = useCallback(async () => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver la 2FA ?')) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await endpoints.auth.disable2FA();

      setSuccess('2FA désactivée avec succès');
      setIs2FAEnabled(false);
      setBackupCodes([]);
      setShowBackupCodes(false);
    } catch (err) {
      logger.error('Error disabling 2FA', err);
      setError('Erreur lors de la désactivation de la 2FA');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const copyBackupCodes = useCallback(() => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setSuccess('Codes de backup copiés !');
  }, [backupCodes]);

  const downloadBackupCodes = useCallback(() => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'luneo-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [backupCodes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <motion
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <SlideUp delay={0.1}>
        <h1 className="text-3xl font-bold text-white mb-2">Sécurité</h1>
        <p className="text-slate-400 mb-8">Gérez vos paramètres de sécurité et authentification</p>
      </SlideUp>

      {/* 2FA Section */}
      <SlideUp delay={0.2}>
        <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Authentification à deux facteurs (2FA)
              </h2>
              <p className="text-slate-400 text-sm">
                Ajoutez une couche de sécurité supplémentaire à votre compte
              </p>
            </div>
            {is2FAEnabled && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Activée</span>
              </div>
            )}
          </div>

          {error && (
            <FadeIn>
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </FadeIn>
          )}

          {success && (
            <FadeIn>
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-sm text-green-300">{success}</p>
              </div>
            </FadeIn>
          )}

          {!is2FAEnabled && !qrCodeUrl && (
            <Button
              onClick={setup2FA}
              disabled={isSettingUp}
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              {isSettingUp ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Configuration...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Configurer la 2FA
                </>
              )}
            </Button>
          )}

          {qrCodeUrl && !is2FAEnabled && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-slate-300 mb-4">
                  Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)
                </p>
                <div className="inline-block p-4 bg-white rounded-lg">
                  {/* next/image not needed for data URLs */}
                  <Image src={qrCodeUrl} alt="QR Code 2FA" className="w-64 h-64" width={200} height={200} unoptimized />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Ou entrez manuellement ce code : <code className="bg-slate-700 px-2 py-1 rounded">{secret}</code>
                </p>
              </div>

              <div>
                <Label htmlFor="verification-token" className="text-slate-300 mb-2 block">
                  Code de vérification (6 chiffres)
                </Label>
                <Input
                  id="verification-token"
                  type="text"
                  maxLength={6}
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Button
                  onClick={verifyAndEnable2FA}
                  disabled={isVerifying || verificationToken.length !== 6}
                  className="mt-4 bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    'Activer la 2FA'
                  )}
                </Button>
              </div>
            </div>
          )}

          {is2FAEnabled && (
            <div className="space-y-4">
              <p className="text-slate-300 text-sm">
                La 2FA est activée sur votre compte. Vous devrez entrer un code à chaque connexion.
              </p>
              {showBackupCodes && backupCodes.length > 0 && (
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-yellow-400">
                      ⚠️ Codes de backup - Sauvegardez-les maintenant !
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyBackupCodes}
                        className="border-slate-600 text-slate-300"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadBackupCodes}
                        className="border-slate-600 text-slate-300"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <code key={index} className="bg-slate-800 px-3 py-2 rounded text-sm text-slate-300">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              )}
              <Button
                onClick={disable2FA}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500/10"
              >
                Désactiver la 2FA
              </Button>
            </div>
          )}
        </div>
      </SlideUp>
    </motion>
  );
}

export default function SecuritySettingsPage() {
  return (
    <ErrorBoundary componentName="SecuritySettingsPage">
      <SecuritySettingsPageContent />
    </ErrorBoundary>
  );
}
