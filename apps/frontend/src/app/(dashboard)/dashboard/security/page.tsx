'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Key,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Paramètres de sécurité
 * Gestion de la sécurité du compte
 */
export default function SecurityPage() {
  const { toast } = useToast();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const activeSessions = [
    { id: '1', device: 'MacBook Pro', location: 'Paris, France', lastActive: 'Maintenant', current: true },
    { id: '2', device: 'iPhone 13', location: 'Lyon, France', lastActive: 'Il y a 2h', current: false },
    { id: '3', device: 'Windows PC', location: 'Marseille, France', lastActive: 'Il y a 3 jours', current: false },
  ];

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Succès',
      description: 'Mot de passe modifié avec succès',
    });
  };

  return (
    <ErrorBoundary componentName="Security">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            Sécurité
          </h1>
          <p className="text-slate-400 mt-2">
            Gérez les paramètres de sécurité de votre compte
          </p>
        </div>

        <div className="space-y-6">
          {/* Password Change */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                Mot de passe
              </CardTitle>
              <CardDescription className="text-slate-400">
                Modifiez votre mot de passe pour renforcer la sécurité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current" className="text-white">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="current"
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new" className="text-white">Nouveau mot de passe</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-white">Confirmer le mot de passe</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button
                onClick={handlePasswordChange}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Modifier le mot de passe
              </Button>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                Authentification à deux facteurs
              </CardTitle>
              <CardDescription className="text-slate-400">
                Ajoutez une couche de sécurité supplémentaire à votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium mb-1">Authentification 2FA</p>
                  <p className="text-sm text-slate-400">
                    {twoFactorEnabled
                      ? 'Activée - Votre compte est protégé'
                      : 'Désactivée - Activez pour plus de sécurité'}
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>
              {twoFactorEnabled && (
                <div className="mt-4 p-4 bg-green-950/20 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">2FA activée</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                Sessions actives
              </CardTitle>
              <CardDescription className="text-slate-400">
                Gérez les appareils connectés à votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{session.device}</p>
                          {session.current && (
                            <Badge className="bg-green-500">Actuel</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">
                          {session.location} • {session.lastActive}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <Button variant="outline" size="sm" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                        Déconnecter
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Alerts */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-400" />
                Alertes de sécurité
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configurez les notifications de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Connexions suspectes</p>
                  <p className="text-sm text-slate-400">Recevoir une alerte en cas de connexion suspecte</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Changements de mot de passe</p>
                  <p className="text-sm text-slate-400">Être notifié lors d'un changement de mot de passe</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Nouveaux appareils</p>
                  <p className="text-sm text-slate-400">Recevoir une notification pour chaque nouvel appareil</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}

