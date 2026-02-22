/**
 * Client Component pour la page Team
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { QuotaWarningBanner } from '@/components/shared/QuotaWarningBanner';
import { TeamHeader } from './components/TeamHeader';
import { TeamStats } from './components/TeamStats';
import { TeamFilters } from './components/TeamFilters';
import { TeamMembersList } from './components/TeamMembersList';
import { PendingInvitesList } from './components/PendingInvitesList';
import { InviteMemberModal } from './components/modals/InviteMemberModal';
import { EditRoleModal } from './components/modals/EditRoleModal';
import { RemoveMemberModal } from './components/modals/RemoveMemberModal';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { useTeamMembers } from './hooks/useTeamMembers';
import { useTeamActions } from './hooks/useTeamActions';
import type { TeamMember, TeamRole } from './types';

export function TeamPageClient() {
  const { t } = useI18n();
  const { members, pendingInvites, stats, isLoading, error, refetch } = useTeamMembers();
  const {
    handleInvite,
    handleChangeRole,
    handleRemoveMember,
    handleCancelInvite,
    isInviting,
    isUpdatingRole,
    isRemoving,
    isCancelling,
  } = useTeamActions();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || m.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, searchTerm, roleFilter]);

  const handleEditRole = useCallback((member: TeamMember) => {
    setSelectedMember(member);
    setShowEditRoleModal(true);
  }, []);

  const handleRemove = useCallback((member: TeamMember) => {
    setSelectedMember(member);
    setShowRemoveModal(true);
  }, []);

  const handleUpdateRole = useCallback(
    async (memberId: string, role: string) => {
      const result = await handleChangeRole(memberId, role as TeamRole);
      if (result.success) {
        refetch();
      }
      return result;
    },
    [handleChangeRole, refetch]
  );

  const handleRemoveConfirm = useCallback(
    async (memberId: string) => {
      const result = await handleRemoveMember(memberId);
      if (result.success) {
        refetch();
      }
      return result;
    },
    [handleRemoveMember, refetch]
  );

  const handleInviteConfirm = useCallback(
    async (email: string, role: string) => {
      const result = await handleInvite(email, role as TeamRole);
      if (result.success) {
        refetch();
      }
      return result;
    },
    [handleInvite, refetch]
  );

  const handleCancelInviteConfirm = useCallback(
    async (inviteId: string) => {
      const result = await handleCancelInvite(inviteId);
      if (result.success) {
        refetch();
      }
      return result;
    },
    [handleCancelInvite, refetch]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] dash-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/10 border-t-purple-500 mx-auto" />
          <p className="mt-4 text-white/60">{t('dashboard.team.loadingTeam')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] dash-bg">
        <div className="text-center dash-card rounded-2xl p-8 border border-white/[0.06] max-w-md">
          <p className="text-red-400 mb-4">{getErrorDisplayMessage(error)}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90"
          >
            {t('dashboard.common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <QuotaWarningBanner metric="teamMembers" />
      <TeamHeader stats={stats} onInvite={() => setShowInviteModal(true)} />
      <TeamStats stats={stats} />
      <TeamFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
      />
      <PendingInvitesList
        invites={pendingInvites.filter((i) => i.status === 'pending')}
        onCancel={(inviteId) => handleCancelInviteConfirm(inviteId)}
      />
      <TeamMembersList
        members={filteredMembers}
        onEditRole={handleEditRole}
        onRemove={handleRemove}
      />

      <InviteMemberModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        onInvite={handleInviteConfirm}
        isInviting={isInviting}
      />

      <EditRoleModal
        open={showEditRoleModal}
        onOpenChange={setShowEditRoleModal}
        member={selectedMember}
        onUpdateRole={handleUpdateRole}
        isUpdating={isUpdatingRole}
      />

      <RemoveMemberModal
        open={showRemoveModal}
        onOpenChange={setShowRemoveModal}
        member={selectedMember}
        onRemove={handleRemoveConfirm}
        isRemoving={isRemoving}
      />
    </div>
  );
}

