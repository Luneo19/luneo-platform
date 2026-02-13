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
import { useI18n } from '@/i18n/useI18n';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { api, endpoints } from '@/lib/api/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { trpc } from '@/lib/trpc/client';
import { logger } from '@/lib/logger';

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
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);

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

  const profileQuery = trpc.profile.get.useQuery();
  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: (data: unknown) => {
      setSaving(false);
      profileQuery.refetch();
      const d = data as { name?: string; email?: string; company?: string; role?: string; avatar_url?: string; phone?: string; website?: string; timezone?: string };
      setProfile({
        name: String(d?.name ?? ''),
        email: String(d?.email ?? ''),
        company: String(d?.company ?? ''),
        role: String(d?.role ?? ''),
        avatar: String(d?.avatar_url ?? ''),
        phone: String(d?.phone ?? ''),
        website: String(d?.website ?? ''),
        timezone: String(d?.timezone ?? 'Europe/Paris'),
      });
      toast({ title: t('common.success'), description: t('settings.profile.saved') });
    },
    onError: (error) => {
      setSaving(false);
      toast({ title: t('common.error'), description: getErrorDisplayMessage(error), variant: 'destructive' });
    },
  });
  const changePasswordMutation = trpc.profile.changePassword.useMutation({
    onSuccess: () => {
      setSaving(false);
      toast({ title: t('common.success'), description: t('settings.security.passwordChanged') });
      setShowPassword(false);
    },
    onError: (error) => {
      setSaving(false);
      toast({ title: t('common.error'), description: getErrorDisplayMessage(error), variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      const d = profileQuery.data as unknown as { name?: string; email?: string; company?: string; role?: string; avatar_url?: string; phone?: string; website?: string; timezone?: string };
      setProfile({
        name: String(d.name ?? ''),
        email: String(d.email ?? ''),
        company: String(d.company ?? ''),
        role: String(d.role ?? ''),
        avatar: String(d.avatar_url ?? ''),
        phone: String(d.phone ?? ''),
        website: String(d.website ?? ''),
        timezone: String(d.timezone ?? 'Europe/Paris'),
      });
      setLoading(false);
    } else if (profileQuery.isLoading) {
      setLoading(true);
    } else if (profileQuery.isError) {
      setLoading(false);
      toast({
        title: t('common.error'),
        description: profileQuery.error?.message || t('common.somethingWentWrong'),
        variant: 'destructive',
      });
    }
  }, [profileQuery.data, profileQuery.isLoading, profileQuery.isError, profileQuery.error, toast]);

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    lastPasswordChange: '2025-10-15',
    sessions: 3
  });

  // Load settings from API
  useEffect(() => {
    fetch('/api/v1/users/settings', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const settings = data.data || data;
          if (settings.security) setSecurity((prev) => ({ ...prev, ...settings.security }));
          if (settings.notifications) setNotifications((prev) => ({ ...prev, ...settings.notifications }));
          if (settings.theme) setTheme(settings.theme);
          if (settings.language) setLanguage(settings.language);
        }
      })
      .catch((err: unknown) => {
        logger.error('Failed to load user settings', err);
      });
  }, []);

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

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
  }, [profile, updateProfileMutation]);

  const handleChangePassword = useCallback(() => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: t('common.error'),
        description: t('settings.security.passwordsDoNotMatch'),
        variant: 'destructive',
      });
      return;
    }

    if (passwords.new.length < 8) {
      toast({
        title: t('common.error'),
        description: t('settings.security.passwordMinLength'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    changePasswordMutation.mutate(
      { currentPassword: passwords.current, newPassword: passwords.new },
      {
        onSettled: () => setSaving(false),
      }
    );
    setPasswords({ current: '', new: '', confirm: '' });
  }, [passwords, changePasswordMutation, toast]);

  const handleToggle2FA = async () => {
    setSaving(true);
    try {
      if (security.twoFactorEnabled) {
        await endpoints.auth.disable2FA();
        setSecurity({ ...security, twoFactorEnabled: false });
        toast({
          title: t('settings.security.twoFactorDisabled'),
          description: t('settings.security.twoFactorDisabledDesc'),
        });
      } else {
        await endpoints.auth.setup2FA();
        setSecurity({ ...security, twoFactorEnabled: true });
        toast({
          title: t('settings.security.twoFactorEnabled'),
          description: t('settings.security.twoFactorEnabledDesc'),
        });
      }
    } catch (error: unknown) {
      toast({
        title: t('common.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
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
        title: t('settings.security.notificationsSaved'),
        description: t('settings.security.notificationsSavedDesc'),
      });
    } catch (err: unknown) {
      logger.error('Failed to save notification preferences', err);
      toast({
        title: t('common.error'),
        description: t('settings.security.savePrefsError'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('settings.title')}</h1>
        <p className="text-white/60">{t('settings.security.title')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-white/[0.04] border border-white/[0.06] p-1 rounded-xl">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=inactive]:text-white/60 rounded-lg"
          >
            <User className="w-4 h-4 mr-2" />
            {t('settings.tabs.profile')}
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=inactive]:text-white/60 rounded-lg"
          >
            <Shield className="w-4 h-4 mr-2" />
            {t('settings.tabs.security')}
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=inactive]:text-white/60 rounded-lg"
          >
            <Bell className="w-4 h-4 mr-2" />
            {t('settings.tabs.notifications')}
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=inactive]:text-white/60 rounded-lg"
          >
            <Palette className="w-4 h-4 mr-2" />
            {t('settings.tabs.preferences')}
          </TabsTrigger>
          <TabsTrigger
            value="danger"
            className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 data-[state=inactive]:text-white/60 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Zone Danger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="dash-card p-6 border-white/[0.06]">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-3xl font-bold text-white">
                  {profile.name.charAt(0)}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-purple-600 rounded-full hover:bg-purple-500 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{profile.name}</h3>
                <p className="text-white/60">{profile.role} • {profile.company}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    {t('settings.security.fullName')}
                  </label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="dash-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="dash-input"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    <Building className="w-4 h-4 inline mr-2" />
                    {t('settings.security.company')}
                  </label>
                  <Input
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    className="dash-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    <Smartphone className="w-4 h-4 inline mr-2" />
                    {t('settings.security.phone')}
                  </label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="dash-input"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    {t('settings.security.website')}
                  </label>
                  <Input
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    className="dash-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    {t('settings.security.timezone')}
                  </label>
                  <select
                    value={profile.timezone}
                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    className="dash-input w-full px-3 py-2"
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
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
              >
                {saving ? (
                  <>{t('settings.security.saving')}</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('settings.security.saveChanges')}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="dash-card p-6 border-white/[0.06]">
            <h3 className="text-lg font-bold text-white mb-4">{t('settings.security.changePassword')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  {t('settings.security.currentPassword')}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="dash-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  {t('settings.security.newPassword')}
                </label>
                <Input
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="dash-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  {t('settings.security.confirmPassword')}
                </label>
                <Input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="dash-input"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={saving || !passwords.current || !passwords.new || !passwords.confirm}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
              >
                <Lock className="w-4 h-4 mr-2" />
                {t('settings.security.changePassword')}
              </Button>
            </div>
          </Card>

          <Card className="dash-card p-6 border-white/[0.06]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{t('settings.security.twoFactor')}</h3>
                <p className="text-white/60 text-sm mb-4">
                  {t('settings.security.twoFactorAddLayer')}
                </p>
                {security.twoFactorEnabled && (
                  <div className="flex items-center text-[#4ade80] text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('settings.security.twoFactorEnabled')}
                  </div>
                )}
              </div>
              <Button
                onClick={handleToggle2FA}
                variant={security.twoFactorEnabled ? 'destructive' : 'default'}
                disabled={saving}
                className={!security.twoFactorEnabled ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-0' : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'}
              >
                {security.twoFactorEnabled ? t('common.close') + ' / Désactiver' : 'Activer'}
              </Button>
            </div>
          </Card>

          <Card className="dash-card p-6 border-white/[0.06]">
            <h3 className="text-lg font-bold text-white mb-4">{t('settings.security.sessions')}</h3>
            <p className="text-white/60 text-sm mb-4">
              {t('settings.security.sessionsCount', { count: security.sessions })} • {t('settings.security.lastLogin', { time: '2h' })}
            </p>
            <Button variant="outline" className="border-white/[0.12] text-white/80 hover:bg-white/[0.04]">
              {t('settings.security.revokeAll')}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="dash-card p-6 border-white/[0.06]">
            <h3 className="text-lg font-bold text-white mb-6">Préférences de notification</h3>
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Notifications par email', desc: 'Recevoir des emails pour les événements importants' },
                { key: 'pushNotifications', label: 'Notifications push', desc: 'Notifications dans le navigateur' },
                { key: 'weeklyReport', label: 'Rapport hebdomadaire', desc: 'Résumé de votre activité chaque semaine' },
                { key: 'productUpdates', label: 'Nouveautés produit', desc: 'Informations sur les nouvelles fonctionnalités' },
                { key: 'securityAlerts', label: 'Alertes de sécurité', desc: 'Notifications pour les activités suspectes' },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between p-4 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                  <div>
                    <h4 className="text-white font-medium">{item.label}</h4>
                    <p className="text-sm text-white/60">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof NotificationSettings] })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications[item.key as keyof NotificationSettings] ? 'bg-purple-600' : 'bg-white/[0.08]'
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
              className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les préférences
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="dash-card p-6 border-white/[0.06]">
            <h3 className="text-lg font-bold text-white mb-6">Apparence et langue</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-3">Thème</label>
                <div className="grid grid-cols-2 gap-4">
                  {['dark', 'light'].map((themeKey) => (
                    <button
                      key={themeKey}
                      onClick={() => setTheme(themeKey)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme === themeKey
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/[0.06] bg-white/[0.04] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className={`w-full h-20 rounded-lg mb-2 ${themeKey === 'dark' ? 'bg-[#12121a]' : 'bg-white/20'}`} />
                      <span className="text-white capitalize">{themeKey === 'dark' ? t('settings.security.dark') : t('settings.security.light')}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-3">{t('settings.security.language')}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="dash-input w-full px-4 py-2"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <Card className="dash-card p-6 border-red-500/30 bg-red-500/5">
            <h3 className="text-lg font-bold text-red-400 mb-4">{t('settings.security.dangerZone')}</h3>
            <p className="text-white/60 text-sm mb-6">
              {t('settings.security.dangerZoneDesc')}
            </p>

            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                <div>
                  <h4 className="text-white font-medium">{t('settings.security.exportMyData')}</h4>
                  <p className="text-sm text-white/60">{t('settings.security.exportMyDataDesc')}</p>
                </div>
                <Button variant="outline" className="border-white/[0.12] text-white/80 hover:bg-white/[0.04]">
                  <Download className="w-4 h-4 mr-2" />
                  {t('common.export')}
                </Button>
              </div>

              <div className="flex items-start justify-between p-4 bg-white/[0.04] rounded-xl border border-red-500/20">
                <div>
                  <h4 className="text-red-400 font-medium">{t('settings.security.deleteAccount')}</h4>
                  <p className="text-sm text-white/60">{t('settings.security.deleteAccountDesc')}</p>
                </div>
                <Button variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ErrorBoundary>
      <SettingsPageContent />
    </ErrorBoundary>
  );
}
