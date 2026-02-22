/**
 * Onglet Sécurité dans Settings
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Trash2, Download, Fingerprint } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { useSecuritySettings } from '../../hooks/useSecuritySettings';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';
import { DeleteAccountModal } from '../modals/DeleteAccountModal';
import type { SecuritySession } from '../../types';

interface SecurityTabProps {
  sessions?: SecuritySession[];
}

export function SecurityTab({ sessions: sessionsProp = [] }: SecurityTabProps) {
  const { t } = useI18n();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessionsData } = useQuery({
    queryKey: ['security', 'sessions'],
    queryFn: () => endpoints.security.sessions(),
    retry: false,
    staleTime: 60_000,
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => endpoints.security.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'sessions'] });
      toast({ title: t('settings.security.revokeSuccess'), description: t('settings.security.revokeSuccessDesc') });
    },
    onError: (error: unknown) => {
      const message = getErrorDisplayMessage(error);
      logger.error('Session revoke failed', error instanceof Error ? error : new Error(String(error)));
      toast({ title: t('common.error'), description: message, variant: 'destructive' });
    },
  });

  const sessions: SecuritySession[] = Array.isArray(sessionsData)
    ? sessionsData.map((s) => ({
        id: s.id,
        device: s.device ?? 'Appareil inconnu',
        browser: s.browser ?? '',
        location: s.location ?? '',
        ip: s.ip ?? '',
        lastActive: s.lastActive ?? new Date().toISOString(),
        current: s.current ?? false,
      }))
    : sessionsProp;

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Mot de passe</CardTitle>
          <CardDescription className="text-gray-600">
            Changez votre mot de passe pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setShowPasswordModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Shield className="w-4 h-4 mr-2" />
            Changer le mot de passe
          </Button>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      {sessions.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Sessions actives</CardTitle>
            <CardDescription className="text-gray-600">
              Gérez vos sessions actives sur différents appareils
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <p className="text-gray-900 font-medium">{session.device}</p>
                  <p className="text-sm text-gray-600">
                    {session.browser} • {session.location} • {session.ip}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Dernière activité: {new Date(session.lastActive).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {session.current && (
                    <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                      Actuelle
                    </span>
                  )}
                  {!session.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeMutation.mutate(session.id)}
                      disabled={revokeMutation.isPending}
                      className="border-gray-200"
                    >
                      Révoquer
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Two-Factor Authentication */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Authentification à deux facteurs (2FA)</CardTitle>
          <CardDescription className="text-gray-600">
            Ajoutez une couche de sécurité supplémentaire à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard/security'}
            className="border-gray-200"
          >
            <Fingerprint className="w-4 h-4 mr-2" />
            Gérer la 2FA
          </Button>
        </CardContent>
      </Card>

      {/* GDPR Data Export */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Export de données (RGPD)</CardTitle>
          <CardDescription className="text-gray-600">
            Téléchargez une copie de toutes vos données personnelles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                toast({ title: t('security.exportInProgress'), description: t('security.pleaseWait') });
                const result = await endpoints.security.exportData();
                if (result && typeof result === 'object' && 'url' in result && result.url) {
                  window.open(result.url as string, '_blank');
                } else {
                  // Download as JSON file
                  const data = result && typeof result === 'object' && 'data' in result ? result.data : result;
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `luneo-data-export-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
                toast({ title: t('common.success'), description: t('settings.security.exportSuccess') });
              } catch (error) {
                logger.error('GDPR export failed', error instanceof Error ? error : new Error(String(error)));
                toast({ title: t('common.error'), description: t('common.somethingWentWrong'), variant: 'destructive' });
              }
            }}
            className="border-gray-200"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('common.exportMyData')}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="bg-white border-gray-200 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400">Zone de danger</CardTitle>
          <CardDescription className="text-gray-600">
            Actions irréversibles sur votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer mon compte
          </Button>
        </CardContent>
      </Card>

      <ChangePasswordModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
      />

      <DeleteAccountModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
      />
    </div>
  );
}



