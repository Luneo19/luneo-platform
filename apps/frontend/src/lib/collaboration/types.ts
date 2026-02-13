/**
 * Collaboration Types
 * C-001 à C-015: Types pour le système de collaboration temps réel
 */

// User presence
export interface UserPresence {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  selection?: string[];
  lastActive: number;
  status: 'online' | 'away' | 'offline';
}

// Room/Session
export interface CollaborationRoom {
  id: string;
  name: string;
  projectId: string;
  designId?: string;
  createdAt: number;
  createdBy: string;
  participants: UserPresence[];
  maxParticipants?: number;
  isPublic: boolean;
  permissions: RoomPermissions;
}

export interface RoomPermissions {
  canEdit: string[]; // user IDs
  canComment: string[];
  canView: string[];
}

// Comments
export interface Comment {
  id: string;
  roomId: string;
  authorId: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  position?: { x: number; y: number }; // For canvas comments
  elementId?: string; // For element-specific comments
  parentId?: string; // For replies
  mentions: string[]; // User IDs mentioned
  reactions: CommentReaction[];
  resolved: boolean;
  resolvedBy?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CommentReaction {
  emoji: string;
  userId: string;
  userName: string;
}

// Activity/Changes
export interface CollaborationActivity {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  action: CollaborationAction;
  target?: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

export type CollaborationAction =
  | 'joined'
  | 'left'
  | 'cursor_move'
  | 'selection_change'
  | 'element_add'
  | 'element_update'
  | 'element_delete'
  | 'comment_add'
  | 'comment_resolve'
  | 'mention'
  | 'approval_request'
  | 'approval_approve'
  | 'approval_reject';

// Approval workflow
export interface ApprovalRequest {
  id: string;
  roomId: string;
  requesterId: string;
  requesterName: string;
  reviewers: ApprovalReviewer[];
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  title: string;
  description?: string;
  designSnapshot?: string;
  createdAt: number;
  updatedAt: number;
  dueDate?: number;
}

export interface ApprovalReviewer {
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comment?: string;
  reviewedAt?: number;
}

// Share link
export interface ShareLink {
  id: string;
  roomId: string;
  token: string;
  permission: 'view' | 'comment' | 'edit';
  expiresAt?: number;
  maxUses?: number;
  uses: number;
  createdBy: string;
  createdAt: number;
}

// Notification
export interface CollaborationNotification {
  id: string;
  userId: string;
  type: 'mention' | 'comment' | 'approval' | 'share' | 'activity';
  title: string;
  message: string;
  roomId?: string;
  commentId?: string;
  approvalId?: string;
  read: boolean;
  createdAt: number;
}

// Sync state
export interface SyncState {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncAt: number | null;
  pendingChanges: number;
  conflictCount: number;
}


