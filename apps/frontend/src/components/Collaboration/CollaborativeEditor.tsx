/**
 * ★★★ COMPOSANT - ÉDITEUR COLLABORATIF ★★★
 * Composant pour la collaboration temps réel
 * - Cursors partagés
 * - Commentaires en direct
 * - Présence utilisateurs
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { memo } from 'react';
import {
  realtimeService,
  type SharedCursor,
  type LiveComment,
  type RealtimeConnection,
  type CursorMovedPayload,
  type CommentPayload,
  type UserPresencePayload,
  type CollaborationRoom,
} from '@/lib/realtime/RealtimeService';

/** Participant with optional display fields from room payload */
type RoomParticipant = RealtimeConnection & { name?: string; email?: string; avatar?: string };
import { logger } from '@/lib/logger';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, MessageSquare, Send } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';

// ========================================
// TYPES
// ========================================

interface CollaborativeEditorProps {
  roomId: string;
  resourceType: 'design' | 'product' | 'order';
  resourceId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
}

// ========================================
// COMPONENT
// ========================================

function CollaborativeEditorContent({
  roomId,
  resourceType,
  resourceId,
  userId,
  userName,
  userAvatar,
}: CollaborativeEditorProps) {
  const { t } = useI18n();
  const [cursors, setCursors] = useState<SharedCursor[]>([]);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [participants, setParticipants] = useState<RealtimeConnection[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorColors = useMemo(
    () => [
      '#3B82F6',
      '#10B981',
      '#F59E0B',
      '#EF4444',
      '#8B5CF6',
      '#EC4899',
    ],
    []
  );

  // ========================================
  // EFFECTS
  // ========================================

  useEffect(() => {
    // Connect
    realtimeService
      .connect(userId)
      .then(() => {
        setIsConnected(true);
        realtimeService.joinRoom(roomId, resourceType, resourceId);
      })
      .catch((error) => {
        logger.error('Error connecting to realtime', { error });
      });

    // Event listeners
    const handleCursorMoved = (payload: CursorMovedPayload) => {
      setCursors((prev) => {
        const existing = prev.findIndex((c) => c.id === payload.cursor.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = payload.cursor;
          return updated;
        }
        return [...prev, payload.cursor];
      });
    };

    const handleCommentAdded = (payload: CommentPayload) => {
      if (payload.comment) setComments((prev) => [...prev, payload.comment as LiveComment]);
    };

    const handleCommentUpdated = (payload: CommentPayload) => {
      if (payload.comment)
        setComments((prev) =>
          prev.map((c) => (c.id === payload.commentId ? payload.comment! : c))
        );
    };

    const handleCommentDeleted = (payload: CommentPayload) => {
      if (payload.commentId)
        setComments((prev) => prev.filter((c) => c.id !== payload.commentId));
    };

    const handleUserJoined = (payload: UserPresencePayload) => {
      if (payload.user) setParticipants((prev) => [...prev, payload.user as RoomParticipant]);
    };

    const handleUserLeft = (payload: UserPresencePayload) => {
      if (payload.userId) {
        setParticipants((prev) => prev.filter((p) => p.id !== payload.userId));
        setCursors((prev) => prev.filter((c) => c.userId !== payload.userId));
      }
    };

    const handleRoomJoined = (room: CollaborationRoom) => {
      setCursors(room.cursors || []);
      setComments(room.comments || []);
      setParticipants(room.participants || []);
    };

    realtimeService.on('cursor-moved', handleCursorMoved);
    realtimeService.on('comment-added', handleCommentAdded);
    realtimeService.on('comment-updated', handleCommentUpdated);
    realtimeService.on('comment-deleted', handleCommentDeleted);
    realtimeService.on('user-joined', handleUserJoined);
    realtimeService.on('user-left', handleUserLeft);
    realtimeService.on('room-joined', handleRoomJoined);

    // Cleanup
    return () => {
      realtimeService.off('cursor-moved', handleCursorMoved);
      realtimeService.off('comment-added', handleCommentAdded);
      realtimeService.off('comment-updated', handleCommentUpdated);
      realtimeService.off('comment-deleted', handleCommentDeleted);
      realtimeService.off('user-joined', handleUserJoined);
      realtimeService.off('user-left', handleUserLeft);
      realtimeService.off('room-joined', handleRoomJoined);
      realtimeService.leaveRoom(roomId);
    };
  }, [roomId, resourceType, resourceId, userId]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      realtimeService.updateCursor(roomId, { x, y });
    },
    [roomId]
  );

  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return;

    realtimeService.addComment(roomId, newComment);
    setNewComment('');
  }, [roomId, newComment]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="flex h-full">
      {/* Main Editor Area */}
      <div
        ref={containerRef}
        className="flex-1 relative"
        onMouseMove={handleMouseMove}
      >
        {/* Shared Cursors */}
        {cursors
          .filter((c) => c.userId !== userId)
          .map((cursor) => (
            <div
              key={cursor.id}
              className="absolute pointer-events-none z-50"
              style={{
                left: cursor.position.x,
                top: cursor.position.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: cursor.color }}
              />
              <div
                className="absolute top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs px-2 py-1 rounded bg-gray-900 text-white"
              >
                {cursor.userName}
              </div>
            </div>
          ))}

        {/* Editor Content */}
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">Éditeur Collaboratif</h2>
          <p className="text-gray-600">
            {isConnected
              ? `${participants.length} participant${participants.length > 1 ? 's' : ''} en ligne`
              : 'Connexion...'}
          </p>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-l bg-gray-50 flex flex-col">
        {/* Participants */}
        <Card className="m-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4" />
              <h3 className="font-semibold">Participants</h3>
            </div>
            <div className="space-y-2">
              {participants.map((participant) => {
                const p = participant as RoomParticipant;
                return (
                <div key={participant.id} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={p.avatar} />
                    <AvatarFallback>
                      {p.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{p.name || p.email}</span>
                </div>
              );})}
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card className="m-4 flex-1 flex flex-col">
          <CardContent className="p-4 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4" />
              <h3 className="font-semibold">Commentaires</h3>
            </div>

            <ScrollArea className="flex-1 mb-4">
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comment.avatar} />
                        <AvatarFallback>
                          {comment.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{comment.userName}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 ml-8">{comment.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Add Comment */}
            <div className="flex gap-2">
              <Input
                placeholder={t('common.addComment')}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddComment();
                  }
                }}
              />
              <Button onClick={handleAddComment} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

const CollaborativeEditor = memo(function CollaborativeEditor(
  props: CollaborativeEditorProps
) {
  return (
    <ErrorBoundary>
      <CollaborativeEditorContent {...props} />
    </ErrorBoundary>
  );
});

export default CollaborativeEditor;

