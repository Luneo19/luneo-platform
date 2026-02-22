/**
 * Liste des membres de l'équipe
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Trash2, Mail, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatRelativeDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { ROLES } from '../constants/team';
import type { TeamMember } from '../types';
import { useI18n } from '@/i18n/useI18n';

interface TeamMembersListProps {
  members: TeamMember[];
  onEditRole: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
}

export function TeamMembersList({ members, onEditRole, onRemove }: TeamMembersListProps) {
  const { t } = useI18n();
  const getRoleInfo = (role: string) => {
    return ROLES.find((r) => r.id === role) || ROLES[2];
  };

  if (members.length === 0) {
    return (
      <Card className="p-12 bg-gray-50 border-gray-200 text-center">
        <p className="text-gray-600">{t('dashboard.team.noMembers')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const roleInfo = getRoleInfo(member.role);
        const RoleIcon = roleInfo.icon;

        return (
          <Card key={member.id} className="p-4 bg-white border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 font-medium">{member.name}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border',
                        roleInfo.color === 'yellow' ? 'border-yellow-500/50 text-yellow-400' :
                        roleInfo.color === 'blue' ? 'border-blue-500/50 text-blue-400' :
                        roleInfo.color === 'green' ? 'border-green-500/50 text-green-400' :
                        'border-gray-500/50 text-gray-600',
                      )}
                    >
                      {RoleIcon && React.createElement(RoleIcon as React.ElementType, { className: 'w-3 h-3 mr-1' })}
                      {t(`dashboard.team.roles.${(member.role || 'member').toLowerCase()}`)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t('dashboard.team.memberSince')} {formatDate(member.joinedAt)}
                    </span>
                    {member.lastActive && (
                      <span>{t('dashboard.team.lastActive')} {formatRelativeDate(member.lastActive.toISOString())}</span>
                    )}
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-gray-200">
                  <DropdownMenuItem
                    onClick={() => onEditRole(member)}
                    className="text-gray-700 cursor-pointer"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {t('dashboard.team.editRoleMenu')}
                  </DropdownMenuItem>
                  {member.role !== 'OWNER' && (
                    <DropdownMenuItem
                      onClick={() => onRemove(member)}
                      className="text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('dashboard.team.removeFromTeamMenu')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

