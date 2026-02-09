'use client';

/**
 * ORION Quick Wins - Actions rapides retention & engagement
 */
import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, ArrowLeft, Mail, AlertTriangle, Users, Clock } from 'lucide-react';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

type QuickWinStatus = {
  welcomeEmail: { configured: boolean; templateId: string | null; lastSentCount: number };
  lowCreditsAlert: { usersAtRisk: number };
  churnAlert: { inactiveUsers: number };
  trialReminder: { trialEnding: number };
} | null;

export default function OrionQuickWinsPage() {
  const [status, setStatus] = useState<QuickWinStatus>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await endpoints.orion.quickWins.status();
      setStatus(res.data);
    } catch (e) {
      logger.error('Quick wins status failed', e);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const onWelcomeSetup = async () => {
    setActionLoading('welcome');
    try {
      await endpoints.orion.quickWins.welcomeSetup();
      await fetchStatus();
    } catch (e) {
      logger.error('Welcome setup failed', e);
    } finally {
      setActionLoading(null);
    }
  };

  const onSendAlerts = async () => {
    setActionLoading('lowCredits');
    try {
      await endpoints.orion.quickWins.lowCredits();
      // TODO: wire to actual send-alerts flow when implemented
      await fetchStatus();
    } catch (e) {
      logger.error('Low credits alerts failed', e);
    } finally {
      setActionLoading(null);
    }
  };

  const onLaunchCampaign = async () => {
    setActionLoading('churn');
    try {
      await endpoints.orion.quickWins.inactive();
      // TODO: wire to campaign launch when implemented
      await fetchStatus();
    } catch (e) {
      logger.error('Churn campaign failed', e);
    } finally {
      setActionLoading(null);
    }
  };

  const onSendReminders = async () => {
    setActionLoading('trial');
    try {
      await endpoints.orion.quickWins.trialEnding();
      // TODO: wire to send reminders when implemented
      await fetchStatus();
    } catch (e) {
      logger.error('Trial reminders failed', e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orion">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Zap className="h-8 w-8 text-amber-400" />
            Quick Wins
          </h1>
          <p className="mt-1 text-zinc-400">
            Actions rapides pour ameliorer la retention et l&apos;engagement
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-zinc-700 bg-zinc-800 animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 w-32 rounded bg-zinc-700" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 w-full rounded bg-zinc-700" />
                <div className="h-9 w-24 rounded bg-zinc-700" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Welcome Email */}
          <Card className="border-zinc-700 bg-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                <Mail className="h-4 w-4 text-violet-400" />
                Welcome Email
              </CardTitle>
              <Badge
                variant="secondary"
                className={
                  status?.welcomeEmail.configured
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }
              >
                {status?.welcomeEmail.configured ? 'Active' : 'Needs Setup'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-zinc-400">
                Email de bienvenue apres inscription. Template pret pour l&apos;automation.
              </p>
              <div className="text-2xl font-bold text-white">
                {status?.welcomeEmail.lastSentCount ?? 0} <span className="text-sm font-normal text-zinc-500">sent</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-600 text-zinc-200 hover:bg-zinc-700"
                onClick={onWelcomeSetup}
                disabled={actionLoading === 'welcome'}
              >
                {status?.welcomeEmail.configured ? 'Re-setup' : 'Setup'}
              </Button>
            </CardContent>
          </Card>

          {/* 2. Low Credits Alert */}
          <Card className="border-zinc-700 bg-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Low Credits Alert
              </CardTitle>
              <Badge
                variant="secondary"
                className="bg-zinc-600/50 text-zinc-300 border-zinc-500/50"
              >
                {status?.lowCreditsAlert.usersAtRisk ?? 0} at risk
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-zinc-400">
                Utilisateurs avec credits IA &le; 10. Envoyer des rappels pour recharger.
              </p>
              <div className="text-2xl font-bold text-white">
                {status?.lowCreditsAlert.usersAtRisk ?? 0}{' '}
                <span className="text-sm font-normal text-zinc-500">users</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-600 text-zinc-200 hover:bg-zinc-700"
                onClick={onSendAlerts}
                disabled={actionLoading === 'lowCredits' || (status?.lowCreditsAlert.usersAtRisk ?? 0) === 0}
              >
                Send Alerts
              </Button>
            </CardContent>
          </Card>

          {/* 3. Churn Prevention */}
          <Card className="border-zinc-700 bg-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                Churn Prevention
              </CardTitle>
              <Badge
                variant="secondary"
                className="bg-zinc-600/50 text-zinc-300 border-zinc-500/50"
              >
                14+ days
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-zinc-400">
                Utilisateurs inactifs depuis 14 jours ou plus. Lancer une campagne win-back.
              </p>
              <div className="text-2xl font-bold text-white">
                {status?.churnAlert.inactiveUsers ?? 0}{' '}
                <span className="text-sm font-normal text-zinc-500">inactive</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-600 text-zinc-200 hover:bg-zinc-700"
                onClick={onLaunchCampaign}
                disabled={actionLoading === 'churn' || (status?.churnAlert.inactiveUsers ?? 0) === 0}
              >
                Launch Campaign
              </Button>
            </CardContent>
          </Card>

          {/* 4. Trial Reminder */}
          <Card className="border-zinc-700 bg-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                Trial Reminder
              </CardTitle>
              <Badge
                variant="secondary"
                className="bg-zinc-600/50 text-zinc-300 border-zinc-500/50"
              >
                1–3 days
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-zinc-400">
                Marques / utilisateurs dont l&apos;essai se termine sous 3 jours.
              </p>
              <div className="text-2xl font-bold text-white">
                {status?.trialReminder.trialEnding ?? 0}{' '}
                <span className="text-sm font-normal text-zinc-500">ending</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-600 text-zinc-200 hover:bg-zinc-700"
                onClick={onSendReminders}
                disabled={actionLoading === 'trial' || (status?.trialReminder.trialEnding ?? 0) === 0}
              >
                Send Reminders
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
