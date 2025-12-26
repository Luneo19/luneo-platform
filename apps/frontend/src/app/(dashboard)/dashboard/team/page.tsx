'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, UserPlus, Shield, Trash2, Edit, X, 
  Crown, Star, Search, Download, CheckCircle, Clock, Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TeamSkeleton } from '@/components/ui/skeletons';
import { logger } from '@/lib/logger';
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

  // Queries
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

  // Transform data
  const members: TeamMember[] = (teamQuery.data?.members || []).map((m) => ({
    id: m.id,
    name: m.name || m.email,
    email: m.email,
    role: m.role.toLowerCase() as any,
    status: 'active' as const,
    avatar: m.avatar || '',
    joinedAt: m.joinedAt.toISOString(),
    lastActive: m.lastActive ? formatRelativeTime(m.lastActive.toISOString()) : 'Jamais',
  }));

  const pendingInvites: PendingInvite[] = (teamQuery.data?.pendingInvites || []).map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role.toLowerCase() as any,
    sentAt: i.invitedAt.toISOString().split('T')[0],
    expiresAt: i.expiresAt.toISOString().split('T')[0],
  }));

  const roles = [
    { value: 'owner', label: 'Propriétaire', icon: <Crown className="w-4 h-4" />, color: 'text-yellow-400' },
    { value: 'admin', label: 'Administrateur', icon: <Shield className="w-4 h-4" />, color: 'text-blue-400' },
    { value: 'member', label: 'Membre', icon: <Users className="w-4 h-4" />, color: 'text-green-400' },
    { value: 'viewer', label: 'Observateur', icon: <Star className="w-4 h-4" />, color: 'text-gray-400' }
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
      role: inviteRole === 'admin' ? 'ADMIN' : inviteRole === 'viewer' ? 'VIEWER' : 'MEMBER' 
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Équipe</h1>
          <p className="text-gray-400">{members.length} membres • {pendingInvites.length} invitation(s) en attente</p>
        </div>
        <Button 
          onClick={() => setShowInviteModal(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Inviter un membre
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total membres', value: members.length, icon: <Users className="w-5 h-5" />, color: 'blue' },
          { label: 'Actifs', value: members.filter(m => m.status === 'active').length, icon: <CheckCircle className="w-5 h-5" />, color: 'green' },
          { label: 'En attente', value: pendingInvites.length, icon: <Clock className="w-5 h-5" />, color: 'yellow' },
          { label: 'Administrateurs', value: members.filter(m => m.role === 'admin' || m.role === 'owner').length, icon: <Shield className="w-5 h-5" />, color: 'purple' }
        ].map((stat, i) => (
          <Card key={i} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-400`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="all">Tous les rôles</option>
          {roles.map(role => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
        <Button variant="outline" className="border-gray-700">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Invitations en attente</h3>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <motion.div
                key={invite.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{invite.email}</p>
                    <p className="text-sm text-gray-400">
                      Rôle: {getRoleInfo(invite.role).label} • Expire le {new Date(invite.expiresAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResendInvite(invite)}
                    className="border-gray-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Renvoyer
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleCancelInvite(invite.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Members List */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="space-y-4">
          {filteredMembers.map((member) => {
            const roleInfo = getRoleInfo(member.role);
            return (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-900/50 rounded-lg gap-4"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-medium">{member.name}</h4>
                      {member.role === 'owner' && (
                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Propriétaire
                        </span>
                      )}
                      {member.status === 'pending' && (
                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded-full">
                          En attente
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{member.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Dernier accès: {member.lastActive} • Membre depuis {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {editingMember === member.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value as any)}
                        className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                      >
                        {roles.filter(r => r.value !== 'owner').map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                      <Button size="sm" variant="outline" onClick={() => setEditingMember(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 ${roleInfo.color}`}>
                        {roleInfo.icon}
                        <span className="text-sm font-medium">{roleInfo.label}</span>
                      </div>
                      {member.role !== 'owner' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingMember(member.id)}
                            className="border-gray-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveMember(member.id, member.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Permissions Card */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Permissions par rôle</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role) => (
            <div key={role.value} className="p-4 bg-gray-900/50 rounded-lg">
              <div className={`flex items-center gap-2 mb-3 ${role.color}`}>
                {role.icon}
                <h4 className="font-medium">{role.label}</h4>
              </div>
              <ul className="space-y-2">
                {permissions[role.value as keyof typeof permissions].map((perm, i) => (
                  <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700"
            >
              <h3 className="text-xl font-bold text-white mb-4">Inviter un membre</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Adresse email
                  </label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-gray-900 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rôle
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
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
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer l'invitation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteModal(false)}
                    className="border-gray-600"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
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
