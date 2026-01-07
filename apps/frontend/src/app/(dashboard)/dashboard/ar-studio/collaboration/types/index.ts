/**
 * Types pour AR Studio Collaboration
 */

export type CollaborationRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type CollaborationStatus = 'active' | 'pending' | 'archived';

export interface CollaborationMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: CollaborationRole;
  status: CollaborationStatus;
  joinedAt: Date;
  lastActive?: Date;
}

export interface CollaborationProject {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  members: CollaborationMember[];
  modelCount: number;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
}

export interface CollaborationComment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  replies?: CollaborationComment[];
}

export interface CollaborationActivity {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  target?: string;
  createdAt: Date;
}


