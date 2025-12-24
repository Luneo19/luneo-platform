/**
 * Collaboration Module
 * Export centralisé du module de collaboration
 */

export { useCollaboration, default as useCollaborationDefault } from './useCollaboration';

export type {
  UserPresence,
  CollaborationRoom,
  RoomPermissions,
  Comment,
  CommentReaction,
  CollaborationActivity,
  CollaborationAction,
  ApprovalRequest,
  ApprovalReviewer,
  ShareLink,
  CollaborationNotification,
  SyncState,
} from './types';

// Liveblocks integration (only export types to avoid runtime errors if Liveblocks not installed)
export type {
  Presence as LiveblocksPresence,
  Storage as LiveblocksStorage,
  UserMeta,
  RoomEvent,
} from './liveblocks';

export { generateUserColor } from './liveblocks';
