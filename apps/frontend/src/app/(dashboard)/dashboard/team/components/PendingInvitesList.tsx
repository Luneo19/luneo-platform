/**
 * Liste des invitations en attente
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, X, Clock } from 'lucide-react';
import { formatDate, formatRelativeDate } from '@/lib/utils/formatters';
import { ROLES } from '../constants/team';
import type { PendingInvite } from '../types';
import { useI18n } from '@/i18n/useI18n';

interface PendingInvitesListProps {
  invites: PendingInvite[];
  onCancel: (inviteId: string) => void;
}

export function PendingInvitesList({ invites, onCancel }: PendingInvitesListProps) {
  const { t } = useI18n();
  if (invites.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900">{t('dashboard.team.pendingInvitesTitle')}</CardTitle>
        <CardDescription className="text-gray-600">
          {invites.length} {t('dashboard.team.subtitleInvitesPending')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite) => {
          const roleInfo = ROLES.find((r) => r.id === invite.role) || ROLES[2];
          const isExpired = new Date(invite.expiresAt) < new Date();

          return (
            <div
              key={invite.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 font-medium">{invite.email}</p>
                    <Badge variant="outline" className="border-gray-200 text-gray-600">
                      {t(`dashboard.team.roles.${(roleInfo.id || 'member').toLowerCase()}`)}
                    </Badge>
                    {isExpired && (
                      <Badge variant="outline" className="border-red-500/50 text-red-400">
                        {t('dashboard.team.expired')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('dashboard.team.invited')} {formatRelativeDate(invite.invitedAt.toISOString())} • {t('dashboard.team.expires')}{' '}
                    {formatRelativeDate(invite.expiresAt.toISOString())}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel(invite.id)}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

