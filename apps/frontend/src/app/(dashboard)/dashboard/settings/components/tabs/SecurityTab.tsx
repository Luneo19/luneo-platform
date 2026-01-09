/**
 * Onglet Sécurité dans Settings
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield, Trash2, RefreshCw } from 'lucide-react';
import { useSecuritySettings } from '../../hooks/useSecuritySettings';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';
import { DeleteAccountModal } from '../modals/DeleteAccountModal';
import type { SecuritySession } from '../../types';

interface SecurityTabProps {
  sessions?: SecuritySession[];
}

export function SecurityTab({ sessions = [] }: SecurityTabProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Mot de passe</CardTitle>
          <CardDescription className="text-gray-400">
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
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Sessions actives</CardTitle>
            <CardDescription className="text-gray-400">
              Gérez vos sessions actives sur différents appareils
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700"
              >
                <div>
                  <p className="text-white font-medium">{session.device}</p>
                  <p className="text-sm text-gray-400">
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
                      onClick={() => {
                        // TODO: Implémenter révocation de session
                      }}
                      className="border-gray-600"
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

      {/* Delete Account */}
      <Card className="bg-gray-800/50 border-gray-700 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400">Zone de danger</CardTitle>
          <CardDescription className="text-gray-400">
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



