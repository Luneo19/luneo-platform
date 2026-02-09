'use client';

/**
 * Admin Settings - Configuration générale de la plateforme
 */
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Settings,
  Shield,
  Bell,
  Wrench,
  Globe,
  Clock,
  Languages,
  CheckCircle,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [enforce2FA, setEnforce2FA] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [webhookAlerts, setWebhookAlerts] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="h-8 w-8 text-zinc-400" />
          Paramètres
        </h1>
        <p className="mt-2 text-zinc-400">
          Configuration générale de la plateforme
        </p>
      </div>

      {/* Settings grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* General */}
        <Card className="border-zinc-700 bg-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Globe className="h-5 w-5 text-cyan-400" />
              Général
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Paramètres généraux de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2">
                <Globe className="h-4 w-4 text-zinc-500" />
                Nom de la plateforme
              </Label>
              <Input
                value="Luneo"
                readOnly
                className="bg-zinc-900 border-zinc-600 text-white cursor-default"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2">
                <Languages className="h-4 w-4 text-zinc-500" />
                Langue par défaut
              </Label>
              <Input
                value="Français"
                readOnly
                className="bg-zinc-900 border-zinc-600 text-white cursor-default"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-500" />
                Fuseau horaire
              </Label>
              <Input
                value="Europe/Paris"
                readOnly
                className="bg-zinc-900 border-zinc-600 text-white cursor-default"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sécurité */}
        <Card className="border-zinc-700 bg-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-amber-400" />
              Sécurité
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Configuration de la sécurité plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-zinc-900/50 p-3">
              <div>
                <p className="text-sm font-medium text-zinc-300">Imposer le 2FA</p>
                <p className="text-xs text-zinc-500">
                  Forcer l&apos;authentification à deux facteurs pour tous les utilisateurs
                </p>
              </div>
              <Switch checked={enforce2FA} onCheckedChange={setEnforce2FA} />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Timeout de session (minutes)</Label>
              <Input
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="bg-zinc-900 border-zinc-600 text-white"
                min="5"
                max="1440"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Whitelist IP (séparées par des virgules)</Label>
              <Input
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                placeholder="ex: 192.168.1.1, 10.0.0.0/24"
                className="bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-zinc-700 bg-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Bell className="h-5 w-5 text-purple-400" />
              Notifications
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Gestion des alertes et notifications système
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-zinc-900/50 p-3">
              <div>
                <p className="text-sm font-medium text-zinc-300">Notifications email</p>
                <p className="text-xs text-zinc-500">
                  Recevoir les alertes système par email
                </p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-900/50 p-3">
              <div>
                <p className="text-sm font-medium text-zinc-300">Alertes webhook</p>
                <p className="text-xs text-zinc-500">
                  Envoyer les événements critiques via webhooks
                </p>
              </div>
              <Switch checked={webhookAlerts} onCheckedChange={setWebhookAlerts} />
            </div>
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card className="border-zinc-700 bg-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wrench className="h-5 w-5 text-green-400" />
              Maintenance
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Mode maintenance et état du système
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-zinc-900/50 p-3">
              <div>
                <p className="text-sm font-medium text-zinc-300">Mode maintenance</p>
                <p className="text-xs text-zinc-500">
                  Activer le mode maintenance pour bloquer l&apos;accès public
                </p>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>
            <div className="rounded-lg bg-zinc-900/50 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <p className="text-sm font-medium text-zinc-300">État du système</p>
              </div>
              <p className="text-xs text-green-400/80 mt-1 ml-6">
                Tous les services opérationnels
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
