'use client';

import React, { useState, useEffect, memo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, Mail, Building, Save, Shield, Bell, Palette, Globe, Lock, Smartphone, CheckCircle, AlertCircle, Camera,
  Trash2, Download, Eye, EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { trpc } from '@/lib/trpc/client';

interface UserProfile {
  name: string;
  email: string;
  company: string;
  role: string;
  avatar: string;
  phone: string;
  website: string;
  timezone: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  sessions: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReport: boolean;
  productUpdates: boolean;
  securityAlerts: boolean;
}

function SettingsPageContent() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    company: '',
    role: '',
    avatar: '',
    phone: '',
    website: '',
    timezone: 'Europe/Paris'
  });

  // Query profile from tRPC
  const profileQuery = trpc.profile.get.useQuery();
  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: (data) => {
      profileQuery.refetch();
      setProfile({
        name: data.name || '',
        email: data.email || '',
        company: data.company || '',
        role: data.role || '',
        avatar: data.avatar_url || '',
        phone: data.phone || '',
        website: data.website || '',
        timezone: data.timezone || 'Europe/Paris',
      });
      toast({ title: 'Succès', description: 'Profil mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
  const changePasswordMutation = trpc.profile.changePassword.useMutation({
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Mot de passe modifié' });
      setShowPassword(false);
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Update profile state when query data changes
  useEffect(() => {
    if (profileQuery.data) {
      setProfile({
        name: profileQuery.data.name || '',
        email: profileQuery.data.email || '',
        company: profileQuery.data.company || '',
        role: profileQuery.data.role || '',
        avatar: profileQuery.data.avatar_url || '',
        phone: profileQuery.data.phone || '',
        website: profileQuery.data.website || '',
        timezone: profileQuery.data.timezone || 'Europe/Paris',
      });
      setLoading(false);
    } else if (profileQuery.isLoading) {
      setLoading(true);
    } else if (profileQuery.isError) {
      setLoading(false);
      toast({
        title: 'Erreur',
        description: profileQuery.error?.message || 'Erreur lors du chargement du profil',
        variant: 'destructive',
      });
    }
  }, [profileQuery.data, profileQuery.isLoading, profileQuery.isError, profileQuery.error, toast]);

  // Security state
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    lastPasswordChange: '2025-10-15',
    sessions: 3
  });

  // Password state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReport: true,
    productUpdates: false,
    securityAlerts: true
  });

  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('fr');

  const handleSaveProfile = useCallback(() => {
    setSaving(true);
    updateProfileMutation.mutate({
      name: profile.name,
      company: profile.company,
      website: profile.website,
      phone: profile.phone,
      timezone: profile.timezone,
    });
    setSaving(false);
  }, [profile, updateProfileMutation]);

  const handleChangePassword = useCallback(() => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    changePasswordMutation.mutate({
      currentPassword: passwords.current,
      newPassword: passwords.new,
    });
    setPasswords({ current: '', new: '', confirm: '' });
    setSaving(false);
  }, [passwords, changePasswordMutation, toast]);

  const handleToggle2FA = async () => {
    setSaving(true);
    try {
      if (security.twoFactorEnabled) {
        await endpoints.auth.disable2FA();
        setSecurity({ ...security, twoFactorEnabled: false });
        toast({
          title: "2FA désactivée",
          description: "L'authentification à deux facteurs a été désactivée.",
        });
      } else {
        await endpoints.auth.setup2FA();
        setSecurity({ ...security, twoFactorEnabled: true });
        toast({
          title: "2FA activée",
          description: "Scannez le QR code avec votre application (prochaine étape à compléter dans les paramètres sécurité).",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de modifier les paramètres de sécurité.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await endpoints.settings.notifications(notifications as unknown as Record<string, unknown>);
      toast({
        title: "Notifications enregistrées",
        description: "Vos préférences de notification ont été mises à jour.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les préférences.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Paramètres</h1>
        <p className="text-gray-400">Gérez votre compte, sécurité et préférences</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-gray-800/50 border border-gray-700">
          <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600">
            <User className="w-4 h-4 mr-2" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-blue-600">
            <Shield className="w-4 h-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-blue-600">
            <Palette className="w-4 h-4 mr-2" />
            Préférences
          </TabsTrigger>
          <TabsTrigger value="danger" className="data-[state=active]:bg-red-600">
            <AlertCircle className="w-4 h-4 mr-2" />
            Zone Danger
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
                  {profile.name.charAt(0)}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{profile.name}</h3>
                <p className="text-gray-400">{profile.role} • {profile.company}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nom complet
                  </label>
                  <Input 
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="bg-gray-900 border-gray-600 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <Input 
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="bg-gray-900 border-gray-600 text-white" 
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Building className="w-4 h-4 inline mr-2" />
                    Entreprise
                  </label>
                  <Input 
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    className="bg-gray-900 border-gray-600 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Smartphone className="w-4 h-4 inline mr-2" />
                    Téléphone
                  </label>
                  <Input 
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="bg-gray-900 border-gray-600 text-white" 
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Site web
                  </label>
                  <Input 
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    className="bg-gray-900 border-gray-600 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fuseau horaire
                  </label>
                  <select 
                    value={profile.timezone}
                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="Europe/Paris">Paris (GMT+1)</option>
                    <option value="America/New_York">New York (GMT-5)</option>
                    <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                  </select>
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {saving ? (
                  <>Enregistrement...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Password Change */}
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Changer le mot de passe</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="bg-gray-900 border-gray-600 text-white pr-10" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nouveau mot de passe
                </label>
                <Input 
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="bg-gray-900 border-gray-600 text-white" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <Input 
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="bg-gray-900 border-gray-600 text-white" 
                />
              </div>
              <Button 
                onClick={handleChangePassword}
                disabled={saving || !passwords.current || !passwords.new || !passwords.confirm}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Lock className="w-4 h-4 mr-2" />
                Changer le mot de passe
              </Button>
            </div>
          </Card>

          {/* 2FA */}
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Authentification à deux facteurs (2FA)</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Ajoutez une couche de sécurité supplémentaire à votre compte
                </p>
                {security.twoFactorEnabled && (
                  <div className="flex items-center text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    2FA activée
                  </div>
                )}
              </div>
              <Button 
                onClick={handleToggle2FA}
                variant={security.twoFactorEnabled ? "destructive" : "default"}
                disabled={saving}
              >
                {security.twoFactorEnabled ? "Désactiver" : "Activer"}
              </Button>
            </div>
          </Card>

          {/* Sessions */}
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Sessions actives</h3>
            <p className="text-gray-400 text-sm mb-4">
              {security.sessions} session(s) active(s) • Dernière connexion: il y a 2 heures
            </p>
            <Button variant="outline">
              Déconnecter toutes les sessions
            </Button>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="text-lg font-bold text-white mb-6">Préférences de notification</h3>
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Notifications par email', desc: 'Recevoir des emails pour les événements importants' },
                { key: 'pushNotifications', label: 'Notifications push', desc: 'Notifications dans le navigateur' },
                { key: 'weeklyReport', label: 'Rapport hebdomadaire', desc: 'Résumé de votre activité chaque semaine' },
                { key: 'productUpdates', label: 'Nouveautés produit', desc: 'Informations sur les nouvelles fonctionnalités' },
                { key: 'securityAlerts', label: 'Alertes de sécurité', desc: 'Notifications pour les activités suspectes' },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">{item.label}</h4>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof NotificationSettings] })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications[item.key as keyof NotificationSettings] ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications[item.key as keyof NotificationSettings] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
            <Button 
              onClick={handleSaveNotifications}
              disabled={saving}
              className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les préférences
            </Button>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="text-lg font-bold text-white mb-6">Apparence et langue</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Thème</label>
                <div className="grid grid-cols-2 gap-4">
                  {['dark', 'light'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === t 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-full h-20 rounded ${t === 'dark' ? 'bg-gray-900' : 'bg-white'} mb-2`} />
                      <span className="text-white capitalize">{t === 'dark' ? 'Sombre' : 'Clair'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Langue</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="space-y-6">
          <Card className="p-6 bg-red-950/20 border-red-900/50">
            <h3 className="text-lg font-bold text-red-400 mb-4">Zone de danger</h3>
            <p className="text-gray-400 text-sm mb-6">
              Actions irréversibles qui peuvent affecter définitivement votre compte
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 bg-gray-900/50 rounded-lg border border-red-900/30">
                <div>
                  <h4 className="text-white font-medium">Exporter mes données</h4>
                  <p className="text-sm text-gray-400">Télécharger toutes vos données en format JSON</p>
                </div>
                <Button variant="outline" className="border-gray-600">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>

              <div className="flex items-start justify-between p-4 bg-gray-900/50 rounded-lg border border-red-900/30">
                <div>
                  <h4 className="text-red-400 font-medium">Supprimer mon compte</h4>
                  <p className="text-sm text-gray-400">Supprimer définitivement votre compte et toutes vos données</p>
                </div>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
