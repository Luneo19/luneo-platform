'use client';

import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users, UserPlus, Shield, Trash2, Edit, X,
  Crown, Star, Search, Download, CheckCircle, Clock, Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TeamSkeleton } from '@/components/ui/skeletons';
import { formatRelativeTime } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { trpc } from '@/lib/trpc/client';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'suspended';
  avatar: string;
  joinedAt: string;
  lastActive: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  sentAt: string;
  expiresAt: string;
}

function TeamPageContent() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [editingMember, setEditingMember] = useState<string | null>(null);

  const teamQuery = trpc.team.listMembers.useQuery();
  const inviteMutation = trpc.team.inviteMember.useMutation({
    onSuccess: () => {
      teamQuery.refetch();
      setShowInviteModal(false);
      setInviteEmail('');
      toast({ title: 'Succès', description: 'Invitation envoyée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
  const updateRoleMutation = trpc.team.updateMemberRole.useMutation({
    onSuccess: () => {
      teamQuery.refetch();
      setEditingMember(null);
      toast({ title: 'Succès', description: 'Rôle mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
  const removeMemberMutation = trpc.team.removeMember.useMutation({
    onSuccess: () => {
      teamQuery.refetch();
      toast({ title: 'Succès', description: 'Membre supprimé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
  const cancelInviteMutation = trpc.team.cancelInvite.useMutation({
    onSuccess: () => {
      teamQuery.refetch();
      toast({ title: 'Succès', description: 'Invitation annulée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';
  const members: TeamMember[] = (teamQuery.data?.members || []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: (m.name as string) || (m.email as string),
    email: m.email as string,
    role: (m.role as string).toLowerCase() as MemberRole,
    status: 'active' as const,
    avatar: (m.avatar as string) || '',
    joinedAt: (m.joinedAt as Date).toISOString(),
    lastActive: m.lastActive ? formatRelativeTime((m.lastActive as Date).toISOString()) : 'Jamais',
  }));

  const pendingInvites: PendingInvite[] = (teamQuery.data?.pendingInvites || []).map((i: Record<string, unknown>) => ({
    id: i.id as string,
    email: i.email as string,
    role: (i.role as string).toLowerCase() as MemberRole,
    sentAt: (i.invitedAt as Date).toISOString().split('T')[0],
    expiresAt: (i.expiresAt as Date).toISOString().split('T')[0],
  }));

  const roles = [
    { value: 'owner', label: 'Propriétaire', icon: <Crown className="w-4 h-4" />, color: 'text-[#fbbf24]', badge: 'dash-badge-enterprise' },
    { value: 'admin', label: 'Administrateur', icon: <Shield className="w-4 h-4" />, color: 'text-purple-400', badge: 'dash-badge-pro' },
    { value: 'member', label: 'Membre', icon: <Users className="w-4 h-4" />, color: 'text-[#4ade80]', badge: 'dash-badge-new' },
    { value: 'viewer', label: 'Observateur', icon: <Star className="w-4 h-4" />, color: 'text-white/60', badge: '' }
  ];

  const permissions = {
    owner: ['Tous les droits', 'Gérer la facturation', 'Supprimer l\'équipe'],
    admin: ['Inviter membres', 'Gérer projets', 'Modifier paramètres'],
    member: ['Créer designs', 'Modifier projets', 'Voir analytics'],
    viewer: ['Voir projets', 'Commenter', 'Exporter designs']
  };

  const handleInvite = useCallback(() => {
    if (!inviteEmail) {
      toast({ title: "Erreur", description: "Veuillez entrer une adresse email", variant: "destructive" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast({ title: "Erreur", description: "Adresse email invalide", variant: "destructive" });
      return;
    }

    inviteMutation.mutate({
      email: inviteEmail,
      role: inviteRole === 'ADMIN' ? 'ADMIN' : inviteRole === 'VIEWER' ? 'VIEWER' : inviteRole === 'OWNER' ? 'OWNER' : 'MEMBER'
    });
  }, [inviteEmail, inviteRole, inviteMutation, toast]);

  const handleChangeRole = useCallback((memberId: string, newRole: 'admin' | 'member' | 'viewer') => {
    const roleMap: Record<string, 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'> = {
      owner: 'OWNER',
      admin: 'ADMIN',
      member: 'MEMBER',
      viewer: 'VIEWER',
    };
    updateRoleMutation.mutate({ memberId, role: roleMap[newRole] || 'MEMBER' });
  }, [updateRoleMutation]);

  const handleRemoveMember = useCallback((memberId: string, memberName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${memberName} de l'équipe ?`)) {
      return;
    }
    removeMemberMutation.mutate({ memberId });
  }, [removeMemberMutation]);

  const handleCancelInvite = useCallback((inviteId: string) => {
    cancelInviteMutation.mutate({ inviteId });
  }, [cancelInviteMutation]);

  const handleResendInvite = useCallback((invite: PendingInvite) => {
    const roleMap: Record<string, 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'> = {
      owner: 'OWNER',
      admin: 'ADMIN',
      member: 'MEMBER',
      viewer: 'VIEWER',
    };
    inviteMutation.mutate({
      email: invite.email,
      role: roleMap[invite.role] || 'MEMBER'
    });
  }, [inviteMutation]);

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleInfo = (role: string) => {
    return roles.find(r => r.value === role) || roles[2];
  };

  if (teamQuery.isLoading) {
    return <TeamSkeleton />;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Équipe</h1>
          <p className="text-white/60">{members.length} membres • {pendingInvites.length} invitation(s) en attente</p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Inviter un membre
        </Button>
      </div>

      {/* Stats - glass cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total membres', value: members.length, icon: <Users className="w-5 h-5" />, bg: 'bg-purple-500/10 text-purple-400' },
          { label: 'Actifs', value: members.filter(m => m.status === 'active').length, icon: <CheckCircle className="w-5 h-5" />, bg: 'bg-[#4ade80]/10 text-[#4ade80]' },
          { label: 'En attente', value: pendingInvites.length, icon: <Clock className="w-5 h-5" />, bg: 'bg-[#fbbf24]/10 text-[#fbbf24]' },
          { label: 'Administrateurs', value: members.filter(m => m.role === 'admin' || m.role === 'owner').length, icon: <Shield className="w-5 h-5" />, bg: 'bg-pink-500/10 text-pink-400' }
        ].map((stat, i) => (
          <Card key={i} className="dash-card p-4 border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dash-input pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="dash-input px-4 py-2"
        >
          <option value="all">Tous les rôles</option>
          {roles.map(role => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
        <Button variant="outline" className="border-white/[0.12] text-white/80 hover:bg-white/[0.04]">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>

      {pendingInvites.length > 0 && (
        <Card className="dash-card p-6 border-white/[0.06]">
          <h3 className="text-lg font-bold text-white mb-4">Invitations en attente</h3>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <motion
                key={invite.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-white/[0.04] rounded-xl border border-white/[0.06]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#fbbf24]/10 flex items-center justify-center border border-[#fbbf24]/20">
                    <Clock className="w-5 h-5 text-[#fbbf24]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{invite.email}</p>
                    <p className="text-sm text-white/60">
                      Rôle: {getRoleInfo(invite.role).label} • Expire le {new Date(invite.expiresAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResendInvite(invite)}
                    className="border-white/[0.12] text-white/80 hover:bg-white/[0.04]"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Renvoyer
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleCancelInvite(invite.id)}
                    className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion>
            ))}
          </div>
        </Card>
      )}

      <Card className="dash-card p-6 border-white/[0.06]">
        <div className="space-y-4">
          {filteredMembers.map((member) => {
            const roleInfo = getRoleInfo(member.role);
            return (
              <motion
                key={member.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/[0.04] rounded-xl border border-white/[0.06] gap-4"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-white font-medium">{member.name}</h4>
                      {member.role === 'owner' && (
                        <span className="dash-badge dash-badge-enterprise flex items-center gap-1 w-fit">
                          <Crown className="w-3 h-3" />
                          Propriétaire
                        </span>
                      )}
                      {member.status === 'pending' && (
                        <span className="dash-badge dash-badge-new">En attente</span>
                      )}
                    </div>
                    <p className="text-sm text-white/60">{member.email}</p>
                    <p className="text-xs text-white/40 mt-1">
                      Dernier accès: {member.lastActive} • Membre depuis {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {editingMember === member.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value as 'admin' | 'member' | 'viewer')}
                        className="dash-input px-3 py-1.5 text-sm"
                      >
                        {roles.filter(r => r.value !== 'owner').map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                      <Button size="sm" variant="outline" onClick={() => setEditingMember(null)} className="border-white/[0.12] text-white/80">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.06] ${roleInfo.color}`}>
                        {roleInfo.icon}
                        <span className="text-sm font-medium">{roleInfo.label}</span>
                      </div>
                      {member.role !== 'owner' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingMember(member.id)}
                            className="border-white/[0.12] text-white/80 hover:bg-white/[0.04]"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveMember(member.id, member.name)}
                            className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion>
            );
          })}
        </div>
      </Card>

      <Card className="dash-card p-6 border-white/[0.06]">
        <h3 className="text-lg font-bold text-white mb-4">Permissions par rôle</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role) => (
            <div key={role.value} className="p-4 bg-white/[0.04] rounded-xl border border-white/[0.06]">
              <div className={`flex items-center gap-2 mb-3 ${role.color}`}>
                {role.icon}
                <h4 className="font-medium">{role.label}</h4>
              </div>
              <ul className="space-y-2">
                {permissions[role.value as keyof typeof permissions].map((perm, i) => (
                  <li key={i} className="text-sm text-white/60 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-[#4ade80] flex-shrink-0" />
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <AnimatePresence>
        {showInviteModal && (
          <motion
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="dash-card p-6 max-w-md w-full border border-white/[0.06]"
            >
              <h3 className="text-xl font-bold text-white mb-4">Inviter un membre</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Adresse email
                  </label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="dash-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Rôle
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole((e.target.value?.toUpperCase() ?? 'MEMBER') as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER')}
                    className="dash-input w-full px-3 py-2"
                  >
                    {roles.filter(r => r.value !== 'owner').map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleInvite}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer l'invitation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteModal(false)}
                    className="border-white/[0.12] text-white/80 hover:bg-white/[0.04]"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </motion>
          </motion>
        )}
      </AnimatePresence>
    </div>
  );
}

const MemoizedTeamPageContent = memo(TeamPageContent);

export default function TeamPage() {
  return (
    <ErrorBoundary level="page" componentName="TeamPage">
      <MemoizedTeamPageContent />
    </ErrorBoundary>
  );
}
