/**
 * Header de la page Team
 */

'use client';

import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/useI18n';
import type { TeamStats } from '../types';

interface TeamHeaderProps {
  stats: TeamStats;
  onInvite: () => void;
}

export function TeamHeader({ stats, onInvite }: TeamHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-cyan-400" />
          {t('dashboard.team.title')}
        </h1>
        <p className="text-gray-400 mt-1">
          {stats.total} {t('dashboard.team.subtitleMembers')} • {stats.invites} {t('dashboard.team.subtitleInvitesPending')}
        </p>
      </div>
      <Button
        onClick={onInvite}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        {t('dashboard.team.invite')}
      </Button>
    </div>
  );
}



