/**
 * Types pour la page Team
 */

export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TeamMemberStatus = 'active' | 'pending' | 'suspended' | 'inactive';
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  avatar?: string;
  joinedAt: Date;
  lastActive?: Date;
  permissions?: string[];
  metadata?: Record<string, unknown>;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: TeamRole;
  invitedBy?: string;
  invitedAt: Date;
  expiresAt: Date;
  status: InviteStatus;
}

export interface TeamStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  invites: number;
  byRole: {
    OWNER: number;
    ADMIN: number;
    MEMBER: number;
    VIEWER: number;
  };
}


