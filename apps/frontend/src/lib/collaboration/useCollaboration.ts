/**
 * useCollaboration Hook
 * C-001 à C-010: Hook pour la collaboration temps réel
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';
import type {
  UserPresence,
  CollaborationRoom,
  Comment,
  CollaborationActivity,
  ApprovalRequest,
  ShareLink,
  SyncState,
} from './types';

interface UseCollaborationOptions {
  roomId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  autoConnect?: boolean;
}

// User colors for presence
const USER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16',
];

export function useCollaboration(options: UseCollaborationOptions) {
  const { roomId, userId, userName, userAvatar, autoConnect = true } = options;

  // State
  const [room, setRoom] = useState<CollaborationRoom | null>(null);
  const [participants, setParticipants] = useState<UserPresence[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<CollaborationActivity[]>([]);
  const [syncState, setSyncState] = useState<SyncState>({
    isConnected: false,
    isSyncing: false,
    lastSyncAt: null,
    pendingChanges: 0,
    conflictCount: 0,
  });

  // Refs
  const cursorUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const lastCursorPosition = useRef<{ x: number; y: number } | null>(null);

  // Get user color
  const userColor = USER_COLORS[userId.charCodeAt(0) % USER_COLORS.length];

  /**
   * Join room
   */
  const joinRoom = useCallback(async (targetRoomId: string) => {
    try {
      const data = await api.post<{ room?: CollaborationRoom; participants?: UserPresence[]; comments?: Comment[] }>(
        `/api/v1/collaboration/rooms/${targetRoomId}/join`,
        { userId, userName, userAvatar, color: userColor }
      );
      setRoom(data?.room ?? null);
      setParticipants(data?.participants ?? []);
      setComments(data?.comments ?? []);
      setSyncState((prev) => ({ ...prev, isConnected: true }));

      // Add activity
      addActivity({
        action: 'joined',
        userId,
        userName,
        roomId: targetRoomId,
      });

      logger.info('Joined collaboration room', { roomId: targetRoomId });
    } catch (error) {
      logger.error('Failed to join room', { error, roomId: targetRoomId });
      setSyncState((prev) => ({ ...prev, isConnected: false }));
    }
  }, [userId, userName, userAvatar, userColor]);

  /**
   * Leave room
   */
  const leaveRoom = useCallback(async () => {
    if (!room) return;

    try {
      await api.post(`/api/v1/collaboration/rooms/${room.id}/leave`, { userId });

      addActivity({
        action: 'left',
        userId,
        userName,
        roomId: room.id,
      });

      setRoom(null);
      setParticipants([]);
      setSyncState((prev) => ({ ...prev, isConnected: false }));
    } catch (error) {
      logger.error('Failed to leave room', { error });
    }
  }, [room, userId, userName]);

  /**
   * Update cursor position
   */
  const updateCursor = useCallback((x: number, y: number) => {
    if (!room) return;

    // Throttle updates
    lastCursorPosition.current = { x, y };

    if (cursorUpdateRef.current) return;

    cursorUpdateRef.current = setTimeout(async () => {
      cursorUpdateRef.current = null;
      const pos = lastCursorPosition.current;
      if (!pos) return;

      try {
        await api.post(`/api/v1/collaboration/rooms/${room.id}/cursor`, { userId, cursor: pos });
      } catch (error) {
        // Silent fail for cursor updates
      }
    }, 50); // 50ms throttle
  }, [room, userId]);

  /**
   * Add comment
   */
  const addComment = useCallback(async (
    content: string,
    options: {
      position?: { x: number; y: number };
      elementId?: string;
      parentId?: string;
      mentions?: string[];
    } = {}
  ): Promise<Comment | null> => {
    if (!room) return null;

    const comment: Comment = {
      id: uuidv4(),
      roomId: room.id,
      authorId: userId,
      author: { name: userName, avatar: userAvatar },
      content,
      position: options.position,
      elementId: options.elementId,
      parentId: options.parentId,
      mentions: options.mentions || [],
      reactions: [],
      resolved: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Optimistic update
    setComments((prev) => [comment, ...prev]);

    try {
      await api.post(`/api/v1/collaboration/rooms/${room.id}/comments`, comment);

      addActivity({
        action: 'comment_add',
        userId,
        userName,
        roomId: room.id,
        target: comment.id,
      });

      // Notify mentions
      if (options.mentions?.length) {
        addActivity({
          action: 'mention',
          userId,
          userName,
          roomId: room.id,
          details: { mentionedUsers: options.mentions },
        });
      }

      return comment;
    } catch (error) {
      // Rollback
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      logger.error('Failed to add comment', { error });
      return null;
    }
  }, [room, userId, userName, userAvatar]);

  /**
   * Resolve comment
   */
  const resolveComment = useCallback(async (commentId: string) => {
    if (!room) return;

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, resolved: true, resolvedBy: userId } : c
      )
    );

    try {
      await api.post(`/api/v1/collaboration/rooms/${room.id}/comments/${commentId}/resolve`, { userId });

      addActivity({
        action: 'comment_resolve',
        userId,
        userName,
        roomId: room.id,
        target: commentId,
      });
    } catch (error) {
      // Rollback
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, resolved: false, resolvedBy: undefined } : c
        )
      );
      logger.error('Failed to resolve comment', { error });
    }
  }, [room, userId, userName]);

  /**
   * Add reaction to comment
   */
  const addReaction = useCallback(async (commentId: string, emoji: string) => {
    if (!room) return;

    const reaction = { emoji, userId, userName };

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, reactions: [...c.reactions, reaction] }
          : c
      )
    );

    try {
      await api.post(`/api/v1/collaboration/rooms/${room.id}/comments/${commentId}/reactions`, reaction);
    } catch (error) {
      // Rollback
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, reactions: c.reactions.filter((r) => !(r.emoji === emoji && r.userId === userId)) }
            : c
        )
      );
    }
  }, [room, userId, userName]);

  /**
   * Create share link
   */
  const createShareLink = useCallback(async (
    permission: 'view' | 'comment' | 'edit',
    options: { expiresIn?: number; maxUses?: number } = {}
  ): Promise<ShareLink | null> => {
    if (!room) return null;

    try {
      return await api.post<ShareLink>(`/api/v1/collaboration/rooms/${room.id}/share`, {
        permission,
        expiresIn: options.expiresIn,
        maxUses: options.maxUses,
        createdBy: userId,
      });
    } catch (error) {
      logger.error('Failed to create share link', { error });
      return null;
    }
  }, [room, userId]);

  /**
   * Request approval
   */
  const requestApproval = useCallback(async (
    reviewerIds: string[],
    title: string,
    description?: string
  ): Promise<ApprovalRequest | null> => {
    if (!room) return null;

    try {
      const result = await api.post<ApprovalRequest>(`/api/v1/collaboration/rooms/${room.id}/approvals`, {
        requesterId: userId,
        requesterName: userName,
        reviewerIds,
        title,
        description,
      });

      addActivity({
        action: 'approval_request',
        userId,
        userName,
        roomId: room.id,
        details: { reviewerIds, title },
      });

      return result;
    } catch (error) {
      logger.error('Failed to request approval', { error });
      return null;
    }
  }, [room, userId, userName]);

  // Helper to add activity
  const addActivity = useCallback((activity: Omit<CollaborationActivity, 'id' | 'timestamp'>) => {
    const fullActivity: CollaborationActivity = {
      ...activity,
      id: uuidv4(),
      timestamp: Date.now(),
    };
    setActivities((prev) => [fullActivity, ...prev].slice(0, 100));
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && roomId) {
      joinRoom(roomId);
    }

    return () => {
      if (room) {
        leaveRoom();
      }
    };
  }, [autoConnect, roomId]); // eslint-disable-line

  return {
    // State
    room,
    participants,
    comments,
    activities,
    syncState,
    userColor,

    // Actions
    joinRoom,
    leaveRoom,
    updateCursor,
    addComment,
    resolveComment,
    addReaction,
    createShareLink,
    requestApproval,
  };
}

export default useCollaboration;


